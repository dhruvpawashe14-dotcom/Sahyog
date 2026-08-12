import { useEffect, useState } from 'react';
import { fetchSetting } from '../modules/admin/services/adminService';
import { DEFAULT_APP_NAME } from '../constants/branding';

// Post-login pages can pull the live company name from Settings (app_settings table),
// so renaming the org doesn't require a redeploy. The login screen itself can't use this
// (app_settings requires an authenticated session to read), so it uses DEFAULT_APP_NAME directly.
export function useCompanyName() {
  const [name, setName] = useState(DEFAULT_APP_NAME);
  useEffect(() => {
    fetchSetting('company_name')
      .then((row) => { if (row?.value) setName(row.value); })
      .catch(() => {}); // fall back to default silently
  }, []);
  return name;
}
