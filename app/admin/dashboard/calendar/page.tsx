"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarDays, Calendar as CalendarIcon, Clock, 
  Plus, CheckCircle2, Circle, Save, 
  ListTodo, LayoutList, FileText, ChevronRight, ChevronLeft,
  History, X, Edit2, Trash2, ShieldCheck, Loader2, BookOpen
} from "lucide-react";
import { supabase } from "@/supabase";

export default function PrincipalPlanner() {
  const [activeTab, setActiveTab] = useState<"Agenda" | "Week" | "Month" | "Diary">("Week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  
  // --- REALTIME DATA STATE ---
  const [agenda, setAgenda] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [monthlyEvents, setMonthlyEvents] = useState<any[]>([]);
  const [diaryEntry, setDiaryEntry] = useState("");
  const [quickTodo, setQuickTodo] = useState("");
  
  // Modals & Forms
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<"Task" | "Agenda" | "Event">("Agenda");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ id: "", title: "", time: "09:00 AM", date: new Date().toISOString().split('T')[0], priority: "Medium", type: "Routine" });

  const formatYMD = (d: Date) => d.toISOString().split('T')[0];
  const todayStr = formatYMD(new Date());
  
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(date.setDate(diff));
  };

  const navigateTime = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (activeTab === "Agenda" || activeTab === "Diary") newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    else if (activeTab === "Week") newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    else if (activeTab === "Month") newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
  };

  useEffect(() => {
    fetchData();

    // Listen to the ADMIN tables
    const channel = supabase.channel('admin-planner-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_agendas' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_todos' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_diary' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planner_events' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedDate, activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    const targetYMD = formatYMD(selectedDate);

    // 1. Fetch Admin Tasks
    const { data: todosData } = await supabase.from("admin_todos").select("*").order("done", { ascending: true }).order("created_at", { ascending: false });
    if (todosData) setTasks(todosData);

    // 2. Fetch Admin Agendas
    let startQuery = targetYMD, endQuery = targetYMD;
    if (activeTab === "Week") {
      const start = getStartOfWeek(selectedDate);
      const end = new Date(start); end.setDate(end.getDate() + 6);
      startQuery = formatYMD(start); endQuery = formatYMD(end);
    }
    const { data: agendaData } = await supabase.from("admin_agendas").select("*").gte("date", startQuery).lte("date", endQuery).order("time", { ascending: true });
    if (agendaData) setAgenda(agendaData);

    // 3. Fetch Global Events
    if (activeTab === "Month") {
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      const { data: eventsData } = await supabase.from("planner_events").select("*").gte("date", formatYMD(startOfMonth)).lte("date", formatYMD(endOfMonth)).order("date", { ascending: true });
      if (eventsData) setMonthlyEvents(eventsData);
    }

    // 4. Fetch Admin Diary
    if (activeTab === "Diary") {
      const { data: diaryData } = await supabase.from("admin_diary").select("*").eq("log_date", targetYMD).single();
      setDiaryEntry(diaryData ? diaryData.content : "");
    }

    setIsLoading(false);
  };

  // --- ACTIONS ---
  const toggleTodo = async (id: string, currentStatus: boolean) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !currentStatus } : t));
    await supabase.from("admin_todos").update({ done: !currentStatus }).eq("id", id);
  };

  const handleQuickAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTodo.trim()) return;
    await supabase.from("admin_todos").insert([{ text: quickTodo, priority: "Medium", done: false }]);
    setQuickTodo("");
    fetchData();
  };

  const deleteItem = async (id: string, table: string) => {
    if(!confirm("Delete this entry?")) return;
    await supabase.from(table).delete().eq("id", id);
    fetchData();
  };

  const openModal = (mode: "Task" | "Agenda" | "Event", item?: any, dateObj?: Date) => {
    setEntryMode(mode);
    setFormData({
      id: item?.id || "",
      title: item ? (mode === "Task" ? item.text : item.task || item.name) : "",
      time: item?.time || "09:00 AM",
      date: item?.date || (dateObj ? formatYMD(dateObj) : formatYMD(selectedDate)),
      priority: item?.priority || "Medium",
      type: item?.type || (mode === "Event" ? "Celebration" : "Routine")
    });
    setIsAddModalOpen(true);
  };

  const handleGlobalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    setIsSubmitting(true);

    const isUpdate = !!formData.id;

    if (entryMode === "Task") {
      const payload = { text: formData.title, priority: formData.priority, done: false };
      if (isUpdate) await supabase.from("admin_todos").update(payload).eq("id", formData.id);
      else await supabase.from("admin_todos").insert([payload]);
    } else if (entryMode === "Agenda") {
      const payload = { task: formData.title, time: formData.time, date: formData.date, type: formData.type };
      if (isUpdate) await supabase.from("admin_agendas").update(payload).eq("id", formData.id);
      else await supabase.from("admin_agendas").insert([payload]);
    } else if (entryMode === "Event") {
      const payload = { name: formData.title, date: formData.date, type: formData.type };
      if (isUpdate) await supabase.from("planner_events").update(payload).eq("id", formData.id);
      else await supabase.from("planner_events").insert([payload]);
    }

    setIsAddModalOpen(false);
    setIsSubmitting(false);
    fetchData();
  };

  const saveDiaryEntry = async () => {
    const targetYMD = formatYMD(selectedDate);
    const { error } = await supabase.from("admin_diary").upsert(
      { log_date: targetYMD, content: diaryEntry, updated_at: new Date() },
      { onConflict: 'log_date' }
    );
    if (!error) alert("Admin log saved securely.");
  };

  const weekDays = Array.from({ length: 6 }).map((_, i) => { const d = getStartOfWeek(selectedDate); d.setDate(d.getDate() + i); return d; });

  const monthDays = useMemo(() => {
    const days = [];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay() || 7; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i < firstDay; i++) days.push({ date: null, events: [] });
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ date: i, dateStr, events: monthlyEvents.filter(a => a.date === dateStr), isToday: dateStr === todayStr });
    }
    return days;
  }, [monthlyEvents, selectedDate]);


  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-full flex flex-col relative pb-24 space-y-6 bg-slate-50/50 font-sans">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0 bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><ShieldCheck className="w-6 h-6" /></div> Principal Master Planner</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Centralized control for operations and schedules.</p>
        </div>
        
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-full xl:w-auto border shadow-inner overflow-x-auto">
          {(["Agenda", "Week", "Month", "Diary"] as const).map(mode => (
            <button key={mode} onClick={() => { setActiveTab(mode); setSelectedDate(new Date()); }} className={`flex-1 px-6 py-2.5 rounded-[14px] text-sm font-black transition-all ${activeTab === mode ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}>
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 min-h-0">
        
        {/* LEFT PANE */}
        <div className="lg:w-2/3 flex flex-col min-h-[600px]">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex-1 flex flex-col overflow-hidden relative">
            
            {/* TIME NAV */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
               <button onClick={() => navigateTime("prev")} className="p-2 hover:bg-white rounded-full transition-all"><ChevronLeft/></button>
               <h2 className="text-xl font-black text-slate-800">
                 {activeTab === "Month" ? selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : activeTab === "Week" ? `Week of ${getStartOfWeek(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
               </h2>
               <button onClick={() => navigateTime("next")} className="p-2 hover:bg-white rounded-full transition-all"><ChevronRight/></button>
            </div>

            <div className="flex-1 overflow-y-auto relative bg-slate-50/30">
               {isLoading ? <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600"/></div> : 
               
               <>
                 {/* DAILY VIEW */}
                 {activeTab === "Agenda" && (
                   <div className="p-6 sm:p-8 space-y-6 relative before:absolute before:inset-0 before:ml-[4.5rem] before:w-px before:bg-slate-200">
                     <div className="flex justify-end mb-6 relative z-10"><button onClick={() => openModal("Agenda")} className="bg-indigo-50 text-indigo-600 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-indigo-200 hover:bg-indigo-100"><Plus className="w-4 h-4"/> Add Block</button></div>
                     {agenda.filter(a => a.date === formatYMD(selectedDate)).length === 0 ? (
                       <div className="text-center py-10 text-slate-400 font-bold relative z-10">No items scheduled for this date.</div>
                     ) : agenda.filter(a => a.date === formatYMD(selectedDate)).map((item) => (
                       <div key={item.id} className="relative flex items-start gap-6 group z-10">
                         <div className="w-20 text-right shrink-0 pt-2 text-xs font-black text-slate-800">{item.time}</div>
                         <div className={`w-4 h-4 rounded-full border-4 border-white mt-1.5 shrink-0 -ml-[2px] ${item.status === 'Completed' ? 'bg-slate-300' : 'bg-indigo-500 shadow-sm'}`}></div>
                         <div className={`flex-1 p-5 rounded-2xl border transition-all flex justify-between items-start ${item.status === 'Completed' ? 'bg-slate-50/50 border-slate-100 opacity-70' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'}`}>
                           <div>
                             <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-slate-100 text-slate-500 mb-2 inline-block">{item.type}</span>
                             <p className="font-black text-slate-800 text-lg">{item.task}</p>
                           </div>
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => openModal("Agenda", item)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                             <button onClick={() => deleteItem(item.id, "admin_agendas")} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* WEEKLY VIEW */}
                 {activeTab === "Week" && (
                   <div className="p-6 overflow-x-auto h-full flex gap-4 min-w-[800px]">
                      {weekDays.map((day) => {
                        const dayStr = formatYMD(day);
                        const dayAgenda = agenda.filter(a => a.date === dayStr);
                        return (
                          <div key={dayStr} className={`flex-1 flex flex-col rounded-2xl border ${dayStr === todayStr ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-slate-200'}`}>
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                              <h4 className="font-black text-slate-800 text-sm">{day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</h4>
                              <button onClick={() => openModal("Agenda", undefined, day)} className="text-slate-400 hover:text-indigo-600"><Plus className="w-4 h-4" /></button>
                            </div>
                            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                              {dayAgenda.map(a => (
                                <div key={a.id} className="group relative flex flex-col gap-1 p-3 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-indigo-300">
                                  <p className="text-[10px] font-black text-slate-400">{a.time}</p>
                                  <p className="text-xs font-bold text-slate-700 leading-tight">{a.task}</p>
                                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-1 bg-white pl-2">
                                    <button onClick={() => openModal("Agenda", a)} className="text-slate-400 hover:text-indigo-600"><Edit2 className="w-3 h-3"/></button>
                                    <button onClick={() => deleteItem(a.id, "admin_agendas")} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                   </div>
                 )}

                 {/* MONTHLY VIEW */}
                 {activeTab === "Month" && (
                   <div className="p-6 flex flex-col h-full">
                     <div className="flex justify-end mb-4"><button onClick={() => openModal("Event", undefined, selectedDate)} className="bg-amber-50 text-amber-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-amber-200 hover:bg-amber-100"><Plus className="w-4 h-4"/> Add Global Event</button></div>
                     <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex-1">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <div key={d} className="bg-slate-100 p-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">{d}</div>)}
                        {monthDays.map((day, idx) => (
                          <div key={idx} onClick={() => day.date && openModal("Event", undefined, new Date(day.dateStr!))} className={`bg-white min-h-[100px] p-2 flex flex-col hover:bg-slate-50 cursor-pointer ${day.date ? '' : 'bg-slate-50/50'}`}>
                            {day.date && (
                              <>
                                <span className={`text-xs font-black w-6 h-6 flex items-center justify-center mb-1 rounded-full ${day.isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700'}`}>{day.date}</span>
                                <div className="space-y-1 flex-1 overflow-y-auto pr-1">
                                  {day.events.map((ev: any, i: number) => (
                                    <div key={i} className="text-[8px] font-bold text-slate-700 px-1.5 py-0.5 rounded truncate border bg-slate-50 border-amber-200 flex justify-between group">
                                      <span>{ev.name}</span>
                                      <button onClick={(e) => { e.stopPropagation(); deleteItem(ev.id, "planner_events"); }} className="opacity-0 group-hover:opacity-100 text-red-500"><Trash2 className="w-2.5 h-2.5"/></button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                   </div>
                 )}

                 {/* DIARY VIEW */}
                 {activeTab === "Diary" && (
                   <div className="flex flex-col h-full p-8">
                     <div className="flex justify-between items-center mb-6">
                       <p className="text-sm font-bold text-slate-500">Private daily administrative log. Not visible to staff.</p>
                       <button onClick={saveDiaryEntry} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"><Save className="w-4 h-4" /> Save Log</button>
                     </div>
                     <div className="flex-1 bg-[#fdfbf7] border border-amber-900/10 rounded-2xl shadow-inner p-6 relative">
                       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/lined-paper.png')] opacity-20 pointer-events-none rounded-2xl"></div>
                       <textarea value={diaryEntry} onChange={(e) => setDiaryEntry(e.target.value)} placeholder="Write your private reflections, blocker notes, or management goals for today..." className="w-full h-full bg-transparent outline-none resize-none text-slate-800 font-medium leading-relaxed relative z-10 custom-scrollbar" style={{ lineHeight: "2.5rem" }}/>
                     </div>
                   </div>
                 )}
               </>
               }
            </div>
          </div>
        </div>

        {/* RIGHT PANE: PERSISTENT TASKS */}
        <div className="lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-6 flex-1 flex flex-col min-h-[400px]">
            <h3 className="font-black text-slate-800 text-xl mb-6 flex items-center gap-2"><ListTodo className="w-6 h-6 text-indigo-500" /> Admin Tasks</h3>
            
            <form onSubmit={handleQuickAddTodo} className="mb-6">
              <div className="relative">
                <input type="text" value={quickTodo} onChange={(e) => setQuickTodo(e.target.value)} placeholder="Quick add task..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 pl-4 pr-12 outline-none focus:border-indigo-500 text-sm font-medium" />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700"><Plus className="w-4 h-4"/></button>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              <AnimatePresence>
                {tasks.map(todo => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} key={todo.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${todo.done ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'}`}>
                    <button onClick={() => toggleTodo(todo.id, todo.done)} className={`mt-0.5 shrink-0 ${todo.done ? 'text-emerald-500' : 'text-slate-300'}`}>
                      {todo.done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${todo.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{todo.text}</p>
                      {!todo.done && (
                        <span className={`inline-block mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${todo.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{todo.priority}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal("Task", todo)} className="text-slate-400 hover:text-indigo-600"><Edit2 size={14}/></button>
                      <button onClick={() => deleteItem(todo.id, "admin_todos")} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col border-l border-slate-200">
              <div className="h-20 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-800">{formData.id ? 'Edit' : 'Create'} {entryMode}</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="bg-white text-slate-500 p-2 rounded-full border border-slate-200 shadow-sm"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleGlobalSubmit} className="flex-1 overflow-y-auto flex flex-col justify-between">
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Title / Description</label>
                    <input required autoFocus type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 text-sm font-bold" />
                  </div>
                  {entryMode === "Task" && (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                      <select value={formData.priority} onChange={e=>setFormData({...formData, priority: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none text-sm font-bold">
                        <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                      </select>
                    </div>
                  )}
                  {(entryMode === "Agenda" || entryMode === "Event") && (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                      <input required type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 text-sm font-bold" />
                    </div>
                  )}
                  {entryMode === "Agenda" && (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Time</label>
                      <input required type="text" value={formData.time} onChange={e=>setFormData({...formData, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 text-sm font-bold" />
                    </div>
                  )}
                  {entryMode === "Event" && (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Event Type</label>
                      <select value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none text-sm font-bold">
                        <option value="Celebration">Celebration</option><option value="Holiday">Holiday</option><option value="Academic">Academic</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}