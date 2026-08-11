import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './modules/auth/LoginPage';
import DashboardPage from './modules/dashboard/DashboardPage';
import ClientsListPage from './modules/clients/ClientsListPage';
import ClientFormPage from './modules/clients/ClientFormPage';
import ClientDetailPage from './modules/clients/ClientDetailPage';
import TicketsListPage from './modules/tickets/TicketsListPage';
import TicketDetailPage from './modules/tickets/TicketDetailPage';
import LeadsListPage from './modules/leads/LeadsListPage';
import LeadFormPage from './modules/leads/LeadFormPage';
import LeadDetailPage from './modules/leads/LeadDetailPage';
import PipelinePage from './modules/leads/PipelinePage';
import ClaimsListPage from './modules/claims/ClaimsListPage';
import ClaimFormPage from './modules/claims/ClaimFormPage';
import ClaimDetailPage from './modules/claims/ClaimDetailPage';
import TasksPage from './modules/tasks/TasksPage';
import CalendarPage from './modules/meetings/CalendarPage';
import KycVaultPage from './modules/documents/KycVaultPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute><AppLayout title="Sahyog CRM" /></ProtectedRoute>}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsListPage />} />
              <Route path="/clients/new" element={<ClientFormPage />} />
              <Route path="/clients/:id" element={<ClientDetailPage />} />
              <Route path="/leads" element={<LeadsListPage />} />
              <Route path="/leads/new" element={<LeadFormPage />} />
              <Route path="/leads/:id" element={<LeadDetailPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/claims" element={<ClaimsListPage />} />
              <Route path="/claims/new" element={<ClaimFormPage />} />
              <Route path="/claims/:id" element={<ClaimDetailPage />} />
              <Route path="/tickets" element={<TicketsListPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
              <Route path="/kyc" element={<KycVaultPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="*" element={<DashboardPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
