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
              <Route path="/tickets" element={<TicketsListPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
