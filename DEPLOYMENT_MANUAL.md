# 🚀 MANUAL DE DEPLOYMENT - FitAidd

**Versión:** 1.0  
**Fecha:** Marzo 2026  
**Tiempo Estimado:** 30 minutos  
**Dificultad:** ⭐⭐ (Muy Fácil)

---

## 📋 Tabla de Contenidos

1. [Stack Tecnológico](#stack-tecnológico)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Paso 1: Subir a GitHub](#paso-1-subir-a-github)
4. [Paso 2: Desplegar Backend en Railway](#paso-2-desplegar-backend-en-railway)
5. [Paso 3: Desplegar Frontend en Vercel](#paso-3-desplegar-frontend-en-vercel)
6. [Verificación Final](#verificación-final)
7. [Troubleshooting](#troubleshooting)

---

# 📚 Stack Tecnológico

## Backend (Node.js + Express)

### Lenguaje & Runtime
- **Node.js** v20 (LTS)
- **NPM** v10+

### Framework Web
- **Express.js** v4.21.2 - Servidor web HTTP
- **Morgan** v1.10.1 - Logger HTTP requests

### Base de Datos
- **MongoDB Atlas** (Cloud) - Base de datos NoSQL
- **Mongoose** v8.18.2 - ODM (Object Document Mapper)

### Autenticación & Seguridad
- **Firebase Admin SDK** v13.6.0 - Autenticación OAuth
- **JWT (jsonwebtoken)** v9.0.2 - Tokens seguros
- **bcryptjs** v3.0.2 - Hash de contraseñas (10 rounds)
- **Helmet** v8.1.0 - Headers de seguridad
- **express-rate-limit** v8.1.0 - Rate limiting (100 req/15min)
- **express-mongo-sanitize** v2.2.0 - Sanitización MongoDB
- **xss-clean** v0.1.4 - Protección XSS
- **express-validator** v7.3.1 - Validación de entrada

### APIs & Integraciones
- **OpenAI** v6.8.1 - Generación de rutinas con IA
- **Stripe** v18.4.0 - Pagos en línea
- **Nodemailer** v7.0.10 - Envío de emails
- **web-push** v3.6.7 - Push notifications
- **axios** v1.12.2 - HTTP client

### Logging & Monitoreo
- **Winston** v3.18.3 - Logger estructurado
- **winston-daily-rotate-file** v5.0.0 - Log rotation diarios

### Documentación & Testing
- **Swagger** (swagger-jsdoc + swagger-ui-express) - Documentación API
- **Jest** v30.2.0 - Framework de testing
- **Supertest** v7.2.2 - Testing HTTP requests

### Utilidades
- **dotenv** v17.2.3 - Variables de entorno
- **node-cron** v4.2.1 - Tareas programadas
- **CORS** v2.8.5 - Cross-origin requests
- **google-auth-library** v10.4.1 - Autenticación Google

---

## Frontend (HTML5 + CSS3 + Vanilla JavaScript)

### Tecnologías Base
- **HTML5** - Markup semántico
- **CSS3** - Estilos responsive
- **JavaScript ES6+** - Lógica interactiva

### Características Principales
- **Progressive Web App (PWA)** - Service Workers + Manifest
- **Offline First** - Funcionalidad offline con caché
- **Responsive Design** - Mobile-first
- **Firebase Auth** - Login con Google OAuth

### Estructura de Carpetas

```
frontend/
├── index.html              # Página principal
├── manifest.json           # Config PWA
├── service-worker.js       # Service Worker para caché/push
├── pages/                  # Páginas HTML
│   ├── home.html
│   ├── login.html
│   ├── register.html
│   ├── perfil.html
│   ├── estadisticas.html
│   ├── entrenador.html
│   ├── nutricion.html
│   ├── chatbot.html
│   └── ...
├── scripts/                # JavaScripts
│   ├── config.js           # Config de API
│   ├── auth-guard.js       # Protección de rutas
│   ├── notifications.js    # Sistema de notificaciones
│   ├── home.js             # Lógica home
│   ├── login.js            # Lógica login
│   ├── register.js         # Lógica registro
│   └── ...
├── styles/                 # CSS
│   ├── index.css           # Estilos globales
│   ├── login.css
│   ├── register.css
│   ├── perfil.css
│   └── ...
└── img/                    # Imágenes
    ├── servicios/
    ├── calculadoras/
    └── nutricion/
```

### Backend API Integration

```javascript
// En config.js
const CONFIG = {
  API_URL: 'https://fitaidd-api.railway.app'  // URL Railway backend
};
```

---

## 🏗️ Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────────┐
│                  CLIENTE (NAVEGADOR)                 │
│  Frontend: HTML5 + CSS3 + JavaScript Vanilla        │
│  ├─ Service Worker (offline + push)                 │
│  ├─ Firebase Auth (OAuth Google)                    │
│  └─ PWA Manifest + Icons                            │
└──────────────┬──────────────────────────────────────┘
               │ HTTPS / REST API
               │ (Vercel CDN → Railway)
┌──────────────▼──────────────────────────────────────┐
│           BACKEND (Node.js/Express)                  │
│  ├─ Rutas API REST                                  │
│  ├─ Autenticación JWT + Firebase                    │
│  ├─ Rate Limiting (100 req/15min)                   │
│  ├─ Validación entrada (express-validator)          │
│  ├─ Security Headers (Helmet)                       │
│  └─ Logging (Winston)                               │
│                                                      │
│  Integraciones:                                     │
│  ├─ OpenAI (generación rutinas)                     │
│  ├─ Stripe (pagos)                                 │
│  ├─ Nodemailer (emails)                            │
│  ├─ Firebase Admin (auth)                          │
│  └─ Web Push (notificaciones)                      │
└──────────────┬──────────────────────────────────────┘
               │ Driver MongoDB
               │ (Atlas Cloud)
┌──────────────▼──────────────────────────────────────┐
│          DATABASE (MongoDB Atlas)                    │
│  Cluster: cluster0.voa5ykf.mongodb.net             │
│  Database: FitAiid                                 │
│  Collections:                                       │
│  ├─ users (autenticación + perfil)                 │
│  ├─ workoutProgress (entrenamientos)               │
│  ├─ orders (pagos Stripe)                          │
│  ├─ products (catálogo)                            │
│  ├─ pushSubscriptions (notificaciones)             │
│  └─ customSchemas (datos personalizados)           │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Matriz de Tecnologías

| Capa | Componente | Tecnología | Version |
|------|-----------|-----------|---------|
| **Frontend** | Runtime | HTML5/CSS3/JavaScript | ES6+ |
| | Caché | Service Worker API | Native |
| | Auth | Firebase SDK | Latest |
| **Backend** | Runtime | Node.js | v20 LTS |
| | Framework | Express.js | v4.21 |
| | Validación | express-validator | v7.3 |
| | Seguridad | Helmet | v8.1 |
| | Rate Limit | express-rate-limit | v8.1 |
| **Database** | Motor | MongoDB | v5.0+ |
| | Driver | Mongoose | v8.18 |
| **Auth** | OAuth | Firebase Admin | v13.6 |
| | Tokens | JWT | v9.0 |
| **APIs** | IA | OpenAI | v6.8 |
| | Pagos | Stripe | v18.4 |
| | Email | Nodemailer | v7.0 |
| | Push | web-push | v3.6 |
| **Testing** | Framework | Jest | v30.2 |
| | HTTP | Supertest | v7.2 |

---

# ⚙️ Requisitos Pre-Deployment

✅ **Completados:**
- Node.js v20 instalado
- Git instalado
- Proyecto limpio (sin logs/archivos temporales)
- 17/17 tests passing
- 0 vulnerabilidades npm

✅ **Ya Tienes:**
- MongoDB Atlas configurada
- Firebase Admin SDK
- Variables de entorno (.env)
- OpenAI API key
- Stripe API key
- VAPID keys (notificaciones)

---

# Paso 1: Subir a GitHub

## 1.1 Crear Repositorio en GitHub

**⏱️ Tiempo: 2 minutos**

1. Ve a https://github.com/new
2. Llena los campos:
   - **Repository name:** `FitAidd`
   - **Description:** `Aplicación de fitness con IA y entrenamientos personalizados`
   - **Public** (selecciona público para que Vercel/Railway lo vean)
3. Clic en **Create repository**

**Resultado esperado:**
```
✅ Repositorio creado en:
https://github.com/TU_USUARIO/FitAidd
```

---

## 1.2 Subir Código a GitHub

**⏱️ Tiempo: 5 minutos**

Abre CMD en la carpeta `FitAidd` y ejecuta estos comandos:

### Comando 1: Inicializar Git Local
```cmd
git init
```
**Explicación:** Inicializa un repositorio git local

---

### Comando 2: Agregar Archivos
```cmd
git add .
```
**Explicación:** Prepara todos los archivos para commit

---

### Comando 3: Crear Primer Commit
```cmd
git commit -m "Initial commit: FitAidd staging deployment"
```
**Explicación:** Crea un snapshot del código con un mensaje descriptivo

---

### Comando 4: Cambiar Rama a main
```cmd
git branch -M main
```
**Explicación:** Cambia de `master` a `main` (estándar actual)

---

### Comando 5: Conectar con GitHub Remoto
```cmd
git remote add origin https://github.com/TU_USUARIO/FitAidd.git
```
**Reemplaza:** `TU_USUARIO` con tu usuario de GitHub

**Explicación:** Conecta tu repositorio local con GitHub

---

### Comando 6: Subir Código a GitHub
```cmd
git push -u origin main
```
**Explicación:** Sube el código a GitHub

**Resultado esperado:**
```
✅ Enumerating objects: 425
✅ Counting objects: 100% (425/425)
✅ Writing objects: 100%
✅ Branch 'main' set up to track remote branch 'main'
```

---

### ✅ Verificar Subida

Ve a https://github.com/TU_USUARIO/FitAidd y verifica que ves:
- ✅ Carpeta `backend/`
- ✅ Carpeta `frontend/`
- ✅ Archivo `README.md`
- ✅ Archivo `.gitignore`

---

# Paso 2: Desplegar Backend en Railway

## 2.1 Crear Cuenta en Railway

**⏱️ Tiempo: 3 minutos**

1. Ve a https://railway.app/
2. Haz clic en **"Start for free"**
3. Elige **GitHub** para login
4. Autoriza Railway a acceder a tu GitHub
5. ✅ Cuenta creada

---

## 2.2 Crear Proyecto en Railway

**⏱️ Tiempo: 5 minutos**

### Paso 1: Crear Nuevo Proyecto
```
1. Haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Busca y selecciona "FitAidd"
```

### Paso 2: Conectar Repositorio
```
1. Selecciona la rama "main"
2. Root Directory: "backend/" ← IMPORTANTE
3. Auto-deploy: ON (para que se actualice con cada push)
```

**Explicación del Root Directory:**
- Tu repositorio tiene `backend/` y `frontend/`
- Railway solo necesita desplegar el `backend/`
- Por eso especificamos `backend/` como raíz

### Paso 3: Agregar Variables de Entorno

En el panel de Railway, ve a **Variables** y agrega:

```
MONGODB_URI = mongodb+srv://michelsortega444:2007s1986s2010D@cluster0.voa5ykf.mongodb.net/FitAiid?appName=FitAiid

PORT = 5000

NODE_ENV = production

JWT_SECRET = TechStore_Super_Secret_Key_2025!

JWT_EXPIRES_IN = 24h

FIREBASE_ADMIN_SDK = {"type": "service_account", ...}

OPENAI_API_KEY = sk-...

STRIPE_SECRET_KEY = sk_...

VAPID_PUBLIC_KEY = BH5NRoA1tucvywFDHTef...

VAPID_PRIVATE_KEY = iYatNX1EcokCuw3ZNs4dg...

VAPID_EMAIL = mailto:michelsortega444@gmail.com

EMAIL_USER = michelsortega444@gmail.com

EMAIL_PASS = occh lyfs ekad pwwo
```

### Paso 4: Deploy

```
1. Haz clic en "Deploy"
2. Espera a que termine (2-3 minutos)
3. Verás una URL como: https://fitaidd-api.railway.app
```

**Resultado esperado:**
```
✅ Build successful
✅ App deployed
✅ URL: https://fitaidd-api.railway.app
```

---

## 2.3 Verificar Backend Funcionando

Abre tu navegador e ingresa:

```
https://fitaidd-api.railway.app/api/estadisticas/69a05da571820e5d373c8a21
```

**Resultado esperado:**
```
❌ Si ves: error 401 (sin token)
✅ CORRECTO - El backend responde, solo necesita autenticación

⚠️ Si ves: "Cannot GET" o timeout
❌ Hay problema - Revisar logs en Railway
```

---

# Paso 3: Desplegar Frontend en Vercel

## 3.1 Crear Cuenta en Vercel

**⏱️ Tiempo: 2 minutos**

1. Ve a https://vercel.com/
2. Haz clic en **"Sign Up"**
3. Elige **GitHub** para login
4. Autoriza Vercel a acceder a tu GitHub
5. ✅ Cuenta creada

---

## 3.2 Crear Proyecto en Vercel

**⏱️ Tiempo: 5 minutos**

### Paso 1: Importar Proyecto
```
1. En dashboard Vercel, haz clic en "Add New..."
2. Selecciona "Project"
3. Busca y selecciona el repo "FitAidd"
```

### Paso 2: Configurar Variables

```
1. Ve a "Environment Variables"
2. Agrega:
```

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://fitaidd-api.railway.app` |

**Explicación:**
- El frontend necesita saber dónde está el backend
- Usamos la URL de Railway que obtuvimos

### Paso 3: Configurar Root Directory

```
1. Ve a "Project Settings"
2. Root Directory: "frontend/" ← IMPORTANTE
```

### Paso 4: Deploy

```
1. Haz clic en "Deploy"
2. Espera a que termine (2-3 minutos)
3. Verás una URL como: https://fitaidd.vercel.app
```

**Resultado esperado:**
```
✅ Build successful
✅ Deployed to https://fitaidd.vercel.app
```

---

## 3.3 Actualizar config.js del Frontend

Si el frontend aún apunta a `localhost:5000`, actualiza manualmente:

**Archivo:** `frontend/scripts/config.js`

```javascript
// Cambiar de:
API_URL: 'http://localhost:5000'

// A:
API_URL: 'https://fitaidd-api.railway.app'
```

Luego:
```cmd
git add frontend/scripts/config.js
git commit -m "Update API URL for production"
git push
```

Vercel se actualizará automáticamente.

---

# ✅ Verificación Final

## Fase 1: Backend

```cmd
cd backend
npm start
```

**Debería ver:**
```
✅ Server running on port 5000
✅ MongoDB connected
```

---

## Fase 2: Login en Staging

1. Ve a `https://fitaidd.vercel.app`
2. Haz clic en **"Login"**
3. Ingresa:
   - **Email:** `admin@fitaiid.com`
   - **Password:** `Admin1234`

**Resultado esperado:**
```
✅ Login exitoso
✅ Redirige a /pages/home.html
✅ Carga estadísticas del servidor
```

---

## Fase 3: Probar Funcionalidades

### ✅ Registrar Usuario
```
1. Ve a /pages/register.html
2. Crea una cuenta nueva
3. Verifica que se cree en MongoDB
```

### ✅ Notificaciones Push
```
1. Haz click en campana 🔔
2. Haz click en "Activar Notificaciones"
3. Verifica que se guarde en pushSubscriptions
```

### ✅ Estadísticas
```
1. Ve a /pages/estadisticas.html
2. Verifica que cargue datos del backend
3. Los gráficos deben renderizar
```

---

# 🐛 Troubleshooting

## Problema 1: "Cannot connect to MongoDB"

**Síntoma:**
```
MongooseError: Cannot connect to MongoDB
```

**Solución:**
1. Ve a Railway → Variables
2. Verifica que `MONGODB_URI` sea correcta
3. Verifica que IP de Railway está en MongoDB Atlas whitelist
   - MongoDB Atlas → Network Access → Add Current IP (0.0.0.0/0)

---

## Problema 2: CORS Error en Vercel

**Síntoma:**
```
Access to XMLHttpRequest blocked by CORS
```

**Solución:**

En `backend/src/app.js`:
```javascript
const corsOptions = {
  origin: [
    'https://fitaidd.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

Luego:
```cmd
git add .
git commit -m "Fix CORS for production"
git push
```

Railway se actualizará automáticamente.

---

## Problema 3: Service Worker No Funciona

**Síntoma:**
```
Failed to register ServiceWorker
```

**Solución:**
1. Verifica que `service-worker.js` está en raíz del frontend
2. En config.js:
```javascript
const CONFIG = {
  API_URL: 'https://fitaidd-api.railway.app'
};
```
3. Haz push a GitHub → Vercel se actualiza

---

## Problema 4: "Timeout esperando Service Worker"

**Solución:**
Ya está arreglado en `notifications.js` con rate limiting.

Si persiste:
1. Abre DevTools (F12)
2. Ve a **Application** → **Service Workers**
3. Verifica que dice "✅ active and running"

---

## Problema 5: Variables de Entorno No Cargan

**Síntoma:**
```
undefined API_URL
```

**Solución en Vercel:**
1. Ve a Project Settings
2. Environment Variables
3. Verifica que `VITE_API_URL` está ahí
4. Redeploy: Haz un push a GitHub

---

## Problema 6: Build falls en Railway

**Síntoma:**
```
Build error: npm ERR!
```

**Solución:**
1. En Railway, ve a **Deployments**
2. Haz clic en el deploy fallido
3. Mira los logs para ver el error
4. Generalmente es por:
   - Variable de entorno faltante
   - Error en código
   - Dependencia no instalada

---

# 🎉 ¡Deployment Exitoso!

**URLs para acceder:**

```
Frontend:  https://fitaidd.vercel.app
Backend:   https://fitaidd-api.railway.app
Admin:     https://fitaidd.vercel.app/pages/login.html

Credenciales Staging:
Email: admin@fitaiid.com
Pass:  Admin1234
```

---

# 📞 Soporte

Si tienes problemas:

1. **Check Railway Logs:**
   ```
   Railway Dashboard → Deployments → View Logs
   ```

2. **Check Vercel Logs:**
   ```
   Vercel Dashboard → Deployments → View Details
   ```

3. **Check Browser DevTools:**
   ```
   F12 → Console → Ver errores JavaScript
   F12 → Network → Ver requests fallidas
   ```

---

## 🚀 ¡Listo para Producción!

Cuando quieras ir a producción:
1. Compra dominio en Namecheap
2. Apunta DNS a Vercel
3. Configura CORS con tu dominio
4. Deploy

**Tiempo total módulo:** ~30 minutos ✅
