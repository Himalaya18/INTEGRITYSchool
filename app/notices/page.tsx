"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Bell, Calendar, Megaphone, Pin, 
  Info, ChevronDown, BookOpen, PartyPopper, 
  Camera, ArrowRight, ExternalLink, AlertTriangle, 
  PhoneCall, Mail
} from "lucide-react";
import { supabase } from "@/supabase";

const categories = ["All", "Notice", "Academics", "Holiday", "Event"];

const getCategoryStyles = (category: string) => {
  switch (category) {
    case "Holiday": return { icon: <PartyPopper size={14} />, color: "bg-emerald-100 text-emerald-700" };
    case "Academics": return { icon: <BookOpen size={14} />, color: "bg-blue-100 text-blue-700" };
    case "Event": return { icon: <Calendar size={14} />, color: "bg-purple-100 text-purple-700" };
    case "Notice": return { icon: <Megaphone size={14} />, color: "bg-rose-100 text-rose-700" };
    default: return { icon: <Info size={14} />, color: "bg-slate-100 text-slate-700" };
  }
};

export default function NoticeBoardPage() {
  const [filter, setFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Real Database States
  const [noticesData, setNoticesData] = useState<any[]>([]);
  const [tickerData, setTickerData] = useState({ text: "", active: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // 1. Fetch Live Notices
    const { data: posts } = await supabase
      .from('digital_wall_posts')
      .select('*')
      .eq('status', 'Live');
      
    if (posts) setNoticesData(posts);
    
    // 2. Fetch Ticker Data
    const { data: settings } = await supabase.from('site_settings').select('*');
    if (settings) {
      const textSetting = settings.find((d: any) => d.setting_key === 'ticker_text');
      const activeSetting = settings.find((d: any) => d.setting_key === 'ticker_active');
      setTickerData({
        text: textSetting ? textSetting.setting_value : "",
        active: activeSetting ? activeSetting.setting_value === 'true' : false
      });
    }
    
    setIsLoading(false);
  };

  const filteredNotices = noticesData
    .filter((notice) => filter === "All" || notice.category === filter)
    .sort((a, b) => {
      // Pinned items first, then by date
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-yellow-300 selection:text-blue-900 pb-32">
      
      {/* 1. LIVE TICKER (FIXED & THEMED) */}
      {tickerData.active && tickerData.text && (
        <div className="w-full bg-blue-600 text-white py-2.5 overflow-hidden sticky top-0 z-50 shadow-md">
          <div className="absolute inset-y-0 left-0 bg-blue-700 px-4 md:px-8 flex items-center font-black text-[10px] md:text-xs uppercase tracking-widest z-10 border-r border-blue-500 shadow-xl">
            <AlertTriangle size={16} className="mr-2 text-yellow-300" /> Live Update
          </div>
          <motion.div 
            className="whitespace-nowrap inline-block text-sm font-bold tracking-wide pl-[140px] md:pl-[200px]"
            animate={{ x: ["100%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          >
            <span className="mx-10">{tickerData.text}</span>
            <span className="mx-10 opacity-50">•</span>
            <span className="mx-10">{tickerData.text}</span>
          </motion.div>
        </div>
      )}
      
      {/* 2. HEADER */}
      <header className="px-4 md:px-8 lg:px-16 py-6 w-full z-40 bg-transparent">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <a href="/" className="flex items-center gap-2 text-blue-950 hover:text-blue-600 transition-colors font-bold group bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-200 shadow-sm text-sm">
            <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Return to Homepage</span>
          </a>
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-slate-200 text-blue-950 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-shadow">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain drop-shadow-sm" />
            <span className="text-lg font-black tracking-widest hidden sm:inline">INTEGRITY</span>
          </div>
        </div>
      </header>

      {/* 3. HERO */}
      <section className="pt-2 pb-12 px-6 max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-6 shadow-sm border border-blue-300">
          <Bell size={12} className="animate-pulse" /> Digital Campus Wall
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-black text-blue-950 tracking-tight mb-4">
          Notices & <span className="text-blue-500">Highlights.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-500 font-medium max-w-2xl mx-auto text-sm md:text-base">
          Stay up to date with the latest announcements, academic schedules, events, and important circulars from Integrity Education.
        </motion.p>
      </section>

      {/* 4. MAIN CONTENT */}
      <section className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* ================= LEFT: NOTICES FEED ================= */}
          <div className="lg:col-span-8">
            
            {/* Unified White Pill Filter Bar */}
            <div className="flex flex-nowrap overflow-x-auto no-scrollbar items-center bg-white rounded-full shadow-sm p-1.5 mb-8 border border-slate-100 w-full sm:w-max">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap flex-1 sm:flex-none text-center ${
                    filter === cat 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                      : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-blue-950"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-50">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Fetching Notices...</p>
              </div>
            ) : (
              <motion.div layout className="space-y-5">
                <AnimatePresence mode="popLayout">
                  {filteredNotices.length > 0 ? (
                    filteredNotices.map((notice, index) => {
                      const styles = getCategoryStyles(notice.category);
                      const isExpanded = expandedId === notice.id;
                      const dateObj = new Date(notice.created_at);

                      return (
                        <motion.div
                          layout 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          key={notice.id}
                          className={`bg-white rounded-3xl border ${notice.is_pinned ? 'border-amber-300 shadow-amber-100/50 shadow-xl' : 'border-slate-100 shadow-sm hover:shadow-md'} transition-all relative overflow-hidden p-6 md:p-8 cursor-pointer`}
                        >
                          {/* Pinned Badge */}
                          {notice.is_pinned && (
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-[10px] font-black px-4 py-1.5 rounded-bl-2xl flex items-center gap-1.5 shadow-sm">
                              <Pin size={12} className="fill-amber-900" /> PINNED POST
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row items-start gap-6 pt-2">
                            
                            {/* Calendar Date Badge */}
                            <div className="hidden sm:flex flex-col items-center shrink-0 w-16 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                              <div className={`w-full py-1.5 text-[10px] font-black uppercase tracking-widest text-center text-white ${notice.is_pinned ? 'bg-amber-500' : 'bg-blue-600'}`}>
                                {dateObj.toLocaleString('default', { month: 'short' })}
                              </div>
                              <div className="py-2 text-2xl font-black text-slate-800">
                                {dateObj.getDate()}
                              </div>
                              <div className="w-full pb-2 text-[10px] font-bold text-slate-400 text-center">
                                {dateObj.getFullYear()}
                              </div>
                            </div>

                            <div className="flex-1 w-full">
                              {/* Category Badge above title */}
                              <div className="mb-3 flex items-center gap-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${styles.color}`}>
                                  {styles.icon} {notice.category}
                                </span>
                                <span className="sm:hidden text-xs font-bold text-slate-400">
                                  {dateObj.toLocaleDateString()}
                                </span>
                              </div>
                              
                              {/* Title */}
                              <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                                {notice.title}
                              </h3>
                              
                              {/* Image (if any) */}
                              {notice.image_url && isExpanded && (
                                <motion.img 
                                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                  src={notice.image_url} 
                                  className="w-full h-auto max-h-[400px] object-cover rounded-2xl mb-4 border border-slate-100 shadow-sm" 
                                />
                              )}
                              
                              {/* Content */}
                              <AnimatePresence initial={false} mode="popLayout">
                                {isExpanded ? (
                                  <motion.div 
                                    key="expanded" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} 
                                    className="text-slate-600 text-sm md:text-base leading-relaxed overflow-hidden"
                                  >
                                    <div className="pb-4">
                                      {notice.content}
                                    </div>
                                  </motion.div>
                                ) : (
                                  <motion.div 
                                    key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                                    className="text-slate-500 text-sm line-clamp-2 mb-4"
                                  >
                                    {notice.content}
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Toggle Button */}
                              <button 
                                onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : notice.id); }}
                                className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:text-blue-800 transition-colors mt-2"
                              >
                                {isExpanded ? "Read Less" : "Read Full Notice"} 
                                <ChevronDown size={16} className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-24 bg-white rounded-[24px] border border-slate-100">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Megaphone size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 mb-2">No active notices</h3>
                      <p className="text-slate-400 font-medium text-sm">Check back later for updates in this category.</p>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* ================= RIGHT: SIDEBAR (INFO & SOCIAL) ================= */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-max">
            
            {/* Admissions Banner */}
            <motion.div whileHover={{ y: -4 }} className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden group cursor-pointer relative">
              <div className="relative h-90 w-full overflow-hidden bg-slate-100">
                <img src="/Banner.png" alt="Admission" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-3 bg-white">
                <a href="/#contact" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-colors flex justify-center items-center gap-2 text-sm shadow-md">
                  Apply Now For 2026-27 <ArrowRight size={18} />
                </a>
              </div>
            </motion.div>

            {/* Quick Contact Block */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-black text-lg text-slate-800 mb-4 flex items-center gap-2">
                <Info className="text-blue-500 w-5 h-5"/> Need Assistance?
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer">
                  <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><PhoneCall size={18}/></div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Front Desk</p>
                    <p className="font-bold text-sm text-slate-700">+91 98765 43210</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer">
                  <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600"><Mail size={18}/></div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Email Admin</p>
                    <p className="font-bold text-sm text-slate-700">info@integrity.edu</p>
                  </div>
                </div>
              </div>
            </div>

            {/* HYPER-AESTHETIC INSTAGRAM CARD */}
            <motion.a
              href="https://instagram.com/integrity.school"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -6, scale: 1.01 }}
              className="block rounded-3xl p-8 text-white shadow-lg relative overflow-hidden group cursor-pointer"
              style={{
                // Authentic Instagram Gradient Mesh
                background: `radial-gradient(at 100% 0%, #fcb045 0%, transparent 50%), 
                            radial-gradient(at 0% 100%, #833ab4 0%, transparent 60%), 
                            #fd1d1d`,
              }}
            >
              {/* Frosted glass texture layer */}
              <div className="absolute inset-0 z-0 bg-white/5 backdrop-blur-[2px] opacity-60 mix-blend-soft-light" />
              {/* Subtle noise pattern for texture depth */}
              <div className="absolute inset-0 z-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />

              <div className="relative z-20 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-white/20 p-3.5 rounded-2xl backdrop-blur-md shadow-inner border border-white/20 group-hover:scale-105 transition-transform">
                    <Camera size={32} className="text-white" />
                  </div>
                  <ExternalLink size={20} className="text-white/60 group-hover:text-white group-hover:rotate-6 transition-all" />
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/90 border border-white/20 backdrop-blur-sm shadow-inner mb-3">
                    <Megaphone size={12} /> SOCIAL HUB
                  </span>
                  <h3 className="font-black text-2xl md:text-3xl mb-2 drop-shadow-md tracking-tight">
                    Integrity on Instagram
                  </h3>
                  <p className="text-white/95 text-sm mb-6 font-medium leading-relaxed max-w-sm">
                    Follow us for daily campus updates, event reels, student features, and a peek into our vibrant campus life!
                  </p>
                  <div className="inline-block bg-white text-rose-600 font-black text-sm px-6 py-3 rounded-xl shadow-lg hover:shadow-xl group-hover:scale-105 transition-all">
                    @integrity.school
                  </div>
                </div>
              </div>
            </motion.a>

          </div>
        </div>
      </section>
    </div>
  );
}