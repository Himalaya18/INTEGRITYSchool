"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Search, Plus, BookOpen, ChevronRight 
} from "lucide-react";
import { supabase } from "@/supabase";

export default function FacultyDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Real Database State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setIsLoading(true);
    
    // 1. Fetch staff profiles and join with users table. Added photo_url here.
    const { data, error } = await supabase
      .from('staff_profiles')
      .select(`
        id, first_name, last_name, designation, department, phone, status, join_date, photo_url,
        users ( email )
      `);

    if (error) {
        console.error("Supabase Fetch Error:", error);
        setIsLoading(false);
        return;
    }

    if (data) {
      // 2. Map data with defensive checks
      const formattedData = data.map(staff => ({
        id: staff.id,
        firstName: staff.first_name || "Unknown",
        lastName: staff.last_name || "",
        role: staff.designation || "N/A",
        subject: staff.department || "General",
        phone: staff.phone || "N/A",
        photo: staff.photo_url || null, // Added photo mapping
        email: staff.users && Array.isArray(staff.users) 
            ? (staff.users[0]?.email || "N/A") 
            : ((staff.users as any)?.email || "N/A"),
        status: staff.status || "Active",
        joinDate: staff.join_date 
            ? new Date(staff.join_date).toLocaleDateString() 
            : "N/A"
      }));
      setStaffList(formattedData);
    }
    setIsLoading(false);
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === "All Departments" || s.subject === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [searchQuery, selectedDept, staffList]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Faculty & Staff</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Review credentials, workload, and performance of school staff.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full lg:w-auto items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search staff..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add New Staff
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredStaff.map((staff, idx) => (
              <Link href={`/admin/dashboard/faculty/${staff.id}`} key={staff.id}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all group overflow-hidden cursor-pointer"
                >
                  {/* Visual Header */}
                  <div className="h-24 bg-gradient-to-r from-slate-100 to-blue-50 relative">
                      <div className="absolute top-4 right-6 bg-white/80 backdrop-blur-md border border-white px-3 py-1 rounded-full text-[10px] font-black uppercase text-slate-400">
                          {staff.id.substring(0, 8)}...
                      </div>
                  </div>

                  <div className="px-8 pb-8 flex flex-col items-center -mt-12 relative z-10 text-center">
                    {/* Updated Photo Block with overflow-hidden */}
                    <div className="w-24 h-24 rounded-3xl bg-blue-600 text-white border-4 border-white shadow-lg flex items-center justify-center font-black text-3xl mb-4 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                      {staff.photo ? (
                        <img src={staff.photo} alt={`${staff.firstName} ${staff.lastName}`} className="w-full h-full object-cover" />
                      ) : (
                        <>{staff.firstName.charAt(0)}{staff.lastName.charAt(0)}</>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-800">{staff.firstName} {staff.lastName}</h3>
                    <p className="text-blue-600 font-bold text-sm mb-4">{staff.role}</p>

                    <div className="flex gap-2 mb-6">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3"/> {staff.subject}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${staff.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${staff.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div> {staff.status}
                      </span>
                    </div>

                    <div className="w-full pt-6 border-t border-slate-100 flex items-center justify-between text-slate-400 group-hover:text-blue-600 transition-colors">
                      <span className="text-xs font-bold uppercase tracking-widest">View Profile</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}