import { validateFileSize } from '../../utils/validators';
import { useToast } from '../common/Toast';

// Some IDs (Aadhaar, Driving License, Voter ID) have a front AND a back —
// this accepts multiple files per field, not just one, so both sides can be
// attached under the same document.
export default function IDFieldWithUpload({ label, value, onChange, files = [], onFilesSelect, onFileRemove, uppercase, hint }) {
  const { showToast } = useToast();

  const handleFiles = (selected) => {
    const valid = [];
    for (const f of Array.from(selected)) {
      const err = validateFileSize(f);
      if (err) { showToast(err, 'error'); continue; }
      valid.push(f);
    }
    if (valid.length) onFilesSelect(valid);
  };

  return (
    <div className="fld">
      <label>{label}</label>
      <div className="id-field-row">
        <input value={value} onChange={onChange} style={uppercase ? { textTransform: 'uppercase' } : undefined} />
        <label className="id-upload-btn" title={`Upload ${label} — select multiple for front & back`}>
          <i className="ti ti-paperclip" />
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
            onChange={(e) => e.target.files.length && handleFiles(e.target.files)} />
        </label>
      </div>
      {hint && <div style={{ fontSize: 10.5, color: 'var(--text4)', marginTop: 2 }}>{hint}</div>}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {files.map((file, idx) => (
            <div key={idx} className="id-file-chip" style={{ marginTop: 0 }}>
              <i className="ti ti-file-check" style={{ color: 'var(--green)' }} />
              <span>{file.name}</span>
              <button type="button" onClick={() => onFileRemove(idx)} aria-label={`Remove ${file.name}`}><i className="ti ti-x" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
