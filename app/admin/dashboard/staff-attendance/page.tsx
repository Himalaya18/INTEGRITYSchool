"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  QrCode, CheckCircle2, AlertTriangle, 
  Clock, ScanFace, UserCheck, X, ShieldAlert,
  CalendarCheck, Maximize, Loader2, PieChart, 
  Repeat, ChevronDown, CalendarDays, FileSpreadsheet, Umbrella
} from "lucide-react";
import { supabase } from "@/supabase";

export default function StaffAttendance() {
  const [activeTab, setActiveTab] = useState<"Roster" | "Substitutions" | "Analytics" | "Leaves" | "Kiosk">("Roster");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kioskToken, setKioskToken] = useState("");
  
  // Substitution State
  const [substitutions, setSubstitutions] = useState<Record<string, string>>({});
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

  // Export State
  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7));

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchAttendanceData();
    fetchOrCreateDailyToken();

    // Listen for attendance and leave updates
    const channel = supabase
      .channel('principal-attendance-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_attendance' }, () => fetchAttendanceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => fetchAttendanceData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const { data: profiles } = await supabase.from('staff_profiles').select('id, first_name, last_name, designation, photo_url, user_id');
      const { data: attendance } = await supabase.from('staff_attendance').select('*');
      const { data: leaves } = await supabase.from('leave_requests').select('*').order('created_at', { ascending: false });

      if (profiles) {
        // Map Attendance & Roster
        if (attendance) {
          setHistoricalData(attendance);
          const todayAttendance = attendance.filter(a => a.date === todayStr);

          const merged = profiles.map(staff => {
            const log = todayAttendance.find(a => a.staff_id === staff.id);
            return {
              id: staff.id,
              userId: staff.user_id, // Needed to link with leave requests
              name: `${staff.first_name} ${staff.last_name}`,
              role: staff.designation,
              photo: staff.photo_url,
              status: log ? log.status : "Pending",
              checkInTime: log ? log.time_in : null,
              type: log ? log.type : null
            };
          });
          setStaffList(merged);
        }

        // Map Leaves to Staff Profiles
        if (leaves) {
          const mergedLeaves = leaves.map(leave => {
            // Find staff by their user_id (which is used as teacher_id in leave_requests)
            const staff = profiles.find(p => p.user_id === leave.teacher_id || p.id === leave.teacher_id);
            return {
              ...leave,
              staffName: staff ? `${staff.first_name} ${staff.last_name}` : "Unknown Staff",
              staffRole: staff ? staff.designation : "N/A",
              staffPhoto: staff ? staff.photo_url : null
            };
          });
          setLeaveRequests(mergedLeaves);
        }
      }
    } catch (error) {
      console.error("Error fetching roster:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrCreateDailyToken = async () => {
    const { data } = await supabase.from('daily_kiosk').select('*').eq('date', todayStr).single();
    if (data) {
      setKioskToken(data.token);
    } else {
      const { data: newData } = await supabase.from('daily_kiosk').insert([{ date: todayStr }]).select().single();
      if (newData) setKioskToken(newData.token);
    }
  };

  const handleManualMark = async (id: string, type: "On Time" | "Warning" | "Half Day" | "Absent") => {
    const now = new Date();
    let formatAmPm = now.getHours() >= 12 ? 'PM' : 'AM';
    let h12 = now.getHours() % 12 || 12;
    let m = now.getMinutes();
    let timeStr = `${h12 < 10 ? '0'+h12 : h12}:${m < 10 ? '0'+m : m} ${formatAmPm}`;

    const status = type === "Absent" ? "Absent" : "Present";
    const finalTime = type === "Absent" ? "--:--" : timeStr;

    await supabase.from('staff_attendance').upsert({
      staff_id: id,
      date: todayStr,
      time_in: finalTime,
      status: status,
      type: type
    }, { onConflict: 'staff_id, date' });

    fetchAttendanceData();
  };

  const handleAssignSub = (absentId: string, substituteId: string) => {
    setSubstitutions(prev => ({ ...prev, [absentId]: substituteId }));
  };

  const handleLeaveAction = async (leaveId: string, action: "Approved" | "Rejected") => {
    try {
      const { error } = await supabase.from('leave_requests').update({ status: action }).eq('id', leaveId);
      if (error) throw error;
      fetchAttendanceData();
    } catch (err: any) {
      alert("Failed to update leave request: " + err.message);
    }
  };

  const handleExportExcel = () => {
    const filteredLogs = historicalData.filter(log => log.date.startsWith(exportMonth));
    if (filteredLogs.length === 0) return alert("No attendance records found for the selected month.");

    const headers = ["Date", "Staff Name", "Designation", "Status", "Time In", "Type"];
    const csvRows = [headers.join(",")];

    filteredLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach(log => {
      const staff = staffList.find(s => s.id === log.staff_id);
      const name = staff ? staff.name : "Unknown";
      const role = staff ? staff.role : "N/A";
      
      const row = [log.date, `"${name}"`, `"${role}"`, log.status, log.time_in || "--:--", log.type || "N/A"];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Staff_Attendance_Report_${exportMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const presentStaff = staffList.filter(s => s.status === 'Present');
  const absentStaff = staffList.filter(s => s.status === 'Absent' || s.status === 'Pending');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 h-full flex flex-col relative font-sans pb-24">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
            <ScanFace className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Staff Attendance</h1>
            <p className="text-slate-500 font-medium mt-1 text-sm">Monitor today's roster, manage leaves, and view analytics.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl w-full xl:w-auto overflow-x-auto no-scrollbar">
          {(["Roster", "Leaves", "Substitutions", "Analytics", "Kiosk"] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)} 
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {tab === "Roster" && <UserCheck className="w-4 h-4" />}
              {tab === "Leaves" && <Umbrella className="w-4 h-4" />}
              {tab === "Substitutions" && <Repeat className="w-4 h-4" />}
              {tab === "Analytics" && <PieChart className="w-4 h-4" />}
              {tab === "Kiosk" && <Maximize className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* --- TAB 1: LIVE ROSTER (TODAY) --- */}
      {activeTab === "Roster" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col gap-6 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm"><CheckCircle2 className="w-5 h-5"/></div>
              <div><p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-0.5">On Time</p><p className="font-bold text-slate-700 text-sm">7:00 AM - 8:30 AM</p></div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-sm"><AlertTriangle className="w-5 h-5"/></div>
              <div><p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-0.5">Warning (Late)</p><p className="font-bold text-slate-700 text-sm">8:31 AM - 9:30 AM</p></div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm"><ShieldAlert className="w-5 h-5"/></div>
              <div><p className="text-xs font-black uppercase tracking-widest text-red-600 mb-0.5">Half Day Penalty</p><p className="font-bold text-slate-700 text-sm">After 9:30 AM</p></div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><CalendarCheck className="w-5 h-5 text-blue-500"/> Today's Log ({new Date().toLocaleDateString('en-GB')})</h2>
              <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                Total Present: {presentStaff.length} / {staffList.length}
              </span>
            </div>
            
            {isLoading ? (
               <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : (
              <div className="overflow-y-auto p-4 flex-1">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {staffList.map((staff) => (
                    <div key={staff.id} className="bg-white border border-slate-100 hover:border-blue-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center text-slate-400 font-black text-lg">
                          {staff.photo ? <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" /> : staff.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-base">{staff.name}</h4>
                          <p className="text-xs font-bold text-slate-500">{staff.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="text-left sm:text-right">
                          {staff.status === "Pending" ? (
                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500">Awaiting Scan</span>
                          ) : staff.status === "Absent" ? (
                            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-800 text-white">Marked Absent</span>
                          ) : (
                            <>
                              <p className="font-black text-slate-800 flex items-center sm:justify-end gap-1"><Clock className="w-3.5 h-3.5 text-slate-400"/> {staff.checkInTime}</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${staff.type === 'On Time' ? 'bg-emerald-100 text-emerald-700' : staff.type === 'Warning' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {staff.type}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 border-l border-slate-100 pl-4 shrink-0">
                          <div className="flex gap-1">
                            <button onClick={() => handleManualMark(staff.id, "On Time")} title="Mark On Time" className="w-7 h-7 bg-slate-50 hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 rounded-lg flex items-center justify-center"><CheckCircle2 className="w-4 h-4"/></button>
                            <button onClick={() => handleManualMark(staff.id, "Half Day")} title="Mark Half Day" className="w-7 h-7 bg-slate-50 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg flex items-center justify-center"><ShieldAlert className="w-4 h-4"/></button>
                            <button onClick={() => handleManualMark(staff.id, "Absent")} title="Mark Absent" className="w-7 h-7 bg-slate-50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg flex items-center justify-center"><X className="w-4 h-4"/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* --- TAB 2: LEAVE MANAGEMENT --- */}
      {activeTab === "Leaves" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col gap-6 min-h-0">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><Umbrella className="w-5 h-5 text-amber-500"/> Staff Leave Requests</h2>
                <p className="text-xs font-bold text-slate-500 mt-1">Review and approve upcoming time off.</p>
              </div>
              <span className="text-xs font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg shadow-sm">
                {leaveRequests.filter(l => l.status === 'Pending').length} Pending
              </span>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              {leaveRequests.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-bold">No leave requests found in the system.</div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {leaveRequests.map(leave => (
                    <div key={leave.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
                      
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center text-slate-400 font-black text-lg">
                            {leave.staffPhoto ? <img src={leave.staffPhoto} className="w-full h-full object-cover" /> : leave.staffName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-base">{leave.staffName}</h4>
                            <p className="text-xs font-bold text-slate-500">{leave.staffRole}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border whitespace-nowrap ${
                          leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          leave.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                        }`}>
                          {leave.status}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Duration:</span>
                          <span className="text-xs font-bold text-slate-800">{leave.duration}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Reason:</span>
                          <p className="text-sm font-medium text-slate-700 leading-snug">{leave.reason}</p>
                        </div>
                      </div>

                      {/* Action Buttons (Only show if pending) */}
                      {leave.status === 'Pending' && (
                        <div className="flex gap-3 pt-2">
                          <button 
                            onClick={() => handleLeaveAction(leave.id, "Rejected")}
                            className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4"/> Reject
                          </button>
                          <button 
                            onClick={() => handleLeaveAction(leave.id, "Approved")}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4"/> Approve Leave
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* --- TAB 3: SUBSTITUTIONS --- */}
      {activeTab === "Substitutions" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><Repeat className="w-5 h-5 text-purple-500"/> Class Substitutions</h2>
                <p className="text-xs font-bold text-slate-500 mt-1">Assign present teachers to cover for absent staff.</p>
              </div>
              <span className="text-xs font-black uppercase tracking-widest bg-red-100 text-red-600 px-3 py-1.5 rounded-lg shadow-sm">
                {absentStaff.length} Absent Today
              </span>
            </div>

            <div className="p-6 overflow-y-auto">
              {absentStaff.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-bold">All staff are present today! No substitutions needed.</div>
              ) : (
                <div className="grid gap-6">
                  {absentStaff.map(absent => (
                    <div key={absent.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row gap-6">
                      
                      <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center font-black">{absent.name.charAt(0)}</div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-0.5">Absent Staff</p>
                          <h4 className="font-black text-slate-800">{absent.name}</h4>
                          <p className="text-xs font-bold text-slate-500">{absent.role}</p>
                        </div>
                      </div>

                      <div className="md:w-2/3 flex flex-col justify-center">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Needs Coverage For</p>
                            <div className="flex gap-2">
                              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-xs font-bold border border-slate-200">Period 2 (Class 8A)</span>
                              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-xs font-bold border border-slate-200">Period 4 (Class 9C)</span>
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Assign Substitute</p>
                            <select 
                              value={substitutions[absent.id] || ""}
                              onChange={(e) => handleAssignSub(absent.id, e.target.value)}
                              className={`w-full text-sm font-bold rounded-xl px-4 py-2.5 outline-none border shadow-sm ${substitutions[absent.id] ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'}`}
                            >
                              <option value="" disabled>Select Present Teacher...</option>
                              {presentStaff.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* --- TAB 4: STAFF ANALYTICS --- */}
      {activeTab === "Analytics" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><PieChart className="w-5 h-5 text-indigo-500"/> Staff Attendance Analytics</h2>
                <p className="text-xs font-bold text-slate-500 mt-1">Track historical presence, half-days, and absences.</p>
              </div>
              
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <input 
                  type="month" 
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  className="px-3 py-2 bg-transparent text-sm font-bold text-slate-700 outline-none border-none cursor-pointer"
                />
                <div className="w-px h-6 bg-slate-200"></div>
                <button 
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-xs font-black transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4"/> Export CSV
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {staffList.map((staff) => {
                  const myLogs = historicalData.filter(h => h.staff_id === staff.id);
                  const totalDays = myLogs.length;
                  const presentCount = myLogs.filter(h => h.status === 'Present' && h.type === 'On Time').length;
                  const lateCount = myLogs.filter(h => h.status === 'Present' && h.type === 'Warning').length;
                  const halfCount = myLogs.filter(h => h.type === 'Half Day').length;
                  const absentCount = myLogs.filter(h => h.status === 'Absent').length;

                  const presentPct = totalDays === 0 ? 0 : (presentCount / totalDays) * 100;
                  const latePct = totalDays === 0 ? 0 : (lateCount / totalDays) * 100;
                  const halfPct = totalDays === 0 ? 0 : (halfCount / totalDays) * 100;
                  const absentPct = totalDays === 0 ? 0 : (absentCount / totalDays) * 100;

                  const isExpanded = expandedStaffId === staff.id;

                  return (
                    <div key={staff.id} className="bg-white border border-slate-200 rounded-[1.5rem] shadow-sm overflow-hidden">
                      <div className="p-5 flex items-start gap-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedStaffId(isExpanded ? null : staff.id)}>
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-black shrink-0">
                          {staff.photo ? <img src={staff.photo} className="w-full h-full object-cover rounded-full" /> : staff.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-black text-slate-800">{staff.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{staff.role}</p>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </div>
                          
                          <div className="mt-4">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1.5">
                              <span className="text-emerald-600">On Time</span>
                              <span className="text-red-500">Absent</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                              <div style={{ width: `${presentPct}%` }} className="bg-emerald-500 h-full" title="On Time"></div>
                              <div style={{ width: `${latePct}%` }} className="bg-amber-400 h-full" title="Late"></div>
                              <div style={{ width: `${halfPct}%` }} className="bg-orange-500 h-full" title="Half Day"></div>
                              <div style={{ width: `${absentPct}%` }} className="bg-red-500 h-full" title="Absent"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-slate-100 bg-slate-50">
                            <div className="p-5">
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5"/> Recent Attendance Log</h5>
                              {myLogs.length === 0 ? (
                                <p className="text-xs text-slate-400 font-bold">No historical data available.</p>
                              ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                  {myLogs.slice(0, 7).map((log, i) => ( 
                                    <div key={i} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                                      <span className="text-xs font-bold text-slate-600">{new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                        log.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                        log.type === 'On Time' ? 'bg-emerald-100 text-emerald-700' :
                                        log.type === 'Warning' ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-700'
                                      }`}>
                                        {log.status === 'Absent' ? 'Absent' : log.type}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- TAB 5: PRINCIPAL'S KIOSK MODE --- */}
      {activeTab === "Kiosk" && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden min-h-[500px]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center max-w-md w-full">
            <h2 className="text-3xl font-black text-white mb-2">Staff Check-In</h2>
            <p className="text-slate-400 font-medium mb-12">Leave this screen open. Staff can scan the QR code from their Integrity Staff App to log attendance.</p>
            
            <div className="bg-white p-6 rounded-[2rem] shadow-2xl relative group">
              {kioskToken ? (
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=INTEGRITY-ATTENDANCE-${kioskToken}`} alt="Daily QR Code" className="w-48 h-48 rounded-xl" />
              ) : (
                 <div className="w-48 h-48 bg-slate-100 flex items-center justify-center animate-pulse rounded-xl font-bold text-slate-400 text-sm">Generating Token...</div>
              )}
              
              <div className="absolute -top-4 -right-4 bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
                <QrCode className="w-5 h-5"/>
              </div>
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}