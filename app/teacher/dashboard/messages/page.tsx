"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/supabase";
import { 
  MessageSquare, Send, Users, Smartphone, 
  Search, CheckSquare, Square, CheckCircle2, 
  AlertTriangle, Loader2, Sparkles, BookOpen, 
  Megaphone, ExternalLink, RefreshCw,PenTool
} from "lucide-react";

const TEMPLATES = [
  { id: "general", label: "General Announcement", icon: <Megaphone className="w-4 h-4"/>, text: "Dear Parent, this is a quick update regarding {student_name}'s class. [Type your message here]. Regards, Class Teacher" },
  { id: "attendance", label: "Absence Alert", icon: <AlertTriangle className="w-4 h-4"/>, text: "Dear Parent, {student_name} was marked absent today ({date}). Please ensure they catch up on missed work or provide a leave note. Thank you." },
  { id: "performance", label: "Good Performance", icon: <Sparkles className="w-4 h-4"/>, text: "Hello! I wanted to share that {student_name} did exceptionally well in class today. Keep encouraging them! Regards, Class Teacher" },
  { id: "reminder", label: "Fee/Form Reminder", icon: <BookOpen className="w-4 h-4"/>, text: "Dear Parent, this is a gentle reminder regarding a pending submission/fee for {student_name}. Kindly do the needful by tomorrow." },
];

export default function BroadcastMessenger() {
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  
  // UI Selection States
  const [activeClassId, setActiveClassId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  
  // Messaging States
  const [messageBody, setMessageBody] = useState("");
  const [dispatchQueue, setDispatchQueue] = useState<any[]>([]);

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
      
      let userQuery = supabase.from('users').select('*');
      if (session?.user?.email) userQuery = userQuery.eq('email', session.user.email);
      else userQuery = userQuery.eq('role', 'teacher').not('emp_id', 'is', null).limit(1);
      
      const { data: userData, error: userError } = await userQuery.single();
      
      if (userError) console.error("User fetch error:", userError);
      
      if (userData?.emp_id) {
        activeEmpId = userData.emp_id;
        setCurrentUser({ id: activeEmpId, name: userData.name });
        await fetchAssignments(activeEmpId);
      }
    } catch (err) {
      console.error("Initialization error:", err);
    }
  };

  const fetchAssignments = async (empId: string) => {
    try {
      const { data: assignments, error } = await supabase.from('class_assignments').select('*').eq('teacher_id', empId);
      
      if (error) {
        console.error("Assignments Error:", error);
        alert("Database Error fetching assignments: " + error.message);
      }

      if (assignments && assignments.length > 0) {
        const mapped = assignments.map(a => ({
          id: `${a.class_name}-${a.section}`,
          class_name: a.class_name,
          section: a.section,
          displayName: `${a.class_name}-${a.section}`
        }));
        
        // Remove duplicates if teacher teaches multiple subjects to same class
        const uniqueClasses = Array.from(new Map(mapped.map(item => [item.id, item])).values());
        
        setAssignedClasses(uniqueClasses);
        setActiveClassId(uniqueClasses[0].id);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  // Fetch Students when class changes
  useEffect(() => {
    if (activeClassId) fetchRoster();
  }, [activeClassId]);

  const fetchRoster = async () => {
    setIsLoading(true);
    const classInfo = assignedClasses.find(c => c.id === activeClassId);
    if (!classInfo) {
      setIsLoading(false);
      return;
    }

    // Safely select * to pull the father_phone column
    const { data: studentsData, error } = await supabase
      .from('students')
      .select('*')
      .eq('current_class', classInfo.class_name)
      .eq('current_section', classInfo.section)
      .eq('status', 'Active')
      .order('roll_number', { ascending: true });

    if (error) {
      console.error("Roster Fetch Error:", error);
      alert("Error fetching students: " + error.message);
    }

    setClassStudents(studentsData || []);
    setSelectedStudents(new Set()); // Reset selections
    setDispatchQueue([]); // Clear previous queue
    setIsLoading(false);
  };

  // --- SELECTION LOGIC ---
  const filteredStudents = classStudents.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.roll_number && s.roll_number.toString().includes(searchQuery))
  );

  const toggleStudent = (id: string) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudents(newSet);
  };

  const toggleAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  // --- MESSAGE GENERATION ---
  const applyTemplate = (text: string) => {
    setMessageBody(text);
  };

  const generateQueue = () => {
    if (selectedStudents.size === 0 || !messageBody.trim()) {
      alert("Please select at least one student and enter a message.");
      return;
    }

    const today = new Date().toLocaleDateString('en-GB');
    
    const queue = Array.from(selectedStudents).map(studentId => {
      const student = classStudents.find(s => s.id === studentId);
      if (!student) return null;

      // Replace dynamic variables
      let personalizedMsg = messageBody
        .replace(/{student_name}/g, student.first_name || "Student")
        .replace(/{date}/g, today);

      return {
        studentId: student.id,
        name: `${student.first_name} ${student.last_name}`,
        phone: student.father_phone, // Switched to use father_phone
        message: personalizedMsg,
        sent: false
      };
    }).filter(Boolean);

    setDispatchQueue(queue);
  };

  const sendWhatsApp = (index: number) => {
    const item = dispatchQueue[index];
    if (!item.phone) {
      alert(`No phone number available for ${item.name}'s parent. Please update their profile in the database.`);
      return;
    }

    // Clean phone number (remove spaces, +, etc)
    const cleanPhone = item.phone.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(item.message);
    
    // Create wa.me link
    const waLink = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    // Open in new tab
    window.open(waLink, '_blank');

    // Mark as sent in UI
    const newQueue = [...dispatchQueue];
    newQueue[index].sent = true;
    setDispatchQueue(newQueue);
  };

  if (isLoading && assignedClasses.length === 0) return <div className="flex h-screen items-center justify-center w-full"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto h-full flex flex-col relative pb-24 space-y-6 min-w-0">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm w-full min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="truncate">Broadcast Messenger</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm flex items-center gap-2 truncate">Communicate with parents instantly via WhatsApp.</p>
        </div>
        
        <div className="flex bg-slate-50 border border-slate-200 p-1.5 rounded-2xl w-full md:w-auto shrink-0 mt-4 md:mt-0">
          <select 
            value={activeClassId} 
            onChange={e => setActiveClassId(e.target.value)} 
            className="w-full bg-white text-slate-800 font-black text-sm px-6 py-2 rounded-xl outline-none shadow-sm cursor-pointer border border-slate-200 appearance-none"
          >
            {assignedClasses.length === 0 && <option value="">No Classes Assigned</option>}
            {assignedClasses.map(c => <option key={c.id} value={c.id}>{c.displayName} Roster</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 w-full min-w-0">
        
        {/* ================= LEFT: AUDIENCE SELECTION ================= */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[600px] w-full">
            
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0 w-full">
              <h2 className="font-black text-slate-800 flex items-center gap-2 mb-4"><Users className="w-4 h-4 text-emerald-500"/> Select Audience</h2>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search student..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-2.5 pl-9 pr-4 outline-none focus:border-emerald-500 text-sm font-medium shadow-sm" />
              </div>
            </div>

            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 w-full">
              <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">
                {selectedStudents.size === filteredStudents.length && filteredStudents.length > 0 ? <CheckSquare className="w-4 h-4 text-emerald-500"/> : <Square className="w-4 h-4"/>} 
                Select All
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{selectedStudents.size} Selected</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 w-full">
              {isLoading ? (
                <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-emerald-500"/></div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center p-10 text-slate-400 font-bold text-sm">No students found for this class.</div>
              ) : (
                filteredStudents.map(student => (
                  <div 
                    key={student.id} 
                    onClick={() => toggleStudent(student.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors mb-1 w-full min-w-0 ${selectedStudents.has(student.id) ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-slate-50 border border-transparent'}`}
                  >
                    {selectedStudents.has(student.id) ? <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0"/> : <Square className="w-4 h-4 text-slate-300 shrink-0"/>}
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black text-slate-500 shrink-0 uppercase shadow-sm">{student.first_name?.charAt(0)}{student.last_name?.charAt(0)}</div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold truncate ${selectedStudents.has(student.id) ? 'text-emerald-900' : 'text-slate-700'}`}>{student.first_name} {student.last_name}</p>
                      <p className={`text-[10px] font-medium truncate ${student.father_phone ? 'text-slate-400' : 'text-red-400'}`}>
                        {student.father_phone ? `+${student.father_phone}` : 'No phone linked in database'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ================= MIDDLE: COMPOSER ================= */}
        <div className="xl:col-span-4 flex flex-col gap-6 w-full min-w-0">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col h-[600px] w-full">
            <h2 className="font-black text-slate-800 flex items-center gap-2 mb-4 shrink-0 truncate"><PenTool className="w-4 h-4 text-emerald-500 shrink-0"/> Compose Message</h2>
            
            {/* Quick Templates */}
            <div className="mb-6 shrink-0 w-full min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Quick Templates</p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map(temp => (
                  <button key={temp.id} onClick={() => applyTemplate(temp.text)} className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                    {temp.icon} {temp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 w-full">
              <div className="flex justify-between items-center mb-2 w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate pr-2">Message Body</label>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded shrink-0">Supports: {'{student_name}'}</span>
              </div>
              <textarea 
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                placeholder="Type your message here. Use {student_name} to automatically insert the student's name..."
                className="w-full flex-1 bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl p-4 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none text-sm leading-relaxed custom-scrollbar"
              />
            </div>

            <button 
              onClick={generateQueue}
              disabled={selectedStudents.size === 0 || !messageBody.trim()}
              className="w-full mt-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 truncate"
            >
              <RefreshCw className="w-4 h-4 shrink-0"/> Generate Dispatch Queue
            </button>
          </div>
        </div>

        {/* ================= RIGHT: DISPATCH QUEUE ================= */}
        <div className="xl:col-span-4 flex flex-col gap-6 w-full min-w-0">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[600px] relative w-full">
            
            <div className="p-6 border-b border-slate-100 bg-emerald-600 text-white shrink-0 relative overflow-hidden w-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <h2 className="text-xl font-black flex items-center gap-2 relative z-10 truncate"><Send className="w-5 h-5 shrink-0"/> Dispatch Queue</h2>
              <p className="text-xs font-medium text-emerald-100 mt-1 relative z-10 truncate">
                {dispatchQueue.length > 0 
                  ? `${dispatchQueue.filter(q => q.sent).length} of ${dispatchQueue.length} messages sent` 
                  : "Queue is empty."}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 p-4 space-y-3 w-full">
              {dispatchQueue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60">
                  <Smartphone className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="text-sm font-bold text-slate-500">Select students and generate a queue to start sending messages.</p>
                </div>
              ) : (
                dispatchQueue.map((item, idx) => (
                  <div key={idx} className={`bg-white border rounded-xl p-4 transition-all shadow-sm w-full min-w-0 ${item.sent ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-2 w-full gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-slate-800 text-sm truncate">{item.name}</p>
                        <p className={`text-[10px] font-bold truncate ${item.phone ? 'text-slate-400' : 'text-red-500'}`}>
                          {item.phone ? `+${item.phone}` : 'Missing Database Entry'}
                        </p>
                      </div>
                      {item.sent ? (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1 shrink-0"><CheckCircle2 className="w-3 h-3"/> Sent</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-black uppercase shrink-0">Pending</span>
                      )}
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 w-full">
                      <p className="text-xs text-slate-600 line-clamp-2" title={item.message}>{item.message}</p>
                    </div>

                    <button 
                      onClick={() => sendWhatsApp(idx)}
                      disabled={!item.phone}
                      className={`w-full py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all truncate ${
                        item.sent 
                        ? 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50' 
                        : !item.phone 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-[#25D366] hover:bg-[#1DA851] text-white shadow-md'
                      }`}
                    >
                      <span className="truncate">{item.sent ? 'Send Again' : 'Send via WhatsApp'}</span> <ExternalLink className="w-3.5 h-3.5 shrink-0"/>
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}