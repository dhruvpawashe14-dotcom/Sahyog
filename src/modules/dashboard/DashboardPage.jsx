import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchDashboardStats, fetchAttentionItems } from './services/dashboardService';
import QuickContact from '../../components/common/QuickContact';

export default function DashboardPage() {
  const { user, profile, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [attention, setAttention] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    fetchDashboardStats({ userId: user.id, isAdmin }).then(setStats).catch(console.error);
    fetchAttentionItems({ userId: user.id, isAdmin }).then(setAttention).catch(console.error);
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card">
          <div className="card-title"><i className="ti ti-clock" style={{ color: 'var(--gold)' }} /> Follow-ups Due</div>
          {!attention ? <div className="dim">Loading...</div> : attention.followups.length === 0 ? <div className="table-empty">Nothing due</div> :
            attention.followups.slice(0, 6).map((f) => (
              <div key={f.id} className="dup-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/leads/${f.id}`)}>
                {f.full_name} <QuickContact mobile={f.mobile} />
                <div className="dim" style={{ fontSize: 11 }}>{f.follow_up_date} · {f.assigned_name}</div>
              </div>
            ))}
        </div>

        <div className="card">
          <div className="card-title"><i className="ti ti-calendar-event" style={{ color: 'var(--gold)' }} /> Upcoming Meetings</div>
          {!attention ? <div className="dim">Loading...</div> : attention.meetings.length === 0 ? <div className="table-empty">Nothing scheduled</div> :
            attention.meetings.slice(0, 6).map((m) => (
              <div key={m.id} className="dup-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/calendar')}>
                {m.title} {m.with_name ? `— ${m.with_name}` : ''}
                <div className="dim" style={{ fontSize: 11 }}>{m.meeting_date}{m.meeting_time ? ` · ${m.meeting_time.slice(0, 5)}` : ''} · {m.assigned_name}</div>
              </div>
            ))}
        </div>

        <div className="card">
          <div className="card-title"><i className="ti ti-refresh" style={{ color: 'var(--amber)' }} /> Renewals Due (30 days)</div>
          {!attention ? <div className="dim">Loading...</div> : attention.renewals.length === 0 ? <div className="table-empty">None coming up</div> :
            attention.renewals.slice(0, 6).map((r) => (
              <div key={r.id} className="dup-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/clients/${r.client_id}`)}>
                {r.clients?.full_name || r.policy_number} <QuickContact mobile={r.clients?.mobile} />
                <div className="dim" style={{ fontSize: 11 }}>{r.product} · renews {r.renewal_date}</div>
              </div>
            ))}
        </div>

        <div className="card">
          <div className="card-title"><i className="ti ti-alert-triangle" style={{ color: 'var(--red)' }} /> SLA Breached Tickets</div>
          {!attention ? <div className="dim">Loading...</div> : attention.breachedTickets.length === 0 ? <div className="table-empty">All on track</div> :
            attention.breachedTickets.slice(0, 6).map((t) => (
              <div key={t.id} className="dup-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/tickets/${t.id}`)}>
                <span className="badge b-red">{t.ticket_ref}</span> {t.subject}
                <div className="dim" style={{ fontSize: 11 }}>{t.priority} priority · {t.assigned_name}</div>
              </div>
            ))}
        </div>
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
