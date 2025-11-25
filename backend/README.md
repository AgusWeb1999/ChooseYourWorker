# Backend - Choose Your Worker 🗄️

Scripts SQL esenciales para Supabase.

## 📚 Documentación

- **[SCRIPTS-README.md](./SCRIPTS-README.md)** 📖 Guía completa de todos los scripts SQL
- **[README-BIDIRECTIONAL-REVIEWS.md](./README-BIDIRECTIONAL-REVIEWS.md)** ⭐ Sistema de calificaciones bidireccionales

## 🚀 Quick Start

### 1. Configuración Inicial

Ejecuta en **Supabase SQL Editor**:
```
create-missing-functions.sql
```

Esto crea:
- ✅ Función `check_email_available()`
- ✅ Trigger `handle_new_user()` para sincronización automática

### 2. Arreglar Chat (si es necesario)

```
fix-conversations.sql
```

### 3. Verificar Todo Funciona

```
verificar-registro.sql
```

## 🔧 Scripts Disponibles

| Script | Propósito | Cuándo Usar |
|--------|-----------|-------------|
| `create-missing-functions.sql` ⭐ | Setup inicial completo | Primera vez / Después de reset |
| `fix-conversations.sql` 💬 | Arreglar sistema de chat | Si el chat no funciona |
| `diagnose-and-fix-users.sql` 🩹 | Sincronizar usuarios mal configurados | Si hay usuarios con tipo incorrecto |
| `verify-trigger-working.sql` 🔍 | Verificar triggers | Para diagnóstico |
| `verificar-registro.sql` ✅ | Ver estado de usuarios | Para verificar registros |
| `recreate-trigger-with-permissions.sql` 🔥 | Fix de emergencia del trigger | Si el trigger no funciona |
| `reset-all-clients.sql` ⚠️ | Reset completo | Solo desarrollo |

## 🗄️ Base de Datos

### Tablas Principales
- `auth.users` → Autenticación (Supabase)
- `public.users` → Perfiles de usuario
- `public.professionals` → Perfiles de trabajadores  
- `public.reviews` → Clientes califican trabajadores
- `public.client_reviews` → Trabajadores califican clientes
- `public.conversations` → Conversaciones del chat
- `public.messages` → Mensajes del chat

### Triggers Activos
- `on_auth_user_created` → Sincroniza usuarios automáticamente
- Rating triggers → Actualizan promedios de calificaciones

## 🆘 Troubleshooting

**Problema:** No puedo registrarme  
**Solución:** `create-missing-functions.sql`

**Problema:** Me registro como cliente siendo trabajador  
**Solución:** 
1. `recreate-trigger-with-permissions.sql`
2. `diagnose-and-fix-users.sql`

**Problema:** El chat no funciona  
**Solución:** `fix-conversations.sql`

## 📖 Más Información

Ver **[SCRIPTS-README.md](./SCRIPTS-README.md)** para documentación completa.

---

✅ Sistema listo para producción
