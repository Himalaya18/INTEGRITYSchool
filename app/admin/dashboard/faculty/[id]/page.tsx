// Path: app/admin/dashboard/faculty/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  ArrowLeft, Mail, Phone, Calendar, Briefcase, 
  MapPin, CheckCircle2, ShieldCheck, BookOpen,
  Award, FileText, Activity, Users, Star, IndianRupee,
  CalendarOff, FileSignature, HeartPulse, Laptop, TrendingUp,
  Network, X, Save, Edit2, Plus, Trash2
} from "lucide-react";
import { supabase } from "@/supabase";

export default function StaffProfile() {
  const params = useParams();
  const staffId = params.id as string;
  
  const [staff, setStaff] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- EDIT MODAL STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    baseSalary: 0,
    assignedAssets: [] as string[],
    departmentalRoles: [] as { department: string; title: string }[]
  });

  useEffect(() => {
    if (staffId) {
      fetchStaffDossier();
    }
  }, [staffId]);

  const fetchStaffDossier = async () => {
    setIsLoading(true);

    try {
      const { data: profileData } = await supabase.from('staff_profiles').select(`*, users(email)`).eq('id', staffId).single();
      const { data: emergencyData } = await supabase.from('staff_emergency_contacts').select('*').eq('staff_id', staffId).limit(1).single();
      const { data: rolesData } = await supabase.from('staff_departmental_roles').select('*').eq('staff_id', staffId);
      const { data: metricsData } = await supabase.from('staff_metrics').select('*').eq('staff_id', staffId).single();

      if (profileData) {
        const assembledStaff = {
          id: profileData.id,
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          photoUrl: profileData.photo_url,
          email: profileData.users?.email || "N/A",
          phone: profileData.phone || "N/A",
          address: profileData.address || "N/A",
          dob: profileData.dob ? new Date(profileData.dob).toLocaleDateString() : "N/A",
          bloodGroup: profileData.blood_group || "N/A",
          gender: profileData.gender || "N/A",
          joinDate: profileData.join_date ? new Date(profileData.join_date).toLocaleDateString() : "N/A",
          status: profileData.status || "Active",
          fatherName: profileData.father_name || "N/A",
          spouseName: profileData.spouse_name || "N/A",
          experience: profileData.experience || "N/A",
          previousInstitution: profileData.previous_institution || "N/A",
          emergency: emergencyData ? { name: emergencyData.name, relation: emergencyData.relation, phone: emergencyData.phone } : { name: "N/A", relation: "N/A", phone: "N/A" },
          aadhaar: profileData.aadhaar_number || "[Not Provided]",
          pan: profileData.pan_number || "N/A",
          epfUan: profileData.epf_uan || "N/A",
          qualification: profileData.qualification || "N/A",
          assignedAssets: profileData.assigned_assets || [],
          role: profileData.designation,
          managementPosition: profileData.management_position, 
          departmentalRoles: rolesData || [],
          academics: {
            classTeacherOf: "Pending Assignment",
            totalStudentsTaught: 0, 
            primarySubject: profileData.department,
            assignedClasses: []
          },
          attendance: metricsData ? {
            present: metricsData.present_days,
            absent: metricsData.absent_days,
            percentage: metricsData.present_days + metricsData.absent_days === 0 ? 100 : Math.round((metricsData.present_days / (metricsData.present_days + metricsData.absent_days)) * 100),
            leaveBalance: { totalAllowed: metricsData.total_leaves_allowed, taken: metricsData.leaves_taken, remaining: metricsData.total_leaves_allowed - metricsData.leaves_taken }
          } : { present: 0, absent: 0, percentage: 100, leaveBalance: { totalAllowed: 15, taken: 0, remaining: 15 } },
          payroll: {
            baseSalary: profileData.base_salary,
            allowances: 0, deductions: 0, 
            netPay: profileData.base_salary,
            lastPaid: "Pending", status: "Pending", bankDetails: "Update Required"
          },
          performance: metricsData ? {
            rating: metricsData.rating,
            passPercentage: metricsData.pass_percentage,
            remark: metricsData.remark || "No remarks logged."
          } : { rating: 0, passPercentage: 0, remark: "Awaiting evaluation." }
        };
        setStaff(assembledStaff);
      }
    } catch (error) {
      console.error("Error fetching HR Dossier:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // PDF EXPORT ENGINE (MULTI-PAGE)
  // ==========================================
  const handleExportPDF = () => {
    if (!staff) return;
    const doc = new jsPDF();
    
    // PAGE 1: DETAILED HR DOSSIER
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); 
    doc.text(`Integrity Education`, 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(71, 85, 105);
    doc.text(`Official HR Dossier - ${staff.id}`, 14, 30);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Employee Name: ${staff.firstName} ${staff.lastName}`, 14, 40);

    autoTable(doc, {
      startY: 45,
      headStyles: { fillColor: [37, 99, 235] }, 
      head: [['Employment Profile', '']],
      body: [
        ['Designation', staff.role],
        ['Department', staff.academics.primarySubject],
        ['Date of Joining', staff.joinDate],
        ['Current Status', staff.status],
        ['Base Salary', `Rs. ${Number(staff.payroll.baseSalary).toLocaleString()}`],
        ['Management Role', staff.managementPosition || 'N/A'],
      ],
    });

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY || 100) + 10, // SAFE NAVIGATION ADDED
      headStyles: { fillColor: [71, 85, 105] }, 
      head: [['Personal & Contact Information', '']],
      body: [
        ['Contact Number', staff.phone],
        ['Official Email', staff.email],
        ['Date of Birth', staff.dob],
        ['Blood Group', staff.bloodGroup],
        ['Residential Address', staff.address],
        ['Emergency Contact', `${staff.emergency.name} (${staff.emergency.phone})`],
      ],
    });

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY || 160) + 10, // SAFE NAVIGATION ADDED
      headStyles: { fillColor: [71, 85, 105] },
      head: [['Statutory & Asset Details', '']],
      body: [
        ['PAN Number', staff.pan],
        ['EPF UAN', staff.epfUan],
        ['Aadhaar', staff.aadhaar],
        ['Assigned Assets', staff.assignedAssets.join(", ") || "None"],
      ],
    });

    // PAGE 2: EXPERIENCE CERTIFICATE
    doc.addPage();
    doc.setFontSize(26);
    doc.setTextColor(30, 58, 138);
    doc.setFont("helvetica", "bold");
    doc.text(`INTEGRITY EDUCATION`, 105, 30, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(`Bagicha ,Jashpur, Chhattisgarh, India`, 105, 40, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 45, 190, 45);

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`EXPERIENCE CERTIFICATE`, 105, 65, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const issueDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    doc.text(`Date: ${issueDate}`, 170, 80, { align: 'right' });

    doc.setFont("helvetica", "bold");
    doc.text(`TO WHOMSOEVER IT MAY CONCERN`, 14, 95);

    doc.setFont("helvetica", "normal");
    const prefix = staff.gender === "Female" ? "Ms." : "Mr.";
    const pronoun1 = staff.gender === "Female" ? "She" : "He";
    const pronoun2 = staff.gender === "Female" ? "her" : "his";

    const paragraph = `This is to certify that ${prefix} ${staff.firstName} ${staff.lastName} has been a dedicated and valued member of Integrity Education, Ambikapur. ${pronoun1} has been officially employed with our institution since ${staff.joinDate}, currently holding the designation of ${staff.role} within the ${staff.academics.primarySubject} Department.\n\nDuring ${pronoun2} tenure, we have found ${pronoun2} to be hardworking, highly committed, and professional in discharging ${pronoun2} duties and responsibilities. ${prefix} ${staff.lastName}'s conduct, character, and pedagogical skills have been exemplary.\n\nWe issue this certificate upon their request and wish them all the success in their future endeavors.`;

    const splitText = doc.splitTextToSize(paragraph, 170);
    doc.text(splitText, 14, 115, { lineHeightFactor: 1.8 });

    doc.setFont("helvetica", "bold");
    doc.text(`Authorized Signatory`, 14, 210);
    doc.setFont("helvetica", "normal");
    doc.text(`Principal / Administrator`, 14, 220);
    doc.text(`Integrity Education`, 14, 230);
    doc.text(`Bagicha ,Jashpur, Chhattisgarh`, 14, 240);

    doc.save(`${staff.firstName}_${staff.lastName}_Dossier_Certificate.pdf`);
  };

  // ==========================================
  // EDIT & SAVE ENGINE
  // ==========================================
  const openEditModal = () => {
    setEditForm({
      firstName: staff.firstName,
      lastName: staff.lastName,
      phone: staff.phone !== "N/A" ? staff.phone : "",
      baseSalary: staff.payroll.baseSalary || 0,
      assignedAssets: [...staff.assignedAssets],
      departmentalRoles: staff.departmentalRoles.map((r: any) => ({ department: r.department, title: r.title }))
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      const { error: profileError } = await supabase
        .from('staff_profiles')
        .update({
          first_name: editForm.firstName,
          last_name: editForm.lastName,
          phone: editForm.phone,
          base_salary: editForm.baseSalary,
          assigned_assets: editForm.assignedAssets
        })
        .eq('id', staffId);
      if (profileError) throw profileError;

      await supabase.from('staff_departmental_roles').delete().eq('staff_id', staffId);
      
      if (editForm.departmentalRoles.length > 0) {
        const rolesToInsert = editForm.departmentalRoles.map(r => ({
          staff_id: staffId,
          department: r.department,
          title: r.title
        }));
        const { error: roleError } = await supabase.from('staff_departmental_roles').insert(rolesToInsert);
        if (roleError) throw roleError;
      }

      await supabase.from('audit_logs').insert([{
        action: 'UPDATE_STAFF_PROFILE',
        details: `Updated profile, assets, and roles for ${staffId}`,
        user_id: 'ADMIN' 
      }]);

      setIsEditModalOpen(false);
      fetchStaffDossier(); 
      alert("Profile, Assets, and Roles successfully updated.");

    } catch (err: any) {
      console.error("Update failed:", err);
      alert("Failed to update profile. Check console.");
    }
  };

  // ==========================================
  // PAYSLIP GENERATION ENGINE
  // ==========================================
  const handleGeneratePayslip = () => {
    if (!staff) return;
    const doc = new jsPDF();
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138); 
    doc.text(`INTEGRITY EDUCATION`, 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(`Ambikapur, Chhattisgarh, India`, 105, 26, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`PAYSLIP - ${currentMonth.toUpperCase()}`, 105, 40, { align: 'center' });

    autoTable(doc, {
      startY: 50,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      body: [
        ['Employee Name:', `${staff.firstName} ${staff.lastName}`, 'Employee ID:', staff.id],
        ['Designation:', staff.role, 'Department:', staff.academics.primarySubject],
        ['PAN Number:', staff.pan, 'EPF UAN:', staff.epfUan],
        ['Bank Account:', staff.payroll.bankDetails, 'Paid Days:', staff.attendance.present.toString()]
      ]
    });

    const totalEarnings = staff.payroll.baseSalary + staff.payroll.allowances;
    
    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY || 80) + 10, // SAFE NAVIGATION ADDED
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, halign: 'center' },
      head: [['EARNINGS', 'AMOUNT (INR)', 'DEDUCTIONS', 'AMOUNT (INR)']],
      body: [
        ['Basic Salary', staff.payroll.baseSalary.toLocaleString(), 'Taxes / Provident Fund', staff.payroll.deductions.toLocaleString()],
        ['Allowances (HRA, TA)', staff.payroll.allowances.toLocaleString(), '', ''],
        [
          { content: 'Gross Earnings', styles: { fontStyle: 'bold' } }, 
          { content: totalEarnings.toLocaleString(), styles: { fontStyle: 'bold' } }, 
          { content: 'Total Deductions', styles: { fontStyle: 'bold' } }, 
          { content: staff.payroll.deductions.toLocaleString(), styles: { fontStyle: 'bold' } }
        ]
      ]
    });

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY || 120) + 5, // SAFE NAVIGATION ADDED
      theme: 'plain',
      body: [
        [{ 
            content: `NET PAYABLE: Rs. ${staff.payroll.netPay.toLocaleString()}/-`, 
            styles: { fontSize: 12, fontStyle: 'bold', textColor: [37, 99, 235], halign: 'right' } 
        }]
      ]
    });

    const signatureY = ((doc as any).lastAutoTable?.finalY || 140) + 40; // SAFE NAVIGATION ADDED
    doc.setFontSize(10);
    doc.setTextColor(0,0,0);
    doc.text("_______________________", 20, signatureY);
    doc.text("Employer Signature", 25, signatureY + 6);
    doc.text("_______________________", 140, signatureY);
    doc.text("Employee Signature", 145, signatureY + 6);

    doc.save(`${staff.firstName}_Payslip_${currentMonth}.pdf`);
  };

  // DYNAMIC LIST HANDLERS
  const addAsset = () => setEditForm({...editForm, assignedAssets: [...editForm.assignedAssets, ""]});
  const updateAsset = (idx: number, val: string) => {
    const newAssets = [...editForm.assignedAssets];
    newAssets[idx] = val;
    setEditForm({...editForm, assignedAssets: newAssets});
  };
  const removeAsset = (idx: number) => setEditForm({...editForm, assignedAssets: editForm.assignedAssets.filter((_, i) => i !== idx)});

  const addRole = () => setEditForm({...editForm, departmentalRoles: [...editForm.departmentalRoles, {department: "", title: ""}]});
  const updateRole = (idx: number, field: "department" | "title", val: string) => {
    const newRoles = [...editForm.departmentalRoles];
    newRoles[idx][field] = val;
    setEditForm({...editForm, departmentalRoles: newRoles});
  };
  const removeRole = (idx: number) => setEditForm({...editForm, departmentalRoles: editForm.departmentalRoles.filter((_, i) => i !== idx)});

  if (isLoading || !staff) return (
    <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading HR Dossier...</p>
    </div>
  );

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      {/* HEADER WITH EXPORT AND EDIT BUTTONS CORRECTLY PLACED */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <Link href="/admin/dashboard/faculty" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <ArrowLeft className="w-4 h-4" /> Back to Staff Directory
        </Link>
        <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={handleExportPDF} className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <FileSignature className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={openEditModal} className="flex-1 sm:flex-none bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* ================= LEFT COLUMN: HR & Identity ================= */}
        <div className="flex flex-col gap-6 lg:gap-8">
          <motion.div variants={item} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600 to-blue-800 -z-0"></div>
            <div className="relative z-10 mt-8">
                <div className="w-32 h-32 rounded-3xl bg-white text-blue-600 border-4 border-white shadow-xl mx-auto flex items-center justify-center font-black text-4xl mb-4 overflow-hidden">
                    {staff.photoUrl ? <img src={staff.photoUrl} alt="Staff Photo" className="w-full h-full object-cover" /> : `${staff.firstName.charAt(0)}${staff.lastName.charAt(0)}`}
                </div>
                <h2 className="text-2xl font-black text-slate-800">{staff.firstName} {staff.lastName}</h2>
                <p className="text-slate-500 font-bold text-sm mb-4">{staff.id}</p>
                <div className="flex flex-col gap-2 items-center">
                    <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-blue-100 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" /> {staff.role}
                    </span>
                    {staff.managementPosition && (
                        <span className="bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-purple-100 flex items-center gap-1.5 shadow-sm">
                            <Star className="w-3.5 h-3.5 fill-current" /> {staff.managementPosition}
                        </span>
                    )}
                </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100 space-y-5 text-left">
                <div className="grid grid-cols-2 gap-4 mb-2">
                    <ProfileRow icon={<Calendar/>} label="D.O.B" value={staff.dob} />
                    <ProfileRow icon={<Activity/>} label="Blood Grp" value={staff.bloodGroup} />
                </div>
                <ProfileRow icon={<Phone/>} label="Mobile No." value={staff.phone} />
                <ProfileRow icon={<Mail/>} label="Email" value={staff.email} />
                <ProfileRow icon={<Users/>} label="Father's Name" value={staff.fatherName} />
                {staff.spouseName && <ProfileRow icon={<Users/>} label="Spouse's Name" value={staff.spouseName} />}
                <ProfileRow icon={<MapPin/>} label="Address" value={staff.address} />
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-red-50 rounded-[2rem] p-6 border border-red-100 shadow-sm relative overflow-hidden">
            <h3 className="font-black text-red-900 text-lg mb-4 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-red-500" /> Emergency Contact
            </h3>
            <div>
                <p className="font-bold text-red-900 text-lg">{staff.emergency.name}</p>
                <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs font-black uppercase tracking-widest text-red-600 bg-red-100 px-2 py-1 rounded">{staff.emergency.relation}</span>
                    <span className="text-sm font-bold text-red-800 flex items-center gap-1"><Phone className="w-3 h-3"/> {staff.emergency.phone}</span>
                </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl text-white">
            <h3 className="font-black text-lg mb-6 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" /> Statutory & Assets
            </h3>
            <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Qualification & Experience</p>
                    <p className="font-bold text-white text-sm">{staff.qualification}</p>
                    <p className="text-xs text-slate-400 mt-1">{staff.experience} exp. (Prev: {staff.previousInstitution})</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">EPF UAN</p>
                        <p className="font-mono text-amber-200 font-bold tracking-widest text-sm">{staff.epfUan}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">PAN</p>
                        <p className="font-mono text-emerald-200 font-bold tracking-widest text-sm">{staff.pan}</p>
                    </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Laptop className="w-3 h-3"/> Assigned School Assets</p>
                    <ul className="space-y-2">
                        {staff.assignedAssets.length > 0 ? staff.assignedAssets.map((asset: string, idx: number) => (
                            <li key={idx} className="text-xs font-medium text-slate-300 bg-white/5 px-3 py-2 rounded-lg border border-white/5 flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400"/> {asset}
                            </li>
                        )) : (
                           <p className="text-xs text-slate-500">No assets assigned.</p>
                        )}
                    </ul>
                </div>
            </div>
          </motion.div>
        </div>

        {/* ================= RIGHT COLUMN: Workload, Salary, Performance ================= */}
        <div className="lg:col-span-2 flex flex-col gap-6 lg:gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <motion.div variants={item} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-0"></div>
                <h3 className="font-black text-slate-800 text-xl mb-6 flex items-center gap-2 relative z-10">
                    <BookOpen className="w-6 h-6 text-purple-500" /> Academics
                </h3>
                <div className="relative z-10 mb-6">
                    <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl mb-3">
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Class Teacher</p>
                        <p className="text-xl font-black text-purple-900">{staff.academics.classTeacherOf}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Students</p>
                            <p className="text-xl font-black text-blue-900">{staff.academics.totalStudentsTaught}</p>
                        </div>
                        <Users className="w-6 h-6 text-blue-200" />
                    </div>
                </div>
                <div className="relative z-10">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Assigned Classes</h4>
                    <div className="space-y-2">
                        {staff.academics.assignedClasses.length > 0 ? staff.academics.assignedClasses.map((cls: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center text-slate-400 font-black text-xs">{i+1}</div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{cls.className} - {cls.section}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">{cls.subject}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-700">{cls.students}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-400 font-medium">Awaiting class assignment.</p>
                        )}
                    </div>
                </div>
              </motion.div>

              <motion.div variants={item} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0"></div>
                <h3 className="font-black text-slate-800 text-xl mb-6 flex items-center gap-2 relative z-10">
                    <Network className="w-6 h-6 text-indigo-500" /> Responsibilities
                </h3>
                <p className="text-sm font-medium text-slate-500 mb-6 relative z-10">
                    Administrative and extracurricular committees assigned to this staff member.
                </p>
                <div className="space-y-4 relative z-10 flex-1">
                    {staff.departmentalRoles.length > 0 ? staff.departmentalRoles.map((role: any, idx: number) => (
                        <div key={idx} className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3 transition-colors hover:bg-indigo-50">
                            <div className="bg-white p-2 rounded-xl shadow-sm text-indigo-500 shrink-0 mt-0.5">
                                <Award className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-bold text-indigo-900">{role.title}</p>
                                <p className="text-xs font-bold text-indigo-600/70 uppercase tracking-widest mt-1">{role.department}</p>
                            </div>
                        </div>
                    )) : (
                         <p className="text-sm text-slate-400 font-medium">No additional roles assigned.</p>
                    )}
                </div>
              </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <motion.div variants={item} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative">
                <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                    <CalendarOff className="w-5 h-5 text-amber-500" /> Leave & Attendance
                </h3>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendance</p>
                        <p className="text-4xl font-black text-slate-800">{staff.attendance.percentage}%</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Present: {staff.attendance.present}</p>
                        <p className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">Absent: {staff.attendance.absent}</p>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Leave Balance</p>
                    <div className="flex justify-between items-center text-sm mb-2"><span className="font-bold text-slate-700">Total Allowed</span><span className="font-black text-slate-900">{staff.attendance.leaveBalance.totalAllowed} Days</span></div>
                    <div className="flex justify-between items-center text-sm mb-2"><span className="font-bold text-slate-700">Leaves Taken</span><span className="font-black text-amber-600">{staff.attendance.leaveBalance.taken} Days</span></div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2"><div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(staff.attendance.leaveBalance.taken / staff.attendance.leaveBalance.totalAllowed) * 100}%` }}></div></div>
                </div>
              </motion.div>

              <motion.div variants={item} className="bg-blue-600 text-white rounded-[2.5rem] p-8 shadow-md relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-[100px] -z-0"></div>
                <h3 className="font-black text-xl mb-6 flex items-center gap-2 relative z-10">
                    <TrendingUp className="w-6 h-6 text-blue-200" /> Performance
                </h3>
                <div className="flex justify-between items-end mb-6 relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Feedback Rating</p>
                        <div className="flex items-center gap-2">
                            <span className="text-4xl font-black">{staff.performance.rating}</span>
                            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Class Pass Rate</p>
                        <p className="text-2xl font-black text-emerald-300">{staff.performance.passPercentage}%</p>
                    </div>
                </div>
                <div className="flex-1 flex items-center relative z-10 bg-white/10 p-4 rounded-2xl border border-white/10">
                    <p className="text-sm font-medium text-blue-50 italic leading-relaxed">
                        "{staff.performance.remark}"
                    </p>
                </div>
              </motion.div>
          </div>

          <motion.div variants={item} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
            <h3 className="font-black text-slate-800 text-xl mb-8 flex items-center gap-2 relative z-10">
                <IndianRupee className="w-6 h-6 text-emerald-500" /> Payroll & Salary Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 pr-0 md:pr-8 md:border-r border-slate-100">
                    <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-500">Basic Salary</span><span className="font-black text-slate-800">₹{(staff.payroll.baseSalary || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-500">Allowances (HRA, TA)</span><span className="font-black text-emerald-600">+ ₹{staff.payroll.allowances.toLocaleString()}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-500">Deductions (Tax, PF)</span><span className="font-black text-red-500">- ₹{staff.payroll.deductions.toLocaleString()}</span></div>
                    <div className="pt-4 border-t border-slate-200 flex justify-between items-center"><span className="text-sm font-black text-slate-800 uppercase tracking-widest">Net Payable</span><span className="text-2xl font-black text-emerald-600">₹{staff.payroll.netPay.toLocaleString()}</span></div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status: {staff.payroll.lastPaid}</p>
                    <div className="flex items-center gap-3 mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-500" /><span className="text-2xl font-black text-slate-800 uppercase tracking-wide">Salary Evaluated</span></div>
                    <p className="text-xs font-bold text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200 inline-block w-max">{staff.payroll.bankDetails}</p>
                    {/* GENERATE PAYSLIP BUTTON CORRECTLY PLACED HERE */}
                    <button onClick={handleGeneratePayslip} className="mt-4 text-xs font-black text-blue-600 uppercase tracking-widest text-left hover:underline transition-all">
                        Generate Payslip &rarr;
                    </button>
                </div>
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* ================= GLOBAL EDIT MODAL ================= */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" /> Complete Profile Edit
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-8 overflow-y-auto">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-black text-slate-800 border-b pb-2">Basic Info & Salary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase mb-2">First Name</label>
                      <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold text-sm text-slate-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase mb-2">Last Name</label>
                      <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold text-sm text-slate-900" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase mb-2">Contact Number</label>
                      <input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold text-sm text-slate-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase mb-2">Base Salary (INR)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
                        <input type="number" value={editForm.baseSalary} onChange={(e) => setEditForm({...editForm, baseSalary: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 outline-none focus:border-blue-500 font-bold text-sm text-slate-900" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Assets */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-black text-slate-800">Assigned School Assets</h3>
                    <button onClick={addAsset} className="text-xs font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-blue-200"><Plus className="w-3 h-3"/> Add Asset</button>
                  </div>
                  {editForm.assignedAssets.map((asset, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input type="text" value={asset} onChange={(e) => updateAsset(idx, e.target.value)} placeholder="e.g. MacBook Air, Math Lab Keys" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-bold text-sm text-slate-900" />
                      <button onClick={() => removeAsset(idx)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                  {editForm.assignedAssets.length === 0 && <p className="text-xs text-slate-400 italic">No assets assigned yet.</p>}
                </div>

                {/* Departmental Roles */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-black text-slate-800">Responsibilities & Roles</h3>
                    <button onClick={addRole} className="text-xs font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-indigo-200"><Plus className="w-3 h-3"/> Add Role</button>
                  </div>
                  {editForm.departmentalRoles.map((role, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input type="text" value={role.department} onChange={(e) => updateRole(idx, "department", e.target.value)} placeholder="Department (e.g. Exam Board)" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-bold text-sm text-slate-900" />
                      <input type="text" value={role.title} onChange={(e) => updateRole(idx, "title", e.target.value)} placeholder="Title (e.g. Coordinator)" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-bold text-sm text-slate-900" />
                      <button onClick={() => removeRole(idx)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  ))}
                  {editForm.departmentalRoles.length === 0 && <p className="text-xs text-slate-400 italic">No extra roles assigned.</p>}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleSaveProfile} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Save Profile & Roles
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function ProfileRow({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
      <div className="flex items-start gap-4">
        <div className="mt-0.5 text-slate-400">{icon}</div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="font-bold text-slate-700 text-sm">{value}</p>
        </div>
      </div>
    );
}