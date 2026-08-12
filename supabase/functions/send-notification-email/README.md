# Email notification fallback — deployment guide

This Edge Function sends an email whenever someone gets an in-app notification (assignment,
status change, ticket tag), so people don't miss things when they're not logged in.

## One-time setup

1. **Install the Supabase CLI** (if you don't have it):
   ```
   npm install -g supabase
   ```

2. **Log in and link your project:**
   ```
   supabase login
   supabase link --project-ref hnomftsnwpmxiareteei
   ```
   (Your project ref is the part before `.supabase.co` in your project URL.)

3. **Create a free Resend account** at resend.com — this is the email-sending service.
   Free tier: 100 emails/day, 3,000/month, no credit card needed to start.

4. **Get your Resend API key** from the Resend dashboard (API Keys section).

5. **Set the secrets** (never commit these — they're stored securely by Supabase, not in your code):
   ```
   supabase secrets set RESEND_API_KEY=re_your_key_here
   supabase secrets set EMAIL_FROM="MyAdvisor CRM <onboarding@resend.dev>"
   ```
   `onboarding@resend.dev` works immediately for testing. To send from your own domain
   (e.g. `notifications@myadvisorcrm.co.in`), verify that domain in Resend first — Resend
   walks you through adding a couple of DNS records, same idea as the Railway domain setup.

6. **Deploy the function:**
   ```
   supabase functions deploy send-notification-email
   ```

That's it — no code changes needed after this. The app already calls this function
automatically every time `notify()` fires (assignments, status changes, ticket tags).

## Testing it worked

Assign a ticket/lead/claim to a colleague and check their email. If it doesn't arrive,
check Supabase Dashboard → Edge Functions → send-notification-email → Logs for errors.
The in-app notification will still work even if email fails — this is designed as a
best-effort fallback, not a hard dependency.
