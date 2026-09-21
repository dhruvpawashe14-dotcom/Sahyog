import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchMyNotifications, markRead, subscribeToNotifications } from '../../services/notifications/notificationService';
import {
  isSoundMuted, setSoundMuted, playNotificationSound,
  requestDesktopPermission, showDesktopNotification,
} from '../../utils/notificationAlerts';

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(isSoundMuted());

  useEffect(() => {
    if (!user) return;
    fetchMyNotifications(user.id).then(setItems);
    const unsub = subscribeToNotifications(user.id, (n) => {
      setItems((prev) => [n, ...prev]);
      playNotificationSound();
      showDesktopNotification(n.title, n.body);
    });
    return unsub;
  }, [user]);

  const unread = items.filter((i) => !i.is_read).length;

  const toggleOpen = () => {
    setOpen((o) => !o);
    // Ask for desktop-alert permission on a real click, not on page load —
    // browsers require a user gesture for this to mean anything anyway.
    requestDesktopPermission();
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  return (
    <div className="notif-wrap">
      <button className="icon-btn" onClick={toggleOpen} aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}>
        <i className="ti ti-bell" />
        {unread > 0 && <span className="notif-dot" />}
      </button>
      {open && (
        <div className="notif-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 8px', borderBottom: '1px solid var(--border2)', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text3)' }}>Notifications</span>
            <button className="link-btn" onClick={toggleMute} title={muted ? 'Unmute notification sound' : 'Mute notification sound'} style={{ fontSize: 11 }}>
              <i className={`ti ${muted ? 'ti-bell-off' : 'ti-volume'}`} /> {muted ? 'Muted' : 'Sound on'}
            </button>
          </div>
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
