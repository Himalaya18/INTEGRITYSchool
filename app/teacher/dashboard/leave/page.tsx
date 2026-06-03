"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarDays, Clock, Send, CheckCircle2, 
  Umbrella, CalendarX, AlertTriangle, Loader2, Fingerprint, History,
  QrCode, X, ScanLine, Camera
} from "lucide-react";
import { supabase } from "@/supabase";

export default function TeacherAttendanceLeave() {
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [alreadyPunchedIn, setAlreadyPunchedIn] = useState(false);

  // Punch & QR State
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmittingPunch, setIsSubmittingPunch] = useState(false);

  // Leave Form State
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    type: "Casual Leave"
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // --- INITIALIZATION ---
  useEffect(() => {
    initializePortal();
  }, []);

  // --- REALTIME LISTENERS ---
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase.channel('teacher-attendance-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_attendance', filter: `staff_id=eq.${currentUser.id}` }, () => fetchData(currentUser.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests', filter: `teacher_id=eq.${currentUser.id}` }, () => fetchData(currentUser.id))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  const initializePortal = async () => {
    setIsLoading(true);
    let activeEmpId = null;
    let activeUserName = "Educator";

    try {
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      
      if (session?.user?.email) {
        const { data: userData } = await supabase.from('users').select('emp_id, name').eq('email', session.user.email).single();
        if (userData?.emp_id) {
          activeEmpId = userData.emp_id;
          activeUserName = userData.name;
        }
      } else {
        // DEVELOPMENT BYPASS
        console.warn("No active auth session. Loading mock profile...");
        const { data: mockUser } = await supabase.from('users').select('emp_id, name').eq('role', 'teacher').not('emp_id', 'is', null).limit(1).single();
        if (mockUser) {
          activeEmpId = mockUser.emp_id;
          activeUserName = mockUser.name;
        }
      }
      
      if (activeEmpId) {
        setCurrentUser({ id: activeEmpId, name: activeUserName });
        await fetchData(activeEmpId);
      }
    } catch (err) {
      console.error("Auth fetch failed", err);
    }
    
    setIsLoading(false);
  };

  const fetchData = async (empId: string) => {
    if (!empId) return;

    // Fetch Attendance
    const { data: logs } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('staff_id', empId)
      .order('date', { ascending: false });
      
    if (logs) {
      setAttendanceLogs(logs);
      const todaysLog = logs.find(l => l.date === todayStr);
      setAlreadyPunchedIn(!!todaysLog && todaysLog.status === 'Present');
    }

    // Fetch Leaves
    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('teacher_id', empId)
      .order('created_at', { ascending: false });

    if (leaves) {
      setLeaveRequests(leaves);
    }
  };

  const handlePunchIn = async () => {
    if (!currentUser) return;
    setIsSubmittingPunch(true);

    const now = new Date();
    
    let formatAmPm = now.getHours() >= 12 ? 'PM' : 'AM';
    let h12 = now.getHours() % 12 || 12;
    let m = now.getMinutes();
    let timeStr = `${h12 < 10 ? '0'+h12 : h12}:${m < 10 ? '0'+m : m} ${formatAmPm}`;
    
    const timeVal = now.getHours() * 100 + now.getMinutes();
    let type = "On Time";
    if (timeVal >= 930) type = "Half Day";
    else if (timeVal > 830) type = "Warning";

    await supabase.from('staff_attendance').upsert({
      staff_id: currentUser.id,
      date: todayStr,
      time_in: timeStr,
      status: "Present",
      type: type
    }, { onConflict: 'staff_id, date' });

    setAlreadyPunchedIn(true);
    setIsScanning(false);
    fetchData(currentUser.id);
    setIsSubmittingPunch(false);
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) {
      alert("End date cannot be before start date.");
      return;
    }

    setIsSubmittingLeave(true);

    let durationStr = "";
    if (leaveForm.startDate === leaveForm.endDate) {
      durationStr = new Date(leaveForm.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } else {
      const start = new Date(leaveForm.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const end = new Date(leaveForm.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      durationStr = `${start} - ${end}`;
    }

    const payload = {
      teacher_id: currentUser.id,
      type: leaveForm.type,
      start_date: leaveForm.startDate,
      end_date: leaveForm.endDate,
      duration: durationStr,
      reason: leaveForm.reason,
      status: "Pending"
    };

    // Optimistic UI Update (Shows instantly on screen)
    setLeaveRequests([{ id: Math.random().toString(), ...payload, created_at: new Date().toISOString() }, ...leaveRequests]);

    // DB Insert
    const { error } = await supabase.from('leave_requests').insert([payload]);

    if (error) {
      console.error("Leave Submission Error:", error);
      alert("Failed to submit request. Please try again.");
    } else {
      setLeaveForm({ startDate: "", endDate: "", reason: "", type: "Casual Leave" });
      alert("Leave request sent to Principal for approval!");
    }
    
    fetchData(currentUser.id);
    setIsSubmittingLeave(false);
  };

  if (isLoading) {
    return <div className="flex h-[85vh] items-center justify-center w-full"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-6 text-center bg-[#F8F9FA]">
        <div className="bg-red-50 text-red-600 p-8 rounded-3xl max-w-md border border-red-100 shadow-sm w-full">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4"/> 
          <h2 className="text-xl font-black mb-2">Setup Required</h2>
          <p className="font-bold text-sm text-red-500">Your user account does not have an 'emp_id' assigned to it. Please assign one in the database to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 lg:space-y-8 font-sans pb-32 overflow-x-hidden">
      
      {/* ================= HERO SECTION & PUNCH ACTION ================= */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-emerald-900 p-8 sm:p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden text-white w-full"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 w-full xl:flex-1">
          <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-emerald-200 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border border-white/10 shadow-inner mb-4">
            <QrCode className="w-3.5 h-3.5" /> QR Scan Active
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">Attendance Portal</h1>
          <p className="text-emerald-100/80 font-medium text-base sm:text-lg max-w-xl leading-relaxed">
            Welcome, {currentUser.name}. Scan the QR code at the Principal's Kiosk before 08:30 AM to log your attendance.
          </p>
        </div>
        
        <div className="relative z-10 w-full xl:w-auto shrink-0 flex flex-col gap-2">
          <button 
            onClick={() => !alreadyPunchedIn && setIsScanning(true)}
            disabled={alreadyPunchedIn}
            className={`w-full xl:w-auto py-5 px-10 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 transition-all ${alreadyPunchedIn ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-default border border-emerald-400' : 'bg-white text-emerald-900 hover:scale-105 shadow-xl hover:shadow-emerald-500/30'}`}
          >
            {alreadyPunchedIn ? <><CheckCircle2 className="w-6 h-6"/> Logged for Today</> : <><QrCode className="w-6 h-6"/> Scan Kiosk QR</>}
          </button>
          {!alreadyPunchedIn && <p className="text-center text-xs font-bold text-emerald-300 mt-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3"/> Current Time: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        
        {/* ================= LEFT PANE: ATTENDANCE HISTORY ================= */}
        <div className="xl:col-span-7 flex flex-col gap-6 w-full min-w-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[500px] w-full">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><CalendarDays className="w-5 h-5"/></div>
              <h2 className="font-black text-slate-800 text-lg">My Attendance Ledger</h2>
            </div>
            
            <div className="flex-1 overflow-x-auto custom-scrollbar bg-slate-50/30 p-6 w-full">
              {attendanceLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 w-full">
                  <History className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-bold">No attendance records found.</p>
                </div>
              ) : (
                <div className="space-y-3 w-full">
                  {attendanceLogs.map((log, i) => (
                    <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-200 transition-colors w-full">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black shrink-0 ${log.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                          {log.status === 'Present' ? <CheckCircle2 className="w-6 h-6"/> : <CalendarX className="w-6 h-6"/>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-slate-800 text-base truncate">{new Date(log.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-0.5 truncate"><Clock className="w-3.5 h-3.5 shrink-0"/> {log.time_in === '--:--' ? 'Did not punch in' : `Punched in at ${log.time_in}`}</p>
                        </div>
                      </div>
                      
                      <div className="shrink-0 text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
                        <span className={`inline-flex px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${
                          log.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' : 
                          log.type === 'On Time' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          log.type === 'Warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {log.status === 'Absent' ? 'Absent' : log.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ================= RIGHT PANE: LEAVE MANAGEMENT ================= */}
        <div className="xl:col-span-5 flex flex-col gap-6 lg:gap-8 w-full min-w-0">
          
          {/* Apply For Leave Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 sm:p-8 w-full min-w-0">
            <h2 className="font-black text-slate-800 text-xl mb-6 flex items-center gap-2">
              <Umbrella className="w-5 h-5 text-amber-500"/> Request Time Off
            </h2>
            
            <form onSubmit={handleLeaveSubmit} className="space-y-6 flex flex-col w-full min-w-0">
              
              <div className="flex flex-col w-full min-w-0">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Leave Type</label>
                <div className="grid grid-cols-2 gap-3 w-full min-w-0">
                  {["Casual Leave", "Sick Leave", "Earned Leave", "Emergency"].map(type => (
                    <button 
                      key={type} type="button" onClick={() => setLeaveForm({...leaveForm, type})}
                      className={`w-full whitespace-nowrap overflow-hidden text-ellipsis py-3 px-2 rounded-xl text-xs font-bold transition-all border ${leaveForm.type === type ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full min-w-0">
                <div className="flex-1 w-full min-w-0">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">From Date</label>
                  <input required type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 outline-none focus:border-amber-500 text-sm font-bold" />
                </div>
                <div className="flex-1 w-full min-w-0">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">To Date</label>
                  <input required type="date" min={leaveForm.startDate} value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 outline-none focus:border-amber-500 text-sm font-bold" />
                </div>
              </div>

              <div className="flex flex-col w-full min-w-0">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Reason / Details</label>
                <textarea required rows={3} placeholder="Please provide a brief reason for admin approval..." value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl px-4 py-3 outline-none focus:border-amber-500 resize-none text-sm"></textarea>
              </div>

              <button type="submit" disabled={isSubmittingLeave} className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4 shrink-0">
                {isSubmittingLeave ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-4 h-4"/>} Submit Request
              </button>
            </form>
          </motion.div>

          {/* Leave History List */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px] w-full min-w-0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 w-full">
              <h2 className="font-black text-slate-800 text-base flex items-center gap-2"><History className="w-4 h-4 text-slate-400"/> Leave History</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{leaveRequests.length} Records</span>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50/30 w-full">
              {leaveRequests.length === 0 ? (
                <p className="text-center text-xs font-bold text-slate-400 py-6 w-full">You haven't requested any leaves yet.</p>
              ) : (
                <div className="space-y-4 w-full">
                  <AnimatePresence>
                    {leaveRequests.map(leave => (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={leave.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col gap-2 w-full">
                        <div className="flex flex-wrap gap-2 justify-between items-start w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 whitespace-nowrap">{leave.duration}</span>
                            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline-block">| {leave.type}</span>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border whitespace-nowrap ${
                            leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            leave.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                          }`}>
                            {leave.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 leading-snug break-words w-full">{leave.reason}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
          
        </div>
      </div>

      {/* ================= QR SCANNER MODAL ================= */}
      <AnimatePresence>
        {isScanning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl flex flex-col items-center relative overflow-hidden"
            >
              <button onClick={() => setIsScanning(false)} className="absolute top-6 right-6 text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
              
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner mb-6">
                <Camera className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-black text-slate-800 mb-2">Scan Daily Kiosk</h3>
              <p className="text-sm font-medium text-slate-500 text-center mb-8">Point your camera at the Principal's QR Code to securely punch in for the day.</p>

              {/* Viewfinder UI */}
              <div className="relative w-64 h-64 border-2 border-dashed border-slate-300 rounded-3xl mb-8 flex items-center justify-center bg-slate-50 overflow-hidden">
                <ScanLine className="w-12 h-12 text-slate-300 absolute" />
                
                {/* Animated Scanning Line */}
                <motion.div 
                  animate={{ top: ["0%", "100%", "0%"] }} 
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 w-full h-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                />
              </div>

              {/* Simulation Button for Testing */}
              <button 
                onClick={handlePunchIn}
                disabled={isSubmittingPunch}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingPunch ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle2 className="w-5 h-5"/>} 
                {isSubmittingPunch ? "Verifying Token..." : "Simulate Successful Scan"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}