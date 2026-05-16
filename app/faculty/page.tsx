"use client";

import { motion } from "framer-motion";
import { ArrowLeft, PhoneCall, Mail, GraduationCap, Quote } from "lucide-react";

// --- Mock Data ---
const staffData = [
  {
    id: 1,
    name: "Miss Akansha Ekka",
    role: "Principal",
    subject: "Administration ",
    phone: "+91 7879708984",
    email: "principal.integrity@gmail.com",
    image: "principal.png",
    isPrincipal: true,
  },
  { id: 2, name: "Mrs. Sunita Sharma", role: "Senior Teacher", subject: "Science (Physics & Chemistry)", phone: "+91 98765 43211", image: "teach.jpg" },
  { id: 3, name: "Mr. Ramesh Patel", role: "Teacher", subject: "Mathematics", phone: "+91 98765 43212", image: "teach.jpg" },
  { id: 4, name: "Ms. Priya Singh", role: "Teacher", subject: "English Literature", phone: "+91 98765 43213", image: "teach.jpg" },
  { id: 5, name: "Mr. Deepak Verma", role: "Teacher", subject: "Hindi & Sanskrit", phone: "+91 98765 43214", image: "teach.jpg" },
  { id: 6, name: "Mrs. Anita Desai", role: "Teacher", subject: "Social Studies (SST)", phone: "+91 98765 43215", image: "teach.jpg" },
  { id: 7, name: "Mr. Vikram Singh", role: "Teacher", subject: "Computer Science", phone: "+91 98765 43216", image: "teach.jpg" },
  { id: 8, name: "Ms. Neha Gupta", role: "Teacher", subject: "Environmental Studies (EVS)", phone: "+91 98765 43217", image: "teach.jpg"},
  { id: 9, name: "Mr. Rahul Yadav", role: "Sports Faculty", subject: "Physical Education (PT)", phone: "+91 98765 43218", image: "teach.jpg"},
  { id: 10, name: "Mrs. Meena Kumari", role: "Primary Teacher", subject: "All Subjects (Nursery - KG2)", phone: "+91 98765 43219", image: "teach.jpg" },
  { id: 11, name: "Ms. Aarti Joshi", role: "Teacher", subject: "Art & Craft", phone: "+91 98765 43220", image: "teach.jpg"},
];

export default function FacultyPage() {
  const principal = staffData.find((staff) => staff.isPrincipal);
  const teachers = staffData.filter((staff) => !staff.isPrincipal);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans selection:bg-yellow-300 selection:text-blue-900 pb-20 md:pb-32 overflow-hidden">
      
      {/* 1. ULTRA-MINIMAL HEADER - Optimized for Mobile */}
      <header className="px-4 md:px-16 py-4 md:py-8 absolute top-0 w-full z-50">
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

      {/* 2. EDITORIAL HERO SECTION - Responsive Typography */}
      <section className="pt-32 md:pt-40 pb-12 md:pb-20 px-6 max-w-5xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black tracking-widest uppercase mb-6 md:mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          The Faculty
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-8xl font-black text-blue-950 tracking-tighter leading-[1] md:leading-[0.9] mb-8"
        >
          Minds Behind <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400"> The Magic.</span>
        </motion.h1>
      </section>

      {/* 3. THE PRINCIPAL'S SHOWCASE (Editorial Magazine Style) */}
      {principal && (
        <section className="px-4 md:px-16 max-w-7xl mx-auto mb-20 md:mb-32">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-[2rem] md:rounded-[3rem] p-3 md:p-6 shadow-[0_20px_60px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col md:flex-row gap-6 md:gap-16 items-center"
          >
            {/* Massive Image Container */}
            <div className="w-full md:w-1/2 aspect-square md:aspect-[4/5] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden relative group">
              <img 
                src={principal.image} 
                alt={principal.name} 
                className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out" 
              />
              <div className="absolute inset-0 bg-blue-950/10 group-hover:bg-transparent transition-colors duration-500" />
            </div>

            {/* Pristine Typography Content */}
            <div className="w-full md:w-1/2 px-4 md:px-0 pr-0 md:pr-12 pb-6 md:pb-0 pt-2 md:pt-0">
              <Quote size={36} className="text-blue-100 mb-4 md:mb-6 md:w-12 md:h-12" />
              <h2 className="text-3xl md:text-5xl font-black text-blue-950 mb-2">{principal.name}</h2>
              <p className="text-cyan-600 font-bold tracking-widest uppercase text-xs md:text-sm mb-6 md:mb-8">{principal.role}</p>
              
              <p className="text-gray-500 text-base md:text-xl leading-relaxed mb-8 md:mb-10 font-medium">
                "Our mission at Integrity is to unlock the unique potential within every student. We don't just teach the syllabus; we build character, instill discipline, and forge the leaders of tomorrow."
              </p>

              {/* Buttons stack on mobile, side-by-side on larger screens */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <a href={`tel:${principal.phone}`} className="flex items-center justify-center gap-3 bg-blue-950 hover:bg-blue-800 text-white w-full sm:w-auto px-6 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all shadow-lg hover:shadow-blue-900/30 text-sm md:text-base">
                  <PhoneCall size={18} className="md:w-5 md:h-5" /> Connect Direct
                </a>
                <a href={`mailto:${principal.email}`} className="flex items-center justify-center gap-3 bg-slate-100 hover:bg-slate-200 text-blue-950 w-full sm:w-auto px-6 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all text-sm md:text-base">
                  <Mail size={18} className="md:w-5 md:h-5" /> Email Office
                </a>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* 4. AVANT-GARDE TEACHER GRID */}
      <section className="px-4 md:px-16 max-w-7xl mx-auto">
        <div className="mb-10 md:mb-16 px-2">
          <h3 className="text-3xl md:text-4xl font-black text-blue-950 tracking-tight">Our Educators</h3>
          <p className="text-gray-500 font-medium mt-2 text-sm md:text-base">10 brilliant minds shaping the future.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
          {teachers.map((teacher, index) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (index % 4) * 0.1, duration: 0.6, ease: "easeOut" }}
              className="group cursor-pointer"
            >
              {/* The "Monolith" Card */}
              <div className="bg-white p-2 md:p-3 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2">
                
                {/* Image Wrapper */}
                <div className="relative w-full aspect-[4/5] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-slate-100 mb-2">
                  <img 
                    src={teacher.image} 
                    alt={teacher.name} 
                    className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700 ease-out" 
                  />
                  <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply group-hover:opacity-0 transition-opacity duration-500" />
                </div>

                {/* Info Container */}
                <div className="relative pt-3 md:pt-4 pb-2 md:pb-3 px-3 md:px-4">
                  
                  {/* EXPANDING FLOATING ACTION BUTTON */}
                  <a 
                    href={`tel:${teacher.phone}`}
                    className="group/phone absolute -top-8 md:-top-10 right-3 md:right-4 h-12 md:h-14 flex items-center bg-cyan-500 text-white rounded-full shadow-xl border-[3px] md:border-4 border-white transform scale-100 md:scale-90 group-hover:md:scale-110 transition-all duration-300 z-10 overflow-hidden hover:bg-blue-600"
                    title={`Call ${teacher.name}`}
                  >
                    {/* The Icon stays centered */}
                    <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0">
                      <PhoneCall size={16} className="md:w-[18px] md:h-[18px] transform group-hover/phone:rotate-12 transition-transform" />
                    </div>
                    {/* The Hidden Number expands gracefully (works best on hover/desktop) */}
                    <div className="max-w-0 overflow-hidden group-hover/phone:max-w-[150px] transition-all duration-500 ease-in-out hidden sm:block">
                      <span className="text-xs md:text-sm font-bold whitespace-nowrap pr-4 block">
                        {teacher.phone}
                      </span>
                    </div>
                  </a>

                  {/* Pristine Typography */}
                  <p className="text-[9px] md:text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-1">
                    {teacher.role}
                  </p>
                  <h4 className="text-lg md:text-xl font-black text-blue-950 tracking-tight leading-tight mb-1">
                    {teacher.name}
                  </h4>
                  <p className="text-gray-500 font-medium text-xs md:text-sm line-clamp-1 pr-10 md:pr-12">
                    {teacher.subject}
                  </p>
                </div>
                
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}