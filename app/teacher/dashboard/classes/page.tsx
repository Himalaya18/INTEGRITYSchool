"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/supabase";
import Link from "next/link"; 
import { 
  Users, BookOpen, ClipboardCheck, PenTool, 
  ArrowLeft, Search, Filter, MoreVertical, 
  TrendingUp, AlertCircle, MessageSquare,
  Award, FileSpreadsheet, LayoutGrid, BrainCircuit,
  Target, LineChart, FileQuestion, Clock, CheckCircle2,
  Sparkles, ChevronRight, Loader2
} from "lucide-react";

export default function UnifiedClassManager() {
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Live Data States
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [allAssignedStudents, setAllAssignedStudents] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [termGrades, setTermGrades] = useState<any[]>([]);
  const [continuousMarks, setContinuousMarks] = useState<any[]>([]); // New State for Daily Marks

  // Navigation & UI States
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileTab, setProfileTab] = useState("Academics");

  // --- INITIALIZATION & FETCHING ---
  useEffect(() => {
    initializePortal();
  }, []);

  const initializePortal = async () => {
    setIsLoading(true);
    let activeEmpId = null;

    try {
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      
      if (session?.user?.email) {
        const { data: userData } = await supabase.from('users').select('emp_id, name').eq('email', session.user.email).single();
        if (userData?.emp_id) activeEmpId = userData.emp_id;
      } else {
        const { data: mockUser } = await supabase.from('users').select('emp_id, name').eq('role', 'teacher').not('emp_id', 'is', null).limit(1).single();
        if (mockUser) activeEmpId = mockUser.emp_id;
      }
      
      if (activeEmpId) {
        setCurrentUser({ id: activeEmpId, name: "Educator" });
        await fetchData(activeEmpId);
      }
    } catch (err) {
      console.error("Auth fetch failed", err);
    }
    setIsLoading(false);
  };

  const fetchData = async (empId: string) => {
    try {
      // 1. Fetch Class Assignments
      const { data: assignments } = await supabase.from('class_assignments').select('*').eq('teacher_id', empId);
      if (!assignments || assignments.length === 0) return;

      // 2. Fetch Active Students
      const { data: students } = await supabase.from('students').select('*').eq('status', 'Active');
      
      // Filter students to only those in the assigned classes
      const assignedStudents = (students || []).filter(s => 
        assignments.some(a => a.class_name === s.current_class && a.section === s.current_section)
      );
      setAllAssignedStudents(assignedStudents);

      const studentIds = assignedStudents.map(s => s.id);

      // 3. Fetch Attendance, Term Grades, and Continuous Marks
      if (studentIds.length > 0) {
        const [attData, gradeData, marksData] = await Promise.all([
          supabase.from('student_attendance').select('student_id, status, type').in('student_id', studentIds),
          supabase.from('student_term_grades').select('*').in('student_id', studentIds),
          supabase.from('student_marks').select('*').in('student_id', studentIds) // Fetch Daily Marks
        ]);

        if (attData.data) setAttendanceLogs(attData.data);
        if (gradeData.data) setTermGrades(gradeData.data);
        if (marksData.data) setContinuousMarks(marksData.data);
      }

      // 4. Process Class Overviews
      const processedClasses = assignments.map(a => {
        const classId = `${a.class_name}-${a.section}-${a.subject}`;
        const classStudents = assignedStudents.filter(s => s.current_class === a.class_name && s.current_section === a.section);
        
        return {
          id: classId,
          class: a.class_name,
          section: a.section,
          subject: a.subject,
          isClassTeacher: a.is_class_teacher,
          totalStudents: classStudents.length,
        };
      });

      setMyClasses(processedClasses);

    } catch (err) {
      console.error("Error fetching class data:", err);
    }
  };

  // --- DATA PROCESSING & DERIVATIONS ---
  const getStudentAttendancePct = (studentId: string) => {
    const logs = attendanceLogs.filter(a => a.student_id === studentId);
    if (logs.length === 0) return 100; 
    const present = logs.filter(a => a.status === 'Present' && a.type !== 'Half-Day').length;
    const half = logs.filter(a => a.type === 'Half-Day').length;
    return Math.round(((present + (half * 0.5)) / logs.length) * 100);
  };

  const getStudentLatestGrade = (studentId: string) => {
    const grades = termGrades.filter(g => g.student_id === studentId);
    if (grades.length === 0) return "N/A";
    grades.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return grades[0].grade_letter || "N/A";
  };

  const activeClassInfo = myClasses.find(c => c.id === selectedClassId);
  
  const currentRoster = useMemo(() => {
    if (!activeClassInfo) return [];
    
    return allAssignedStudents
      .filter(s => s.current_class === activeClassInfo.class && s.current_section === activeClassInfo.section)
      .map(s => {
        const attPct = getStudentAttendancePct(s.id);
        let status = "Good";
        if (attPct < 75) status = "Critical";
        else if (attPct < 85) status = "Warning";
        else if (attPct >= 95) status = "Excellent";

        return {
          id: s.id,
          rollNo: s.roll_number?.toString() || "-",
          name: `${s.first_name} ${s.last_name}`,
          attendance: attPct,
          grade: getStudentLatestGrade(s.id),
          status: status,
          avatar: `${s.first_name.charAt(0)}${s.last_name.charAt(0)}`,
          originalData: s
        };
      })
      .sort((a, b) => (parseInt(a.rollNo) || 0) - (parseInt(b.rollNo) || 0));
  }, [selectedClassId, allAssignedStudents, attendanceLogs, termGrades]);

  const classesWithStats = useMemo(() => {
    return myClasses.map(cls => {
      const cStudents = allAssignedStudents.filter(s => s.current_class === cls.class && s.current_section === cls.section);
      if (cStudents.length === 0) return { ...cls, avgAttendance: "0%", classAvg: "N/A" };
      
      const attSum = cStudents.reduce((acc, s) => acc + getStudentAttendancePct(s.id), 0);
      const avgAtt = Math.round(attSum / cStudents.length);
      
      return {
        ...cls,
        avgAttendance: `${avgAtt}%`,
        classAvg: "Active" 
      };
    });
  }, [myClasses, allAssignedStudents, attendanceLogs, termGrades]);

  const filteredStudents = currentRoster.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNo.includes(searchQuery) || s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- DYNAMIC DOSSIER GENERATION ---
  const activeStudent = currentRoster.find(s => s.id === selectedStudentId);
  
  const studentProfileData = useMemo(() => {
    if (!selectedStudentId) return null;
    
    // 1. Term Grades (Major Exams)
    const myGrades = termGrades.filter(g => g.student_id === selectedStudentId);
    const termsList = ["Term 1", "Term 2", "Term 3"];
    const mappedExams = termsList.map(tName => {
      const found = myGrades.find(g => g.term === tName);
      return {
        name: found ? `${found.term} Exam` : `${tName} Exam`,
        score: found ? found.percentage : null,
        total: 100, 
        average: found ? "Available" : null,
        date: found ? new Date(found.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric'}) : "Upcoming",
        subject: found ? found.subject : ""
      };
    });

    // 2. Filter Continuous Marks by Student & Subject
    const myMarks = continuousMarks.filter(m => m.student_id === selectedStudentId && m.subject === activeClassInfo?.subject);

    // 3. Map Quizzes
    const quizzes = myMarks.filter(m => m.category === 'Quiz').map(q => ({
      name: q.assessment_name,
      type: q.assessment_name.toLowerCase().includes('surprise') ? 'Surprise' : 'Monthly',
      score: q.score || 0,
      total: q.max_score
    }));

    // 4. Map Internal Assessments
    const internals = myMarks.filter(m => m.category === 'Internal').map(i => ({
      category: i.assessment_name,
      score: i.score || 0,
      total: i.max_score
    }));

    // 5. Map Cognitive/Skills (Calculates % for the bars)
    const understanding = myMarks.filter(m => m.category === 'Skill').map(s => ({
      skill: s.assessment_name,
      percentage: s.max_score > 0 ? Math.round(((s.score || 0) / s.max_score) * 100) : 0
    }));

    // Fallbacks if tables are empty
    const fallbackQuizzes = quizzes.length > 0 ? quizzes : [{ name: "No quizzes logged yet", type: "Monthly", score: 0, total: 10 }];
    const fallbackInternals = internals.length > 0 ? internals : [{ category: "No internals logged yet", score: 0, total: 10 }];
    const fallbackUnderstanding = understanding.length > 0 ? understanding : [{ skill: "No data available", percentage: 0 }];

    return {
      majorExams: mappedExams,
      quizzes: fallbackQuizzes,
      internals: fallbackInternals,
      understanding: fallbackUnderstanding
    };
  }, [selectedStudentId, termGrades, continuousMarks, activeClassInfo]);

  if (isLoading) return <div className="flex h-screen items-center justify-center w-full"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto h-full flex flex-col relative pb-24 overflow-x-hidden min-w-0">
      
      <AnimatePresence mode="wait">
        
        {/* ================= TIER 1: CLASSES OVERVIEW GRID ================= */}
        {!selectedClassId && !selectedStudentId && (
          <motion.div key="tier-1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 w-full min-w-0">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full min-w-0">
              <div className="min-w-0 w-full">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 truncate">
                  <LayoutGrid className="w-8 h-8 text-blue-600 shrink-0" /> <span className="truncate">My Assigned Classes</span>
                </h1>
                <p className="text-slate-500 font-medium mt-1 text-sm truncate">Select a class to manage students, attendance, and grades.</p>
              </div>
            </div>

            {classesWithStats.length === 0 ? (
               <div className="bg-white p-10 rounded-[2rem] border border-slate-200 text-center">
                 <h3 className="text-xl font-black text-slate-800 mb-2">No Classes Assigned</h3>
                 <p className="text-slate-500">Contact the principal to assign you to a class schedule.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {classesWithStats.map((cls, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={cls.id} 
                    onClick={() => { setSelectedClassId(cls.id); setSearchQuery(""); }}
                    className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col min-w-0"
                  >
                    <div className={`h-24 p-6 flex justify-between items-start relative overflow-hidden ${cls.isClassTeacher ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                      {cls.isClassTeacher && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>}
                      <div className="relative z-10 min-w-0 pr-2">
                        <h3 className="text-2xl font-black leading-none truncate">{cls.class}</h3>
                        <p className={`text-sm font-bold mt-1 truncate ${cls.isClassTeacher ? 'text-purple-200' : 'text-slate-500'}`}>Section {cls.section}</p>
                      </div>
                      {cls.isClassTeacher && <span className="relative z-10 bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 whitespace-nowrap"><Award className="w-3.5 h-3.5 shrink-0"/> Class Teacher</span>}
                    </div>

                    <div className="p-6 flex-1 flex flex-col w-full min-w-0">
                      <div className="grid grid-cols-3 gap-4 mb-6 w-full">
                        <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 truncate">Students</p><p className="text-xl font-black text-slate-800 flex items-center gap-1.5 truncate"><Users className="w-4 h-4 text-slate-400 shrink-0"/>{cls.totalStudents}</p></div>
                        <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 truncate">Attendance</p><p className="text-xl font-black text-emerald-600 truncate">{cls.avgAttendance}</p></div>
                        <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 truncate">Status</p><p className="text-xl font-black text-blue-600 truncate">{cls.classAvg}</p></div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-bold text-slate-500 text-blue-600 w-full min-w-0">
                         <span className="truncate pr-2">Subject: {cls.subject}</span>
                         <span className="flex items-center gap-1 uppercase tracking-widest text-[10px] shrink-0 whitespace-nowrap">Open Roster <ChevronRight className="w-4 h-4 shrink-0"/></span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}


        {/* ================= TIER 2: CLASS ROSTER ================= */}
        {selectedClassId && !selectedStudentId && activeClassInfo && (
          <motion.div key="tier-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex flex-col h-full w-full min-w-0">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 w-full min-w-0">
              <div className="min-w-0 w-full">
                <button onClick={() => setSelectedClassId(null)} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold mb-3 transition-colors text-sm uppercase tracking-widest truncate">
                  <ArrowLeft className="w-4 h-4 shrink-0"/> Back to Classes
                </button>
                <div className="flex items-center gap-3 min-w-0 w-full">
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight truncate">{activeClassInfo.class} - {activeClassInfo.section}</h1>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border shrink-0 whitespace-nowrap ${activeClassInfo.isClassTeacher ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{activeClassInfo.subject}</span>
                </div>
              </div>
              
              {/* --- ACTIVATED BUTTONS: Now using Link to route to Attendance and Marks --- */}
              <div className="flex gap-2 w-full md:w-auto shrink-0">
                <Link href="/teacher/dashboard/attendance" className="flex-1 md:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                  <ClipboardCheck className="w-4 h-4 shrink-0" /> Log Attendance
                </Link>
                <Link href="/teacher/dashboard/marks" className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                  <PenTool className="w-4 h-4 shrink-0" /> Enter Marks
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[500px] w-full">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0 w-full">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search student name or roll..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-blue-500 text-sm font-medium" />
                </div>
              </div>

              {/* Roster Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 w-full">
                <div className="col-span-1">Roll</div><div className="col-span-4">Student Name</div><div className="col-span-2">Attendance</div><div className="col-span-2">Grade</div><div className="col-span-2">Status</div><div className="col-span-1 text-right">View</div>
              </div>

              {/* Roster List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 space-y-2 w-full">
                {filteredStudents.length === 0 ? (
                  <div className="text-center p-10 text-slate-400 font-bold">No students found.</div>
                ) : (
                  filteredStudents.map((student) => (
                    <div key={student.id} onClick={() => setSelectedStudentId(student.id)} className="group bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center cursor-pointer w-full min-w-0">
                      
                      <div className="col-span-1"><span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-black text-sm flex items-center justify-center border border-slate-200">{student.rollNo}</span></div>
                      
                      <div className="col-span-4 flex items-center gap-3 min-w-0 w-full">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-black shrink-0">{student.avatar}</div>
                        <div className="min-w-0 flex-1"><p className="font-black text-slate-800 group-hover:text-blue-600 transition-colors truncate">{student.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{student.id}</p></div>
                      </div>

                      <div className="col-span-2 min-w-0 w-full">
                        <span className={`text-sm font-black ${student.attendance >= 90 ? 'text-emerald-600' : student.attendance >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{student.attendance}%</span>
                        <div className="w-full max-w-[100px] bg-slate-100 rounded-full h-1.5 mt-1.5"><div className={`h-1.5 rounded-full ${student.attendance >= 90 ? 'bg-emerald-500' : student.attendance >= 75 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${student.attendance}%` }}></div></div>
                      </div>

                      <div className="col-span-2 min-w-0"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm border bg-slate-50 text-slate-700 border-slate-200 shrink-0">{student.grade}</span></div>

                      <div className="col-span-2 min-w-0 w-full">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border truncate ${student.status === 'Excellent' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : student.status === 'Warning' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                          {student.status === 'Critical' || student.status === 'Warning' ? <AlertCircle className="w-3 h-3 shrink-0"/> : <TrendingUp className="w-3 h-3 shrink-0"/>} <span className="truncate">{student.status}</span>
                        </span>
                      </div>

                      <div className="col-span-1 text-right flex items-center justify-end shrink-0"><ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" /></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}


        {/* ================= TIER 3: STUDENT DOSSIER ================= */}
        {selectedStudentId && activeStudent && studentProfileData && (
          <motion.div key="tier-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex flex-col h-full w-full min-w-0">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 w-full min-w-0">
              <div className="min-w-0 w-full">
                <button onClick={() => { setSelectedStudentId(null); setProfileTab("Academics"); }} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold mb-3 transition-colors text-sm uppercase tracking-widest truncate">
                  <ArrowLeft className="w-4 h-4 shrink-0"/> Back to {activeClassInfo?.class} Roster
                </button>
                <div className="flex items-center gap-4 min-w-0 w-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">{activeStudent.avatar}</div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 truncate">{activeStudent.name}</h1>
                    <p className="text-slate-500 font-bold text-sm mt-1 truncate">Roll No: {activeStudent.rollNo} • ID: {activeStudent.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 shrink-0">
                <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-sm flex flex-col items-center justify-center min-w-[120px]"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Overall Grade</span><span className="text-xl font-black text-emerald-600">{activeStudent.grade}</span></div>
                <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-sm flex flex-col items-center justify-center min-w-[120px]"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Attendance</span><span className="text-xl font-black text-blue-600">{activeStudent.attendance}%</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 flex-1 w-full min-w-0">
              
              {/* Left Col: Analytics */}
              <div className="flex flex-col gap-6 w-full min-w-0">
                <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl p-6 relative overflow-hidden w-full">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-bl-full blur-3xl"></div>
                  <h3 className="font-black text-white text-lg flex items-center gap-2 mb-6 relative z-10 truncate"><BrainCircuit className="w-5 h-5 text-blue-400 shrink-0"/> Cognitive Profiling</h3>
                  <div className="space-y-5 relative z-10 w-full">
                    {studentProfileData.understanding.map((item, idx) => (
                      <div key={idx} className="w-full">
                        <div className="flex justify-between items-end mb-1.5 w-full"><span className="text-xs font-bold text-slate-300 truncate pr-2">{item.skill}</span><span className="text-xs font-black text-blue-400 shrink-0">{item.percentage}%</span></div>
                        <div className="w-full bg-slate-800 rounded-full h-2"><div className={`h-2 rounded-full ${item.percentage >= 90 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${item.percentage}%` }}/></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-5 border-t border-slate-800 relative z-10 w-full">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex gap-3 w-full"><Sparkles className="w-5 h-5 text-blue-400 shrink-0"/><p className="text-xs text-blue-100/80 font-medium">AI Insight: Marks entered in the Continuous Evaluation tool automatically populate this profile.</p></div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 w-full min-w-0">
                  <h3 className="font-black text-slate-800 text-lg flex items-center gap-2 mb-6 truncate"><Target className="w-5 h-5 text-purple-500 shrink-0"/> Internal Assessments</h3>
                  <div className="space-y-4 w-full">
                    {studentProfileData.internals.map((internal, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl w-full min-w-0">
                        <span className="text-sm font-bold text-slate-600 truncate pr-2">{internal.category}</span>
                        <div className="text-right shrink-0"><span className="text-lg font-black text-slate-800">{internal.score}</span><span className="text-xs font-bold text-slate-400">/{internal.total}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Col: Exams */}
              <div className="xl:col-span-2 flex flex-col gap-6 w-full min-w-0">
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col w-full min-w-0">
                  <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 w-full shrink-0">
                    <button onClick={() => setProfileTab("Academics")} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all truncate px-2 ${profileTab === "Academics" ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Major Examinations</button>
                    <button onClick={() => setProfileTab("Quizzes")} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all truncate px-2 ${profileTab === "Quizzes" ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Quizzes & Tests</button>
                  </div>

                  <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar w-full">
                    {profileTab === "Academics" && (
                      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100 w-full">
                        {studentProfileData.majorExams.map((exam, idx) => (
                          <div key={idx} className="relative flex items-start gap-6 w-full min-w-0">
                            <div className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shrink-0 relative z-10 shadow-sm ${exam.score ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {exam.score ? <CheckCircle2 className="w-5 h-5"/> : <Clock className="w-5 h-5"/>}
                            </div>
                            <div className={`flex-1 p-5 rounded-2xl border min-w-0 w-full ${exam.score ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                              <div className="flex justify-between items-start sm:items-center mb-4 flex-col sm:flex-row gap-2 w-full">
                                <div className="min-w-0 flex-1 pr-2">
                                  <h4 className="font-black text-lg text-slate-800 truncate">{exam.name}</h4>
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{exam.date} {exam.subject && `• ${exam.subject}`}</p>
                                </div>
                                {exam.score ? (
                                  <div className="text-right shrink-0"><span className="text-3xl font-black text-blue-600">{exam.score}%</span></div>
                                ) : (
                                  <span className="px-3 py-1 bg-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest rounded-lg shrink-0">Upcoming</span>
                                )}
                              </div>
                              {exam.score && (
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between w-full">
                                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 truncate"><LineChart className="w-4 h-4 shrink-0"/> Status: {exam.average}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {profileTab === "Quizzes" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
                        {studentProfileData.quizzes.map((quiz, idx) => {
                          const percentage = quiz.total > 0 ? (quiz.score / quiz.total) * 100 : 0;
                          return (
                            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-200 hover:shadow-md transition-all w-full min-w-0">
                              <div className="flex justify-between items-start mb-3 w-full gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shrink-0 whitespace-nowrap ${quiz.type === 'Surprise' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{quiz.type} Quiz</span>
                                <span className="text-lg font-black text-slate-800 shrink-0">{quiz.score}<span className="text-xs text-slate-400">/{quiz.total}</span></span>
                              </div>
                              <h4 className="font-bold text-slate-700 text-sm mb-3 truncate">{quiz.name}</h4>
                              <div className="w-full bg-slate-100 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${percentage >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${percentage}%` }}></div></div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}