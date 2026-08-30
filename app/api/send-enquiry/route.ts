import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: 'Missing Resend API Key' }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);
    const { speakerName, speakerEmail, organizerName, organizerEmail, sessionDetails } = await req.json();

    const data = await resend.emails.send({
      from: 'SpeakUp <onboarding@resend.dev>',
      to: speakerEmail,
      replyTo: organizerEmail,
      subject: `New Session Invitation on SpeakUp from ${organizerName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb;">New Speaking Invitation Received</h2>
          <p>Hi <strong>${speakerName}</strong>,</p>
          <p>You have received a direct speaking invitation via <strong>SpeakUp</strong>.</p>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0;"><strong>Organizer Name:</strong> ${organizerName}</p>
            <p style="margin: 0 0 8px 0;"><strong>Organizer Email:</strong> <a href="mailto:${organizerEmail}">${organizerEmail}</a></p>
            <p style="margin: 0 0 4px 0;"><strong>Details & Proposal:</strong></p>
            <p style="white-space: pre-line; margin: 0;">${sessionDetails}</p>
          </div>
          <p style="font-size: 12px; color: #64748b;">You can reply directly to this email to get in touch with the organizer.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}