# 🆘 Recuperación de Emergencia - Datos Eliminados

## 😰 ¿Qué pasó?

Se ejecutó el script `fix-user-sync-conflicts.sql` que eliminó usuarios con emails duplicados.

**Consecuencias**:
- ❌ Reviews eliminadas
- ❌ Professionals eliminados  
- ❌ Relaciones rotas
- ❌ Datos perdidos

---

## 🔄 Soluciones en Orden de Prioridad

### 1️⃣ **RESTAURAR desde Backup de Supabase (RECOMENDADO)**

#### Pasos:
1. Ve a tu Dashboard de Supabase
2. Click en **Database** en el menú lateral
3. Click en **Backups**
4. Busca el backup más reciente **antes de ejecutar el script problemático**
5. Click en **Restore**
6. Confirma la restauración

⚠️ **IMPORTANTE**: Esto restaurará TODA la base de datos al estado del backup.

**Pros**:
- ✅ Recuperas TODO exactamente como estaba
- ✅ Es seguro y confiable

**Contras**:
- ❌ Pierdes cambios posteriores al backup
- ❌ Puede tomar varios minutos

---

### 2️⃣ **Verificar si hay Backups Automáticos**

Supabase hace backups automáticos diarios. Verifica:

```sql
-- Ver la fecha de creación de usuarios
SELECT id, email, created_at, updated_at
FROM public.users
ORDER BY updated_at DESC
LIMIT 20;
```

Si ves que algunos usuarios tienen `updated_at` muy reciente (hoy), probablemente fueron recreados incorrectamente.

---

### 3️⃣ **Recrear Manualmente (Solo si NO hay backup)**

Si no tienes backup, necesitas identificar qué se perdió:

#### A. Ver qué professionals ya no tienen usuario:

```sql
SELECT 
    p.id,
    p.user_id,
    'Profesional huérfano' as problema
FROM professionals p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;
```

#### B. Ver qué reviews ya no tienen autor:

```sql
SELECT 
    r.id,
    r.client_id,
    'Review huérfana' as problema
FROM reviews r
LEFT JOIN users u ON r.client_id = u.id
WHERE u.id IS NULL;
```

#### C. Recrear usuarios faltantes:

```sql
-- Primero, obtén los IDs de los usuarios que faltan
-- Luego búscalos en auth.users

SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'full_name' as full_name,
    au.created_at
FROM auth.users au
WHERE au.id IN (
    -- IDs de usuarios que faltan
    SELECT DISTINCT user_id FROM professionals WHERE user_id NOT IN (SELECT id FROM users)
    UNION
    SELECT DISTINCT client_id FROM reviews WHERE client_id NOT IN (SELECT id FROM users)
);

-- Insertar usuarios faltantes
INSERT INTO public.users (id, email, full_name, is_professional, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    EXISTS(SELECT 1 FROM professionals WHERE user_id = au.id),
    au.created_at,
    NOW()
FROM auth.users au
WHERE au.id IN (
    SELECT DISTINCT user_id FROM professionals WHERE user_id NOT IN (SELECT id FROM users)
    UNION
    SELECT DISTINCT client_id FROM reviews WHERE client_id NOT IN (SELECT id FROM users)
)
ON CONFLICT (email) DO NOTHING;
```

---

### 4️⃣ **Script de Reparación Completa**

```sql
-- REPARAR: Sincronizar todos los usuarios necesarios desde auth.users

-- Paso 1: Identificar usuarios necesarios
CREATE TEMP TABLE needed_users AS
SELECT DISTINCT user_id as id FROM professionals
UNION
SELECT DISTINCT client_id FROM reviews
UNION
SELECT DISTINCT professional_id FROM reviews -- por si acaso
UNION
SELECT DISTINCT participant1_id FROM conversations
UNION
SELECT DISTINCT participant2_id FROM conversations
UNION
SELECT DISTINCT sender_id FROM messages;

-- Paso 2: Sincronizar desde auth.users
INSERT INTO public.users (id, email, full_name, is_professional, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    EXISTS(SELECT 1 FROM professionals WHERE user_id = au.id),
    au.created_at,
    NOW()
FROM auth.users au
INNER JOIN needed_users nu ON au.id = nu.id
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = au.id);

-- Verificar
SELECT 
    'Professionals sin usuario' as problema,
    COUNT(*) as cantidad
FROM professionals p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'Reviews sin cliente',
    COUNT(*)
FROM reviews r
LEFT JOIN users u ON r.client_id = u.id
WHERE u.id IS NULL;
```

---

## 🎯 Recomendación Final

### **LA MEJOR OPCIÓN: Restaurar desde Backup**

1. Ve a Supabase Dashboard
2. Database → Backups
3. Restaura el backup de ANTES de ejecutar scripts
4. **NO ejecutes más el script `fix-user-sync-conflicts.sql`**

---

## 📞 Para el Futuro

### ✅ Reglas de Scripts SQL:

1. **NUNCA eliminar usuarios** que tienen relaciones
2. **Siempre hacer backup** antes de scripts destructivos
3. **Probar en modo lectura** primero (solo SELECT)
4. **Scripts deben ser idempotentes** (ejecutar múltiples veces = mismo resultado)
5. **NO usar DELETE** sin estar 100% seguro

---

## 🔍 Verificar Estado Actual

```sql
-- Cuántos usuarios hay
SELECT 'users' as tabla, COUNT(*) FROM users
UNION ALL
SELECT 'professionals', COUNT(*) FROM professionals
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'conversations', COUNT(*) FROM conversations;

-- Hay huérfanos?
SELECT 
    'Professionals huérfanos' as tipo,
    COUNT(*) as cantidad
FROM professionals p
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = p.user_id)
UNION ALL
SELECT 
    'Reviews huérfanas',
    COUNT(*)
FROM reviews r
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = r.client_id);
```

---

**¿Tienes backup disponible en Supabase?** Ese es el camino más seguro para recuperar todo.
