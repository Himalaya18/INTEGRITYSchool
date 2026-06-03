// Path: app/admin/dashboard/documents/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/supabase"; 
import { 
  Folder, File, FileText, Image as ImageIcon, 
  Upload, FolderPlus, ChevronRight, Download, 
  Trash2, Home, Loader2, X, RefreshCw, Eye
} from "lucide-react";

export default function DocumentVault() {
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // --- NEW: IN-APP VIEWER STATE ---
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeFileUrl, setActiveFileUrl] = useState("");
  const [activeFileName, setActiveFileName] = useState("");

  const fetchStorage = async (pathArray: string[]) => {
    setIsLoading(true);
    const pathString = pathArray.length > 0 ? pathArray.join('/') : '';
    
    try {
      const { data, error } = await supabase.storage.from('vault').list(pathString, { limit: 100, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw error;

      setFiles(data?.filter(item => item.metadata !== null && item.name !== '.emptyFolderPlaceholder') || []);
      setFolders(data?.filter(item => item.metadata === null) || []);
    } catch (error) {
      console.error("Error loading vault:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStorage(currentPath); }, [currentPath]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    const path = `${currentPath.length > 0 ? currentPath.join('/') + '/' : ''}${newFolderName.trim()}/.emptyFolderPlaceholder`;
    try {
      await supabase.storage.from('vault').upload(path, new Blob([''], { type: 'text/plain' }));
      setNewFolderName(""); setIsNewFolderModalOpen(false); fetchStorage(currentPath); 
    } catch (err: any) { alert(err.message); } finally { setIsCreatingFolder(false); }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const path = `${currentPath.length > 0 ? currentPath.join('/') + '/' : ''}${file.name}`;
    try {
      await supabase.storage.from('vault').upload(path, file, { cacheControl: '3600', upsert: false });
      fetchStorage(currentPath);
    } catch (err: any) { alert(err.message); } finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDelete = async (fileName: string, isFolder = false) => {
    if (!confirm(`Delete ${fileName}?`)) return;
    const path = `${currentPath.length > 0 ? currentPath.join('/') + '/' : ''}${fileName}`;
    try {
      if (isFolder) {
        const { data: folderContents } = await supabase.storage.from('vault').list(path);
        if (folderContents) await supabase.storage.from('vault').remove(folderContents.map(f => `${path}/${f.name}`));
      } else {
        await supabase.storage.from('vault').remove([path]);
      }
      fetchStorage(currentPath);
    } catch (err: any) { alert(err.message); }
  };

  // --- NEW: THE IMMERSIVE OPENER ---
  const handleViewFile = (fileName: string) => {
    const path = `${currentPath.length > 0 ? currentPath.join('/') + '/' : ''}${fileName}`;
    const { data } = supabase.storage.from('vault').getPublicUrl(path);
    
    if (data?.publicUrl) {
      setActiveFileUrl(data.publicUrl);
      setActiveFileName(fileName);
      setIsViewerOpen(true);
    }
  };

  const navigateToBreadcrumb = (index: number) => setCurrentPath(index === -1 ? [] : currentPath.slice(0, index + 1));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 relative h-full flex flex-col">
      
      {/* 1. THE IMMERSIVE FILE VIEWER MODAL */}
      <AnimatePresence>
        {isViewerOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/90 backdrop-blur-xl">
            {/* Viewer Header */}
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-3 text-white">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold tracking-wide truncate max-w-[300px] sm:max-w-md">{activeFileName}</h3>
              </div>
              <div className="flex items-center gap-4">
                <a href={activeFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg">
                  <Download className="w-4 h-4" /> <span className="hidden sm:inline">Save Copy</span>
                </a>
                <button onClick={() => setIsViewerOpen(false)} className="bg-white/10 hover:bg-red-500 hover:text-white text-slate-300 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
            
            {/* Viewer Content Area */}
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="flex-1 p-4 sm:p-8 flex justify-center items-center overflow-hidden">
              <div className="w-full h-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col relative">
                {/* Using an iframe is the easiest native way to render PDFs, images, and text files. 
                  Word and Excel usually force a download, but PDFs and Images will look gorgeous here.
                */}
                <iframe 
                  src={`${activeFileUrl}#toolbar=0`} // #toolbar=0 hides the ugly browser PDF controls on some browsers
                  className="w-full h-full border-none"
                  title={activeFileName}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* 2. NEW FOLDER MODAL */}
      <AnimatePresence>
        {isNewFolderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800">Create Folder</h3>
                <button onClick={() => setIsNewFolderModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleCreateFolder}>
                <input type="text" autoFocus required placeholder="e.g. 2026 Resumes" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition mb-6" />
                <button type="submit" disabled={isCreatingFolder} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-70">
                  {isCreatingFolder ? <Loader2 className="w-5 h-5 animate-spin"/> : <FolderPlus className="w-5 h-5"/>}
                  {isCreatingFolder ? "Creating..." : "Create Folder"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Document Vault</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Secure storage for official school records.</p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-2">
          <button onClick={() => fetchStorage(currentPath)} className="bg-white border border-slate-200 text-slate-600 p-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm"><RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} /></button>
          <button onClick={() => setIsNewFolderModalOpen(true)} className="bg-white border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"><FolderPlus className="w-4 h-4" /> <span className="hidden sm:inline">New Folder</span></button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-70">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {isUploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="bg-slate-50/80 border-b border-slate-100 p-4 px-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap shrink-0">
          <button onClick={() => navigateToBreadcrumb(-1)} className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${currentPath.length === 0 ? "text-blue-700" : "text-slate-500 hover:text-slate-800"}`}><Home className="w-4 h-4" /> Vault Root</button>
          {currentPath.map((crumb, idx) => (
            <div key={idx} className="flex items-center"><ChevronRight className="w-4 h-4 text-slate-300 mx-2 shrink-0" /><button onClick={() => navigateToBreadcrumb(idx)} className={`text-sm font-bold transition-colors ${idx === currentPath.length - 1 ? "text-blue-700" : "text-slate-500 hover:text-slate-800"}`}>{crumb}</button></div>
          ))}
        </div>

        <div className="p-6 flex-1 bg-slate-50/30 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 h-full"><Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" /><p className="text-slate-500 font-bold">Syncing...</p></div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {folders.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Folders</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {folders.map((folder: any, idx) => (
                        <div key={idx} onClick={() => setCurrentPath([...currentPath, folder.name])} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex items-center justify-between">
                          <div className="flex items-center gap-3 overflow-hidden"><div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0"><Folder className="w-5 h-5 fill-current opacity-80" /></div><h4 className="font-bold text-slate-800 truncate">{folder.name}</h4></div>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(folder.name, true); }} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {files.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Files</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {files.map((file: any) => (
                        <div key={file.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all group">
                          <div className="flex items-start gap-4">
                            <FileIcon name={file.name} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-800 text-sm truncate" title={file.name}>{file.name}</h4>
                              <div className="flex items-center gap-2 mt-1"><span className="text-xs font-medium text-slate-500">{(file.metadata.size / 1024 / 1024).toFixed(2)} MB</span></div>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-medium text-slate-400">{new Date(file.created_at).toLocaleDateString()}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* NEW EYE ICON FOR IMMERSIVE VIEW */}
                              <button onClick={() => handleViewFile(file.name)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                              <a href={supabase.storage.from('vault').getPublicUrl(`${currentPath.length > 0 ? currentPath.join('/') + '/' : ''}${file.name}`).data.publicUrl} download className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download"><Download className="w-4 h-4" /></a>
                              <button onClick={() => handleDelete(file.name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {folders.length === 0 && files.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center"><div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4"><Folder className="w-8 h-8" /></div><h3 className="text-lg font-bold text-slate-700">Empty Location</h3><p className="text-slate-500 text-sm mt-1 max-w-sm">Use the tools above to add folders or upload documents.</p></div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext || '')) return <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>;
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>;
  if (['doc', 'docx'].includes(ext || '')) return <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>;
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) return <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center shrink-0"><ImageIcon className="w-5 h-5" /></div>;
  return <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center shrink-0"><File className="w-5 h-5" /></div>;
}