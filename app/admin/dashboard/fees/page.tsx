"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, CreditCard, Receipt, 
  CheckCircle2, History, Banknote, Landmark, 
  Smartphone, Printer, ArrowLeft, Loader2, Filter, FileSpreadsheet
} from "lucide-react";
import { supabase } from "@/supabase";

const feeTypes = ["Tuition Fee", "Admission Fee", "Computer Fee", "Transport Fee", "Annual Charges", "Exam Fee"];
const academicMonths = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
const paymentModes = ["Cash", "UPI / Online", "Bank Transfer", "Cheque"];

const STANDARD_ANNUAL_FEE = 15000; 

export default function FeeCollectionSystem() {
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  
  // Ledger States
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [transactionMonthFilter, setTransactionMonthFilter] = useState("All");
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  
  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    feeType: "Tuition Fee",
    feeMonth: academicMonths[new Date().getMonth()] || "April", 
    paymentMode: "Cash"
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('students').select('*').eq('status', 'Active').order('first_name');
    if (data) setStudents(data);
    setIsLoading(false);
  };

  const selectStudent = async (student: any) => {
    setSelectedStudent(student);
    setReceiptData(null);
    setTransactions([]);
    setTotalPaid(0);
    setTransactionMonthFilter("All");
    
    const { data } = await supabase
      .from('fee_transactions')
      .select('*')
      .eq('student_id', student.id)
      .order('payment_date', { ascending: false });
      
    if (data) {
      setTransactions(data);
      const calculatedTotal = data.reduce((sum, txn) => sum + Number(txn.amount), 0);
      setTotalPaid(calculatedTotal);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !paymentForm.amount) return;
    setIsProcessing(true);

    const receiptNo = `REC-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
    const amountNum = parseFloat(paymentForm.amount);

    const newTransaction = {
      student_id: selectedStudent.id,
      receipt_no: receiptNo,
      amount: amountNum,
      fee_type: paymentForm.feeType,
      fee_month: paymentForm.feeMonth,
      payment_mode: paymentForm.paymentMode,
      collected_by: "Admin"
    };

    const { data: insertedData, error } = await supabase.from('fee_transactions').insert([newTransaction]).select().single();
    
    if (!error && insertedData) {
      setTransactions([insertedData, ...transactions]);
      setTotalPaid(prev => prev + amountNum);
      
      // Map to exact column names from the 'students' table for the receipt
      setReceiptData({
        ...insertedData,
        studentName: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
        parentName: selectedStudent.father_name, 
        className: selectedStudent.current_class, 
        section: selectedStudent.current_section, 
        rollNo: selectedStudent.roll_number 
      });
      
      setPaymentForm({ ...paymentForm, amount: "" });
    } else {
      console.error(error);
      alert("Payment failed. Please check the database connection and try again.");
    }
    setIsProcessing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- UPDATED EXPORT TO EXCEL ---
  const exportToExcel = () => {
    if (!selectedStudent) return;
    
    const csvRows = [];
    
    // 1. Add Student Info Header inside the Excel File
    csvRows.push(`Student Name:,${selectedStudent.first_name} ${selectedStudent.last_name}`);
    csvRows.push(`Class & Section:,${selectedStudent.current_class} - ${selectedStudent.current_section}`);
    csvRows.push(`Roll Number:,${selectedStudent.roll_number || 'N/A'}`);
    csvRows.push(`Student ID:,${selectedStudent.id}`);
    csvRows.push(""); // Empty line for spacing

    // 2. Add Transaction Headers
    const headers = ["Receipt No", "Date", "Description", "Month", "Payment Mode", "Amount Collected (INR)"];
    csvRows.push(headers.join(","));

    // 3. Add Transaction Data
    filteredTransactions.forEach(txn => {
      const row = [
        txn.receipt_no,
        new Date(txn.payment_date).toLocaleDateString(),
        txn.fee_type,
        txn.fee_month,
        txn.payment_mode,
        txn.amount
      ];
      csvRows.push(row.join(","));
    });

    // Generate CSV File
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // 4. Format the Filename to include Student's Full Name (e.g. Aarav_Sharma_Fee_Report_All.csv)
    const safeName = `${selectedStudent.first_name}_${selectedStudent.last_name}`.replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `${safeName}_Fee_Report_${transactionMonthFilter}.csv`;
    
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name} ${s.roll_number || ''} ${s.id} ${s.admission_number}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactionMonthFilter === "All" 
    ? transactions 
    : transactions.filter(t => t.fee_month === transactionMonthFilter);

  const paidTuitionMonths = transactions.filter(t => t.fee_type === "Tuition Fee").map(t => t.fee_month);
  const remainingMonths = academicMonths.filter(m => !paidTuitionMonths.includes(m));
  const hasPaidAdmission = transactions.some(t => t.fee_type === "Admission Fee");
  const hasPaidExam = transactions.some(t => t.fee_type === "Exam Fee");

  return (
    <>
      {/* ========================================================= */}
      {/* GLOBAL PRINT OVERRIDE (Hides Layout.tsx elements) */}
      {/* ========================================================= */}
      {receiptData && (
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            #official-receipt, #official-receipt * { visibility: visible; }
            #official-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
              margin: 0;
              background: white;
            }
          }
        `}} />
      )}

      {/* ========================================================= */}
      {/* PRINT-ONLY RECEIPT VIEW */}
      {/* ========================================================= */}
      {receiptData && (
        <div id="official-receipt" className="hidden print:block w-full max-w-4xl mx-auto bg-white p-8 relative text-slate-800 font-sans">
          
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
            <img src="/logo.png" alt="Watermark" className="w-[500px] h-[500px] object-contain grayscale" />
          </div>

          <div className="relative z-10 w-full max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-8">
              <div className="flex items-center gap-6">
                <img src="/logo.png" alt="School Logo" className="w-24 h-24 object-contain" />
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Integrity S & E School</h1>
                  <p className="font-bold text-slate-700 mt-1">Near Panchayat Bhawan, Jashpur Nagar, Chhattisgarh</p>
                  <p className="text-sm font-medium text-slate-500 mt-1">Phone: +91 98765 43210 | Email: admin@integrity.edu</p>
                </div>
              </div>
              <div className="text-right">
                <div className="border-4 border-slate-900 text-slate-900 px-6 py-2 rounded-lg inline-block mb-3">
                  <h2 className="text-2xl font-black tracking-widest uppercase">Fee Receipt</h2>
                </div>
                <p className="font-bold text-slate-700 text-sm">Receipt No: <span className="font-mono text-slate-900 text-base">{receiptData.receipt_no}</span></p>
                <p className="font-bold text-slate-700 text-sm mt-1">Date: <span className="text-slate-900">{new Date(receiptData.payment_date).toLocaleDateString('en-IN')}</span></p>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Student Information</p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1.5 font-bold text-slate-500 w-1/3">Student Name:</td>
                      <td className="py-1.5 font-black text-lg text-slate-900 uppercase">{receiptData.studentName}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold text-slate-500">Father's Name:</td>
                      <td className="py-1.5 font-black text-slate-800">{receiptData.parentName || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold text-slate-500">Class & Section:</td>
                      <td className="py-1.5 font-black text-slate-800">{receiptData.className} {receiptData.section ? `(${receiptData.section})` : ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-center">
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Transaction Details</p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1.5 font-bold text-slate-500 w-1/3">Payment Mode:</td>
                      <td className="py-1.5 font-black text-slate-800">{receiptData.payment_mode}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold text-slate-500">Fee Month:</td>
                      <td className="py-1.5 font-black text-slate-800">{receiptData.fee_month}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold text-slate-500">Collected By:</td>
                      <td className="py-1.5 font-black text-slate-800">{receiptData.collected_by}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Itemized Table */}
            <table className="w-full mb-10 border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-left">
                  <th className="py-4 px-6 font-black uppercase tracking-widest text-xs rounded-tl-lg">S.No.</th>
                  <th className="py-4 px-6 font-black uppercase tracking-widest text-xs">Fee Description</th>
                  <th className="py-4 px-6 font-black uppercase tracking-widest text-xs text-right rounded-tr-lg">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b-2 border-slate-200">
                  <td className="py-6 px-6 font-bold text-slate-700">1</td>
                  <td className="py-6 px-6 font-bold text-slate-900 text-lg">{receiptData.fee_type} <span className="text-sm text-slate-500 font-medium ml-2">({receiptData.fee_month})</span></td>
                  <td className="py-6 px-6 text-right font-black text-slate-900 text-lg">₹ {Number(receiptData.amount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals & Signatures */}
            <div className="flex justify-between items-end mt-12">
              <div className="w-1/2">
                <p className="text-sm font-bold text-slate-500 mb-2">Terms & Conditions:</p>
                <p className="text-xs font-medium text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 leading-relaxed">
                   Fees once paid are non-refundable. This receipt is valid subject to the realization of the payment. Keep this receipt safe for future reference.
                </p>
              </div>
              
              <div className="w-1/3">
                <div className="bg-slate-100 p-5 rounded-xl border-2 border-slate-300 mb-16 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-600 uppercase tracking-widest text-xs">Total Amount</span>
                    <span className="font-black text-3xl text-slate-900">₹ {Number(receiptData.amount).toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-b-2 border-slate-800 w-full mb-2"></div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-600">Authorized Signatory & Stamp</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-16 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">This is a computer-generated document and does not require a physical signature for digital records.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SCREEN UI (Hidden completely during print) */}
      {/* ========================================================= */}
      <div className="print:hidden p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-6 min-h-screen bg-slate-50/50 min-w-0">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm shrink-0 w-full min-w-0">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
            <Banknote className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight truncate">Fee Collection Center</h1>
            <p className="text-slate-500 font-medium mt-1 text-sm truncate">Select a student to process payments and view detailed ledgers.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full min-w-0">
          
          {/* ================= LEFT PANE: STUDENT DIRECTORY ================= */}
          <div className={`lg:col-span-4 flex flex-col gap-6 w-full min-w-0 ${selectedStudent ? 'hidden lg:flex' : 'flex'}`}>
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[calc(100vh-200px)] w-full">
              
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0 w-full">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Search Name or ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-bold text-slate-700 shadow-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 w-full">
                {isLoading ? (
                  <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin"/></div>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div 
                      key={student.id} 
                      onClick={() => selectStudent(student)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 w-full min-w-0 ${
                        selectedStudent?.id === student.id 
                        ? 'bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-100' 
                        : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-black shrink-0 uppercase shadow-sm">
                        {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-800 truncate">{student.first_name} {student.last_name}</h4>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate">{student.current_class} • ID: {student.id}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-10 text-slate-400 font-bold">No students found.</div>
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT PANE: PAYMENT DASHBOARD ================= */}
          <div className={`lg:col-span-8 flex flex-col gap-6 w-full min-w-0 ${!selectedStudent ? 'hidden lg:flex' : 'flex'}`}>
            
            {!selectedStudent ? (
               <div className="bg-white rounded-[2rem] border border-slate-200 border-dashed h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center p-10 shadow-sm w-full">
                 <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6 shadow-sm"><Receipt className="w-10 h-10"/></div>
                 <h2 className="text-2xl font-black text-slate-400 mb-2">No Student Selected</h2>
                 <p className="text-slate-400 font-medium">Search and select a student from the directory to view their ledger.</p>
               </div>
            ) : (
              <>
                <button onClick={() => setSelectedStudent(null)} className="lg:hidden flex items-center gap-2 text-slate-500 font-bold bg-white px-4 py-2 rounded-xl w-max border shadow-sm"><ArrowLeft size={16}/> Back to Directory</button>

                {/* ADVANCED LEDGER & COLLECTION ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  
                  {/* Detailed Student Ledger Card */}
                  <div className="bg-emerald-600 rounded-[2rem] p-6 text-white shadow-lg shadow-emerald-600/20 relative overflow-hidden flex flex-col w-full min-w-0">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-bl-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 w-full min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-1 truncate">Student Ledger • {selectedStudent.id}</p>
                      <h2 className="text-2xl font-black mb-4 truncate">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                          <p className="text-[10px] uppercase tracking-widest text-emerald-200 font-bold mb-1 truncate">Total Due (Year)</p>
                          <p className="font-black text-2xl truncate">₹ {STANDARD_ANNUAL_FEE.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                          <p className="text-[10px] uppercase tracking-widest text-emerald-200 font-bold mb-1 truncate">Total Paid</p>
                          <p className="font-black text-2xl truncate">₹ {totalPaid.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 mt-auto w-full min-w-0">
                      <div className="bg-emerald-700/50 rounded-xl p-4 border border-emerald-500/50 mb-4 w-full">
                        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-200 mb-3 border-b border-emerald-500/50 pb-2">Fee Status Summary</h4>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${hasPaidAdmission ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                            {hasPaidAdmission ? '✓ Admission Paid' : 'Pending Admission Fee'}
                          </span>
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${hasPaidExam ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                            {hasPaidExam ? '✓ Exam Fee Paid' : 'Pending Exam Fee'}
                          </span>
                        </div>

                        <div className="text-sm">
                          <p className="font-bold text-emerald-100 mb-1 truncate"><span className="text-emerald-300">Paid Months:</span> {paidTuitionMonths.length > 0 ? paidTuitionMonths.join(", ") : "None"}</p>
                          <p className="font-bold text-emerald-100 truncate"><span className="text-rose-300">Due Months:</span> {remainingMonths.length > 0 ? remainingMonths.join(", ") : "All Clear!"}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-emerald-500/50 pt-4 w-full min-w-0">
                        <p className="text-sm font-bold text-emerald-100 truncate">Remaining Balance</p>
                        <p className="text-2xl font-black bg-white text-emerald-700 px-4 py-1.5 rounded-xl shadow-inner shrink-0 ml-2">
                          ₹ {(STANDARD_ANNUAL_FEE - totalPaid).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Collection Form */}
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 relative w-full min-w-0">
                    <AnimatePresence>
                    {receiptData && (
                      <motion.div key="success-overlay" initial={{ opacity: 0}} animate={{ opacity: 1}} exit={{opacity: 0}} className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center rounded-[2rem] w-full">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8"/></div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2 truncate w-full">Payment Successful!</h3>
                        <p className="text-slate-500 font-medium mb-6 truncate w-full">Receipt {receiptData.receipt_no} generated.</p>
                        <div className="flex flex-col gap-3 w-full">
                          <button onClick={handlePrint} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 truncate"><Printer className="w-5 h-5 shrink-0"/> Print Official Receipt</button>
                          <button onClick={() => setReceiptData(null)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-3 rounded-xl truncate">Process Another Payment</button>
                        </div>
                      </motion.div>
                    )}
                    </AnimatePresence>

                    <h2 className="font-black text-slate-800 text-lg flex items-center gap-2 mb-6 truncate"><CreditCard className="w-5 h-5 text-emerald-500 shrink-0"/> Process Payment</h2>
                    
                    <form onSubmit={handlePayment} className="space-y-4 w-full">
                      <div className="w-full">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Amount to Collect (₹)</label>
                        <div className="relative w-full">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</span>
                          <input required type="number" min="1" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-black text-lg" placeholder="0.00" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <div className="w-full min-w-0">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Fee Category</label>
                          <select value={paymentForm.feeType} onChange={e => setPaymentForm({...paymentForm, feeType: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:border-emerald-500 font-bold text-sm appearance-none cursor-pointer">
                            {feeTypes.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div className="w-full min-w-0">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Target Month</label>
                          <select value={paymentForm.feeMonth} onChange={e => setPaymentForm({...paymentForm, feeMonth: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:border-emerald-500 font-bold text-sm appearance-none cursor-pointer">
                            {academicMonths.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="w-full">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Payment Mode</label>
                        <div className="grid grid-cols-2 gap-2 w-full">
                          {paymentModes.map(mode => (
                            <button 
                              key={mode} type="button" onClick={() => setPaymentForm({...paymentForm, paymentMode: mode})}
                              className={`py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border transition-all truncate ${paymentForm.paymentMode === mode ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                              {mode === "Cash" ? <Banknote className="w-3.5 h-3.5 shrink-0"/> : mode.includes("UPI") ? <Smartphone className="w-3.5 h-3.5 shrink-0"/> : <Landmark className="w-3.5 h-3.5 shrink-0"/>}
                              <span className="truncate">{mode}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button type="submit" disabled={isProcessing} className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-black py-4 rounded-xl shadow-lg mt-2 flex justify-center items-center gap-2 truncate">
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin shrink-0"/> : "Confirm Collection"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Filterable Transaction History Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px] w-full min-w-0">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 w-full">
                    <h3 className="font-black text-slate-800 flex items-center gap-2 truncate"><History className="w-5 h-5 text-blue-500 shrink-0"/> Transaction Logs</h3>
                    
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        <select 
                          value={transactionMonthFilter} 
                          onChange={(e) => setTransactionMonthFilter(e.target.value)}
                          className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 appearance-none shadow-sm cursor-pointer"
                        >
                          <option value="All">All Months</option>
                          {academicMonths.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      
                      <button 
                        onClick={exportToExcel}
                        className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
                      >
                        <FileSpreadsheet className="w-4 h-4 shrink-0"/> Export CSV
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto flex-1 custom-scrollbar w-full">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                      <thead className="bg-white border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-4">Receipt No.</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Description</th>
                          <th className="px-6 py-4">Mode</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((txn, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4 font-mono font-bold text-slate-600">{txn.receipt_no}</td>
                              <td className="px-6 py-4 font-bold text-slate-500">{new Date(txn.payment_date).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-bold text-slate-700">{txn.fee_type} <span className="text-slate-400 font-medium">({txn.fee_month})</span></td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${txn.payment_mode === 'Cash' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {txn.payment_mode}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-black text-emerald-600 text-base">₹{Number(txn.amount).toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={5} className="px-6 py-10 text-center font-bold text-slate-400">No transactions found for the selected criteria.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}