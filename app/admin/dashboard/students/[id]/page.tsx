"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/supabase";
import { 
  ArrowLeft, User, MapPin, Phone, CreditCard, Trophy, 
  Calendar, FileText, Activity, CheckCircle2, AlertCircle, 
  BookOpen, Star, ClipboardCheck, MessageSquare, 
  ShieldAlert, Clock, Loader2, X, Save, Edit2, BarChart3, CalendarDays
} from "lucide-react";

export default function StudentProfile() {
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const studentId = rawId ? decodeURIComponent(rawId) : "";

  const [student, setStudent] = useState<any>(null);
  
  // Advanced Attendance States
  const [attendanceStats, setAttendanceStats] = useState({ percentage: 0, total: 0, present: 0, absent: 0, leave: 0, halfDay: 0 });
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]); // Array to hold month-wise data
  
  const [feeStats, setFeeStats] = useState({ totalAnnual: 0, paid: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "", lastName: "", fatherPhone: "", motherPhone: "", address: ""
  });

  useEffect(() => {
    if (studentId) fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Core Student Data
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
        
      if (studentError) throw studentError;

      // 2. Fetch Attendance Records (For Yearly & Monthly Reports)
      const { data: attData } = await supabase
        .from('student_attendance')
        .select('date, status')
        .eq('student_id', studentId)
        .order('date', { ascending: false });
      
      if (attData) {
        // A. Calculate Yearly / Overall Stats
        const total = attData.length;
        let present = 0, absent = 0, leave = 0, halfDay = 0;
        
        // B. Calculate Month-wise Stats
        const monthlyMap: Record<string, any> = {};

        attData.forEach(record => {
          // Overall Counters
          if (record.status === 'Present') present++;
          else if (record.status === 'Absent') absent++;
          else if (record.status === 'Leave') leave++;
          else if (record.status === 'Half-Day') halfDay++;

          // Monthly Counters
          const dateObj = new Date(record.date);
          const monthKey = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' }); // e.g. "May 2026"
          
          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = { month: monthKey, total: 0, present: 0, absent: 0, leave: 0, halfDay: 0 };
          }
          
          monthlyMap[monthKey].total++;
          if (record.status === 'Present') monthlyMap[monthKey].present++;
          else if (record.status === 'Absent') monthlyMap[monthKey].absent++;
          else if (record.status === 'Leave') monthlyMap[monthKey].leave++;
          else if (record.status === 'Half-Day') monthlyMap[monthKey].halfDay++;
        });

        const percentage = total > 0 ? Math.round(((present + (halfDay * 0.5)) / total) * 100) : 0;
        setAttendanceStats({ percentage, total, present, absent, leave, halfDay });

        // Convert the map to an array for easy rendering
        setMonthlyAttendance(Object.values(monthlyMap));
      }

      // 3. Fetch Fee Records
      const { data: feeData } = await supabase
        .from('student_fees')
        .select('amount_due, amount_paid')
        .eq('student_id', studentId);

      if (feeData) {
        const totalAnnual = feeData.reduce((acc, f) => acc + Number(f.amount_due), 0);
        const paid = feeData.reduce((acc, f) => acc + Number(f.amount_paid), 0);
        setFeeStats({ totalAnnual, paid, pending: totalAnnual - paid });
      }

      setStudent(studentData);
      
      // Populate Edit Form Defaults
      setEditForm({
        firstName: studentData.first_name,
        lastName: studentData.last_name,
        fatherPhone: studentData.father_phone,
        motherPhone: studentData.mother_phone || "",
        address: studentData.primary_address
      });

    } catch (err) {
      console.error("Error fetching student profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('students').update({
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        father_phone: editForm.fatherPhone,
        mother_phone: editForm.motherPhone,
        primary_address: editForm.address
      }).eq('id', studentId);

      if (error) throw error;
      
      setIsEditModalOpen(false);
      await fetchStudentData(); 
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !student) {
    return (
      <div className="flex h-[80vh] items-center justify-center w-full min-w-0">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse text-sm tracking-widest uppercase">Compiling Student Dossier...</p>
        </div>
      </div>
    );
  }

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
  const feeProgress = feeStats.totalAnnual > 0 ? (feeStats.paid / feeStats.totalAnnual) * 100 : 0;

  // Mock data for UI sections not yet backed by DB tables
  const mockAssignments = { totalGiven: 145, completedOnTime: 130, lateSubmission: 10, pending: 5, teacherRemark: "Excellent consistency in Math, needs to improve handwriting." };
  const mockMonthlyTests = [ { month: "August", score: 88, max: 100 }, { month: "September", score: 92, max: 100 } ];
  const mockExtracurriculars = ["Debate Club", "Science Team"];
  const mockAchievements = [ { title: "1st Prize - Science Fair", date: "Oct 2025" } ];
  const mockRemarks = [ { date: "12 Sep 2025", remark: "Very helpful in organizing the library.", type: "Positive" } ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6 pb-24 min-w-0">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 w-full">
        <Link href="/admin/dashboard/students" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
            <FileText className="w-4 h-4" /> Generate Report
          </button>
          <button onClick={() => setIsEditModalOpen(true)} className="flex-1 sm:flex-none bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full min-w-0">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 lg:gap-8 w-full min-w-0">
          
          {/* Main Identity Card */}
          <motion.div variants={item} className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-28 h-28 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 rounded-full flex items-center justify-center font-black text-4xl shadow-inner border-4 border-white mb-4">
                {student.photo_url ? <img src={student.photo_url} alt="Student" className="w-full h-full rounded-full object-cover" /> : `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`}
              </div>
              <h2 className="text-2xl font-black text-slate-800 break-words">{student.first_name} {student.last_name}</h2>
              <p className="text-slate-500 font-bold mt-1 bg-slate-100 px-3 py-1 rounded-lg inline-block">{student.id}</p>
              
              <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${student.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {student.status === 'Active' ? <CheckCircle2 className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>} {student.status}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                  {student.current_class} - Sec {student.current_section}
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-8 space-y-4 pt-6 border-t border-slate-100">
              <InfoRow icon={<Calendar />} label="D.O.B" value={student.dob ? new Date(student.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'}) : 'N/A'} />
              <InfoRow icon={<Activity />} label="Blood Group" value={student.blood_group || "N/A"} />
              <InfoRow icon={<MapPin />} label="Address" value={student.primary_address} />
              <InfoRow icon={<FileText />} label="Aadhaar Number" value="[Aadhaar Redacted]" />
            </div>
          </motion.div>

          {/* Guardian Info */}
          <motion.div variants={item} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm w-full">
            <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" /> Guardian Details
            </h3>
            <div className="space-y-5">
              <div className="min-w-0"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Father</p><p className="font-bold text-slate-800 truncate">{student.father_name}</p><p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1 truncate"><Phone className="w-3.5 h-3.5 shrink-0" /> {student.father_phone}</p></div>
              <hr className="border-slate-100" />
              <div className="min-w-0"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mother</p><p className="font-bold text-slate-800 truncate">{student.mother_name}</p><p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1 truncate"><Phone className="w-3.5 h-3.5 shrink-0" /> {student.mother_phone || 'N/A'}</p></div>
            </div>
          </motion.div>
        </div>


        {/* ================= RIGHT COLUMN ================= */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 lg:gap-8 w-full min-w-0">
          
          {/* ================= NEW: COMPREHENSIVE ATTENDANCE REPORT ================= */}
          <motion.div variants={item} className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden w-full min-w-0">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-black text-slate-800 text-xl flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-500" /> Attendance Report
              </h3>
            </div>
            
            {/* Yearly / Overall Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 w-full">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Yearly %</p>
                <p className={`text-3xl font-black ${attendanceStats.percentage >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>{attendanceStats.percentage}%</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col justify-center">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Total Present</p>
                <p className="text-3xl font-black text-emerald-600">{attendanceStats.present}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex flex-col justify-center">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">On Leave</p>
                <p className="text-3xl font-black text-amber-600">{attendanceStats.leave}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-100 flex flex-col justify-center">
                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1">Total Absent</p>
                <p className="text-3xl font-black text-red-600">{attendanceStats.absent}</p>
              </div>
            </div>

            {/* Month-wise Breakdown */}
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><CalendarDays className="w-4 h-4"/> Month-wise Breakdown</h4>
            {monthlyAttendance.length === 0 ? (
              <p className="text-sm font-bold text-slate-400 bg-slate-50 p-4 rounded-xl text-center border border-slate-100">No monthly records available yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
                {monthlyAttendance.map((m, idx) => {
                  const mPct = Math.round(((m.present + (m.halfDay * 0.5)) / m.total) * 100);
                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between min-w-0">
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 text-sm truncate">{m.month}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{m.total} Working Days</p>
                      </div>
                      <div className="text-right shrink-0 ml-4 flex gap-4">
                        <div>
                          <p className="text-[9px] font-black uppercase text-emerald-600 mb-0.5">P / L</p>
                          <p className="font-bold text-slate-700 text-sm">{m.present} / {m.leave}</p>
                        </div>
                        <div className="pl-4 border-l border-slate-200">
                          <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Month %</p>
                          <p className={`font-black text-sm ${mPct >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>{mPct}%</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>


          {/* Live Fees Snapshot */}
          <motion.div variants={item} className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden w-full min-w-0">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-50 rounded-bl-full -z-0"></div>
            <div className="relative z-10 flex justify-between items-center mb-8"><h3 className="font-black text-slate-800 text-xl flex items-center gap-2"><CreditCard className="w-6 h-6 text-amber-500" /> Financial Status</h3></div>
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Billed</p><p className="text-2xl font-black text-slate-800">₹{feeStats.totalAnnual.toLocaleString()}</p></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Paid</p><p className="text-2xl font-black text-emerald-600">₹{feeStats.paid.toLocaleString()}</p></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending</p><p className="text-2xl font-black text-red-600">₹{feeStats.pending.toLocaleString()}</p></div>
            </div>
            <div className="relative z-10 mb-2">
              <div className="flex justify-between text-xs font-bold mb-2"><span className="text-slate-500">Payment Progress</span><span className="text-slate-800">{feeProgress.toFixed(0)}%</span></div>
              <div className="w-full bg-slate-100 rounded-full h-3"><div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${feeProgress}%` }}></div></div>
            </div>
          </motion.div>

          {/* Continuous Evaluation (Mock Data) */}
          <motion.div variants={item} className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm w-full min-w-0">
            <h3 className="font-black text-slate-800 text-xl mb-6 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-blue-500" /> Continuous Evaluation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full min-w-0">
              {/* Homework Tracker */}
              <div className="w-full min-w-0">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Homework & Classwork</h4>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion Rate</p>
                      <p className="text-3xl font-black text-blue-600">{Math.round((mockAssignments.completedOnTime / mockAssignments.totalGiven) * 100)}%</p>
                    </div>
                    <p className="text-sm font-bold text-slate-500">{mockAssignments.totalGiven} Total Tasks</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="font-medium text-slate-600">Completed on Time</span><span className="font-bold text-emerald-600">{mockAssignments.completedOnTime}</span></div>
                    <div className="flex justify-between text-sm"><span className="font-medium text-slate-600">Late Submission</span><span className="font-bold text-amber-500">{mockAssignments.lateSubmission}</span></div>
                    <div className="flex justify-between text-sm"><span className="font-medium text-slate-600">Pending</span><span className="font-bold text-red-500">{mockAssignments.pending}</span></div>
                  </div>
                </div>
                <div className="mt-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex gap-3 items-start">
                  <MessageSquare className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-blue-900 italic">"{mockAssignments.teacherRemark}"</p>
                </div>
              </div>

              {/* Monthly Test Mini-Chart */}
              <div className="w-full min-w-0">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Monthly Test Performance</h4>
                <div className="space-y-4">
                  {mockMonthlyTests.map((test: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold text-slate-700">{test.month}</span>
                        <span className="font-black text-slate-900">{test.score}<span className="text-slate-400 text-xs">/{test.max}</span></span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(test.score / test.max) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* ================= EDIT MODAL ================= */}
      <AnimatePresence>
        {isEditModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col border-l border-slate-200">
              
              <div className="h-20 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-800">Edit Profile</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="bg-white hover:bg-slate-100 text-slate-500 p-2 rounded-full transition-colors border border-slate-200 shadow-sm"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto flex flex-col p-6 space-y-6">
                
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Student Details</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">First Name</label><input required type="text" value={editForm.firstName} onChange={e=>setEditForm({...editForm, firstName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label><input required type="text" value={editForm.lastName} onChange={e=>setEditForm({...editForm, lastName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 text-sm" /></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Contact Information</h4>
                  <div className="space-y-4 mb-4">
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Father's Phone</label><input required type="tel" value={editForm.fatherPhone} onChange={e=>setEditForm({...editForm, fatherPhone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Mother's Phone</label><input type="tel" value={editForm.motherPhone} onChange={e=>setEditForm({...editForm, motherPhone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 text-sm" /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Primary Address</label><textarea required rows={3} value={editForm.address} onChange={e=>setEditForm({...editForm, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 resize-none text-sm"></textarea></div>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4"/>}
                  {isSubmitting ? "Updating Database..." : "Save Changes"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3 min-w-0 w-full">
      <div className="mt-0.5 text-slate-400 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="font-bold text-slate-800 text-sm truncate">{value}</p>
      </div>
    </div>
  );
}