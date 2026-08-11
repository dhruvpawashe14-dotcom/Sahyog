-- ═══════════════════════════════════════════════════════════
-- MIGRATION 003 — Storage buckets for documents & ticket attachments
-- Run in Supabase SQL Editor (bucket creation), then set policies
-- in Storage > Policies UI, or via the SQL below.
-- ═══════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload; admins can read all; employees read their own clients' docs.
CREATE POLICY "kyc_upload_authenticated" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc-documents' AND auth.role() = 'authenticated');

CREATE POLICY "kyc_read_authenticated" ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND auth.role() = 'authenticated');

CREATE POLICY "ticket_attach_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ticket-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "ticket_attach_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'ticket-attachments' AND auth.role() = 'authenticated');
