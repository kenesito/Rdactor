# Content CMS

CMS colaborativo con flujo de aprobación de contenido escrito en tiempo real.

## Stack
| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Base de datos | MongoDB + Mongoose |
| Tiempo real | Socket.io |
| Auth | JWT |
| Deploy | Railway / Docker |

## Roles
| Rol | Permisos |
|---|---|
| `admin` | Todo: gestiona usuarios, contenido y publicaciones |
| `writer` | Crea contenido y lo envía a revisión |
| `editor` | Revisa, aprueba o solicita cambios |
| `client` | Solo visualiza contenido publicado |

---

## Desarrollo local

### Opción A — sin Docker (recomendado para desarrollo)

**Requisitos:** Node 20+, MongoDB local o Atlas

```bash
# 1. Instalar dependencias
npm run install:all

# 2. Configurar backend
cp backend/.env.example backend/.env
# Edita backend/.env con tu MongoDB URI y JWT_SECRET

# 3. Levantar todo
npm run dev
# Backend: http://localhost:5000
# Frontend: http://localhost:5173
```

### Opción B — solo MongoDB en Docker

```bash
# Levantar solo la base de datos
docker compose -f docker-compose.dev.yml up -d

# Luego correr backend y frontend normalmente
npm run dev
```

### Opción C — stack completo en Docker

```bash
# Crear .env en la raíz con JWT_SECRET
echo "JWT_SECRET=tu_secreto_aqui" > .env

# Build y levantar
docker compose up --build
# App: http://localhost:80
```

---

## Deployment en Railway (recomendado)

Railway permite deployar backend y frontend como servicios separados conectados entre sí.

### Paso 1 — Crear proyecto en Railway

1. Ve a [railway.app](https://railway.app) y crea una cuenta
2. Crea un **New Project**
3. Agrega un plugin de **MongoDB** desde el marketplace

### Paso 2 — Deploy del backend

1. En el proyecto, haz clic en **New Service → GitHub Repo**
2. Selecciona tu repositorio y apunta al directorio `/backend`
3. Railway detectará el `Dockerfile` automáticamente
4. Agrega estas variables de entorno en Railway:

```
NODE_ENV=production
MONGODB_URI=${{MongoDB.MONGODB_URL}}   ← Railway lo completa automáticamente
JWT_SECRET=genera_uno_seguro_aqui
CLIENT_URL=https://tu-frontend.railway.app
PORT=5000
```

5. Una vez deployado, copia la URL pública del backend (ej. `https://cms-backend.railway.app`)

### Paso 3 — Deploy del frontend

1. Agrega otro servicio al mismo proyecto → **GitHub Repo**
2. Apunta al directorio `/frontend`
3. Agrega estas variables de entorno:

```
VITE_API_URL=https://cms-backend.railway.app
VITE_SOCKET_URL=https://cms-backend.railway.app
```

4. Una vez deployado, copia la URL del frontend y actualiza `CLIENT_URL` en el backend

---

## Deployment en Render

### Backend
1. New Web Service → conecta tu repo → Root Directory: `backend`
2. Build Command: `npm install`
3. Start Command: `node src/index.js`
4. Variables de entorno: igual que Railway (usa tu MongoDB Atlas URI)

### Frontend
1. New Static Site → Root Directory: `frontend`
2. Build Command: `npm install && npm run build`
3. Publish Directory: `dist`
4. Variables de entorno: `VITE_API_URL` y `VITE_SOCKET_URL`

---

## Variables de entorno

### Backend (`backend/.env`)
| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `5000` |
| `MONGODB_URI` | Conexión a MongoDB | `mongodb+srv://...` |
| `JWT_SECRET` | Secreto para firmar tokens | `cadena_aleatoria_larga` |
| `CLIENT_URL` | URL del frontend (CORS) | `https://mi-app.railway.app` |
| `NODE_ENV` | Entorno | `production` |

### Frontend (`frontend/.env`)
| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del backend (vacío = usa proxy) |
| `VITE_SOCKET_URL` | URL para Socket.io |

---

## Endpoints API

### Auth
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/auth/register` | Público |
| POST | `/api/auth/login` | Público |
| GET | `/api/auth/me` | Autenticado |

### Contenido
| Método | Ruta | Roles |
|---|---|---|
| GET | `/api/content` | Todos (filtrado por rol) |
| POST | `/api/content` | writer, admin |
| GET | `/api/content/:id` | Todos |
| PUT | `/api/content/:id` | writer, admin |
| POST | `/api/content/:id/submit` | writer |
| POST | `/api/content/:id/review` | editor, admin |
| POST | `/api/content/:id/publish` | editor, admin |
| POST | `/api/content/:id/comment` | Todos |

### Usuarios
| Método | Ruta | Roles |
|---|---|---|
| GET | `/api/users` | admin |
| GET | `/api/users/editors` | Autenticado |
| PUT | `/api/users/:id/role` | admin |

---

## Estructura del proyecto

```
content-cms/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── sockets/
│   │   └── index.js
│   ├── Dockerfile
│   ├── railway.toml
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── railway.toml
│   └── package.json
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
```
