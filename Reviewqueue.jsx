import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import socket from '../services/socket';

const TYPE_ICONS = { social: '◎', blog: '▤', email: '◻', script: '◈' };
const TYPE_LABELS = { social: 'Red social', blog: 'Blog', email: 'Email', script: 'Guión' };

export default function ReviewQueue() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchQueue = () => {
    api.get('/content').then(r => {
      setItems(r.data.filter(c => c.status === 'pending_review'));
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
    socket.connect();
    socket.on('approval-requested', fetchQueue);
    return () => { socket.off('approval-requested'); socket.disconnect(); };
  }, []);

  const notify = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const decide = async (decision) => {
    if (!selected) return;
    if (decision === 'request_changes' && !feedback.trim()) {
      notify('Escribe un comentario antes de solicitar cambios', 'error'); return;
    }
    setActing(true);
    try {
      await api.post(`/content/${selected._id}/review`, { decision, feedback });
      socket.emit('editor-decision', {
        contentId: selected._id,
        status: decision === 'approve' ? 'approved' : 'changes_requested',
        feedback,
      });
      notify(decision === 'approve' ? 'Contenido aprobado ✓' : 'Cambios solicitados al redactor');
      setSelected(null);
      setFeedback('');
      fetchQueue();
    } catch (e) {
      notify(e.response?.data?.message || 'Error', 'error');
    } finally {
      setActing(false);
    }
  };

  const publish = async (item) => {
    try {
      await api.post(`/content/${item._id}/publish`);
      notify('Publicado exitosamente ◉');
      fetchQueue();
    } catch (e) {
      notify(e.response?.data?.message || 'Error', 'error');
    }
  };

  const notifColors = {
    success: { bg: '#EDF7F3', border: '#A3D9C3', text: '#1D9E75' },
    error:   { bg: '#FEF2EE', border: '#F5C4B3', text: '#E85D30' },
  };

  return (
    <Layout>
      <div style={{ padding: '48px 52px', maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#888882', textTransform: 'uppercase', marginBottom: 8 }}>
            Cola de revisión
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 700, color: '#1A1A18', letterSpacing: -0.8, margin: 0 }}>
            Pendientes de revisión
          </h1>
        </div>

        {notification && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: 13, fontWeight: 500,
            background: notifColors[notification.type]?.bg,
            border: `1px solid ${notifColors[notification.type]?.border}`,
            color: notifColors[notification.type]?.text,
          }}>{notification.text}</div>
        )}

        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
          {/* List */}
          <div style={{ flex: 1 }}>
            {loading ? (
              <div style={{ color: '#888882', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>Cargando...</div>
            ) : items.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px', background: '#fff',
                borderRadius: 12, border: '1px solid #E8E7E1',
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>◈</div>
                <div style={{ fontSize: 15, color: '#888882' }}>No hay contenido pendiente de revisión.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(c => (
                  <div key={c._id} onClick={() => { setSelected(c); setFeedback(''); }}
                    style={{
                      background: selected?._id === c._id ? '#1A1A18' : '#fff',
                      borderRadius: 12, padding: '18px 22px',
                      border: `1px solid ${selected?._id === c._id ? '#1A1A18' : '#E8E7E1'}`,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (selected?._id !== c._id) e.currentTarget.style.borderColor = '#C8C7C0'; }}
                    onMouseLeave={e => { if (selected?._id !== c._id) e.currentTarget.style.borderColor = '#E8E7E1'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18, color: selected?._id === c._id ? '#888882' : '#C8C7C0' }}>
                        {TYPE_ICONS[c.type]}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: selected?._id === c._id ? '#F0EFE9' : '#1A1A18', marginBottom: 3 }}>
                          {c.title}
                        </div>
                        <div style={{ fontSize: 12, color: selected?._id === c._id ? '#888882' : '#AAAAAA' }}>
                          {c.author?.name} · {TYPE_LABELS[c.type]} · {new Date(c.updatedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{
              width: 420, background: '#fff', borderRadius: 14,
              border: '1px solid #E8E7E1', padding: '28px', flexShrink: 0,
              position: 'sticky', top: 24,
            }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: '#888882', textTransform: 'uppercase', marginBottom: 6 }}>
                {TYPE_ICONS[selected.type]} {TYPE_LABELS[selected.type]}
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1A1A18', marginBottom: 6, letterSpacing: -0.3 }}>
                {selected.title}
              </h2>
              <div style={{ fontSize: 12, color: '#AAAAAA', marginBottom: 20 }}>
                por {selected.author?.name}
                {selected.platform && ` · ${selected.platform}`}
              </div>

              <div style={{
                background: '#F7F6F2', borderRadius: 10, padding: '16px 18px',
                fontSize: 14, color: '#1A1A18', lineHeight: 1.7, marginBottom: 24,
                maxHeight: 220, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {selected.body}
              </div>

              {selected.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                  {selected.tags.map(t => (
                    <span key={t} style={{ padding: '3px 10px', background: '#F0EFE9', borderRadius: 20, fontSize: 11, color: '#888882' }}>{t}</span>
                  ))}
                </div>
              )}

              <textarea
                placeholder="Comentario para el redactor (obligatorio al solicitar cambios)..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', border: '1px solid #E2E1DB',
                  borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  background: '#FAFAF7', color: '#1A1A18', outline: 'none',
                  boxSizing: 'border-box', minHeight: 90, resize: 'vertical', lineHeight: 1.6,
                  marginBottom: 16,
                }}
                onFocus={e => e.target.style.borderColor = '#6D5BD0'}
                onBlur={e => e.target.style.borderColor = '#E2E1DB'}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => decide('approve')} disabled={acting} style={{
                  flex: 1, padding: '11px', background: '#1D9E75', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: acting ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif",
                  opacity: acting ? 0.7 : 1,
                }}>Aprobar ✓</button>
                <button onClick={() => decide('request_changes')} disabled={acting} style={{
                  flex: 1, padding: '11px', background: '#FEF2EE', color: '#E85D30',
                  border: '1px solid #F5C4B3', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: acting ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif",
                  opacity: acting ? 0.7 : 1,
                }}>Cambios ✎</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}