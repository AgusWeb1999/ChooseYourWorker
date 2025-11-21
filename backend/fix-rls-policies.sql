-- =====================================================
-- Script Rápido para Corregir Políticas RLS
-- Ejecutar solo este script si ya ejecutaste el anterior
-- =====================================================

-- Eliminar políticas antiguas y crear nuevas
DROP POLICY IF EXISTS "Anyone can view active professionals" ON public.professionals;
DROP POLICY IF EXISTS "Professionals can update their own profile" ON public.professionals;
DROP POLICY IF EXISTS "Professionals can insert their own profile" ON public.professionals;
DROP POLICY IF EXISTS "Authenticated users can create their professional profile" ON public.professionals;

-- Política para ver profesionales (cualquiera puede ver activos, usuarios ven su propio perfil)
CREATE POLICY "Anyone can view active professionals"
  ON public.professionals FOR SELECT
  USING (
    is_active = true 
    OR user_id IN (
      SELECT id FROM public.users WHERE auth_uid = auth.uid()
    )
  );

-- Política para actualizar (solo tu propio perfil)
CREATE POLICY "Professionals can update their own profile"
  ON public.professionals FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_uid = auth.uid()
    )
  );

-- Política para insertar (usuarios autenticados pueden crear su perfil)
CREATE POLICY "Authenticated users can create their professional profile"
  ON public.professionals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verificar que las políticas se crearon
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'professionals'
ORDER BY policyname;
