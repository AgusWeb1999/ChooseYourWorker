-- ============================================
-- POLÍTICAS RLS ESTRICTAS PARA REVIEWS (OPCIONAL)
-- ============================================
-- Ejecutar SOLO si quieres validaciones más estrictas
-- El setup inicial ya funciona con políticas básicas

-- Ver estructura actual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'reviews'
ORDER BY ordinal_position;

-- Eliminar política básica
DROP POLICY IF EXISTS "Clientes autenticados pueden crear reviews" ON public.reviews;

-- Crear política ESTRICTA que valida jobs completados
CREATE POLICY "Solo clientes pueden crear reviews de profesionales" 
ON public.reviews FOR INSERT 
WITH CHECK (
  -- El usuario debe ser el cliente
  auth.uid() = client_id
  -- Si tiene job_id, debe ser un job completado
  AND (
    job_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE id = job_id 
      AND client_id = auth.uid()
      AND professional_id = public.reviews.professional_id
      AND status = 'completed'
    )
  )
  -- No permitir duplicados por job
  AND (
    job_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM public.reviews r2
      WHERE r2.job_id = job_id
      AND r2.id != public.reviews.id
    )
  )
);

SELECT '✅ Políticas RLS estrictas aplicadas' as status;
