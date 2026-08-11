-- ═══════════════════════════════════════════════════════════
-- MIGRATION 006 — Storage bucket for claim documents
-- (kyc-documents and ticket-attachments were created in 003;
-- claims got their own table in 004 but no storage bucket yet)
-- ═══════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('claim-documents', 'claim-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "claim_docs_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'claim-documents' AND auth.role() = 'authenticated');

CREATE POLICY "claim_docs_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'claim-documents' AND auth.role() = 'authenticated');
