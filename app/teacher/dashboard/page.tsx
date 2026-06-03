// Path: app/teacher/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, CheckCircle2, PenTool, ClipboardCheck, 
  UserCheck, BrainCircuit, Library, LineChart, Loader2 
} from "lucide-react";
import { supabase } from "@/supabase"; // Adjust path if necessary

// Static Timetable (You can move this to DB later)
const todayTimetable = [
  { id: 1, time: "08:30 AM", class: "Class 8 - A", subject: "Mathematics", status: "Completed", room: "Room 101" },
  { id: 2, time: "09:20 AM", class: "Class 7 - B", subject: "Mathematics", status: "Active", room: "Room 104" },
  { id: 3, time: "10:10 AM", class: "Class 8 - A", subject: "Physics", status: "Upcoming", room: "Lab 2" },
];

export default function TeacherWorkspaceContent() {
  const router = useRouter();
  
  // Real Database States
  const [isLoading, setIsLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<{ name: string; role: string; photo: string | null } | null>(null);
  
  // We will dynamically update these stats from the DB
  const [quickStats, setQuickStats] = useState([
    { label: "My Attendance", value: "...", icon: <UserCheck className="w-5 h-5"/>, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending Grading", value: "12", icon: <PenTool className="w-5 h-5"/>, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Class Pass Rate", value: "...", icon: <LineChart className="w-5 h-5"/>, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Feedback Rating", value: "...", icon: <Library className="w-5 h-5"/>, color: "text-purple-600", bg: "bg-purple-50" },
  ]);

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    try {
      // 1. Check who is logged in via the local session
      const sessionStr = localStorage.getItem("currentUser");
      if (!sessionStr) {
        router.replace("/login"); // Kick to login if no session
        return;
      }
      
      const sessionUser = JSON.parse(sessionStr);

      // 2. Fetch their specific staff profile from Supabase using their user_id
      const { data: profileData, error: profileError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', sessionUser.id)
        .single();

      if (profileError || !profileData) {
        console.error("Profile fetch error:", profileError);
        // Fallback if profile doesn't exist yet but user does
        setTeacherProfile({ name: sessionUser.name, role: "Teacher", photo: null });
        setIsLoading(false);
        return;
      }

      // Set the profile UI data
      setTeacherProfile({
        name: `${profileData.first_name} ${profileData.last_name}`,
        role: `${profileData.designation} • ${profileData.department}`,
        photo: profileData.photo_url || null
      });

      // 3. Fetch their performance metrics for the Quick Stats
      const { data: metricsData } = await supabase
        .from('staff_metrics')
        .select('*')
        .eq('staff_id', profileData.id)
        .single();

      if (metricsData) {
        const totalDays = metricsData.present_days + metricsData.absent_days;
        const attendancePct = totalDays === 0 ? 100 : Math.round((metricsData.present_days / totalDays) * 100);

        setQuickStats([
          { label: "My Attendance", value: `${attendancePct}%`, icon: <UserCheck className="w-5 h-5"/>, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Grading", value: "12", icon: <PenTool className="w-5 h-5"/>, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Class Pass Rate", value: `${metricsData.pass_percentage}%`, icon: <LineChart className="w-5 h-5"/>, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Feedback Rating", value: `${metricsData.rating}/5`, icon: <Library className="w-5 h-5"/>, color: "text-purple-600", bg: "bg-purple-50" },
        ]);
      }

    } catch (error) {
      console.error("Unexpected error loading dashboard:", error);
    } finally {
      setIsLoading(false);
    }
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
          <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-pointer">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-2xl font-black text-slate-800 leading-none">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</p>
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
                <button className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-sm font-bold transition-all backdrop-blur-md">Generate Quiz</button>
                <button className="flex-1 sm:flex-none bg-white text-purple-900 px-4 py-2.5 rounded-xl text-sm font-black shadow-lg hover:shadow-xl transition-all">Open AI Chat</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 sm:p-8 flex-1">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500"/> Today's Schedule</h2></div>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
              {todayTimetable.map((slot, idx) => {
                  const isActive = slot.status === "Active";
                  return (
                      <div key={slot.id} className="relative flex items-start gap-6 group">
                          <div className={`w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shrink-0 relative z-10 shadow-sm ${isActive ? 'bg-blue-500 text-white' : slot.status === 'Completed' ? 'bg-slate-200 text-slate-500' : 'bg-white border-slate-200 text-slate-300'}`}>
                            {isActive ? <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div> : <span className="text-xs font-black">{idx + 1}</span>}
                          </div>
                          <div className={`flex-1 p-5 rounded-2xl border transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 border-blue-600' : slot.status === 'Completed' ? 'bg-slate-50 border-slate-100 opacity-70' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <h3 className={`font-black text-lg ${isActive ? 'text-white' : 'text-slate-800'}`}>{slot.class}</h3>
                                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isActive ? 'bg-blue-500 text-blue-100' : 'bg-slate-200 text-slate-500'}`}>{slot.room}</span>
                                      </div>
                                      <p className={`text-sm font-bold flex items-center gap-1.5 ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>{slot.time} • {slot.subject}</p>
                                  </div>
                                  <div className="shrink-0 w-full sm:w-auto">
                                      {isActive ? (
                                        <button className="w-full bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-transform flex items-center justify-center gap-2"><ClipboardCheck className="w-4 h-4"/> Log Attendance</button>
                                      ) : slot.status !== 'Completed' && (
                                        <button className="w-full bg-slate-50 text-slate-500 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-slate-100">View Subject Material</button>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>
                  );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TASKS & GROWTH */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full blur-2xl"></div>
            <h3 className="font-black text-white text-lg flex items-center gap-2 mb-4 relative z-10"><Library className="w-5 h-5 text-emerald-400"/> Learning Hub</h3>
            <div className="bg-white/10 border border-white/10 rounded-xl p-4 relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Continue Course</p>
              <p className="font-bold text-white text-sm mb-3">Modern Activity-Based Learning</p>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '45%' }}></div></div>
              <p className="text-[10px] text-slate-400 font-bold text-right">45% Completed</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col flex-1">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2 mb-6"><PenTool className="w-5 h-5 text-amber-500"/> Action Required</h3>
            <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3 hover:border-amber-200 cursor-pointer">
                    <div className="mt-0.5"><CheckCircle2 className="w-5 h-5 text-slate-300" /></div>
                    <div><p className="text-sm font-bold text-slate-700">Upload Term 1 Grades</p><span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-100 text-red-700 mt-1.5 inline-block">High Priority</span></div>
                </div>
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3 hover:border-amber-200 cursor-pointer">
                    <div className="mt-0.5"><CheckCircle2 className="w-5 h-5 text-slate-300" /></div>
                    <div><p className="text-sm font-bold text-slate-700">Create Algebra Paper</p><span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 mt-1.5 inline-block">Medium Priority</span></div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}