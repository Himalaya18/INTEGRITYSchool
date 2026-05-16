import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend using your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentName, guardianName, whatsappNumber, guardianEmail, village, className } = body;

    // 1. Send Email to the School Admin
    await resend.emails.send({
      from: 'onboarding@resend.dev', // Note: For testing, Resend requires you to use this email
      to: 'himalaya1812@gmail.com', // Your school's email
      subject: `New Admission Inquiry: ${studentName} - ${className}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1e3a8a;">
            <h2 style="color: #0284c7;">New Admission Inquiry Received</h2>
            <p><strong>Student Name:</strong> ${studentName}</p>
            <p><strong>Guardian Name:</strong> ${guardianName}</p>
            <p><strong>WhatsApp Number:</strong> ${whatsappNumber}</p>
            <p><strong>Email Address:</strong> ${guardianEmail || 'Not provided'}</p>
            <p><strong>Village / Ward:</strong> ${village}</p>
            <p><strong>Class:</strong> ${className}</p>
        </div>
      `
    });

    // 2. Send "Thank You" Email to the Parent (if they provided an email)
    if (guardianEmail) {
      await resend.emails.send({
        from: 'onboarding@resend.dev', // Note: To send from your own domain, you must verify your domain in Resend later
        to: guardianEmail, 
        subject: `Thank you for your inquiry - Integrity S & E School`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #1e3a8a;">
            <h3>Dear ${guardianName},</h3>
            <p>Thank you for your interest in Integrity S & E School for <strong>${studentName}</strong>'s admission into <strong>${className}</strong>.</p>
            <p>We have received your details successfully. Our admissions team will review your inquiry and contact you shortly on your WhatsApp number (${whatsappNumber}).</p>
            <br/>
            <p>Warm Regards,</p>
            <p><strong>Admissions Office</strong><br/>Integrity S & E School</p>
          </div>
        `
      });
    }

    // Return success response to the frontend
    return NextResponse.json({ message: 'Inquiry submitted successfully' }, { status: 200 });

  } catch (error) {
    console.error("Error sending email via Resend:", error);
    return NextResponse.json({ message: 'Failed to submit inquiry' }, { status: 500 });
  }
}