"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { supabase } from "@/supabase"; 
import { 
  Search, Plus, Filter, MoreVertical, 
  Phone, User, GraduationCap, X, 
  CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import Link from "next/link";

const classesList = ["All Classes", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8","Class K.G.1"];

export default function StudentDirectory() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'teacher';
  
  // For this prototype, let's pretend the logged-in teacher is assigned to Class 8
  const assignedClass = "Class 8"; 

  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // If teacher, lock the dropdown to their class. If Principal, default to "All Classes"
  const [selectedClass, setSelectedClass] = useState(userRole === 'teacher' ? assignedClass : "All Classes");
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DB-Friendly Form State matching the public.students schema
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", dob: "", gender: "Male",
    currentClass: userRole === 'teacher' ? assignedClass : "Class 1", 
    section: "A", rollNo: "", 
    fatherName: "", fatherPhone: "", motherName: "",
    address: "", emergencyName: "", emergencyPhone: ""
  });

  // 1. FETCH LIVE DATA
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('students').select('*').order('created_at', { ascending: false });

      // SECURITY: If it's a teacher, force the database to ONLY return their class
      if (userRole === 'teacher') {
        query = query.eq('current_class', assignedClass);
      }

      const { data, error } = await query;
      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      console.error("Error fetching students:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [userRole]);

  // 2. ENROLL A NEW STUDENT
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Generate real-world Student ID & Admission Number (e.g., STU-26-XXXX)
    const newStudentId = `STU-26-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAdmissionNo = `ADM-26-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const { error } = await supabase.from('students').insert([{
        id: newStudentId,
        admission_number: newAdmissionNo,
        first_name: formData.firstName,
        last_name: formData.lastName,
        dob: formData.dob,
        gender: formData.gender,
        current_class: formData.currentClass,
        current_section: formData.section,
        roll_number: formData.rollNo ? parseInt(formData.rollNo) : null,
        father_name: formData.fatherName,
        father_phone: formData.fatherPhone,
        mother_name: formData.motherName,
        primary_address: formData.address,
        emergency_contact_name: formData.emergencyName || formData.fatherName, // Fallback if empty
        emergency_contact_number: formData.emergencyPhone || formData.fatherPhone,
        status: 'Active'
      }]);

      if (error) throw error;

      // Success! Close modal, clear form, refresh list
      setIsAddModalOpen(false);
      setFormData({ 
        firstName: "", lastName: "", dob: "", gender: "Male",
        currentClass: userRole === 'teacher' ? assignedClass : "Class 1", 
        section: "A", rollNo: "", fatherName: "", fatherPhone: "", motherName: "",
        address: "", emergencyName: "", emergencyPhone: "" 
      });
      fetchStudents();
      
    } catch (err: any) {
      alert("Failed to enroll: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. FRONTEND SEARCH & FILTER
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch = 
        student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesClass = selectedClass === "All Classes" || student.current_class === selectedClass;
      
      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, selectedClass]);

  const getAvatarColor = (name: string) => {
    const colors = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700"];
    return colors[name.charCodeAt(0) % colors.length] || colors[0];
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Student Directory</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm flex items-center gap-2">
            Live Database {userRole === 'teacher' && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase text-[10px] font-black tracking-widest">Restricted Access</span>}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full lg:w-auto items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
          </div>

          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)} 
              disabled={userRole === 'teacher'} 
              className="w-full sm:w-40 pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all shadow-sm appearance-none cursor-pointer font-medium text-slate-700 disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {classesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Enroll Student
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 hidden md:grid grid-cols-12 gap-4 text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">
          <div className="col-span-4">Student Info</div><div className="col-span-2">Class & Roll</div><div className="col-span-3">Guardian Contact</div><div className="col-span-2">Status</div><div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="overflow-y-auto p-2 sm:p-4 flex-1 custom-scrollbar">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 h-full"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" /><p className="text-slate-500 font-bold">Syncing Database...</p></div>
          ) : (
            <AnimatePresence>
              {filteredStudents.length > 0 ? (
                <div className="space-y-2">
                  {filteredStudents.map((student, idx) => (
                    
                    <Link href={`/admin/dashboard/students/${student.id}`} key={student.id} className="block w-full">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="group bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center relative cursor-pointer">
                        
                        <div className="col-span-4 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${getAvatarColor(student.first_name)}`}>
                            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-base">{student.first_name} {student.last_name}</h4>
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block">{student.id}</span>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <p className="text-sm font-bold text-slate-700">{student.current_class}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">Sec {student.current_section} • Roll: {student.roll_number || 'N/A'}</p>
                        </div>

                        <div className="col-span-3">
                          <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400"/> {student.father_name}</p>
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-1"><Phone className="w-3.5 h-3.5 text-slate-400"/> {student.father_phone}</p>
                        </div>

                        <div className="col-span-2 flex flex-col justify-center items-start mt-2 md:mt-0 pt-2 md:pt-0 border-t border-slate-100 md:border-none">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${student.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            {student.status === 'Active' ? <CheckCircle2 className="w-3.5 h-3.5"/> : <AlertCircle className="w-3.5 h-3.5"/>} {student.status}
                          </span>
                        </div>

                        <div className="col-span-1 text-right hidden md:block">
                          <button onClick={(e) => e.preventDefault()} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><MoreVertical className="w-5 h-5" /></button>
                        </div>

                      </motion.div>
                    </Link>

                  ))}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center h-full">
                  <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-4"><Search className="w-8 h-8" /></div>
                  <h3 className="text-lg font-bold text-slate-700">No students found</h3>
                  <p className="text-slate-500 text-sm mt-1 max-w-sm">Use the Enroll button to add students to the database.</p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* --- ENROLL STUDENT MODAL --- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-[101] flex flex-col border-l border-slate-200">
              <div className="h-20 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div><h3 className="text-xl font-black text-slate-800">Enroll Student</h3></div>
                <button onClick={() => setIsAddModalOpen(false)} className="bg-white hover:bg-slate-100 text-slate-500 p-2 rounded-full transition-colors border border-slate-200 shadow-sm"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={handleEnrollStudent} className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
                <div className="p-6 space-y-8 flex-1">
                  
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">1. Personal Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-slate-700 mb-1">First Name</label><input required type="text" value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm" /></div>
                      <div><label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label><input required type="text" value={formData.lastName} onChange={e=>setFormData({...formData, lastName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm" /></div>
                      <div><label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label><input required type="date" value={formData.dob} onChange={e=>setFormData({...formData, dob: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm" /></div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                        <select required value={formData.gender} onChange={e=>setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm">
                          <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Academic Info */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">2. Academic Placement</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Class</label>
                        <select required value={formData.currentClass} onChange={e=>setFormData({...formData, currentClass: e.target.value})} disabled={userRole === 'teacher'} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm disabled:opacity-70">
                          {classesList.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div><label className="block text-xs font-bold text-slate-700 mb-1">Section</label><input required type="text" maxLength={1} placeholder="e.g. A" value={formData.section} onChange={e=>setFormData({...formData, section: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm" /></div>
                      <div><label className="block text-xs font-bold text-slate-700 mb-1">Roll No (Optional)</label><input type="number" value={formData.rollNo} onChange={e=>setFormData({...formData, rollNo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm" /></div>
                    </div>
                  </div>

                  {/* Parent Info */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">3. Family & Contact</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div><label className="block text-xs font-bold text-slate-700 mb-1">Father's Name</label><input required type="text" value={formData.fatherName} onChange={e=>setFormData({...formData, fatherName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm" /></div>
                      <div><label className="block text-xs font-bold text-slate-700 mb-1">Father's Phone</label><input required type="tel" value={formData.fatherPhone} onChange={e=>setFormData({...formData, fatherPhone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm" /></div>
                      <div><label className="block text-xs font-bold text-slate-700 mb-1">Mother's Name</label><input required type="text" value={formData.motherName} onChange={e=>setFormData({...formData, motherName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm" /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1">Primary Address</label><textarea required rows={2} value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-sm resize-none"></textarea></div>
                  </div>

                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {isSubmitting ? "Saving to Database..." : "Confirm Enrollment"}
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