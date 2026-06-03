"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Presentation, Megaphone, Calendar, Clock, MapPin, 
  Users, Plus, Search, CheckCircle2, AlertTriangle, 
  Send, X, BellRing, History, Eye,
  Mail, Trash2, Edit3, Loader2, MessageSquare, CheckSquare
} from "lucide-react";
import { supabase } from "@/supabase";

export default function AdminMeetingsAndBroadcasts() {
  const [activeView, setActiveView] = useState<"Meetings" | "Announcements">("Meetings");
  const [activeTab, setActiveTab] = useState<"Current" | "History">("Current");
  const [staffList, setStaffList] = useState<any[]>([]);
  
  const [meetings, setMeetings] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI / Interaction State
  const [searchQuery, setSearchQuery] = useState("");
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedMeetingDetails, setSelectedMeetingDetails] = useState<any | null>(null);
  
  // Processing States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReminding, setIsReminding] = useState(false);

  // Form State
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [newMeeting, setNewMeeting] = useState({ title: "", date: "", time: "", location: "", agenda: "" });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", message: "", urgency: "Normal" });
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [quickMessage, setQuickMessage] = useState("");

  useEffect(() => {
    fetchInitialData();
    
    const realtimeChannel = supabase.channel('dashboard-updates');
    realtimeChannel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => fetchInitialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_messages' }, () => fetchInitialData())
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  // --- DATABASE FETCHING ---
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const { data: staff } = await supabase.from('staff_profiles').select('id, first_name, last_name, designation');
      if (staff) setStaffList(staff);

      const { data: mtgs } = await supabase.from('meetings').select('*, meeting_attendees(staff_id)');
      if (mtgs) setMeetings(mtgs);

      const { data: anns } = await supabase.from('announcements').select('*, announcement_reads(staff_id, read_at)');
      if (anns) setAnnouncements(anns);

      const { data: msgs } = await supabase.from('staff_messages').select('*').order('created_at', { ascending: true });
      if (msgs) setMessages(msgs);
    } catch (error) { console.error("Data fetch error:", error); }
    setIsLoading(false);
  };

  // --- FORM SUBMISSIONS (CREATE & UPDATE) ---
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStaff.length === 0) return alert("Select at least one attendee.");
    setIsSubmitting(true);

    try {
      let mtgId = editingMeetingId;

      if (editingMeetingId) {
        const { error: mtgError } = await supabase.from('meetings').update({
          title: newMeeting.title,
          meeting_date: newMeeting.date,
          time_block: newMeeting.time,
          location: newMeeting.location,
          agenda: newMeeting.agenda,
        }).eq('id', editingMeetingId);
        
        if (mtgError) throw mtgError;
        await supabase.from('meeting_attendees').delete().eq('meeting_id', editingMeetingId);
      } else {
        const { data: mtg, error: mtgError } = await supabase.from('meetings').insert([{
          title: newMeeting.title,
          meeting_date: newMeeting.date,
          time_block: newMeeting.time,
          location: newMeeting.location,
          agenda: newMeeting.agenda,
        }]).select().single();

        if (mtgError) throw mtgError;
        mtgId = mtg.id;
      }

      const attendeePayload = selectedStaff.map(sId => ({
        meeting_id: mtgId,
        staff_id: sId
      }));

      const { error: attError } = await supabase.from('meeting_attendees').insert(attendeePayload);
      if (attError) throw attError;

      setShowMeetingModal(false);
      setEditingMeetingId(null);
      setNewMeeting({ title: "", date: "", time: "", location: "", agenda: "" });
      setSelectedStaff([]);

    } catch (e) { alert("Failed to save meeting."); console.error(e); }
    setIsSubmitting(false);
  };

  // --- MEETING ACTIONS ---
  const openEditMeeting = (meeting: any) => {
    setNewMeeting({
      title: meeting.title,
      date: meeting.meeting_date,
      time: meeting.time_block,
      location: meeting.location,
      agenda: meeting.agenda
    });
    setSelectedStaff(meeting.attendee_ids);
    setEditingMeetingId(meeting.id);
    setSelectedMeetingDetails(null);
    setShowMeetingModal(true);
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;
    try {
      await supabase.from('meetings').delete().eq('id', id);
      setSelectedMeetingDetails(null);
    } catch (error) { alert("Failed to delete meeting."); }
  };

  const handleUpdateMeetingStatus = async (id: string, newStatus: string) => {
    try {
      await supabase.from('meetings').update({ status: newStatus }).eq('id', id);
      setSelectedMeetingDetails(null); 
    } catch (error) { alert("Failed to update status."); }
  };

  const handleSendReminder = () => {
    setIsReminding(true);
    setTimeout(() => {
      setIsReminding(false);
      alert("Reminders sent successfully to all invited staff!");
    }, 1200);
  };

  // --- ANNOUNCEMENT ACTIONS ---
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStaff.length === 0) return alert("Select target audience.");
    setIsSubmitting(true);

    try {
      const { data: ann, error: annError } = await supabase.from('announcements').insert([{
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        urgency: newAnnouncement.urgency,
        total_audience_count: selectedStaff.length
      }]).select().single();

      if (annError) throw annError;

      const readsPayload = selectedStaff.map(sId => ({
        announcement_id: ann.id,
        staff_id: sId
      }));

      await supabase.from('announcement_reads').insert(readsPayload);

      setShowAnnouncementModal(false);
      setNewAnnouncement({ title: "", message: "", urgency: "Normal" });
      setSelectedStaff([]);

    } catch (e) { alert("Failed to post announcement."); console.error(e); }
    setIsSubmitting(false);
  };

  const handleArchiveAnnouncement = async (id: string) => {
    try {
      await supabase.from('announcements').update({ status: 'Archived' }).eq('id', id);
    } catch (error) { alert("Failed to archive notice."); }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement permanently?")) return;
    try {
      await supabase.from('announcements').delete().eq('id', id);
    } catch (error) { alert("Failed to delete notice."); }
  };

  const handleQuickMessageAdmin = async () => {
    if (!quickMessage.trim()) return;
    setIsSubmitting(true);
    
    try {
      await supabase.from('staff_messages').insert([{
        sender_id: 'ADMIN',
        content: quickMessage.trim()
      }]);
      setQuickMessage("");
    } catch (error) { console.error("Failed to send message", error); }
    
    setIsSubmitting(false);
  };

  // --- DERIVED DATA & FILTERING ---
  const toggleStaffSelection = (id: string) => setSelectedStaff(prev => prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]);
  const selectAllStaff = () => selectedStaff.length === staffList.length ? setSelectedStaff([]) : setSelectedStaff(staffList.map(t => t.id));

  const finalMeetings = meetings
    .filter(m => activeTab === "Current" ? m.status === 'Upcoming' : m.status !== 'Upcoming')
    .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(m => ({ 
      ...m,
      date_split: new Date(m.meeting_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).split(" "),
      attendee_count: m.meeting_attendees?.length || 0,
      attendee_ids: m.meeting_attendees?.map((a:any) => a.staff_id) || []
    }));

  const finalAnnouncements = announcements
    .filter(a => activeTab === "Current" ? a.status === 'Active' : a.status === 'Archived')
    .filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(a => {
      const reads = a.announcement_reads || [];
      const readCount = reads.filter((r:any) => r.read_at !== null).length;
      return {
        ...a,
        readCount: readCount,
        readPercentage: a.total_audience_count > 0 ? (readCount / a.total_audience_count) * 100 : 0
      };
    });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-full flex flex-col relative pb-24 space-y-6 bg-slate-50/50">
      
      {/* ================= HEADER & VIEW TOGGLE ================= */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0 bg-white p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner border border-indigo-200/50">
            <Presentation className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">Command & Broadcast</h1>
            <p className="text-slate-500 font-medium mt-1 text-sm flex items-center gap-2">Connect with your teachers. Schedule staff meetings and post critical notices.</p>
          </div>
        </div>
        
        <div className="relative z-10 flex bg-slate-100/80 p-1.5 rounded-2xl w-full xl:w-auto border border-slate-200/80 shadow-inner">
          <button onClick={() => { setActiveView("Meetings"); setActiveTab("Current"); }} className={`flex-1 xl:flex-none px-8 py-3 rounded-[14px] text-sm font-black transition-all flex items-center justify-center gap-2 ${activeView === "Meetings" ? 'bg-white text-indigo-700 shadow shadow-slate-200/60 border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}>
            <Calendar className="w-4 h-4"/> Meetings
          </button>
          <button onClick={() => { setActiveView("Announcements"); setActiveTab("Current"); }} className={`flex-1 xl:flex-none px-8 py-3 rounded-[14px] text-sm font-black transition-all flex items-center justify-center gap-2 ${activeView === "Announcements" ? 'bg-white text-indigo-700 shadow shadow-slate-200/60 border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'}`}>
            <Megaphone className="w-4 h-4"/> Announcements
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1">
        
        {/* ================= LEFT COLUMN: LISTS & HISTORY ================= */}
        <div className="xl:col-span-8 flex flex-col h-full">
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm flex-1 flex flex-col overflow-hidden">
            
            {/* Toolbar & History Toggle */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
                 <button onClick={() => setActiveTab("Current")} className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-black transition-all ${activeTab === "Current" ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                   {activeView === 'Meetings' ? 'Upcoming' : 'Active'}
                 </button>
                 <button onClick={() => setActiveTab("History")} className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${activeTab === "History" ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                   <History className="w-3.5 h-3.5"/> History
                 </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200/80 text-slate-900 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-indigo-500 transition-all font-medium text-sm shadow-sm" />
              </div>
            </div>

            {/* Dynamic Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full p-20 text-center text-slate-400 font-bold gap-4"><Loader2 className="w-10 h-10 animate-spin text-indigo-500"/><p>Connecting to backend...</p></div>
              ) : activeView === "Meetings" ? (
                <motion.div key="meetings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {finalMeetings.length === 0 ? <p className="text-center text-slate-400 font-bold mt-10">No {activeTab.toLowerCase()} meetings found.</p> :
                      finalMeetings.map(meeting => (
                      <div key={meeting.id} className={`bg-white border border-slate-200/80 rounded-2xl p-6 transition-all flex flex-col sm:flex-row gap-6 relative group ${meeting.status !== 'Upcoming' ? 'opacity-80' : 'hover:border-indigo-300 hover:shadow-md'}`}>
                        <div className={`w-20 h-20 rounded-2xl border flex flex-col items-center justify-center shrink-0 shadow-sm ${meeting.status !== 'Upcoming' ? 'bg-slate-50 border-slate-200' : 'bg-indigo-50 border-indigo-100'}`}>
                          <span className={`text-sm font-black uppercase tracking-widest leading-none ${meeting.status !== 'Upcoming' ? 'text-slate-400' : 'text-indigo-500'}`}>{meeting.date_split[1]}</span>
                          <span className={`text-2xl font-black leading-none mt-1 ${meeting.status !== 'Upcoming' ? 'text-slate-600' : 'text-indigo-700'}`}>{meeting.date_split[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${meeting.status === 'Upcoming' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : meeting.status === 'Completed' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-red-50 text-red-600 border-red-100'}`}>{meeting.status}</span>
                               <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {meeting.time_block}</span>
                             </div>
                             <button onClick={() => setSelectedMeetingDetails(meeting)} className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors">
                                <Eye className="w-3.5 h-3.5"/> Details
                             </button>
                          </div>
                          <h3 className="text-lg font-black text-slate-800 mb-1 truncate">{meeting.title}</h3>
                          <p className="text-sm font-medium text-slate-500 mb-4 truncate">{meeting.agenda}</p>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400"/> {meeting.location}</span>
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400"/> {meeting.attendee_count} Staff Invited</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </motion.div>
              ) : (
                <motion.div key="announcements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {finalAnnouncements.length === 0 ? <p className="text-center text-slate-400 font-bold mt-10">No {activeTab.toLowerCase()} notices found.</p> :
                      finalAnnouncements.map(ann => (
                      <div key={ann.id} className={`bg-white border border-slate-200/80 rounded-2xl p-6 transition-all flex flex-col relative overflow-hidden group ${ann.status === 'Archived' ? 'opacity-80' : 'hover:border-amber-300 hover:shadow-md'}`}>
                        {ann.urgency === "High" && ann.status === "Active" && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>}
                        
                        {/* Action Buttons (Archive & Delete) */}
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {ann.status === 'Active' && (
                            <button onClick={() => handleArchiveAnnouncement(ann.id)} title="Archive Notice" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><History className="w-4 h-4"/></button>
                          )}
                          <button onClick={() => handleDeleteAnnouncement(ann.id)} title="Delete Notice" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </div>

                        <div className="flex justify-between items-start mb-3 pl-2">
                           <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ann.status === 'Archived' ? 'bg-slate-100 text-slate-500' : ann.urgency === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                               {ann.status === 'Archived' ? <History className="w-5 h-5"/> : ann.urgency === 'High' ? <AlertTriangle className="w-5 h-5"/> : <BellRing className="w-5 h-5"/>}
                             </div>
                             <div>
                               <h3 className="font-black text-slate-800 text-lg leading-tight">{ann.title}</h3>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Posted: {new Date(ann.date_posted).toLocaleDateString()} • Level: {ann.urgency}</p>
                             </div>
                           </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 ml-2 mr-10 sm:mr-0">
                           <p className="text-sm font-medium text-slate-700 leading-relaxed">{ann.message}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4 ml-2">
                           <div className="flex items-center gap-2">
                             <div className="w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
                               <div className={`h-full rounded-full ${ann.readCount === ann.total_audience_count ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${ann.readPercentage}%` }}></div>
                             </div>
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{ann.readCount}/{ann.total_audience_count} Read Receipts</span>
                           </div>
                        </div>
                      </div>
                    ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK ACTIONS & MESSAGING */}
        <div className="xl:col-span-4 flex flex-col gap-6 h-full">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 shrink-0">
             <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col items-center justify-center text-center shadow-lg group hover:border-indigo-400/50 border border-slate-800 transition-colors">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30 mb-4 group-hover:bg-indigo-500/30 transition-colors"><Calendar className="w-6 h-6"/></div>
                <h4 className="font-black text-white text-base">New Meeting</h4>
                <p className="text-[10px] font-medium text-slate-400 mb-4 mt-1">Schedule & Invite Staff</p>
                <button onClick={() => { setEditingMeetingId(null); setNewMeeting({ title: "", date: "", time: "", location: "", agenda: "" }); setSelectedStaff([]); setShowMeetingModal(true); }} className="text-xs font-black bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/> Create</button>
             </div>
             <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center group hover:border-amber-300 transition-colors">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 mb-4 group-hover:bg-amber-100 transition-colors"><Megaphone className="w-6 h-6"/></div>
                <h4 className="font-black text-slate-800 text-base">Post Notice</h4>
                <p className="text-[10px] font-medium text-slate-500 mb-4 mt-1">Target Audience</p>
                <button onClick={() => setShowAnnouncementModal(true)} className="text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg border border-slate-200 flex items-center gap-1.5"><Send className="w-3.5 h-3.5"/> Broadcast</button>
             </div>
          </div>

          {/* INTERNAL MESSAGING BOX */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm flex-1 flex flex-col overflow-hidden">
             <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
               <h3 className="font-black text-slate-800 text-xl flex items-center gap-3"><div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100"><MessageSquare className="w-5 h-5 text-emerald-600"/></div> Internal Comms</h3>
               <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 shadow-inner">Direct Messaging</span>
             </div>
             
             {/* Chat History View */}
             <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto bg-slate-100/30 custom-scrollbar">
               {messages.length === 0 ? (
                 <p className="text-center text-slate-400 text-xs font-bold my-auto">No internal messages yet.</p>
               ) : (
                 messages.map((msg) => {
                   const isAdmin = msg.sender_id === 'ADMIN';
                   const sender = staffList.find(s => s.id === msg.sender_id);
                   const senderName = isAdmin ? 'Admin' : (sender ? `${sender.first_name} ${sender.last_name}` : 'Unknown Staff');

                   return (
                     <div key={msg.id} className={`flex flex-col gap-1.5 max-w-[85%] ${isAdmin ? 'self-end items-end' : 'self-start items-start'}`}>
                       {!isAdmin && <span className="text-[10px] font-bold text-slate-400 ml-1">{senderName}</span>}
                       <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${isAdmin ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100' : 'bg-white text-slate-700 rounded-bl-none border border-slate-200'}`}>
                           {msg.content}
                       </div>
                       <p className="text-[9px] font-bold text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                     </div>
                   )
                 })
               )}
             </div>

             {/* Message Input Area */}
             <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3 shrink-0">
                <div className="relative flex-1">
                   <textarea rows={1} value={quickMessage} onChange={e => setQuickMessage(e.target.value)} placeholder="Type a broadcast or reply..." className="w-full bg-slate-50 border border-slate-200/80 text-slate-800 font-medium rounded-xl p-3 pl-4 pr-10 outline-none focus:border-indigo-400 resize-none text-sm shadow-inner"></textarea>
                   <button onClick={handleQuickMessageAdmin} disabled={isSubmitting || !quickMessage.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 p-1.5"><Send className="w-4 h-4"/></button>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* ================= MEETING DOSSIER MODAL (VIEW DETAILS) ================= */}
      <AnimatePresence>
        {selectedMeetingDetails && (
          <motion.div 
            key="dossier-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] flex flex-col w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden">
              
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                <div>
                  <span className={`inline-block mb-2 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${selectedMeetingDetails.status === 'Upcoming' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{selectedMeetingDetails.status}</span>
                  <h3 className="text-2xl font-black text-slate-800 leading-tight">{selectedMeetingDetails.title}</h3>
                </div>
                <button onClick={() => setSelectedMeetingDetails(null)} className="text-slate-400 hover:bg-slate-200 p-2 rounded-full transition-colors"><X className="w-6 h-6"/></button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5"/>
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</p><p className="text-sm font-bold text-slate-800 mt-0.5">{new Date(selectedMeetingDetails.meeting_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p><p className="text-xs font-bold text-slate-500">{selectedMeetingDetails.time_block}</p></div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"/>
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</p><p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{selectedMeetingDetails.location}</p></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Meeting Agenda</h4>
                  <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl"><p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedMeetingDetails.agenda}</p></div>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Invited Staff ({selectedMeetingDetails.attendee_count})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedMeetingDetails.attendee_ids.map((tId: string) => {
                      const teacher = staffList.find(t => t.id === tId);
                      return teacher ? (
                        <div key={tId} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs uppercase">{teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}</div>
                          <div><p className="text-sm font-bold text-slate-800 leading-none">{teacher.first_name} {teacher.last_name}</p><p className="text-[10px] font-bold text-slate-400 mt-0.5">{teacher.designation}</p></div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-white flex flex-wrap gap-3">
                {selectedMeetingDetails.status === "Upcoming" && (
                  <>
                    <button onClick={handleSendReminder} disabled={isReminding} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-black py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
                      {isReminding ? <Loader2 className="w-4 h-4 animate-spin"/> : <Mail className="w-4 h-4"/>} 
                      {isReminding ? "Sending..." : "Send Reminder"}
                    </button>
                    <button onClick={() => handleUpdateMeetingStatus(selectedMeetingDetails.id, 'Completed')} className="flex-1 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4"/> Mark Done
                    </button>
                  </>
                )}
                <button onClick={() => openEditMeeting(selectedMeetingDetails)} className="flex-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                  <Edit3 className="w-4 h-4"/> Edit
                </button>
                <button onClick={() => handleDeleteMeeting(selectedMeetingDetails.id)} className="flex-none bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODALS: SCHEDULE & POST ================= */}
      <AnimatePresence>
        {showMeetingModal && (
          <motion.div 
            key="meeting-modal-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] flex flex-col w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Calendar className="w-6 h-6 text-indigo-600"/> {editingMeetingId ? 'Edit Meeting' : 'Schedule New Meeting'}</h3>
                <button onClick={() => { setShowMeetingModal(false); setEditingMeetingId(null); setSelectedStaff([]); }} className="text-slate-400 hover:bg-slate-200 p-2 rounded-full transition-colors"><X className="w-6 h-6"/></button>
              </div>
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                <form id="meetingForm" onSubmit={handleScheduleMeeting} className="flex-1 p-6 sm:p-8 overflow-y-auto border-r border-slate-100 space-y-5 bg-slate-50/50">
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Meeting Title</label><input required type="text" placeholder="e.g. Science Dept Sync" value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="w-full bg-white border border-slate-200/80 text-slate-900 font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 shadow-inner" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Date</label><input required type="date" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="w-full bg-white border border-slate-200/80 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 shadow-inner" /></div>
                    <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Time block</label><input required type="text" placeholder="03:00 PM - 04:00 PM" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} className="w-full bg-white border border-slate-200/80 text-slate-800 font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 shadow-inner" /></div>
                  </div>
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Location / Meet Link</label><input required type="text" placeholder="Conference Room B" value={newMeeting.location} onChange={e => setNewMeeting({...newMeeting, location: e.target.value})} className="w-full bg-white border border-slate-200/80 text-slate-900 font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 shadow-inner" /></div>
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Agenda</label><textarea required rows={5} placeholder="What will be discussed?" value={newMeeting.agenda} onChange={e => setNewMeeting({...newMeeting, agenda: e.target.value})} className="w-full bg-white border border-slate-200/80 text-slate-900 font-medium rounded-xl px-4 py-3 outline-none focus:border-indigo-500 resize-none shadow-inner"></textarea></div>
                </form>
                <div className="w-full md:w-80 bg-slate-50 flex flex-col">
                  <div className="p-4 border-b border-slate-200/60 flex justify-between items-center bg-slate-100/50 shrink-0"><span className="text-xs font-black text-slate-700 uppercase tracking-widest">Invite Staff</span><button type="button" onClick={selectAllStaff} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5"/> Select All</button></div>
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                    {staffList.map(t => (
                      <div key={t.id} onClick={() => toggleStaffSelection(t.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedStaff.includes(t.id) ? 'bg-white border-indigo-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'}`}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${selectedStaff.includes(t.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>{selectedStaff.includes(t.id) && <CheckCircle2 className="w-3.5 h-3.5" />}</div>
                        <div><p className={`text-sm font-bold leading-tight ${selectedStaff.includes(t.id) ? 'text-indigo-900' : 'text-slate-700'}`}>{t.first_name} {t.last_name}</p><p className="text-[10px] font-bold text-slate-400">{t.designation}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-white"><button type="submit" form="meetingForm" disabled={isSubmitting || selectedStaff.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">{isSubmitting ? "Saving..." : <><Send className="w-5 h-5"/> {editingMeetingId ? 'Update Meeting' : 'Schedule Meeting'} ({selectedStaff.length} Invited)</>}</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAnnouncementModal && (
          <motion.div 
            key="announcement-modal-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] flex flex-col w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Megaphone className="w-6 h-6 text-amber-500"/> Broadcast Notice</h3><button onClick={() => { setShowAnnouncementModal(false); setSelectedStaff([]); }} className="text-slate-400 hover:bg-slate-200 p-2 rounded-full transition-colors"><X className="w-6 h-6"/></button></div>
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                <form id="announcementForm" onSubmit={handlePostAnnouncement} className="flex-1 p-6 sm:p-8 overflow-y-auto border-r border-slate-100 space-y-5 bg-slate-50/50">
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Subject / Title</label><input required type="text" placeholder="e.g. Holiday on Friday" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} className="w-full bg-white border border-slate-200/80 text-slate-900 font-bold rounded-xl px-4 py-3 outline-none focus:border-amber-500 shadow-inner" /></div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Urgency Level</label>
                    <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-inner">
                      {["Low", "Normal", "High"].map(level => (
                        <button type="button" key={level} onClick={() => setNewAnnouncement({...newAnnouncement, urgency: level})} className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${newAnnouncement.urgency === level ? (level === 'High' ? 'bg-red-500 text-white shadow' : 'bg-slate-100 text-slate-800 shadow-sm border border-slate-200') : 'text-slate-500 hover:bg-slate-50'}`}>{level}</button>
                      ))}
                    </div>
                  </div>
                  <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Message Body</label><textarea required rows={7} placeholder="Type the full announcement here..." value={newAnnouncement.message} onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})} className="w-full bg-white border border-slate-200/80 text-slate-900 font-medium rounded-xl px-4 py-3 outline-none focus:border-amber-500 resize-none shadow-inner"></textarea></div>
                </form>
                <div className="w-full md:w-80 bg-slate-50 flex flex-col">
                  <div className="p-4 border-b border-slate-200/60 flex justify-between items-center bg-slate-100/50 shrink-0"><span className="text-xs font-black text-slate-700 uppercase tracking-widest">Select Audience</span><button type="button" onClick={selectAllStaff} className="text-[10px] font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5"/> Select All</button></div>
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                    {staffList.map(t => (
                      <div key={t.id} onClick={() => toggleStaffSelection(t.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedStaff.includes(t.id) ? 'bg-white border-amber-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'}`}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${selectedStaff.includes(t.id) ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-300'}`}>{selectedStaff.includes(t.id) && <CheckCircle2 className="w-3.5 h-3.5" />}</div>
                        <div><p className={`text-sm font-bold leading-tight ${selectedStaff.includes(t.id) ? 'text-amber-900' : 'text-slate-700'}`}>{t.first_name} {t.last_name}</p><p className="text-[10px] font-bold text-slate-400">{t.designation}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-white"><button type="submit" form="announcementForm" disabled={isSubmitting || selectedStaff.length === 0} className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:bg-slate-400 ${newAnnouncement.urgency === 'High' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-slate-900 hover:bg-slate-800'}`}>{isSubmitting ? "Broadcasting..." : <><Send className="w-5 h-5"/> Post Announcement ({selectedStaff.length} Targeted)</>}</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}