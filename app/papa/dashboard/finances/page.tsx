// Path: app/admin/dashboard/finances/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, TrendingUp, TrendingDown, IndianRupee, Download, Filter, 
  ArrowUpRight, ArrowDownRight, BarChart4, Receipt, CheckCircle2, 
  Clock, ShoppingCart, Users, XCircle, FileText, ChevronRight, X
} from "lucide-react";

// --- LIGHTWEIGHT MOCK DATA ---
const TRANSACTIONS = [
  { id: "TX-501", desc: "Term 2 Fee Bulk", cat: "Tuition", type: "Inflow", amount: 490000, date: "12 May", status: "Cleared" },
  { id: "TX-503", desc: "Staff Payroll", cat: "Payroll", type: "Outflow", amount: 280000, date: "01 May", status: "Pending" },
  { id: "TX-504", desc: "Printer Ink & Supplies", cat: "Consumables", type: "Outflow", amount: 15000, date: "18 May", status: "Cleared" },
];

const REQUESTS = [
  { id: "REQ-104", item: "50x Student Desks", reqBy: "Principal Desai", amount: 125000, cat: "Infrastructure", date: "21 May", status: "Pending" },
];

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState("Analytics");
  const [selectedReq, setSelectedReq] = useState<any>(null);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-4 sm:p-8 space-y-8 pb-32 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Financial Suite</h1>
          <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">Enterprise Reporting & Audit Control</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {["Analytics", "Ledger", "Procurement"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === t ? "bg-white shadow text-blue-600" : "text-slate-400"}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Analytics View */}
      {activeTab === "Analytics" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase">Total Revenue</p>
              <p className="text-4xl font-black mt-2">{formatCurrency(490000)}</p>
           </div>
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase">Total Expenses</p>
              <p className="text-4xl font-black mt-2">{formatCurrency(295000)}</p>
           </div>
           <div className="bg-blue-600 p-8 rounded-3xl shadow-lg shadow-blue-200">
              <p className="text-blue-200 font-black text-[10px] uppercase">Net Surplus</p>
              <p className="text-4xl font-black mt-2 text-white">{formatCurrency(195000)}</p>
           </div>
        </motion.div>
      )}

      {/* Ledger View */}
      {activeTab === "Ledger" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
           {TRANSACTIONS.map((t, i) => (
             <div key={t.id} className={`p-6 flex justify-between items-center ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
                <div><p className="font-black">{t.desc}</p><p className="text-[10px] font-bold text-slate-400">{t.cat} • {t.date}</p></div>
                <div className="text-right">
                  <p className={`font-black ${t.type === 'Inflow' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'Inflow' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Procurement View */}
      {activeTab === "Procurement" && (
        <div className="space-y-4">
           {REQUESTS.map(req => (
             <div key={req.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-black text-lg">{req.item}</p>
                  <p className="text-xs font-bold text-slate-500">{req.reqBy} • {req.cat}</p>
                </div>
                <button onClick={() => setSelectedReq(req)} className="bg-slate-900 text-white text-xs font-black px-6 py-3 rounded-xl">View Details</button>
             </div>
           ))}
        </div>
      )}

      {/* Audit Modal */}
      <AnimatePresence>
        {selectedReq && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-6 z-50">
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-[2rem] w-full max-w-md shadow-2xl">
                <div className="flex justify-between mb-6">
                  <h2 className="font-black text-xl">Audit: {selectedReq.item}</h2>
                  <button onClick={() => setSelectedReq(null)}><X size={20}/></button>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 font-bold text-sm text-slate-600">{selectedReq.desc}</div>
                <button onClick={() => { alert("Approved!"); setSelectedReq(null); }} className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl">Authorize Payment</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}