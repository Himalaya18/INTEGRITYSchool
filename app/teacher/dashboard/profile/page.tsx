"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  UserCircle, Mail, Phone, MapPin, Users, HeartPulse, 
  ShieldCheck, Briefcase, Calendar, Laptop, Save, X, Edit2, Loader2 
} from "lucide-react";
import { supabase } from "@/supabase";

export default function TeacherProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Holds the raw data from the DB
  const [profileData, setProfileData] = useState<any>(null);
  
  // Holds the data while the user is typing (before saving)
  const [editForm, setEditForm] = useState({
    phone: "",
    email: "",
    address: "",
    fatherName: "",
    spouseName: "",
    emergencyName: "",
    emergencyRelation: "",
    emergencyPhone: ""
  });

  useEffect(() => {
    loadMyProfile();
  }, []);

  const loadMyProfile = async () => {
    try {
      setIsLoading(true);
      const sessionStr = localStorage.getItem("currentUser");
      if (!sessionStr) return;
      const user = JSON.parse(sessionStr);

      // 1. Fetch Core Profile & Linked Email
      const { data: staffData } = await supabase
        .from('staff_profiles')
        .select(`*, users!inner(email)`)
        .eq('user_id', user.id)
        .single();

      if (!staffData) throw new Error("Profile not found");

      // 2. Fetch Emergency Contact
      const { data: emergencyData } = await supabase
        .from('staff_emergency_contacts')
        .select('*')
        .eq('staff_id', staffData.id)
        .limit(1)
        .single();

      const assembledData = {
        ...staffData,
        email: staffData.users?.email || "",
        emergency: emergencyData || { name: "", relation: "", phone: "" }
      };

      setProfileData(assembledData);
      
      // Populate the edit form with current DB values
      setEditForm({
        phone: assembledData.phone || "",
        email: assembledData.email || "",
        address: assembledData.address || "",
        fatherName: assembledData.father_name || "",
        spouseName: assembledData.spouse_name || "",
        emergencyName: assembledData.emergency.name || "",
        emergencyRelation: assembledData.emergency.relation || "",
        emergencyPhone: assembledData.emergency.phone || ""
      });

    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // 1. Update general info in staff_profiles
      await supabase
        .from('staff_profiles')
        .update({
          phone: editForm.phone,
          address: editForm.address,
          father_name: editForm.fatherName,
          spouse_name: editForm.spouseName
        })
        .eq('id', profileData.id);

      // 2. Update email in users table
      await supabase
        .from('users')
        .update({ email: editForm.email })
        .eq('id', profileData.user_id);

      // 3. Update or Insert Emergency Contact
      const emergencyPayload = {
        staff_id: profileData.id,
        name: editForm.emergencyName,
        relation: editForm.emergencyRelation,
        phone: editForm.emergencyPhone
      };

      if (profileData.emergency?.id) {
        await supabase.from('staff_emergency_contacts').update(emergencyPayload).eq('id', profileData.emergency.id);
      } else {
        await supabase.from('staff_emergency_contacts').insert([emergencyPayload]);
      }

      // Update local storage email just in case
      const sessionStr = localStorage.getItem("currentUser");
      if (sessionStr) {
        const user = JSON.parse(sessionStr);
        user.email = editForm.email;
        localStorage.setItem("currentUser", JSON.stringify(user));
      }

      setIsEditing(false);
      await loadMyProfile(); // Reload to show fresh data
      
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  if (!profileData) return <div className="p-8 text-center text-slate-500">Profile data not found. Contact Admin.</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-24">
      
      {/* Top Banner */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full -z-0"></div>
        
        <div className="w-32 h-32 rounded-3xl bg-blue-600 border-4 border-white shadow-xl flex items-center justify-center text-white font-black text-4xl shrink-0 overflow-hidden relative z-10">
          {profileData.photo_url ? (
            <img src={profileData.photo_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            `${profileData.first_name.charAt(0)}${profileData.last_name.charAt(0)}`
          )}
        </div>
        
        <div className="relative z-10 text-center md:text-left flex-1 mt-2">
          <h1 className="text-3xl font-black text-slate-800">{profileData.first_name} {profileData.last_name}</h1>
          <p className="text-blue-600 font-bold text-lg">{profileData.designation}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5"/> {profileData.department}</span>
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5"/> {profileData.status}</span>
          </div>
        </div>

        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="relative z-10 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2 w-full md:w-auto justify-center">
            <Edit2 className="w-4 h-4" /> Edit Details
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: EDITABLE PERSONAL INFO */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-8 relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><UserCircle className="w-5 h-5 text-blue-500"/> Personal Details</h3>
            {isEditing && <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 px-2 py-1 rounded-md animate-pulse">Editing Mode</span>}
          </div>

          <div className="space-y-5">
            <EditableField icon={<Phone/>} label="Mobile Number" value={editForm.phone} isEditing={isEditing} onChange={(val: string) => setEditForm({...editForm, phone: val})} />
            <EditableField icon={<Mail/>} label="Email Address" value={editForm.email} isEditing={isEditing} onChange={(val: string) => setEditForm({...editForm, email: val})} type="email" />
            <EditableField icon={<Users/>} label="Father's Name" value={editForm.fatherName} isEditing={isEditing} onChange={(val: string) => setEditForm({...editForm, fatherName: val})} />
            <EditableField icon={<Users/>} label="Spouse's Name (Optional)" value={editForm.spouseName} isEditing={isEditing} onChange={(val: string) => setEditForm({...editForm, spouseName: val})} />
            
            <div className="pt-2">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 text-slate-400"><MapPin className="w-5 h-5" /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Residential Address</p>
                  {isEditing ? (
                    <textarea value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none" placeholder="Enter your full address" />
                  ) : (
                    <p className="font-bold text-slate-700 text-sm leading-relaxed">{profileData.address || "Not provided"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact Sub-section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="font-black text-red-900 text-sm flex items-center gap-2 mb-4 uppercase tracking-widest"><HeartPulse className="w-4 h-4 text-red-500"/> Emergency Contact</h3>
            <div className="space-y-4">
               <EditableField icon={<UserCircle/>} label="Contact Name" value={editForm.emergencyName} isEditing={isEditing} onChange={(val: string) => setEditForm({...editForm, emergencyName: val})} />
               <EditableField icon={<Users/>} label="Relationship" value={editForm.emergencyRelation} isEditing={isEditing} onChange={(val: string) => setEditForm({...editForm, emergencyRelation: val})} />
               <EditableField icon={<Phone/>} label="Emergency Phone" value={editForm.emergencyPhone} isEditing={isEditing} onChange={(val: string) => setEditForm({...editForm, emergencyPhone: val})} />
            </div>
          </div>

          {/* NEW: INLINE SAVE BUTTONS */}
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3"
            >
              <button 
                onClick={() => setIsEditing(false)} 
                disabled={isSaving} 
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors text-sm"
              >
                Cancel Edit
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all text-sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? "Saving to Database..." : "Save Profile Changes"}
              </button>
            </motion.div>
          )}

        </div>

        {/* RIGHT COLUMN: LOCKED ADMIN INFO */}
        <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-6 sm:p-8 relative overflow-hidden h-max">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-slate-500"/> Administrative Data</h3>
              <span className="text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-500 px-2 py-1 rounded-md flex items-center gap-1">Locked</span>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee ID</p>
                <p className="font-mono font-bold text-slate-700 bg-white border px-3 py-1.5 rounded-lg inline-block text-sm">{profileData.id}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date of Joining</p>
                  <p className="font-bold text-slate-700 text-sm flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400"/> {profileData.join_date ? new Date(profileData.join_date).toLocaleDateString() : "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Salary</p>
                  <p className="font-bold text-emerald-600 text-sm flex items-center gap-1.5">₹ {Number(profileData.base_salary).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Laptop className="w-3.5 h-3.5"/> Assigned Assets</p>
                <ul className="space-y-2">
                    {profileData.assigned_assets?.length > 0 ? profileData.assigned_assets.map((asset: string, idx: number) => (
                        <li key={idx} className="text-xs font-bold text-slate-600 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> {asset}
                        </li>
                    )) : (
                        <p className="text-xs text-slate-400 italic font-medium">No school assets assigned.</p>
                    )}
                </ul>
              </div>

              <p className="text-xs text-slate-400 font-medium italic mt-8 text-center bg-white/50 py-2 rounded-xl">
                To update administrative data or assets, please contact the Principal or HR department.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Reusable Editable Field Component
function EditableField({ icon, label, value, isEditing, onChange, type = "text" }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="mt-0.5 text-slate-400"><div className="w-5 h-5 flex items-center justify-center">{icon}</div></div>
      <div className="flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        {isEditing ? (
          <input 
            type={type} 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all mt-1"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : (
          <p className="font-bold text-slate-700 text-sm">{value || <span className="text-slate-300 italic font-medium">Not provided</span>}</p>
        )}
      </div>
    </div>
  );
}