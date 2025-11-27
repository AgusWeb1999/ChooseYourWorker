# WorkingGo

Plataforma móvil para conectar clientes con trabajadores y profesionales de servicios.

## 📱 Proyecto

Esta es una aplicación React Native con Expo que permite:
- 👥 Buscar y contratar profesionales
- 💬 Chat interno entre clientes y profesionales
- ⭐ Sistema de reseñas y calificaciones
- 👤 Perfiles de usuario (clientes y profesionales)
- 📍 Búsqueda por ubicación y profesión

## 🏗️ Estructura del Proyecto

```
workinggo/
├── frontend/          # Aplicación React Native (Expo)
│   ├── app/          # Rutas y pantallas
│   ├── components/   # Componentes reutilizables
│   ├── src/          # Lógica de la app (contexts, lib)
│   └── assets/       # Imágenes y recursos
│
└── backend/          # Scripts SQL y migraciones
    ├── database-migrations.sql
    ├── repair-chat-complete.sql
    └── README.md
```

## 🚀 Comenzar

### Frontend (React Native)
```bash
cd frontend
npm install
npx expo start
```

### Backend (Supabase)
1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta `backend/database-migrations.sql` en SQL Editor
3. Configura las variables de entorno en `frontend/.env`
4. Habilita Realtime para las tablas `messages` y `conversations`

## 🔧 Tecnologías

- **Frontend:** React Native, Expo, TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Autenticación:** Supabase Auth
- **Base de Datos:** PostgreSQL con Row Level Security (RLS)
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
