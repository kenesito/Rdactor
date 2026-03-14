import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STATUS_META = {
  draft:             { label: 'Borrador',           color: '#888882', bg: '#F0EFE9' },
  pending_review:    { label: 'En revisión',         color: '#C9A227', bg: '#FDF8ED' },
  changes_requested: { label: 'Cambios solicitados', color: '#E85D30', bg: '#FEF2EE' },
  approved:          { label: 'Aprobado',            color: '#1D9E75', bg: '#EDF7F3' },
  published:         { label: 'Publicado',           color: '#1A1A18', bg: '#E8E7E1' },
};

const TYPE_ICONS = { social: '◎', blog: '▤', email: '◻', script: '◈' };

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '24px 28px',
      border: '1px solid #E8E7E1', flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: accent || '#1A1A18', fontFamily: "'Playfair Display', serif", letterSpacing: -1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#888882', marginTop: 4, letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      color: m.color, background: m.bg, letterSpacing: 0.3,
    }}>{m.label}</span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/content').then(r => setContents(r.data)).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: contents.length,
    pending: contents.filter(c => c.status === 'pending_review').length,
    approved: contents.filter(c => c.status === 'approved').length,
    published: contents.filter(c => c.status === 'published').length,
  };

  return (
    <Layout>
      <div style={{ padding: '48px 52px', maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#888882', textTransform: 'uppercase', marginBottom: 8 }}>
            Dashboard
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 700,
            color: '#1A1A18', letterSpacing: -0.8, margin: 0,
          }}>
            Hola, {user?.name?.split(' ')[0]} 👋
          </h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
          <StatCard label="Total" value={stats.total} accent="#1A1A18" />
          <StatCard label="En revisión" value={stats.pending} accent="#C9A227" />
          <StatCard label="Aprobados" value={stats.approved} accent="#1D9E75" />
          <StatCard label="Publicados" value={stats.published} accent="#6D5BD0" />
        </div>

        {/* CTA para writer */}
        {(user?.role === 'writer' || user?.role === 'admin') && (
          <button onClick={() => navigate('/editor')} style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36,
            padding: '12px 22px', background: '#1A1A18', color: '#F0EFE9',
            border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.3,
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#2E2E2A'}
            onMouseLeave={e => e.currentTarget.style.background = '#1A1A18'}
          >
            <span style={{ fontSize: 16 }}>✦</span> Nuevo contenido
          </button>
        )}

        {/* Content list */}
        <div>
          <div style={{ fontSize: 12, letterSpacing: 2, color: '#888882', textTransform: 'uppercase', marginBottom: 16 }}>
            Contenido reciente
          </div>

          {loading ? (
            <div style={{ color: '#888882', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>Cargando...</div>
          ) : contents.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px', background: '#fff',
              borderRadius: 12, border: '1px solid #E8E7E1',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✦</div>
              <div style={{ fontSize: 15, color: '#888882' }}>No hay contenido aún.</div>
              {(user?.role === 'writer' || user?.role === 'admin') && (
                <button onClick={() => navigate('/editor')} style={{
                  marginTop: 16, padding: '10px 20px', background: '#6D5BD0', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                }}>Crear el primero</button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {contents.map(c => (
                <div key={c._id} onClick={() => navigate(`/editor/${c._id}`)}
                  style={{
                    background: '#fff', borderRadius: 12, padding: '18px 24px',
                    border: '1px solid #E8E7E1', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: 16, transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#C8C7C0'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E7E1'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <span style={{ fontSize: 20, color: '#C8C7C0', flexShrink: 0 }}>{TYPE_ICONS[c.type]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A18', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#888882' }}>
                      {c.author?.name} · {new Date(c.updatedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}