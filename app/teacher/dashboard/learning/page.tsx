"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/supabase";
import { 
  PlayCircle, BookOpen, GraduationCap, Trophy, 
  CheckCircle2, Clock, BrainCircuit, FileText, 
  Download, Plus, Trash2, Save, X, Loader2, Sparkles, Video,
  UploadCloud, Award, ExternalLink, Calendar
} from "lucide-react";

export default function ProfessionalDevelopmentHub() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI States
  const [activeTab, setActiveTab] = useState<"Modules" | "Portfolio">("Modules");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCert, setIsUploadingCert] = useState(false);

  // Data States
  const [modules, setModules] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [openedVideos, setOpenedVideos] = useState<Set<string>>(new Set());

  const [profileData, setProfileData] = useState({
    bio: "",
    skills: [] as string[],
    newSkill: "",
  });

  useEffect(() => {
    initializeHub();
  }, []);

  const initializeHub = async () => {
    setIsLoading(true);
    let activeEmpId = null;

    try {
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      
      let userQuery = supabase.from('users').select('*');
      if (session?.user?.email) {
        userQuery = userQuery.eq('email', session.user.email);
      } else {
        userQuery = userQuery.eq('role', 'teacher').not('emp_id', 'is', null).limit(1);
      }
      
      const { data: userData } = await userQuery.single();
      if (userData?.emp_id) {
        activeEmpId = userData.emp_id;
        setCurrentUser(userData);
        await fetchData(activeEmpId);
      }
    } catch (err) {
      console.error("Initialization error:", err);
    }
  };

  const fetchData = async (empId: string) => {
    try {
      // 1. Fetch Assignments specifically targeted to this teacher
      const { data: assignedData } = await supabase.from('teacher_module_assignments').select('*').eq('teacher_id', empId);
      
      if (assignedData && assignedData.length > 0) {
        setAssignments(assignedData);
        
        // Extract the module IDs this teacher is allowed to see
        const moduleIds = assignedData.map(a => a.module_id);
        
        // 2. Fetch only those specific modules
        const { data: mods } = await supabase.from('learning_modules').select('*').in('id', moduleIds).order('created_at', { ascending: false });
        if (mods) setModules(mods);
      } else {
        setAssignments([]);
        setModules([]);
      }

      // 3. Fetch Portfolio Data
      const [certsRes, profRes] = await Promise.all([
        supabase.from('teacher_certificates').select('*').eq('teacher_id', empId).order('created_at', { ascending: false }),
        supabase.from('staff_profiles').select('*').eq('id', empId).single()
      ]);
      
      if (certsRes.data) setCertificates(certsRes.data);
      if (profRes.data) {
        setProfileData(prev => ({
          ...prev,
          bio: profRes.data.bio || "",
          skills: profRes.data.skills || [],
        }));
        setCurrentUser((prev: any) => ({ ...prev, profile: profRes.data }));
      }
    } catch (error) {
      console.error("Data fetch error", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- VIDEO & PROGRESS ACTIONS ---
  const extractYouTubeID = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleOpenVideo = (module: any) => {
    window.open(module.content_url, '_blank');
    setOpenedVideos(prev => new Set(prev).add(module.id));
  };

  const handleMarkCompleted = async (moduleId: string) => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      // Update the assignment status to Completed
      const { error } = await supabase.from('teacher_module_assignments').update({
        status: 'Completed',
        completed_at: new Date().toISOString()
      }).eq('teacher_id', currentUser.emp_id).eq('module_id', moduleId);

      if (error) throw error;
      
      setAssignments(prev => prev.map(a => a.module_id === moduleId ? { ...a, status: 'Completed' } : a));
    } catch (err) {
      console.error("Failed to update progress", err);
    } finally {
      setIsSaving(false);
    }
  };

  // --- PORTFOLIO & CERTIFICATE ACTIONS ---
  const handleSaveProfile = async () => {
    if (!currentUser?.emp_id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('staff_profiles').update({
        bio: profileData.bio,
        skills: profileData.skills,
      }).eq('id', currentUser.emp_id);
      
      if (error) throw error;
      alert("Professional Portfolio updated successfully!");
    } catch (err) {
      console.error("Failed to save profile", err);
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    if (profileData.newSkill.trim() !== "" && !profileData.skills.includes(profileData.newSkill.trim())) {
      setProfileData({ ...profileData, skills: [...profileData.skills, profileData.newSkill.trim()], newSkill: "" });
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfileData({ ...profileData, skills: profileData.skills.filter(s => s !== skillToRemove) });
  };

  const handleUploadCertificate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const programName = prompt("Enter the name of the Certification/Program:");
    if (!programName) return;

    setIsUploadingCert(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${currentUser.emp_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('certificates').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('certificates').getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('teacher_certificates').insert([{
        teacher_id: currentUser.emp_id,
        program_name: programName,
        file_url: publicUrl
      }]);

      if (dbError) throw dbError;
      
      fetchData(currentUser.emp_id);
      alert("Certificate uploaded successfully!");

    } catch (err: any) {
      alert("Failed to upload certificate: " + err.message);
    } finally {
      setIsUploadingCert(false);
    }
  };

  const handleDeleteCertificate = async (id: string, fileUrl: string) => {
    if (!confirm("Remove this certificate?")) return;
    const path = fileUrl.split('/certificates/')[1];
    if (path) await supabase.storage.from('certificates').remove([path]);
    await supabase.from('teacher_certificates').delete().eq('id', id);
    fetchData(currentUser.emp_id);
  };

  const handlePrintResume = () => {
    window.print();
  };

  // Computations
  const completedCount = assignments.filter(a => a.status === 'Completed').length;
  const totalPoints = assignments.filter(a => a.status === 'Completed').reduce((acc, curr) => {
    const mod = modules.find(m => m.id === curr.module_id);
    return acc + (mod ? mod.points : 0);
  }, 0);

  if (isLoading) return <div className="flex h-screen items-center justify-center w-full"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

  return (
    <>
      {/* ========================================================= */}
      {/* GLOBAL PRINT OVERRIDE (For PDF Resume Generation) */}
      {/* ========================================================= */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #resume-print-view, #resume-print-view * { visibility: visible; }
          #resume-print-view {
            position: absolute; left: 0; top: 0; width: 100%; padding: 40px; margin: 0; background: white;
          }
        }
      `}} />

      {/* PRINT-ONLY RESUME VIEW */}
      <div id="resume-print-view" className="hidden print:block w-full max-w-4xl mx-auto bg-white p-10 relative text-slate-800 font-sans">
        <div className="border-b-4 border-slate-900 pb-8 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase">{currentUser?.profile?.first_name} {currentUser?.profile?.last_name}</h1>
            <h2 className="text-xl font-bold text-blue-600 mt-2 tracking-widest uppercase">{currentUser?.profile?.designation || "Educator"}</h2>
          </div>
          <div className="text-right text-sm font-bold text-slate-500 space-y-1">
            <p>Employee ID: {currentUser?.emp_id}</p>
            <p>{currentUser?.email}</p>
            <p>Integrity S & E School, Jashpur</p>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">Professional Summary</h3>
          <p className="text-slate-700 leading-relaxed font-medium">{profileData.bio || "Dedicated educational professional committed to student success."}</p>
        </div>

        <div className="grid grid-cols-2 gap-10">
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">Core Competencies</h3>
            <div className="flex flex-wrap gap-2 mb-8">
              {profileData.skills.length > 0 ? profileData.skills.map((skill, i) => (
                <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200">{skill}</span>
              )) : <span className="text-slate-400 italic">No skills listed.</span>}
            </div>

            <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">Continuing Education</h3>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <p className="font-black text-blue-800">Internal Faculty Training Program</p>
              <p className="text-sm text-blue-600 font-bold mt-1">Completed Modules: {completedCount}</p>
              <p className="text-xs text-blue-500 font-medium">Earned {totalPoints} Professional Development Points</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-2">Certifications & Programs</h3>
            <div className="space-y-4">
              {certificates.length > 0 ? certificates.map(cert => (
                <div key={cert.id} className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5"/>
                  <div>
                    <p className="font-bold text-slate-800 leading-tight">{cert.program_name}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">Issued: {new Date(cert.created_at).getFullYear()}</p>
                  </div>
                </div>
              )) : <span className="text-slate-400 italic">No external certifications uploaded.</span>}
            </div>
          </div>
        </div>
      </div>


      {/* ========================================================= */}
      {/* MAIN DASHBOARD UI */}
      {/* ========================================================= */}
      <div className="print:hidden p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto h-full flex flex-col relative pb-24 space-y-6 min-w-0">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm w-full min-w-0">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight truncate">Learning Hub</h1>
              <p className="text-slate-500 font-medium mt-1 text-sm truncate">Complete assigned training and manage your professional portfolio.</p>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto shrink-0">
            <button onClick={() => setActiveTab("Modules")} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "Modules" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              <PlayCircle className="w-4 h-4" /> Assigned Modules
            </button>
            <button onClick={() => setActiveTab("Portfolio")} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "Portfolio" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              <FileText className="w-4 h-4" /> Portfolio & Resume
            </button>
          </div>
        </div>

        {/* TAB 1: MODULES & VIDEOS */}
        {activeTab === "Modules" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col gap-6">
            
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
                <div><p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Assigned Tasks</p><p className="text-3xl font-black text-slate-800">{modules.length}</p></div>
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center"><BookOpen className="w-5 h-5"/></div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
                <div><p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Completed</p><p className="text-3xl font-black text-emerald-600">{completedCount}</p></div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center"><CheckCircle2 className="w-5 h-5"/></div>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-[2rem] shadow-lg flex items-center justify-between text-white">
                <div><p className="text-xs font-black uppercase tracking-widest text-blue-200 mb-1">Total CPD Points</p><p className="text-3xl font-black">{totalPoints}</p></div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"><Trophy className="w-5 h-5 text-yellow-300"/></div>
              </div>
            </div>

            {/* Video Grid */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-8 flex-1">
              <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Video className="w-5 h-5 text-red-500"/> Required Video Training</h2>
              
              {modules.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold">You currently have no training modules assigned to you.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {modules.map(module => {
                    const assignmentRecord = assignments.find(a => a.module_id === module.id);
                    const isCompleted = assignmentRecord?.status === 'Completed';
                    const hasOpened = openedVideos.has(module.id);
                    const ytId = extractYouTubeID(module.content_url);
                    const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '/placeholder-video.jpg';

                    return (
                      <div key={module.id} className="group bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                        <div className="relative aspect-video bg-slate-200 overflow-hidden cursor-pointer" onClick={() => handleOpenVideo(module)}>
                          <img src={thumbnailUrl} alt={module.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center group-hover:bg-slate-900/20 transition-colors">
                            <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                              <PlayCircle className="w-8 h-8 text-red-600 fill-red-600 ml-1"/>
                            </div>
                          </div>
                          {isCompleted && (
                            <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                              <CheckCircle2 className="w-3 h-3"/> Completed
                            </div>
                          )}
                          <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3"/> {module.duration}
                          </div>
                        </div>
                        
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="font-black text-slate-800 text-lg mb-2 leading-tight line-clamp-2">{module.title}</h3>
                          <p className="text-sm font-medium text-slate-500 mb-4 line-clamp-2">{module.description}</p>
                          
                          {assignmentRecord?.due_date && (
                            <div className="mb-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg w-max">
                              <Calendar className="w-3 h-3"/> Due: {new Date(assignmentRecord.due_date).toLocaleDateString('en-GB')}
                            </div>
                          )}

                          <div className="mt-auto space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">+{module.points} Points</span>
                              {!isCompleted && !hasOpened && <span className="text-slate-500 flex items-center gap-1"><ExternalLink className="w-3 h-3"/> Open link to complete</span>}
                            </div>

                            {isCompleted ? (
                               <div className="w-full bg-emerald-50 text-emerald-700 font-black py-3 rounded-xl flex items-center justify-center gap-2 border border-emerald-200">
                                 <CheckCircle2 className="w-4 h-4"/> Done
                               </div>
                            ) : (
                               <button 
                                  onClick={() => handleMarkCompleted(module.id)} 
                                  disabled={!hasOpened || isSaving}
                                  className={`w-full font-black py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${hasOpened ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>} 
                                  Mark as Completed
                               </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: PORTFOLIO & RESUME BUILDER */}
        {activeTab === "Portfolio" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col lg:flex-row gap-6">
            
            {/* Editor Side */}
            <div className="lg:w-2/3 flex flex-col gap-6">
              
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-purple-500"/> Professional Profile</h2>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Update information to generate your resume.</p>
                  </div>
                  <button onClick={handleSaveProfile} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-70">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Info
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Professional Summary (Bio)</label>
                    <textarea 
                      rows={3} 
                      value={profileData.bio}
                      onChange={e => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="Briefly describe your teaching philosophy and experience..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none text-sm leading-relaxed" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Core Competencies & Skills</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <AnimatePresence>
                        {profileData.skills.map((skill, i) => (
                          <motion.span initial={{ scale: 0.8, opacity: 0}} animate={{ scale: 1, opacity: 1}} exit={{ scale: 0.8, opacity: 0}} key={i} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                            {skill} <button onClick={() => removeSkill(skill)} className="hover:bg-blue-200 p-0.5 rounded-full"><X className="w-3 h-3"/></button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={profileData.newSkill}
                        onChange={e => setProfileData({...profileData, newSkill: e.target.value})}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        placeholder="e.g. Differentiated Instruction, STEM Lab Management" 
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" 
                      />
                      <button onClick={addSkill} type="button" className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-black px-5 rounded-xl transition-colors"><Plus className="w-5 h-5"/></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate Uploader */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 sm:p-8 flex-1">
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Award className="w-5 h-5 text-amber-500"/> External Certifications</h2>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Upload files to include in your resume.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Upload Dropzone */}
                  <div className="relative border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-indigo-50 transition-colors cursor-pointer min-h-[160px]">
                    <input type="file" onChange={handleUploadCertificate} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.jpg,.png" disabled={isUploadingCert} />
                    {isUploadingCert ? (
                      <Loader2 className="w-8 h-8 text-indigo-400 mb-2 animate-spin" />
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-indigo-400 mb-2" />
                        <p className="text-sm font-black text-indigo-900 mb-1">Upload Certificate</p>
                        <p className="text-[10px] font-bold text-indigo-500/70">PDF or Images (Max 10MB)</p>
                      </>
                    )}
                  </div>

                  {/* List of Uploaded Certs */}
                  <div className="space-y-3 overflow-y-auto max-h-[200px] custom-scrollbar pr-2">
                    {certificates.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">No certificates uploaded yet.</div>
                    ) : (
                      certificates.map(cert => (
                        <div key={cert.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0"><Award className="w-4 h-4"/></div>
                            <p className="font-bold text-slate-700 text-sm truncate">{cert.program_name}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><ExternalLink className="w-4 h-4"/></a>
                            <button onClick={() => handleDeleteCertificate(cert.id, cert.file_url)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview & Download Side */}
            <div className="lg:w-1/3 bg-slate-900 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col shadow-2xl border border-slate-800">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col h-full items-center text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full p-1 shadow-2xl mb-6">
                  <div className="w-full h-full bg-slate-800 rounded-full border-4 border-slate-900 flex items-center justify-center font-black text-3xl text-white">
                    {currentUser?.profile?.first_name?.charAt(0)}{currentUser?.profile?.last_name?.charAt(0)}
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-1">{currentUser?.profile?.first_name} {currentUser?.profile?.last_name}</h3>
                <p className="text-blue-400 font-bold text-sm tracking-widest uppercase mb-8">{currentUser?.profile?.designation}</p>

                <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 backdrop-blur-sm text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Resume Readiness</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden"><div className="bg-emerald-500 h-full w-full"></div></div>
                    <span className="text-emerald-400 font-black text-xs">100%</span>
                  </div>
                  <p className="text-xs font-medium text-slate-300">Your profile contains enough data to generate an industry-standard resume.</p>
                </div>

                <div className="mt-auto w-full space-y-3">
                  <button onClick={handlePrintResume} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2">
                    <Download className="w-5 h-5"/> Generate PDF Resume
                  </button>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1 mt-4"><Sparkles className="w-3 h-3"/> System Auto-Formats PDF</p>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </div>
    </>
  );
}