import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const TYPE_META = {
  social: { label: 'Red social',      icon: '◎', color: '#6D5BD0', bg: '#F2F0FD' },
  blog:   { label: 'Blog / Artículo', icon: '▤', color: '#1D9E75', bg: '#EDF7F3' },
  email:  { label: 'Email',           icon: '◻', color: '#C9A227', bg: '#FDF8ED' },
  script: { label: 'Guión',           icon: '◈', color: '#E85D30', bg: '#FEF2EE' },
};

function TypeBadge({ type }) {
  const m = TYPE_META[type] || TYPE_META.blog;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      color: m.color, background: m.bg, letterSpacing: 0.3,
    }}>{m.icon} {m.label}</span>
  );
}

function ContentModal({ item, onClose }) {
  if (!item) return null;
  const m = TYPE_META[item.type] || TYPE_META.blog;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,26,24,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999, padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620,
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '28px 32px 20px', borderBottom: '1px solid #F0EFE9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 10 }}>
              <TypeBadge type={item.type} />
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
              color: '#1A1A18', letterSpacing: -0.4, lineHeight: 1.3, margin: 0,
            }}>{item.title}</h2>
            <div style={{ fontSize: 12, color: '#AAAAAA', marginTop: 8, display: 'flex', gap: 12 }}>
              <span>por {item.author?.name}</span>
              {item.platform && <span>· {item.platform}</span>}
              <span>· {new Date(item.publishedAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#F0EFE9', border: 'none', borderRadius: 8, width: 32, height: 32,
            cursor: 'pointer', fontSize: 16, color: '#888882', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Modal body */}
        <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
          <p style={{
            fontSize: 15, color: '#2A2A26', lineHeight: 1.8,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>{item.body}</p>

          {item.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 24 }}>
              {item.tags.map(t => (
                <span key={t} style={{
                  padding: '4px 12px', background: '#F7F6F2', borderRadius: 20,
                  fontSize: 11, color: '#888882', border: '1px solid #E8E7E1',
                }}>{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div style={{
          padding: '16px 32px', borderTop: '1px solid #F0EFE9',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', flexShrink: 0,
          }} />
          <span style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600 }}>Publicado</span>
          <span style={{ fontSize: 12, color: '#AAAAAA', marginLeft: 4 }}>
            {new Date(item.publishedAt).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Published() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterType, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/content').then(r => {
      setItems(r.data.filter(c => c.status === 'published'));
    }).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.author?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === 'all' || c.type === filterType;
    return matchSearch && matchType;
  });

  // Group by month
  const grouped = filtered.reduce((acc, c) => {
    const key = new Date(c.publishedAt).toLocaleDateString('es', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <Layout>
      <div style={{ padding: '48px 52px', maxWidth: 1000 }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#888882', textTransform: 'uppercase', marginBottom: 8 }}>
            Biblioteca
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 700,
            color: '#1A1A18', letterSpacing: -0.8, margin: 0,
          }}>Contenido publicado</h1>
          <p style={{ color: '#888882', fontSize: 14, marginTop: 8 }}>
            {items.length} {items.length === 1 ? 'pieza publicada' : 'piezas publicadas'}
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 36, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Buscar por título, autor o tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 220, padding: '10px 14px', border: '1px solid #E2E1DB',
              borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              background: '#fff', color: '#1A1A18', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = '#6D5BD0'}
            onBlur={e => e.target.style.borderColor = '#E2E1DB'}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['all', ...Object.keys(TYPE_META)].map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                fontWeight: filterType === t ? 600 : 400,
                border: `1px solid ${filterType === t ? '#1A1A18' : '#E2E1DB'}`,
                background: filterType === t ? '#1A1A18' : '#fff',
                color: filterType === t ? '#F0EFE9' : '#888882',
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
              }}>
                {t === 'all' ? 'Todos' : `${TYPE_META[t].icon} ${TYPE_META[t].label}`}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888882', fontSize: 14 }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px', background: '#fff',
            borderRadius: 12, border: '1px solid #E8E7E1',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>◉</div>
            <div style={{ fontSize: 15, color: '#888882' }}>
              {search || filterType !== 'all' ? 'No hay resultados para esta búsqueda.' : 'Aún no hay contenido publicado.'}
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([month, group]) => (
            <div key={month} style={{ marginBottom: 44 }}>
              {/* Month divider */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18,
              }}>
                <span style={{
                  fontSize: 11, letterSpacing: 2, color: '#888882',
                  textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap',
                  textTransform: 'capitalize',
                }}>{month}</span>
                <div style={{ flex: 1, height: 1, background: '#E8E7E1' }} />
                <span style={{ fontSize: 11, color: '#CCCCCC' }}>{group.length}</span>
              </div>

              {/* Cards grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16,
              }}>
                {group.map(c => {
                  const m = TYPE_META[c.type] || TYPE_META.blog;
                  return (
                    <div
                      key={c._id}
                      onClick={() => setSelected(c)}
                      style={{
                        background: '#fff', borderRadius: 12, padding: '22px 24px',
                        border: '1px solid #E8E7E1', cursor: 'pointer',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                        display: 'flex', flexDirection: 'column', gap: 12,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = m.color;
                        e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.07)`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#E8E7E1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <TypeBadge type={c.type} />
                        <span style={{ fontSize: 11, color: '#CCCCCC' }}>
                          {new Date(c.publishedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <h3 style={{
                        fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700,
                        color: '#1A1A18', letterSpacing: -0.2, lineHeight: 1.4, margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>{c.title}</h3>

                      <p style={{
                        fontSize: 13, color: '#888882', lineHeight: 1.6, margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>{c.body}</p>

                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingTop: 8, borderTop: '1px solid #F0EFE9', marginTop: 'auto',
                      }}>
                        <span style={{ fontSize: 12, color: '#AAAAAA' }}>{c.author?.name}</span>
                        {c.platform && (
                          <span style={{
                            fontSize: 11, color: m.color, background: m.bg,
                            padding: '2px 8px', borderRadius: 12, fontWeight: 500,
                          }}>{c.platform}</span>
                        )}
                      </div>

                      {c.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {c.tags.slice(0, 3).map(t => (
                            <span key={t} style={{
                              fontSize: 10, color: '#AAAAAA', background: '#F7F6F2',
                              padding: '2px 8px', borderRadius: 10, border: '1px solid #E8E7E1',
                            }}>{t}</span>
                          ))}
                          {c.tags.length > 3 && (
                            <span style={{ fontSize: 10, color: '#CCCCCC' }}>+{c.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <ContentModal item={selected} onClose={() => setSelected(null)} />
    </Layout>
  );
}