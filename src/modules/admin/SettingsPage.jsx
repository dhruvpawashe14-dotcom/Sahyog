import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import * as adminService from './services/adminService';

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState({ company_name: '', admin_email: '' });

  useEffect(() => {
    adminService.fetchAllSettings().then((rows) => {
      const map = {};
      rows.forEach((r) => { map[r.key] = r.value; });
      setSettings((s) => ({ ...s, ...map }));
    });
  }, []);

  const save = async () => {
    await adminService.updateSetting('company_name', settings.company_name, user.id);
    await adminService.updateSetting('admin_email', settings.admin_email, user.id);
    showToast('Settings saved', 'success');
  };

  return (
    <div>
      <div className="page-hdr"><h1>Settings</h1></div>
      <div className="card form-grid">
        <div className="fld form-full"><label>Company Name</label><input value={settings.company_name} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} /></div>
        <div className="fld form-full"><label>Admin Email</label><input value={settings.admin_email} onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })} /></div>
      </div>
      <div className="page-hdr" style={{ marginTop: 16 }}>
        <button className="btn btn-gold" onClick={save}><i className="ti ti-check" /> Save Settings</button>
      </div>
    </div>
  );
}
