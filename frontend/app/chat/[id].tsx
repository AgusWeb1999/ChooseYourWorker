import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface OtherUser {
  id: string;
  display_name: string;
  profession?: string | null;
}

export default function ChatScreen() {
  const { id: otherUserId } = useLocalSearchParams<{ id: string }>();
  const { user, userProfile, isPremium } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [otherUserIsPremium, setOtherUserIsPremium] = useState(false);
  
  const MESSAGE_LIMIT_FREE = 10;
  
  // LÓGICA DE DESBLOQUEO:
  // Es ilimitado si: YO soy premium O el OTRO USUARIO (Profesional) es premium.
  const isUnlimited = isPremium || otherUserIsPremium;
  const hasReachedLimit = !isUnlimited && messageCount >= MESSAGE_LIMIT_FREE;

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (user && otherUserId) {
      initializeChat();
    }
  }, [user, otherUserId]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.sender_id !== user?.id) {
            markAsRead(newMsg.id);
          }
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id]);

  async function initializeChat() {
    if (!otherUserId || !user) return;
    try {
      setLoading(true);

      const convId = await getOrCreateConversation();

      if (!convId) {
        Alert.alert(
          'No pudimos abrir el chat',
          'Intenta nuevamente desde la pestaña de mensajes o contacta soporte.'
        );
        router.back();
        return;
      }

      setConversationId(convId);
      await fetchOtherUser(); // Aquí verificamos si es Premium en la tabla pública
      await fetchMessages(convId);
      await markConversationAsRead(convId);
    } catch (error) {
      console.error('Error inicializando el chat:', error);
      Alert.alert('Error', 'No pudimos cargar el chat. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  async function getOrCreateConversation(): Promise<string | null> {
    const { data: convRow, error: convError } = await supabase
      .from('conversation_list')
      .select('conversation_id')
      .eq('other_user_id', otherUserId)
      .maybeSingle();

    if (convError && convError.code !== 'PGRST116') {
      throw convError;
    }

    if (convRow?.conversation_id) {
      return convRow.conversation_id;
    }

    const { data: createdConv, error: createError } = await supabase.rpc(
      'get_or_create_conversation',
      { user1_id: user?.id, user2_id: otherUserId }
    );

    if (createError) {
      console.error('Error creando conversación:', createError);
      return null;
    }

    const newId = (createdConv as any)?.conversation_id || (createdConv as any)?.id || null;
    return newId;
  }

  async function fetchOtherUser() {
    if (!otherUserId) return;

    // 1. Buscamos en la tabla PROFESSIONALS (que ahora es pública y tiene el estado premium)
    const { data: professional } = await supabase
      .from('professionals')
      .select('user_id, display_name, profession, is_premium, subscription_end_date')
      .eq('user_id', otherUserId)
      .maybeSingle();

    if (professional) {
      setOtherUser({
        id: professional.user_id,
        display_name: professional.display_name,
        profession: professional.profession,
      });

      // Validar si es premium (bandera + fecha válida)
      const now = new Date();
      const isActive = professional.is_premium && 
                       professional.subscription_end_date && 
                       new Date(professional.subscription_end_date) > now;
      
      setOtherUserIsPremium(!!isActive);

    } else {
      // Si no es profesional, buscamos nombre básico en USERS (fallback)
      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', otherUserId)
        .maybeSingle();

      if (userData) {
        setOtherUser({
          id: userData.id,
          display_name: userData.full_name,
        });
      }
      // Un usuario normal (cliente) no suele ser "Premium" en este contexto
      setOtherUserIsPremium(false);
    }
  }

  async function fetchMessages(convId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    if (data) {
      setMessages(data);
      const myMessages = data.filter(msg => msg.sender_id === user?.id);
      setMessageCount(myMessages.length);
      scrollToBottom();
    }
  }

  async function markConversationAsRead(convId: string) {
    if (!user) return;
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', convId)
      .eq('read', false)
      .neq('sender_id', user.id);
  }

  async function markAsRead(messageId: string) {
    await supabase.from('messages').update({ read: true }).eq('id', messageId);
  }

  async function sendMessage() {
    // Verificación de límite actualizada con lógica "isUnlimited"
    if (!newMessage.trim() || !conversationId || sending || !user) return;

    if (!isUnlimited && messageCount >= MESSAGE_LIMIT_FREE) {
      Alert.alert(
        'Límite alcanzado',
        `Has alcanzado el límite de ${MESSAGE_LIMIT_FREE} mensajes. Actualiza a Premium para continuar.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver Planes', onPress: () => router.push('/subscription/plan') }
        ]
      );
      return;
    }

    try {
      setSending(true);

      const { error, data } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) {
        console.error('Error sending message:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        Alert.alert('Error', 'No se pudo enviar el mensaje');
        return;
      }

      console.log('✅ Message sent successfully:', data);

      setNewMessage('');
      setMessageCount(prev => prev + 1);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    if (diffInHours < 48) {
      return 'Ayer ' +
        date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });
    }

    return (
      date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      }) +
      ' ' +
      date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Chat',
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando conversación...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen
        options={{
          title: otherUser?.display_name || 'Chat',
          headerShown: false, // Ocultamos el header nativo para usar uno propio
        }}
      />

      {/* Header personalizado con flecha de volver */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16, padding: 4 }}>
          <Text style={{ fontSize: 26, color: '#007AFF' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#222' }} numberOfLines={1}>
          {otherUser?.display_name || 'Chat'}
        </Text>
      </View>

      <View style={styles.contentLimiter}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 48, color: '#999' }}>💬</Text>
              <Text style={styles.emptyText}>No hay mensajes aún</Text>
              <Text style={styles.emptySubtext}>
                Envía el primer mensaje para iniciar la conversación
              </Text>
            </View>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageWrapper,
                    isOwn ? styles.ownMessageWrapper : styles.otherMessageWrapper,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isOwn ? styles.ownMessageBubble : styles.otherMessageBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isOwn ? styles.ownMessageText : styles.otherMessageText,
                      ]}
                    >
                      {message.content}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        isOwn ? styles.ownMessageTime : styles.otherMessageTime,
                      ]}
                    >
                      {formatTime(message.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* --- SECCIÓN DE ALERTAS Y AVISOS --- */}
        
        {otherUserIsPremium ? (
          // CASO 1: El profesional es Premium -> Chat Ilimitado
          <View style={styles.premiumAlertBox}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>✅</Text>
            <View style={{flex: 1}}>
              <Text style={styles.premiumAlertTextBold}>¡Chat Ilimitado!</Text>
              <Text style={styles.premiumAlertText}>
                Gracias a que este profesional es Premium, puedes chatear sin límites.
              </Text>
            </View>
          </View>
        ) : !isPremium ? (
          // CASO 2: Nadie es Premium -> Mostrar Límite
          <View style={[styles.limitWarning, hasReachedLimit && styles.limitWarningDanger]}>
            <Text style={{ fontSize: 16, marginRight: 4 }}>
              {hasReachedLimit ? "⚠️" : "ℹ️"}
            </Text>
            <Text style={[styles.limitWarningText, hasReachedLimit && styles.limitWarningTextDanger]}>
              {hasReachedLimit 
                ? `Límite alcanzado (${messageCount}/${MESSAGE_LIMIT_FREE}). Actualiza a Premium.`
                : `${messageCount}/${MESSAGE_LIMIT_FREE} mensajes gratuitos usados.`
              }
            </Text>
            {hasReachedLimit && (
              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={() => router.push('/subscription/plan')}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null /* Si YO soy premium, no muestro alertas, simplemente funciona */}

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, hasReachedLimit && styles.inputDisabled]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder={hasReachedLimit ? "Límite alcanzado..." : "Escribe un mensaje..."}
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
            editable={!sending && !hasReachedLimit}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending || hasReachedLimit) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending || hasReachedLimit}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={{ fontSize: 22, color: '#FFF' }}>📤</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentLimiter: {
    flex: 1,
    width: '100%',
    maxWidth: 900,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  messageWrapper: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessageWrapper: {
    alignSelf: 'flex-end',
  },
  otherMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFF',
  },
  otherMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginHorizontal: 12,
    marginBottom: Platform.OS === 'web' ? 32 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 6,
    borderTopWidth: 0,
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fef3c7',
    borderTopWidth: 1,
    borderTopColor: '#fbbf24',
    gap: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  limitWarningDanger: {
    backgroundColor: '#fee2e2',
    borderTopColor: '#ef4444',
  },
  limitWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
  },
  limitWarningTextDanger: {
    color: '#991b1b',
  },
  upgradeButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  inputDisabled: {
    backgroundColor: '#e5e5ea',
    opacity: 0.6,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  premiumAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5', // Verde muy claro
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  premiumAlertTextBold: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  premiumAlertText: {
    flex: 1,
    color: '#065f46',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'left',
  },
});