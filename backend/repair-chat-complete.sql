-- ==========================================
-- SOLUCIÓN COMPLETA: Reparar Sistema de Chat
-- ==========================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR

-- PARTE 1: Limpiar y recrear tablas de chat
-- ==========================================

-- Eliminar tablas existentes (esto borra todos los datos de chat)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP VIEW IF EXISTS conversation_list CASCADE;

-- Crear tabla de conversaciones (apuntando a public.users)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_participants UNIQUE (participant1_id, participant2_id),
    CONSTRAINT different_participants CHECK (participant1_id != participant2_id)
);

-- Crear tabla de mensajes
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT non_empty_content CHECK (LENGTH(TRIM(content)) > 0)
);

-- Índices
CREATE INDEX idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_read ON messages(read) WHERE read = FALSE;

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can view their messages"
    ON messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
    ));

CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
        )
    );

CREATE POLICY "Users can update received messages"
    ON messages FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
    ) AND sender_id != auth.uid());

-- Función y trigger
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_id UUID;
    min_id UUID;
    max_id UUID;
BEGIN
    IF user1_id < user2_id THEN
        min_id := user1_id;
        max_id := user2_id;
    ELSE
        min_id := user2_id;
        max_id := user1_id;
    END IF;
    
    SELECT id INTO conversation_id
    FROM conversations
    WHERE (participant1_id = min_id AND participant2_id = max_id)
       OR (participant1_id = max_id AND participant2_id = min_id)
    LIMIT 1;
    
    IF conversation_id IS NULL THEN
        INSERT INTO conversations (participant1_id, participant2_id)
        VALUES (min_id, max_id)
        RETURNING id INTO conversation_id;
    END IF;
    
    RETURN conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Vista
CREATE OR REPLACE VIEW conversation_list AS
SELECT 
    c.id as conversation_id,
    c.last_message_at,
    c.created_at,
    CASE WHEN c.participant1_id = auth.uid() THEN c.participant2_id ELSE c.participant1_id END as other_user_id,
    CASE WHEN c.participant1_id = auth.uid() THEN COALESCE(p2.display_name, u2.full_name) ELSE COALESCE(p1.display_name, u1.full_name) END as other_user_name,
    CASE WHEN c.participant1_id = auth.uid() THEN p2.profession ELSE p1.profession END as other_user_profession,
    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != auth.uid() AND m.read = FALSE) as unread_count,
    (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
    (SELECT m.sender_id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_sender_id
FROM conversations c
LEFT JOIN users u1 ON c.participant1_id = u1.id
LEFT JOIN users u2 ON c.participant2_id = u2.id
LEFT JOIN professionals p1 ON c.participant1_id = p1.user_id
LEFT JOIN professionals p2 ON c.participant2_id = p2.user_id
WHERE c.participant1_id = auth.uid() OR c.participant2_id = auth.uid()
ORDER BY c.last_message_at DESC;

-- PARTE 2: Reparar professionals.user_id
-- ==========================================

-- Ver estado actual
SELECT '=== ESTADO DE PROFESSIONALS ===' as info;
SELECT 
    p.id,
    p.user_id,
    p.display_name,
    CASE WHEN EXISTS (SELECT 1 FROM users WHERE id = p.user_id) THEN '✓' ELSE '✗ PROBLEMA' END as status
FROM professionals p;

-- Si eres el único usuario, ejecuta esto:
-- (Reemplaza con tu ID real de la tabla users)

-- UPDATE professionals SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id NOT IN (SELECT id FROM users);

SELECT '✅ SISTEMA DE CHAT REPARADO' as resultado;
