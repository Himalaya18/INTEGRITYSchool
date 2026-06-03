// Path: app/admin/dashboard/layout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  LayoutDashboard, Users, GraduationCap, 
  Wallet, Settings, LogOut, Menu, Bell,
  CalendarCheck, FileSignature, Presentation, 
  Receipt, Megaphone, Briefcase, FolderOpen, Calendar, BookOpen, CreditCard
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userRole = (session?.user as any)?.role || 'teacher';
  const userName = session?.user?.name || 'Staff Member';

  // 👑 ADMIN ONLY (Sees everything, including Revenue & Fees)
  const adminNavGroups = [
    {
      group: "Overview",
      items: [{ name: "Master Command", href: "/admin/dashboard/admin", icon: <LayoutDashboard className="w-5 h-5" /> }]
    },
    {
      group: "Financial Health",
      items: [
        { name: "Revenue & Fees", href: "/admin/dashboard/fees", icon: <Wallet className="w-5 h-5" /> },
        { name: "Expense Tracking", href: "/admin/dashboard/expenses", icon: <CreditCard className="w-5 h-5" /> },
        { name: "Payroll Management", href: "/admin/dashboard/payroll", icon: <Briefcase className="w-5 h-5" /> },
      ]
    },
    {
      group: "School Operations",
      items: [
        { name: "Student Directory", href: "/admin/dashboard/students", icon: <Users className="w-5 h-5" /> },
        { name: "Faculty Management", href: "/admin/dashboard/faculty", icon: <GraduationCap className="w-5 h-5" /> },
      ]
    },
    {
      group: "System",
      items: [{ name: "Global Settings", href: "/admin/dashboard/settings", icon: <Settings className="w-5 h-5" /> }]
    }
  ];

  // 🎓 PRINCIPAL (Operations & Expenses, NO REVENUE)
  const principalNavGroups = [
    {
      group: "Overview",
      items: [{ name: "Command Center", href: "/admin/dashboard/principal", icon: <LayoutDashboard className="w-5 h-5" /> }]
    },
    {
      group: "Academics",
      items: [
        { name: "Student Directory", href: "/admin/dashboard/students", icon: <Users className="w-5 h-5" /> },
        { name: "Report Cards", href: "/admin/dashboard/report-cards", icon: <FileSignature className="w-5 h-5" /> },
        { name: "Academic Calendar", href: "/admin/dashboard/calendar", icon: <Calendar className="w-5 h-5" /> },
      ]
    },
    {
      group: "HR & Staff",
      items: [
        { name: "Faculty Management", href: "/admin/dashboard/faculty", icon: <GraduationCap className="w-5 h-5" /> },
        { name: "Staff Attendance", href: "/admin/dashboard/staff-attendance", icon: <CalendarCheck className="w-5 h-5" /> },
      ]
    },
    {
      group: "Operations",
      items: [
        // Principal gets expenses, but NOT fee tracking/revenue!
        { name: "Manage Expenses", href: "/admin/dashboard/expenses", icon: <CreditCard className="w-5 h-5" /> }, 
        { name: "Document Vault", href: "/admin/dashboard/documents", icon: <FolderOpen className="w-5 h-5" /> },
        { name: "Fee Collection", href: "/admin/dashboard/fees", icon: <Wallet className="w-5 h-5" /> },
      ]
    },
    {
      group: "Communications",
      items: [
        { name: "Digital Wall", href: "/admin/dashboard/notices", icon: <Megaphone className="w-5 h-5" /> },
        { name: "Staff Meetings", href: "/admin/dashboard/meetings", icon: <Presentation className="w-5 h-5" /> },
      ]
    }
  ];

  // 🍎 TEACHER (Restricted)
  const teacherNavGroups = [
    {
      group: "My Space",
      items: [
        { name: "My Dashboard", href: "/admin/dashboard/teacher", icon: <LayoutDashboard className="w-5 h-5" /> },
        { name: "My Classes & Students", href: "/admin/dashboard/my-classes", icon: <Users className="w-5 h-5" /> },
      ]
    },
    {
      group: "Academics",
      items: [
        { name: "Mark Attendance", href: "/admin/dashboard/mark-attendance", icon: <CalendarCheck className="w-5 h-5" /> },
        { name: "Upload Homework", href: "/admin/dashboard/homework", icon: <BookOpen className="w-5 h-5" /> },
        { name: "Gradebook", href: "/admin/dashboard/gradebook", icon: <FileSignature className="w-5 h-5" /> },
      ]
    },
    {
      group: "School",
      items: [
        { name: "Digital Wall", href: "/admin/dashboard/notices", icon: <Megaphone className="w-5 h-5" /> },
        { name: "My Leave Requests", href: "/admin/dashboard/my-leaves", icon: <Calendar className="w-5 h-5" /> },
      ]
    }
  ];

  // ROUTER: Pick the right menu based on role
  const activeNavGroups = 
    userRole === 'admin' ? adminNavGroups : 
    userRole === 'principal' ? principalNavGroups : 
    teacherNavGroups;

  if (status === "loading") return <div className="h-screen bg-slate-50"></div>;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-blue-950 text-white flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20">
            <img src="/logo.png" className="w-10 h-10" alt="Integrity School Logo" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight text-white leading-none">Integrity School</h1>
            <p className="text-[10px] text-blue-300 uppercase tracking-widest font-bold mt-1">
              {userRole === 'admin' ? 'Master Admin' : userRole === 'principal' ? 'Executive Portal' : 'Faculty Portal'}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 no-scrollbar">
          {activeNavGroups.map((group, idx) => (
            <div key={idx}>
              <p className="px-4 text-[10px] font-black text-blue-400/80 uppercase tracking-widest mb-2">{group.group}</p>
              <div className="space-y-1">
                {activeNavGroups.map(g => g.items).flat().map((link) => {
                  if (!group.items.includes(link)) return null;
                  const isActive = pathname === link.href;
                  return (
                    <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-blue-200 hover:bg-white/5 hover:text-white"}`}>
                      {link.icon}
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button onClick={() => signOut({ callbackUrl: '/admin/login' })} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-blue-200 hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" /> Secure Sign Out
          </button>
        </div>
      </aside>

      {/* HEADER & MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-lg bg-slate-100 text-slate-600 lg:hidden hover:bg-slate-200"><Menu className="w-5 h-5" /></button>
            <h2 className="text-xl font-black text-slate-800 hidden sm:block">
              {activeNavGroups.flatMap(g => g.items).find(link => link.href === pathname)?.name || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2.5 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200">
              <Bell className="w-4 h-4" />
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 capitalize">{userName}</p>
                <p className="text-xs text-slate-500 font-medium capitalize">{userRole}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-700 font-black uppercase">
                {userName.charAt(0)}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50/50">{children}</main>
      </div>
    </div>
  );
}