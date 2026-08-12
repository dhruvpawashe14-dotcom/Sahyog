// Shared validation rules — used both for inline form feedback and before any upload.

export const MAX_FILE_SIZE_MB = 100;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function validateFileSize(file) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${file.name} is ${(file.size / (1024 * 1024)).toFixed(1)} MB — max allowed is ${MAX_FILE_SIZE_MB} MB.`;
  }
  return null;
}

// Filters a FileList/array down to files that pass the size check, returning both the
// valid files and human-readable errors for any that were rejected.
export function filterValidFiles(files) {
  const valid = [];
  const errors = [];
  for (const file of Array.from(files)) {
    const err = validateFileSize(file);
    if (err) errors.push(err);
    else valid.push(file);
  }
  return { valid, errors };
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAAR_REGEX = /^\d{12}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePAN(value) {
  if (!value) return null; // optional field, only validate format if provided
  return PAN_REGEX.test(value.toUpperCase()) ? null : 'PAN should be 10 characters like ABCDE1234F';
}

export function validateAadhaar(value) {
  if (!value) return null;
  return AADHAAR_REGEX.test(value) ? null : 'Aadhaar should be exactly 12 digits';
}

export function validateMobile(value) {
  if (!value) return null;
  return MOBILE_REGEX.test(value) ? null : 'Mobile should be a 10-digit number starting with 6-9';
}

export function validateEmail(value) {
  if (!value) return null;
  return EMAIL_REGEX.test(value) ? null : 'Please enter a valid email address';
}
