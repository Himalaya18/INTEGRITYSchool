// Path: app/teacher/dashboard/ai/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BrainCircuit, Sparkles, FileText, Download, 
  Save, Printer, CheckCircle2, Loader2, 
  FileQuestion, BookOpen, LayoutGrid, Wand2,
  Bold, Italic, List, AlignLeft, Type, Share2,
  SendHorizontal
} from "lucide-react";

export default function AITeachingAssistant() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [quickPrompt, setQuickPrompt] = useState("");
  
  // Refined Form State
  const [config, setConfig] = useState({
    type: "Quiz",
    grade: "Class 8",
    subject: "Mathematics",
    topic: "",
    difficulty: "Medium",
    questions: "10"
  });

  // ==========================================
  // AI GENERATION LOGIC (Safe Parsing)
  // ==========================================
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!config.topic && !quickPrompt) return;
    
    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const response = await fetch('/api/generate-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quickPrompt: quickPrompt,
          config: config 
        }),
      });

      // SAFE PARSING: Read as text first to prevent the "<!DOCTYPE" crash
      const textData = await response.text();
      let data;
      
      try {
        data = JSON.parse(textData);
      } catch (parseError) {
        throw new Error("Server returned an invalid format. Ensure your API route is working correctly.");
      }

      if (response.ok) {
        setGeneratedContent(data.reply);
      } else {
        throw new Error(data.reply || "Unknown Server Error");
      }
    } catch (error: any) {
      console.error("Generation Error:", error);
      setGeneratedContent(`# Error\nFailed to generate content: ${error.message}\nPlease check your API key and connection.`);
    } finally {
      setIsGenerating(false);
      setQuickPrompt(""); 
    }
  };

  // ==========================================
  // SAVE TO DATABASE LOGIC
  // ==========================================
  const handleSaveToDrive = async () => {
    if (!generatedContent) return;
    setIsSaving(true);

    try {
      // Get the logged-in teacher's ID
      const sessionStr = localStorage.getItem("currentUser");
      const teacherId = sessionStr ? JSON.parse(sessionStr).id : "TEMP_EMP_123";

      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherId,
          content_type: config.type,
          grade: config.grade,
          subject: config.subject,
          topic: config.topic || quickPrompt || "General Content",
          content_markdown: generatedContent
        }),
      });

      if (!response.ok) throw new Error("Failed to save to database");
      
      alert("Success! Material saved to your digital drive.");
    } catch (error) {
      console.error("Save error:", error);
      alert("Could not save the material. Ensure the database table exists.");
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // EXPORT UTILITIES (Print, Download, Share)
  // ==========================================
  const handlePrint = () => {
    if (!generatedContent) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Integrity S & E - Generated Material</title>
            <style>
              body { font-family: Georgia, serif; line-height: 1.6; padding: 40px; color: #333; }
              h1, h2, h3 { color: #1e293b; }
              pre { background: #f1f5f9; padding: 15px; border-radius: 8px; }
            </style>
          </head>
          <body>
            ${generatedContent.replace(/\n/g, '<br/>')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    if (!generatedContent) return;
    const blob = new Blob([generatedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `${config.grade}_${config.subject}_${config.topic || 'Material'}.md`.replace(/\s+/g, '_');
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!generatedContent) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Integrity S & E: ${config.subject} Material`,
          text: `Here is the generated ${config.type} for ${config.grade} - ${config.topic}.\n\n${generatedContent.substring(0, 100)}...`,
        });
      } catch (error) {
        console.log("Sharing failed or was cancelled.", error);
      }
    } else {
      navigator.clipboard.writeText(generatedContent);
      alert("Material copied to clipboard! You can now paste it in WhatsApp or Email.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto h-full flex flex-col relative pb-24 space-y-6">
      
      {/* ================= HEADER & QUICK PROMPT ================= */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="shrink-0">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><BrainCircuit className="w-5 h-5" /></div>
            AI Co-Pilot
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Generate structured educational content in seconds.</p>
        </div>
        
        {/* Magic Input Bar */}
        <div className="w-full xl:w-1/2 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div className="relative flex items-center bg-white border border-slate-200 rounded-full p-1.5 shadow-sm focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
            <div className="pl-4 pr-2 text-purple-500"><Sparkles className="w-4 h-4"/></div>
            <input 
              type="text" 
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. Create a 10-question quiz on Algebra for Class 8..." 
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
            />
            <button 
              onClick={() => handleGenerate()}
              disabled={(!quickPrompt && !config.topic) || isGenerating}
              className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0"
            >
              <SendHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
        
        {/* ================= LEFT COLUMN: SLEEK CONFIGURATOR ================= */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto no-scrollbar">
          
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-black text-slate-800 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-500" /> Structure Builder
              </h2>
            </div>

            <form onSubmit={handleGenerate} className="p-6 flex flex-col gap-6 flex-1">
              
              {/* Segmented Control for Type */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Content Format</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setConfig({...config, type: "Quiz"})} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${config.type === "Quiz" ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <FileQuestion className="w-4 h-4" /> Quiz / Test
                  </button>
                  <button type="button" onClick={() => setConfig({...config, type: "Notes"})} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${config.type === "Notes" ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <BookOpen className="w-4 h-4" /> Study Notes
                  </button>
                </div>
              </div>

              {/* Grid Layout for Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Target Class</label>
                  <select value={config.grade} onChange={e=>setConfig({...config, grade: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:bg-white transition-colors appearance-none cursor-pointer">
                    <option>Class 6</option><option>Class 7</option><option>Class 8</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Subject</label>
                  <select value={config.subject} onChange={e=>setConfig({...config, subject: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:bg-white transition-colors appearance-none cursor-pointer">
                    <option>Mathematics</option><option>Science</option><option>English</option>
                  </select>
                </div>
              </div>

              {/* Full Width Input */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Core Topic / Chapter</label>
                <input type="text" value={config.topic} onChange={e=>setConfig({...config, topic: e.target.value})} placeholder="e.g. Linear Equations" className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:bg-white transition-colors placeholder:font-medium" />
              </div>

              {/* Conditional Grid Inputs */}
              <AnimatePresence>
                {config.type === "Quiz" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-2 gap-4 overflow-hidden">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Difficulty</label>
                      <select value={config.difficulty} onChange={e=>setConfig({...config, difficulty: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:bg-white transition-colors appearance-none cursor-pointer">
                        <option>Easy</option><option>Medium</option><option>Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Total Questions</label>
                      <input type="number" min="1" max="50" value={config.questions} onChange={e=>setConfig({...config, questions: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:bg-white transition-colors" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button aligned to bottom */}
              <div className="mt-auto pt-4 border-t border-slate-100">
                <button type="submit" disabled={isGenerating || (!config.topic && !quickPrompt)} className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                  {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Synthesizing...</> : <><Sparkles className="w-4 h-4 text-purple-400" /> Build Content</>}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: PRO EDITOR ================= */}
        <div className="lg:col-span-8 flex flex-col h-full">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            
            {/* Professional Toolbar */}
            <div className="border-b border-slate-200 bg-white p-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
              
              {/* Text Formatting Group */}
              <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-100">
                <button className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="Text Style"><Type className="w-4 h-4"/></button>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <button className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="Bold"><Bold className="w-4 h-4"/></button>
                <button className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="Italic"><Italic className="w-4 h-4"/></button>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <button className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="List"><List className="w-4 h-4"/></button>
                <button className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all" title="Align"><AlignLeft className="w-4 h-4"/></button>
              </div>
              
              {/* Actions Group with Wired Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrint}
                  disabled={!generatedContent} 
                  className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-50 transition-colors" 
                  title="Print"
                >
                  <Printer className="w-5 h-5"/>
                </button>
                
                <button 
                  onClick={handleDownload}
                  disabled={!generatedContent} 
                  className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-50 transition-colors" 
                  title="Download as Markdown"
                >
                  <Download className="w-5 h-5"/>
                </button>
                
                <button 
                  onClick={handleShare}
                  disabled={!generatedContent} 
                  className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-50 transition-colors" 
                  title="Share or Copy"
                >
                  <Share2 className="w-5 h-5"/>
                </button>
                
                <div className="w-px h-6 bg-slate-200 mx-2"></div>
                
                {/* WIRED SAVE BUTTON */}
                <button 
                  onClick={handleSaveToDrive}
                  disabled={!generatedContent || isSaving} 
                  className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-emerald-100 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                  {isSaving ? "Saving..." : "Save to Drive"}
                </button>

              </div>
            </div>

            {/* Document Editor Area */}
            <div className="flex-1 overflow-y-auto bg-[#f8f9fc] relative">
              <AnimatePresence mode="wait">
                
                {isGenerating ? (
                  // Glowing Loading State
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <div className="w-full max-w-2xl space-y-6">
                      <div className="h-10 bg-slate-200/50 rounded-xl w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-slate-200/50 rounded-md w-full animate-pulse"></div>
                      <div className="h-4 bg-slate-200/50 rounded-md w-full animate-pulse delay-75"></div>
                      <div className="h-4 bg-slate-200/50 rounded-md w-5/6 animate-pulse delay-150"></div>
                      <div className="h-32 bg-slate-200/50 rounded-xl w-full animate-pulse mt-8"></div>
                    </div>
                  </motion.div>
                ) : generatedContent ? (
                  // Document View
                  <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 md:p-12">
                    <div className="max-w-3xl mx-auto bg-white p-10 md:p-16 rounded shadow-sm border border-slate-200 min-h-[800px]">
                      <textarea 
                        value={generatedContent} 
                        onChange={(e) => setGeneratedContent(e.target.value)}
                        className="w-full h-full min-h-[700px] outline-none resize-none text-slate-800 font-medium leading-relaxed custom-scrollbar"
                        style={{ fontFamily: "Georgia, serif", fontSize: "1.05rem" }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  // Empty State
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                      <LayoutGrid className="w-10 h-10 text-slate-300"/>
                    </div>
                    <h3 className="text-xl font-black text-slate-700 mb-2">Blank Canvas</h3>
                    <p className="font-medium text-slate-500 max-w-md">Use the Quick Prompt bar above or configure specific parameters on the left to generate new teaching material.</p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}