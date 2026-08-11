import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import * as meetingService from './services/meetingService';
import Modal from '../../components/common/Modal';

function monthRange(year, month) {
  const from = new Date(year, month, 1).toISOString().slice(0, 10);
  const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

export default function CalendarPage() {
  const { user, profile, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [cursor, setCursor] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', with_name: '', meeting_date: '', meeting_time: '', location: '' });

  const load = () => {
    const { from, to } = monthRange(cursor.getFullYear(), cursor.getMonth());
    meetingService.listMeetings({ userId: user.id, isAdmin, from, to }).then(setMeetings);
  };
  useEffect(() => { if (user) load(); }, [user, isAdmin, cursor]);

  const save = async () => {
    if (!form.title || !form.meeting_date) { showToast('Title and date are required', 'error'); return; }
    await meetingService.createMeeting({ ...form, assigned_to: user.id, assigned_name: profile.full_name, created_by: user.id });
    setOpen(false);
    showToast('Meeting scheduled', 'success');
    load();
  };

  const year = cursor.getFullYear(), month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const meetingsOn = (day) => {
    const dateStr = new Date(year, month, day).toISOString().slice(0, 10);
    return meetings.filter((m) => m.meeting_date === dateStr);
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
      <div className="cal-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((day, i) => (
          <div key={i} className={`cal-cell ${day ? '' : 'empty'}`}>
            {day && <div className="cal-daynum">{day}</div>}
            {day && meetingsOn(day).map((m) => (
              <div key={m.id} className="cal-event">{m.meeting_time?.slice(0, 5) || ''} {m.title}</div>
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
      </Modal>
    </div>
  );
}
