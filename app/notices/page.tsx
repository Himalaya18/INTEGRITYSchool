"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, Bell, Calendar, Megaphone, Pin, Info, ChevronDown, BookOpen, PartyPopper, Camera, ArrowRight, ExternalLink } from "lucide-react";

// --- Mock Data: Update this with your real notices ---
const noticesData = [
  {
    id: 1,
    title: "Summer Vacation Announcement",
    date: "May 10, 2026",
    category: "Holiday",
    isPinned: true,
    content: "Dear Parents, the school will remain closed for the Summer Vacation from May 15th to June 30th. Classes will resume normally from July 1st. We wish all students a joyful and safe holiday. Please ensure your children complete their assigned holiday homework.",
  },
  {
    id: 2,
    title: "Parent-Teacher Meeting (Nursery to Class 8)",
    date: "May 12, 2026",
    category: "Important",
    isPinned: true,
    content: "A Parent-Teacher Meeting (PTM) is scheduled for this Saturday, May 16th, from 9:00 AM to 12:30 PM. It is mandatory for at least one parent to attend to discuss the student's progress report before the summer break.",
  },
  {
    id: 3,
    title: "Annual Sports Festival Schedule",
    date: "May 05, 2026",
    category: "Event",
    isPinned: false,
    content: "We are excited to announce our Internal Sports Festival! Preliminary rounds will begin next week. Students interested in participating in 100m sprint, relay, or long jump must give their names to their respective class teachers by tomorrow.",
  },
  {
    id: 4,
    title: "Revised School Timings",
    date: "April 28, 2026",
    category: "Academics",
    isPinned: false,
    content: "Due to the rising temperatures, school timings will be revised to 7:30 AM - 12:30 PM starting from May 1st. School buses will ply accordingly. Please ensure students arrive at the bus stops 30 minutes earlier.",
  },
];

const categories = ["All", "Important", "Academics", "Holiday", "Event"];

// Helper to get icons and colors based on category
const getCategoryStyles = (category: string) => {
  switch (category) {
    case "Holiday": return { icon: <PartyPopper size={18} />, color: "bg-green-100 text-green-700 border-green-200" };
    case "Academics": return { icon: <BookOpen size={18} />, color: "bg-blue-100 text-blue-700 border-blue-200" };
    case "Event": return { icon: <Calendar size={18} />, color: "bg-purple-100 text-purple-700 border-purple-200" };
    case "Important": return { icon: <Megaphone size={18} />, color: "bg-red-100 text-red-700 border-red-200" };
    default: return { icon: <Info size={18} />, color: "bg-gray-100 text-gray-700 border-gray-200" };
  }
};

export default function NoticeBoardPage() {
  const [filter, setFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredNotices = noticesData
    .filter((notice) => filter === "All" || notice.category === filter)
    .sort((a, b) => {
      if (a.isPinned === b.isPinned) return 0;
      return a.isPinned ? -1 : 1;
    });

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-yellow-300 selection:text-blue-900 pb-20 md:pb-32">
      
      {/* 1. HEADER */}
      <header className="px-4 md:px-16 py-4 md:py-8 absolute top-0 w-full z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <a href="/" className="flex items-center gap-2 text-blue-950 hover:text-blue-600 transition-colors font-bold group bg-white/50 backdrop-blur-md px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-gray-200 shadow-sm text-xs md:text-base">
            <ArrowLeft size={18} className="transform group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Return Home</span>
            <span className="sm:hidden">Back</span>
          </a>
          <div className="flex items-center gap-2 md:gap-3 bg-blue-950 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-full shadow-lg">
            <img src="/logo.png" alt="School Logo" className="w-6 h-6 md:w-8 md:h-8 object-contain" />
            <span className="text-sm md:text-xl font-black tracking-widest">INTEGRITY</span>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-32 md:pt-40 pb-10 md:pb-16 px-6 max-w-7xl mx-auto text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-1.5 rounded-full text-[10px] md:text-xl font-black tracking-widest uppercase mb-6 md:mb-8"
        >
          <Bell size={14} className="text-yellow-600" />
          Digital Campus Wall
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-6xl md:text-7xl font-black text-blue-950 tracking-tight leading-[1.1] mb-6"
        >
          Notices & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">Highlights.</span>
        </motion.h1>
      </section>

      {/* 3. MAIN CONTENT GRID (Notices on Left, Marketing on Right) */}
      <section className="px-4 md:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
          
          {/* LEFT COLUMN: THE NOTICES (Takes up 8 of 12 columns) */}
          <div className="lg:col-span-8">
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 md:gap-3 mb-8">
              {categories.map((cat, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 md:px-5 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all duration-300 shadow-sm ${
                    filter === cat 
                      ? "bg-blue-950 text-white shadow-blue-900/30 shadow-lg" 
                      : "bg-white text-gray-500 border border-gray-200 hover:text-blue-950 hover:border-blue-300"
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>

            {/* Notice List */}
            <motion.div layout className="space-y-4 md:space-y-6">
              <AnimatePresence mode="popLayout">
                {filteredNotices.length > 0 ? (
                  filteredNotices.map((notice, index) => {
                    const styles = getCategoryStyles(notice.category);
                    const isExpanded = expandedId === notice.id;

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        // FIX 1: We separated the layout transition from the opacity/y transition 
                        // so the delay doesn't affect the shrinking animation!
                        transition={{ 
                          layout: { type: "spring", bounce: 0.2, duration: 0.4 },
                          opacity: { duration: 0.4, delay: index * 0.05 },
                          y: { duration: 0.4, delay: index * 0.05 }
                        }}
                        key={notice.id}
                        onClick={() => toggleExpand(notice.id)}
                        className={`bg-white rounded-2xl md:rounded-[24px] border ${notice.isPinned ? 'border-yellow-300 shadow-yellow-100' : 'border-gray-200 shadow-sm'} p-5 md:p-8 cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden relative group`}
                      >
                        {notice.isPinned && (
                          <div className="absolute top-0 right-0 bg-yellow-400 text-blue-950 text-[10px] md:text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                            <Pin size={12} className="fill-blue-950" /> PINNED
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <motion.div layout="position" className="flex items-center md:flex-col md:items-center gap-4 md:gap-2 shrink-0 md:w-24">
                            <div className={`p-3 rounded-xl border ${styles.color} flex justify-center items-center`}>
                              {styles.icon}
                            </div>
                            <div className="text-left md:text-center">
                              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Date</p>
                              <p className="text-blue-950 font-black text-sm">{notice.date.split(",")[0]}</p>
                            </div>
                          </motion.div>

                          <div className="flex-1">
                            <motion.div layout="position" className="flex items-center gap-2 mb-2">
                              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${styles.color}`}>
                                {notice.category}
                              </span>
                            </motion.div>
                            <motion.h3 layout="position" className="text-lg md:text-2xl font-black text-blue-950 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                              {notice.title}
                            </motion.h3>

                            <AnimatePresence initial={false} mode="popLayout">
                              {isExpanded ? (
                                <motion.div 
                                  key="expanded"
                                  initial={{ opacity: 0, height: 0 }} 
                                  animate={{ opacity: 1, height: "auto" }} 
                                  exit={{ opacity: 0, height: 0 }} 
                                  transition={{ duration: 0.3 }}
                                  // FIX 2: Added 'overflow-hidden' so text doesn't spill out while shrinking
                                  className="text-gray-600 text-sm md:text-base leading-relaxed mt-2 overflow-hidden"
                                >
                                  {notice.content}
                                </motion.div>
                              ) : (
                                <motion.div 
                                  key="collapsed"
                                  initial={{ opacity: 0 }} 
                                  animate={{ opacity: 1 }} 
                                  exit={{ opacity: 0 }} 
                                  transition={{ duration: 0.3 }}
                                  className="text-gray-500 text-sm line-clamp-1 mt-2"
                                >
                                  {notice.content}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="hidden md:flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mt-1">
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                              <ChevronDown size={20} />
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-[30px] border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4"><Megaphone size={32} /></div>
                    <h3 className="text-xl font-bold text-blue-950 mb-2">No Notices Found</h3>
                    <p className="text-gray-500 font-medium text-sm">There are currently no announcements in this category.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: MARKETING & SOCIAL (Takes up 4 of 12 columns, Sticky on Desktop) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-32 h-max">
            
            {/* Promo 1: Admission Open Flex (Replace src with your actual flex image) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-[24px] shadow-lg border border-gray-100 overflow-hidden group cursor-pointer"
            >
              <div className="relative h-48 md:h-90 w-full overflow-hidden bg-blue-100">
                {/* PUT YOUR FLEX IMAGE HERE */}
                <img 
                  src="Banner.png" 
                  alt="Admission Open 2026-27" 
                  className="w-full h-full object-fit transform group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="bg-yellow-400 text-blue-950 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mb-2 inline-block">Admissions 26-27</span>
                  <h3 className="text-white font-black text-xl leading-tight">Secure Your Child's Spot Today!</h3>
                </div>
              </div>
              <div className="p-5 bg-white">
                <a href="/#contact" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm shadow-md">
                  Apply Now <ArrowRight size={16} />
                </a>
              </div>
            </motion.div>

            {/* Promo 2: Instagram Integration */}
            <motion.a 
              href="https://instagram.com" 
              target="_blank"
              whileHover={{ scale: 1.02 }}
              className="block rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]"
            >
              {/* Subtle overlay pattern */}
              <div className="absolute inset-0 bg-white/10 opacity-50 bg-[radial-gradient(#FFF_1px,transparent_1px)] [background-size:10px_10px]" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-md">
                    <Camera size={28} className="text-white" />
                  </div>
                  <ExternalLink size={20} className="text-white/70" />
                </div>
                <h3 className="font-black text-xl mb-1">Integrity on Instagram</h3>
                <p className="text-white/90 text-sm mb-4 font-medium">Follow us for daily campus updates, event reels, and student achievements!</p>
                <div className="inline-block bg-white text-pink-600 font-bold text-sm px-4 py-2 rounded-full shadow-sm">
                  @integrity.school
                </div>
              </div>
            </motion.a>

            {/* Promo 3: Event / Highlight Text Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-[24px] p-6 shadow-sm">
              <div className="flex items-center gap-2 text-cyan-600 mb-2">
                <PartyPopper size={20} />
                <h3 className="font-black text-sm uppercase tracking-wider">Upcoming Highlight</h3>
              </div>
              <h4 className="text-blue-950 font-black text-xl mb-2 leading-tight">Celebration</h4>
              <p className="text-gray-600 text-sm mb-4"> Grand event coming this April!</p>
              <a href="#" className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline">
              </a>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}