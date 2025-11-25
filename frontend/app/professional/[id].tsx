import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { IconSymbol } from '../../components/ui/icon-symbol';
import ReviewsList from '../../components/ReviewsList';
import AddReview from '../../components/AddReview';
import ClientReviewsList from '../../components/ClientReviewsList';
import AddClientReview from '../../components/AddClientReview';

interface Professional {
  id: string;
  user_id: string;
  display_name: string;
  profession: string;
  bio: string;
  city: string;
  state: string;
  zip_code: string;
  hourly_rate: number;
  years_experience: number;
  phone: string;
  rating: number;  // ← Cambiado de average_rating
  rating_count: number;  // ← Cambiado de total_reviews
  total_reviews: number;
}

export default function ProfessionalProfileScreen() {
  const { id } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [clientUserId, setClientUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfessional();
  }, [id]);

  async function fetchProfessional() {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setProfessional(data);
        setClientUserId(data.user_id);
      } else {
        Alert.alert('Error', 'No se pudo cargar el perfil del profesional');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching professional:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar el perfil');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  function handleReviewSuccess() {
    fetchProfessional();
  }

  function handleContact() {
    if (!professional?.phone) return;

    Alert.alert(
      'Contactar a ' + professional?.display_name,
      'Elige cómo quieres contactar:',
      [
        {
          text: 'WhatsApp',
          onPress: () => openWhatsApp(professional.phone, professional.display_name),
        },
        {
          text: 'Llamar',
          onPress: () => makePhoneCall(professional.phone),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  }

  async function openWhatsApp(phone: string, name: string) {
    // Limpiar el número de teléfono (remover espacios, guiones, etc.)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Mensaje predefinido
    const message = `Hola ${name}, vi tu perfil en ChooseYourWorker y me gustaría contactarte.`;
    
    // URL de WhatsApp
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert(
          'WhatsApp no disponible',
          'Por favor instala WhatsApp o usa la opción de llamada.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    }
  }

  async function makePhoneCall(phone: string) {
    const phoneUrl = `tel:${phone}`;
    
    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'No se puede realizar la llamada desde este dispositivo');
      }
    } catch (error) {
      console.error('Error making phone call:', error);
      Alert.alert('Error', 'No se pudo realizar la llamada');
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a5f" />
      </View>
    );
  }

  if (!professional) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profesional no encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isClient = !userProfile?.is_professional;
  const isProfessional = userProfile?.is_professional;

  // Debug logs
  console.log('🔍 Professional ID:', professional?.id);
  console.log('🔍 User Profile:', userProfile);
  console.log('🔍 Is Client:', isClient);
  console.log('🔍 Show Modal:', showReviewModal);
  console.log('🔍 Will Render AddReview:', isClient && userProfile);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil Profesional</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Info Principal */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {professional.display_name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{professional.display_name}</Text>
          <Text style={styles.profession}>{professional.profession}</Text>
          
          {professional.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>
                ⭐ {professional.rating.toFixed(1)}
              </Text>
              <Text style={styles.reviewCountText}>
                ({professional.rating_count} {professional.rating_count === 1 ? 'reseña' : 'reseñas'})
              </Text>
            </View>
          )}
        </View>

        {/* Detalles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          
          {professional.bio && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sobre mí:</Text>
              <Text style={styles.infoValue}>{professional.bio}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Ubicación:</Text>
            <Text style={styles.infoValue}>
              {professional.city}, {professional.state} ({professional.zip_code})
            </Text>
          </View>

          {professional.hourly_rate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>💰 Tarifa:</Text>
              <Text style={styles.infoValue}>${professional.hourly_rate}/hora</Text>
            </View>
          )}

          {professional.years_experience && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📅 Experiencia:</Text>
              <Text style={styles.infoValue}>
                {professional.years_experience} {professional.years_experience === 1 ? 'año' : 'años'}
              </Text>
            </View>
          )}

          {professional.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📞 Teléfono:</Text>
              <Text style={styles.infoValue}>{professional.phone}</Text>
            </View>
          )}
        </View>

        {/* Botones de Contacto */}
        {isClient && (
          <View style={styles.contactContainer}>
            <TouchableOpacity 
              style={[styles.contactButton, styles.messageButton]} 
              onPress={() => router.push(`/chat/${professional.user_id}`)}
            >
              <IconSymbol name="bubble.left.and.bubble.right.fill" size={20} color="#FFF" />
              <Text style={styles.contactButtonText}>Enviar Mensaje</Text>
            </TouchableOpacity>
            
            {professional.phone && (
              <>
                <TouchableOpacity 
                  style={[styles.contactButton, styles.whatsappButton]} 
                  onPress={() => openWhatsApp(professional.phone, professional.display_name)}
                >
                  <Text style={styles.contactButtonText}>💬 WhatsApp</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.contactButton, styles.phoneButton]} 
                  onPress={() => makePhoneCall(professional.phone)}
                >
                  <Text style={styles.contactButtonText}>📞 Llamar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Reseñas del Profesional (visibles para todos) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reseñas de Clientes</Text>
            {isClient && (
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={() => {
                  console.log('🔴 Botón clickeado!');
                  console.log('🔴 Profesional ID:', professional.id);
                  console.log('🔴 Cliente ID:', userProfile?.id);
                  console.log('🔴 Antes - showReviewModal:', showReviewModal);
                  setShowReviewModal(true);
                  console.log('🔴 Después - llamó setShowReviewModal(true)');
                }}
              >
                <Text style={styles.addReviewButtonText}>+ Dejar reseña</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <ReviewsList professionalId={professional.id} />
        </View>

        {/* Calificaciones del Cliente (solo visible para profesionales) */}
        {isProfessional && clientUserId && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Calificaciones como Cliente</Text>
            </View>
            <ClientReviewsList clientId={clientUserId} />
          </View>
        )}
      </ScrollView>

      {/* Modal para agregar reseña (Cliente califica a Trabajador) */}
      {isClient && userProfile && (
        <AddReview
          professionalId={professional.id}
          clientId={userProfile.id}
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#1e3a5f',
  },
  backIcon: {
    marginRight: 16,
  },
  backIconText: {
    fontSize: 28,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f0f4f8',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profession: {
    fontSize: 18,
    color: '#1e3a5f',
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
  },
  reviewCountText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  contactContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  contactButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  messageButton: {
    backgroundColor: '#007AFF',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  phoneButton: {
    backgroundColor: '#1e3a5f',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addReviewButton: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addReviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
