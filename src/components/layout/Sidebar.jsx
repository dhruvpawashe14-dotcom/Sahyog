import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from '../../constants/nav';

export default function Sidebar({ open, onNavigate }) {
  const { profile, isAdmin, logout } = useAuth();
  const initials = (profile?.full_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="logo">
        <div className="logo-mark">S</div>
        <div>
          <div className="logo-text">MyAdvisor CRM</div>
          <div className="logo-badge">v2 · modular</div>
        </div>
      </div>
      <nav>
        {NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin).map((item) => (
          <NavLink key={item.id} to={item.path} onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
            <i className={`ti ${item.icon}`} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-av">{initials}</div>
          <div>
            <div className="user-name">{profile?.full_name}</div>
            <div className="user-role">{isAdmin ? 'Admin · Super Access' : 'Advisor'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}><i className="ti ti-logout" /> Sign out</button>
      </div>
    </aside>
  );
}
