// LoadingScreen.tsx

import { Montserrat } from "next/font/google";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
  
const montserrat = Montserrat({ subsets: ["latin"] });

interface LoadingScreenProps {
  onFinish: () => void;
}

// Highly detailed Vector Boy Character
const BoyCharacter = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <g id="boy-character">
      {/* Back hair / Neck */}
      <rect x="90" y="100" width="20" height="30" fill="#FFD8B4" />
      
      {/* Legs & Shoes */}
      <path d="M 75 220 L 75 285 L 95 285 L 95 220 Z" fill="#1E3A8A" />
      <path d="M 105 220 L 105 285 L 125 285 L 125 220 Z" fill="#1E3A8A" />
      {/* Shoes */}
      <path d="M 65 285 L 95 285 L 95 300 L 65 300 Z" rx="5" fill="#1F2937" />
      <path d="M 105 285 L 135 285 L 135 300 L 105 300 Z" rx="5" fill="#1F2937" />

      {/* Left Arm & Hand */}
      <path d="M 60 140 L 35 195" stroke="#1E40AF" strokeWidth="18" strokeLinecap="round" />
      <ellipse cx="32" cy="200" rx="9" ry="11" fill="#FFD8B4" transform="rotate(30 32 200)" />
      
      {/* Right Arm & Hand */}
      <path d="M 140 140 L 165 195" stroke="#1E40AF" strokeWidth="18" strokeLinecap="round" />
      <ellipse cx="168" cy="200" rx="9" ry="11" fill="#FFD8B4" transform="rotate(-30 168 200)" />

      {/* Torso Base (Blue V-Neck Sweater/Blazer) */}
      <path d="M 55 135 Q 100 115 145 135 L 135 230 L 65 230 Z" fill="#1E40AF" />
      {/* V-Neck Opening & Light Blue Shirt */}
      <path d="M 85 125 L 115 125 L 100 165 Z" fill="#DBEAFE" />
      {/* Navy Tie inside V-neck */}
      <path d="M 96 135 L 104 135 L 100 160 Z" fill="#1E3A8A" /> 

      {/* Head & Face */}
      <ellipse cx="100" cy="75" rx="40" ry="50" fill="#FFD8B4" />
      {/* Ears */}
      <circle cx="58" cy="80" r="7" fill="#ECA67A" />
      <circle cx="142" cy="80" r="7" fill="#ECA67A" />
      
      {/* Detailed Hair */}
      <path d="M 55 60 Q 100 5 145 60 Q 140 25 100 15 Q 60 25 55 60 Z" fill="#382314" />
      <path d="M 55 60 Q 80 50 105 55 Q 80 35 55 60 Z" fill="#382314" /> {/* Bangs */}

      {/* Eyes */}
      <circle cx="82" cy="75" r="4.5" fill="#1F2937" />
      <circle cx="118" cy="75" r="4.5" fill="#1F2937" />
      {/* Eyebrows */}
      <path d="M 75 65 Q 82 62 89 65" stroke="#382314" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 111 65 Q 118 62 125 65" stroke="#382314" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Nose */}
      <path d="M 98 85 Q 100 88 102 85" stroke="#D97706" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Smile */}
      <path d="M 85 95 Q 100 108 115 95" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

// Highly detailed Vector Girl Character
const GirlCharacter = () => (
  <svg width="100%" height="100%" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
    <g id="girl-character">
      {/* Back Hair / Pigtails */}
      <path d="M 45 80 Q 20 140 35 190 Q 55 180 60 130 Z" fill="#2C1E16" />
      <path d="M 155 80 Q 180 140 165 190 Q 145 180 140 130 Z" fill="#2C1E16" />
      
      {/* Neck */}
      <rect x="90" y="100" width="20" height="30" fill="#FFD8B4" />

      {/* Legs & Socks */}
      <rect x="75" y="220" width="14" height="65" fill="#FFD8B4" />
      <rect x="111" y="220" width="14" height="65" fill="#FFD8B4" />
      {/* White Socks */}
      <rect x="74" y="260" width="16" height="25" fill="#F9FAFB" />
      <rect x="110" y="260" width="16" height="25" fill="#F9FAFB" />

      {/* Mary Jane Shoes */}
      <path d="M 65 285 L 93 285 L 93 300 L 65 300 Z" rx="5" fill="#1F2937" />
      <path d="M 107 285 L 135 285 L 135 300 L 107 300 Z" rx="5" fill="#1F2937" />
      <path d="M 70 280 L 88 280" stroke="#1F2937" strokeWidth="4" />
      <path d="M 112 280 L 130 280" stroke="#1F2937" strokeWidth="4" />

      {/* Left Arm & Hand */}
      <path d="M 60 140 L 35 195" stroke="#DBEAFE" strokeWidth="16" strokeLinecap="round" />
      <ellipse cx="32" cy="200" rx="9" ry="11" fill="#FFD8B4" transform="rotate(30 32 200)" />
      
      {/* Right Arm & Hand */}
      <path d="M 140 140 L 165 195" stroke="#DBEAFE" strokeWidth="16" strokeLinecap="round" />
      <ellipse cx="168" cy="200" rx="9" ry="11" fill="#FFD8B4" transform="rotate(-30 168 200)" />

      {/* Uniform: Light Blue Shirt Base */}
      <path d="M 55 135 Q 100 115 145 135 L 135 180 L 65 180 Z" fill="#DBEAFE" />
      
      {/* Uniform: Royal Blue Pinafore Jumper */}
      <path d="M 75 130 L 125 130 L 120 175 L 80 175 Z" fill="#1E40AF" />
      {/* Skirt Part with Pleat Lines */}
      <path d="M 65 170 Q 100 160 135 170 L 150 240 Q 100 245 50 240 Z" fill="#1E40AF" />
      <path d="M 65 170 L 135 170 L 135 180 L 65 180 Z" fill="#1E3A8A" /> {/* Belt/Waist */}
      <line x1="85" y1="180" x2="80" y2="242" stroke="#1E3A8A" strokeWidth="2" /> {/* Pleat */}
      <line x1="115" y1="180" x2="120" y2="242" stroke="#1E3A8A" strokeWidth="2" /> {/* Pleat */}

      {/* Head & Face */}
      <ellipse cx="100" cy="75" rx="40" ry="48" fill="#FFD8B4" />
      {/* Ears */}
      <circle cx="58" cy="80" r="7" fill="#ECA67A" />
      <circle cx="142" cy="80" r="7" fill="#ECA67A" />
      
      {/* Hair Top / Bangs (Structured & Sweeping) */}
      <path d="M 52 65 Q 100 -5 148 65 Q 148 35 100 20 Q 52 35 52 65 Z" fill="#3D291D" /> {/* Crown */}
      <path d="M 52 65 Q 85 45 115 65 Q 85 30 52 65 Z" fill="#3D291D" /> {/* Sweeping Bangs */}
      
      {/* Blue Headband */}
      <path d="M 55 58 Q 100 28 145 58" stroke="#1E40AF" strokeWidth="6" fill="none" strokeLinecap="round" />

      {/* Cute Hair Ties (Ribbons) on Pigtails */}
      <path d="M 35 105 Q 45 95 55 105 L 45 125 Z" fill="#1E40AF" />
      <path d="M 165 105 Q 155 95 145 105 L 155 125 Z" fill="#1E40AF" />

      {/* Eyes & Lashes */}
      <circle cx="82" cy="75" r="4.5" fill="#1F2937" />
      <circle cx="118" cy="75" r="4.5" fill="#1F2937" />
      <path d="M 77 72 Q 82 68 87 72" stroke="#1F2937" strokeWidth="1.5" fill="none" />
      <path d="M 113 72 Q 118 68 123 72" stroke="#1F2937" strokeWidth="1.5" fill="none" />
      
      {/* Eyebrows */}
      <path d="M 75 65 Q 82 62 89 65" stroke="#3D291D" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 111 65 Q 118 62 125 65" stroke="#3D291D" strokeWidth="2" fill="none" strokeLinecap="round" />
      
      {/* Nose */}
      <path d="M 98 85 Q 100 87 102 85" stroke="#D97706" strokeWidth="2" fill="none" strokeLinecap="round" />
      
      {/* Smile */}
      <path d="M 86 95 Q 100 108 114 95" stroke="#D97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

export default function LoadingScreen({ onFinish }: LoadingScreenProps) {
  const [showName, setShowName] = useState(false);

  useEffect(() => {
    const textTimer = setTimeout(() => {
      setShowName(true);
    }, 2500);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 5200);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-blue-100 via-white to-pink-100 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 1, ease: "easeInOut" },
      }}
    >
      {/* Background Glow */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-blue-300/20 blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
        }}
      />

      {/* Boy Character */}
      <motion.div
        initial={{ x: "-120vw" }}
        animate={{ x: "-400px" }}
        transition={{
          duration: 2.2,
          ease: "easeInOut",
        }}
        className="absolute left-1/2 bottom-24 w-44 md:w-52 h-64 md:h-80 drop-shadow-2xl"
      >
        <BoyCharacter />
      </motion.div>

      {/* Girl Character */}
      <motion.div
        initial={{ x: "120vw" }}
        animate={{ x: "400px" }}
        transition={{
          duration: 2.2,
          ease: "easeInOut",
        }}
        className="absolute right-1/2 bottom-24 w-44 md:w-52 h-64 md:h-80 drop-shadow-2xl"
      >
        <GirlCharacter />
      </motion.div>

      {/* School Building Container */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        transition={{
          duration: 1.2,
        }}
        className="relative flex flex-col items-center"
      >
        {/* School Card */}
        <motion.div
          animate={{
            boxShadow: [
              "0px 0px 20px rgba(59,130,246,0.2)",
              "0px 0px 40px rgba(59,130,246,0.5)",
              "0px 0px 20px rgba(59,130,246,0.2)",
            ],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
          className="bg-white rounded-[30px] px-10 py-8 shadow-2xl border border-blue-100"
        >
          <div className="flex flex-col items-center">
            
            {/* School Logo */}
            <motion.div
              animate={{
                rotate: [0, -5, 5, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
              }}
            >
              <img 
                src="/logo.png" 
                alt="School Logo" 
                className="w-50 h-50 object-contain drop-shadow-md" 
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: showName ? 1 : 0,
                y: showName ? 0 : 20,
              }}
              transition={{
                duration: 1,
              }}
              className="mt-6 text-center"
            >
              <span className="block text-4xl md:text-5xl font-extrabold text-blue-700 tracking-wide" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800,textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                INTEGRITY
              </span>

              <span className="block mt-2 text-3xl md:text-2xl font-semibold text-gray-700 ">
                S & E SCHOOL
              </span>
            </motion.h1>
          </div>
        </motion.div>

        {/* Moving Up Animation (Mask/Overlay effect) */}
        <motion.div
          initial={{ y: 0 }}
          animate={{
            y: showName ? -260 : 0,
            scale: showName ? 0.65 : 1,
          }}
          transition={{
            delay: 1,
            duration: 1.5,
            ease: "easeInOut",
          }}
          className="absolute inset-0 pointer-events-none"
        />
      </motion.div>

      {/* Loading Line */}
      <motion.div
        className="absolute bottom-10 h-1 rounded-full bg-blue-500"
        initial={{ width: 0 }}
        animate={{ width: "220px" }}
        transition={{
          duration: 4.5,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}