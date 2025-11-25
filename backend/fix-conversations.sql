-- ==========================================
-- ARREGLAR: Conversaciones y Foreign Keys
-- ==========================================

-- PASO 1: Sincronizar usuarios faltantes primero
-- (por si hay usuarios en auth que no están en public)
INSERT INTO public.users (id, email, full_name, is_professional, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
    COALESCE((au.raw_user_meta_data->>'role')::text = 'professional', false) as is_professional,
    au.created_at,
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.id = au.id OR pu.email = au.email
);

-- PASO 2: Eliminar conversaciones con foreign keys inválidas
-- (conversaciones huérfanas que no se pueden reparar)
DELETE FROM conversations
WHERE id IN (
    SELECT c.id
    FROM conversations c
    LEFT JOIN users u1 ON c.participant1_id = u1.id
    LEFT JOIN users u2 ON c.participant2_id = u2.id
    WHERE u1.id IS NULL OR u2.id IS NULL
);

-- PASO 3: Verificar/Crear la función get_or_create_conversation
DROP FUNCTION IF EXISTS get_or_create_conversation(UUID, UUID);

CREATE OR REPLACE FUNCTION get_or_create_conversation(
    user1_id UUID,
    user2_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    conversation_id UUID;
    user1_exists BOOLEAN;
    user2_exists BOOLEAN;
BEGIN
    -- Verificar que ambos usuarios existen en public.users
    SELECT EXISTS(SELECT 1 FROM users WHERE id = user1_id) INTO user1_exists;
    SELECT EXISTS(SELECT 1 FROM users WHERE id = user2_id) INTO user2_exists;
    
    IF NOT user1_exists THEN
        RAISE EXCEPTION 'Usuario 1 (%) no existe en public.users', user1_id;
    END IF;
    
    IF NOT user2_exists THEN
        RAISE EXCEPTION 'Usuario 2 (%) no existe en public.users', user2_id;
    END IF;
    
    -- Buscar conversación existente (en cualquier orden)
    SELECT id INTO conversation_id
    FROM conversations
    WHERE (conversations.participant1_id = get_or_create_conversation.user1_id 
           AND conversations.participant2_id = get_or_create_conversation.user2_id)
       OR (conversations.participant1_id = get_or_create_conversation.user2_id 
           AND conversations.participant2_id = get_or_create_conversation.user1_id)
    LIMIT 1;
    
    -- Si no existe, crear nueva conversación
    IF conversation_id IS NULL THEN
        INSERT INTO conversations (participant1_id, participant2_id)
        VALUES (user1_id, user2_id)
        RETURNING id INTO conversation_id;
    END IF;
    
    RETURN conversation_id;
END;
$$;

-- PASO 4: Verificar las foreign keys de la tabla conversations
-- Si no existen, crearlas
DO $$
BEGIN
    -- Eliminar constraints antiguas si existen
    ALTER TABLE conversations 
        DROP CONSTRAINT IF EXISTS conversations_participant1_id_fkey,
        DROP CONSTRAINT IF EXISTS conversations_participant2_id_fkey;
    
    -- Crear las foreign keys correctas
    ALTER TABLE conversations
        ADD CONSTRAINT conversations_participant1_id_fkey 
        FOREIGN KEY (participant1_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE;
    
    ALTER TABLE conversations
        ADD CONSTRAINT conversations_participant2_id_fkey 
        FOREIGN KEY (participant2_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE;
        
    RAISE NOTICE '✅ Foreign keys de conversations actualizadas';
END $$;

-- PASO 5: Verificar las foreign keys de la tabla messages
DO $$
BEGIN
    -- Eliminar constraints antiguas si existen
    ALTER TABLE messages 
        DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey,
        DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
    
    -- Crear las foreign keys correctas
    ALTER TABLE messages
        ADD CONSTRAINT messages_conversation_id_fkey 
        FOREIGN KEY (conversation_id) 
        REFERENCES conversations(id) 
        ON DELETE CASCADE;
    
    ALTER TABLE messages
        ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE;
        
    RAISE NOTICE '✅ Foreign keys de messages actualizadas';
END $$;

-- PASO 6: Dar permisos de ejecución a la función
GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, UUID) TO anon;

-- PASO 7: Verificar resultados
SELECT 
    'Usuarios totales' as tipo,
    COUNT(*) as cantidad
FROM users

UNION ALL

SELECT 
    'Conversaciones totales',
    COUNT(*)
FROM conversations

UNION ALL

SELECT 
    'Conversaciones válidas',
    COUNT(*)
FROM conversations c
INNER JOIN users u1 ON c.participant1_id = u1.id
INNER JOIN users u2 ON c.participant2_id = u2.id

UNION ALL

SELECT 
    'Mensajes totales',
    COUNT(*)
FROM messages;

-- Resumen
DO $$
DECLARE
    users_count INTEGER;
    conversations_count INTEGER;
    invalid_conversations INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_count FROM users;
    SELECT COUNT(*) INTO conversations_count FROM conversations;
    
    SELECT COUNT(*) INTO invalid_conversations
    FROM conversations c
    LEFT JOIN users u1 ON c.participant1_id = u1.id
    LEFT JOIN users u2 ON c.participant2_id = u2.id
    WHERE u1.id IS NULL OR u2.id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CONVERSACIONES ARREGLADAS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Resumen:';
    RAISE NOTICE '  Usuarios sincronizados: %', users_count;
    RAISE NOTICE '  Conversaciones totales: %', conversations_count;
    RAISE NOTICE '  Conversaciones inválidas: %', invalid_conversations;
    RAISE NOTICE '';
    
    IF invalid_conversations = 0 THEN
        RAISE NOTICE '✅ Todas las conversaciones son válidas';
    ELSE
        RAISE NOTICE '⚠️  Aún hay conversaciones inválidas';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos pasos:';
    RAISE NOTICE '  1. Recarga el frontend (r)';
    RAISE NOTICE '  2. Intenta iniciar una conversación';
    RAISE NOTICE '  3. Verifica que funciona sin errores';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
