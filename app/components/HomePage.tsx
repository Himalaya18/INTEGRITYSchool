"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Users,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  Palette,
  Atom,
  Smile,
  Star,
  ArrowUpRight,
  Menu,
  X,
  Quote,
  Camera
} from "lucide-react";

// --- Mock Data ---
const students = [
  {
    id: 1,
    name: "Aarav Sharma",
    achievement: "National Science Olympiad Winner",
    image: "https://images.unsplash.com/photo-1595454223600-91fbbeb2ccbc?q=80&w=500&auto=format&fit=crop",
    color: "bg-blue-500",
  },
  {
    id: 2,
    name: "Priya Patel",
    achievement: "Lead of School Debate Team",
    image: "https://images.unsplash.com/photo-1503919005314-30d93d07d823?q=80&w=500&auto=format&fit=crop",
    color: "bg-pink-500",
  },
  {
    id: 3,
    name: "Rohan Gupta",
    achievement: "State Level Football Captain",
    image: "https://images.unsplash.com/photo-1540479859555-17af45c78602?q=80&w=500&auto=format&fit=crop",
    color: "bg-yellow-500",
  },
];

export default function HomePage() {
  const [currentStudent, setCurrentStudent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Form States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentStudent((prev) => {
      let nextIndex = prev + newDirection;
      if (nextIndex >= students.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = students.length - 1;
      return nextIndex;
    });
  };

  // The actual submit function that connects to your API
  const handleInquirySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      studentName: formData.get('studentName'),
      guardianName: formData.get('guardianName'),
      whatsappNumber: formData.get('whatsappNumber'),
      guardianEmail: formData.get('guardianEmail'), // Add this line!
      village: formData.get('village'),
      className: formData.get('className'),
    };

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        e.currentTarget.reset(); // clear the form
      } else {
        setSubmitError("Something went wrong. Please try calling us instead.");
      }
    } catch (error) {
      setSubmitError("Failed to connect. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);
  const bgMoveX = useTransform(smoothX, [-1, 1], [-30, 30]);
  const bgMoveY = useTransform(smoothY, [-1, 1], [-30, 30]);
  const imgMoveX = useTransform(smoothX, [-1, 1], [40, -40]);
  const imgMoveY = useTransform(smoothY, [-1, 1], [40, -40]);
  const imgRotate = useTransform(smoothX, [-1, 1], [-5, 5]);
  const badgeMoveX = useTransform(smoothX, [-1, 1], [80, -80]);
  const badgeMoveY = useTransform(smoothY, [-1, 1], [80, -80]);
  const floatingShapeX = useTransform(smoothX, [-1, 1], [-60, 60]);
  const floatingShapeY = useTransform(smoothY, [-1, 1], [60, -60]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const cardVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 200 : -200, opacity: 0, rotateY: direction > 0 ? 45 : -45, scale: 0.9 }),
    center: { zIndex: 1, x: 0, opacity: 1, rotateY: 0, scale: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 200 : -200, opacity: 0, rotateY: direction < 0 ? 45 : -45, scale: 0.9 }),
  };

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipeThreshold = 50;
    if (offset.x < -swipeThreshold) paginate(1);
    else if (offset.x > swipeThreshold) paginate(-1);
  };

  useEffect(() => {
    const timer = setInterval(() => paginate(1), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-yellow-300 selection:text-blue-900 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section onMouseMove={handleMouseMove} className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-700 text-white">
        <motion.div style={{ x: bgMoveX, y: bgMoveY }} animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="absolute -top-20 -left-20 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-cyan-400/20 blur-[100px]" />
        <motion.div style={{ x: floatingShapeX, y: bgMoveY }} animate={{ scale: [1.1, 1, 1.1] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }} className="absolute -bottom-20 -right-20 w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full bg-yellow-400/20 blur-[100px]" />
        <motion.div style={{ x: floatingShapeX, y: floatingShapeY, rotate: imgRotate }} className="absolute top-1/4 left-5 md:left-10 text-yellow-300 opacity-50"><Star size={40} className="md:w-[60px] md:h-[60px]" fill="currentColor" /></motion.div>
        <motion.div style={{ x: badgeMoveX, y: floatingShapeY }} className="absolute bottom-1/3 right-5 md:right-10 w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-pink-400/50" />

        <div className="relative z-40">
          <header className="flex justify-between items-center px-4 md:px-16 py-4 md:py-6 border-b border-white/10 bg-blue-950/30 backdrop-blur-md">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 md:gap-4 cursor-pointer">
               <img src="/logo.png" alt="School Logo" className="w-12 h-12 md:w-20 md:h-20 object-contain drop-shadow-md" />
              <div>
                <h1 className="text-2xl md:text-5xl font-black tracking-wider">INTEGRITY</h1>
                <p className="text-cyan-200 text-xs md:text-2xl font-bold tracking-[0.2em]">S & E SCHOOL</p>
              </div>
            </motion.div>
            <nav className="hidden md:flex gap-8 text-xl font-bold tracking-wide">
              <a href="#" className="hover:text-yellow-400 hover:-translate-y-1 transition-transform block">HOME</a>
              <a href="#about" className="hover:text-yellow-400 hover:-translate-y-1 transition-transform block">ABOUT</a>
              <a href="/gallery" className="hover:text-yellow-400 hover:-translate-y-1 transition-transform block">GALLERY</a>
              <a href="/faculty" className="hover:text-yellow-400 hover:-translate-y-1 transition-transform block text-cyan-300">FACULTY</a>
              <a href="#contact" className="hover:text-yellow-400 hover:-translate-y-1 transition-transform block">CONTACT</a>
               <a href="/notices" className="hover:text-yellow-400 hover:-translate-y-1 transition-transform block">Digital Campus Wall</a>
            </nav>
            <button className="md:hidden text-white p-2 focus:outline-none" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </header>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="absolute top-full left-0 w-full bg-blue-950/95 backdrop-blur-xl border-b border-white/10 md:hidden overflow-hidden">
                <div className="flex flex-col px-6 py-6 gap-6">
                  <a href="#" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-white hover:text-yellow-400 border-b border-white/10 pb-2">HOME</a>
                  <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-white hover:text-yellow-400 border-b border-white/10 pb-2">ABOUT</a>
                  <a href="/gallery" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-white hover:text-yellow-400 border-b border-white/10 pb-2">GALLERY</a>
                  <a href="/faculty" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-cyan-300 hover:text-yellow-400 border-b border-white/10 pb-2">FACULTY</a>
                  <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-white hover:text-yellow-400 pb-2">CONTACT</a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative z-20 grid md:grid-cols-2 items-center min-h-[85vh] px-6 md:px-16 gap-10 py-10 md:py-0">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <motion.span whileHover={{ scale: 1.05 }} className="inline-block py-1 px-3 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs md:text-sm font-bold tracking-widest mb-6 cursor-default">
              ADMISSIONS OPEN 2026-27
            </motion.span>
            <h1 className="text-4xl md:text-7xl font-black leading-[1.1]">
              Shape Your Child's <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">Bright Future.</span>
            </h1>
            <p className="mt-4 md:mt-6 text-base md:text-lg text-blue-100/80 leading-relaxed max-w-xl font-medium">
              A modern approach to education where curiosity meets discipline. We nurture thinkers, creators, and leaders of tomorrow.
            </p>
            <div className="mt-8 md:mt-10 flex gap-4 flex-wrap">
              <motion.button whileHover={{ scale: 1.05, boxShadow: "0px 10px 30px rgba(250,204,21,0.5)" }} whileTap={{ scale: 0.95 }} className="bg-yellow-400 text-blue-950 px-6 md:px-8 py-3 md:py-4 rounded-xl font-black shadow-[0_8px_30px_rgb(250,204,21,0.3)] transition-colors hover:bg-yellow-300 w-full md:w-auto text-center">
                Apply Now
              </motion.button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative flex justify-center mt-6 md:mt-0 perspective-1000">
            <motion.img style={{ x: imgMoveX, y: imgMoveY, rotateZ: imgRotate }} src="kids1.jpeg" alt="Happy Students" className="rounded-[30px] md:rounded-[40px] shadow-2xl border-4 border-white/10 object-cover h-[300px] md:h-[500px] w-full" />
            <motion.div style={{ x: badgeMoveX, y: badgeMoveY }} className="absolute -bottom-6 -left-2 md:-left-6 bg-white text-blue-900 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl z-30 scale-90 md:scale-100">
              <div className="flex items-center gap-3 md:gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="bg-blue-100 p-2 md:p-3 rounded-full">
                  <ShieldCheck className="text-blue-600" />
                </motion.div>
                <div>
                  <p className="text-xl md:text-2xl font-black">100%</p>
                  <p className="text-xs md:text-sm font-bold text-gray-500">Safe Campus</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. ABOUT US */}
      <section id="about" className="py-20 md:py-32 px-6 md:px-16 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 md:gap-24 items-center overflow-hidden">
        <motion.div initial={{ opacity: 0, x: -100 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative w-full max-w-md mx-auto md:mx-0 mt-8 md:mt-0">
          <div className="absolute -top-6 md:-top-12 -left-6 md:-left-12 w-32 md:w-48 h-32 md:h-48 bg-[radial-gradient(#CBD5E1_3px,transparent_3px)] [background-size:20px_20px] opacity-70 -z-30"></div>
          <div className="absolute top-5 md:top-10 left-5 md:left-10 right-0 md:right-[-40px] bottom-[-20px] md:bottom-[-40px] rounded-[30px] md:rounded-[40px] border-2 border-dashed border-blue-300 -z-20"></div>
          <div className="absolute top-3 md:top-5 left-3 md:left-5 right-0 md:right-[-20px] bottom-[-10px] md:bottom-[-20px] bg-blue-600 rounded-[30px] md:rounded-[40px] shadow-lg -z-10"></div>
          
          <div className="relative z-10 rounded-[30px] md:rounded-[40px] p-2 bg-white shadow-2xl">
            <motion.img whileHover={{ scale: 1.02 }} transition={{ duration: 0.4 }} src="activity.jpg" alt="Students doing activity" className="rounded-[24px] md:rounded-[32px] w-full h-[350px] md:h-[500px] object-cover" />
          </div>

          <motion.div animate={{ y: [0, -15, 0], rotate: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="absolute top-1/4 -right-4 md:-right-12 z-30 drop-shadow-lg scale-75 md:scale-100">
            <Star className="text-yellow-400 fill-yellow-400" size={50} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.6 }} className="absolute -bottom-8 md:-bottom-16 -right-4 md:-right-16 z-20 w-3/4 md:w-2/3 perspective-1000">
            <div className="rounded-[20px] md:rounded-[30px] p-2 bg-white shadow-2xl transform rotate-[-4deg] hover:rotate-0 transition-transform duration-400 ease-out">
              <motion.img whileHover={{ scale: 1.05 }} transition={{ duration: 0.4 }} src="holi.jpeg" alt="Happy Students" className="rounded-[16px] md:rounded-[22px] h-[150px] md:h-[220px] w-full object-cover" />
            </div>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4, delay: 1 }} className="absolute -bottom-2 md:-bottom-4 -left-4 md:-left-6 w-10 h-10 md:w-14 md:h-14 bg-cyan-400 rounded-full border-2 md:border-4 border-slate-50 shadow-md z-30" />
          </motion.div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 100 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: "easeOut" }} className="mt-16 md:mt-0">
          <motion.p whileHover={{ x: 5 }} className="text-cyan-500 font-bold tracking-widest uppercase mb-4 flex items-center gap-2 text-xs md:text-sm">
            <Star size={16} strokeWidth={2.5} /> ABOUT INTEGRITY S & E
          </motion.p>
          <h2 className="text-3xl md:text-5xl font-black text-blue-950 leading-[1.2] md:leading-[1.1] mb-6 tracking-tight">
            Building Character,<br/>Inspiring Minds.
          </h2>
          <div className="space-y-4 md:space-y-5 text-gray-600 leading-relaxed mb-8 md:mb-10 text-sm md:text-[15px] font-medium">
            <p>
              Established in 2018, Integrity Skill & Education School was founded with a singular vision: to bring world-class education to the Bagicha block of Jashpur Nagar, Chhattisgarh, and empower the students of the region to compete confidently at the national level.
            </p>
            <p>
              At our school, education is not just about books and examinations; it is about building confidence, values, discipline, and hope for a brighter future. Following the English-medium curriculum of the Chhattisgarh Board, we combine strong academics with practical life skills.
            </p>
          </div>
          <ul className="space-y-4 md:space-y-5">
            {["Quality Education for Every Child", "संस्कार Along with Education", "Nurturing Young Minds with Care"].map((item, i) => (
              <motion.li key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 + (i * 0.15), type: "spring", stiffness: 100 }} whileHover={{ x: 10 }} className="flex items-center gap-3 md:gap-4 text-blue-950 font-bold text-sm md:text-base cursor-default">
                <div className="bg-yellow-100/80 p-2 rounded-full text-yellow-500 shadow-sm border border-yellow-200/50"><Smile size={18} strokeWidth={2.5} /></div>
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </section>

      {/* 3. PRESIDENT'S MESSAGE (Interactive Editorial Edition) */}
      <section className="py-20 md:py-32 bg-blue-950 text-white relative overflow-hidden group/section">
        {/* Dynamic Background Glows - They expand when hovering in the section */}
        <motion.div 
          className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-1000 group-hover/section:bg-cyan-500/20 group-hover/section:scale-110" 
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2 pointer-events-none transition-all duration-1000 group-hover/section:bg-blue-500/30 group-hover/section:scale-110" 
        />

        <div className="max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-12 gap-12 md:gap-16 items-center relative z-10">
          
          {/* President Image - 3D Hover Parallax Effect */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="md:col-span-5 relative group/card cursor-pointer"
          >
            {/* Animated Decorative Outline - Moves AWAY from the image on hover */}
            <div className="absolute top-4 left-4 w-full h-full border-2 border-yellow-400/50 rounded-[30px] md:rounded-[40px] -z-10 transition-transform duration-500 group-hover/card:translate-x-4 group-hover/card:translate-y-4 group-hover/card:border-yellow-400" />
            
            {/* Main Image Container - Lifts UP on hover */}
            <div className="bg-white p-2 rounded-[30px] md:rounded-[40px] shadow-2xl transition-all duration-500 group-hover/card:-translate-x-2 group-hover/card:-translate-y-2 group-hover/card:shadow-[0_20px_60px_rgba(34,211,238,0.15)] relative overflow-hidden">
              <img 
                src="founderpic.jpeg" 
                alt="President of Integrity Society" 
                className="w-full h-[350px] md:h-[450px] object-cover rounded-[22px] md:rounded-[32px]  group-hover/card:scale-105 transition-all duration-700" 
              />
            </div>
          </motion.div>

          {/* President Text */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="md:col-span-7"
          >
            {/* Interactive Quote Icon */}
            <div className="flex items-center gap-3 mb-6 group/quote w-max cursor-default">
              <motion.div 
                whileHover={{ rotate: 180, scale: 1.1, backgroundColor: "rgba(34, 211, 238, 0.2)" }}
                transition={{ duration: 0.4, type: "spring" }}
                className="p-3 bg-blue-900/50 rounded-2xl border border-white/10 text-cyan-400"
              >
                <Quote size={28} />
              </motion.div>
              <p className="text-yellow-400 font-bold tracking-widest uppercase text-sm transition-colors group-hover/quote:text-yellow-300">Message from the Society</p>
            </div>
            
            {/* Magnetic Headline */}
            <motion.h2 
              whileHover={{ x: 10 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-3xl md:text-5xl font-black mb-4 leading-tight cursor-default"
            >
              "Education is the most powerful weapon to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">change the world.</span>"
            </motion.h2>
            
            {/* Animated Divider line */}
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: "5rem" }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-1 bg-cyan-500 mb-8 rounded-full" 
            />
            
            {/* Illuminating Text (Turns bright white when hovering over paragraphs) */}
            <div className="space-y-6">
              <p className="text-blue-100/70 hover:text-white text-sm md:text-lg leading-relaxed font-medium transition-colors duration-300 cursor-default">
                We established the Integrity Educational Society with a single dream: to ensure that the brilliant minds of Jashpur and Bagicha do not have to leave their homes in search of quality, modern education. 
              </p>
              <p className="text-blue-100/70 hover:text-white text-sm md:text-lg leading-relaxed font-medium transition-colors duration-300 cursor-default">
                Our school is more than just a building; it is a community commitment to nurturing moral values, discipline, and academic excellence in our youth. We are building the future leaders of Chhattisgarh, right here in our own school.
              </p>
            </div>
            
            {/* Handwritten Signature Block */}
            <div className="mt-10 pt-6 border-t border-white/10 flex justify-between items-end">
              <div>
                <motion.p 
                  whileHover={{ scale: 1.05, originX: 0 }}
                  className="text-3xl md:text-4xl font-black text-white cursor-default" 
                  style={{ fontFamily: "'Brush Script MT', cursive", letterSpacing: "1px" }}
                >
                  Shri Navneet Kumar Sharma
                </motion.p>
                <p className="text-cyan-400 font-bold text-sm mt-1 uppercase tracking-wider">Founder, Integrity Skill And Education Society</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. FACILITIES */}
      <section id="facilities" className="py-20 md:py-32 px-6 md:px-16 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-10 left-5 md:left-10 text-[6rem] md:text-[15rem] font-black text-blue-900/[0.03] select-none pointer-events-none leading-none tracking-tighter">
          CAMPUS
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-7xl mx-auto mb-12 md:mb-20 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <div className="h-[2px] w-8 md:w-12 bg-yellow-400" />
              <p className="text-blue-600 font-bold tracking-widest uppercase text-xs md:text-sm">Experience Excellence</p>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-blue-950 tracking-tight">Our Facilities</h2>
          </div>
          <p className="text-gray-500 max-w-md text-sm md:text-lg leading-relaxed mb-2">
            Everything your child needs to explore their passions in a safe, state-of-the-art environment.
          </p>
        </motion.div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {[
            { title: "Spacious Classrooms", desc: "Equipped with modern boards and ergonomic seating.", icon: <BookOpen size={28} />, color: "text-blue-600", bg: "bg-blue-100", img: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600&auto=format&fit=crop" },
            { title: "Science Labs", desc: "Fully equipped Physics and Chemistry materials as per syllabus.", icon: <Atom size={28} />, color: "text-cyan-600", bg: "bg-cyan-100", img: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600&auto=format&fit=crop" },
            { title: "Sports Facilities", desc: "Indoor games and expansive recreational areas.", icon: <Trophy size={28} />, color: "text-yellow-600", bg: "bg-yellow-100", img: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=600&auto=format&fit=crop" },
            { title: "Creative Arts", desc: "Dedicated space for music, dance, and fine arts.", icon: <Palette size={28} />, color: "text-pink-600", bg: "bg-pink-100", img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600&auto=format&fit=crop" },
            { title: "Modern Library", desc: "Over 1000 physical books and digital resources.", icon: <BookOpen size={28} />, color: "text-purple-600", bg: "bg-purple-100", img: "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=600&auto=format&fit=crop" },
            { title: "Secure Campus", desc: "24/7 CCTV, infirmary, and strict access control.", icon: <ShieldCheck size={28} />, color: "text-green-600", bg: "bg-green-100", img: "https://images.unsplash.com/photo-1584697964190-7cb83d10f5bb?q=80&w=600&auto=format&fit=crop" },
          ].map((fac, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.7, ease: "easeOut" }} className="group relative h-[300px] md:h-[380px] w-full rounded-[30px] md:rounded-[40px] overflow-hidden bg-white border border-gray-200/60 shadow-sm hover:shadow-2xl transition-shadow duration-500 cursor-pointer block">
              <img src={fac.img} alt={fac.title} className="absolute inset-0 h-full w-full object-cover scale-125 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-700 ease-out" />
              <div className="absolute inset-0 bg-blue-950/0 group-hover:bg-blue-950/70 backdrop-blur-[0px] group-hover:backdrop-blur-sm transition-all duration-700 ease-out" />
              <div className="absolute -bottom-6 md:-bottom-10 -right-2 md:-right-4 text-[8rem] md:text-[10rem] font-black text-gray-50 opacity-100 group-hover:opacity-0 group-hover:translate-x-10 transition-all duration-700 pointer-events-none select-none leading-none">0{i + 1}</div>
              <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${fac.bg} ${fac.color} group-hover:bg-white/20 group-hover:text-white transition-colors duration-500 backdrop-blur-md`}>{fac.icon}</div>
                  <div className="bg-white/20 p-2 md:p-3 rounded-full backdrop-blur-md opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 delay-100 border border-white/10"><ArrowUpRight className="text-white" size={20} /></div>
                </div>
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                  <h3 className="text-xl md:text-2xl font-black text-blue-950 group-hover:text-white mb-1 md:mb-2 transition-colors duration-500">{fac.title}</h3>
                  <p className="text-sm md:text-base text-gray-500 font-medium group-hover:text-blue-100 transition-colors duration-500 line-clamp-2">{fac.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. STUDENT SPOTLIGHT */}
      <section className="py-20 md:py-24 px-6 md:px-16 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-black text-blue-950 mb-4 md:mb-6 flex items-center gap-3">
              Meet Our Stars <Star className="text-yellow-400 fill-yellow-400 w-6 h-6 md:w-8 md:h-8" />
            </h2>
            <p className="text-sm md:text-lg text-gray-600 leading-relaxed mb-6 md:mb-8">
              Our Internal Sports Festival and Academic Achievements filled our school with pride and happiness.<br className="hidden md:block" /> From students securing top ranks to young champions shining on the playground, every achievement reflected hard work and dedication.
            </p>
            <div className="flex gap-3">
              {students.map((_, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setDirection(idx > currentStudent ? 1 : -1); setCurrentStudent(idx); }}
                  className={`h-2 rounded-full cursor-pointer transition-all duration-500 ${currentStudent === idx ? "w-8 md:w-10 bg-blue-600" : "w-3 bg-gray-200 hover:bg-blue-300"}`} 
                />
              ))}
            </div>
          </motion.div>

          <div className="relative h-[400px] md:h-[450px] w-full flex justify-center items-center perspective-1000">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentStudent} custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={handleDragEnd} whileTap={{ cursor: "grabbing" }}
                className="absolute w-[90vw] md:w-full max-w-sm cursor-grab"
              >
                <div className="bg-white rounded-[30px] md:rounded-[40px] p-3 md:p-4 shadow-2xl border border-gray-100 transform hover:scale-[1.02] transition-transform duration-300 pointer-events-none">
                  <img src={students[currentStudent].image} alt={students[currentStudent].name} className="w-full h-[250px] md:h-[300px] object-cover rounded-[20px] md:rounded-[30px] mb-4 md:mb-6 pointer-events-none" />
                  <div className="text-center pb-2 md:pb-4">
                    <h3 className="text-xl md:text-2xl font-black text-blue-950">{students[currentStudent].name}</h3>
                    <motion.p key={`badge-${currentStudent}`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }} className={`inline-block mt-2 px-3 md:px-4 py-1 rounded-full text-white text-xs md:text-sm font-bold ${students[currentStudent].color}`}>
                      {students[currentStudent].achievement}
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 7. CONTACT US */}
      <section id="contact" className="py-20 md:py-24 px-6 md:px-16 bg-blue-950 text-white relative overflow-hidden">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 40, ease: "linear" }} className="absolute top-0 right-0 w-[500px] md:w-[800px] h-[500px] md:h-[800px] bg-blue-900/50 rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6">Let's Talk About Your Child's Future.</h2>
            <p className="text-blue-200 text-base md:text-lg mb-8 md:mb-12">Admissions are filling up fast. Reach out to schedule a tour or ask any questions.</p>
            
            <div className="space-y-6 md:space-y-8">
              {[
                { icon: <MapPin size={24} />, color: "bg-cyan-500 text-blue-950", title: "Campus Address", desc: "NEAR PANCHAYAT BHAWAN, BHUDADAAND BAGICHA, DIST. JASHPUR NAGAR CHHATTISGARH 496331" },
                { icon: <Phone size={24} />, color: "bg-yellow-400 text-blue-950", title: "Call Us", desc: "+91 7828741586 \n Mon - Fri, 8:00 AM - 3:00 PM" },
                { icon: <Mail size={24} />, color: "bg-pink-400 text-white", title: "Email Us", desc: "integrity.education.jsp@gmail.com" },
              ].map((info, idx) => (
                <motion.div key={idx} whileHover={{ x: 10 }} className="flex items-start gap-4 cursor-default">
                  <div className={`${info.color} p-3 md:p-4 rounded-xl shadow-lg shrink-0`}>{info.icon}</div>
                  <div>
                    <h4 className="text-lg md:text-xl font-bold mb-1">{info.title}</h4>
                    <p className="text-sm md:text-base text-blue-200 whitespace-pre-line">{info.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-white rounded-[30px] md:rounded-[40px] p-6 md:p-10 shadow-2xl text-blue-950 relative overflow-hidden">
            {submitSuccess && (
              <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-2xl font-black mb-2">Thank You!</h3>
                <p className="text-gray-600">Your inquiry has been received. We have sent a confirmation to your WhatsApp and will call you shortly.</p>
                <button onClick={() => setSubmitSuccess(false)} className="mt-6 text-blue-600 font-bold underline">Submit another inquiry</button>
              </div>
            )}

            <h3 className="text-xl md:text-2xl font-black mb-2">Admission Inquiry</h3>
            <p className="text-gray-500 text-xs md:text-sm mb-6 font-medium">Fill this form and our office will contact you soon.</p>

            {submitError && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">{submitError}</div>}

            <form className="space-y-4" onSubmit={handleInquirySubmit}>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">Student's Name <span className="text-gray-400 font-normal">(विद्यार्थी का नाम)</span></label>
                <input required name="studentName" type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" placeholder="Enter child's full name" />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">Father's / Guardian's Name <span className="text-gray-400 font-normal">(पिता/अभिभावक का नाम)</span></label>
                <input required name="guardianName" type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition" placeholder="Enter guardian's name" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">WhatsApp Number <span className="text-gray-400 font-normal">(मोबाइल नंबर)</span></label>
                  <input required name="whatsappNumber" type="tel" pattern="[0-9]{10}" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition" placeholder="10-digit number" />
                </div>
                <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">Email Address <span className="text-gray-400 font-normal">(ईमेल)</span></label>
                <input name="guardianEmail" type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition" placeholder="Enter your email" />
              </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">Village / Ward <span className="text-gray-400 font-normal">(गाँव / वार्ड)</span></label>
                  <input required name="village" type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition" placeholder="e.g. Bhudadaand" />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1">Admission for Class <span className="text-gray-400 font-normal">(कक्षा)</span></label>
                <select required name="className" defaultValue="" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition text-gray-700 appearance-none cursor-pointer">
                  <option value="" disabled>Select Class...</option>
                  <option value="nursery">Nursery (नर्सरी)</option>
                  <option value="kg1">KG 1 (LKG)</option>
                  <option value="kg2">KG 2 (UKG)</option>
                  <option value="class1">Class 1</option>
                  <option value="class2">Class 2</option>
                  <option value="class3">Class 3</option>
                  <option value="class4">Class 4</option>
                  <option value="class5">Class 5</option>
                  <option value="class6">Class 6</option>
                  <option value="class7">Class 7</option>
                  <option value="class8">Class 8</option>
                </select>
              </div>
              <motion.button 
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                className={`w-full text-white font-bold py-3 md:py-4 rounded-xl transition mt-4 shadow-lg flex justify-center items-center gap-2 text-sm md:text-base ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30'}`}
              >
                {isSubmitting ? 'Sending...' : <>Submit Inquiry <ArrowRight size={18} /></>}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-blue-950 border-t border-white/10 pt-12 md:pt-16 pb-8 px-6 md:px-16 text-blue-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Column */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <img src="/logo.png" alt="Integrity Logo" className="h-10 w-10 md:h-12 md:w-12 drop-shadow-md" />
              <span className="text-xl md:text-2xl font-black text-white">INTEGRITY S & E</span>
            </div>
            <p className="text-xs md:text-sm leading-relaxed">Nurturing minds, building character, and shaping the leaders of tomorrow through holistic education.</p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4 md:mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
              <li><a href="#about" className="hover:text-yellow-400 hover:pl-2 transition-all block">About Us</a></li>
              <li><a href="#contact" className="hover:text-yellow-400 hover:pl-2 transition-all block">Admissions</a></li>
              <li><a href="/gallery" className="hover:text-yellow-400 hover:pl-2 transition-all block">Campus Gallery</a></li>
              <li><a href="/faculty" className="hover:text-cyan-300 hover:pl-2 transition-all block text-cyan-400">Our Faculty</a></li>
            </ul>
          </div>
          
          {/* Resources & Portals */}
          <div>
            <h4 className="text-white font-bold mb-4 md:mb-6 uppercase tracking-wider text-sm">Resources</h4>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
              <li><a href="#" className="hover:text-yellow-400 hover:pl-2 transition-all block">Parent Portal</a></li>
              <li><a href="#" className="hover:text-yellow-400 hover:pl-2 transition-all block">School Calendar</a></li>
              
              {/* Linked to the PDF in the public folder. target="_blank" opens it in a new tab! */}
              <li>
                <a href="/fees.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 hover:pl-2 transition-all block flex items-center gap-2">
                  Fee Structure (PDF)
                </a>
              </li>
              
              {/* Teacher/Admin ERP Portal Link */}
              <li className="pt-2 mt-2 border-t border-blue-900/50">
                <a href="/admin/login" className="hover:text-white hover:pl-2 transition-all block text-cyan-400 font-bold flex items-center gap-2">
                  <ShieldCheck size={14} /> Staff / Teacher Login
                </a>
              </li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div className="sm:col-span-2 md:col-span-1">
            <h4 className="text-white font-bold mb-4 md:mb-6 uppercase tracking-wider text-sm">Newsletter</h4>
            <p className="text-xs md:text-sm mb-4">Subscribe to get latest updates and school news.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="w-full bg-blue-900 border border-blue-800 rounded-lg px-3 py-2 text-sm outline-none text-white focus:border-cyan-500 transition-colors" />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-cyan-500 hover:bg-cyan-400 text-blue-950 px-4 py-2 rounded-lg font-bold transition-colors text-sm">Go</motion.button>
            </div>
          </div>
        </div>
        
        {/* Bottom Copyright */}
        <div className="max-w-7xl mx-auto border-t border-blue-900/50 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center text-xs gap-4 md:gap-0 text-center md:text-left">
          <p>&copy; {new Date().getFullYear()} Integrity Skill & Education School. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}