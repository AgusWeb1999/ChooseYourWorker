-- Script para asignar un trabajo a un trabajador CON CONTACTO DEL CLIENTE
-- Uso: 
-- 1. Reemplaza 'WORKER_ID_AQUI' con el ID del trabajador
-- 2. Ejecuta el script completo
-- 3. Verás el trabajo creado CON los datos de contacto del cliente

-- ============================================
-- ASIGNAR TRABAJO CON CONTACTO A UN TRABAJADOR
-- ============================================

DO $$
DECLARE
  v_professional_id UUID := 'WORKER_ID_AQUI'::UUID; -- REEMPLAZA CON EL ID DEL WORKER
  v_client_id UUID;
  v_hire_id UUID;
  v_profession TEXT;
  v_client_name TEXT;
  v_client_phone TEXT;
  v_client_address TEXT;
  v_client_email TEXT;
BEGIN
  -- 1. Obtener la profesión del trabajador
  SELECT profession INTO v_profession
  FROM professionals
  WHERE user_id = v_professional_id;
  
  IF v_profession IS NULL THEN
    RAISE EXCEPTION 'No se encontró trabajador con ID: %', v_professional_id;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE '📋 Creando trabajo con contacto...';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Profesión del trabajador: %', v_profession;
  
  -- 2. Obtener un cliente random con datos de contacto
  SELECT 
    id,
    full_name,
    phone,
    address,
    email
  INTO 
    v_client_id,
    v_client_name,
    v_client_phone,
    v_client_address,
    v_client_email
  FROM users
  WHERE is_professional = false -- es cliente
    AND phone IS NOT NULL -- Que tenga teléfono
    AND address IS NOT NULL -- Que tenga dirección
  ORDER BY RANDOM()
  LIMIT 1;
  
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'No hay clientes con datos de contacto (phone + address) disponibles en la base de datos';
  END IF;
  
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
    'Trabajo de prueba - ' || v_profession,
    NOW()
  )
  RETURNING id INTO v_hire_id;
  
  -- 4. Mostrar resultado
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trabajo creado exitosamente!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 DETALLES DEL TRABAJO:';
  RAISE NOTICE '   Hire ID: %', v_hire_id;
  RAISE NOTICE '   Estado: pending (visible en ProfessionalJobs)';
  RAISE NOTICE '';
  RAISE NOTICE '👤 DATOS DEL CLIENTE:';
  RAISE NOTICE '   Nombre: %', v_client_name;
  RAISE NOTICE '   Email: %', v_client_email;
  RAISE NOTICE '   Teléfono: %', v_client_phone;
  RAISE NOTICE '   Dirección: %', v_client_address;
  RAISE NOTICE '';
  RAISE NOTICE '⚡ PASOS SIGUIENTES:';
  RAISE NOTICE '   1. El trabajador puede ver este trabajo en "Mis Trabajos"';
  RAISE NOTICE '   2. Si lo acepta (status = accepted), verá el contacto del cliente';
  RAISE NOTICE '   3. El teléfono y dirección se mostrarán en la UI';
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  
END $$;

-- ============================================
-- QUERY PARA VER EL TRABAJO CREADO CON CONTACTO
-- ============================================
SELECT 
  h.id as hire_id,
  h.status,
  h.created_at,
  u.full_name as client_name,
  u.email as client_email,
  u.phone as client_phone,
  u.address as client_address,
  p.profession,
  p.display_name as worker_name
FROM hires h
LEFT JOIN users u ON h.client_id = u.id
LEFT JOIN professionals p ON h.professional_id = p.user_id
WHERE h.professional_id = 'WORKER_ID_AQUI'::UUID
  AND h.status = 'pending'
ORDER BY h.created_at DESC
LIMIT 5;
