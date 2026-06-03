"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { 
  LayoutDashboard, Wallet, Users, GraduationCap, 
  BookOpen, Target, ShieldAlert, LogOut, Menu, 
  X, Bell, Search, ShieldCheck, ChevronRight
} from "lucide-react";

const navigationMap = [
  { name: "Global Overview", href: "/papa/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: "Financial Ledger", href: "/papa/dashboard/finances", icon: <Wallet className="w-5 h-5" /> },
  { name: "Student Database", href: "/papa/dashboard/students", icon: <GraduationCap className="w-5 h-5" /> },
  { name: "Staff & Payroll", href: "/papa/dashboard/staff", icon: <Users className="w-5 h-5" /> },
  { name: "Academic Reports", href: "/papa/dashboard/academics", icon: <BookOpen className="w-5 h-5" /> },
  { name: "Directives & Tasks", href: "/papa/dashboard/tasks", icon: <Target className="w-5 h-5" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- LOGOUT HANDLER ---
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/staff/login' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200/60 shadow-sm relative z-20">
        
        <div className="h-24 flex items-center px-8 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm border border-blue-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-slate-800 tracking-tight leading-none text-lg">Integrity</h1>
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Admin Access</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 no-scrollbar mt-4">
          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Core Modules</p>
          {navigationMap.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${isActive ? 'bg-blue-50 text-blue-700 font-black' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-bold'}`}>
                  <div className={`shrink-0 transition-transform ${isActive ? '' : 'group-hover:scale-110'}`}>{item.icon}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm leading-tight">{item.name}</p></div>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden text-blue-600 font-black">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-800 truncate">Admin Account</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">System Owner</p>
            </div>
          </div>
          {/* FUNCTIONAL LOGOUT BUTTON */}
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
            <LogOut className="w-4 h-4" /> Terminate Session
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className={`h-24 shrink-0 flex items-center justify-between px-4 sm:px-8 transition-all duration-300 z-10 ${isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm' : 'bg-transparent'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-500 hover:text-slate-800 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center relative w-64 lg:w-96 group">
              <Search className="absolute left-4 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input type="text" placeholder="Search financials, students, or staff..." className="w-full bg-white border border-slate-200/80 text-slate-900 rounded-full py-2.5 pl-11 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm placeholder:text-slate-400 font-medium shadow-sm"/>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg text-red-600">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Confidential Mode</span>
            </div>
            <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative no-scrollbar">
          {children}
        </div>
      </main>

      {/* ================= MOBILE SIDEBAR MODAL ================= */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 flex flex-col lg:hidden shadow-2xl">
              
              <div className="h-24 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
                  <div><h1 className="font-black text-slate-800 text-lg">Integrity</h1><p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-0.5">Admin Access</p></div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-800"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">
                {navigationMap.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-700 font-black' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-bold'}`}>
                        {item.icon}
                        <p className="font-bold text-sm">{item.name}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Logout */}
              <div className="p-6 border-t border-slate-100">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
                  <LogOut className="w-4 h-4" /> Terminate Session
                </button>
              </div>

            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}