# ⚠️ NO EJECUTAR - Scripts Problemáticos

## Scripts que NO debes ejecutar:

### ❌ `fix-user-sync-conflicts.sql`
**PROBLEMA**: Este script elimina usuarios que tienen el mismo email pero diferente ID.
Esto rompe:
- Reviews existentes
- Professionals existentes  
- Conversaciones existentes
- Cualquier relación con esos usuarios

### ❌ `fix-conversations.sql` (versión actual)
**PROBLEMA**: Intenta sincronizar usuarios pero puede fallar si hay emails duplicados.

---

## ✅ Solución Correcta para el Error de Chat

### El Error Original:
```
Error getting conversation (code:23503)
... violates foreign key constraint
```

O:

```
Usuario 1 (67b8281c...) no existe en public.users
```

### La Solución SIMPLE:

**NO elimines usuarios existentes**. Solo necesitas sincronizar el usuario faltante SIN tocar los que ya existen.

---

## 📋 Script Seguro para Ejecutar

Usa este script en su lugar (próximamente: `sync-missing-user-safe.sql`):

```sql
-- Solo sincronizar el usuario específico que falta
-- SIN eliminar ni modificar usuarios existentes

-- Ver si el usuario existe
SELECT 
    'auth.users' as tabla,
    id,
    email
FROM auth.users 
WHERE id = '67b8281c-8604-414d-8464-88ea778aa6ea'
UNION ALL
SELECT 
    'public.users',
    id,
    email  
FROM public.users
WHERE id = '67b8281c-8604-414d-8464-88ea778aa6ea';

-- Si el usuario NO existe en public.users pero SÍ en auth.users
-- Y no hay conflicto de email, insertarlo

DO $$
DECLARE
    v_user_id UUID := '67b8281c-8604-414d-8464-88ea778aa6ea';
    v_email TEXT;
    v_full_name TEXT;
    v_exists_in_public BOOLEAN;
    v_email_conflict BOOLEAN;
BEGIN
    -- Verificar si existe en public
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = v_user_id) 
    INTO v_exists_in_public;
    
    IF v_exists_in_public THEN
        RAISE NOTICE 'Usuario ya existe en public.users';
        RETURN;
    END IF;
    
    -- Obtener datos de auth.users
    SELECT 
        email,
        COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
    INTO v_email, v_full_name
    FROM auth.users
    WHERE id = v_user_id;
    
    IF v_email IS NULL THEN
        RAISE NOTICE 'Usuario no existe en auth.users';
        RETURN;
    END IF;
    
    -- Verificar si hay conflicto de email
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = v_email AND id != v_user_id)
    INTO v_email_conflict;
    
    IF v_email_conflict THEN
        RAISE NOTICE '⚠️  Email % ya existe con otro ID', v_email;
        RAISE NOTICE '   NO se puede sincronizar sin resolver el conflicto';
        RAISE NOTICE '   Contacta al administrador';
        RETURN;
    END IF;
    
    -- Insertar el usuario
    INSERT INTO public.users (id, email, full_name, is_professional, created_at, updated_at)
    VALUES (
        v_user_id,
        v_email,
        v_full_name,
        false,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Usuario sincronizado correctamente';
END $$;
```

---

## 🔄 Cómo Recuperar los Datos

Si ya ejecutaste el script problemático:

### Opción 1: Restaurar desde backup de Supabase
1. Ve a Supabase Dashboard
2. Database → Backups
3. Restaura el backup más reciente

### Opción 2: Recrear el usuario eliminado manualmente
Si sabes qué usuario se eliminó, puedes recrearlo con sus IDs originales.

---

## 📞 Próximos Pasos

1. **NO ejecutes más scripts** hasta tener un plan claro
2. **Verifica tu backup** en Supabase
3. **Restaura si es necesario**
4. **Usa solo el script seguro** para sincronizar usuarios individuales

---

**IMPORTANTE**: Los scripts deben ser **IDEMPOTENTES** y **NO DESTRUCTIVOS**.
