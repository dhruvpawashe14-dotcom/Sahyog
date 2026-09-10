import { supabase } from './client';

// All document buckets (kyc-documents, claim-documents, ticket-attachments) are
// PRIVATE buckets (see migrations 003/006). A permanent getPublicUrl() link does
// not work against a private bucket, and — more importantly — must never be
// stored or reused, since these documents can hold PAN/Aadhaar/passport numbers,
// medical notes, and claim files. Always mint a short-lived signed URL at the
// moment the file is actually opened, and never persist it.
const DEFAULT_EXPIRY_SECONDS = 300; // 5 minutes — long enough to open/download, short enough to not linger

export async function getSignedFileUrl(bucket, path, expiresIn = DEFAULT_EXPIRY_SECONDS) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

// Batch version — for screens that render several files at once (e.g. a ticket
// thread with multiple attachments/voice notes). Returns a Map keyed by path.
export async function getSignedFileUrls(bucket, paths, expiresIn = DEFAULT_EXPIRY_SECONDS) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (uniquePaths.length === 0) return new Map();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(uniquePaths, expiresIn);
  if (error) throw error;
  const map = new Map();
  data.forEach((row) => { if (row.signedUrl) map.set(row.path, row.signedUrl); });
  return map;
}
