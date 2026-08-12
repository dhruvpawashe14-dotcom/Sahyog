// Supabase Edge Function — sends an email fallback for in-app notifications.
// Deploy: supabase functions deploy send-notification-email
// Secrets needed (set via `supabase secrets set`):
//   RESEND_API_KEY      — from resend.com
//   EMAIL_FROM          — e.g. "MyAdvisor CRM <notifications@yourdomain.com>"
//                          (use "onboarding@resend.dev" for testing before you verify a domain)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase, no need to set.
//
// This function looks up the recipient's email from `profiles` using the service role key
// (bypassing RLS, which is safe here since this runs server-side only, never in the browser),
// then sends via Resend's API. If email fails, it's logged but never blocks the in-app
// notification, which is inserted separately by the frontend before this is called.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const { userId, title, body } = await req.json();
    if (!userId || !title) {
      return new Response(JSON.stringify({ error: 'userId and title are required' }), { status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileErr || !profile?.email) {
      return new Response(JSON.stringify({ error: 'Recipient not found' }), { status: 404 });
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    const fromAddress = Deno.env.get('EMAIL_FROM') || 'onboarding@resend.dev';

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: profile.email,
        subject: title,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1F5FA8;">${title}</h2>
            <p style="color: #333;">${body || ''}</p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">
              You're receiving this because you have a notification waiting in MyAdvisor CRM.
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Resend API error:', errText);
      return new Response(JSON.stringify({ error: 'Email send failed', detail: errText }), { status: 502 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error('Edge function error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
