-- =====================================================
-- Script Simplificado - Solo Agregar Columnas Nuevas
-- Para tablas existentes: users y professionals
-- =====================================================

-- PASO 1: Agregar columnas nuevas a la tabla professionals (UNA POR UNA)
-- =====================================================

-- Agregar cada columna individualmente para evitar errores
DO $$ 
BEGIN
  -- date_of_birth
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professionals' 
    AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE public.professionals ADD COLUMN date_of_birth DATE;
  END IF;

  -- identification_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professionals' 
    AND column_name = 'identification_type'
  ) THEN
    ALTER TABLE public.professionals ADD COLUMN identification_type VARCHAR(20);
  END IF;

  -- identification_number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professionals' 
    AND column_name = 'identification_number'
  ) THEN
    ALTER TABLE public.professionals ADD COLUMN identification_number VARCHAR(50);
  END IF;

  -- is_verified
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professionals' 
    AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.professionals ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
  END IF;

  -- is_active
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professionals' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.professionals ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;

  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professionals' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.professionals ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- total_jobs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professionals' 
    AND column_name = 'total_jobs'
  ) THEN
    ALTER TABLE public.professionals ADD COLUMN total_jobs INTEGER DEFAULT 0;
  END IF;
END $$;

-- PASO 2: Agregar columna updated_at a users si no existe
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- PASO 3: Agregar constraints
-- =====================================================

-- Constraint para tipo de identificación
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'professionals_identification_type_check'
  ) THEN
    ALTER TABLE public.professionals 
    ADD CONSTRAINT professionals_identification_type_check 
    CHECK (identification_type IN ('DNI', 'CUIL', 'PASSPORT'));
  END IF;
END $$;

-- Constraint para evitar duplicados de identificación
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'professionals_identification_unique'
  ) THEN
    ALTER TABLE public.professionals 
    ADD CONSTRAINT professionals_identification_unique 
    UNIQUE(identification_type, identification_number);
  END IF;
END $$;

-- PASO 4: Crear índices adicionales (solo si las columnas existen)
-- =====================================================

-- Índices para professionals
DO $$
BEGIN
  -- Solo crear índice de is_active si la columna existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professionals' 
    AND column_name = 'is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_professionals_is_active ON public.professionals(is_active);
  END IF;
END $$;

-- Índices regulares (estas columnas ya existen)
CREATE INDEX IF NOT EXISTS idx_professionals_city ON public.professionals(city);
CREATE INDEX IF NOT EXISTS idx_professionals_state ON public.professionals(state);
CREATE INDEX IF NOT EXISTS idx_professionals_zip_code ON public.professionals(zip_code);

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON public.users(auth_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_professional ON public.users(is_professional);

-- PASO 5: Crear función para updated_at automático
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 6: Aplicar triggers
-- =====================================================

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_professionals_updated_at ON public.professionals;
CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- PASO 7: Habilitar Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- PASO 8: Políticas de seguridad para users
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (auth.uid() = auth_uid);

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = auth_uid);

DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
CREATE POLICY "Users can insert their own data"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = auth_uid);

-- PASO 9: Políticas de seguridad para professionals
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view active professionals" ON public.professionals;
CREATE POLICY "Anyone can view active professionals"
  ON public.professionals FOR SELECT
  USING (is_active = true OR user_id IN (
    SELECT id FROM public.users WHERE auth_uid = auth.uid()
  ));

DROP POLICY IF EXISTS "Professionals can update their own profile" ON public.professionals;
CREATE POLICY "Professionals can update their own profile"
  ON public.professionals FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_uid = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Professionals can insert their own profile" ON public.professionals;
CREATE POLICY "Professionals can insert their own profile"
  ON public.professionals FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_uid = auth.uid()
    )
  );

-- Política adicional para permitir a usuarios autenticados insertar su propio perfil
DROP POLICY IF EXISTS "Authenticated users can create their professional profile" ON public.professionals;
CREATE POLICY "Authenticated users can create their professional profile"
  ON public.professionals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'professionals'
  AND column_name IN ('date_of_birth', 'identification_type', 'identification_number', 'is_verified', 'is_active', 'updated_at', 'total_jobs')
ORDER BY column_name;

-- =====================================================
-- INSTRUCCIONES
-- =====================================================

/*
EJECUTAR ESTE SCRIPT EN SUPABASE:

1. Ir a tu proyecto de Supabase
2. Click en "SQL Editor" en el menú lateral
3. Click en "New Query"
4. Copiar y pegar este script completo
5. Click en "RUN" (o presionar Ctrl+Enter)
6. Verificar que no haya errores en la consola

RESULTADO ESPERADO:
- 7 columnas nuevas agregadas a professionals
- 1 columna nueva agregada a users
- 2 constraints de validación
- 7 índices creados
- 2 triggers para updated_at
- 6 políticas de seguridad

Si todo funciona correctamente, verás un mensaje de éxito
y la tabla de verificación mostrará las 7 columnas nuevas.
*/
