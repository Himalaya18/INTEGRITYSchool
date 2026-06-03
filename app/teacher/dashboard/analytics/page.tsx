"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/supabase";
import { 
  PieChart, TrendingUp, TrendingDown, Users, 
  BrainCircuit, Sparkles, AlertTriangle, 
  BarChart3, Target, Medal, FileDown, Activity,
  ChevronDown, ArrowUpRight, Search, Eye, BookOpen, Loader2
} from "lucide-react";

export default function PerformanceAnalytics() {
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Live DB States
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [termGrades, setTermGrades] = useState<any[]>([]);
  const [continuousMarks, setContinuousMarks] = useState<any[]>([]);

  // UI States
  const [activeClassId, setActiveClassId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // --- 1. INITIALIZATION & DATA FETCHING ---
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
  };

  const fetchData = async (empId: string) => {
    try {
      // Fetch Class Assignments
      const { data: assignments } = await supabase.from('class_assignments').select('*').eq('teacher_id', empId);
      if (!assignments || assignments.length === 0) {
        setIsLoading(false);
        return;
      }

      const mappedClasses = assignments.map(a => ({
        id: `${a.class_name}-${a.section}-${a.subject}`,
        class_name: a.class_name,
        section: a.section,
        subject: a.subject,
        displayName: `${a.class_name}-${a.section}`
      }));
      setAssignedClasses(mappedClasses);
      setActiveClassId(mappedClasses[0].id);

      // Fetch Students
      const { data: students } = await supabase.from('students').select('id, first_name, last_name, current_class, current_section, roll_number').eq('status', 'Active');
      if (students) setAllStudents(students);

      // Fetch All Grades & Marks for this teacher
      const [gradesRes, marksRes] = await Promise.all([
        supabase.from('student_term_grades').select('*'), // In a production app, filter this by assigned students
        supabase.from('student_marks').select('*').eq('teacher_id', empId)
      ]);

      if (gradesRes.data) setTermGrades(gradesRes.data);
      if (marksRes.data) setContinuousMarks(marksRes.data);

    } catch (err) {
      console.error("Error fetching analytics data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. DATA PROCESSING ENGINE ---
  const analyticsData = useMemo(() => {
    if (!activeClassId || assignedClasses.length === 0) return null;

    const activeClassInfo = assignedClasses.find(c => c.id === activeClassId);
    if (!activeClassInfo) return null;

    const classStudents = allStudents.filter(s => s.current_class === activeClassInfo.class_name && s.current_section === activeClassInfo.section);
    const studentIds = classStudents.map(s => s.id);

    // Filter grades & marks for the active class
    const classGrades = termGrades.filter(g => studentIds.includes(g.student_id) && g.subject === activeClassInfo.subject);
    const classMarks = continuousMarks.filter(m => studentIds.includes(m.student_id) && m.subject === activeClassInfo.subject);

    // --- OVERVIEW STATS ---
    let classAvg = 0; let prevAvg = 0; let highest = 0; let lowest = 100; let passCount = 0;
    
    // Use the latest term for current overview
    const termGroups: Record<string, number[]> = {};
    classGrades.forEach(g => {
      if (g.percentage !== null) {
        if (!termGroups[g.term]) termGroups[g.term] = [];
        termGroups[g.term].push(g.percentage);
      }
    });

    const termKeys = Object.keys(termGroups).sort(); // E.g., Term 1, Term 2
    const latestTerm = termKeys.length > 0 ? termKeys[termKeys.length - 1] : null;
    const prevTerm = termKeys.length > 1 ? termKeys[termKeys.length - 2] : null;

    if (latestTerm) {
      const latestScores = termGroups[latestTerm];
      classAvg = Math.round(latestScores.reduce((a,b)=>a+b,0) / latestScores.length);
      highest = Math.max(...latestScores);
      lowest = Math.min(...latestScores);
      passCount = latestScores.filter(s => s >= 33).length; // Assuming 33% is passing
    }
    
    if (prevTerm) {
      const prevScores = termGroups[prevTerm];
      prevAvg = Math.round(prevScores.reduce((a,b)=>a+b,0) / prevScores.length);
    }

    const passRate = classStudents.length > 0 && latestTerm ? Math.round((passCount / termGroups[latestTerm].length) * 100) : 0;

    // --- TERM PROGRESS ---
    const termProgressColors = ["bg-slate-200", "bg-blue-300", "bg-indigo-300", "bg-purple-500"];
    const termProgress = termKeys.map((term, idx) => ({
      term: term,
      avg: Math.round(termGroups[term].reduce((a,b)=>a+b,0) / termGroups[term].length),
      color: termProgressColors[idx % termProgressColors.length]
    }));

    // --- TOPIC MASTERY (Based on continuous marks) ---
    const topicMap: Record<string, { earned: number, max: number }> = {};
    classMarks.forEach(m => {
      if (!topicMap[m.assessment_name]) topicMap[m.assessment_name] = { earned: 0, max: 0 };
      topicMap[m.assessment_name].earned += (m.score || 0);
      topicMap[m.assessment_name].max += m.max_score;
    });

    const topicMastery = Object.keys(topicMap).map(topic => {
      const pct = Math.round((topicMap[topic].earned / topicMap[topic].max) * 100);
      let status = "Average";
      if (pct >= 80) status = "Strong";
      else if (pct < 50) status = "Weak";
      return { topic, score: pct, status };
    }).sort((a,b) => b.score - a.score).slice(0, 5); // Show top 5 recent topics

    // --- GRADE DISTRIBUTION ---
    const gradeDist = [
      { grade: "A1 (90%+)", count: 0, color: "bg-emerald-500" },
      { grade: "A2 (80%+)", count: 0, color: "bg-emerald-400" },
      { grade: "B1 (70%+)", count: 0, color: "bg-blue-500" },
      { grade: "B2 (60%+)", count: 0, color: "bg-indigo-500" },
      { grade: "C (40%+)", count: 0, color: "bg-amber-500" },
      { grade: "Fail (<40%)", count: 0, color: "bg-red-500" },
    ];

    if (latestTerm) {
      classGrades.filter(g => g.term === latestTerm).forEach(g => {
        if (g.percentage >= 90) gradeDist[0].count++;
        else if (g.percentage >= 80) gradeDist[1].count++;
        else if (g.percentage >= 70) gradeDist[2].count++;
        else if (g.percentage >= 60) gradeDist[3].count++;
        else if (g.percentage >= 40) gradeDist[4].count++;
        else gradeDist[5].count++;
      });
    }
    const totalGrades = gradeDist.reduce((acc, curr) => acc + curr.count, 0);
    const gradeDistribution = gradeDist.map(g => ({ ...g, percentage: totalGrades > 0 ? Math.round((g.count/totalGrades)*100) : 0 }));

    // --- TRIAGE STUDENTS ---
    // Find students struggling based on recent marks
    const triageStudents = classStudents.map(student => {
      const myGrades = classGrades.filter(g => g.student_id === student.id).map(g => g.percentage);
      const myMarks = classMarks.filter(m => m.student_id === student.id);
      
      let overallAvg = 0;
      if (myGrades.length > 0) overallAvg = Math.round(myGrades.reduce((a,b)=>a+b,0) / myGrades.length);
      else if (myMarks.length > 0) {
        const earned = myMarks.reduce((acc, m) => acc + (m.score || 0), 0);
        const max = myMarks.reduce((acc, m) => acc + m.max_score, 0);
        overallAvg = Math.round((earned/max)*100);
      }

      let issue = "Consistent Performance";
      let trend = "flat";

      if (overallAvg < 40) { issue = "Critical Intervention Needed"; trend = "down"; }
      else if (overallAvg < 60) { issue = "Borderline - Needs Practice"; trend = "down"; }
      else if (overallAvg >= 85) { issue = "Top Performer"; trend = "up"; }

      return {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        score: overallAvg || 0,
        trend,
        issue,
        avatar: `${student.first_name.charAt(0)}`
      };
    }).sort((a,b) => a.score - b.score).slice(0, 6); // Bottom 6

    // --- AI INSIGHTS GENERATOR (Rule-Based) ---
    const insights = [];
    if (classAvg > prevAvg && prevAvg !== 0) insights.push(`Class average increased by ${classAvg - prevAvg}% compared to the previous term.`);
    else if (classAvg < prevAvg && prevAvg !== 0) insights.push(`Alert: Class average dropped by ${prevAvg - classAvg}% from the last term.`);
    
    const weakestTopic = topicMastery.find(t => t.status === 'Weak');
    if (weakestTopic) insights.push(`'${weakestTopic.topic}' is a major pain point. Recommend foundational revision.`);
    
    if (gradeDist[5].count > 0) insights.push(`${gradeDist[5].count} students have fallen below the passing threshold and require immediate intervention.`);
    else if (classStudents.length > 0) insights.push(`Excellent! 100% pass rate maintained in recent assessments.`);

    return {
      subject: activeClassInfo.subject,
      overview: { classAvg: classAvg || 0, prevAvg: prevAvg || 0, passRate, highest, lowest: lowest === 100 ? 0 : lowest },
      termProgress: termProgress.length > 0 ? termProgress : [{ term: "No Data", avg: 0, color: "bg-slate-200" }],
      topicMastery: topicMastery.length > 0 ? topicMastery : [{ topic: "Awaiting Marks Data", score: 0, status: "Average" }],
      gradeDistribution,
      insights: insights.length > 0 ? insights : ["Enter more grades and marks to generate actionable insights."],
      triageStudents
    };
  }, [activeClassId, assignedClasses, allStudents, termGrades, continuousMarks]);


  if (isLoading) return <div className="flex h-screen items-center justify-center w-full"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  if (assignedClasses.length === 0 || !analyticsData) {
    return (
      <div className="flex h-[85vh] w-full items-center justify-center p-6">
        <div className="text-center bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm max-w-md">
          <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">No Data Available</h2>
          <p className="text-slate-500 font-medium text-sm">You need active classes and grade entries to generate analytics.</p>
        </div>
      </div>
    );
  }

  const filteredTriage = analyticsData.triageStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-full flex flex-col relative pb-24 space-y-6 bg-slate-50/50">
      
      {/* ================= HEADER & CLASS TOGGLE ================= */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0 bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
        
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>

        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner border border-indigo-200/50">
              <PieChart className="w-6 h-6" />
            </div>
            Data Intelligence
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm flex items-center gap-2">
            Performance metrics and predictive insights for <span className="font-bold text-slate-700">{analyticsData.subject}</span>.
          </p>
        </div>
        
        <div className="relative z-10 flex flex-wrap bg-slate-100/80 p-1.5 rounded-2xl w-full xl:w-auto border border-slate-200/80 shadow-inner">
          {assignedClasses.map(cls => (
            <button 
              key={cls.id} onClick={() => setActiveClassId(cls.id)}
              className={`flex-1 xl:flex-none px-6 sm:px-8 py-3 rounded-[14px] text-sm font-black transition-all duration-300 whitespace-nowrap ${activeClassId === cls.id ? 'bg-white text-indigo-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-slate-200/60' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
            >
              {cls.displayName}
            </button>
          ))}
        </div>
      </div>

      {/* ================= PREMIUM KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 shrink-0">
        
        {/* Card 1: Class Average */}
        <div className="bg-white border border-slate-200/60 p-7 rounded-[2rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] transition-shadow group flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"><Activity className="w-5 h-5"/></div>
            <span className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl border ${analyticsData.overview.classAvg >= analyticsData.overview.prevAvg ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              {analyticsData.overview.classAvg >= analyticsData.overview.prevAvg ? <TrendingUp className="w-3.5 h-3.5"/> : <TrendingDown className="w-3.5 h-3.5"/>} 
              {Math.abs(analyticsData.overview.classAvg - analyticsData.overview.prevAvg)}%
            </span>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 tracking-tight">{analyticsData.overview.classAvg}<span className="text-2xl text-slate-400 font-bold">%</span></p>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-2">Current Class Average</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
        </div>

        {/* Card 2: Pass Rate */}
        <div className="bg-white border border-slate-200/60 p-7 rounded-[2rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] transition-shadow group flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"><Target className="w-5 h-5"/></div>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 tracking-tight">{analyticsData.overview.passRate}<span className="text-2xl text-slate-400 font-bold">%</span></p>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-2">Overall Pass Rate</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
        </div>

        {/* Card 3: Highest */}
        <div className="bg-white border border-slate-200/60 p-7 rounded-[2rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] transition-shadow group flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"><Medal className="w-5 h-5"/></div>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 tracking-tight">{analyticsData.overview.highest}</p>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-2">Highest Peak Score</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
        </div>

        {/* Card 4: Lowest */}
        <div className="bg-white border border-slate-200/60 p-7 rounded-[2rem] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] transition-shadow group flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"><AlertTriangle className="w-5 h-5"/></div>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 tracking-tight">{analyticsData.overview.lowest}</p>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-2">Lowest Risk Score</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
        </div>

      </div>

      {/* ================= MIDDLE TIER: CHARTS & MASTERY ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
        
        {/* Growth Chart */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm p-8 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="font-black text-slate-800 text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-500"/> Growth Trajectory</h2>
              <p className="text-xs font-bold text-slate-400 mt-1">Term-over-Term Class Average</p>
            </div>
            <button className="text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
              <FileDown className="w-4 h-4"/> Export 
            </button>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-4 pt-10 pb-6 relative px-4">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-slate-100/50 pb-6 px-4">
              {[100, 75, 50, 25, 0].map(line => (
                <div key={line} className="w-full border-t border-slate-200/50 border-dashed flex items-center relative">
                  <span className="absolute -left-6 text-[10px] font-bold text-slate-400 -translate-y-1/2">{line}</span>
                </div>
              ))}
            </div>

            {/* Bars */}
            <AnimatePresence mode="wait">
              {analyticsData.termProgress.map((term, i) => (
                <div key={term.term + activeClassId} className="relative flex flex-col items-center justify-end h-full w-full max-w-[60px] z-10 group cursor-pointer">
                  {/* Tooltip */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-2 bg-slate-900 text-white text-xs font-black py-1.5 px-3 rounded-lg shadow-xl pointer-events-none">
                    {term.avg}% <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                  
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: `${term.avg}%` }} transition={{ duration: 0.8, delay: i * 0.1, type: "spring", stiffness: 50 }}
                    className={`w-full rounded-full ${term.color} shadow-sm relative overflow-hidden transition-colors duration-300 border border-black/5`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                  </motion.div>
                  <span className="absolute -bottom-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap truncate w-full">{term.term}</span>
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Topic Mastery Grid */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm p-8 flex flex-col">
          <div className="mb-8">
            <h2 className="font-black text-slate-800 text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-500"/> Topic Mastery Breakdown</h2>
            <p className="text-xs font-bold text-slate-400 mt-1">Identifies macro-level knowledge gaps based on daily marks.</p>
          </div>
          
          <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {analyticsData.topicMastery.map((topic, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-end mb-2">
                  <div className="min-w-0 pr-4">
                    <span className="text-sm font-black text-slate-700 truncate block">{topic.topic}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                      topic.status === 'Strong' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      topic.status === 'Average' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'
                    }`}>{topic.status}</span>
                    <span className="text-sm font-black text-slate-800 w-8 text-right">{topic.score}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${topic.score}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                    className={`h-full rounded-full ${topic.status === 'Strong' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : topic.status === 'Average' ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ================= BOTTOM TIER: AI & TRIAGE TABLE ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* AI Engine */}
        <div className="xl:col-span-4 bg-slate-950 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 relative overflow-hidden flex flex-col border border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
          
          <h3 className="font-black text-white text-xl flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <BrainCircuit className="w-6 h-6 text-indigo-400"/>
            </div>
            AI Diagnosis
          </h3>
          
          <div className="space-y-4 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
            <AnimatePresence mode="wait">
              <motion.div key={activeClassId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">
                {analyticsData.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md shadow-inner hover:bg-white/10 transition-colors">
                    <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-300 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* SUGGESTION: Connect to Gemini/OpenAI API here for true generative reports */}
          <button className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all text-sm relative z-10 flex items-center justify-center gap-2 group border border-indigo-400/50">
            Generate Remedial Action Plan <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/>
          </button>
        </div>

        {/* Detailed Student Triage Table */}
        <div className="xl:col-span-8 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden">
          
          {/* Table Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
            <div>
              <h2 className="font-black text-slate-800 text-lg flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500"/> Student Triage Roster</h2>
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Actionable Outliers</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search student..." className="w-full sm:w-64 bg-white border border-slate-200/80 text-slate-900 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-sm shadow-sm" />
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <div className="min-w-[700px]">
              {/* Columns */}
              <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="col-span-4">Student Profile</div>
                <div className="col-span-2 text-center">Avg Score</div>
                <div className="col-span-2 text-center">Trend</div>
                <div className="col-span-3">Performance Category</div>
                <div className="col-span-1 text-right">View</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100/50 bg-white pb-6">
                <AnimatePresence mode="popLayout">
                  {filteredTriage.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 font-bold">No students found matching this criteria.</div>
                  ) : (
                    filteredTriage.map((student, i) => (
                      <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={student.id + activeClassId} className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-slate-50/50 transition-colors group cursor-pointer">
                        
                        {/* Name & Avatar */}
                        <div className="col-span-4 flex items-center gap-4 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border shadow-sm ${student.score > 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : student.score < 50 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {student.avatar}
                          </div>
                          <div className="min-w-0 pr-2">
                            <p className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors truncate">{student.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{student.id}</p>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="col-span-2 text-center">
                          <span className={`text-lg font-black ${student.score > 70 ? 'text-emerald-600' : student.score < 50 ? 'text-red-600' : 'text-slate-700'}`}>{student.score}%</span>
                        </div>

                        {/* Trend */}
                        <div className="col-span-2 flex justify-center">
                          <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${student.trend === 'up' ? 'bg-emerald-100 text-emerald-600' : student.trend === 'down' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                            {student.trend === 'up' ? <TrendingUp className="w-4 h-4"/> : student.trend === 'down' ? <TrendingDown className="w-4 h-4"/> : <Activity className="w-4 h-4"/>}
                          </span>
                        </div>

                        {/* Factor */}
                        <div className="col-span-3 flex items-center">
                          <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border truncate ${student.score < 50 ? 'bg-red-50 text-red-700 border-red-100' : student.score > 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {student.issue}
                          </span>
                        </div>

                        {/* Action */}
                        <div className="col-span-1 text-right flex justify-end">
                          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Eye className="w-5 h-5"/></button>
                        </div>

                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}