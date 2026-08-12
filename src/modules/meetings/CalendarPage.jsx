import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import * as meetingService from './services/meetingService';
import { notify } from '../../services/notifications/notificationService';
import Modal from '../../components/common/Modal';
import ScopeToggle from '../../components/common/ScopeToggle';
import { useEmployees } from '../../hooks/useEmployees';
import { toLocalDateStr } from '../../utils/date';

function monthRange(year, month) {
  const from = toLocalDateStr(new Date(year, month, 1));
  const to = toLocalDateStr(new Date(year, month + 1, 0));
  return { from, to };
}

export default function CalendarPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [cursor, setCursor] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [scope, setScope] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', with_name: '', meeting_date: '', meeting_time: '', location: '', assigned_to: '' });
  const employees = useEmployees();

  useEffect(() => { if (user && !form.assigned_to) setForm((f) => ({ ...f, assigned_to: user.id })); }, [user]);

  const load = () => {
    const { from, to } = monthRange(cursor.getFullYear(), cursor.getMonth());
    meetingService.listMeetings({ from, to }).then(setMeetings);
  };
  useEffect(() => { if (user) load(); }, [user, cursor]);

  const save = async () => {
    if (!form.title || !form.meeting_date) { showToast('Title and date are required', 'error'); return; }
    const assignee = employees.find((e) => e.id === form.assigned_to) || profile;
    await meetingService.createMeeting({ ...form, assigned_to: form.assigned_to || user.id, assigned_name: assignee.full_name, created_by: user.id });
    if (form.assigned_to && form.assigned_to !== user.id) {
      await notify({ userId: form.assigned_to, title: 'New meeting assigned to you', body: `${form.title} on ${form.meeting_date}`, type: 'info', linkType: 'meeting', linkId: null });
    }
    setOpen(false);
    setForm({ title: '', with_name: '', meeting_date: '', meeting_time: '', location: '', assigned_to: user.id });
    showToast('Meeting scheduled', 'success');
    load();
  };

  const year = cursor.getFullYear(), month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const scoped = scope === 'mine' ? meetings.filter((m) => m.assigned_to === user?.id) : meetings;
  const meetingsOn = (day) => {
    const dateStr = toLocalDateStr(new Date(year, month, day));
    return scoped.filter((m) => m.meeting_date === dateStr);
  };

  return (
    <div>
      <div className="page-hdr">
        <div><h1>Calendar</h1><p>{cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setCursor(new Date(year, month - 1, 1))}><i className="ti ti-chevron-left" /></button>
          <button className="btn" onClick={() => setCursor(new Date(year, month + 1, 1))}><i className="ti ti-chevron-right" /></button>
          <button className="btn btn-gold" onClick={() => setOpen(true)}><i className="ti ti-plus" /> Schedule Meeting</button>
        </div>
      </div>
      <ScopeToggle scope={scope} onChange={setScope}
        mineCount={meetings.filter((m) => m.assigned_to === user?.id).length}
        allCount={meetings.length} />
      <div className="cal-grid" style={{ marginTop: 12 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((day, i) => (
          <div key={i} className={`cal-cell ${day ? '' : 'empty'}`}>
            {day && <div className="cal-daynum">{day}</div>}
            {day && meetingsOn(day).map((m) => (
              <div key={m.id} className="cal-event" title={`${m.assigned_name}${m.with_name ? ' · ' + m.with_name : ''}`}>
                {m.meeting_time?.slice(0, 5) || ''} {m.title}
              </div>
            ))}
          </div>
        ))}
      </div>

      <Modal open={open} title="Schedule Meeting" onClose={() => setOpen(false)} footer={<button className="btn btn-gold" onClick={save}>Save</button>}>
        <div className="fld"><label>Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="fld" style={{ marginTop: 10 }}><label>With</label><input value={form.with_name} onChange={(e) => setForm({ ...form, with_name: e.target.value })} /></div>
        <div className="fld" style={{ marginTop: 10 }}><label>Date *</label><input type="date" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} /></div>
        <div className="fld" style={{ marginTop: 10 }}><label>Time</label><input type="time" value={form.meeting_time} onChange={(e) => setForm({ ...form, meeting_time: e.target.value })} /></div>
        <div className="fld" style={{ marginTop: 10 }}><label>Location</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div className="fld" style={{ marginTop: 10 }}>
          <label>Assign To</label>
          <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.full_name}{emp.id === user.id ? ' (You)' : ''}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
}
