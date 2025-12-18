-- Script para asignar un trabajo random a un trabajador para testing
-- Uso: Edita la variable p_professional_id con el ID del trabajador
-- Luego ejecuta el script completo

-- ============================================
-- ASIGNAR TRABAJO RANDOM A UN TRABAJADOR
-- ============================================

DO $$
DECLARE
  v_professional_id UUID := '6d5e7f8c-1234-5678-9abc-def012345678'::UUID; -- REEMPLAZA CON EL ID DEL WORKER
  v_client_id UUID;
  v_hire_id UUID;
  v_profession TEXT;
BEGIN
  -- 1. Obtener la profesión del trabajador
  SELECT profession INTO v_profession
  FROM professionals
  WHERE id = v_professional_id;
  
  IF v_profession IS NULL THEN
    RAISE EXCEPTION 'No se encontró trabajador con ID: %', v_professional_id;
  END IF;
  
  RAISE NOTICE 'Profesión del trabajador: %', v_profession;
  
  -- 2. Obtener un cliente random
  SELECT id INTO v_client_id
  FROM users
  WHERE is_professional = false -- es cliente
  ORDER BY RANDOM()
  LIMIT 1;
  
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'No hay clientes disponibles en la base de datos';
  END IF;
  
  RAISE NOTICE 'Cliente seleccionado: %', v_client_id;
  
  -- 3. Crear el hire (trabajo)
  INSERT INTO hires (
    client_id,
    professional_id,
    status,
    proposal_message,
    created_at
  ) VALUES (
    v_client_id,
    v_professional_id,
    'pending',
    'Trabajo de prueba para testing - ' || v_profession,
    NOW()
  )
  RETURNING id INTO v_hire_id;
  
  RAISE NOTICE '✅ Trabajo creado exitosamente!';
  RAISE NOTICE '   - Hire ID: %', v_hire_id;
  RAISE NOTICE '   - Profesional: %', v_professional_id;
  RAISE NOTICE '   - Cliente: %', v_client_id;
  RAISE NOTICE '   - Estado: pending (El trabajador puede verlo y aceptarlo)';
  
END $$;

-- ============================================
-- PARA VER LOS TRABAJOS DEL TRABAJADOR
-- ============================================
-- SELECT * FROM hires WHERE professional_id = '6d5e7f8c-1234-5678-9abc-def012345678'::UUID;

-- ============================================
-- PARA VER LOS TRABAJOS DEL CLIENTE
-- ============================================
-- SELECT * FROM hires WHERE client_id = (SELECT id FROM users WHERE is_professional = false LIMIT 1);
