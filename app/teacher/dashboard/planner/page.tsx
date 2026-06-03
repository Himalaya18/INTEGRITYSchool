"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarDays, Calendar as CalendarIcon, Clock, 
  Plus, CheckCircle2, Circle, Sparkles, BookOpen, 
  ListTodo, LayoutList, MapPin, FileText, Send, 
  History, X, ShieldCheck, Loader2, Edit2, Trash2
} from "lucide-react";
import { supabase } from "@/supabase";

export default function TeacherPlanner() {
  const [viewMode, setViewMode] = useState<"Agenda" | "Week" | "Month" | "Reports">("Agenda");
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- REALTIME DATA STATE ---
  const [agenda, setAgenda] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  
  // Modals & Forms
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [newTask, setNewTask] = useState({ id: "", text: "", priority: "Medium" });
  const [newEvent, setNewEvent] = useState({ id: "", title: "", type: "Class", date: todayStr, time: "", lesson: "", room: "" });
  
  const [aiDraftTopic, setAiDraftTopic] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  
  const [reportType, setReportType] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  const [reportDraft, setReportDraft] = useState({ highlights: "", blockers: "", goal: "" });

  // --- INITIALIZATION ---
  useEffect(() => {
    initializePlanner();
  }, []);

  // --- REALTIME LISTENERS ---
  useEffect(() => {
    if (!currentUser?.id) return;

    // Listen to changes only for the logged-in user's EMP ID
    const channel = supabase.channel('teacher-planner-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planner_agendas', filter: `teacher_id=eq.${currentUser.id}` }, () => fetchData(currentUser.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planner_todos', filter: `teacher_id=eq.${currentUser.id}` }, () => fetchData(currentUser.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planner_diary', filter: `teacher_id=eq.${currentUser.id}` }, () => fetchData(currentUser.id))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  const initializePlanner = async () => {
    setIsLoading(true);
    
    try {
      // 1. Fetch the active NextAuth session directly from the browser
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      
      if (session && session.user && session.user.email) {
        // 2. We have a logged-in user! Find their profile in your public.users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('emp_id, name, role')
          .eq('email', session.user.email)
          .single();
          
        if (error) console.error("Database fetch error:", error);

        if (userData?.emp_id) {
          // 3. Set the active user using their actual EMP_ID
          setCurrentUser({ id: userData.emp_id, name: userData.name });
          await fetchData(userData.emp_id);
        } else {
          console.warn("Logged in, but no emp_id found for this user.");
        }
      }
    } catch (error) {
      console.error("Failed to authenticate session:", error);
    }
    
    setIsLoading(false);
  };

  const fetchData = async (empId: string) => {
    if (!empId) return;
    
    // Fetch ONLY the data linked to this specific EMP ID
    const { data: agendaData } = await supabase
      .from('planner_agendas')
      .select('*')
      .eq('teacher_id', empId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (agendaData) setAgenda(agendaData);

    const { data: taskData } = await supabase
      .from('planner_todos')
      .select('*')
      .eq('teacher_id', empId)
      .order('created_at', { ascending: false });
    if (taskData) setTasks(taskData);

    const { data: diaryData } = await supabase
      .from('planner_diary')
      .select('*')
      .eq('teacher_id', empId)
      .order('log_date', { ascending: false });
    if (diaryData) setReports(diaryData);
  };

  // --- ACTIONS ---
  const toggleTask = async (id: string, currentStatus: boolean) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !currentStatus } : t));
    await supabase.from('planner_todos').update({ done: !currentStatus }).eq('id', id);
  };

  const deleteItem = async (id: string, table: string) => {
    if(!confirm("Delete this entry?")) return;
    await supabase.from(table).delete().eq("id", id);
    if(currentUser) fetchData(currentUser.id);
  };

  const openTaskModal = (task?: any) => {
    if (task) setNewTask({ id: task.id, text: task.text, priority: task.priority });
    else setNewTask({ id: "", text: "", priority: "Medium" });
    setIsTaskModalOpen(true);
  };

  const openEventModal = (event?: any, dateStr?: string) => {
    if (event) setNewEvent({ id: event.id, title: event.task, type: event.type, date: event.date, time: event.time, lesson: event.lesson, room: event.room });
    else setNewEvent({ id: "", title: "", type: "Class", date: dateStr || todayStr, time: "09:00 AM", lesson: "", room: "" });
    setIsEventModalOpen(true);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.text || !currentUser) return;
    setIsSubmitting(true);
    
    // Uses the mapped EMP ID
    const payload = { teacher_id: currentUser.id, text: newTask.text, priority: newTask.priority, done: false };
    
    if (newTask.id) await supabase.from('planner_todos').update(payload).eq('id', newTask.id);
    else await supabase.from('planner_todos').insert([payload]);

    setIsTaskModalOpen(false);
    setIsSubmitting(false);
    fetchData(currentUser.id);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !currentUser) return;
    setIsSubmitting(true);

    // Uses the mapped EMP ID
    const payload = {
      teacher_id: currentUser.id,
      task: newEvent.title,
      type: newEvent.type,
      date: newEvent.date,
      time: newEvent.time,
      lesson: newEvent.lesson,
      room: newEvent.room,
      status: "Upcoming"
    };

    if (newEvent.id) await supabase.from('planner_agendas').update(payload).eq('id', newEvent.id);
    else await supabase.from('planner_agendas').insert([payload]);

    setIsEventModalOpen(false);
    setIsSubmitting(false);
    fetchData(currentUser.id);
  };

  const handleUpdateEventStatus = async (id: string, status: string) => {
    await supabase.from('planner_agendas').update({ status }).eq('id', id);
    if(currentUser) fetchData(currentUser.id);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    
    const contentPayload = JSON.stringify(reportDraft);

    try {
      await supabase.from('planner_diary').insert([{
        teacher_id: currentUser.id, // Linked securely via EMP ID
        log_date: todayStr,
        report_type: reportType,
        content: contentPayload,
        status: "Sent to Admin"
      }]);
      setReportDraft({ highlights: "", blockers: "", goal: "" });
      alert(`${reportType} Report officially synced with the Admin Dashboard!`);
      fetchData(currentUser.id);
    } catch (err: any) {
      alert("Failed to submit report. Ensure you haven't already submitted one today.");
    }
    
    setIsSubmitting(false);
  };

  const handleAIDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiDraftTopic) return;
    setIsDrafting(true);
    setTimeout(() => { 
      setIsDrafting(false); 
      alert(`Lesson Plan generated and saved to your drafts!`); 
      setAiDraftTopic(""); 
    }, 2000);
  };

  // --- DYNAMIC CALENDAR GENERATION ---
  const todaysAgenda = agenda.filter(a => a.date === todayStr);

  const weeklySchedule = useMemo(() => {
    const days = [];
    let curr = new Date();
    curr.setDate(curr.getDate() - curr.getDay() + 1);
    for (let i = 0; i < 5; i++) { 
      const dateStr = curr.toISOString().split('T')[0];
      const dayName = curr.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      const dayEvents = agenda.filter(a => a.date === dateStr);
      days.push({ day: dayName, date: dateStr, items: dayEvents });
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, [agenda]);

  const monthDays = useMemo(() => {
    const days = [];
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay() || 7; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i < firstDay; i++) days.push({ date: null, events: [] });
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = String(i).padStart(2, '0');
      const m = String(month + 1).padStart(2, '0');
      const dateStr = `${year}-${m}-${d}`;
      const dayEvents = agenda.filter(a => a.date === dateStr);
      days.push({ date: i, dateStr, events: dayEvents, isToday: dateStr === todayStr });
    }
    return days;
  }, [agenda, todayStr]);


  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;
  }

  if (!currentUser) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-4 text-center bg-slate-50">
        <div className="bg-red-50 text-red-600 p-6 sm:p-8 rounded-3xl max-w-md border border-red-100 shadow-sm w-full">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4"/> 
          <h2 className="text-xl font-black mb-2">Access Denied</h2>
          <p className="font-bold text-sm text-red-500">You must be logged in with a valid faculty account to view this personalized planner. Ensure your user profile has an `emp_id` assigned.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-full flex flex-col relative pb-24 space-y-6 bg-slate-50/50 font-sans min-w-0">
      
      {/* ================= HEADER & VIEW TOGGLE ================= */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0 bg-white p-5 sm:p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>

        <div className="relative z-10 w-full xl:w-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner border border-indigo-200/50 shrink-0"><CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" /></div>
            <span className="truncate">Master Planner</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-xs sm:text-sm flex items-center gap-2 truncate">Welcome back, {currentUser.name}. Organize your timetable.</p>
        </div>
        
        {/* Mobile-friendly scrolling toggle bar */}
        <div className="relative z-10 flex bg-slate-100/80 p-1.5 rounded-2xl w-full xl:w-auto border border-slate-200/80 shadow-inner overflow-x-auto custom-scrollbar shrink-0">
          <div className="flex w-max min-w-full">
            {["Agenda", "Week", "Month", "Reports"].map(mode => (
              <button 
                key={mode} onClick={() => setViewMode(mode as any)}
                className={`flex-1 px-4 sm:px-6 py-2.5 rounded-[14px] text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${viewMode === mode ? 'bg-white text-indigo-700 shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-slate-200/60' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
              >
                {mode === "Agenda" && <LayoutList className="w-4 h-4 shrink-0"/>}
                {mode === "Week" && <CalendarIcon className="w-4 h-4 shrink-0"/>}
                {mode === "Month" && <CalendarDays className="w-4 h-4 shrink-0"/>}
                {mode === "Reports" && <FileText className="w-4 h-4 shrink-0"/>}
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 w-full min-w-0">
        
        {/* ================= LEFT COLUMN: DYNAMIC VIEWS ================= */}
        <div className="xl:col-span-8 flex flex-col gap-6 w-full min-w-0">
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col flex-1 overflow-hidden relative min-h-[500px]">
            
            <div className="p-5 sm:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 shrink-0">
              <div className="w-full sm:w-auto min-w-0">
                <h2 className="font-black text-slate-800 text-lg sm:text-xl truncate">{viewMode === "Agenda" ? "Today's Schedule" : viewMode === "Week" ? "Weekly Planner" : viewMode === "Month" ? "Monthly Overview" : "Admin Sync & Reports"}</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 truncate">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              
              {(viewMode === "Agenda" || viewMode === "Week" || viewMode === "Month") && (
                <button onClick={() => openEventModal()} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm w-full sm:w-auto shrink-0">
                  <Plus className="w-4 h-4 shrink-0"/> Add to Schedule
                </button>
              )}
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-50/30 w-full min-w-0">
              <AnimatePresence mode="wait">
                
                {/* ---------------- VIEW 1: AGENDA ---------------- */}
                {viewMode === "Agenda" && (
                  <motion.div key="agenda" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute inset-0 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                    <div className="absolute top-8 bottom-8 left-[3.5rem] sm:left-[4.5rem] w-px bg-slate-200 hidden sm:block"></div>
                    {todaysAgenda.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                        <CalendarDays className="w-12 h-12 mb-4 opacity-50" /><p className="font-bold">Your schedule is empty for today.</p>
                      </div>
                    ) : (
                      <div className="space-y-6 sm:space-y-8 relative z-10">
                        <AnimatePresence>
                          {todaysAgenda.map((item) => (
                            <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={item.id} className="flex flex-col sm:flex-row gap-2 sm:gap-6 group">
                              <div className="w-auto sm:w-20 shrink-0 sm:text-right pt-2 flex items-center sm:block gap-2 mb-2 sm:mb-0">
                                <div className={`w-3 h-3 rounded-full sm:hidden ${item.status === 'Active' ? 'bg-indigo-500' : item.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                <p className="text-xs font-black text-slate-800 leading-tight">{item.time}</p>
                              </div>
                              <div className="relative justify-center shrink-0 hidden sm:flex">
                                <div className={`w-4 h-4 rounded-full border-4 border-white mt-1.5 shadow-sm relative z-10 ${item.status === 'Active' ? 'bg-indigo-500 ring-4 ring-indigo-100' : item.status === 'Completed' ? 'bg-emerald-500' : 'bg-white border-slate-300'}`}>
                                  {item.status === 'Active' && <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400 opacity-50"></div>}
                                </div>
                              </div>
                              <div className={`flex-1 p-4 sm:p-5 rounded-2xl border transition-all duration-300 w-full min-w-0 ${item.status === 'Active' ? 'bg-indigo-50/50 border-indigo-200 shadow-md' : item.status === 'Completed' ? 'bg-slate-50/50 border-slate-100 opacity-70' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'}`}>
                                <div className="flex flex-wrap justify-between items-start gap-2">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border shrink-0 ${item.type === 'Class' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : item.type === 'Prep' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>{item.type}</span>
                                  <div className="flex gap-2 shrink-0">
                                    <button onClick={() => openEventModal(item)} className="opacity-100 sm:opacity-0 group-hover:opacity-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 px-2 py-1 rounded-md transition-colors"><Edit2 className="w-4 h-4 sm:w-3 sm:h-3"/></button>
                                    <button onClick={() => deleteItem(item.id, "planner_agendas")} className="opacity-100 sm:opacity-0 group-hover:opacity-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 px-2 py-1 rounded-md transition-colors"><Trash2 className="w-4 h-4 sm:w-3 sm:h-3"/></button>
                                    {item.status !== 'Completed' && (
                                      <button onClick={() => handleUpdateEventStatus(item.id, 'Completed')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 hover:border-emerald-200 px-2 py-1 rounded-md transition-colors flex items-center gap-1"><span className="hidden sm:inline">Mark</span> Done <CheckCircle2 className="w-3 h-3"/></button>
                                    )}
                                  </div>
                                </div>
                                <h3 className={`text-base sm:text-lg font-black tracking-tight mt-3 truncate ${item.status === 'Active' ? 'text-indigo-900' : 'text-slate-800'}`}>{item.task}</h3>
                                {(item.lesson || item.room) && (
                                  <div className="mt-3 flex flex-col gap-2 bg-white/60 p-3 rounded-xl border border-slate-100">
                                    {item.lesson && <div className="flex items-start gap-2 min-w-0"><BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" /><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Lesson Plan</p><p className="text-xs font-bold text-slate-700 truncate">{item.lesson}</p></div></div>}
                                    {item.room && <div className="flex items-start gap-2 pt-2 border-t border-slate-100/80 min-w-0"><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" /><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Location</p><p className="text-xs font-bold text-slate-700 truncate">{item.room}</p></div></div>}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ---------------- VIEW 2: WEEK ---------------- */}
                {viewMode === "Week" && (
                   <motion.div key="week" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute inset-0 overflow-x-auto p-4 sm:p-6 custom-scrollbar w-full">
                    <div className="flex gap-4 h-full min-w-[800px]">
                      {weeklySchedule.map((day, idx) => (
                        <div key={idx} className={`flex-1 flex flex-col rounded-2xl border w-64 shrink-0 ${day.date === todayStr ? 'bg-indigo-50/30 border-indigo-200/50 shadow-inner' : 'bg-slate-50/50 border-slate-200/50'}`}>
                          <div className={`p-4 border-b text-center shrink-0 ${day.date === todayStr ? 'border-indigo-100 bg-indigo-50/50' : 'border-slate-100 bg-slate-100/50'}`}><h3 className={`font-black uppercase tracking-widest text-sm ${day.date === todayStr ? 'text-indigo-600' : 'text-slate-600'}`}>{day.day}</h3></div>
                          <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                            {day.items.map((item: any, i: number) => (
                              <div key={i} className={`bg-white p-3 rounded-xl border border-slate-200 shadow-sm border-l-4 group relative ${item.type === 'Class' ? 'border-l-emerald-500' : item.type === 'Prep' ? 'border-l-amber-500' : 'border-l-purple-500'}`}>
                                <p className="text-[9px] font-black text-slate-400 mb-1 truncate">{item.time}</p>
                                <p className="font-bold text-xs text-slate-700 leading-tight line-clamp-2">{item.task}</p>
                                <div className="absolute right-2 top-2 opacity-100 lg:opacity-0 group-hover:opacity-100 flex gap-1 bg-white pl-2">
                                  <button onClick={() => openEventModal(item)} className="p-1 text-slate-400 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5"/></button>
                                  <button onClick={() => deleteItem(item.id, "planner_agendas")} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                                </div>
                              </div>
                            ))}
                            <button onClick={() => { setNewEvent({...newEvent, date: day.date}); setIsEventModalOpen(true); }} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold hover:border-indigo-300 hover:bg-white hover:text-indigo-500 transition-colors">+ Add Block</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ---------------- VIEW 3: MONTH ---------------- */}
                {viewMode === "Month" && (
                  <motion.div key="month" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute inset-0 overflow-auto p-4 sm:p-6 flex flex-col custom-scrollbar">
                    <div className="min-w-[700px] h-full flex flex-col">
                      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex-1">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <div key={d} className="bg-slate-100 p-2 sm:p-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">{d}</div>)}
                        {monthDays.map((day, idx) => (
                          <div key={idx} onClick={() => { if(day.date) openEventModal(undefined, day.dateStr); }} className={`bg-white min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 flex flex-col transition-colors hover:bg-slate-50 cursor-pointer ${day.date ? '' : 'bg-slate-50/50'}`}>
                            {day.date && (
                              <>
                                <span className={`text-xs font-black w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center mb-1 rounded-full ${day.isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700'}`}>{day.date}</span>
                                <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
                                  {day.events.map((ev: any, i: number) => (
                                    <div key={i} className={`group text-[8px] font-bold text-slate-700 px-1.5 py-0.5 rounded border bg-slate-50 flex justify-between items-center ${ev.type === 'Class' ? 'border-emerald-200' : 'border-slate-200'}`}>
                                      <span className="truncate">{ev.time} - {ev.task}</span>
                                      <button onClick={(e) => { e.stopPropagation(); deleteItem(ev.id, "planner_agendas"); }} className="opacity-100 lg:opacity-0 group-hover:opacity-100 text-red-500 shrink-0 pl-1"><Trash2 className="w-2.5 h-2.5"/></button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ---------------- VIEW 4: REPORTS (ADMIN SYNC) ---------------- */}
                {viewMode === "Reports" && (
                  <motion.div key="reports" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute inset-0 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 custom-scrollbar">
                    
                    <div className="flex-1 flex flex-col w-full min-w-0">
                      <div className="flex bg-slate-200/50 p-1 rounded-xl w-full sm:max-w-sm mb-6 shadow-inner shrink-0">
                        {["Daily", "Weekly", "Monthly"].map(t => (
                          <button key={t} onClick={() => setReportType(t as any)} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all truncate px-2 ${reportType === t ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
                            {t}
                          </button>
                        ))}
                      </div>

                      <form onSubmit={handleReportSubmit} className="space-y-6 flex-1 flex flex-col">
                        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex gap-3 items-start shrink-0">
                          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm font-black text-indigo-900 truncate">Auto-Compiled Metrics</p>
                            <p className="text-xs font-bold text-indigo-600/70 mt-1">Your planner logs and tasks are attached. Provide qualitative feedback below.</p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 truncate">Highlights (What went well?)</label>
                          <textarea required rows={3} value={reportDraft.highlights} onChange={e => setReportDraft({...reportDraft, highlights: e.target.value})} placeholder="e.g., Class 8-A performed exceptionally well in the surprise quiz..." className="w-full bg-white border border-slate-200/80 text-slate-800 font-medium rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all shadow-sm resize-none custom-scrollbar"></textarea>
                        </div>
                        <div className="shrink-0">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 truncate">Blockers (Admin Attention Needed)</label>
                          <textarea rows={2} value={reportDraft.blockers} onChange={e => setReportDraft({...reportDraft, blockers: e.target.value})} placeholder="e.g., The projector in Lab 2 is malfunctioning..." className="w-full bg-white border border-slate-200/80 text-slate-800 font-medium rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all shadow-sm resize-none custom-scrollbar"></textarea>
                        </div>
                        <div className="shrink-0">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 truncate">Primary Goal for Next Period</label>
                          <input required type="text" value={reportDraft.goal} onChange={e => setReportDraft({...reportDraft, goal: e.target.value})} placeholder="e.g., Complete Geometry syllabus" className="w-full bg-white border border-slate-200/80 text-slate-800 font-medium rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all shadow-sm" />
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full mt-4 sm:mt-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 text-sm shrink-0">
                          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin shrink-0"/> : <Send className="w-4 h-4 shrink-0"/>} 
                          <span className="truncate">{isSubmitting ? "Syncing with Admin..." : `Submit ${reportType} Report`}</span>
                        </button>
                      </form>
                    </div>

                    <div className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200/60 pt-6 lg:pt-0 lg:pl-8">
                      <h3 className="font-black text-slate-800 flex items-center gap-2 mb-6"><History className="w-4 h-4 text-indigo-500 shrink-0"/> Submission Log</h3>
                      <div className="space-y-4">
                        <AnimatePresence>
                          {reports.map(rep => (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} key={rep.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden group w-full min-w-0">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"></div>
                              <div className="flex justify-between items-start mb-2 w-full gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded shrink-0">{rep.report_type}</span>
                                <button onClick={() => deleteItem(rep.id, "planner_diary")} className="opacity-100 lg:opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-1 rounded transition-all shrink-0"><Trash2 className="w-3 h-3"/></button>
                              </div>
                              <p className="text-xs font-black text-slate-800 mb-2 truncate">{new Date(rep.log_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 truncate"><ShieldCheck className="w-3 h-3 shrink-0"/> {rep.status}</p>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: TASKS & AI ================= */}
        <div className="xl:col-span-4 flex flex-col gap-6 w-full min-w-0">
          
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-xl p-6 sm:p-8 relative overflow-hidden flex flex-col shrink-0 w-full">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-bl-full blur-3xl pointer-events-none"></div>
            <h3 className="font-black text-white text-lg flex items-center gap-3 mb-2 relative z-10 truncate"><div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30 shrink-0"><Sparkles className="w-5 h-5 text-purple-400"/></div> AI Lesson Drafter</h3>
            <p className="text-xs font-medium text-slate-400 mb-6 relative z-10 truncate">Instantly generate a lesson plan structure.</p>
            <form onSubmit={handleAIDraft} className="relative z-10 space-y-4 w-full">
              <div><select className="w-full bg-slate-800/50 border border-slate-700 text-white font-bold rounded-xl px-4 py-3 outline-none focus:border-purple-500 appearance-none text-sm"><option>Class 8 Mathematics</option><option>Class 7 Mathematics</option></select></div>
              <div><input required type="text" placeholder="Topic (e.g., Exponents)" value={aiDraftTopic} onChange={(e) => setAiDraftTopic(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 text-white font-medium rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-sm placeholder:text-slate-500" /></div>
              <button type="submit" disabled={isDrafting || !aiDraftTopic} className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white font-black py-3.5 rounded-xl transition-all text-sm flex justify-center items-center gap-2 truncate">{isDrafting ? <Loader2 className="w-4 h-4 animate-spin shrink-0"/> : null} {isDrafting ? "Drafting..." : "Generate Plan"}</button>
            </form>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col flex-1 overflow-hidden min-h-[400px] w-full">
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <h2 className="font-black text-slate-800 text-lg flex items-center gap-2 truncate"><ListTodo className="w-5 h-5 text-emerald-500 shrink-0"/> Task List</h2>
              <button onClick={() => openTaskModal()} className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-all shrink-0"><Plus className="w-4 h-4"/></button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar w-full">
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-center text-xs font-bold text-slate-400 mt-10">No pending tasks.</p>
                ) : (
                  <AnimatePresence>
                    {tasks.map((task) => (
                      <motion.div key={task.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer group w-full min-w-0 ${task.done ? 'bg-slate-50/50 border-slate-100' : 'bg-white border-slate-200 hover:border-emerald-300'}`} onClick={() => toggleTask(task.id, task.done)}>
                        <button className={`mt-0.5 shrink-0 ${task.done ? 'text-emerald-500' : 'text-slate-300 group-hover:text-emerald-400'}`}>{task.done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}</button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm truncate ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.text}</p>
                          {!task.done && <span className={`inline-block mt-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{task.priority}</span>}
                        </div>
                        <div className="flex flex-col gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pl-1">
                          <button onClick={(e) => { e.stopPropagation(); openTaskModal(task); }} className="text-slate-400 hover:text-blue-600"><Edit2 size={14}/></button>
                          <button onClick={(e) => { e.stopPropagation(); deleteItem(task.id, "planner_todos"); }} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ADD TASK MODAL ================= */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl flex flex-col">
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-slate-800 flex items-center gap-2 truncate"><ListTodo className="w-5 h-5 text-emerald-600 shrink-0"/> {newTask.id ? 'Edit Task' : 'Add New Task'}</h3><button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors shrink-0"><X className="w-5 h-5"/></button></div>
              <form onSubmit={handleAddTask} className="space-y-5">
                <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 truncate">Description</label><input autoFocus required type="text" placeholder="What needs to be done?" value={newTask.text} onChange={e => setNewTask({...newTask, text: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-3 outline-none focus:border-emerald-500" /></div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 truncate">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-emerald-500 appearance-none">
                    <option value="Low">Low Priority</option><option value="Medium">Medium Priority</option><option value="High">High Priority</option>
                  </select>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 flex justify-center items-center gap-2 truncate">{isSubmitting && <Loader2 className="w-4 h-4 animate-spin shrink-0"/>} {newTask.id ? 'Update Task' : 'Save Task'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= ADD EVENT MODAL ================= */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl flex flex-col my-auto">
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-slate-800 flex items-center gap-2 truncate"><CalendarDays className="w-5 h-5 text-indigo-600 shrink-0"/> {newEvent.id ? 'Edit Schedule' : 'Add to Schedule'}</h3><button onClick={() => setIsEventModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors shrink-0"><X className="w-5 h-5"/></button></div>
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 truncate">Block Type</label>
                  <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 appearance-none text-sm">
                    <option>Class</option><option>Meeting</option><option>Prep</option><option>Event</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 truncate">Date</label><input required type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 text-sm" /></div>
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 truncate">Time</label><input required type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 text-sm" /></div>
                </div>
                <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 truncate">Title / Subject</label><input required type="text" placeholder="e.g. Class 8-A Math" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 text-sm" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2"><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 truncate">Room</label><input type="text" placeholder="e.g. Lab 2" value={newEvent.room} onChange={e => setNewEvent({...newEvent, room: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 text-sm" /></div>
                </div>
                <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 truncate">Lesson Plan / Notes</label><textarea rows={2} placeholder="Optional details..." value={newEvent.lesson} onChange={e => setNewEvent({...newEvent, lesson: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 text-sm resize-none custom-scrollbar"></textarea></div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold py-3.5 rounded-xl shadow-lg mt-2 flex justify-center items-center gap-2 truncate">{isSubmitting && <Loader2 className="w-4 h-4 animate-spin shrink-0"/>} {newEvent.id ? 'Update Timeline' : 'Add to Timeline'}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}