import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ title }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <Topbar title={title} />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
