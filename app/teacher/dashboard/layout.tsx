"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react"; // Required for secure logout
import { 
  BookOpen, Users, Calendar, PenTool, ClipboardCheck, 
  MessageSquare, Bell, LayoutDashboard, GraduationCap, 
  Settings, Search, Sparkles, UserCheck, 
  BrainCircuit, FileQuestion, LogOut, UserCircle, PieChart,
  Menu, X
} from "lucide-react";
import { supabase } from "@/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic Profile State
  const [profile, setProfile] = useState({
    name: "Loading...",
    avatar: "-",
    photoUrl: ""
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // 1. Get the session ID we saved during login
      const sessionStr = localStorage.getItem("currentUser");
      if (!sessionStr) return;
      
      const user = JSON.parse(sessionStr);

      // 2. Fetch their actual profile data from Supabase
      const { data } = await supabase
        .from('staff_profiles')
        .select('first_name, last_name, photo_url')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile({
          name: `${data.first_name} ${data.last_name}`,
          avatar: `${data.first_name.charAt(0)}${data.last_name.charAt(0)}`,
          photoUrl: data.photo_url || ""
        });
      } else {
        // Fallback if profile row is missing
        setProfile({
          name: user.name || "Teacher",
          avatar: (user.name || "T").charAt(0),
          photoUrl: ""
        });
      }
    } catch (error) {
      console.error("Error loading layout profile:", error);
    }
  };

  // ==========================================
  // SECURE LOGOUT ENGINE
  // ==========================================
  const handleLogout = async () => {
    // 1. Clear the local storage session
    localStorage.removeItem("currentUser");
    
    // 2. Terminate the NextAuth secure cookie session
    await signOut({ redirect: false });
    
    // 3. Kick them back to the login page
    router.replace("/"); // Or wherever your main login is
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">
      
      {/* ================= MOBILE HEADER ================= */}
      <header className="lg:hidden sticky top-0 left-0 w-full h-16 bg-slate-950 text-white z-50 flex items-center justify-between px-4 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="logo" className="w-8 h-8 object-contain"/>
          <span className="font-black text-lg tracking-wide">Integrity</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-300 hover:text-white transition-colors">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* ================= MOBILE EXPANDING ACCORDION MENU ================= */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden w-full bg-slate-900 text-slate-300 shadow-inner flex flex-col border-b border-slate-800 overflow-hidden shrink-0 mt-16" // mt-16 pushes it below the fixed header
          >
            <div className="max-h-[60vh] overflow-y-auto">
               <SidebarContent profile={profile} pathname={pathname} handleLogout={handleLogout} onNavClick={() => setIsMobileMenuOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-slate-300 fixed inset-y-0 left-0 z-50 shadow-2xl">
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-800 shrink-0 bg-slate-950">
          <div className="w-10 h-10 text-white rounded-lg flex items-center justify-center font-black">
            <img src="/logo.png" alt="logo" className="w-full h-full object-cover"/>
          </div>
          <span className="font-black text-white text-lg tracking-wide">Integrity Educator</span>
        </div>
        <SidebarContent profile={profile} pathname={pathname} handleLogout={handleLogout} />
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className={`flex-1 flex flex-col min-w-0 h-[calc(100vh-4rem)] lg:h-screen lg:ml-72 transition-all duration-300 ${isMobileMenuOpen ? 'mt-0' : 'mt-16 lg:mt-0'}`}>
        
        {/* PERSISTENT TOP HEADER (Hidden on mobile, handled by mobile header above) */}
        <header className="hidden lg:flex h-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 items-center justify-between shrink-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search students, materials, or files..." className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-64 lg:w-96 transition-all font-medium" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-4">
            <button className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center gap-2 shadow-sm" onClick={() => router.push("/teacher/dashboard/ai")}>
              <Sparkles className="w-4 h-4" /> Integrity AI
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-full border border-slate-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
          </div>
        </header>

        {/* DYNAMIC PAGE CONTENT INJECTED HERE */}
        <div className="flex-1 overflow-y-auto relative bg-slate-50/50">
           {children}
        </div>
        
      </main>
    </div>
  );
}

// ==========================================
// REUSABLE SIDEBAR COMPONENT
// ==========================================
function SidebarContent({ profile, pathname, handleLogout, onNavClick }: any) {
  return (
    <>
      <nav className="flex-1 px-4 py-4 md:py-6 space-y-1 overflow-y-auto no-scrollbar">
        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">My Workspace</p>
        <NavItem href="/teacher/dashboard" icon={<LayoutDashboard/>} label="Dashboard" active={pathname === "/teacher/dashboard"} onClick={onNavClick} />
        <NavItem href="/teacher/dashboard/planner" icon={<Calendar/>} label="Master Planner" active={pathname === "/teacher/dashboard/planner"} onClick={onNavClick} />
        <NavItem href="/teacher/dashboard/leave" icon={<UserCheck/>} label="My Attendance & Leave" active={pathname === "/teacher/dashboard/leave"} onClick={onNavClick} />
        
        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 mt-6">Classroom Management</p>
        <NavItem href="/teacher/dashboard/classes" icon={<Users/>} label="My Assigned Classes" active={pathname.includes("/teacher/dashboard/classes")} onClick={onNavClick} />
        <NavItem href="/teacher/dashboard/attendance" icon={<ClipboardCheck/>} label="Student Attendance" active={pathname === "/teacher/dashboard/attendance"} onClick={onNavClick} />
        <NavItem href="/teacher/dashboard/analytics" icon={<PieChart/>} label="Performance Analytics" badge="New" active={pathname === "/teacher/dashboard/analytics"} onClick={onNavClick} />
        
        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 mt-6">Academics & Resources</p>
        <NavItem href="/teacher/dashboard/materials" icon={<BookOpen/>} label="Subject Materials" active={pathname === "/teacher/dashboard/materials"} onClick={onNavClick} />
        <NavItem href="/teacher/dashboard/grades" icon={<PenTool/>} label="Gradebook & Marks" active={pathname === "/teacher/dashboard/grades"} onClick={onNavClick} />
        <NavItem href="/teacher/dashboard/papers" icon={<FileQuestion/>} label="Question Papers" active={pathname === "/teacher/dashboard/papers"} onClick={onNavClick} />
        
        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 mt-6">Smart Tools & Growth</p>
        <NavItem href="/teacher/dashboard/ai" icon={<BrainCircuit/>} label="Integrity AI" badge="Beta" highlight active={pathname === "/teacher/dashboard/ai"} onClick={onNavClick} />
        <NavItem href="/teacher/dashboard/learning" icon={<GraduationCap/>} label="Teacher Learning Hub" active={pathname === "/teacher/dashboard/learning"} onClick={onNavClick} />
        <NavItem href="/teacher/dashboard/messages" icon={<MessageSquare/>} label="Parent Communication" active={pathname === "/teacher/dashboard/messages"} onClick={onNavClick} />
      </nav>

      {/* User Profile & Logout Bottom Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
        <Link 
          href="/teacher/dashboard/profile" 
          onClick={onNavClick}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-600 cursor-pointer transition-all group mb-2"
        >
          {/* DYNAMIC AVATAR / PHOTO */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-black overflow-hidden border border-slate-700 group-hover:border-blue-500 transition-colors shrink-0">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              profile.avatar
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">{profile.name}</p>
            <p className="text-[10px] font-medium text-slate-400 truncate flex items-center gap-1"><UserCircle className="w-3 h-3"/> View My Profile</p>
          </div>
          <Settings className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors pointer-events-none shrink-0" />
        </Link>
        
        {/* WIRED LOGOUT BUTTON */}
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4"/> Secure Logout
        </button>
      </div>
    </>
  );
}

// ==========================================
// REUSABLE NAV ITEM
// ==========================================
function NavItem({ icon, label, href = "#", active = false, badge, highlight = false, onClick }: any) {
  return (
    <Link href={href} onClick={onClick} className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${active ? 'bg-blue-600 text-white shadow-md' : highlight ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
      <div className="flex items-center gap-3 font-bold text-sm">
        <span className={`${active ? 'text-white' : highlight ? 'text-purple-400 group-hover:text-purple-200' : 'text-slate-500 group-hover:text-slate-300'}`}>{icon}</span>
        {label}
      </div>
      {badge && <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${active ? 'bg-white/20 text-white' : highlight ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors'}`}>{badge}</span>}
    </Link>
  );
}