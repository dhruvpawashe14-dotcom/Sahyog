# Testing

## Continuous Integration (CI)

`.github/workflows/ci.yml` runs `npm test` and `npm run build` automatically on every push
to `main` or `staging`, and on every pull request. Check the "Actions" tab on GitHub to see
results — a red X means something broke.

**Important nuance:** CI runs in parallel with Railway's deploy, not before it, since Railway
watches pushes to `main` directly. To make tests an actual gate (not just a report card),
use the staging workflow from `docs/STAGING_SETUP.md`: push to `staging` → let CI go green
→ only then merge into `main` → Railway deploys the already-verified code. Pushing straight
to `main` still works exactly as before, CI just won't have had a chance to stop it first.

## Unit / component tests (run in CI-safe, no network needed)

```
npm test          # run once
npm run test:watch # watch mode while developing
```

Currently covers:
- `src/utils/__tests__/validators.test.js` — PAN/Aadhaar/mobile/email/file-size validation
- `src/modules/claims/__tests__/claimFieldConfig.test.js` — the Health/Motor/Non-Motor
  field-splitting logic (the most complex, error-prone part of the claims module)
- `src/modules/auth/__tests__/LoginPage.test.jsx` — the login flow: empty submit, success,
  failure

Add new tests alongside the code they cover, in a `__tests__` folder next to it.

## RLS / access-control smoke test (manual, needs real credentials)

```
node scripts/rls-smoke-test.mjs
```

This makes real calls against your live Supabase project with two real user accounts, so
it's not part of `npm test` or CI. Run it manually after any RLS policy or migration change
— see the comment at the top of `scripts/rls-smoke-test.mjs` for setup.

## What's not covered yet

This is a starting point, not full coverage. Not yet tested: claim/lead/ticket CRUD forms
end-to-end, the pipeline drag-and-drop, Excel import/export, file uploads. Worth adding as
the highest-risk areas are identified through real usage.
