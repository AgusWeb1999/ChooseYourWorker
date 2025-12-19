import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { IconSymbol } from '../../components/ui/icon-symbol';

interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_profession: string | null;
  other_user_avatar: string | null;
  unread_count: number;
  last_message_content: string | null;
  last_message_sender_id: string | null;
  last_message_at: string;
}

export default function MessagesScreen() {
  const { user, userProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
      
      // Suscribirse a cambios en conversaciones
      const channel = supabase
        .channel('conversations-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  async function fetchConversations() {
    try {
      // Primero obtenemos las conversaciones básicas
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversation_list')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      console.log('📊 Conversaciones básicas:', conversationsData);

      // Luego obtenemos los avatares desde professionals (que tiene user_id y avatar_url)
      if (conversationsData && conversationsData.length > 0) {
        const userIds = conversationsData.map(c => c.other_user_id);
        console.log('👥 User IDs para buscar avatares:', userIds);
        
        // Intentar buscar en professionals primero
        const { data: professionalsData, error: profsError } = await supabase
          .from('professionals')
          .select('user_id, avatar_url')
          .in('user_id', userIds);

        console.log('🖼️ Avatares desde professionals:', professionalsData);

        // También buscar en users como fallback
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, avatar_url')
          .in('id', userIds);

        console.log('🖼️ Avatares desde users:', usersData);

        if (professionalsData || usersData) {
          // Combinar los datos, priorizando professionals
          const conversationsWithAvatars = conversationsData.map(conv => {
            const profAvatar = professionalsData?.find(p => p.user_id === conv.other_user_id)?.avatar_url;
            const userAvatar = usersData?.find(u => u.id === conv.other_user_id)?.avatar_url;
            const finalAvatar = profAvatar || userAvatar || null;
            
            console.log(`🔗 Usuario ${conv.other_user_name} (${conv.other_user_id}) -> avatar: ${finalAvatar}`);
            return {
              ...conv,
              other_user_avatar: finalAvatar
            };
          });
          setConversations(conversationsWithAvatars);
        } else {
          setConversations(conversationsData);
        }
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchConversations();
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Ahora';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  }

  function renderConversation({ item }: { item: Conversation }) {
    const isOwnMessage = item.last_message_sender_id === user?.id;
    const messagePrefix = isOwnMessage ? 'Tú: ' : '';
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/chat/${item.other_user_id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {item.other_user_avatar ? (
              <Image 
                source={{ uri: item.other_user_avatar }} 
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {item.other_user_name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            )}
          </View>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unread_count > 99 ? '99+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.other_user_name}
            </Text>
            <Text style={styles.time}>
              {formatTime(item.last_message_at)}
            </Text>
          </View>

          {item.other_user_profession && (
            <Text style={styles.profession} numberOfLines={1}>
              {item.other_user_profession}
            </Text>
          )}

          <Text
            style={[
              styles.lastMessage,
              item.unread_count > 0 && !isOwnMessage && styles.unreadMessage,
            ]}
            numberOfLines={2}
          >
            {item.last_message_content
              ? `${messagePrefix}${item.last_message_content}`
              : 'No hay mensajes aún'}
          </Text>
        </View>

        <IconSymbol
          name="chevron.right"
          size={20}
          color="#C7C7CC"
        />
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Nav Bar Superior */}
        <View style={styles.topNav}>
          <Text style={styles.logo}>WorkingGo</Text>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile' as any)}
          >
            {userProfile?.avatar_url ? (
              <Image source={{ uri: userProfile.avatar_url }} style={styles.navAvatar} />
            ) : (
              <View style={styles.navAvatarPlaceholder}>
                <Text style={styles.navAvatarText}>
                  {userProfile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.contentLimiter}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Nav Bar Superior */}
        <View style={styles.topNav}>
          <Text style={styles.logo}>WorkingGo</Text>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile' as any)}
          >
            {userProfile?.avatar_url ? (
              <Image source={{ uri: userProfile.avatar_url }} style={styles.navAvatar} />
            ) : (
              <View style={styles.navAvatarPlaceholder}>
                <Text style={styles.navAvatarText}>
                  {userProfile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

      <View style={styles.contentLimiter}>
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💭</Text>
          <Text style={styles.emptyTitle}>No hay conversaciones</Text>
          <Text style={styles.emptySubtitle}>
            Busca un trabajador y envíale un mensaje para comenzar
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.conversation_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
          }
        />
      )}
      </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topNav: {
    width: '100%',
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  profileButton: {
    padding: 4,
  },
  navAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  navAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentLimiter: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    paddingVertical: 16,
    paddingTop: Platform.OS === 'web' ? 24 : 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: Platform.OS === 'web' ? 16 : 12,
    marginVertical: Platform.OS === 'web' ? 6 : 4,
    paddingVertical: Platform.OS === 'web' ? 14 : 10,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Platform.OS === 'web' ? 12 : 10,
  },
  avatar: {
    width: Platform.OS === 'web' ? 56 : 48,
    height: Platform.OS === 'web' ? 56 : 48,
    borderRadius: Platform.OS === 'web' ? 28 : 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: Platform.OS === 'web' ? 24 : 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
    marginRight: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: Platform.OS === 'web' ? 17 : 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    color: '#8E8E93',
  },
  profession: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    color: '#007AFF',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#000',
  },
});
