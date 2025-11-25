# 🗄️ Backend - Scripts SQL

Scripts esenciales para configurar y mantener la base de datos de **Choose Your Worker**.

---

## 📚 Scripts Principales

### 🚀 **Setup Inicial** (Ejecutar en orden)

```
1. database-migrations.sql          # Estructura de BD + índices + RLS
2. create-auto-sync-trigger.sql     # Sincroniza auth.users → public.users
3. fix-professional-ratings.sql     # Sistema de calificaciones automático
4. fix-email-duplicates-complete.sql # Limpia y previene emails duplicados
5. repair-chat-complete.sql         # Sistema de chat
6. update-professions-to-spanish.sql # Traduce profesiones
```

### 🔧 **Mantenimiento**

| Script | Cuándo Usar |
|--------|-------------|
| `sync-users-now.sql` | Sincronizar usuarios existentes manualmente |
| `delete-user-complete.sql` | Eliminar un usuario y todos sus datos |
| `delete-clients-only.sql` | Eliminar solo clientes (no profesionales) |
| `reset-all-clients.sql` | ⚠️ Eliminar TODOS los clientes (solo dev) |

---

## 🎯 Guía Rápida

### **Primera Vez**
1. Abre [Supabase Dashboard](https://supabase.com) → Tu Proyecto → **SQL Editor**
2. Ejecuta los 6 scripts del **Setup Inicial** en orden
3. Listo! 🎉

### **Ejecutar un Script**
1. SQL Editor → **New Query**
2. Copia y pega el script
3. Click **RUN** (o `Cmd+Enter`)
4. Lee los mensajes en la consola

📖 **Guía Detallada**: [`GUIA-EJECUTAR-SCRIPTS.md`](./GUIA-EJECUTAR-SCRIPTS.md)

---

## 📦 Detalles de Cada Script

### `database-migrations.sql`
Crea/actualiza toda la estructura de la base de datos:
- Tablas: users, professionals, jobs, reviews, etc.
- Índices para performance
- Row Level Security (RLS)
- Triggers y funciones

### `create-auto-sync-trigger.sql`
Sincronización automática de usuarios:
- Trigger: `auth.users` → `public.users`
- Se ejecuta en cada registro nuevo
- Previene duplicados con `ON CONFLICT`

### `fix-professional-ratings.sql`
Sistema automático de calificaciones:
- Trigger que actualiza rating promedio
- Recalcula ratings existentes
- Actualiza contador de reseñas

### `fix-email-duplicates-complete.sql` ✨
**IMPORTANTE**: Solución completa para emails duplicados
- ✅ Diagnóstico de duplicados
- ✅ Limpieza inteligente (mantiene el más antiguo)
- ✅ Constraint UNIQUE en email
- ✅ Mejora del trigger de sincronización
- ✅ Función de validación para el frontend

**Ejecución**: Lee [`GUIA-EJECUTAR-SCRIPTS.md`](./GUIA-EJECUTAR-SCRIPTS.md)

### `repair-chat-complete.sql`
Sistema de chat y mensajería:
- Verifica/crea tablas: conversations, messages
- Políticas de seguridad
- Índices optimizados

### `update-professions-to-spanish.sql`
Traduce profesiones al español:
- Carpenter → Carpintero
- Plumber → Plomero
- etc.

### `delete-user-complete.sql`
⚠️ **PELIGRO**: Elimina un usuario y TODOS sus datos
```sql
-- 1. Edita la línea 19
v_email TEXT := 'usuario@ejemplo.com'; -- 👈 Cambia esto

-- 2. Ejecuta el script
-- 3. Verifica con las queries al final
```

---

## 🆘 Problemas Comunes

| Error | Solución |
|-------|----------|
| `relation does not exist` | Ejecuta `database-migrations.sql` primero |
| `trigger already exists` | Normal, el script usa `DROP TRIGGER IF EXISTS` |
| `permission denied` | Verifica que estás en el proyecto correcto |
| `duplicate key violation` | Ejecuta `fix-email-duplicates-complete.sql` |

---

## 📁 Estructura del Directorio

```
backend/
├── README.md                           ← Estás aquí
├── GUIA-EJECUTAR-SCRIPTS.md           ← Guía detallada
│
├── 🚀 Setup Inicial
├── database-migrations.sql            
├── create-auto-sync-trigger.sql       
├── fix-professional-ratings.sql       
├── fix-email-duplicates-complete.sql  
├── repair-chat-complete.sql           
├── update-professions-to-spanish.sql  
│
├── 🔧 Mantenimiento
├── sync-users-now.sql                 
├── delete-user-complete.sql           
├── delete-clients-only.sql            
└── reset-all-clients.sql              
```

---

**Última actualización**: 2025-11-25
