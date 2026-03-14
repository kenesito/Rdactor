import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '▦', roles: ['admin', 'writer', 'editor', 'client'] },
  { path: '/editor', label: 'Nuevo contenido', icon: '✦', roles: ['writer', 'admin'] },
  { path: '/review', label: 'Cola de revisión', icon: '◈', roles: ['editor', 'admin'] },
  { path: '/published', label: 'Publicados', icon: '◉', roles: ['client', 'admin', 'editor'] },
];

const roleColors = {
  admin: '#E85D30',
  writer: '#6D5BD0',
  editor: '#1D9E75',
  client: '#C9A227',
};

const roleLabels = {
  admin: 'Administrador',
  writer: 'Redactor',
  editor: 'Editor',
  client: 'Cliente',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const visible = navItems.filter(i => i.roles.includes(user?.role));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: '#F7F6F2' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#1A1A18', display: 'flex', flexDirection: 'column',
        padding: '0', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '32px 28px 24px', borderBottom: '1px solid #2E2E2A' }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#666660', textTransform: 'uppercase', marginBottom: 4 }}>Content</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#F0EFE9', fontFamily: "'Playfair Display', serif", letterSpacing: -0.5 }}>CMS</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '20px 0' }}>
          {visible.map(item => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 28px',
                color: active ? '#F0EFE9' : '#888882', textDecoration: 'none',
                fontSize: 13, fontWeight: active ? 600 : 400, letterSpacing: 0.2,
                background: active ? '#2A2A26' : 'transparent',
                borderLeft: active ? `3px solid ${roleColors[user?.role]}` : '3px solid transparent',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '20px 28px', borderTop: '1px solid #2E2E2A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff',
              background: roleColors[user?.role] || '#6D5BD0', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#F0EFE9', lineHeight: 1.2 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: roleColors[user?.role], fontWeight: 500, letterSpacing: 0.5 }}>
                {roleLabels[user?.role]}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px', background: 'transparent', border: '1px solid #2E2E2A',
            borderRadius: 6, color: '#666660', fontSize: 12, cursor: 'pointer', letterSpacing: 0.5,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.target.style.borderColor = '#444440'; e.target.style.color = '#F0EFE9'; }}
            onMouseLeave={e => { e.target.style.borderColor = '#2E2E2A'; e.target.style.color = '#666660'; }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}