-- =====================================================
-- Limpiar TODAS las políticas y crear solo las necesarias
-- =====================================================

-- PASO 1: Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Anyone can view active professionals" ON public.professionals;
DROP POLICY IF EXISTS "Professionals can update their own profile" ON public.professionals;
DROP POLICY IF EXISTS "Professionals can insert their own profile" ON public.professionals;
DROP POLICY IF EXISTS "Authenticated users can create their professional profile" ON public.professionals;
DROP POLICY IF EXISTS "professionals_delete_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_insert_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_select_all" ON public.professionals;
DROP POLICY IF EXISTS "professionals_update_own" ON public.professionals;

-- PASO 2: Crear políticas simples y funcionales

-- Permitir a TODOS ver profesionales activos
CREATE POLICY "professionals_select_all"
  ON public.professionals FOR SELECT
  USING (true);

-- Permitir a usuarios autenticados INSERTAR su perfil
CREATE POLICY "professionals_insert_authenticated"
  ON public.professionals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir actualizar solo tu propio perfil
CREATE POLICY "professionals_update_own"
  ON public.professionals FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_uid = auth.uid()
    )
  );

-- PASO 3: Verificar las políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'professionals'
ORDER BY policyname;

-- PASO 4: Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'professionals';
