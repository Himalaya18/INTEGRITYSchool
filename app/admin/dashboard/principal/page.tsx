"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Users, GraduationCap, TrendingUp, Calendar, ChevronRight, 
  CheckCircle2, Megaphone, Presentation, CreditCard, 
  Briefcase, Clock, FileWarning, ArrowUpRight, IndianRupee, 
  Loader2, Activity, ShieldCheck, MapPin
} from "lucide-react";
import { supabase } from "@/supabase";

interface DashboardMetrics {
  totalStudents: number;
  totalTeachers: number;
  todayPresentStaff: number;
  attendanceRate: number;
  pendingLeaves: number;
  totalCollectionsThisMonth: number;
}

export default function PrincipalDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [liveNotices, setLiveNotices] = useState<any[]>([]);
  const [pendingLeaveList, setPendingLeaveList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  useEffect(() => {
    loadDashboardData();

    // REAL-TIME CORE MONITOR: Synchronizes all charts and tables across data pipelines
    const dashboardChannel = supabase.channel('principal-core-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_attendance' }, () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fee_transactions' }, () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => loadDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'digital_wall_posts' }, () => loadDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(dashboardChannel);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      // 1. Fetch Core Student Metrics
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');

      // 2. Fetch Core Faculty Metrics
      const { data: teachers } = await supabase
        .from('staff_profiles')
        .select('id, first_name, last_name, designation');

      // 3. Fetch Today's Staff Attendance
      const { data: todayAttendance } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('date', todayStr);

      // 4. Fetch Pending Leave Requests
      const { data: leaves } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });

      // 5. Fetch Live Financial Transactions
      const { data: txns } = await supabase
        .from('fee_transactions')
        .select('*')
        .order('payment_date', { ascending: false })
        .limit(5);

      // 6. Fetch Global System Notices
      const { data: notices } = await supabase
        .from('digital_wall_posts')
        .select('*')
        .eq('status', 'Live')
        .order('created_at', { ascending: false })
        .limit(2);

      // 7. Fetch System Audit Logs
      const { data: audits } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      // 8. Fetch Upcoming Planner Events
      const { data: events } = await supabase
        .from('planner_events')
        .select('*')
        .gte('date', todayStr)
        .order('date', { ascending: true })
        .limit(3);

      // Compute aggregates
      const totalStudents = studentCount || 0;
      const totalTeachers = teachers?.length || 0;
      const presentStaffCount = todayAttendance?.filter(a => a.status === 'Present').length || 0;
      const staffAttendanceRate = totalTeachers > 0 ? Math.round((presentStaffCount / totalTeachers) * 100) : 0;
      const totalMonthFees = txns?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

      setMetrics({
        totalStudents,
        totalTeachers,
        todayPresentStaff: presentStaffCount,
        attendanceRate: staffAttendanceRate,
        pendingLeaves: leaves?.length || 0,
        totalCollectionsThisMonth: totalMonthFees
      });

      if (txns) setRecentTransactions(txns);
      if (notices) setLiveNotices(notices);
      if (audits) setAuditLogs(audits);
      if (events) setUpcomingEvents(events);
      
      // Match names to leave logs
      if (leaves && teachers) {
        const structuralLeaves = leaves.map(l => {
          const matchedTeacher = teachers.find(t => t.id === l.teacher_id);
          return {
            ...l,
            teacherName: matchedTeacher ? `${matchedTeacher.first_name} ${matchedTeacher.last_name}` : 'Faculty Member',
            designation: matchedTeacher ? matchedTeacher.designation : 'Staff'
          };
        });
        setPendingLeaveList(structuralLeaves.slice(0, 3)); // Show top 3
      }

    } catch (err) {
      console.error("Critical error building principal analytics layout:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  if (isLoading || !metrics) {
    return (
      <div className="flex h-[85vh] items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse text-xs tracking-widest uppercase">Initializing Analytical Core...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 pb-32 max-w-[1600px] mx-auto font-sans bg-[#F8F9FA] min-h-screen">
      
      {/* 1. HERO BRANDING & ACTION CONTROL */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] translate-y-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-blue-100 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest border border-white/10 shadow-inner">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Admin Secured
              </span>
              <span className="text-xs font-bold text-slate-400 bg-black/20 px-3 py-2 rounded-full border border-white/5">Session: 2026-2027</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight leading-tight">Analytical Command Center</h2>
            <p className="text-blue-100/70 font-medium text-base sm:text-lg leading-relaxed max-w-2xl">
              Real-time synchronization active. You currently have <strong className="text-white font-black underline decoration-amber-400">{metrics.pendingLeaves} pending staff leaves</strong> and an active campus-wide attendance rate of <strong className="text-emerald-400 font-black">{metrics.attendanceRate}%</strong> today.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/admin/dashboard/meetings" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-black px-6 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm">
              <Presentation className="w-4 h-4" /> Call Briefing
            </Link>
            <Link href="/admin/dashboard/digital-wall" className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-4 rounded-2xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 text-sm">
              <Megaphone className="w-4 h-4" /> Broadcast Notice
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 2. CORE PERFORMANCE METRICS */}
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6"
      >
        <StatCard icon={<GraduationCap/>} title="Enrolled Students" value={metrics.totalStudents.toLocaleString()} subtext="Active Profiles" color="blue" trend="+2% M/M" />
        <StatCard icon={<Users/>} title="Faculty Present" value={`${metrics.todayPresentStaff}/${metrics.totalTeachers}`} subtext={`${metrics.attendanceRate}% Logged In Today`} color="purple" trend={metrics.attendanceRate >= 90 ? "Optimal" : "Review"} />
        <StatCard icon={<IndianRupee/>} title="Month Cashflow" value={`₹${metrics.totalCollectionsThisMonth.toLocaleString('en-IN')}`} subtext={`Collected in ${currentMonthName}`} color="emerald" trend="Live" />
        <StatCard icon={<FileWarning/>} title="Open HR Requests" value={metrics.pendingLeaves.toString()} subtext="Leaves Awaiting Approval" color="amber" trend="Action Req." />
      </motion.div>

      {/* 3. BENTO GRAPH GRID HOUSING PIPELINES */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        
        {/* ================= LEFT COLUMN: FINANCE & PLANNER (Span 8) ================= */}
        <div className="xl:col-span-8 flex flex-col gap-6 lg:gap-8">
          
          {/* Quick Workflows Routing Deck */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-wrap lg:flex-nowrap gap-4">
            <QuickActionLink href="/admin/dashboard/fees" icon={<CreditCard />} title="Fee Center" color="emerald" />
            <QuickActionLink href="/admin/dashboard/staff-attendance" icon={<Users />} title="Staff Log" color="blue" />
            <QuickActionLink href="/admin/dashboard/meetings" icon={<Presentation />} title="Comms" color="purple" />
            <QuickActionLink href="/admin/dashboard/notices" icon={<Megaphone />} title="Digi-Wall" color="indigo" />
            <QuickActionLink href="/admin/dashboard/students" icon={<GraduationCap />} title="Students" color="amber" />
          </motion.div>

          {/* Real-Time Live Finance Ledger Block */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-600" /> Recent Collection Pipeline
              </h3>
              <Link href="/admin/dashboard/Fees" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-colors">View Full Ledger</Link>
            </div>
            
            <div className="overflow-x-auto">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold text-sm">No transaction statements indexed.</div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Receipt No.</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Payment Method</th>
                      <th className="px-6 py-4 text-right">Settled Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentTransactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{txn.receipt_no}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{txn.fee_type} <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 ml-1 uppercase">{txn.fee_month}</span></td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${txn.payment_mode === 'Cash' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                            {txn.payment_mode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600 text-base">₹{Number(txn.amount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>

          {/* Campus Planner Events */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" /> Upcoming Campus Events
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/30">
              {upcomingEvents.length === 0 ? (
                <div className="col-span-3 text-center py-6 text-slate-400 font-bold text-sm">No upcoming events scheduled in the planner.</div>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-300 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl px-3 py-2 text-center">
                        <span className="block text-[10px] font-black uppercase tracking-widest leading-none mb-1">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="block text-xl font-black leading-none">{new Date(event.date).toLocaleDateString('en-US', { day: 'numeric' })}</span>
                      </div>
                      <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border border-slate-200">{event.type}</span>
                    </div>
                    <h4 className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2">{event.name}</h4>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* ================= RIGHT COLUMN: HR & SYSTEM AUDIT (Span 4) ================= */}
        <div className="xl:col-span-4 flex flex-col gap-6 lg:gap-8">
          
          {/* HR Operations Workflow Terminal */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
            <h3 className="font-black text-slate-800 text-base mb-6 flex items-center gap-2 relative z-10">
              <FileWarning className="w-4 h-4 text-amber-500" /> Pending Leave Approvals
            </h3>
            
            <div className="space-y-4 relative z-10 flex-1">
              {pendingLeaveList.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 h-full min-h-[150px]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <p className="text-xs font-bold text-emerald-800">All leave requests processed.</p>
                </div>
              ) : (
                pendingLeaveList.map((leave) => (
                  <div key={leave.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-amber-300 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-black text-slate-800 text-sm">{leave.teacherName}</h4>
                        <p className="text-[10px] font-bold text-slate-400">{leave.designation}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded">{leave.duration}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                      <p className="text-xs font-medium text-slate-600 line-clamp-1 italic">"{leave.reason}"</p>
                    </div>
                    <Link href="/admin/dashboard/staff-attendance" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-800 w-max">Review in Portal <ChevronRight className="w-3 h-3"/></Link>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* System Security & Audit Log Feed */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-blue-900 p-6 sm:p-8 rounded-3xl shadow-xl text-white relative overflow-hidden flex flex-col flex-1">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-bl-[100px] pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="font-black text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" /> Live System Audit
              </h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar relative z-10 mb-4">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold text-center py-6">No recent system activity recorded.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 items-start group">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                      <div className="w-px h-10 bg-slate-700/50 my-1 group-last:hidden"></div>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">{log.action}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{log.details}</p>
                      <p className="text-[9px] font-bold text-slate-500 mt-1">{new Date(log.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// SEPARATE ATOMIC PRESENTATION SUB-COMPONENTS
// ==========================================
function StatCard({ icon, title, value, subtext, color, trend }: { icon: any, title: string, value: string, subtext: string, color: string, trend: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };
  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} 
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between h-full"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[100px] opacity-10 transition-transform duration-500 group-hover:scale-125 ${colorMap[color].split(' ')[0]}`}></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${colorMap[color]}`}>
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-1 rounded-md border border-slate-200">{trend}</span>
      </div>
      
      <div className="relative z-10 mt-auto">
        <h4 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight leading-none mb-1">{value}</h4>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-[10px] font-bold text-slate-500 mt-4 border-t border-slate-100 pt-3 flex items-center gap-1">{subtext}</p>
      </div>
    </motion.div>
  );
}

function QuickActionLink({ href, icon, title, color }: { href: string, icon: any, title: string, color: string }) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-100 border-amber-100",
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100 border-blue-100",
    purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-100 border-purple-100",
    indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 border-emerald-100"
  };
  return (
    <Link href={href} className="flex-1 group flex flex-col items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all hover:shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border ${colorMap[color]}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black text-slate-700 text-center tracking-widest uppercase">{title}</span>
    </Link>
  );
}