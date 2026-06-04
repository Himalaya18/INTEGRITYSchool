// Path: app/teacher/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, CheckCircle2, PenTool, ClipboardCheck, 
  UserCheck, BrainCircuit, Library, LineChart, Loader2, Sparkles, BookOpen
} from "lucide-react";
import { supabase } from "@/supabase";

export default function TeacherWorkspaceContent() {
  const router = useRouter();
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<{ id: string; name: string; role: string; photo: string | null } | null>(null);
  
  // Dynamic Data States
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  
  const [quickStats, setQuickStats] = useState([
    { label: "My Attendance", value: "...", icon: <UserCheck className="w-5 h-5"/>, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending Tasks", value: "...", icon: <PenTool className="w-5 h-5"/>, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Class Pass Rate", value: "...", icon: <LineChart className="w-5 h-5"/>, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Feedback Rating", value: "...", icon: <Library className="w-5 h-5"/>, color: "text-purple-600", bg: "bg-purple-50" },
  ]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // 1. Authenticate local session
      const sessionStr = localStorage.getItem("currentUser");
      if (!sessionStr) {
        router.replace("/"); 
        return;
      }
      
      const sessionUser = JSON.parse(sessionStr);

      // 2. Fetch specific staff profile using their user_id
      const { data: profileData, error: profileError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', sessionUser.id)
        .single();

      // We need the EMP ID to link everything else
      const empId = profileData ? profileData.id : sessionUser.id; // Fallback to session ID if profile missing

      setTeacherProfile({
        id: empId,
        name: profileData ? `${profileData.first_name} ${profileData.last_name}` : sessionUser.name,
        role: profileData ? `${profileData.designation} • ${profileData.department}` : "Teacher",
        photo: profileData?.photo_url || null
      });

      // 3. Fetch TODAY'S Schedule from planner_agendas
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: scheduleData } = await supabase
        .from('planner_agendas')
        .select('*')
        .eq('teacher_id', empId)
        .eq('date', todayStr)
        .order('time', { ascending: true });
      
      if (scheduleData) setTodaySchedule(scheduleData);

      // 4. Fetch Pending Tasks from planner_todos
      const { data: taskData } = await supabase
        .from('planner_todos')
        .select('*')
        .eq('teacher_id', empId)
        .eq('done', false)
        .order('created_at', { ascending: false })
        .limit(4); // Just get top 4 for the widget
      
      if (taskData) {
        setPendingTasks(taskData);
        // Update the "Pending Tasks" stat box
        setQuickStats(prev => {
          const newStats = [...prev];
          newStats[1].value = taskData.length.toString();
          return newStats;
        });
      }

      // 5. Fetch Performance Metrics (If available)
      if (profileData) {
        const { data: metricsData } = await supabase
          .from('staff_metrics')
          .select('*')
          .eq('staff_id', empId)
          .single();

        if (metricsData) {
          const totalDays = metricsData.present_days + metricsData.absent_days;
          const attendancePct = totalDays === 0 ? 100 : Math.round((metricsData.present_days / totalDays) * 100);

          setQuickStats(prev => [
            { label: "My Attendance", value: `${attendancePct}%`, icon: <UserCheck className="w-5 h-5"/>, color: "text-emerald-600", bg: "bg-emerald-50" },
            prev[1], // Keep pending tasks
            { label: "Class Pass Rate", value: `${metricsData.pass_percentage}%`, icon: <LineChart className="w-5 h-5"/>, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Feedback Rating", value: `${metricsData.rating}/5`, icon: <Library className="w-5 h-5"/>, color: "text-purple-600", bg: "bg-purple-50" },
          ]);
        }
      }

    } catch (error) {
      console.error("Unexpected error loading dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Action Handlers
  const completeTask = async (taskId: string) => {
    // Optimistic UI Update
    setPendingTasks(prev => prev.filter(t => t.id !== taskId));
    setQuickStats(prev => {
      const newStats = [...prev];
      newStats[1].value = (parseInt(newStats[1].value) - 1).toString();
      return newStats;
    });

    // Database Update
    await supabase.from('planner_todos').update({ done: true }).eq('id', taskId);
  };

  const markScheduleDone = async (slotId: string) => {
    // Optimistic UI Update
    setTodaySchedule(prev => prev.map(s => s.id === slotId ? { ...s, status: 'Completed' } : s));
    // Database Update
    await supabase.from('planner_agendas').update({ status: 'Completed' }).eq('id', slotId);
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Workspace...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex items-center gap-4">
          {teacherProfile?.photo ? (
            <img src={teacherProfile.photo} alt="Profile" className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-sm">
              {teacherProfile?.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Welcome back, {teacherProfile?.name.split(" ")[0]}</h1>
            <p className="text-slate-500 font-medium mt-1 text-sm">{teacherProfile?.role} • {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
      </div>

      {/* QUICK STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-default">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>{stat.icon}</div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-black text-slate-800 leading-none truncate">{stat.value}</p>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN: TIMETABLE & AI */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-[2rem] shadow-lg p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full -z-0 blur-2xl"></div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-black text-white text-xl flex items-center gap-2 mb-2"><BrainCircuit className="w-6 h-6 text-purple-300"/> AI Teaching Assistant</h3>
                <p className="text-purple-200 text-sm font-medium">Generate question papers, summarize notes, or plan lessons instantly.</p>
              </div>
              <div className="w-full sm:w-auto flex gap-2">
                <button onClick={() => router.push("/teacher/dashboard/ai")} className="flex-1 sm:flex-none bg-white text-purple-900 px-6 py-3 rounded-xl text-sm font-black shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4"/> Integrity AI
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 sm:p-8 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500"/> Today's Schedule</h2>
              <button onClick={() => router.push("/teacher/dashboard/planner")} className="text-xs font-bold text-blue-600 hover:underline">View Full Planner</button>
            </div>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
              {todaySchedule.length === 0 ? (
                <div className="py-10 text-center relative z-10">
                  <p className="text-slate-500 font-bold">No classes or blocks scheduled for today.</p>
                  <button onClick={() => router.push("/teacher/dashboard/planner")} className="mt-3 text-sm font-bold text-indigo-600">Open Planner to add blocks</button>
                </div>
              ) : (
                todaySchedule.map((slot, idx) => {
                  const isActive = slot.status === "Active" || slot.status === "Upcoming"; // Treat upcoming as active for UI simplicity
                  return (
                    <div key={slot.id} className="relative flex items-start gap-4 sm:gap-6 group">
                        <div className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shrink-0 relative z-10 shadow-sm ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {isActive ? <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div> : <span className="text-xs font-black">{idx + 1}</span>}
                        </div>
                        <div className={`flex-1 p-4 sm:p-5 rounded-2xl border transition-all ${isActive ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-70 hover:opacity-100'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={`font-black text-lg ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>{slot.task}</h3>
                                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${slot.type === 'Class' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>{slot.type}</span>
                                    </div>
                                    <p className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                                      <Clock className="w-3.5 h-3.5"/> {slot.time} {slot.room ? `• ${slot.room}` : ''}
                                    </p>
                                </div>
                                <div className="shrink-0 w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                                    {isActive && slot.type === 'Class' && (
                                      <button onClick={() => router.push("/teacher/dashboard/attendance")} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                                        <ClipboardCheck className="w-4 h-4"/> Attendance
                                      </button>
                                    )}
                                    {isActive && (
                                      <button onClick={() => markScheduleDone(slot.id)} className="w-full sm:w-auto bg-white text-slate-600 border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                                        <CheckCircle2 className="w-4 h-4"/> Done
                                      </button>
                                    )}
                                    {slot.status === 'Completed' && slot.lesson && (
                                      <button className="w-full sm:w-auto bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                        <BookOpen className="w-4 h-4"/> View Notes
                                      </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TASKS & GROWTH */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl p-6 relative overflow-hidden cursor-pointer hover:border-slate-700 transition-colors" onClick={() => router.push("/teacher/dashboard/learning")}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full blur-2xl"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="font-black text-white text-lg flex items-center gap-2"><Library className="w-5 h-5 text-emerald-400"/> Learning Hub</h3>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-xl p-4 relative z-10 hover:bg-white/20 transition-colors">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Continue Course</p>
              <p className="font-bold text-white text-sm mb-3">Modern Activity-Based Learning</p>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '45%' }}></div></div>
              <p className="text-[10px] text-slate-400 font-bold text-right">45% Completed</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><PenTool className="w-5 h-5 text-amber-500"/> Task List</h3>
              <button onClick={() => router.push("/teacher/dashboard/planner")} className="text-xs font-bold text-blue-600 hover:underline">Manage</button>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
              {pendingTasks.length === 0 ? (
                 <div className="py-6 text-center">
                   <CheckCircle2 className="w-10 h-10 text-emerald-200 mx-auto mb-2" />
                   <p className="text-slate-400 font-bold text-sm">All caught up!</p>
                 </div>
              ) : (
                pendingTasks.map(task => (
                  <div key={task.id} onClick={() => completeTask(task.id)} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3 hover:border-amber-300 hover:bg-amber-50 cursor-pointer transition-all group">
                      <div className="mt-0.5"><div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-amber-400 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" /></div></div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{task.text}</p>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mt-1.5 inline-block ${task.priority === 'High' ? 'bg-red-100 text-red-700' : task.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{task.priority}</span>
                      </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}