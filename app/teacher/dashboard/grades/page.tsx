"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/supabase";
import { 
  ShieldCheck, Lock, Save, Download, 
  Search, CheckCircle2, Calculator, 
  ShieldAlert, BookOpen, AlertCircle, Loader2
} from "lucide-react";

const termCycles = [
  { id: "Term 1", name: "Term 1 (Quarterly Cycle)" },
  { id: "Term 2", name: "Term 2 (Half-Yearly Cycle)" },
  { id: "Term 3", name: "Term 3 (Final/Yearly Cycle)" },
];

export default function SecureGradebook() {
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic DB States
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [currentRoster, setCurrentRoster] = useState<any[]>([]);
  const [rubricColumns, setRubricColumns] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, Record<string, string>>>({});
  
  // UI States
  const [activeClassId, setActiveClassId] = useState("");
  const [activeTerm, setActiveTerm] = useState(termCycles[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Security State
  const [isLocked, setIsLocked] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);

  // --- INITIALIZATION ---
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
        await fetchAssignments(activeEmpId);
      }
    } catch (err) {
      console.error("Auth fetch failed", err);
    }
  };

  const fetchAssignments = async (empId: string) => {
    try {
      // Fetch classes assigned to this teacher
      const { data: assignments } = await supabase.from('class_assignments').select('*').eq('teacher_id', empId);
      
      if (assignments && assignments.length > 0) {
        const mapped = assignments.map(a => ({
          id: a.id,
          class_name: a.class_name,
          section: a.section,
          subject: a.subject,
          displayName: `${a.class_name}-${a.section}`
        }));
        setAssignedClasses(mapped);
        setActiveClassId(mapped[0].id); // Trigger subsequent fetches via useEffect
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  // --- FETCH MATRIX DATA WHEN CLASS OR TERM CHANGES ---
  useEffect(() => {
    if (activeClassId && activeTerm) {
      fetchMatrixData();
    }
  }, [activeClassId, activeTerm]);

  const fetchMatrixData = async () => {
    setIsLoading(true);
    try {
      const classInfo = assignedClasses.find(c => c.id === activeClassId);
      if (!classInfo) return;

      // 1. Fetch Dynamic Rubric set by Exam Dept
      const { data: rubricData } = await supabase
        .from('exam_rubrics')
        .select('columns')
        .eq('term', activeTerm)
        .eq('class_name', classInfo.class_name)
        .eq('subject', classInfo.subject)
        .single();

      if (rubricData && rubricData.columns) {
        setRubricColumns(rubricData.columns);
      } else {
        setRubricColumns([]); // No rubric defined yet
      }

      // 2. Fetch Active Roster
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, first_name, last_name, roll_number')
        .eq('current_class', classInfo.class_name)
        .eq('current_section', classInfo.section)
        .eq('status', 'Active')
        .order('roll_number', { ascending: true });

      setCurrentRoster(studentsData || []);

      // 3. Fetch Existing Grades
      if (studentsData && studentsData.length > 0) {
        const studentIds = studentsData.map(s => s.id);
        const { data: gradesData } = await supabase
          .from('student_term_grades')
          .select('*')
          .in('student_id', studentIds)
          .eq('term', activeTerm)
          .eq('subject', classInfo.subject);

        const loadedGrades: Record<string, Record<string, string>> = {};
        let lockStatus = false;

        (gradesData || []).forEach(record => {
          loadedGrades[record.student_id] = record.marks_matrix || {};
          if (record.is_locked) lockStatus = true; // If one is locked, lock the whole grid
        });

        setGrades(loadedGrades);
        setIsLocked(lockStatus);
      }

    } catch (err) {
      console.error("Error loading matrix", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleGradeChange = (studentId: string, colId: string, value: string, max: number) => {
    if (isLocked) return;
    if (value === "" || /^\d+$/.test(value)) {
      const numVal = parseInt(value);
      if (!numVal || numVal <= max) {
        setGrades(prev => ({
          ...prev,
          [studentId]: { ...(prev[studentId] || {}), [colId]: value }
        }));
      }
    }
  };

  const handleSaveData = async (lockMatrix: boolean = false) => {
    if (!currentUser) return;
    setIsSaving(true);
    
    try {
      const classInfo = assignedClasses.find(c => c.id === activeClassId)!;
      
      const payload = currentRoster.map(student => {
        const matrix = grades[student.id] || {};
        const calc = calculateStudentTotal(student.id);
        
        return {
          student_id: student.id,
          term: activeTerm,
          subject: classInfo.subject,
          marks_matrix: matrix,
          total_score: calc.total === "-" ? null : calc.total,
          percentage: calc.percentage === "-" ? null : parseFloat(calc.percentage),
          grade_letter: calc.letter === "-" ? null : calc.letter,
          is_locked: lockMatrix,
          updated_by: currentUser.id,
          updated_at: new Date().toISOString()
        };
      });

      const { error } = await supabase.from('student_term_grades').upsert(payload, { onConflict: 'student_id, term, subject' });
      if (error) throw error;

      if (lockMatrix) {
        setIsLocked(true);
        setShowLockModal(false);
      } else {
        alert("Draft Saved Successfully!");
      }

    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };


  // --- CALCULATIONS ---
  const MAX_TOTAL = useMemo(() => rubricColumns.reduce((acc, col) => acc + (parseInt(col.max) || 0), 0), [rubricColumns]);

  const calculateStudentTotal = (studentId: string) => {
    const studentGrades = grades[studentId] || {};
    let total = 0;
    let entries = 0;
    
    rubricColumns.forEach(col => {
      if (studentGrades[col.id]) {
        total += parseInt(studentGrades[col.id]);
        entries++;
      }
    });

    if (entries === 0 || MAX_TOTAL === 0) return { total: "-", percentage: "-", letter: "-", color: "text-slate-400" };

    const percentage = Math.round((total / MAX_TOTAL) * 100);
    
    let letter = "F"; let color = "text-red-600 bg-red-50";
    if (percentage >= 90) { letter = "A1"; color = "text-emerald-700 bg-emerald-50 border-emerald-200"; }
    else if (percentage >= 80) { letter = "A2"; color = "text-emerald-600 bg-emerald-50 border-emerald-100"; }
    else if (percentage >= 70) { letter = "B1"; color = "text-blue-600 bg-blue-50 border-blue-200"; }
    else if (percentage >= 60) { letter = "B2"; color = "text-indigo-600 bg-indigo-50 border-indigo-200"; }
    else if (percentage >= 40) { letter = "C"; color = "text-amber-600 bg-amber-50 border-amber-200"; }
    else if (percentage >= 33) { letter = "D"; color = "text-orange-600 bg-orange-50 border-orange-200"; }

    return { total, percentage: `${percentage}%`, letter, color };
  };

  // --- DERIVED DATA ---
  const currentClassInfo = assignedClasses.find(c => c.id === activeClassId);
  const filteredStudents = currentRoster.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.roll_number && s.roll_number.toString().includes(searchQuery))
  );

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  }

  if (assignedClasses.length === 0) {
    return (
      <div className="flex h-[85vh] w-full items-center justify-center p-6">
        <div className="text-center bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm max-w-md">
          <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">No Subjects Assigned</h2>
          <p className="text-slate-500 font-medium text-sm">You have not been assigned as a subject teacher for any classes yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto h-full flex flex-col relative pb-24 space-y-6 min-w-0">
      
      {/* ================= HEADER & SECURITY BANNER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden w-full min-w-0">
        <div className="absolute -right-10 -top-10 text-slate-50 opacity-50 pointer-events-none"><ShieldCheck className="w-64 h-64" /></div>

        <div className="relative z-10 min-w-0">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLocked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-900 text-white'}`}>
              {isLocked ? <Lock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <span className="truncate">Master Gradebook Matrix</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm flex items-center gap-2 truncate">Continuous evaluation ledger powered by Exam Dept Rubrics.</p>
        </div>
        
        <div className="relative z-10 flex gap-3 w-full md:w-auto shrink-0">
          {!isLocked && rubricColumns.length > 0 ? (
            <>
              <button onClick={() => handleSaveData(false)} disabled={isSaving} className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 whitespace-nowrap">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} Save Draft
              </button>
              <button onClick={() => setShowLockModal(true)} disabled={isSaving} className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70">
                <Lock className="w-4 h-4" /> Lock & Submit
              </button>
            </>
          ) : isLocked ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-sm whitespace-nowrap">
              <CheckCircle2 className="w-5 h-5" /> Matrix Locked
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-[600px] w-full min-w-0">
        
        {/* ================= LEFT: CONTROLS & INFO ================= */}
        <div className="xl:col-span-3 flex flex-col gap-6 w-full min-w-0">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sticky top-6">
            <h2 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Calculator className="w-5 h-5 text-blue-500"/> Configuration</h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assigned Class</label>
                <select disabled={isLocked} value={activeClassId} onChange={e => {setActiveClassId(e.target.value); setSearchQuery("");}} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-60 appearance-none cursor-pointer">
                  {assignedClasses.map(c => <option key={c.id} value={c.id}>{c.displayName} - {c.subject}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Evaluation Cycle</label>
                <select disabled={isLocked} value={activeTerm} onChange={e => setActiveTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-60 appearance-none cursor-pointer">
                  {termCycles.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Rubric Breakdown (Max {MAX_TOTAL})</h3>
              {rubricColumns.length > 0 ? (
                <div className="space-y-2">
                  {rubricColumns.map((col: any) => (
                    <div key={col.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-600">
                      <span>{col.name}</span><span className="text-slate-400">{col.max} pts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl border border-amber-200 text-center">
                  Exam Department has not configured a rubric for this cycle yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT: THE HORIZONTAL SPREADSHEET MATRIX ================= */}
        <div className="xl:col-span-9 flex flex-col h-full w-full min-w-0">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden w-full">
            
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0 w-full min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0"><BookOpen className="w-5 h-5 text-slate-600"/></div>
                <div className="min-w-0">
                  <h2 className="font-black text-slate-800 truncate">{termCycles.find(t=>t.id===activeTerm)?.name}</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{currentClassInfo?.displayName} • {currentClassInfo?.subject}</p>
                </div>
              </div>
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search student..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-blue-500 text-sm font-medium shadow-sm" />
              </div>
            </div>

            {/* THE SPREADSHEET */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/30 w-full relative">
              {rubricColumns.length === 0 ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <ShieldAlert className="w-16 h-16 text-amber-300 mb-4" />
                    <h3 className="text-xl font-black text-slate-800 mb-2">Awaiting Rubric Criteria</h3>
                    <p className="text-slate-500 max-w-md">You cannot enter grades because the Exam Department has not defined the maximum marks or criteria (HW, CW, etc.) for this term.</p>
                 </div>
              ) : (
                <div className="min-w-max">
                  
                  {/* MATRIX HEADER */}
                  <div className="flex border-b border-slate-300 bg-slate-200/50 text-[10px] font-black uppercase tracking-widest text-slate-600 sticky top-0 z-20 backdrop-blur-md">
                    <div className="w-64 flex shrink-0 sticky left-0 bg-slate-100 border-r border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-30">
                      <div className="w-16 p-4 border-r border-slate-200 text-center flex items-center justify-center">Roll</div>
                      <div className="flex-1 p-4 flex items-center">Student Name</div>
                    </div>
                    {rubricColumns.map((col: any) => (
                      <div key={col.id} className={`w-24 p-4 text-center border-r border-slate-200 flex flex-col items-center justify-center gap-1 bg-white`}>
                        <span className="truncate w-full text-slate-700" title={col.name}>{col.short || col.name.substring(0,4)}</span>
                        <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Max {col.max}</span>
                      </div>
                    ))}
                    <div className="w-48 flex shrink-0 sticky right-0 bg-slate-100 border-l border-slate-300 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-30">
                      <div className="w-20 p-4 border-r border-slate-200 text-center flex items-center justify-center">Total</div>
                      <div className="flex-1 p-4 text-center flex items-center justify-center">Grade</div>
                    </div>
                  </div>

                  {/* MATRIX ROWS */}
                  <div className="bg-white pb-10">
                    {filteredStudents.map((student, idx) => {
                      const studentData = grades[student.id] || {};
                      const calc = calculateStudentTotal(student.id);
                      
                      return (
                        <div key={student.id} className={`flex border-b border-slate-100 transition-colors hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                          
                          <div className="w-64 flex shrink-0 sticky left-0 bg-inherit border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10 group">
                            <div className="w-16 p-3 border-r border-slate-100 text-center font-black text-slate-400 flex items-center justify-center group-hover:text-blue-500">{student.roll_number || "-"}</div>
                            <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                              <p className="font-black text-slate-800 truncate">{student.first_name} {student.last_name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{student.id}</p>
                            </div>
                          </div>

                          {/* HIGH CONTRAST INPUT CELLS */}
                          {rubricColumns.map((col: any) => (
                            <div key={col.id} className={`w-24 p-2 border-r border-slate-100 flex items-center justify-center bg-transparent`}>
                              <input 
                                type="text" 
                                value={studentData[col.id] || ""}
                                onChange={(e) => handleGradeChange(student.id, col.id, e.target.value, col.max)}
                                disabled={isLocked}
                                placeholder="--"
                                className={`w-full text-center font-black text-sm py-2 rounded-lg outline-none transition-all ${
                                  isLocked 
                                    ? 'bg-transparent text-slate-600' 
                                    : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-inner placeholder:text-slate-300'
                                }`}
                              />
                            </div>
                          ))}

                          <div className={`w-48 flex shrink-0 sticky right-0 bg-inherit border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10`}>
                            <div className="w-20 p-3 border-r border-slate-100 text-center flex flex-col items-center justify-center bg-slate-50/50">
                              <span className="font-black text-slate-800 text-lg leading-none">{calc.total}</span>
                              <span className="text-[9px] font-bold text-slate-400">{calc.percentage}</span>
                            </div>
                            <div className="flex-1 p-3 flex items-center justify-center">
                              {calc.letter !== "-" ? (
                                <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg border shadow-sm ${calc.color}`}>
                                  {calc.letter}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-black">-</span>
                              )}
                            </div>
                          </div>

                        </div>
                      )
                    })}
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= LOCK CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {showLockModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-inner"><ShieldAlert className="w-10 h-10" /></div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Lock Master Matrix?</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">
                You are about to digitally sign and submit the complete <strong className="text-slate-700">{termCycles.find(t=>t.id===activeTerm)?.name}</strong> evaluation matrix for <strong className="text-slate-700">{currentClassInfo?.displayName}</strong> to the Principal's office. <br/><br/>
                <span className="text-red-500 font-bold flex items-center justify-center gap-1"><AlertCircle className="w-4 h-4"/> This will generate Report Cards.</span>
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowLockModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all">Cancel</button>
                <button onClick={() => handleSaveData(true)} disabled={isSaving} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Lock className="w-4 h-4" />} Confirm & Lock
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}