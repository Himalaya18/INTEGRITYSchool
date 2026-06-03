// Path: app/admin/dashboard/page.tsx
"use client";

import { motion } from "framer-motion";
import { 
  Building2, Landmark, Users, TrendingUp, 
  ShieldAlert, Unlock, Activity, BarChart4, 
  Wallet, Settings, ChevronRight, Eye,
  AlertOctagon, CheckCircle2, ShieldCheck,
  Send, UserPlus, GraduationCap
} from "lucide-react";
import Link from "next/link";

// --- GLOBAL MACRO DATA ---
const globalMetrics = {
  totalRevenue: "₹ 4,85,000",
  netProfit: "₹ 3,73,000",
  totalStudents: 342,
  activeStaff: 11,
};

const systemInterventions = [
  { id: "INT-01", type: "Gradebook Override", requestedBy: "Sneha Desai (Principal)", detail: "Requesting unlock for Class 8 Math Final Ledger.", risk: "High" },
  { id: "INT-02", type: "Fee Waiver Approval", requestedBy: "Accounts Dept", detail: "15% sibling discount for STU-702.", risk: "Medium" },
];

export default function UnifiedFounderDashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-full flex flex-col relative pb-24 space-y-6">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-teal-100 text-teal-600 rounded-2xl flex items-center justify-center shadow-inner border border-teal-200/50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Integrity Education</h1>
              <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <ShieldAlert className="w-3 h-3"/> Root Access
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm">Founder's Control View • Integrity S & E School Hub</p>
          </div>
        </div>
        
        <div className="relative z-10 flex gap-3 w-full xl:w-auto">
          <button className="flex-1 xl:flex-none bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
            <BarChart4 className="w-4 h-4"/> Master Audit
          </button>
        </div>
      </div>

      {/* ================= TOP TIER: GLOBAL KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 shrink-0">
        
        {/* Revenue */}
        <div className="bg-white border border-slate-200/60 p-6 rounded-[2rem] shadow-sm group flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100"><Landmark className="w-6 h-6"/></div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+12% vs Target</span>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800">{globalMetrics.totalRevenue}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">YTD Gross Revenue</p>
          </div>
        </div>

        {/* Profit */}
        <div className="bg-white border border-slate-200/60 p-6 rounded-[2rem] shadow-sm group flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100"><TrendingUp className="w-6 h-6"/></div>
          </div>
          <div>
            <p className="text-4xl font-black text-blue-600">{globalMetrics.netProfit}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Surplus/Net Margin</p>
          </div>
        </div>

        {/* Enrollment */}
        <div className="bg-white border border-slate-200/60 p-6 rounded-[2rem] shadow-sm group flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100"><GraduationCap className="w-6 h-6"/></div>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800">{globalMetrics.totalStudents}<span className="text-2xl text-slate-300">/500</span></p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Total Enrollment</p>
          </div>
        </div>

        {/* Retention */}
        <div className="bg-white border border-slate-200/60 p-6 rounded-[2rem] shadow-sm group flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100"><Users className="w-6 h-6"/></div>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800">{globalMetrics.activeStaff}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Active Staff Personnel</p>
          </div>
        </div>

      </div>

      {/* ================= MIDDLE TIER: INTERVENTION & DIRECT COMMAND ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
        
        {/* Intervention Overrides (What only Admin can do) */}
        <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h2 className="font-black text-slate-800 text-lg flex items-center gap-2"><Unlock className="w-5 h-5 text-red-500"/> System Interventions</h2>
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Root Overrides Pending</p>
            </div>
            <button className="text-sm font-black text-emerald-600 hover:text-emerald-700 transition-colors">Intervention Log</button>
          </div>
          
          <div className="p-6 space-y-4 flex-1 overflow-y-auto no-scrollbar">
            {systemInterventions.map((intervention) => (
              <div key={intervention.id} className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-5 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all bg-white group">
                <div className="flex items-start gap-4">
                  <div className={`w-1.5 h-12 rounded-full shrink-0 ${intervention.risk === 'High' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{intervention.type}</span>
                      <h3 className="font-bold text-slate-800 text-sm">{intervention.requestedBy}</h3>
                    </div>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">{intervention.detail}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <button className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-black text-xs rounded-xl transition-colors">Authorize</button>
                  <button className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 font-bold text-xs rounded-xl transition-colors">Deny</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Direct Command Post (Send Tasks) */}
        <div className="bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-800 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full blur-2xl pointer-events-none"></div>
          
          <div className="p-6 border-b border-slate-800 bg-slate-950/50 relative z-10">
            <h2 className="font-black text-white text-lg flex items-center gap-2"><Send className="w-5 h-5 text-blue-400"/> Direct Command</h2>
            <p className="text-xs font-medium text-slate-400 mt-1">Broadcast tasks directly to Principal/Staff.</p>
          </div>

          <form className="p-6 flex-1 flex flex-col gap-4 relative z-10">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Target Recipient</label>
              <select className="w-full bg-slate-800/50 border border-slate-700 text-white font-bold rounded-xl px-4 py-3 outline-none focus:border-blue-500 appearance-none text-sm cursor-pointer">
                <option>Sneha Desai (Principal)</option>
                <option>Mathematics Department</option>
                <option>All Staff Members</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Directive / Task Detail</label>
              <textarea 
                className="w-full h-32 bg-slate-800/50 border border-slate-700 text-white font-medium rounded-xl px-4 py-3 outline-none focus:border-blue-500 resize-none text-sm placeholder:text-slate-600"
                placeholder="Type your instruction or high-priority task here..."
              ></textarea>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm border border-blue-500/50">
              <Send className="w-4 h-4"/> Issue Command
            </button>
          </form>
        </div>

      </div>

      {/* ================= BOTTOM TIER: QUICK ACCESS NODES ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/60 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-emerald-300 transition-all cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><UserPlus className="w-6 h-6"/></div>
            <div><p className="font-black text-slate-800">Enroll Student</p><p className="text-xs font-bold text-slate-400">Direct Entry Override</p></div>
          </div>
          <ChevronRight className="text-slate-300 group-hover:text-emerald-500" />
        </div>
        
        <div className="bg-white border border-slate-200/60 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-all cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Activity className="w-6 h-6"/></div>
            <div><p className="font-black text-slate-800">Academic Audit</p><p className="text-xs font-bold text-slate-400">Review All Report Cards</p></div>
          </div>
          <ChevronRight className="text-slate-300 group-hover:text-indigo-500" />
        </div>

        <div className="bg-white border border-slate-200/60 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Settings className="w-6 h-6"/></div>
            <div><p className="font-black text-slate-800">Control Panel</p><p className="text-xs font-bold text-slate-400">Manage System Users</p></div>
          </div>
          <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
        </div>
      </div>

    </div>
  );
}