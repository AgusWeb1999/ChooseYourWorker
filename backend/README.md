# ChooseYourWorker - Backend

Base de datos y scripts SQL para la plataforma ChooseYourWorker.

## 📁 Scripts Disponibles

### Scripts de Configuración
- **`database-migrations.sql`** - Script principal de migración (tablas, índices, triggers, RLS)
- **`create-auto-sync-trigger.sql`** - Sincronización automática de usuarios nuevos
- **`fix-professional-ratings.sql`** - Sistema de calificaciones automático
- **`repair-chat-complete.sql`** - Reparar/reinstalar el sistema de chat

### Scripts de Utilidad
- **`update-professions-to-spanish.sql`** - Actualizar profesiones a español
- **`sync-users-now.sql`** - Sincronizar usuarios manualmente
- **`delete-user-complete.sql`** - Eliminar un usuario específico
- **`delete-clients-only.sql`** - Eliminar solo clientes (mantiene profesionales)
- **`reset-all-clients.sql`** - ⚠️ Eliminar TODOS los clientes (uso con precaución)

## 🚀 Instalación

### Primera Vez
1. Ejecuta `database-migrations.sql` en Supabase SQL Editor
2. Ejecuta `create-auto-sync-trigger.sql` para sincronización automática
3. Ejecuta `fix-professional-ratings.sql` para el sistema de ratings
4. Habilita Realtime en el Dashboard para las tablas `messages` y `conversations`

### Reparar Chat
Si el sistema de chat tiene problemas:
```sql
-- Ejecuta: backend/repair-chat-complete.sql
```

## 🗃️ Estructura de Base de Datos

### Tablas Principales
- **`users`** - Usuarios (clientes y profesionales)
- **`professionals`** - Perfiles de profesionales
- **`conversations`** - Conversaciones de chat
- **`messages`** - Mensajes del chat
- **`reviews`** - Reseñas de profesionales
- **`client_reviews`** - Reseñas de clientes

### Características
- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Realtime en `messages` y `conversations`
- ✅ Triggers automáticos para timestamps y ratings
- ✅ Sincronización automática de usuarios

## ⚠️ Notas

- Scripts diseñados para PostgreSQL/Supabase
- Hacer backup antes de ejecutar scripts de migración
- Scripts de eliminación son solo para desarrollo
- El sistema de ratings se actualiza automáticamente con triggers
