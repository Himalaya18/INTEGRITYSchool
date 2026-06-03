// Path: app/api/principal/dashboard/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/supabase";

export async function GET() {
  try {
    // 1. Fetch Total Students & Teachers (Lightning fast count)
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    const { count: totalTeachers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher');

    // 2. Financial Metrics
    const { data: fees } = await supabase.from('fees').select('amount, status');
    
    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    if (fees) {
      fees.forEach(fee => {
        if (fee.status === 'Paid') totalCollected += Number(fee.amount);
        if (fee.status === 'Pending') totalPending += Number(fee.amount);
        if (fee.status === 'Overdue') totalOverdue += Number(fee.amount);
      });
    }

    // 3. Pending Leave Requests
    const { count: pendingLeavesCount } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');

    // 4. Recent Transactions
    const { data: recentTransactions } = await supabase
      .from('fees')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      metrics: {
        totalStudents: totalStudents || 0,
        totalTeachers: totalTeachers || 0,
        attendanceRate: "95.4", // We can wire up live attendance next!
        revenueCollected: totalCollected || 0,
        revenuePending: totalPending || 0,
        revenueOverdue: totalOverdue || 0,
        pendingLeaves: pendingLeavesCount || 0
      },
      transactions: recentTransactions || []
    }, { status: 200 });

  } catch (error) {
    console.error("Supabase API Error:", error);
    return NextResponse.json({ message: "Failed to process analytics." }, { status: 500 });
  }
}