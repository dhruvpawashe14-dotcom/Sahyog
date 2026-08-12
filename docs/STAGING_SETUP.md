# Setting up a staging environment

Right now every push goes straight to your live team. This sets up a safe testing ground
in between — a full copy of the app connected to a separate database, so you (or I) can
verify a change actually works before your team sees it.

## Step 1 — Create a staging branch

```
git checkout -b staging
git push -u origin staging
```

Going forward: new features get pushed to `staging` first, tested, then merged into `main`
(which stays connected to production) once confirmed working.

## Step 2 — Create a second Supabase project (staging database)

Why a separate project, not just a separate branch of code: testing a bad migration against
your real client data is the actual risk this is meant to prevent. Code alone isn't enough.

1. Supabase Dashboard → New Project → name it something like `myadvisor-crm-staging`.
2. Run all your migration files (`migrations/001...` through the latest) against this new
   project, in order, same as you did for production.
3. Create a couple of test users in this staging project's Auth (doesn't need to match your
   real team) so you have something to log in with.
4. Note this project's URL and anon key (Settings → API) — you'll need them in Step 3.

Free tier covers 2 Supabase projects, so this costs nothing extra.

## Step 3 — Create a staging environment in Railway

1. Railway → your project → click the environment dropdown (currently shows "production")
   → "New Environment" → name it `staging`.
2. In the new staging environment, go to your service → Settings → make sure it's connected
   to the `staging` git branch (not `main`).
3. Go to Variables for this staging environment specifically, and set:
   - `VITE_SUPABASE_URL` = your staging Supabase project's URL
   - `VITE_SUPABASE_ANON_KEY` = your staging Supabase project's anon key
4. Railway will give this environment its own URL, something like
   `myadvisor-crm-staging.up.railway.app` — bookmark this for testing.

## Going forward — the new workflow

1. New feature/fix → push to `staging` branch → auto-deploys to the staging URL.
2. Test it there with the staging Supabase project's test users — nothing here touches
   real client data.
3. Once confirmed working → merge `staging` into `main` → production deploys automatically,
   same as before.

This adds one extra step (test on staging first) but means a broken migration or a bug
never reaches your team's actual working data before you've verified it.
