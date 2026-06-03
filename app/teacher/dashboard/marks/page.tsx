"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/supabase";
import { 
  PenTool, Save, Search, Users, 
  Target, ShieldCheck, BrainCircuit, 
  FileQuestion, Loader2, CheckCircle2, 
  ChevronRight, History, Edit3
} from "lucide-react";

const assessmentCategories = [
  { id: "Quiz", name: "Quizzes & Tests", icon: <FileQuestion className="w-4 h-4"/>, color: "text-blue-600 bg-blue-50" },
  { id: "Internal", name: "Internal Assessments", icon: <Target className="w-4 h-4"/>, color: "text-purple-600 bg-purple-50" },
  { id: "Major Exam", name: "Major Examinations", icon: <ShieldCheck className="w-4 h-4"/>, color: "text-emerald-600 bg-emerald-50" },
  { id: "Skill", name: "Cognitive/Skills", icon: <BrainCircuit className="w-4 h-4"/>, color: "text-orange-600 bg-orange-50" },
];

export default function DailyMarksEntry() {
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Live DB States
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [currentRoster, setCurrentRoster] = useState<any[]>([]);
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
  
  // Form & Entry States
  const [activeTab, setActiveTab] = useState<"Entry" | "History">("Entry");
  const [activeClassId, setActiveClassId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Assessment Configuration
  const [assessment, setAssessment] = useState({
    category: "Quiz",
    name: "",
    maxScore: "10",
    date: new Date().toISOString().split('T')[0]
  });

  // Marks Dictionary: { "STU-001": "9.5", "STU-002": "8" }
  const [marksData, setMarksData] = useState<Record<string, string>>({});

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
      const { data: assignments } = await supabase.from('class_assignments').select('*').eq('teacher_id', empId);
      
      if (assignments && assignments.length > 0) {
        const mapped = assignments.map(a => ({
          id: `${a.class_name}-${a.section}-${a.subject}`,
          class_name: a.class_name,
          section: a.section,
          subject: a.subject,
          displayName: `${a.class_name}-${a.section}`
        }));
        setAssignedClasses(mapped);
        setActiveClassId(mapped[0].id);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  // When class changes, fetch the roster & history log
  useEffect(() => {
    if (activeClassId) {
      fetchRoster();
      fetchHistory();
    }
  }, [activeClassId]);

  const fetchRoster = async () => {
    setIsLoading(true);
    const classInfo = assignedClasses.find(c => c.id === activeClassId);
    if (!classInfo) return;

    const { data: studentsData } = await supabase
      .from('students')
      .select('id, first_name, last_name, roll_number')
      .eq('current_class', classInfo.class_name)
      .eq('current_section', classInfo.section)
      .eq('status', 'Active')
      .order('roll_number', { ascending: true });

    setCurrentRoster(studentsData || []);
    setIsLoading(false);
  };

  const fetchHistory = async () => {
    if (!currentUser) return;
    const classInfo = assignedClasses.find(c => c.id === activeClassId);
    if (!classInfo) return;

    const { data } = await supabase
      .from('student_marks')
      .select('category, assessment_name, max_score, assessment_date')
      .eq('teacher_id', currentUser.id)
      .eq('class_name', classInfo.class_name)
      .eq('section', classInfo.section)
      .eq('subject', classInfo.subject);

    if (data) {
      // Deduplicate the results (since multiple students share the same assessment name)
      const uniqueAssessments: any[] = [];
      const seen = new Set();
      data.forEach(item => {
        const key = `${item.category}-${item.assessment_name}-${item.assessment_date}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueAssessments.push(item);
        }
      });
      // Sort newest first
      uniqueAssessments.sort((a, b) => new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime());
      setAssessmentHistory(uniqueAssessments);
    }
  };

  // Attempt to load existing marks if the teacher types a name that already exists
  useEffect(() => {
    const loadExistingMarks = async () => {
      if (!assessment.name || assessment.name.length < 3 || !activeClassId) return;
      
      const classInfo = assignedClasses.find(c => c.id === activeClassId);
      if (!classInfo) return;

      const { data } = await supabase
        .from('student_marks')
        .select('student_id, score, max_score')
        .eq('subject', classInfo.subject)
        .eq('category', assessment.category)
        .ilike('assessment_name', assessment.name);

      if (data && data.length > 0) {
        const loaded: Record<string, string> = {};
        data.forEach(m => {
          if (m.score !== null) loaded[m.student_id] = m.score.toString();
        });
        setMarksData(loaded);
        if (data[0].max_score) setAssessment(prev => ({ ...prev, maxScore: data[0].max_score.toString() }));
      } else {
        setMarksData({}); // Reset if it's a completely new assessment name
      }
    };

    const debounce = setTimeout(() => {
      loadExistingMarks();
    }, 800);

    return () => clearTimeout(debounce);
  }, [assessment.name, assessment.category, activeClassId]);


  const handleScoreChange = (studentId: string, val: string) => {
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      const numVal = parseFloat(val);
      const max = parseFloat(assessment.maxScore) || 0;
      
      if (!numVal || numVal <= max) {
        setMarksData(prev => ({ ...prev, [studentId]: val }));
      }
    }
  };

  const handleSaveMarks = async () => {
    if (!currentUser || !assessment.name || !assessment.maxScore) {
      alert("Please provide an Assessment Name and Max Score.");
      return;
    }
    
    setIsSaving(true);
    const classInfo = assignedClasses.find(c => c.id === activeClassId)!;
    
    try {
      const payload = currentRoster.map(student => ({
        student_id: student.id,
        teacher_id: currentUser.id,
        class_name: classInfo.class_name,
        section: classInfo.section,
        subject: classInfo.subject,
        category: assessment.category,
        assessment_name: assessment.name,
        score: marksData[student.id] ? parseFloat(marksData[student.id]) : null,
        max_score: parseFloat(assessment.maxScore),
        assessment_date: assessment.date
      }));

      const { error } = await supabase.from('student_marks').upsert(payload, { 
        onConflict: 'student_id, subject, category, assessment_name' 
      });

      if (error) throw error;
      
      // Success! Alert, Reset Form, and Refresh History
      alert(`Success! Marks for "${assessment.name}" have been saved securely.`);
      setAssessment(prev => ({ ...prev, name: "" }));
      setMarksData({});
      fetchHistory();
      setActiveTab("History");

    } catch (err: any) {
      alert("Failed to save marks: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const loadPastAssessment = (pastAssn: any) => {
    setAssessment({
      category: pastAssn.category,
      name: pastAssn.assessment_name,
      maxScore: pastAssn.max_score.toString(),
      date: pastAssn.assessment_date
    });
    setActiveTab("Entry");
  };

  const filteredStudents = currentRoster.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.roll_number && s.roll_number.toString().includes(searchQuery))
  );

  if (isLoading && assignedClasses.length === 0) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto h-full flex flex-col relative pb-24 space-y-6 min-w-0">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm w-full min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
              <PenTool className="w-5 h-5" />
            </div>
            <span className="truncate">Continuous Evaluation Marks</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm flex items-center gap-2 truncate">Log daily activities, quizzes, and internal assessments for student dossiers.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
          <button onClick={handleSaveMarks} disabled={isSaving || !assessment.name} className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} Save Assessment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-[600px] w-full min-w-0">
        
        {/* ================= LEFT: CONFIGURATION ================= */}
        <div className="xl:col-span-4 flex flex-col gap-6 w-full min-w-0">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sticky top-6">
            <h2 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-blue-500"/> Assessment Details</h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assigned Class</label>
                <select value={activeClassId} onChange={e => setActiveClassId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500 appearance-none cursor-pointer">
                  {assignedClasses.map(c => <option key={c.id} value={c.id}>{c.displayName} - {c.subject}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {assessmentCategories.map(cat => (
                    <button 
                      key={cat.id} 
                      onClick={() => setAssessment({...assessment, category: cat.id})}
                      className={`p-2 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all ${assessment.category === cat.id ? `${cat.color} border-${cat.color.split('-')[1]}-200 shadow-sm` : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      {cat.icon} <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assessment Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Chapter 4 Surprise Test" 
                  value={assessment.name}
                  onChange={e => setAssessment({...assessment, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm placeholder:text-slate-300" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Maximum Marks</label>
                  <input 
                    type="number" 
                    placeholder="10" 
                    value={assessment.maxScore}
                    onChange={e => setAssessment({...assessment, maxScore: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Date</label>
                  <input 
                    type="date" 
                    value={assessment.date}
                    onChange={e => setAssessment({...assessment, date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" 
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <BrainCircuit className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-blue-800 leading-relaxed">
                  Marks entered here automatically build the student's cognitive profile and generate performance charts for parent-teacher meetings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT: DATA ENTRY / HISTORY GRID ================= */}
        <div className="xl:col-span-8 flex flex-col h-full w-full min-w-0">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden w-full">
            
            {/* Header Tabs */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0 w-full min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                  {activeTab === "Entry" ? <Users className="w-5 h-5 text-slate-600"/> : <History className="w-5 h-5 text-slate-600"/>}
                </div>
                <div className="min-w-0">
                  <h2 className="font-black text-slate-800 truncate">{assignedClasses.find(c => c.id === activeClassId)?.displayName || "Select Class"}</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                    {activeTab === "Entry" ? (assessment.name || "New Assessment") : "Assessment Log & History"}
                  </p>
                </div>
              </div>
              
              <div className="flex bg-slate-200/50 p-1 rounded-xl w-full sm:w-auto shrink-0">
                <button 
                  onClick={() => setActiveTab("Entry")} 
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === "Entry" ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Mark Entry
                </button>
                <button 
                  onClick={() => setActiveTab("History")} 
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === "History" ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  History Log
                </button>
              </div>
            </div>

            {/* TAB 1: SPREADSHEET */}
            {activeTab === "Entry" && (
              <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/30 w-full relative">
                {!assessment.name ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                      <FileQuestion className="w-16 h-16 text-slate-300 mb-4" />
                      <h3 className="text-xl font-black text-slate-800 mb-2">Define Assessment</h3>
                      <p className="text-slate-500 max-w-md">Please enter an Assessment Name on the left to activate the grading grid.</p>
                   </div>
                ) : (
                  <div className="min-w-full">
                    <div className="p-4 border-b border-slate-100 bg-white flex justify-end shrink-0 w-full">
                      <div className="relative w-full sm:w-64 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Search student..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-blue-500 text-sm font-medium shadow-sm" />
                      </div>
                    </div>

                    {/* MATRIX HEADER */}
                    <div className="flex border-b border-slate-200 bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 sticky top-0 z-20">
                      <div className="w-20 p-4 border-r border-slate-200 text-center flex items-center justify-center shrink-0">Roll</div>
                      <div className="flex-1 p-4 flex items-center min-w-[200px]">Student Name</div>
                      <div className="w-32 p-4 text-center border-l border-slate-200 flex flex-col items-center justify-center gap-1 shrink-0 bg-blue-50 text-blue-700">
                        <span>Score</span>
                        <span className="text-[8px] bg-blue-100 px-1.5 py-0.5 rounded text-blue-600">Max {assessment.maxScore || 0}</span>
                      </div>
                    </div>

                    {/* MATRIX ROWS */}
                    <div className="bg-white pb-10">
                      {filteredStudents.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-bold">No students found in this class.</div>
                      ) : (
                        filteredStudents.map((student, idx) => {
                          const currentVal = marksData[student.id] || "";
                          const pct = (parseFloat(currentVal) / parseFloat(assessment.maxScore)) * 100;
                          const isWarning = pct < 40 && currentVal !== "";

                          return (
                            <div key={student.id} className={`flex border-b border-slate-100 transition-colors hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                              
                              <div className="w-20 p-3 border-r border-slate-100 text-center font-black text-slate-400 flex items-center justify-center shrink-0">{student.roll_number || "-"}</div>
                              
                              <div className="flex-1 p-3 flex flex-col justify-center min-w-[200px]">
                                <p className="font-black text-slate-800 truncate">{student.first_name} {student.last_name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{student.id}</p>
                              </div>

                              {/* INPUT CELL */}
                              <div className="w-32 p-2 border-l border-slate-100 flex items-center justify-center shrink-0 bg-transparent">
                                <input 
                                  type="text" 
                                  value={currentVal}
                                  onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                  placeholder="--"
                                  className={`w-full text-center font-black text-lg py-2.5 rounded-xl outline-none transition-all shadow-inner ${
                                    isWarning 
                                    ? 'bg-red-50 border border-red-200 text-red-600 focus:ring-red-100' 
                                    : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                                  }`}
                                />
                              </div>

                            </div>
                          )
                        })
                      )}
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HISTORY LOG */}
            {activeTab === "History" && (
              <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/30 w-full">
                {assessmentHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <History className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-black text-slate-800 mb-2">No History Found</h3>
                    <p className="text-slate-500 max-w-md">Assessments that you successfully save will appear here for future editing and reference.</p>
                  </div>
                ) : (
                  <div className="p-6 grid gap-4">
                    {assessmentHistory.map((hist, idx) => {
                      const categoryInfo = assessmentCategories.find(c => c.id === hist.category) || assessmentCategories[0];
                      return (
                        <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${categoryInfo.color}`}>
                              {categoryInfo.icon}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-800 text-lg leading-none mb-1">{hist.assessment_name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {hist.category} • Max Marks: {hist.max_score} • Added {new Date(hist.assessment_date).toLocaleDateString('en-GB')}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => loadPastAssessment(hist)}
                            className="bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
                          >
                            <Edit3 className="w-4 h-4"/> Edit Scores
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}