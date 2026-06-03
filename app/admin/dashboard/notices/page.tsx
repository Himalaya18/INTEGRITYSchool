"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, Plus, Globe, AlertTriangle, 
  Send, Trash2, Edit2, CheckCircle2, 
  Clock, X, Tv2, RadioTower, Save, Pin
} from "lucide-react";
import { supabase } from "@/supabase";

export default function DigitalWallManager() {
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("All Posts");
  const [isLoading, setIsLoading] = useState(true);
  
  // --- TICKER STATE ---
  const [tickerText, setTickerText] = useState("");
  const [isTickerLive, setIsTickerLive] = useState(true);
  const [isUpdatingTicker, setIsUpdatingTicker] = useState(false);

  // --- MODAL & FORM STATE ---
  const [isPublisherOpen, setIsPublisherOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"Create" | "Edit">("Create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [postForm, setPostForm] = useState({ 
    title: "", 
    category: "Notice", 
    content: "", 
    status: "Live", 
    image_url: "",
    is_pinned: false
  });

  useEffect(() => {
    fetchPosts();
    fetchTickerSettings();
  }, []);

  // ==========================================
  // DATABASE FETCHING
  // ==========================================
  const fetchPosts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('digital_wall_posts')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setPosts(data);
    if (error) console.error("Error fetching posts:", error);
    setIsLoading(false);
  };

  const fetchTickerSettings = async () => {
    const { data, error } = await supabase.from('site_settings').select('*');
    if (data) {
      const textSetting = data.find(d => d.setting_key === 'ticker_text');
      const activeSetting = data.find(d => d.setting_key === 'ticker_active');
      if (textSetting) setTickerText(textSetting.setting_value);
      if (activeSetting) setIsTickerLive(activeSetting.setting_value === 'true');
    }
    if (error) console.error("Error fetching ticker:", error);
  };

  // ==========================================
  // TICKER CONTROLS
  // ==========================================
  const handleUpdateTicker = async () => {
    setIsUpdatingTicker(true);
    try {
      await supabase.from('site_settings').upsert([
        { setting_key: 'ticker_text', setting_value: tickerText },
        { setting_key: 'ticker_active', setting_value: isTickerLive.toString() }
      ]);
      alert("Live Ticker Updated Successfully!");
    } catch (error) {
      console.error("Failed to update ticker:", error);
      alert("Failed to update ticker.");
    } finally {
      setIsUpdatingTicker(false);
    }
  };

  // ==========================================
  // POST CONTROLS
  // ==========================================
  const openCreateModal = () => {
    setModalMode("Create");
    setEditingId(null);
    setPostForm({ title: "", category: "Notice", content: "", status: "Live", image_url: "", is_pinned: false });
    setIsPublisherOpen(true);
  };

  const openEditModal = (post: any) => {
    setModalMode("Edit");
    setEditingId(post.id);
    setPostForm({ 
      title: post.title, 
      category: post.category, 
      content: post.content, 
      status: post.status, 
      image_url: post.image_url || "",
      is_pinned: post.is_pinned || false
    });
    setIsPublisherOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title.trim() || !postForm.content.trim()) return;
    
    setIsSaving(true);
    try {
      if (modalMode === "Create") {
        await supabase.from('digital_wall_posts').insert([postForm]);
      } else {
        await supabase.from('digital_wall_posts').update(postForm).eq('id', editingId);
      }
      setIsPublisherOpen(false);
      fetchPosts(); 
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save post.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(confirm("Are you sure you want to permanently delete this announcement?")) {
      await supabase.from('digital_wall_posts').delete().eq('id', id);
      fetchPosts();
    }
  };

  const filteredPosts = activeTab === "All Posts" ? posts : posts.filter(p => p.status === activeTab);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 h-full flex flex-col relative pb-24 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Tv2 className="w-8 h-8 text-blue-600" /> Digital Wall Management
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm flex items-center gap-2">
            <RadioTower className="w-4 h-4 text-emerald-500 animate-pulse" /> Post, edit, and control website announcements.
          </p>
        </div>
        
        <button onClick={openCreateModal} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> Create New Post
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 flex-1">
        
        {/* ================= LEFT PANE: POST FEED ================= */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-2 flex justify-between items-center">
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {(["All Posts", "Live", "Draft"].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  {tab}
                </button>
              )))}
            </div>
            <div className="hidden sm:flex items-center gap-4 px-4 text-sm font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-blue-500"/> Managing Public Feed</span>
            </div>
          </div>

          {isLoading ? (
             <div className="flex justify-center p-12">
               <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredPosts.map((post) => (
                  <motion.div 
                    key={post.id} 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }} 
                    className={`bg-white border ${post.is_pinned ? 'border-amber-400 shadow-amber-100' : 'border-slate-200'} rounded-[2rem] shadow-sm hover:border-blue-300 transition-all overflow-hidden flex flex-col group`}
                  >
                    
                    {/* Image Area */}
                    {post.image_url ? (
                      <div className="h-32 relative overflow-hidden bg-slate-100">
                        <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md border shadow-sm ${post.status === 'Live' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-slate-800/90 text-white border-slate-600'}`}>
                            {post.status}
                          </span>
                          {post.is_pinned && (
                            <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md border shadow-sm bg-amber-400 text-amber-900 border-amber-300 flex items-center gap-1">
                              <Pin size={10} className="fill-amber-900"/> Pinned
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-16 bg-slate-50 border-b border-slate-100 relative flex items-center px-4 gap-2">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${post.status === 'Live' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                          {post.status}
                        </span>
                        {post.is_pinned && (
                          <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1 border shadow-sm">
                            <Pin size={10} className="fill-amber-700"/> Pinned
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-black text-slate-800 text-lg leading-tight line-clamp-2 mb-2">{post.title}</h3>
                      <p className="text-sm font-medium text-slate-500 line-clamp-2 mb-4">{post.content}</p>
                      
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">{post.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                          <Clock className="w-3.5 h-3.5"/> {new Date(post.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      {/* Control Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => openEditModal(post)} className="bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => handleDelete(post.id)} className="bg-slate-50 border border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ================= RIGHT PANE: TICKER CONTROLLER ================= */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full blur-2xl"></div>
            
            <div className="relative z-10 flex justify-between items-center mb-6">
                <h3 className="font-black text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Ticker Control</h3>
                <button 
                  onClick={() => setIsTickerLive(!isTickerLive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTickerLive ? 'bg-red-500' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTickerLive ? 'translate-x-6' : 'translate-x-1'}`}/>
                </button>
            </div>

            <div className="relative z-10">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Public Scrolling Marquee</label>
              <textarea 
                rows={4} 
                value={tickerText} 
                onChange={(e) => setTickerText(e.target.value)} 
                placeholder="Write the alert text here..."
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 outline-none focus:border-red-500 text-sm font-medium resize-none mb-3 placeholder:text-slate-600" 
              />
              <button 
                onClick={handleUpdateTicker}
                disabled={isUpdatingTicker}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4"/> {isUpdatingTicker ? "Updating..." : "Update Live Ticker"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SLIDE-OVER PUBLISHER MODAL ================= */}
      <AnimatePresence>
        {isPublisherOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPublisherOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col border-l border-slate-200">
              
              <div className="h-20 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    {modalMode === "Create" ? <Megaphone className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                  </div>
                  <h3 className="text-xl font-black text-slate-800">{modalMode === "Create" ? "Create Post" : "Edit Post"}</h3>
                </div>
                <button onClick={() => setIsPublisherOpen(false)} className="bg-white hover:bg-slate-100 text-slate-500 p-2 rounded-full transition-colors border border-slate-200 shadow-sm"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={handleSavePost} className="flex-1 overflow-y-auto flex flex-col justify-between">
                <div className="p-6 space-y-6">
                  
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Post Title</label>
                    <input required autoFocus type="text" value={postForm.title} onChange={e=>setPostForm({...postForm, title: e.target.value})} placeholder="e.g. Exam Schedule Released" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 outline-none focus:border-blue-500 text-sm font-bold" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                      <select value={postForm.category} onChange={e=>setPostForm({...postForm, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 outline-none focus:border-blue-500 text-sm font-bold appearance-none">
                        <option value="Notice">Notice</option>
                        <option value="Event">Event</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Academics">Academics</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Visibility Status</label>
                      <select value={postForm.status} onChange={e=>setPostForm({...postForm, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 outline-none focus:border-blue-500 text-sm font-bold appearance-none">
                        <option value="Live">Live (Public)</option>
                        <option value="Draft">Draft (Hidden)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <input type="checkbox" id="pinToggle" checked={postForm.is_pinned} onChange={e=>setPostForm({...postForm, is_pinned: e.target.checked})} className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500" />
                    <label htmlFor="pinToggle" className="text-sm font-bold text-amber-900 cursor-pointer flex items-center gap-2">
                      <Pin size={16} className="fill-amber-900"/> Pin to top of Notice Board
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Post Content</label>
                    <textarea required rows={5} value={postForm.content} onChange={e=>setPostForm({...postForm, content: e.target.value})} placeholder="Write your announcement details here..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 outline-none focus:border-blue-500 text-sm resize-none leading-relaxed"></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Image URL (Optional)</label>
                    <input type="url" value={postForm.image_url} onChange={e=>setPostForm({...postForm, image_url: e.target.value})} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 outline-none focus:border-blue-500 text-sm font-medium" />
                  </div>

                </div>
                
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
                  <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                    {modalMode === "Create" ? <Send className="w-4 h-4"/> : <Save className="w-4 h-4"/>} 
                    {isSaving ? "Processing..." : modalMode === "Create" ? "Publish Post" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}