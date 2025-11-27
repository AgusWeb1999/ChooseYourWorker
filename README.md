# 🚀 WorkingGo

**Plataforma móvil para conectar clientes con profesionales de servicios.**

Desarrollada por dos estudiantes de ingeniería con la misión de ayudar a personas con servicios a ofrecerlos y hacer crecer su negocio.

## ✨ Características

- � **Búsqueda de Profesionales** - Encuentra trabajadores por profesión y ubicación
- 💬 **Chat en Tiempo Real** - Comunicación directa entre clientes y profesionales
- ⭐ **Sistema de Reseñas** - Calificaciones y opiniones transparentes
- � **Fotos de Perfil** - Avatares personalizados para todos los usuarios
- 👤 **Perfiles Completos** - Información detallada de profesionales (tarifas, experiencia, ubicación)
- � **Autenticación Segura** - Sistema de registro y login robusto

## 📁 Estructura del Proyecto

```
workinggo/
├── frontend/                    # React Native App (Expo)
│   ├── app/                    # Pantallas y rutas
│   │   ├── (tabs)/            # Navegación principal
│   │   ├── auth/              # Autenticación
│   │   ├── chat/              # Sistema de mensajes
│   │   └── professional/      # Perfiles de trabajadores
│   ├── components/             # Componentes reutilizables
│   ├── src/                    # Lógica y utilidades
│   │   ├── contexts/          # React Context (Auth)
│   │   ├── config/            # Configuraciones
│   │   └── lib/               # Supabase client
│   └── assets/                # Imágenes y recursos
│
└── backend/                    # Scripts SQL
    ├── 1-setup-inicial.sql    # Setup completo del sistema
    ├── 2-reparacion.sql       # Reparación y mantenimiento
    ├── 3-utilidades.sql       # Scripts útiles
    └── README.md              # Documentación de backend
```

## 🚀 Inicio Rápido

### 1. Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta en [Supabase](https://supabase.com)
- Expo Go app (para testing en móvil)

### 2. Configurar Backend (Supabase)

```bash
# 1. Crea un proyecto en Supabase
# 2. Ve al SQL Editor
# 3. Ejecuta el script de setup inicial
#    → backend/1-setup-inicial.sql
```

### 3. Configurar Frontend

```bash
# Clonar repositorio
git clone [URL_DEL_REPO]
cd chooseYourWorker/frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crea archivo .env con:
EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Iniciar app
npx expo start
```

### 4. Ejecutar la App

- **iOS:** Escanea el QR con la cámara
- **Android:** Escanea el QR con Expo Go
- **Web:** Presiona `w` en la terminal

## �️ Tecnologías

### Frontend
- **React Native** - Framework móvil multiplataforma
- **Expo** - Herramientas de desarrollo y build
- **TypeScript** - Tipado estático
- **Expo Router** - Navegación basada en archivos
- **Expo Image Picker** - Subida de fotos

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos relacional
- **Supabase Auth** - Autenticación y autorización
- **Supabase Storage** - Almacenamiento de archivos
- **Supabase Realtime** - Actualizaciones en tiempo real
- **Row Level Security (RLS)** - Seguridad a nivel de fila

## 📖 Documentación

- **Backend:** Ver `backend/README.md` para scripts SQL y mantenimiento
- **Frontend:** Código autodocumentado con TypeScript
- **Estado del Proyecto:** Ver `PROYECTO-FINALIZADO.md`

## 🎯 Oferta de Lanzamiento

**Primer mes GRATIS para profesionales** que se registren ahora. Queremos ayudarte a crecer tu negocio sin costos iniciales.

## 📱 Publicación

### Web / iOS (PWA)
La app funciona como Progressive Web App para usuarios iOS sin necesidad de App Store.

### Android
Disponible para distribución nativa via APK o Google Play Store.

## 🤝 Contribuir

Este es un proyecto de estudiantes de ingeniería. Si quieres contribuir:
1. Fork el repositorio
2. Crea una rama con tu feature
3. Haz commit de tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

[Definir licencia]

## 📞 Contacto

- **Email:** info@workinggo.com
- **Teléfono:** 1-800-WORKER-1
- **Web:** www.workinggo.com

---

**WorkingGo** - Ayudando a profesionales a crecer y a clientes a encontrar servicios de calidad 💼✨
- **Tiempo Real:** Supabase Realtime (chat)

## 📚 Documentación

- [Frontend README](./frontend/README.md) - Documentación de la app
- [Backend README](./backend/README.md) - Scripts y base de datos

## 🔐 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Autenticación JWT con Supabase Auth
- Políticas de privacidad estrictas para datos de usuarios

## 🐛 Problemas Conocidos

### Chat no muestra mensajes en tiempo real
**Solución:** Ejecuta `backend/repair-chat-complete.sql` y habilita Realtime manualmente en Supabase Dashboard → Database → Replication para las tablas `messages` y `conversations`.

### Botón de reseñas no funciona
**Causa:** El usuario debe ser cliente (no profesional). Verifica `userProfile.is_professional` en el contexto de autenticación.

## 📝 Licencia

Este proyecto es privado y está en desarrollo.

## 👥 Autores

WorkingGo Team
