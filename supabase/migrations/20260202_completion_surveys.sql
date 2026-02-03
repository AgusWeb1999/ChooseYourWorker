-- Tabla para almacenar encuestas de finalización de solicitudes
CREATE TABLE IF NOT EXISTS public.completion_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hire_id UUID NOT NULL REFERENCES public.hires(id) ON DELETE CASCADE,
  resolved_with_platform BOOLEAN NOT NULL,
  professional_name TEXT,
  satisfaction_rating INTEGER NOT NULL CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un solo survey por hire
  CONSTRAINT unique_hire_survey UNIQUE (hire_id)
);

-- Índices para mejorar performance
CREATE INDEX idx_completion_surveys_hire_id ON public.completion_surveys(hire_id);
CREATE INDEX idx_completion_surveys_created_at ON public.completion_surveys(created_at);
CREATE INDEX idx_completion_surveys_resolved_platform ON public.completion_surveys(resolved_with_platform);

-- RLS Policies
ALTER TABLE public.completion_surveys ENABLE ROW LEVEL SECURITY;

-- Los clientes pueden insertar surveys de sus propios hires
CREATE POLICY "Clients can insert their own completion surveys"
  ON public.completion_surveys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hires
      WHERE hires.id = hire_id
      AND hires.client_id = auth.uid()
    )
  );

-- Los clientes pueden ver sus propios surveys
CREATE POLICY "Clients can view their own completion surveys"
  ON public.completion_surveys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hires
      WHERE hires.id = hire_id
      AND hires.client_id = auth.uid()
    )
  );

-- Los profesionales pueden ver surveys de sus hires
CREATE POLICY "Professionals can view surveys of their hires"
  ON public.completion_surveys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hires
      WHERE hires.id = hire_id
      AND hires.professional_id = (
        SELECT id FROM public.professionals WHERE user_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE public.completion_surveys IS 'Encuestas de finalización de servicios para recopilar feedback';
COMMENT ON COLUMN public.completion_surveys.resolved_with_platform IS 'Si resolvió con un profesional de la plataforma';
COMMENT ON COLUMN public.completion_surveys.professional_name IS 'Nombre del profesional (si resolvió con plataforma)';
COMMENT ON COLUMN public.completion_surveys.satisfaction_rating IS 'Calificación de satisfacción de 1 a 5 estrellas';
