import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchMyNotifications, markRead, subscribeToNotifications } from '../../services/notifications/notificationService';

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMyNotifications(user.id).then(setItems);
    const unsub = subscribeToNotifications(user.id, (n) => setItems((prev) => [n, ...prev]));
    return unsub;
  }, [user]);

  const unread = items.filter((i) => !i.is_read).length;

  return (
    <div className="notif-wrap">
      <button className="icon-btn" onClick={() => setOpen(!open)}>
        <i className="ti ti-bell" />
        {unread > 0 && <span className="notif-dot" />}
      </button>
      {open && (
        <div className="notif-panel">
          {items.length === 0 && <div style={{ fontSize: 12, color: 'var(--text4)', textAlign: 'center', padding: 16 }}>No notifications</div>}
          {items.map((n) => (
            <div key={n.id} className={`notif-row ${n.is_read ? '' : 'unread'}`} onClick={() => { markRead(n.id); setItems((p) => p.map((x) => x.id === n.id ? { ...x, is_read: true } : x)); }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>{n.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{n.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
