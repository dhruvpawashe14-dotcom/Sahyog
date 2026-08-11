export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard', path: '/', adminOnly: false },
  { id: 'clients', label: 'Clients', icon: 'ti-users', path: '/clients', adminOnly: false },
  { id: 'leads', label: 'Leads', icon: 'ti-user-plus', path: '/leads', adminOnly: false },
  { id: 'pipeline', label: 'Pipeline', icon: 'ti-layout-kanban', path: '/pipeline', adminOnly: false },
  { id: 'claims', label: 'Claims', icon: 'ti-file-invoice', path: '/claims', adminOnly: false },
  { id: 'tickets', label: 'Tickets', icon: 'ti-ticket', path: '/tickets', adminOnly: false },
  { id: 'kyc', label: 'KYC Vault', icon: 'ti-file-certificate', path: '/kyc', adminOnly: false },
  { id: 'tasks', label: 'Tasks', icon: 'ti-checklist', path: '/tasks', adminOnly: false },
  { id: 'calendar', label: 'Calendar', icon: 'ti-calendar', path: '/calendar', adminOnly: false },
  { id: 'audit', label: 'Audit Log', icon: 'ti-list-details', path: '/audit', adminOnly: true },
  { id: 'employees', label: 'Employees', icon: 'ti-building-community', path: '/employees', adminOnly: true },
  { id: 'settings', label: 'Settings', icon: 'ti-settings', path: '/settings', adminOnly: true },
];
