"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileQuestion, Search, UploadCloud, FileText, 
  Download, Eye, Filter, Folder, BrainCircuit, 
  MoreVertical, Clock, CheckCircle2, Share2, 
  Trash2, FileType2, Plus, Loader2, X, ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/supabase";

export default function QuestionPaperVault() {
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, role: string} | null>(null);
  const [isExamDept, setIsExamDept] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Live Data
  const [papers, setPapers] = useState<any[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]); // For the upload dropdown
  
  // UI State
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: "", category: "major", targetClass: "", status: "Draft", marks: ""
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    initializePortal();
  }, []);

  const initializePortal = async () => {
    setIsLoading(true);
    let activeEmpId = null;
    let activeRole = 'teacher';
    let isExamHead = false;

    try {
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      
      if (session?.user?.email) {
        const { data: userData } = await supabase.from('users').select('emp_id, name, role').eq('email', session.user.email).single();
        if (userData?.emp_id) {
          activeEmpId = userData.emp_id;
          activeRole = userData.role;
          setCurrentUser({ id: activeEmpId, name: userData.name, role: activeRole });
          
          // Check if they are in the Exam Department
          const { data: profile } = await supabase.from('staff_profiles').select('department').eq('id', activeEmpId).single();
          if (profile?.department === 'Exam Department' || profile?.department === 'Exam' || activeRole === 'admin' || activeRole === 'principal') {
            isExamHead = true;
            setIsExamDept(true);
          }
          
          await fetchData(activeEmpId, isExamHead);
        }
      } else {
        // Fallback for development
        const { data: mockUser } = await supabase.from('users').select('emp_id, name, role').not('emp_id', 'is', null).limit(1).single();
        if (mockUser) {
          activeEmpId = mockUser.emp_id;
          setCurrentUser({ id: activeEmpId, name: mockUser.name, role: mockUser.role });
          await fetchData(activeEmpId, true); // True for testing
        }
      }
    } catch (err) {
      console.error("Auth fetch failed", err);
    }
    setIsLoading(false);
  };

  const fetchData = async (empId: string, hasExamAccess: boolean) => {
    // 1. Fetch Papers based on access level
    let query = supabase.from('question_papers').select('*').order('created_at', { ascending: false });
    
    // If NOT exam dept or admin, restrict to ONLY their own uploaded papers
    if (!hasExamAccess) {
      query = query.eq('teacher_id', empId);
    }
    
    const { data: paperData } = await query;
    if (paperData) setPapers(paperData);

    // 2. Fetch classes this teacher is assigned to (for the upload dropdown)
    const { data: assignments } = await supabase.from('class_assignments').select('class_name, section').eq('teacher_id', empId);
    if (assignments) {
      const uniqueClasses = [...new Set(assignments.map(a => `${a.class_name}-${a.section}`))];
      setTeacherClasses(uniqueClasses.length > 0 ? uniqueClasses : ["Class 8-A", "Class 7-B", "Class 6-C"]); // Fallback if none assigned
      setUploadForm(prev => ({ ...prev, targetClass: uniqueClasses[0] || "Class 8-A" }));
    }
  };

  // --- ACTIONS ---
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!selectedFile) return alert("Please select a file to upload.");
    if (!uploadForm.title) return alert("Title is required.");
    
    setIsUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      const fileName = `QP-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`; 

      // 1. Upload to Storage Bucket 'papers'
      const { error: uploadError } = await supabase.storage.from('papers').upload(filePath, selectedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('papers').getPublicUrl(filePath);
      
      let finalType = 'file';
      if (['pdf'].includes(fileExt || '')) finalType = 'pdf';
      else if (['doc', 'docx'].includes(fileExt || '')) finalType = 'doc';

      const finalSize = (selectedFile.size / (1024 * 1024)).toFixed(2) + " MB";

      // 2. Insert into Database
      const { error: dbError } = await supabase.from('question_papers').insert([{
        teacher_id: currentUser.id,
        title: uploadForm.title,
        category: uploadForm.category,
        target_class: uploadForm.targetClass,
        status: uploadForm.status,
        marks: uploadForm.marks ? parseInt(uploadForm.marks) : null,
        type: finalType,
        file_url: publicUrl,
        file_size: finalSize,
      }]);

      if (dbError) throw dbError;

      setIsUploadModalOpen(false);
      setUploadForm({ title: "", category: "major", targetClass: teacherClasses[0] || "", status: "Draft", marks: "" });
      setSelectedFile(null);
      fetchData(currentUser.id, isExamDept);

    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePaper = async (id: string, fileUrl: string) => {
    if (!confirm("Are you sure you want to permanently delete this paper?")) return;

    // Delete from storage bucket
    const path = fileUrl.split('/papers/')[1]; 
    if (path) await supabase.storage.from('papers').remove([path]);

    // Delete from DB
    await supabase.from('question_papers').delete().eq('id', id);
    if (currentUser) fetchData(currentUser.id, isExamDept);
  };

  const handleForceDownload = async (fileUrl: string, title: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = fileUrl.split('.').pop()?.split('?')[0] || 'pdf';
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      window.open(fileUrl, '_blank'); 
    }
  };

  // --- FILTER & RENDER HELPERS ---
  const filteredPapers = papers.filter(paper => {
    const matchesCategory = activeCategory === "all" || paper.category === activeCategory;
    const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) || paper.target_class.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getFileIcon = (type: string) => {
    if (type === 'pdf') return <FileType2 className="w-8 h-8 text-red-500" />;
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  // Dynamic Category Counts
  const paperCategories = [
    { id: "all", name: "All Assessments", count: papers.length },
    { id: "major", name: "Term Exams (Summative)", count: papers.filter(p => p.category === 'major').length },
    { id: "quiz", name: "Monthly Quizzes", count: papers.filter(p => p.category === 'quiz').length },
    { id: "practice", name: "Practice Worksheets", count: papers.filter(p => p.category === 'practice').length },
  ];

  if (isLoading) return <div className="flex h-screen items-center justify-center w-full"><Loader2 className="w-10 h-10 animate-spin text-orange-600" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto min-h-full flex flex-col relative pb-24 space-y-6 bg-slate-50/50 min-w-0">
      
      {/* ================= HEADER & QUICK ACTIONS ================= */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0 bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden w-full min-w-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>

        <div className="relative z-10 min-w-0">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner border border-orange-200/50 shrink-0">
              <FileQuestion className="w-6 h-6" />
            </div>
            <span className="truncate">Assessment Archive</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm flex items-center gap-2 truncate">
            {isExamDept ? "Exam Dept Access: Viewing all repository papers." : "Secure central repository for your question papers and quizzes."}
          </p>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full xl:w-auto shrink-0">
          <Link href="/teacher/dashboard/ai" className="flex-1 sm:flex-none bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold py-3 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 group whitespace-nowrap">
            <BrainCircuit className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Generate via AI
          </Link>
          <button onClick={() => setIsUploadModalOpen(true)} className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap">
            <UploadCloud className="w-4 h-4" /> Upload Paper
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 w-full min-w-0">
        
        {/* ================= LEFT COLUMN: FOLDER DIRECTORY ================= */}
        <div className="xl:col-span-3 flex flex-col gap-6 w-full min-w-0">
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm p-6 sticky top-6">
            <h2 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
              <Folder className="w-4 h-4 text-slate-400"/> Archive Directories
            </h2>
            
            <div className="space-y-2">
              {paperCategories.map(category => (
                <button 
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeCategory === category.id ? 'bg-orange-50 text-orange-700 border border-orange-100 shadow-[0_2px_10px_rgba(255,165,0,0.1)]' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                >
                  <span className="flex items-center gap-3 truncate">
                    <Folder className={`w-4 h-4 shrink-0 ${activeCategory === category.id ? 'text-orange-500 fill-orange-100' : 'text-slate-400 fill-slate-100'}`} />
                    <span className="truncate">{category.name}</span>
                  </span>
                  <span className={`text-[10px] px-2.5 py-1 rounded-lg shrink-0 ${activeCategory === category.id ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'}`}>
                    {category.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="font-black text-slate-800 mb-4 uppercase tracking-widest text-xs">Security Status</h3>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-emerald-900">Vault Secured</p>
                  <p className="text-[10px] font-bold text-emerald-700 mt-1 leading-relaxed">
                    {isExamDept 
                      ? "You have Exam Department clearance to view and manage all papers." 
                      : "All major exam papers are locked and accessible only by you and the Examination Head."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: PAPER GRID ================= */}
        <div className="xl:col-span-9 flex flex-col h-full min-w-0 w-full">
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm flex-1 flex flex-col overflow-hidden w-full">
            
            {/* Search & Toolbar */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0 w-full min-w-0">
              <div className="relative w-full max-w-[28rem]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by topic, class..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full bg-white border border-slate-200/80 text-slate-900 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all font-medium text-sm shadow-sm" 
                />
              </div>
              <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-orange-600 shadow-sm transition-colors flex items-center gap-2 text-sm font-bold w-full sm:w-auto justify-center shrink-0">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30 w-full">
              {filteredPapers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                    <Search className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-700">No papers found</h3>
                  <p className="text-slate-500 font-medium mt-2 max-w-md">We couldn't find any question papers matching your search. Upload or generate a new one.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                  <AnimatePresence>
                    {filteredPapers.map((paper) => (
                      <motion.div 
                        layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                        key={paper.id} 
                        className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-orange-300 hover:shadow-md transition-all group flex flex-col relative min-w-0"
                      >
                        <div className="flex items-start gap-4 mb-5 min-w-0">
                          <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                            {getFileIcon(paper.type)}
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 mb-1 min-w-0">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${paper.status === 'Finalized' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{paper.status}</span>
                            </div>
                            <h3 className="font-black text-slate-800 text-base leading-tight mb-2 truncate" title={paper.title}>{paper.title}</h3>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 truncate">
                              {paper.target_class} {paper.marks && <span className="text-slate-300">|</span>} {paper.marks && <span className="text-orange-600">{paper.marks} Marks</span>}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest truncate"><Clock className="w-3.5 h-3.5 shrink-0"/> {new Date(paper.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'})}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <a href={paper.file_url} target="_blank" rel="noopener noreferrer" title="View Preview" className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"><Eye className="w-4 h-4"/></a>
                            <button onClick={() => handleForceDownload(paper.file_url, paper.title)} title="Download" className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"><Download className="w-4 h-4"/></button>
                            <div className="w-px h-4 bg-slate-200 mx-1"></div>
                            <button onClick={() => handleDeletePaper(paper.id, paper.file_url)} title="Delete" className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= MANUAL UPLOAD MODAL ================= */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl flex flex-col relative overflow-hidden">
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><UploadCloud className="w-6 h-6 text-orange-600"/> Add to Vault</h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-5 relative z-10">
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Paper Title</label>
                  <input required type="text" value={uploadForm.title} onChange={e=>setUploadForm({...uploadForm, title: e.target.value})} placeholder="e.g. Class 8 Math Final" className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-sm" />
                </div>

                {/* Drag and Drop Zone */}
                <div className="relative border-2 border-dashed border-orange-200 bg-orange-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-orange-50 transition-colors cursor-pointer">
                  <input required type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.doc,.docx" />
                  <FileQuestion className="w-8 h-8 text-orange-400 mb-2" />
                  <p className="text-sm font-black text-orange-900 mb-1">{selectedFile ? selectedFile.name : "Select Paper or Drag here"}</p>
                  <p className="text-xs font-bold text-orange-600/70">PDF or DOCX Formats (Max 20MB)</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Category</label>
                    <select value={uploadForm.category} onChange={e=>setUploadForm({...uploadForm, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-orange-500 appearance-none text-sm">
                      <option value="major">Term Exam</option>
                      <option value="quiz">Monthly Quiz</option>
                      <option value="practice">Practice Worksheet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Target Class</label>
                    <select value={uploadForm.targetClass} onChange={e=>setUploadForm({...uploadForm, targetClass: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-orange-500 appearance-none text-sm">
                      {teacherClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Marks (Optional)</label>
                    <input type="number" value={uploadForm.marks} onChange={e=>setUploadForm({...uploadForm, marks: e.target.value})} placeholder="e.g. 80" className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Status</label>
                    <select value={uploadForm.status} onChange={e=>setUploadForm({...uploadForm, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-orange-500 appearance-none text-sm">
                      <option>Draft (WIP)</option><option>Finalized</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={isUploading} className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-black py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 mt-4">
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                  {isUploading ? "Uploading Paper..." : "Save to Archive"}
                </button>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}