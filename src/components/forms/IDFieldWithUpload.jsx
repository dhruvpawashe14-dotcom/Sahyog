export default function IDFieldWithUpload({ label, value, onChange, file, onFileSelect, onFileRemove, uppercase }) {
  return (
    <div className="fld">
      <label>{label}</label>
      <div className="id-field-row">
        <input value={value} onChange={onChange} style={uppercase ? { textTransform: 'uppercase' } : undefined} />
        <label className="id-upload-btn" title={`Upload ${label}`}>
          <i className="ti ti-paperclip" />
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && onFileSelect(e.target.files[0])} />
        </label>
      </div>
      {file && (
        <div className="id-file-chip">
          <i className="ti ti-file-check" style={{ color: 'var(--green)' }} />
          <span>{file.name}</span>
          <button type="button" onClick={onFileRemove}><i className="ti ti-x" /></button>
        </div>
      )}
    </div>
  );
}
