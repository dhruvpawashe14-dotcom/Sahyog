import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import * as taskService from './services/taskService';
import { notify } from '../../services/notifications/notificationService';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ScopeToggle from '../../components/common/ScopeToggle';
import { useEmployees } from '../../hooks/useEmployees';

const STATUSES = ['Pending', 'In Progress', 'Completed', 'Delayed'];

export default function TasksPage() {
  const { user, profile, isAdmin } = useAuth();
  const { showToast } = useToast();
  const employees = useEmployees();
  const [tasks, setTasks] = useState([]);
  const [scope, setScope] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', due_date: '', priority: 'Normal', assigned_to: '' });

  const load = () => taskService.listTasks().then(setTasks);
  useEffect(() => { if (user) load(); }, [user, isAdmin]);
  useEffect(() => { if (user && !form.assigned_to) setForm((f) => ({ ...f, assigned_to: user.id })); }, [user]);

  const save = async () => {
    if (!form.title) { showToast('Title is required', 'error'); return; }
    const assignee = employees.find((e) => e.id === form.assigned_to) || profile;
    await taskService.createTask({ ...form, assigned_to: form.assigned_to || user.id, assigned_name: assignee.full_name, created_by: user.id });
    if (form.assigned_to && form.assigned_to !== user.id) {
      await notify({ userId: form.assigned_to, title: 'New task assigned to you', body: form.title, type: 'info', linkType: 'task', linkId: null });
    }
    setOpen(false);
    setForm({ title: '', due_date: '', priority: 'Normal', assigned_to: user.id });
    showToast('Task added', 'success');
    load();
  };

  const scoped = scope === 'mine' ? tasks.filter((t) => t.assigned_to === user?.id) : tasks;

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'priority', label: 'Priority' },
    { key: 'due_date', label: 'Due' },
    ...(isAdmin ? [{ key: 'assigned_name', label: 'Assigned To' }] : []),
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
        <div><h1>Tasks</h1><p>{scoped.length} of {tasks.length} tasks</p></div>
        <button className="btn btn-gold" onClick={() => setOpen(true)}><i className="ti ti-plus" /> Add Task</button>
      </div>
      <ScopeToggle scope={scope} onChange={setScope}
        mineCount={tasks.filter((t) => t.assigned_to === user?.id).length}
        allCount={tasks.length} />
      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} rows={scoped} emptyLabel="No tasks yet" />
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
