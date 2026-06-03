// Path: app/admin/dashboard/funds/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, IndianRupee, Plus, Receipt, FileText, 
  CheckCircle2, AlertCircle, Clock, Upload, Camera, 
  X, Send, Check, ShieldCheck, UserCheck, FileSignature,
  ArrowDownRight, TrendingUp
} from "lucide-react";

// --- MOCK DATA FOR PROTOTYPE ---
const initialTickets = [
  { id: "REQ-001", title: "Chemistry Lab Chemicals", reason: "Restocking acids and bases for Term 1 practicals.", requestedAmount: 4500, status: "Pending Approval", date: "16 May 2026", actualAmount: null, coSigner: null },
  { id: "REQ-002", title: "Printer Ink & A4 Paper", reason: "Admin office printer is completely out of black ink.", requestedAmount: 1200, status: "Awaiting Bill", date: "15 May 2026", actualAmount: null, coSigner: null },
  { id: "REQ-003", title: "Staff Room Whiteboard", reason: "Replacement for the broken whiteboard in the main staff room.", requestedAmount: 2500, status: "Completed", date: "10 May 2026", actualAmount: 2450, coSigner: "Sneha Desai (HOD)" },
];

const yearlyFinances = {
  allocatedBudget: 500000,
  totalSpent: 345200, // This would normally be calculated dynamically from all completed tickets in the DB
  recentTransactions: [
    { id: "TX-1", desc: "Library Books Restock", amount: 12500, date: "12 May" },
    { id: "TX-2", desc: "Chemistry Lab Acids", amount: 4800, date: "08 May" },
    { id: "TX-3", desc: "Printer Maintenance", amount: 2100, date: "02 May" },
  ]
};

export default function FundManager() {
  // Wallet State
  const [walletBalance, setWalletBalance] = useState(10000);
  const [tickets, setTickets] = useState(initialTickets);
  
  // Modals State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  // Form States
  const [requestForm, setRequestForm] = useState({ title: "", reason: "", amount: "" });
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [billForm, setBillForm] = useState({ actualAmount: "", coSigner: "", billPhoto: null, productPhoto: null });

  // --- ACTIONS ---

  const handleRequestFunds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.title || !requestForm.amount) return;
    
    const newTicket = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      title: requestForm.title,
      reason: requestForm.reason,
      requestedAmount: Number(requestForm.amount),
      status: "Pending Approval",
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      actualAmount: null,
      coSigner: null
    };

    setTickets([newTicket, ...tickets]);
    setRequestForm({ title: "", reason: "", amount: "" });
    setIsRequestModalOpen(false);
  };

  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeAmount) return;
    setWalletBalance(prev => prev + Number(rechargeAmount));
    setRechargeAmount("");
    setIsRechargeModalOpen(false);
  };

  const handleSimulateAdminApproval = (id: string) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, status: "Awaiting Bill" } : t));
  };

  const handleUploadBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billForm.actualAmount || !billForm.coSigner) return;

    const finalAmount = Number(billForm.actualAmount);

    setTickets(tickets.map(t => {
      if (t.id === activeTicketId) {
        return { ...t, status: "Completed", actualAmount: finalAmount, coSigner: billForm.coSigner };
      }
      return t;
    }));

    setWalletBalance(prev => prev - finalAmount);
    setBillForm({ actualAmount: "", coSigner: "", billPhoto: null, productPhoto: null });
    setIsUploadModalOpen(false);
    setActiveTicketId(null);
  };

  // Metrics
  const pendingAmount = tickets.filter(t => t.status === "Pending Approval").reduce((acc, curr) => acc + curr.requestedAmount, 0);
  const spentAmount = tickets.filter(t => t.status === "Completed").reduce((acc, curr) => acc + (curr.actualAmount || 0), 0);
  const budgetPercent = ((yearlyFinances.totalSpent + spentAmount) / yearlyFinances.allocatedBudget) * 100;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 h-full flex flex-col relative pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Wallet className="w-8 h-8 text-emerald-600" /> Expense & Fund Manager
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Secure wallet, ticketing, and annual audit reports.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setIsRechargeModalOpen(true)} className="flex-1 md:flex-none bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm">
            <ShieldCheck className="w-4 h-4" /> Admin: Add Funds
          </button>
          <button onClick={() => setIsRequestModalOpen(true)} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Raise Purchase Ticket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* LEFT COLUMN: Wallet & Stats */}
        <div className="flex flex-col gap-6">
          
          {/* The Digital Wallet Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-bl-full -z-0 blur-2xl"></div>
            <div className="relative z-10 flex justify-between items-start mb-8">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/20"><Wallet className="w-6 h-6 text-white" /></div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-200 bg-black/20 px-3 py-1 rounded-full border border-white/10">Active Imprest</span>
            </div>
            <div className="relative z-10">
                <p className="text-sm font-bold text-emerald-200 uppercase tracking-widest mb-1">Available Balance</p>
                <div className="flex items-end gap-1"><IndianRupee className="w-8 h-8 mb-1" /><h2 className="text-5xl font-black tracking-tight">{walletBalance.toLocaleString()}</h2></div>
            </div>
          </motion.div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pending Requests</p>
                <p className="text-xl font-black text-amber-600 flex items-center gap-1"><IndianRupee className="w-4 h-4"/> {pendingAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ticket Spending</p>
                <p className="text-xl font-black text-slate-800 flex items-center gap-1"><IndianRupee className="w-4 h-4"/> {spentAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* NEW: YEARLY EXPENSE TRACKER */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900 border border-slate-800 rounded-[2rem] shadow-xl p-6 relative overflow-hidden flex-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -z-0 blur-2xl"></div>
            
            <div className="relative z-10 flex justify-between items-center mb-6">
                <h3 className="font-black text-white text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> Annual Finances</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-md border border-emerald-500/20">2026-27</span>
            </div>

            <div className="relative z-10 mb-6">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spent YTD</p>
                        <p className="text-3xl font-black text-white flex items-center gap-0.5"><IndianRupee className="w-6 h-6 text-slate-400"/> {(yearlyFinances.totalSpent + spentAmount).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget</p>
                        <p className="text-sm font-bold text-slate-300 flex items-center justify-end gap-0.5"><IndianRupee className="w-3 h-3"/> {yearlyFinances.allocatedBudget.toLocaleString()}</p>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 mt-2 border border-slate-700">
                    <div className={`h-2 rounded-full ${budgetPercent > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(budgetPercent, 100)}%` }}></div>
                </div>
            </div>

            {/* Recent Expenses List */}
            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-800 pb-2">Recent Withdrawals</p>
                <div className="space-y-3">
                    {yearlyFinances.recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700"><ArrowDownRight className="w-4 h-4"/></div>
                                <div><p className="text-sm font-bold text-slate-200">{tx.desc}</p><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{tx.date}</p></div>
                            </div>
                            <p className="font-black text-emerald-400 text-sm flex items-center"><IndianRupee className="w-3 h-3"/>{tx.amount.toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
          </motion.div>

        </div>

        {/* RIGHT COLUMN: Ticket Tracker */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-black text-slate-800">Purchase Tickets & Reports</h2>
                </div>

                <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 bg-slate-50/30">
                    <AnimatePresence>
                        {tickets.map(ticket => (
                            <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-blue-200 transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest border border-slate-200">{ticket.id}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{ticket.date}</span>
                                        </div>
                                        <h3 className="font-black text-slate-800 text-lg">{ticket.title}</h3>
                                        <p className="text-sm font-medium text-slate-500 mt-1">{ticket.reason}</p>
                                    </div>
                                    <div className="text-left sm:text-right shrink-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Est. Amount</p>
                                        <p className="text-xl font-black text-slate-800 flex items-center sm:justify-end gap-0.5"><IndianRupee className="w-4 h-4"/>{ticket.requestedAmount}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                                    
                                    {ticket.status === "Pending Approval" && (
                                        <div className="flex items-center gap-2">
                                            <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-amber-100"><Clock className="w-4 h-4"/> Pending Admin Approval</span>
                                            <button onClick={() => handleSimulateAdminApproval(ticket.id)} className="text-xs font-black text-blue-600 underline">Simulate Approval</button>
                                        </div>
                                    )}

                                    {ticket.status === "Awaiting Bill" && (
                                        <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-blue-100"><AlertCircle className="w-4 h-4"/> Approved: Purchase & Upload Bill</span>
                                    )}

                                    {ticket.status === "Completed" && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-emerald-100"><CheckCircle2 className="w-4 h-4"/> Audited & Completed</span>
                                            <span className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-200"><FileSignature className="w-3.5 h-3.5"/> Signed by {ticket.coSigner}</span>
                                            <span className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-200">Actual: ₹{ticket.actualAmount}</span>
                                        </div>
                                    )}

                                    {ticket.status === "Awaiting Bill" && (
                                        <button onClick={() => { setActiveTicketId(ticket.id); setIsUploadModalOpen(true); }} className="w-full sm:w-auto bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm">
                                            <Upload className="w-4 h-4" /> Upload Bill & Close
                                        </button>
                                    )}
                                    {ticket.status === "Completed" && (
                                        <button className="text-slate-400 hover:text-blue-600 font-bold text-sm flex items-center gap-1 transition-colors"><FileText className="w-4 h-4" /> View Report</button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. RAISE TICKET MODAL */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-600"/> Raise Ticket</h3><button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X className="w-5 h-5"/></button></div>
              <form onSubmit={handleRequestFunds} className="space-y-4">
                <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Item / Product Name</label><input required type="text" value={requestForm.title} onChange={e=>setRequestForm({...requestForm, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-emerald-500 font-bold text-sm" /></div>
                <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Estimated Amount (₹)</label><input required type="number" value={requestForm.amount} onChange={e=>setRequestForm({...requestForm, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-emerald-500 font-black text-lg" /></div>
                <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Reason for Purchase</label><textarea required rows={3} value={requestForm.reason} onChange={e=>setRequestForm({...requestForm, reason: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-3 outline-none focus:border-emerald-500 text-sm font-medium resize-none"></textarea></div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"><Send className="w-4 h-4"/> Submit for Approval</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. UPLOAD BILL MODAL */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Upload className="w-5 h-5 text-blue-600"/> Submit Proof</h3><button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X className="w-5 h-5"/></button></div>
              <form onSubmit={handleUploadBill} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"><Receipt className="w-6 h-6 mb-2"/><span className="text-[10px] font-black uppercase tracking-widest text-center">Upload Bill<br/>Photo</span></div>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"><Camera className="w-6 h-6 mb-2"/><span className="text-[10px] font-black uppercase tracking-widest text-center">Upload Product<br/>Photo</span></div>
                </div>
                <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Exact Final Amount (₹)</label><input required type="number" placeholder="Enter actual billed amount" value={billForm.actualAmount} onChange={e=>setBillForm({...billForm, actualAmount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 font-black text-lg" /><p className="text-xs text-slate-500 font-medium mt-1">*This exact amount will be deducted from the wallet.</p></div>
                <div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Second Staff (Co-Signer / Auditor)</label><div className="relative"><UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input required type="text" placeholder="e.g. Rahul Verma (HOD)" value={billForm.coSigner} onChange={e=>setBillForm({...billForm, coSigner: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 pl-9 pr-3 outline-none focus:border-blue-500 font-bold text-sm" /></div></div>
                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"><Check className="w-4 h-4"/> Sign & Close Transaction</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. RECHARGE MODAL */}
      <AnimatePresence>
        {isRechargeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-800"><ShieldCheck className="w-8 h-8"/></div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Recharge Imprest Wallet</h3><p className="text-sm font-medium text-slate-500 mb-6">Authorize new funds for school operations.</p>
              <form onSubmit={handleRecharge}>
                <div className="relative mb-6"><IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/><input required type="number" autoFocus placeholder="10000" value={rechargeAmount} onChange={e=>setRechargeAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-emerald-500 font-black text-2xl" /></div>
                <div className="flex gap-3"><button type="button" onClick={() => setIsRechargeModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all">Cancel</button><button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all">Add Funds</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}