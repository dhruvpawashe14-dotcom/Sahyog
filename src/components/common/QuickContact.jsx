// Click-to-call and click-to-WhatsApp, for any phone number shown anywhere in the app.
export default function QuickContact({ mobile, size = 'sm' }) {
  if (!mobile) return null;
  const clean = mobile.replace(/[^\d+]/g, '');
  const waNumber = clean.startsWith('+') ? clean.slice(1) : (clean.length === 10 ? '91' + clean : clean);
  return (
    <span className="quick-contact" onClick={(e) => e.stopPropagation()}>
      <a href={`tel:${clean}`} className="qc-btn qc-call" title="Call"><i className="ti ti-phone" /></a>
      <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="qc-btn qc-wa" title="WhatsApp"><i className="ti ti-brand-whatsapp" /></a>
    </span>
  );
}
