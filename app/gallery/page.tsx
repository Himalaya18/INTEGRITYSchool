"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, Camera, X, ZoomIn, GraduationCap } from "lucide-react";

// --- Mock Data: Expand this with your real photos ---
const galleryData = [
  { id: 1, src: "class.jpeg", title: "Class Rooms", category: "Campus" },
  { id: 2, src: "kabaddi.png", title: "Annual Sports Fest", category: "Events" },
  { id: 3, src: "act1.jpeg", title: "Educational Activity", category: "Academics" },
  { id: 4, src: "tree.jpeg", title: "Inter-School Basketball Match", category: "Sports" },
  { id: 5, src: "act2.jpeg", title: "Educational Activity", category: "Academics" },
  { id: 6, src: "assembly.jpeg", title: "Modern Campus", category: "Campus" },
  { id: 7, src: "act2.jpeg", title: "Art & Craft Exhibition", category: "Events" },
  { id: 8, src: "dance.jpeg", title: "Teacher's Day Celebration", category: "Events" },
  { id: 9, src: "tree.jpeg", title: "Tree Plantation", category: "Sports" },
];

// Extract unique categories for the filter buttons
const categories = ["All", ...Array.from(new Set(galleryData.map(item => item.category)))];

export default function GalleryPage() {
  const [filter, setFilter] = useState("All");
  const [selectedImage, setSelectedImage] = useState<any>(null);

  // Filter the images based on the selected category
  const filteredImages = filter === "All" 
    ? galleryData 
    : galleryData.filter(img => img.category === filter);

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
      <section className="pt-32 md:pt-40 pb-10 md:pb-16 px-6 max-w-5xl mx-auto text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black tracking-widest uppercase mb-6 md:mb-8"
        >
          <Camera size={14} className="text-cyan-600" />
          Through the Lens
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-8xl font-black text-blue-950 tracking-tighter leading-[1] md:leading-[0.9] mb-6"
        >
          Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">Gallery.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-gray-500 max-w-2xl mx-auto text-sm md:text-lg font-medium"
        >
          Explore the vibrant life, academic excellence, and joyful moments captured at Integrity Skill & Education School.
        </motion.p>
      </section>

      {/* 3. FILTER BUTTONS */}
      <div className="max-w-7xl mx-auto px-4 md:px-16 mb-12">
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {categories.map((cat, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 md:px-8 md:py-3 rounded-full font-bold text-sm md:text-base transition-all duration-300 shadow-sm ${
                filter === cat 
                  ? "bg-blue-950 text-white shadow-blue-900/30 shadow-lg" 
                  : "bg-white text-gray-500 border border-gray-200 hover:text-blue-950 hover:border-blue-300"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 4. MASONRY GRID GALLERY */}
      <section className="px-4 md:px-16 max-w-[90rem] mx-auto min-h-[50vh]">
        <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6">
          <AnimatePresence>
            {filteredImages.map((img) => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                onClick={() => setSelectedImage(img)}
                className="group relative rounded-[20px] md:rounded-[30px] overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-shadow duration-500 break-inside-avoid bg-gray-100"
              >
                {/* The Image */}
                <img 
                  src={img.src} 
                  alt={img.title} 
                  className="w-full h-auto object-cover transform scale-100 group-hover:scale-110 transition-transform duration-700 ease-out" 
                />
                
                {/* Overlay that appears on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Text & Icon (Slides up on hover) */}
                <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex justify-between items-end">
                  <div>
                    <p className="text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">{img.category}</p>
                    <h3 className="text-white font-black text-lg md:text-xl leading-tight">{img.title}</h3>
                  </div>
                  <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                    <ZoomIn className="text-white" size={20} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State (Just in case) */}
        {filteredImages.length === 0 && (
          <div className="text-center text-gray-500 py-20 font-medium">
            No images found for this category yet.
          </div>
        )}
      </section>

      {/* 5. FULL-SCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-blue-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
          >
            {/* Close Button */}
            <button 
              className="absolute top-6 right-6 md:top-10 md:right-10 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors backdrop-blur-md"
              onClick={(e) => {
                e.stopPropagation(); // Prevents the backdrop click from firing
                setSelectedImage(null);
              }}
            >
              <X size={24} />
            </button>

            {/* Expanded Image */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()} // Don't close when clicking the image itself
            >
              <img 
                src={selectedImage.src} 
                alt={selectedImage.title} 
                className="w-auto max-w-full max-h-[75vh] object-contain rounded-[20px] shadow-2xl"
              />
              
              <div className="mt-6 text-center">
                <p className="text-cyan-400 font-bold text-sm uppercase tracking-widest mb-2">{selectedImage.category}</p>
                <h3 className="text-white font-black text-2xl md:text-4xl">{selectedImage.title}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}