import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchDashboardStats, fetchAttentionItems, fetchRecentActivity } from './services/dashboardService';
import QuickContact from '../../components/common/QuickContact';
import { capitalizeWords } from '../../utils/text';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const QUICK_ACTIONS = [
  { label: 'Add Client', icon: 'ti-user-plus', path: '/clients/new' },
  { label: 'Add Lead', icon: 'ti-user-plus', path: '/leads/new' },
  { label: 'New Ticket', icon: 'ti-ticket', path: '/tickets/new' },
  { label: 'File Claim', icon: 'ti-file-plus', path: '/claims/new' },
  { label: 'Schedule Meeting', icon: 'ti-calendar-plus', path: '/calendar' },
];

export default function DashboardPage() {
  const { user, profile, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [attention, setAttention] = useState(null);
  const [activity, setActivity] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    fetchDashboardStats({ userId: user.id }).then(setStats).catch(console.error);
    fetchAttentionItems({ userId: user.id }).then(setAttention).catch(console.error);
    if (isAdmin) fetchRecentActivity().then(setActivity).catch(console.error);
  }, [user, isAdmin]);

  return (
    <div>
      <div className="page-hdr">
        <div>
          <h1>{greeting()}, <span className="accent">{capitalizeWords(profile?.full_name)}</span></h1>
          <p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="quick-actions-row">
        {QUICK_ACTIONS.map((a) => (
          <button key={a.label} className="quick-action-btn" onClick={() => navigate(a.path)}>
            <i className={`ti ${a.icon}`} /> {a.label}
          </button>
        ))}
      </div>

      <div className="stat-grid" style={{ marginTop: 14 }}>
        <StatCard icon="ti-users" label="Total Clients" value={stats?.totalClients} onClick={() => navigate('/clients')} />
        <StatCard icon="ti-user-plus" label="Active Leads" value={stats?.activeLeads} onClick={() => navigate('/leads')} />
        <StatCard icon="ti-ticket" label="Open Tickets" value={stats?.openTickets} onClick={() => navigate('/tickets')} />
        <StatCard icon="ti-file-text" label="Claims In Progress" value={stats?.claimsInProgress} onClick={() => navigate('/claims')} />
        <StatCard icon="ti-checklist" label="Tasks Due Today" value={stats?.tasksDueToday} onClick={() => navigate('/tasks')} />
        <StatCard icon="ti-certificate" label="Policies Issued" value={stats?.policiesIssued} onClick={() => navigate('/clients')} />
      </div>

      <div className={`dashboard-panels ${isAdmin ? 'with-activity' : ''}`} style={{ marginTop: 14 }}>
        <div className="card">
          <div className="card-title"><i className="ti ti-clock" style={{ color: 'var(--gold)' }} /> My Follow-ups Due</div>
          {!attention ? <div className="dim">Loading...</div> : attention.followups.length === 0 ? <div className="table-empty">Nothing due</div> :
            attention.followups.slice(0, 6).map((f) => (
              <div key={f.id} className="dup-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/leads/${f.id}`)}>
                {f.full_name} <QuickContact mobile={f.mobile} />
                <div className="dim" style={{ fontSize: 11 }}>{f.follow_up_date}</div>
              </div>
            ))}
        </div>

        <div className="card">
          <div className="card-title"><i className="ti ti-calendar-event" style={{ color: 'var(--gold)' }} /> My Upcoming Meetings</div>
          {!attention ? <div className="dim">Loading...</div> : attention.meetings.length === 0 ? <div className="table-empty">Nothing scheduled</div> :
            attention.meetings.slice(0, 6).map((m) => (
              <div key={m.id} className="dup-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/calendar')}>
                {m.title} {m.with_name ? `— ${m.with_name}` : ''}
                <div className="dim" style={{ fontSize: 11 }}>{m.meeting_date}{m.meeting_time ? ` · ${m.meeting_time.slice(0, 5)}` : ''}</div>
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
          <div className="card-title"><i className="ti ti-alert-triangle" style={{ color: 'var(--red)' }} /> My SLA Breached Tickets</div>
          {!attention ? <div className="dim">Loading...</div> : attention.breachedTickets.length === 0 ? <div className="table-empty">All on track</div> :
            attention.breachedTickets.slice(0, 6).map((t) => (
              <div key={t.id} className="dup-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/tickets/${t.id}`)}>
                <span className="badge b-red">{t.ticket_ref}</span> {t.subject}
                <div className="dim" style={{ fontSize: 11 }}>{t.priority} priority</div>
              </div>
            ))}
        </div>

        {isAdmin && (
          <div className="card activity-panel">
            <div className="card-title"><i className="ti ti-activity" style={{ color: 'var(--gold)' }} /> Recent Team Activity</div>
            {activity.length === 0 ? <div className="table-empty">No activity yet</div> :
              activity.map((a) => (
                <div key={a.id} className="dup-row">
                  <b>{a.user_name}</b> {a.action.toLowerCase()}d {a.module.toLowerCase()}
                  {a.details ? <span className="dim"> — {a.details}</span> : null}
                  <div style={{ fontSize: 11, color: 'var(--text4)' }}>{new Date(a.created_at).toLocaleString()}</div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-icon"><i className={`ti ${icon}`} /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
    </div>
  );
}
