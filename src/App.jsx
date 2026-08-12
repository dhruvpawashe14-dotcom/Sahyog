import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './modules/auth/LoginPage';
import DashboardPage from './modules/dashboard/DashboardPage';
import { DEFAULT_APP_NAME } from './constants/branding';

// Code-split everything else — cuts the initial bundle down (Phase 3: performance optimisation).
const ClientsListPage = lazy(() => import('./modules/clients/ClientsListPage'));
const ClientFormPage = lazy(() => import('./modules/clients/ClientFormPage'));
const ClientDetailPage = lazy(() => import('./modules/clients/ClientDetailPage'));
const TicketsListPage = lazy(() => import('./modules/tickets/TicketsListPage'));
const TicketFormPage = lazy(() => import('./modules/tickets/TicketFormPage'));
const TicketDetailPage = lazy(() => import('./modules/tickets/TicketDetailPage'));
const LeadsPage = lazy(() => import('./modules/leads/LeadsPage'));
const LeadFormPage = lazy(() => import('./modules/leads/LeadFormPage'));
const LeadDetailPage = lazy(() => import('./modules/leads/LeadDetailPage'));
const ClaimsListPage = lazy(() => import('./modules/claims/ClaimsListPage'));
const ClaimFormPage = lazy(() => import('./modules/claims/ClaimFormPage'));
const ClaimDetailPage = lazy(() => import('./modules/claims/ClaimDetailPage'));
const TasksPage = lazy(() => import('./modules/tasks/TasksPage'));
const CalendarPage = lazy(() => import('./modules/meetings/CalendarPage'));
const KycVaultPage = lazy(() => import('./modules/documents/KycVaultPage'));
const AuditLogPage = lazy(() => import('./modules/admin/AuditLogPage'));
const EmployeesPage = lazy(() => import('./modules/admin/EmployeesPage'));
const SettingsPage = lazy(() => import('./modules/admin/SettingsPage'));
const ReportsPage = lazy(() => import('./modules/reports/ReportsPage'));

function PageLoader() {
  return <div className="full-loader"><i className="spin ti ti-loader" /></div>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute><AppLayout title={DEFAULT_APP_NAME} /></ProtectedRoute>}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/clients" element={<ClientsListPage />} />
                <Route path="/clients/new" element={<ClientFormPage />} />
                <Route path="/clients/:id" element={<ClientDetailPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/leads/new" element={<LeadFormPage />} />
                <Route path="/leads/:id" element={<LeadDetailPage />} />
                <Route path="/pipeline" element={<LeadsPage />} />
                <Route path="/claims" element={<ClaimsListPage />} />
                <Route path="/claims/new" element={<ClaimFormPage />} />
                <Route path="/claims/:id" element={<ClaimDetailPage />} />
                <Route path="/tickets" element={<TicketsListPage />} />
                <Route path="/tickets/new" element={<TicketFormPage />} />
                <Route path="/tickets/:id" element={<TicketDetailPage />} />
                <Route path="/kyc" element={<KycVaultPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/reports" element={<ProtectedRoute adminOnly><ReportsPage /></ProtectedRoute>} />
                <Route path="/audit" element={<ProtectedRoute adminOnly><AuditLogPage /></ProtectedRoute>} />
                <Route path="/employees" element={<ProtectedRoute adminOnly><EmployeesPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute adminOnly><SettingsPage /></ProtectedRoute>} />
                <Route path="*" element={<DashboardPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
