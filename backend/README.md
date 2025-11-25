# ChooseYourWorker - Backend

Base de datos y scripts SQL para la plataforma ChooseYourWorker.

## 📁 Archivos Importantes

### Scripts de Migración
- **`database-migrations.sql`** - Script principal de migración de base de datos (tablas, índices, triggers)
- **`repair-chat-complete.sql`** - Script para reparar/reinstalar el sistema de chat
- **`update-professions-to-spanish.sql`** - Script para actualizar profesiones a español

### Scripts de Desarrollo
- **`delete-user-complete.sql`** - Eliminar un usuario específico completamente
- **`reset-all-clients.sql`** - ⚠️ Eliminar TODOS los clientes y datos (reinicio completo)
- **`delete-clients-only.sql`** - Eliminar solo clientes (mantiene profesionales)

## 🗃️ Estructura de Base de Datos

### Tablas Principales
- **`users`** - Usuarios de la plataforma
- **`professionals`** - Perfiles de profesionales/trabajadores
- **`conversations`** - Conversaciones entre clientes y profesionales
- **`messages`** - Mensajes del sistema de chat
- **`reviews`** - Reseñas de clientes a profesionales

### Características
- ✅ Row Level Security (RLS) habilitado en todas las tablas
- ✅ Realtime habilitado en `messages` y `conversations`
- ✅ Triggers automáticos para actualizar timestamps
- ✅ Índices optimizados para búsquedas

## 🚀 Cómo Usar

### Primera Instalación
1. Ejecuta `database-migrations.sql` en Supabase SQL Editor
2. Habilita Realtime manualmente en el Dashboard para `messages` y `conversations`
3. Verifica que RLS esté habilitado en todas las tablas

### Reparar Chat
Si el sistema de chat tiene problemas:
```sql
-- Ejecuta en Supabase SQL Editor
-- backend/repair-chat-complete.sql
```

### Actualizar Profesiones
Para cambiar las profesiones de inglés a español:
```sql
-- Ejecuta en Supabase SQL Editor
-- backend/update-professions-to-spanish.sql
```

### Reiniciar Clientes (Desarrollo)

**⚠️ ADVERTENCIA:** Estos scripts eliminan datos. Solo usar en desarrollo.

**Eliminar todos los clientes y empezar de cero:**
```sql
-- Ejecuta en Supabase SQL Editor
-- backend/reset-all-clients.sql
-- Elimina: usuarios, conversaciones, mensajes, reseñas
```

**Eliminar solo clientes (mantener profesionales):**
```sql
-- Ejecuta en Supabase SQL Editor
-- backend/delete-clients-only.sql
-- Mantiene: profesionales y sus datos
```

**Eliminar un usuario específico:**
```sql
-- Ejecuta en Supabase SQL Editor
-- backend/delete-user-complete.sql
-- Modifica el email en el script antes de ejecutar
```

## ⚠️ Notas Importantes

- Los scripts están diseñados para PostgreSQL/Supabase
- Siempre haz backup antes de ejecutar scripts de migración
- Los scripts de reparación eliminarán datos existentes (útil en desarrollo)
- El script `delete-user-complete.sql` es solo para desarrollo

## 🔐 Configuración de Seguridad

Todas las tablas tienen políticas RLS configuradas:
- Los usuarios solo pueden ver sus propios datos
- Los clientes pueden ver todos los profesionales activos
- Los profesionales pueden actualizar su propio perfil
- Las conversaciones y mensajes solo son accesibles por los participantes

## 📦 Dependencias

- PostgreSQL 12+
- Supabase (para RLS y Realtime)
- Extension `uuid-ossp` para generación de UUIDs
