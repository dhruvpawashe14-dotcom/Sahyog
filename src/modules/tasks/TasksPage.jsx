import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import * as taskService from './services/taskService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';

const STATUSES = ['Pending', 'In Progress', 'Completed', 'Delayed'];

export default function TasksPage() {
  const { user, profile, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', due_date: '', priority: 'Normal' });

  const load = () => taskService.listTasks({ userId: user.id, isAdmin }).then(setTasks);
  useEffect(() => { if (user) load(); }, [user, isAdmin]);

  const save = async () => {
    if (!form.title) { showToast('Title is required', 'error'); return; }
    await taskService.createTask({ ...form, assigned_to: user.id, assigned_name: profile.full_name, created_by: user.id });
    setOpen(false);
    setForm({ title: '', due_date: '', priority: 'Normal' });
    showToast('Task added', 'success');
    load();
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'priority', label: 'Priority' },
    { key: 'due_date', label: 'Due' },
    {
      key: 'status', label: 'Status', render: (row) => (
        <select value={row.status} onChange={async (e) => { await taskService.updateTaskStatus(row.id, e.target.value); load(); }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
  ];

  return (
    <div>
      <div className="page-hdr">
        <div><h1>Tasks</h1><p>{tasks.length} tasks</p></div>
        <button className="btn btn-gold" onClick={() => setOpen(true)}><i className="ti ti-plus" /> Add Task</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} rows={tasks} emptyLabel="No tasks yet" />
      </div>

      <Modal open={open} title="Add Task" onClose={() => setOpen(false)} footer={<button className="btn btn-gold" onClick={save}>Save</button>}>
        <div className="fld"><label>Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="fld" style={{ marginTop: 10 }}><label>Due date</label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
        <div className="fld" style={{ marginTop: 10 }}>
          <label>Priority</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
          </select>
        </div>
      </Modal>
    </div>
  );
}
