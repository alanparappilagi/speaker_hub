import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: 'Missing Resend API Key' }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);
    const { speakerName, speakerEmail, organizerName, organizerEmail, status, eventDetails } = await req.json();

    const isAccepted = status === 'accepted';
    const actionWord = isAccepted ? 'Accepted' : 'Declined';
    const badgeColor = isAccepted ? '#10b981' : '#f43f5e';

    const data = await resend.emails.send({
      from: 'SpeakUp <onboarding@resend.dev>',
      to: organizerEmail,
      replyTo: speakerEmail,
      subject: `Speaker Invitation ${actionWord}: ${speakerName} on SpeakUp`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="margin-bottom: 20px;">
            <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; background-color: ${badgeColor}15; color: ${badgeColor}; border: 1px solid ${badgeColor}30; padding: 4px 8px; border-radius: 6px;">
              Invitation ${actionWord}
            </span>
          </div>
          
          <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 20px;">
            ${speakerName} has ${actionWord.toLowerCase()} your session invitation
          </h2>

          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi <strong>${organizerName}</strong>,<br/>
            ${
              isAccepted
                ? `Great news! <strong>${speakerName}</strong> has accepted your invitation. You can reply directly to this email to coordinate schedules, logistics, and presentation requirements.`
                : `Thank you for your invitation. <strong>${speakerName}</strong> is unable to take on this session at this time due to scheduling or availability constraints.`
            }
          </p>

          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Your Original Proposal:</p>
            <p style="margin: 0; font-size: 13px; color: #334155; white-space: pre-line;">${eventDetails}</p>
          </div>

          <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; margin: 0;">
            Sent via <strong>SpeakUp</strong> — Open Resource Person Directory.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}