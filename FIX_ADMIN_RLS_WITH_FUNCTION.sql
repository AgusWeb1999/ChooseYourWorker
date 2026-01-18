-- PRIMERO: Eliminar las políticas que causan problemas
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can view all hires" ON hires;
DROP POLICY IF EXISTS "Admins can view all professionals" ON professionals;
DROP POLICY IF EXISTS "Admins can view all reviews" ON reviews;

-- SEGUNDO: Crear función auxiliar para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_uid = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TERCERO: Crear políticas usando la función (sin subconsulta recursiva)

-- Política para que los admins puedan SELECT todos los usuarios
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
USING (is_admin() OR auth.uid() = auth_uid);

-- Política para que los admins puedan DELETE usuarios
CREATE POLICY "Admins can delete users"
ON users
FOR DELETE
USING (is_admin());

-- Política para que los admins puedan UPDATE usuarios  
CREATE POLICY "Admins can update users"
ON users
FOR UPDATE
USING (is_admin() OR auth.uid() = auth_uid);

-- También para la tabla hires
CREATE POLICY "Admins can view all hires"
ON hires
FOR SELECT
USING (is_admin());

-- También para la tabla professionals
CREATE POLICY "Admins can view all professionals"
ON professionals
FOR SELECT
USING (is_admin());

-- También para la tabla reviews
CREATE POLICY "Admins can view all reviews"
ON reviews
FOR SELECT
USING (is_admin());

-- CUARTO: Verificar que se crearon correctamente
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('users', 'hires', 'professionals', 'reviews')
AND policyname LIKE '%Admin%'
ORDER BY tablename, policyname;
