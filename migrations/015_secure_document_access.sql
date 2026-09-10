-- ═══════════════════════════════════════════════════════════
-- MIGRATION 015 — Secure document/attachment access
--
-- WHY THIS MIGRATION EXISTS:
--
-- kyc-documents, claim-documents and ticket-attachments are all PRIVATE
-- storage buckets (public = false, set in migrations 003/006 — correct,
-- these hold PAN/Aadhaar/passport numbers, medical notes, and claim
-- files). But the app code was calling storage.getPublicUrl() and saving
-- that permanent "public" link straight into the database:
--   - Against a private bucket that link does not actually serve the
--     file (the /object/public/ route only works for public buckets),
--     so "View" was silently broken for these documents.
--   - Even if it had worked, a permanent, unauthenticated, never-expiring
--     link to a KYC/claim document sitting in a database column is a
--     serious data-exposure risk — anyone who ever sees that URL (logs,
--     backups, a shared screenshot) has standing access to the file
--     forever, with no login required.
--
-- Fix: every document row keeps its storage PATH (not a URL). The app
-- now mints a short-lived signed URL (5 minutes) on demand, only at the
-- moment someone clicks "View" — nothing sensitive is stored or reused.
--
-- This migration only adds columns and does NOT delete the old file_url
-- columns (kept for now so nothing errors on rows written before this
-- migration). New code stops writing to file_url going forward. You may
-- drop file_url later once you've confirmed nothing in your reporting
-- still reads it.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE claim_documents  ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE ticket_comments  ADD COLUMN IF NOT EXISTS file_path TEXT;
-- documents.file_path already existed (migration 001) — nothing to add there.

-- Best-effort backfill for existing rows: extract the path portion out of
-- the old public-style URL so old files remain openable via a signed URL.
-- If a bucket was ever actually public and got objects moved/renamed since,
-- this backfill may miss some rows — those will just show "file unavailable"
-- in the UI rather than breaking anything.
UPDATE claim_documents
SET file_path = substring(file_url FROM '/claim-documents/(.*)$')
WHERE file_path IS NULL AND file_url IS NOT NULL;

UPDATE ticket_comments
SET file_path = substring(file_url FROM '/ticket-attachments/(.*)$')
WHERE file_path IS NULL AND file_url IS NOT NULL AND is_file = TRUE;

UPDATE documents
SET file_path = substring(file_url FROM '/kyc-documents/(.*)$')
WHERE file_path IS NULL AND file_url IS NOT NULL;
