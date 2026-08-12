import { validateFileSize } from '../../utils/validators';
import { useToast } from '../common/Toast';

export default function IDFieldWithUpload({ label, value, onChange, file, onFileSelect, onFileRemove, uppercase }) {
  const { showToast } = useToast();

  const handleFile = (selected) => {
    const err = validateFileSize(selected);
    if (err) { showToast(err, 'error'); return; }
    onFileSelect(selected);
  };

  return (
    <div className="fld">
      <label>{label}</label>
      <div className="id-field-row">
        <input value={value} onChange={onChange} style={uppercase ? { textTransform: 'uppercase' } : undefined} />
        <label className="id-upload-btn" title={`Upload ${label}`}>
          <i className="ti ti-paperclip" />
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
        </label>
      </div>
      {file && (
        <div className="id-file-chip">
          <i className="ti ti-file-check" style={{ color: 'var(--green)' }} />
          <span>{file.name}</span>
          <button type="button" onClick={onFileRemove} aria-label={`Remove ${label} file`}><i className="ti ti-x" /></button>
        </div>
      )}
    </div>
  );
}
