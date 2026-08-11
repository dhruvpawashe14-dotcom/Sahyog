import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchDashboardStats } from './services/dashboardService';

export default function DashboardPage() {
  const { user, profile, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchDashboardStats({ userId: user.id, isAdmin }).then(setStats).catch(console.error);
  }, [user, isAdmin]);

  return (
    <div>
      <div className="page-hdr">
        <div>
          <h1>Good morning, <span className="accent">{profile?.full_name}</span></h1>
          <p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      <div className="stat-grid">
        <StatCard icon="ti-users" label="Total Clients" value={stats?.totalClients} />
        <StatCard icon="ti-ticket" label="Open Tickets" value={stats?.openTickets} />
        <StatCard icon="ti-certificate" label="Policies Issued" value={stats?.policiesIssued} />
        <StatCard icon="ti-clock" label="Follow-ups Today" value={stats?.followupsToday} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><i className={`ti ${icon}`} /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
    </div>
  );
}
