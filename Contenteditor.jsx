import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socket from '../services/socket';

const STATUS_META = {
  draft:             { label: 'Borrador',           color: '#888882' },
  pending_review:    { label: 'En revisión',         color: '#C9A227' },
  changes_requested: { label: 'Cambios solicitados', color: '#E85D30' },
  approved:          { label: 'Aprobado',            color: '#1D9E75' },
  published:         { label: 'Publicado',           color: '#6D5BD0' },
};

const TYPES = [
  { value: 'social', label: 'Red social', icon: '◎' },
  { value: 'blog',   label: 'Blog / Artículo', icon: '▤' },
  { value: 'email',  label: 'Email / Newsletter', icon: '◻' },
  { value: 'script', label: 'Guión / Script', icon: '◈' },
];

const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1px solid #E2E1DB',
  borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  background: '#FAFAF7', color: '#1A1A18', outline: 'none', boxSizing: 'border-box',
};

export default function ContentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id;

  const [form, setForm] = useState({ title: '', body: '', type: 'social', tags: '', platform: '' });
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!isNew) {
      setLoading(true);
      api.get(`/content/${id}`).then(r => {
        const c = r.data;
        setForm({ title: c.title, body: c.body, type: c.type, tags: c.tags?.join(', ') || '', platform: c.platform || '' });
        setStatus(c.status);
        setComments(c.comments || []);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    socket.connect();
    socket.emit('join-content', id);
    socket.on('content-decision', ({ status: s, feedback }) => {
      setStatus(s);
      setNotification({ type: s === 'approved' ? 'success' : 'warning', text: s === 'approved' ? '¡Contenido aprobado!' : `Cambios solicitados: ${feedback}` });
      setTimeout(() => setNotification(null), 5000);
    });
    return () => { socket.off('content-decision'); socket.disconnect(); };
  }, [id]);

  const notify = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (isNew) {
        const { data } = await api.post('/content', payload);
        navigate(`/editor/${data._id}`, { replace: true });
        notify('Contenido creado');
      } else {
        await api.put(`/content/${id}`, payload);
        notify('Guardado');
      }
    } catch (e) {
      notify(e.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    try {
      await api.post(`/content/${id}/submit`);
      setStatus('pending_review');
      socket.emit('request-approval', { contentId: id, writerId: user.id });
      notify('Enviado a revisión');
    } catch (e) {
      notify(e.response?.data?.message || 'Error', 'error');
    }
  };

  const canEdit = isNew || (['draft', 'changes_requested'].includes(status) && (user.role === 'writer' || user.role === 'admin'));

  if (loading) return (
    <Layout>
      <div style={{ padding: 52, color: '#888882', fontSize: 14 }}>Cargando...</div>
    </Layout>
  );

  const notifColors = { success: { bg: '#EDF7F3', border: '#A3D9C3', text: '#1D9E75' }, warning: { bg: '#FDF8ED', border: '#F0D48A', text: '#C9A227' }, error: { bg: '#FEF2EE', border: '#F5C4B3', text: '#E85D30' } };

  return (
    <Layout>
      <div style={{ padding: '48px 52px', maxWidth: 860 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#888882', textTransform: 'uppercase', marginBottom: 8 }}>
              {isNew ? 'Nuevo contenido' : 'Editar contenido'}
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#1A1A18', letterSpacing: -0.6, margin: 0 }}>
              {isNew ? 'Crear pieza' : form.title || 'Sin título'}
            </h1>
          </div>
          {!isNew && (
            <span style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              color: STATUS_META[status]?.color, background: '#F0EFE9', letterSpacing: 0.3,
            }}>{STATUS_META[status]?.label}</span>
          )}
        </div>

        {/* Notification */}
        {notification && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 24, fontSize: 13, fontWeight: 500,
            background: notifColors[notification.type]?.bg,
            border: `1px solid ${notifColors[notification.type]?.border}`,
            color: notifColors[notification.type]?.text,
          }}>{notification.text}</div>
        )}

        {/* Type selector */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, letterSpacing: 2, color: '#888882', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Tipo de contenido</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {TYPES.map(t => (
              <button key={t.value} disabled={!canEdit} onClick={() => setForm({ ...form, type: t.value })} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: form.type === t.value ? 600 : 400,
                border: `1px solid ${form.type === t.value ? '#1A1A18' : '#E2E1DB'}`,
                background: form.type === t.value ? '#1A1A18' : '#fff',
                color: form.type === t.value ? '#F0EFE9' : '#888882',
                cursor: canEdit ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
              }}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 11, letterSpacing: 2, color: '#888882', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Título</label>
            <input style={inputStyle} placeholder="Título del contenido" value={form.title} disabled={!canEdit}
              onChange={e => setForm({ ...form, title: e.target.value })}
              onFocus={e => e.target.style.borderColor = '#6D5BD0'}
              onBlur={e => e.target.style.borderColor = '#E2E1DB'}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, letterSpacing: 2, color: '#888882', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Contenido</label>
            <textarea style={{ ...inputStyle, minHeight: 220, resize: 'vertical', lineHeight: 1.7 }}
              placeholder="Escribe el contenido aquí..." value={form.body} disabled={!canEdit}
              onChange={e => setForm({ ...form, body: e.target.value })}
              onFocus={e => e.target.style.borderColor = '#6D5BD0'}
              onBlur={e => e.target.style.borderColor = '#E2E1DB'}
            />
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, letterSpacing: 2, color: '#888882', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Plataforma</label>
              <input style={inputStyle} placeholder="ej. Instagram, LinkedIn..." value={form.platform} disabled={!canEdit}
                onChange={e => setForm({ ...form, platform: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#6D5BD0'}
                onBlur={e => e.target.style.borderColor = '#E2E1DB'}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, letterSpacing: 2, color: '#888882', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Tags (separados por coma)</label>
              <input style={inputStyle} placeholder="marketing, lanzamiento..." value={form.tags} disabled={!canEdit}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#6D5BD0'}
                onBlur={e => e.target.style.borderColor = '#E2E1DB'}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
            <button onClick={save} disabled={saving} style={{
              padding: '12px 24px', background: '#1A1A18', color: '#F0EFE9', border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Guardando...' : isNew ? 'Crear' : 'Guardar'}
            </button>
            {!isNew && ['draft', 'changes_requested'].includes(status) && user.role === 'writer' && (
              <button onClick={submitForReview} style={{
                padding: '12px 24px', background: '#6D5BD0', color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Enviar a revisión ✦
              </button>
            )}
          </div>
        )}

        {/* Comments section */}
        {!isNew && comments.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#888882', textTransform: 'uppercase', marginBottom: 16 }}>
              Comentarios del editor
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {comments.map((c, i) => (
                <div key={i} style={{
                  padding: '14px 18px', background: '#FDF8ED', borderRadius: 10,
                  border: '1px solid #F0D48A', fontSize: 14, color: '#1A1A18', lineHeight: 1.6,
                }}>
                  <div style={{ fontSize: 12, color: '#C9A227', fontWeight: 600, marginBottom: 6 }}>
                    {c.author?.name || 'Editor'} · {new Date(c.createdAt).toLocaleDateString('es')}
                  </div>
                  {c.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}