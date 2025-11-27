# 🗄️ Backend - WorkingGoScripts SQL esenciales para la gestión de la base de datos de WorkingGo.---## 📋 Scripts Esenciales### **🔧 Configuración Inicial**#### `setup-avatar-system.sql`Configura el sistema de avatares (fotos de perfil) para usuarios y profesionales.- Agrega columna `avatar_url` a `users` y `professionals`- Configura bucket de almacenamiento en Supabase- Establece políticas de acceso#### `create-chat-system.sql`Crea el sistema de mensajería completo.- Tablas: `conversations` y `messages`- Políticas RLS para privacidad- Índices para rendimiento#### `enable-realtime.sql`Habilita actualizaciones en tiempo real para chat y notificaciones.---### **🔄 Sincronización y Triggers**#### `create-auto-sync-trigger.sql`Trigger principal que sincroniza usuarios entre `auth.users` y `public.users`.- Se ejecuta automáticamente al registrarse- Previene duplicados- **Ejecutar una sola vez en setup inicial**#### `recreate-trigger-with-permissions.sql`Recrea el trigger de avatares con permisos correctos.- Sincroniza `avatar_url` entre `users` y `professionals`- Se ejecuta al actualizar foto de perfil#### `sync-users-now.sql`Sincronización manual de usuarios existentes.- Útil para migración de datos- Ejecutar si hay usuarios en auth sin registro en public#### `sync-avatars.sql`Sincroniza avatares existentes entre tablas.- Ejecutar después de implementar sistema de avatares- Copia URLs de `users` a `professionals`---### **⚙️ Sistema de Reseñas y Ratings**#### `fix-rating-trigger-simple.sql`Configura el trigger que actualiza automáticamente los ratings de profesionales.- Calcula promedio de reseñas- Actualiza `rating` y `rating_count`- **Importante**: Ejecutar siguiendo `EJECUTAR-FIX-RATING-TRIGGER.md`#### `fix-reviews-rls.sql`Configura políticas de seguridad para el sistema de reseñas.- Lectura pública de reseñas- Solo clientes autenticados pueden crear- Solo autores pueden editar/eliminar---### **🔨 Reparación y Mantenimiento**#### `fix-email-duplicates-complete.sql`Limpia y previene duplicados de email en `public.users`.- Elimina duplicados manteniendo el más reciente- Agrega constraint único en email- **Ejecutar si hay problemas con emails duplicados**#### `fix-professionals-user-id.sql`Repara registros huérfanos en tabla `professionals`.- Elimina professionals sin `user_id` válido- Limpia datos inconsistentes#### `fix-chat-foreign-key.sql`
Repara relaciones en el sistema de chat.
- Corrige foreign keys rotas
- Limpia mensajes huérfanos

#### `repair-chat-complete.sql`
Reparación completa del sistema de chat.
- Recrea tablas si es necesario
- Restaura políticas RLS

---

### **🗑️ Utilidades de Limpieza**

#### `delete-user-complete.sql`
Elimina un usuario completamente del sistema.
- Borra de todas las tablas relacionadas
- Útil para testing
- **⚠️ Usar con precaución en producción**

#### `delete-clients-only.sql`
Elimina solo usuarios con rol de cliente.
- Mantiene profesionales intactos
- Útil para limpiar datos de prueba

#### `reset-all-clients.sql`
Resetea todos los clientes del sistema.
- Útil para testing
- **⚠️ No ejecutar en producción**

---

### **📝 Datos de Prueba**

#### `update-professions-to-spanish.sql`
Actualiza las profesiones a español.
- Traduce categorías de profesiones
- Mejora UX para usuarios hispanohablantes

---

## 📚 Documentación Adicional

### `DATABASE-SETUP.md`
Guía completa de configuración de la base de datos.

### `GUIA-EJECUTAR-SCRIPTS.md`
Instrucciones generales para ejecutar scripts SQL en Supabase.

### `EJECUTAR-FIX-RATING-TRIGGER.md`
Guía específica para configurar el sistema de ratings (paso a paso).

---

## 🚀 Orden de Ejecución Recomendado

### **Setup Inicial (Primera vez)**

1. `create-auto-sync-trigger.sql` - Sincronización automática
2. `create-chat-system.sql` - Sistema de mensajería
3. `setup-avatar-system.sql` - Sistema de avatares
4. `enable-realtime.sql` - Tiempo real
5. `fix-rating-trigger-simple.sql` - Sistema de ratings
6. `fix-reviews-rls.sql` - Políticas de reseñas

### **Migración de Datos Existentes**

1. `sync-users-now.sql` - Sincronizar usuarios
2. `sync-avatars.sql` - Sincronizar avatares
3. `fix-email-duplicates-complete.sql` - Limpiar duplicados
4. `fix-professionals-user-id.sql` - Reparar professionals

### **Mantenimiento Regular**

Ejecutar solo cuando sea necesario:
- `fix-chat-foreign-key.sql` - Si hay problemas en chat
- `repair-chat-complete.sql` - Si chat está completamente roto
- `fix-email-duplicates-complete.sql` - Si aparecen duplicados

---

## ⚠️ Precauciones

- **Siempre hacer backup** antes de ejecutar scripts de reparación
- **No ejecutar** scripts de limpieza (`delete-*`, `reset-*`) en producción sin confirmar
- **Leer la documentación** de cada script antes de ejecutarlo
- **Seguir el orden** recomendado para evitar problemas

---

## 🔍 Verificación

Después de ejecutar scripts, verifica que todo funcione:

```sql
-- Verificar usuarios
SELECT COUNT(*) FROM public.users;
SELECT COUNT(*) FROM auth.users;

-- Verificar sincronización
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM public.users) as public_users;

-- Verificar duplicados
SELECT email, COUNT(*) 
FROM public.users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Verificar ratings
SELECT display_name, rating, rating_count 
FROM professionals 
WHERE rating_count > 0;
```

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la documentación específica del script
2. Consulta `GUIA-EJECUTAR-SCRIPTS.md`
3. Verifica los logs de Supabase
4. Haz rollback si algo sale mal

---

**🎯 Estado:** Todos los scripts probados y funcionales  
**📅 Última actualización:** 27 de noviembre de 2025  
**🏷️ Versión:** 1.0.0
