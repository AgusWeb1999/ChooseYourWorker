-- Migraciones de Base de Datos para ChooseYourWorker
-- Ejecutar estos scripts en Supabase SQL Editor

-- =====================================================
-- 1. Actualizar la tabla professionals existente con nuevos campos
-- =====================================================

-- NOTA: La tabla professionals ya existe en Supabase
-- Solo agregamos las columnas nuevas necesarias

-- Agregar columnas para fecha de nacimiento e identificación
ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS identification_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS identification_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS total_jobs INTEGER DEFAULT 0;

-- Agregar constraint de tipo de identificación si no existe
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

-- Agregar índices para mejorar el rendimiento de búsquedas (los que no existen)
CREATE INDEX IF NOT EXISTS idx_professionals_city ON public.professionals(city);
CREATE INDEX IF NOT EXISTS idx_professionals_state ON public.professionals(state);
CREATE INDEX IF NOT EXISTS idx_professionals_zip_code ON public.professionals(zip_code);
CREATE INDEX IF NOT EXISTS idx_professionals_is_active ON public.professionals(is_active);

-- =====================================================
-- 2. Actualizar tabla de usuarios existente
-- =====================================================

-- NOTA: La tabla users ya existe en Supabase
-- Solo agregamos la columna updated_at si no existe

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Índices para la tabla users (solo si no existen)
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON public.users(auth_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_professional ON public.users(is_professional);

-- =====================================================
-- 3. Agregar constraint UNIQUE para identificación
-- =====================================================

-- Agregar constraint UNIQUE si no existe (para evitar duplicados de identificación)
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

-- =====================================================
-- 4. Crear función para actualizar updated_at automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a la tabla users
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger a la tabla professionals
DROP TRIGGER IF EXISTS update_professionals_updated_at ON public.professionals;
CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Políticas de seguridad (Row Level Security)
-- =====================================================

-- Habilitar RLS en las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla users
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

-- Políticas para la tabla professionals
DROP POLICY IF EXISTS "Anyone can view active professionals" ON public.professionals;
CREATE POLICY "Anyone can view active professionals"
  ON public.professionals FOR SELECT
  USING (is_active = true);

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

-- =====================================================
-- 6. Crear tabla de trabajos/servicios (opcional)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  profession_required VARCHAR(100),
  location_city VARCHAR(100),
  location_state VARCHAR(50),
  location_zip_code VARCHAR(10),
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para la tabla jobs
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_professional_id ON public.jobs(professional_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_profession_required ON public.jobs(profession_required);
CREATE INDEX IF NOT EXISTS idx_jobs_location_city ON public.jobs(location_city);

-- Trigger para actualizar updated_at en jobs
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS en jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Políticas para jobs
DROP POLICY IF EXISTS "Anyone can view open jobs" ON public.jobs;
CREATE POLICY "Anyone can view open jobs"
  ON public.jobs FOR SELECT
  USING (status = 'open' OR client_id IN (
    SELECT id FROM public.users WHERE auth_uid = auth.uid()
  ) OR professional_id IN (
    SELECT id FROM public.professionals WHERE user_id IN (
      SELECT id FROM public.users WHERE auth_uid = auth.uid()
    )
  ));

DROP POLICY IF EXISTS "Clients can create jobs" ON public.jobs;
CREATE POLICY "Clients can create jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.users WHERE auth_uid = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clients can update their own jobs" ON public.jobs;
CREATE POLICY "Clients can update their own jobs"
  ON public.jobs FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM public.users WHERE auth_uid = auth.uid()
    )
  );

-- =====================================================
-- 7. Crear tabla de reseñas/ratings (opcional)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para reviews
CREATE INDEX IF NOT EXISTS idx_reviews_professional_id ON public.reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON public.reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON public.reviews(job_id);

-- Habilitar RLS en reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Clients can create reviews for completed jobs" ON public.reviews;
CREATE POLICY "Clients can create reviews for completed jobs"
  ON public.reviews FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.users WHERE auth_uid = auth.uid()
    ) AND job_id IN (
      SELECT id FROM public.jobs WHERE status = 'completed' AND client_id = reviews.client_id
    )
  );

-- =====================================================
-- 8. Función para actualizar el rating promedio de profesionales
-- =====================================================

CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.professionals
  SET rating = (
    SELECT AVG(rating)::DECIMAL(2,1)
    FROM public.reviews
    WHERE professional_id = NEW.professional_id
  ),
  rating_count = (
    SELECT COUNT(*)
    FROM public.reviews
    WHERE professional_id = NEW.professional_id
  ),
  total_jobs = (
    SELECT COUNT(*)
    FROM public.jobs
    WHERE professional_id = NEW.professional_id AND status = 'completed'
  )
  WHERE id = NEW.professional_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar rating cuando se crea una nueva reseña
DROP TRIGGER IF EXISTS update_rating_after_review ON public.reviews;
CREATE TRIGGER update_rating_after_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_rating();

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

/*
Para aplicar estas migraciones:

1. Ir a tu proyecto de Supabase
2. Navegar a SQL Editor
3. Crear un nuevo query
4. Copiar y pegar este script completo
5. Ejecutar el script

NOTA IMPORTANTE:
- Si las tablas ya existen, los comandos CREATE TABLE IF NOT EXISTS no las modificarán
- Los comandos ALTER TABLE solo agregarán las columnas si no existen
- Las políticas DROP POLICY IF EXISTS aseguran que no haya conflictos

VERIFICACIÓN:
Después de ejecutar, verifica que:
- La tabla 'professionals' tenga las columnas: date_of_birth, identification_type, identification_number
- Las políticas de seguridad estén activas
- Los índices se hayan creado correctamente

Para verificar las columnas de professionals:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'professionals';
*/
