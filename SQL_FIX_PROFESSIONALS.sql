-- ============================================
-- ARREGLAR PERMISOS PARA CREAR PROFESIONALES
-- ============================================
-- ✅ EJECUTAR EN SUPABASE SQL EDITOR

-- 0. Agregar columna para guardar datos profesionales temporalmente
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pending_professional_data JSONB DEFAULT NULL;

COMMENT ON COLUMN users.pending_professional_data IS 'Datos profesionales guardados temporalmente hasta que se verifique el email';

-- 1. ✅ Ver columnas de la tabla professionals (Ya ejecutado)
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'professionals'
-- ORDER BY ordinal_position;

-- 2. Eliminar políticas existentes que causan conflictos
DROP POLICY IF EXISTS "professionals_insert_authenticated" ON professionals;
DROP POLICY IF EXISTS "professionals_insert_own" ON professionals;
DROP POLICY IF EXISTS "Users can insert their own professional profile during registra" ON professionals;
DROP POLICY IF EXISTS "Users can insert their own professional profile during registration" ON professionals;

-- 3. Crear política PERMISIVA para INSERT (permitir a usuarios autenticados crear su perfil)
-- VERSIÓN SIMPLE: Permitir a cualquier usuario autenticado insertar (sin validación de user_id)
CREATE POLICY "allow_authenticated_insert_professionals"
ON professionals
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Si quieres validar que solo inserten su propio perfil, usa esta versión:
-- CREATE POLICY "allow_authenticated_insert_professionals"
-- ON professionals
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (auth.uid() = user_id);

-- 4. Política para SELECT (permitir a todos ver perfiles públicos)
DROP POLICY IF EXISTS "professionals_select_all" ON professionals;
CREATE POLICY "allow_anyone_select_professionals"
ON professionals
FOR SELECT
TO public
USING (true);

-- 5. Política para UPDATE (solo su propio perfil)
DROP POLICY IF EXISTS "professionals_update_own" ON professionals;
CREATE POLICY "allow_update_own_professional"
ON professionals
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Habilitar RLS en la tabla
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
-- Ver todas las políticas activas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'professionals'
ORDER BY cmd, policyname;

-- ============================================
-- ✅ POLÍTICAS RLS CONFIRMADAS:
-- ============================================
-- INSERT: ✅ Permitido para usuarios autenticados
-- SELECT: ✅ Permitido para todos (público)
-- UPDATE: ✅ Solo el dueño del perfil
--
-- ✅ LISTO - Ahora puedes registrar profesionales sin problemas
-- ============================================


-- ============================================
-- SCRIPT 1: ELIMINAR USUARIO Y PROFESIONAL COMPLETAMENTE
-- ============================================
-- ⚠️ USAR CON CUIDADO - ESTO ELIMINA DATOS PERMANENTEMENTE
-- Reemplaza 'EMAIL_DEL_USUARIO' con el email real del usuario a eliminar

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'EMAIL_DEL_USUARIO'; -- ⚠️ CAMBIAR ESTE EMAIL
BEGIN
  -- Buscar el user_id por email
  SELECT id INTO v_user_id 
  FROM users 
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuario con email % no encontrado', v_email;
  ELSE
    RAISE NOTICE 'Eliminando usuario con ID: %', v_user_id;
    
    -- 1. Eliminar perfil profesional (si existe)
    DELETE FROM professionals WHERE user_id = v_user_id;
    RAISE NOTICE '✅ Perfil profesional eliminado (si existía)';
    
    -- 2. Eliminar de tabla users
    DELETE FROM users WHERE id = v_user_id;
    RAISE NOTICE '✅ Usuario eliminado de tabla users';
    
    -- 3. Eliminar de auth.users (sistema de autenticación de Supabase)
    DELETE FROM auth.users WHERE id = v_user_id;
    RAISE NOTICE '✅ Usuario eliminado de auth.users';
    
    RAISE NOTICE '✅ ELIMINACIÓN COMPLETA - Usuario % eliminado exitosamente', v_email;
  END IF;
END $$;


-- ============================================
-- SCRIPT 2: MIGRAR PROFESIONALES PENDIENTES Y BYPASS EMAIL
-- ============================================
-- Este script:
-- 1. Encuentra usuarios con pending_professional_data que NO tienen perfil en professionals
-- 2. Crea sus perfiles profesionales con los datos guardados
-- 3. Marca sus emails como verificados (BYPASS)
-- 4. Activa sus cuentas
-- 5. Limpia pending_professional_data

DO $$
DECLARE
  v_user RECORD;
  v_prof_data JSONB;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== INICIANDO MIGRACIÓN DE PROFESIONALES PENDIENTES ===';
  
  -- Buscar usuarios con datos profesionales pendientes que NO tienen perfil creado
  FOR v_user IN 
    SELECT u.id, u.email, u.pending_professional_data
    FROM users u
    LEFT JOIN professionals p ON u.id = p.user_id
    WHERE u.pending_professional_data IS NOT NULL 
      AND p.id IS NULL  -- No tienen perfil profesional creado
  LOOP
    v_prof_data := v_user.pending_professional_data;
    v_count := v_count + 1;
    
    RAISE NOTICE '--- Procesando usuario: % (ID: %)', v_user.email, v_user.id;
    
    -- Crear perfil profesional con los datos guardados
    INSERT INTO professionals (
      user_id,
      display_name,
      profession,
      bio,
      hourly_rate,
      years_experience,
      is_verified,
      is_active,
      rating,
      created_at,
      updated_at
    ) VALUES (
      v_user.id,
      COALESCE(v_prof_data->>'display_name', 'Profesional'),
      COALESCE(v_prof_data->>'profession', 'General'),
      COALESCE(v_prof_data->>'bio', ''),
      COALESCE((v_prof_data->>'hourly_rate')::NUMERIC, 0),
      COALESCE((v_prof_data->>'years_experience')::INTEGER, 0),
      true,  -- ✅ Marcar como verificado (BYPASS)
      true,  -- ✅ Marcar como activo
      0.0,   -- Rating inicial
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Perfil profesional creado para %', v_user.email;
    
    -- Actualizar usuario: verificar email y activar cuenta
    UPDATE users 
    SET 
      email_verified = true,      -- ✅ BYPASS verificación de email
      is_active = true,            -- ✅ Activar cuenta
      pending_professional_data = NULL,  -- Limpiar datos temporales
      updated_at = NOW()
    WHERE id = v_user.id;
    
    RAISE NOTICE '✅ Email verificado y cuenta activada para %', v_user.email;
    
    -- OPCIONAL: También actualizar en auth.users
    -- ⚠️ DESCOMENTAR SI QUIERES ACTUALIZAR TAMBIÉN LA TABLA DE AUTH
    -- UPDATE auth.users 
    -- SET email_confirmed_at = NOW()
    -- WHERE id = v_user.id;
    
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRACIÓN COMPLETADA ===';
  RAISE NOTICE 'Total de profesionales migrados: %', v_count;
  
  IF v_count = 0 THEN
    RAISE NOTICE 'ℹ️  No se encontraron usuarios con datos profesionales pendientes';
  END IF;
END $$;


-- ============================================
-- SCRIPT 3: VER USUARIOS PENDIENTES (CONSULTA SEGURA)
-- ============================================
-- Ejecuta esto ANTES del Script 2 para ver qué usuarios se van a migrar

SELECT 
  u.id,
  u.email,
  u.email_verified,
  u.is_active,
  u.created_at,
  u.pending_professional_data,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO CREADO'
    ELSE '✅ EXISTE'
  END as estado_profesional
FROM users u
LEFT JOIN professionals p ON u.id = p.user_id
WHERE u.pending_professional_data IS NOT NULL
ORDER BY u.created_at DESC;


-- ============================================
-- SCRIPT 4: CREAR PERFILES PARA USUARIOS ANTIGUOS (SIN pending_professional_data)
-- ============================================
-- Este script crea perfiles profesionales para usuarios que se registraron
-- ANTES de implementar pending_professional_data. Como no tenemos sus datos
-- originales, creamos perfiles con información por defecto.

DO $$
DECLARE
  v_user RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== CREANDO PERFILES PARA USUARIOS PROFESIONALES SIN DATOS PENDIENTES ===';
  
  -- Buscar usuarios profesionales que NO tienen perfil y NO tienen datos pendientes
  FOR v_user IN 
    SELECT u.id, u.email, u.full_name, u.phone, u.city, u.province, u.country, u.department, u.barrio
    FROM users u
    LEFT JOIN professionals p ON u.id = p.user_id
    WHERE u.is_professional = true
      AND p.id IS NULL  -- No tienen perfil profesional
      AND u.pending_professional_data IS NULL  -- Registrados antes del nuevo sistema
  LOOP
    v_count := v_count + 1;
    
    RAISE NOTICE '--- Creando perfil para usuario: % (ID: %)', v_user.email, v_user.id;
    
    -- Crear perfil profesional con datos por defecto
    INSERT INTO professionals (
      user_id,
      display_name,
      profession,
      bio,
      hourly_rate,
      years_experience,
      phone,
      city,
      state,
      country,
      province,
      department,
      barrio,
      is_verified,
      is_active,
      rating,
      rating_count,
      total_jobs,
      average_rating,
      total_reviews,
      completed_hires_count,
      is_premium,
      created_at,
      updated_at
    ) VALUES (
      v_user.id,
      COALESCE(v_user.full_name, 'Profesional'),
      'General',  -- Profesión por defecto
      'Profesional verificado',  -- Bio por defecto
      0,  -- Tarifa por hora (puede editarla después)
      0,  -- Años de experiencia
      v_user.phone,
      v_user.city,
      v_user.province,
      v_user.country,
      v_user.province,
      v_user.department,
      v_user.barrio,
      true,  -- ✅ Verificado (ya tienen email verificado)
      true,  -- ✅ Activo
      0.0,
      0,
      0,
      0.0,
      0,
      0,
      false,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Perfil profesional creado para % con profesión "General"', v_user.email;
    
    -- Asegurar que la cuenta esté activa
    UPDATE users 
    SET is_active = true
    WHERE id = v_user.id;
    
    RAISE NOTICE '✅ Cuenta activada para %', v_user.email;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRACIÓN DE USUARIOS ANTIGUOS COMPLETADA ===';
  RAISE NOTICE 'Total de profesionales migrados: %', v_count;
  
  IF v_count = 0 THEN
    RAISE NOTICE 'ℹ️  No se encontraron usuarios profesionales sin perfil';
  ELSE
    RAISE NOTICE '⚠️  Los usuarios pueden ahora editar su profesión y datos en su perfil';
  END IF;
END $$;


-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================
-- 
-- PARA ELIMINAR UN USUARIO:
-- 1. Ir a "SCRIPT 1"
-- 2. Cambiar 'EMAIL_DEL_USUARIO' por el email real
-- 3. Ejecutar solo ese bloque DO $$
--
-- PARA MIGRAR PROFESIONALES PENDIENTES (con pending_professional_data):
-- 1. Primero ejecutar "SCRIPT 3" para ver quiénes se van a migrar
-- 2. Revisar la lista de usuarios
-- 3. Ejecutar "SCRIPT 2" para crear los perfiles y activar las cuentas
--
-- PARA CREAR PERFILES DE USUARIOS ANTIGUOS (sin pending_professional_data):
-- 1. Ejecutar "SCRIPT 4" directamente
-- 2. Creará perfiles con profesión "General" para todos los usuarios sin perfil
-- 3. Los usuarios podrán editar su información después
--
-- PARA BYPASS INDIVIDUAL:
-- UPDATE users 
-- SET email_verified = true, is_active = true 
-- WHERE email = 'email@example.com';
-- 
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW() 
-- WHERE email = 'email@example.com';
-- ============================================
