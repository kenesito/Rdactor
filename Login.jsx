import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'writer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : form;
      const { data } = await api.post(endpoint, payload);
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: '1px solid #E2E1DB',
    borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    background: '#FAFAF7', color: '#1A1A18', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: '#F7F6F2',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, background: '#1A1A18', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 320, height: 320,
          borderRadius: '50%', border: '1px solid #2E2E2A',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40, width: 200, height: 200,
          borderRadius: '50%', border: '1px solid #2E2E2A',
        }} />
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#666660', textTransform: 'uppercase', marginBottom: 16 }}>
          Content CMS
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 700,
          color: '#F0EFE9', lineHeight: 1.15, marginBottom: 24, letterSpacing: -1,
        }}>
          Contenido<br />sin fricción.
        </h1>
        <p style={{ color: '#888882', fontSize: 15, lineHeight: 1.7, maxWidth: 340 }}>
          Crea, revisa y publica con un flujo de aprobación diseñado para equipos que valoran la calidad.
        </p>
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { icon: '✦', text: 'Flujo de aprobación en tiempo real' },
            { icon: '◈', text: 'Roles: redactor, editor, cliente' },
            { icon: '◉', text: 'Soporte para 4 tipos de contenido' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#6D5BD0', fontSize: 14 }}>{item.icon}</span>
              <span style={{ color: '#888882', fontSize: 13 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48,
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{
              fontSize: 26, fontWeight: 700, color: '#1A1A18',
              fontFamily: "'Playfair Display', serif", marginBottom: 8, letterSpacing: -0.5,
            }}>
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
            </h2>
            <p style={{ color: '#888882', fontSize: 14 }}>
              {mode === 'login' ? 'Ingresa tus credenciales para continuar' : 'Completa el formulario para empezar'}
            </p>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: '#FEF2F0', border: '1px solid #FBBFB5',
              borderRadius: 8, fontSize: 13, color: '#C04828', marginBottom: 20,
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <input
                style={inputStyle} placeholder="Nombre completo"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#6D5BD0'}
                onBlur={e => e.target.style.borderColor = '#E2E1DB'}
                required
              />
            )}
            <input
              style={inputStyle} type="email" placeholder="Email"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              onFocus={e => e.target.style.borderColor = '#6D5BD0'}
              onBlur={e => e.target.style.borderColor = '#E2E1DB'}
              required
            />
            <input
              style={inputStyle} type="password" placeholder="Contraseña"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              onFocus={e => e.target.style.borderColor = '#6D5BD0'}
              onBlur={e => e.target.style.borderColor = '#E2E1DB'}
              required
            />
            {mode === 'register' && (
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="writer">Redactor</option>
                <option value="editor">Editor</option>
                <option value="client">Cliente</option>
              </select>
            )}
            <button type="submit" disabled={loading} style={{
              padding: '13px', background: '#1A1A18', color: '#F0EFE9', border: 'none',
              borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.3, marginTop: 4,
              opacity: loading ? 0.7 : 1, transition: 'background 0.15s',
            }}
              onMouseEnter={e => { if (!loading) e.target.style.background = '#2E2E2A'; }}
              onMouseLeave={e => { e.target.style.background = '#1A1A18'; }}
            >
              {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#888882' }}>
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#6D5BD0', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}