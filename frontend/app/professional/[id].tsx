import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { IconSymbol } from '../../components/ui/icon-symbol';
import ReviewsList from '../../components/ReviewsList';
import AddReview from '../../components/AddReview';
import ClientReviewsList from '../../components/ClientReviewsList';
import AddClientReview from '../../components/AddClientReview';
import { HireModal } from '../../components/HireModal';
import WorkPortfolio from '../../components/WorkPortfolio';

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
  rating: number;
  rating_count: number;
  total_reviews: number;
  avatar_url: string | null;
  completed_hires_count: number;
}

interface Hire {
  id: string;
  client_id: string;
  professional_id: string;
  status: 'pending' | 'in_progress' | 'waiting_client_approval' | 'completed' | 'cancelled' | 'rejected';
  started_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  proposal_message?: string;
}

export default function ProfessionalProfileScreen() {
  const { id } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [clientUserId, setClientUserId] = useState<string | null>(null);
  const [activeHire, setActiveHire] = useState<Hire | null>(null);
  const [pendingHire, setPendingHire] = useState<Hire | null>(null);
  const [completedHire, setCompletedHire] = useState<Hire | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isPremiumPro, setIsPremiumPro] = useState(false);

  useEffect(() => {
    fetchProfessional();
    if (userProfile && !userProfile.is_professional) {
      fetchClientHireState();
      fetchCompletedHireAndReview();
    }
  }, [id, userProfile]);

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
        // Fetch premium status for this professional's user
        try {
          const { data: userData, error: userErr } = await supabase
            .from('users')
            .select('subscription_type, subscription_status, subscription_end_date')
            .eq('id', data.user_id)
            .maybeSingle();
          if (!userErr && userData) {
            const active =
              userData.subscription_type === 'premium' &&
              userData.subscription_status === 'active' &&
              userData.subscription_end_date &&
              new Date(userData.subscription_end_date) > new Date();
            setIsPremiumPro(!!active);
          } else {
            setIsPremiumPro(false);
          }
        } catch (e) {
          setIsPremiumPro(false);
        }
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

  async function fetchClientHireState() {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('hires')
        .select('*')
        .eq('client_id', userProfile.id)
        .eq('professional_id', id)
        .in('status', ['pending', 'in_progress', 'waiting_client_approval'])
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (!error && data) {
        if (data.status === 'pending') {
          setPendingHire(data);
          setActiveHire(null);
        } else {
          setActiveHire(data);
          setPendingHire(null);
        }
      } else {
        setPendingHire(null);
        setActiveHire(null);
      }
    } catch (error) {
      console.error('Error fetching hire state:', error);
      setPendingHire(null);
      setActiveHire(null);
    }
  }

  async function fetchCompletedHireAndReview() {
    if (!userProfile?.id) return;

    try {
      // Buscar el último hire completado
      const { data: hireData, error: hireError } = await supabase
        .from('hires')
        .select('*')
        .eq('client_id', userProfile.id)
        .eq('professional_id', id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!hireError && hireData) {
        setCompletedHire(hireData);

        // Verificar si ya hay una review para este hire
        const { data: reviewData, error: reviewError } = await supabase
          .from('reviews')
          .select('id')
          .eq('hire_id', hireData.id)
          .maybeSingle();

        setHasReviewed(!!reviewData);
      }
    } catch (error) {
      console.error('Error fetching completed hire:', error);
    }
  }

  async function handleSendProposal(message: string) {
    if (!userProfile?.id || !professional?.id) {
      Alert.alert('Error', 'No se pudo identificar el usuario o profesional');
      return;
    }

    console.log('📤 Enviando propuesta:', {
      client_id: userProfile.id,
      professional_id: professional.id,
      message: message?.substring(0, 50)
    });

    setActionLoading(true);
    try {
      const { data, error } = await supabase
        .from('hires')
        .insert({
          client_id: userProfile.id,
          professional_id: professional.id,
          status: 'pending',
          proposal_message: message,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error insertando hire:', error);
        throw error;
      }

      console.log('✅ Hire creado exitosamente:', data?.id);

      setPendingHire(data as Hire);
      Alert.alert(
        'Propuesta enviada',
        `Enviamos tu propuesta a ${professional.display_name}. El profesional debe aceptarla para comenzar.`
      );

      // Notificar al profesional si existe su user_id
      if ((professional as any).user_id) {
        try {
          await supabase.from('notifications').insert({
            type: 'solicitud_enviada',
            user_id: (professional as any).user_id,
            sender_id: userProfile.id,
            sender_name: userProfile.full_name || 'Cliente',
            title: 'Nueva solicitud de contratación',
            message: message?.slice(0, 500) || 'Tienes una nueva solicitud',
            related_id: data?.id,
            related_type: 'hire',
          });
        } catch (notifyError) {
          console.warn('No se pudo enviar la notificación de solicitud:', notifyError);
        }
      }
    } catch (error: any) {
      console.error('Error creating hire:', error);
      Alert.alert(
        'Error',
        error.message || 'No se pudo enviar la propuesta. Intenta de nuevo.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCompleteJob() {
    if (!activeHire?.id) return;

    Alert.alert(
      'Finalizar Trabajo',
      `¿Confirmas que el trabajo con ${professional?.display_name} ha sido completado?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              const { error } = await supabase
                .from('hires')
                .update({ status: 'completed' })
                .eq('id', activeHire.id);

              if (error) throw error;

              setCompletedHire({ ...activeHire, status: 'completed', completed_at: new Date().toISOString() });
              setActiveHire(null);
              setHasReviewed(false);
              
              Alert.alert(
                '¡Trabajo finalizado!',
                'Ahora puedes dejar una reseña sobre este profesional.',
                [
                  {
                    text: 'Dejar reseña',
                    onPress: () => setShowReviewModal(true),
                  },
                  { text: 'Más tarde', style: 'cancel' },
                ]
              );
              
              fetchProfessional();
            } catch (error: any) {
              console.error('Error completing hire:', error);
              Alert.alert('Error', 'No se pudo finalizar el trabajo.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  function handleReviewSuccess() {
    fetchProfessional();
    fetchCompletedHireAndReview();
    fetchClientHireState();
    setShowReviewModal(false);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Text style={styles.backIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil Profesional</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.contentLimiter}>
          {/* Info Principal */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              {professional.avatar_url ? (
                <Image 
                  source={{ uri: professional.avatar_url }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {professional.display_name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              )}
            </View>
            <Text style={styles.name}>{professional.display_name}</Text>
            {isPremiumPro && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
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

            {professional.completed_hires_count > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>✅ Trabajos completados:</Text>
                <Text style={styles.infoValue}>{professional.completed_hires_count}</Text>
              </View>
            )}

            {/* Mostrar teléfono solo si hay hire activo */}
            {activeHire && professional.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📞 Teléfono:</Text>
                <Text style={styles.infoValue}>{professional.phone}</Text>
                <Text style={styles.phoneNote}>
                  * Disponible porque lo has contratado
                </Text>
              </View>
            )}
          </View>

          {/* Botones de Acción para Clientes */}
          {isClient && (
            <View style={styles.actionContainer}>
              {/* Botón de Mensaje (siempre visible) */}
              <TouchableOpacity 
                style={[styles.actionButton, styles.messageButton]} 
                onPress={() => router.push(`/chat/${professional.user_id}`)}
              >
                <IconSymbol name="bubble.left.and.bubble.right.fill" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Mensaje</Text>
              </TouchableOpacity>

              {/* Botón de Enviar Propuesta */}
              {/* Solo mostrar si no hay propuesta pendiente ni trabajo activo */}
              {!pendingHire && !activeHire && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.hireButton]}
                  onPress={() => setShowHireModal(true)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.actionButtonIcon}>💼</Text>
                      <Text style={styles.actionButtonText}>Enviar Propuesta</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

            </View>
          )}

          {/* Estado del Trabajo */}
          {isClient && pendingHire && (
            <View style={styles.jobStatusCard}>
              <Text style={styles.jobStatusTitle}>⏳ Propuesta enviada</Text>
              <Text style={styles.jobStatusText}>
                Tu propuesta está pendiente de que {professional.display_name} la acepte o rechace.
              </Text>
              {pendingHire.proposal_message && (
                <Text style={styles.jobStatusHint}>
                  Mensaje enviado: "{pendingHire.proposal_message}"
                </Text>
              )}
            </View>
          )}

          {isClient && activeHire && (
            <View style={styles.jobStatusCard}>
              <Text style={styles.jobStatusTitle}>📋 Trabajo en Progreso</Text>
              <Text style={styles.jobStatusText}>
                Contrataste a {professional.display_name} el {new Date(activeHire.started_at).toLocaleDateString('es-ES')}
              </Text>
              <Text style={styles.jobStatusHint}>
                Cuando el trabajador finalice y tú apruebes el trabajo, podrás dejar una reseña.
              </Text>
            </View>
          )}

          {isClient && completedHire && !hasReviewed && (
            <View style={styles.jobStatusCard}>
              <Text style={styles.jobStatusTitle}>⭐ Trabajo Completado</Text>
              <Text style={styles.jobStatusText}>
                Completaste un trabajo con {professional.display_name}.
              </Text>
              <TouchableOpacity
                style={styles.reviewPromptButton}
                onPress={() => setShowReviewModal(true)}
              >
                <Text style={styles.reviewPromptButtonText}>Dejar Reseña Ahora</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Portafolio público del profesional */}
          <View style={{ marginVertical: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#1e293b', textAlign: 'center' }}>
              Portafolio de Trabajos
            </Text>
            <WorkPortfolio professionalId={professional.id} editable={false} />
          </View>

          {/* Reseñas del Profesional (visibles para todos) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reseñas de Clientes</Text>
              {isClient && completedHire && !hasReviewed && (
                <TouchableOpacity
                  style={styles.addReviewButton}
                  onPress={() => setShowReviewModal(true)}
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
        </View>
      </ScrollView>

      {/* Modal para propuesta de contratación */}
      {isClient && !userProfile?.is_professional && !completedHire && (
        <HireModal
          visible={showHireModal}
          professional={{
            id: professional.id,
            name: professional.display_name,
            specialty: professional.profession,
            rate: professional.hourly_rate,
          }}
          onConfirm={async (msg) => {
            await handleSendProposal(msg);
            setShowHireModal(false);
          }}
          onCancel={() => setShowHireModal(false)}
        />
      )}

      {/* Modal para agregar reseña (Cliente califica a Trabajador) */}
      {isClient && userProfile && completedHire && (
        <AddReview
          professionalId={professional.id}
          clientId={userProfile.id}
          hireId={completedHire.id}
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
  contentContainer: {
    paddingBottom: 24,
  },
  contentLimiter: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingBottom: 16,
    paddingHorizontal: 16,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  premiumBadge: {
    marginTop: 6,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
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
  phoneNote: {
    fontSize: 12,
    color: '#25D366',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    backgroundColor: '#007AFF',
  },
  hireButton: {
    backgroundColor: '#34C759',
  },
  completeButton: {
    backgroundColor: '#FF9500',
  },
  jobStatusCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  jobStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  jobStatusText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4,
  },
  jobStatusHint: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  reviewPromptButton: {
    marginTop: 12,
    backgroundColor: '#1e3a5f',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewPromptButtonText: {
    color: '#fff',
    fontSize: 14,
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
