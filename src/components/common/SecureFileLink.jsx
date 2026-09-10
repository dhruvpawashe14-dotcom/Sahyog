import { useState } from 'react';
import { getSignedFileUrl } from '../../services/supabase/secureStorage';

// Replaces plain `<a href={permanentPublicUrl}>` for private-bucket files.
// The signed URL is fetched only when clicked, used once, and never stored
// in component state or the DOM — so nothing sensitive lingers longer than
// the click itself.
export default function SecureFileLink({ bucket, path, children = 'View', className = 'link-btn', style }) {
  const [loading, setLoading] = useState(false);

  const open = async () => {
    if (!path || loading) return;
    setLoading(true);
    try {
      const url = await getSignedFileUrl(bucket, path);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Fails closed — no link opens rather than falling back to any stored URL.
      alert("Couldn't open this file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!path) return null;

  return (
    <button type="button" className={className} style={style} onClick={open} disabled={loading}>
      {loading ? 'Opening…' : children}
    </button>
  );
}
