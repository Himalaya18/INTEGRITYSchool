"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, Lock, Mail, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function StaffLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate an API login call
    setTimeout(() => {
      setIsLoading(false);
      // Later, we will redirect to the dashboard here:
      // window.location.href = "/admin/dashboard";
      alert("This will connect to your database soon!");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans selection:bg-yellow-300 selection:text-blue-900">
      
      {/* Back to Home Button */}
      <a 
        href="/" 
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 text-blue-950 hover:text-blue-600 font-bold transition-colors z-20 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 shadow-sm"
      >
        <ArrowLeft size={18} /> <span className="hidden sm:inline">Back to Main Site</span>
      </a>

      <div className="max-w-5xl w-full bg-white rounded-[30px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side - Branding & Info (Hidden on very small mobile screens) */}
        <div className="hidden md:flex md:w-5/12 bg-blue-950 p-12 flex-col justify-between relative overflow-hidden text-white">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

          {/* CENTERED LOGO AND TEXT FOR DESKTOP */}
          <div className="relative z-10 flex flex-col items-center text-center mt-8">
            <img src="/logo.png" alt="Integrity Logo" className="w-40 h-40 drop-shadow-lg mb-6" />
            <h2 className="text-3xl lg:text-4xl font-black leading-tight mb-4">
              Integrity <br/>Staff Portal
            </h2>
            <p className="text-blue-200 font-medium leading-relaxed text-sm lg:text-base px-4">
              Welcome back. Access your classes, manage attendance, and upload homework seamlessly.
            </p>
          </div>

          <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-8">
            <div className="flex items-center justify-center gap-3 text-cyan-300 mb-2">
              <ShieldCheck size={20} />
              <h3 className="font-bold text-sm uppercase tracking-wider">Secure Access</h3>
            </div>
            <p className="text-xs text-blue-100 text-center">
              This portal is strictly restricted to authorized staff members of Integrity Skill & Education School.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative">
          
          {/* CENTERED MOBILE LOGO (Only visible on mobile) */}
          <div className="md:hidden flex flex-col items-center justify-center gap-3 mb-10 text-center">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 drop-shadow-md" />
            <h2 className="text-2xl font-black text-blue-950">Staff Portal</h2>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-black text-blue-950 mb-2">Sign In</h1>
              <p className="text-gray-500 font-medium mb-8 text-sm md:text-base">Please enter your staff credentials to continue.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              
              {/* Employee ID / Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Staff Email or ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <input 
                    required 
                    type="text" 
                    // ADDED text-gray-900 HERE
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" 
                    placeholder="e.g. teacher@integrity.edu" 
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">Password</label>
                  <a href="#" className="text-xs font-bold text-cyan-600 hover:text-blue-800 transition-colors">Forgot Password?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    // ADDED text-gray-900 HERE
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3 pl-11 pr-12 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button 
                disabled={isLoading}
                whileHover={{ scale: 1.01 }} 
                whileTap={{ scale: 0.98 }} 
                className={`w-full text-white font-bold py-3.5 rounded-xl transition mt-6 shadow-lg flex justify-center items-center gap-2 ${isLoading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30'}`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating...
                  </span>
                ) : "Access Portal"}
              </motion.button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-medium">
                Need help? Contact the <a href="mailto:admin@integrityschool.com" className="text-blue-600 font-bold hover:underline">IT Administrator</a>.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}