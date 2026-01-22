-- MIGRACIÓN: Agregar campo opcional 'costo' a la tabla reviews
ALTER TABLE reviews ADD COLUMN costo NUMERIC;
-- Campo opcional, no requiere valor por defecto ni not null
-- No se debe mostrar en listados ni perfiles, solo guardar el dato
