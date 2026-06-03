"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardCheck, Users, Search, CheckCircle2, 
  XCircle, Clock, Calendar, AlertTriangle, 
  ShieldAlert, Send, UserCheck, UserX, UserMinus,
  BookOpen, Loader2
} from "lucide-react";
import { supabase } from "@/supabase";

export default function StudentAttendance() {
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Live Data States
  const [classList, setClassList] = useState<any[]>([]); 
  const [studentDatabase, setStudentDatabase] = useState<Record<string, any[]>>({});
  const [activeClassId, setActiveClassId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [globalAttendance, setGlobalAttendance] = useState<Record<string, Record<string, string>>>({});

  const todayStr = new Date().toISOString().split('T')[0];

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    initializePortal();
  }, []);

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
        // Fallback for development testing
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
  };

  const fetchData = async (empId: string) => {
    try {
      // 1. DYNAMIC ROUTING: Fetch classes assigned to this specific teacher
      const { data: assignments, error: assignError } = await supabase
        .from('class_assignments')
        .select('*')
        .eq('teacher_id', empId);

      if (assignError) throw assignError;

      if (!assignments || assignments.length === 0) {
        setClassList([]);
        setIsLoading(false);
        return;
      }

      const assignedClassNames = [...new Set(assignments.map(a => a.class_name))];

      // 2. Fetch Active Students in those classes
      const { data: studentsData, error: stuError } = await supabase
        .from('students')
        .select('id, first_name, last_name, current_class, current_section, roll_number, gender')
        .eq('status', 'Active')
        .in('current_class', assignedClassNames)
        .order('roll_number', { ascending: true });
        
      if (stuError) throw stuError;

      // 3. Fetch Today's Attendance Logs (FIXED: Removed 'type' column call)
      const { data: todaysLogs, error: attError } = await supabase
        .from('student_attendance')
        .select('student_id, status')
        .eq('date', todayStr);

      if (attError) throw attError;

      // 4. Build the Tab Data and Group Students
      const groupedStudents: Record<string, any[]> = {};
      const uniqueClasses: any[] = [];

      assignments.forEach(assignment => {
        const classKey = `${assignment.class_name}-${assignment.section}`;
        if (!groupedStudents[classKey]) {
          groupedStudents[classKey] = [];
          uniqueClasses.push({
            id: classKey,
            name: assignment.class_name,
            section: assignment.section,
            role: assignment.is_class_teacher ? "Class Teacher" : "Subject Teacher",
            subject: assignment.subject
          });
        }
      });

      (studentsData || []).forEach(student => {
        const classKey = `${student.current_class}-${student.current_section}`;
        if (groupedStudents[classKey]) {
          groupedStudents[classKey].push({
            id: student.id,
            roll: student.roll_number || "-",
            name: `${student.first_name} ${student.last_name}`,
            avatar: `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`,
            gender: student.gender
          });
        }
      });

      uniqueClasses.sort((a, b) => a.id.localeCompare(b.id));

      setStudentDatabase(groupedStudents);
      setClassList(uniqueClasses);
      if (uniqueClasses.length > 0) setActiveClassId(uniqueClasses[0].id);

      // 5. Pre-fill Attendance State (FIXED: Direct map to status without 'type' conversion)
      const prefilledAttendance: Record<string, Record<string, string>> = {};
      const savedLogsMap = (todaysLogs || []).reduce((acc: any, log) => {
        acc[log.student_id] = log.status;
        return acc;
      }, {});

      Object.keys(groupedStudents).forEach(classKey => {
        prefilledAttendance[classKey] = {};
        groupedStudents[classKey].forEach(student => {
          prefilledAttendance[classKey][student.id] = savedLogsMap[student.id] || "Present";
        });
      });

      setGlobalAttendance(prefilledAttendance);

    } catch (err) {
      console.error("Failed to load attendance data", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleStatusChange = (studentId: string, status: string) => {
    setGlobalAttendance(prev => ({
      ...prev,
      [activeClassId]: {
        ...prev[activeClassId],
        [studentId]: status
      }
    }));
  };

  const markAllPresent = () => {
    const allPresent = studentDatabase[activeClassId].reduce((acc: any, student) => {
      acc[student.id] = "Present";
      return acc;
    }, {});
    setGlobalAttendance(prev => ({ ...prev, [activeClassId]: allPresent }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    
    try {
      const currentRoster = studentDatabase[activeClassId] || [];
      const currentStatusMap = globalAttendance[activeClassId] || {};

      // Prepare payload for Upsert (FIXED: Uses 'status' exclusively)
      const payload = currentRoster.map(student => ({
        student_id: student.id,
        date: todayStr,
        status: currentStatusMap[student.id], 
        marked_by: currentUser.id
      }));

      const { error } = await supabase
        .from('student_attendance')
        .upsert(payload, { onConflict: 'student_id, date' });

      if (error) throw error;

      alert(`Attendance for ${activeClassId.replace('-', ' Sec ')} officially locked!`);
    } catch (err: any) {
      alert("Failed to save attendance: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DERIVED DATA ---
  const activeClass = classList.find(c => c.id === activeClassId);
  const currentRoster = studentDatabase[activeClassId] || [];
  const currentAttendance = globalAttendance[activeClassId] || {};

  const filteredStudents = currentRoster.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.roll.toString().includes(searchQuery)
  );

  const stats = useMemo(() => {
    let present = 0, absent = 0, halfDay = 0, leave = 0;
    Object.values(currentAttendance).forEach(val => {
      if (val === 'Present') present++;
      if (val === 'Absent') absent++;
      if (val === 'Half-Day') halfDay++;
      if (val === 'Leave') leave++;
    });
    return { present, absent, halfDay, leave, total: currentRoster.length };
  }, [currentAttendance, currentRoster.length]);

  if (isLoading) {
    return <div className="flex h-[85vh] w-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  }

  // EMPTY STATE: If the Principal hasn't assigned them any classes yet
  if (classList.length === 0) {
    return (
      <div className="flex h-[85vh] w-full items-center justify-center p-6">
        <div className="text-center bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm max-w-md">
          <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">No Classes Assigned</h2>
          <p className="text-slate-500 font-medium text-sm">You have not been assigned to any classes yet. Please contact the Principal or Administrator to update your teaching roster.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto h-full flex flex-col relative pb-24 space-y-6 font-sans min-w-0">
      
      {/* ================= HEADER & CLASS SELECTOR ================= */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm w-full min-w-0">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><ClipboardCheck className="w-5 h-5" /></div>
            Class Attendance Register
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        {/* Horizontal Scrollable Class Tabs */}
        <div className="flex gap-2 w-full xl:w-auto overflow-x-auto custom-scrollbar pb-2 xl:pb-0">
          {classList.map(cls => (
             <button 
                key={cls.id}
                onClick={() => { setActiveClassId(cls.id); setSearchQuery(""); }}
                className={`px-5 py-3 rounded-xl text-sm font-black transition-all flex flex-col items-start min-w-[140px] whitespace-nowrap shrink-0 ${activeClassId === cls.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {cls.role === "Class Teacher" ? <Users className="w-4 h-4"/> : <BookOpen className="w-4 h-4"/>} 
                  {cls.name} <span className="opacity-70">Sec {cls.section}</span>
                </div>
                <span className={`text-[9px] uppercase tracking-widest ${activeClassId === cls.id ? 'text-blue-200' : 'text-slate-400'}`}>
                  {cls.subject}
                </span>
             </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px] w-full min-w-0">
        
        {/* ================= LEFT: SUMMARY & QUICK ACTIONS ================= */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 w-full min-w-0">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sticky top-6">
            <h2 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Summary for {activeClass?.id}</h2>
            
            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                <span className="font-bold text-sm flex items-center gap-2"><UserCheck className="w-4 h-4"/> Present</span><span className="font-black text-xl">{stats.present}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 text-red-700 rounded-xl border border-red-100">
                <span className="font-bold text-sm flex items-center gap-2"><UserX className="w-4 h-4"/> Absent</span><span className="font-black text-xl">{stats.absent}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                <span className="font-bold text-sm flex items-center gap-2"><Clock className="w-4 h-4"/> Half-Day</span><span className="font-black text-xl">{stats.halfDay}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
                <span className="font-bold text-sm flex items-center gap-2"><UserMinus className="w-4 h-4"/> On Leave</span><span className="font-black text-xl">{stats.leave}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mb-6">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Strength</span>
              <span className="text-2xl font-black text-slate-800">{stats.total}</span>
            </div>

            <button onClick={markAllPresent} className="w-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mb-4">
              <CheckCircle2 className="w-4 h-4"/> Mark All Present
            </button>

            <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-4 h-4"/>} 
              {isSubmitting ? "Locking Register..." : "Lock & Submit Roster"}
            </button>
          </div>
        </div>

        {/* ================= RIGHT: THE REGISTER GRID ================= */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col h-full w-full min-w-0">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden w-full">
            
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0 w-full">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search student by name or roll number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm shadow-sm" />
              </div>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 w-full">
              <div className="space-y-3 w-full">
                <AnimatePresence mode="popLayout">
                  {filteredStudents.map((student) => {
                    const status = currentAttendance[student.id] || "Present";
                    return (
                      <motion.div 
                        layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}
                        key={student.id} 
                        className={`flex flex-col md:flex-row items-start md:items-center justify-between p-3 sm:p-4 rounded-2xl border transition-colors w-full min-w-0 ${status === 'Present' ? 'bg-white border-slate-200 hover:border-emerald-300' : status === 'Absent' ? 'bg-red-50/50 border-red-100' : status === 'Half-Day' ? 'bg-amber-50/50 border-amber-100' : 'bg-purple-50/50 border-purple-100'}`}
                      >
                        {/* Info Section */}
                        <div className="flex items-center gap-4 mb-4 md:mb-0 w-full md:w-auto min-w-0">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-black text-sm flex items-center justify-center border border-slate-200 shrink-0 shadow-sm">{student.roll}</div>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-black shrink-0">{student.avatar}</div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-800 text-base truncate">{student.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{student.id} • {student.gender === 'Male' ? 'Male' : 'Female'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto shrink-0 shadow-inner">
                          <button onClick={() => handleStatusChange(student.id, 'Present')} className={`flex-1 md:flex-none md:w-20 py-2 rounded-lg text-xs font-black transition-all flex flex-col items-center gap-1 ${status === 'Present' ? 'bg-emerald-500 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}><CheckCircle2 className="w-4 h-4" /> Present</button>
                          <button onClick={() => handleStatusChange(student.id, 'Absent')} className={`flex-1 md:flex-none md:w-20 py-2 rounded-lg text-xs font-black transition-all flex flex-col items-center gap-1 ${status === 'Absent' ? 'bg-red-500 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}><XCircle className="w-4 h-4" /> Absent</button>
                          <button onClick={() => handleStatusChange(student.id, 'Half-Day')} className={`flex-1 md:flex-none md:w-20 py-2 rounded-lg text-[10px] sm:text-xs font-black transition-all flex flex-col items-center gap-1 ${status === 'Half-Day' ? 'bg-amber-500 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}><Clock className="w-4 h-4" /> Half-Day</button>
                          <button onClick={() => handleStatusChange(student.id, 'Leave')} className={`flex-1 md:flex-none md:w-20 py-2 rounded-lg text-xs font-black transition-all flex flex-col items-center gap-1 ${status === 'Leave' ? 'bg-purple-500 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}><UserMinus className="w-4 h-4" /> Leave</button>
                        </div>

                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}