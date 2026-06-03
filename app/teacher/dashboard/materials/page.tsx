"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/supabase";
import { 
  BookOpen, Folder, FileText, Link as LinkIcon, 
  Search, Plus, MoreVertical, UploadCloud, FileSpreadsheet, 
  Trash2, Share2, Eye, Download, FolderPlus, Clock, Loader2, Image as ImageIcon, CheckCircle2, X
} from "lucide-react";

export default function SubjectMaterials() {
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Live Data
  const [folders, setFolders] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  
  // UI State
  const [activeFolder, setActiveFolder] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"file" | "link">("file");
  const [uploadForm, setUploadForm] = useState({ title: "", folderId: "", linkUrl: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    initializePortal();
  }, []);

  const initializePortal = async () => {
    setIsLoading(true);
    let activeEmpId = null;

    try {
      const res = await fetch('/api/auth/session');
      const session = await res.json();
      
      if (session?.user?.email) {
        const { data: userData } = await supabase.from('users').select('emp_id, name').eq('email', session.user.email).single();
        if (userData?.emp_id) {
          activeEmpId = userData.emp_id;
          setCurrentUser({ id: activeEmpId, name: userData.name });
          await fetchData(userData.emp_id);
        }
      } else {
        // Fallback for development
        const { data: mockUser } = await supabase.from('users').select('emp_id, name').eq('role', 'teacher').not('emp_id', 'is', null).limit(1).single();
        if (mockUser) {
          activeEmpId = mockUser.emp_id;
          setCurrentUser({ id: activeEmpId, name: mockUser.name });
          await fetchData(activeEmpId);
        }
      }
    } catch (err) {
      console.error("Auth fetch failed", err);
    }
    setIsLoading(false);
  };

  const fetchData = async (empId: string) => {
    // Fetch Folders
    const { data: folderData } = await supabase.from('materials_folders').select('*').eq('teacher_id', empId).order('created_at', { ascending: true });
    // Fetch Materials
    const { data: materialData } = await supabase.from('materials').select('*').eq('teacher_id', empId).order('created_at', { ascending: false });

    if (folderData) setFolders(folderData);
    if (materialData) setMaterials(materialData);
  };

  // --- ACTIONS ---
  const handleCreateFolder = async () => {
    const folderName = prompt("Enter new folder name:");
    if (!folderName || !currentUser) return;

    const { error } = await supabase.from('materials_folders').insert([{ teacher_id: currentUser.id, name: folderName }]);
    if (!error) fetchData(currentUser.id);
  };

  const handleDeleteMaterial = async (id: string, fileUrl: string, type: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    // If it's a physical file, remove it from Storage bucket first
    if (type !== 'link' && type !== 'video') {
      const path = fileUrl.split('/materials/')[1]; // Extract the path after the bucket name
      if (path) await supabase.storage.from('materials').remove([path]);
    }

    // Remove from DB
    await supabase.from('materials').delete().eq('id', id);
    if (currentUser) fetchData(currentUser.id);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!uploadForm.title) return alert("Title is required");
    
    setIsUploading(true);

    try {
      let finalFileUrl = uploadForm.linkUrl;
      let finalType = "link";
      let finalSize = "Web Link";

      // If uploading a physical file
      if (uploadType === "file" && selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`; // Store inside a folder named after the teacher's ID

        // Upload to Supabase Storage Bucket named 'materials'
        const { error: uploadError } = await supabase.storage.from('materials').upload(filePath, selectedFile);
        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(filePath);
        finalFileUrl = publicUrl;

        // Determine Type & Size
        if (['pdf'].includes(fileExt || '')) finalType = 'pdf';
        else if (['doc', 'docx'].includes(fileExt || '')) finalType = 'doc';
        else if (['xls', 'xlsx', 'csv'].includes(fileExt || '')) finalType = 'sheet';
        else if (['png', 'jpg', 'jpeg', 'gif'].includes(fileExt || '')) finalType = 'image';
        else finalType = 'file';

        finalSize = (selectedFile.size / (1024 * 1024)).toFixed(2) + " MB";
      } else if (uploadType === "link") {
        if (finalFileUrl.includes("youtube.com") || finalFileUrl.includes("youtu.be")) {
          finalType = "video";
          finalSize = "YouTube";
        }
      }

      // Insert into Database
      const { error: dbError } = await supabase.from('materials').insert([{
        teacher_id: currentUser.id,
        folder_id: uploadForm.folderId || null,
        title: uploadForm.title,
        type: finalType,
        file_url: finalFileUrl,
        file_size: finalSize,
      }]);

      if (dbError) throw dbError;

      // Success
      setIsUploadModalOpen(false);
      setUploadForm({ title: "", folderId: "", linkUrl: "" });
      setSelectedFile(null);
      fetchData(currentUser.id);

    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to force physical file download instead of browser preview
  const handleForceDownload = async (fileUrl: string, title: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Extract extension from the original URL
      const ext = fileUrl.split('.').pop()?.split('?')[0] || 'file';
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed", error);
      // Fallback to opening in a new tab if fetch fails
      window.open(fileUrl, '_blank'); 
    }
  };

  // --- FILTER & RENDER HELPERS ---
  const filteredMaterials = materials.filter(m => {
    const matchesFolder = activeFolder === "all" || m.folder_id === activeFolder || (activeFolder === "unassigned" && !m.folder_id);
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-8 h-8 text-red-500" />;
      case 'video': return <FileText className="w-8 h-8 text-red-600" />;
      case 'doc': return <FileText className="w-8 h-8 text-blue-500" />;
      case 'sheet': return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
      case 'image': return <ImageIcon className="w-8 h-8 text-amber-500" />;
      case 'link': return <LinkIcon className="w-8 h-8 text-purple-500" />;
      default: return <FileText className="w-8 h-8 text-slate-500" />;
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center w-full"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  return (
    <div className="w-full flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto h-full flex flex-col relative pb-24 space-y-6 overflow-x-hidden min-w-0">
      
      {/* ================= HEADER & QUICK ACTIONS ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm w-full">
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="truncate">Resource Vault</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm truncate">Organize, store, and share your teaching materials.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <button onClick={handleCreateFolder} className="flex-1 md:flex-none bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap">
            <FolderPlus className="w-4 h-4" /> New Folder
          </button>
          <button onClick={() => setIsUploadModalOpen(true)} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap">
            <UploadCloud className="w-4 h-4" /> Upload
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px] w-full min-w-0">
        
        {/* ================= LEFT SIDEBAR: FOLDER DIRECTORY ================= */}
        <div className="lg:w-72 shrink-0 flex flex-col gap-6 w-full lg:min-w-0">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sticky top-6">
            <h2 className="font-black text-slate-800 mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
              <Folder className="w-4 h-4 text-slate-400"/> My Directories
            </h2>
            
            <div className="space-y-2">
              <button 
                onClick={() => setActiveFolder("all")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeFolder === "all" ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Folder className={`w-4 h-4 shrink-0 ${activeFolder === "all" ? 'text-indigo-500 fill-indigo-100' : 'text-slate-400 fill-slate-100'}`} />
                  <span className="truncate">All Materials</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${activeFolder === "all" ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                  {materials.length}
                </span>
              </button>

              {folders.map(folder => {
                const count = materials.filter(m => m.folder_id === folder.id).length;
                return (
                  <button 
                    key={folder.id}
                    onClick={() => setActiveFolder(folder.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeFolder === folder.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Folder className={`w-4 h-4 shrink-0 ${activeFolder === folder.id ? 'text-indigo-500 fill-indigo-100' : 'text-slate-400 fill-slate-100'}`} />
                      <span className="truncate">{folder.name}</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${activeFolder === folder.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
              
              <button 
                onClick={() => setActiveFolder("unassigned")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeFolder === "unassigned" ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Folder className={`w-4 h-4 shrink-0 ${activeFolder === "unassigned" ? 'text-indigo-500 fill-indigo-100' : 'text-slate-400 fill-slate-100'}`} />
                  <span className="truncate">Uncategorized</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE: MATERIAL GRID ================= */}
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden w-full">
            
            {/* Search & Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0 w-full">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search materials by name..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-sm shadow-sm" 
                />
              </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 w-full">
              {filteredMaterials.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-black text-slate-700">No materials found</h3>
                  <p className="text-slate-500 text-sm font-medium mt-1">Upload a file or add a link to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
                  <AnimatePresence>
                    {filteredMaterials.map((material) => (
                      <motion.div 
                        layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                        key={material.id} 
                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col relative min-w-0"
                      >
                        
                        <div className="flex items-start gap-4 mb-4 min-w-0">
                          <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                            {getFileIcon(material.type)}
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <h3 className="font-black text-slate-800 text-base leading-tight mb-1 truncate" title={material.title}>{material.title}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 truncate"><Clock className="w-3 h-3 shrink-0"/> {new Date(material.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>

                        {/* Shared Status */}
                        <div className="mb-6 flex flex-wrap gap-1 min-w-0">
                          {material.shared_classes && material.shared_classes.length > 0 ? (
                            material.shared_classes.map((cls: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                                Assigned to {cls}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest whitespace-nowrap border border-slate-200">
                              Private File
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                          <span className="text-xs font-bold text-slate-400 truncate">{material.file_size}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            
                            {/* VIEW BUTTON (Always visible: opens in new tab) */}
                            <a href={material.file_url} target="_blank" rel="noopener noreferrer" title="View / Open Link" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                              <Eye className="w-4 h-4"/>
                            </a>

                            {/* DOWNLOAD BUTTON (Only for physical files, forces download) */}
                            {material.type !== 'link' && material.type !== 'video' && (
                              <button onClick={() => handleForceDownload(material.file_url, material.title)} title="Download File" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Download className="w-4 h-4"/>
                              </button>
                            )}

                            <button title="Share to Class" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Share2 className="w-4 h-4"/></button>
                            <button onClick={() => handleDeleteMaterial(material.id, material.file_url, material.type)} title="Delete" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
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

      {/* ================= UPLOAD MODAL ================= */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><UploadCloud className="w-5 h-5 text-indigo-600"/> Upload Material</h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
              </div>

              {/* Upload Type Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button type="button" onClick={() => setUploadType("file")} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${uploadType === "file" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Upload File</button>
                <button type="button" onClick={() => setUploadType("link")} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${uploadType === "link" ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Web Link</button>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Title / Name</label>
                  <input required type="text" placeholder="e.g. Algebra Chapter 4 Notes" value={uploadForm.title} onChange={e=>setUploadForm({...uploadForm, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 font-medium text-sm" />
                </div>

                {uploadType === "file" ? (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select File</label>
                    <div className="relative border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-indigo-50 transition-colors">
                      <input required type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <UploadCloud className="w-8 h-8 text-indigo-400 mb-2" />
                      <p className="text-sm font-black text-indigo-900 mb-1">{selectedFile ? selectedFile.name : "Click or Drag File Here"}</p>
                      <p className="text-[10px] font-bold text-indigo-500/70">PDF, DOC, XLS, Images (Max 10MB)</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">URL / Link</label>
                    <input required type="url" placeholder="https://..." value={uploadForm.linkUrl} onChange={e=>setUploadForm({...uploadForm, linkUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 font-medium text-sm" />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Save to Folder (Optional)</label>
                  <select value={uploadForm.folderId} onChange={e=>setUploadForm({...uploadForm, folderId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 appearance-none text-sm">
                    <option value="">-- No Folder (Uncategorized) --</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                <button type="submit" disabled={isUploading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4">
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                  {isUploading ? "Uploading..." : "Save Material"}
                </button>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}