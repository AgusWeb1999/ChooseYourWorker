# 🔧 Arreglar Error de Conversaciones (Foreign Key 23503)

## ⚠️ Problema
Al intentar iniciar un chat entre cliente y profesional, aparece el error:
```
Error getting conversation (code:23503)
... violates foreign key constraint
```

## 🔍 Causa
Este error ocurre porque:
1. Hay usuarios en `auth.users` que no están sincronizados con `public.users`
2. La función `get_or_create_conversation` intenta crear conversaciones con IDs que no existen
3. Puede haber conversaciones huérfanas en la base de datos

## 📋 Solución - Pasos a seguir

### **Paso 1: Diagnosticar el problema**

Ejecuta en el SQL Editor de Supabase:
```
Archivo: backend/diagnose-conversations.sql
```

Este script te mostrará:
- ✅ Cuántos usuarios no están sincronizados
- ✅ Cuántas conversaciones tienen foreign keys inválidas
- ✅ Estado general del sistema

### **Paso 2: Ejecutar el fix**

Ejecuta en el SQL Editor de Supabase:
```
Archivo: backend/fix-conversations.sql
```

Este script hace lo siguiente:

1. **Sincroniza usuarios faltantes** de `auth.users` a `public.users`
2. **Elimina conversaciones huérfanas** con foreign keys inválidas
3. **Recrea la función** `get_or_create_conversation` con validaciones
4. **Actualiza las foreign keys** con `ON DELETE CASCADE`
5. **Verifica que todo esté correcto**

### **Paso 3: Verificar que funciona**

1. Recarga el frontend (presiona `r` en Expo)
2. Intenta iniciar una conversación
3. Verifica que no aparezca el error

---

## 🔎 Qué hace el fix en detalle

### **1. Sincronización de Usuarios**
```sql
-- Crea usuarios en public.users que solo existan en auth.users
INSERT INTO public.users (id, email, display_name, role, created_at)
SELECT au.id, au.email, ..., au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

### **2. Limpieza de Conversaciones**
```sql
-- Elimina conversaciones con usuarios que no existen
DELETE FROM conversations
WHERE user1_id NOT IN (SELECT id FROM users)
   OR user2_id NOT IN (SELECT id FROM users);
```

### **3. Función Mejorada**
```sql
-- La nueva función valida que los usuarios existan antes de crear
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id, user2_id)
  -- Valida que ambos usuarios existan
  -- Si no existe conversación, la crea
  -- Si existe, la devuelve
```

### **4. Foreign Keys con CASCADE**
```sql
-- Ahora si se elimina un usuario, se eliminan sus conversaciones
ALTER TABLE conversations
  ADD CONSTRAINT conversations_user1_id_fkey 
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE;
```

---

## 🚨 Errores Comunes

### **Error: "Usuario X no existe en public.users"**
**Solución**: El script de fix sincroniza automáticamente. Si persiste, ejecuta:
```sql
-- backend/sync-users-now.sql
```

### **Error: "Permission denied"**
**Solución**: Asegúrate de ejecutar el script con una cuenta con permisos de admin en Supabase.

### **Error: "Function already exists"**
**Solución**: El script usa `CREATE OR REPLACE`, así que sobrescribe la función automáticamente.

---

## 📊 Verificación Post-Fix

Para verificar que todo está bien, ejecuta:

```sql
-- Ver usuarios sincronizados
SELECT COUNT(*) FROM public.users;
SELECT COUNT(*) FROM auth.users;
-- Deben ser iguales

-- Ver conversaciones válidas
SELECT 
    c.id,
    u1.display_name as usuario1,
    u2.display_name as usuario2
FROM conversations c
INNER JOIN users u1 ON c.user1_id = u1.id
INNER JOIN users u2 ON c.user2_id = u2.id;
-- Todas deben tener nombres válidos

-- Verificar función
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_or_create_conversation';
-- Debe existir
```

---

## 🎯 Prevención Futura

El trigger de sincronización automática debería prevenir este problema:
```sql
-- backend/create-auto-sync-trigger.sql
```

Este trigger crea automáticamente el usuario en `public.users` cuando se registra en `auth.users`.

---

## 💡 Notas Importantes

1. **Backup**: Este script elimina conversaciones inválidas. No hay forma de recuperarlas.
2. **Idempotente**: Puedes ejecutar el script múltiples veces sin problemas.
3. **Tiempo**: El script debería tomar menos de 5 segundos en ejecutar.
4. **Seguridad**: Usa `SECURITY DEFINER` para que la función funcione correctamente.

---

## 📞 Si Persiste el Error

Si después de ejecutar el fix aún aparece el error:

1. **Verifica los logs de Supabase** para ver el mensaje completo
2. **Ejecuta el diagnóstico** de nuevo para ver qué falta
3. **Revisa que el trigger de sincronización** esté activo:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'sync_user_to_public';
   ```

---

**¡Este fix debería resolver completamente el problema! 🚀**
