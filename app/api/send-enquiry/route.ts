import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialized with your Resend API Key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { speakerName, speakerEmail, organizerName, organizerEmail, sessionDetails } = await req.json();

    if (!speakerEmail) {
      return NextResponse.json({ error: 'Speaker email not configured' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'SpeakerHub <onboarding@resend.dev>', // Default testing domain
      to: [speakerEmail],
      replyTo: organizerEmail,
      subject: `New Session Invitation from ${organizerName} via SpeakerHub`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; rounded: 10px;">
          <h2 style="color: #2563eb;">New Speaking Invitation!</h2>
          <p>Hi <strong>${speakerName}</strong>,</p>
          <p>You have received a new speaking request through SpeakerHub.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p><strong>Organizer Name:</strong> ${organizerName}</p>
          <p><strong>Organizer Email:</strong> <a href="mailto:${organizerEmail}">${organizerEmail}</a></p>
          <p><strong>Session Proposal & Details:</strong></p>
          <blockquote style="background: #f8fafc; padding: 12px; border-left: 4px solid #2563eb; margin: 10px 0;">
            ${sessionDetails.replace(/\n/g, '<br/>')}
          </blockquote>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">You can reply directly to this email to get in touch with ${organizerName}.</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}