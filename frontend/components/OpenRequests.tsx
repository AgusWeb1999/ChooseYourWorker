import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, ScrollView, TextInput, Image } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface OpenRequest {
  id: string;
  created_at: string;
  service_description: string;
  service_category: string;
  service_location: string;
  proposal_message?: string;
  client_id: string;
  users?: {
    full_name: string;
    city?: string;
  }[];
}

interface Professional {
  id: string;
  display_name: string;
  profession?: string;
  city?: string;
  avatar_url?: string | null;
  rating?: number;
}

interface OpenRequestsProps {
  onRefresh?: () => void;
}

export default function OpenRequests({ onRefresh }: OpenRequestsProps) {
  const [requests, setRequests] = useState<OpenRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { userProfile, user, professionalProfile } = useAuth();
  const { showToast } = useToast();
  
  // Estados para el modal de finalización
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [resolvedWithPlatform, setResolvedWithPlatform] = useState<boolean | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [professionalSearch, setProfessionalSearch] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showProfessionalList, setShowProfessionalList] = useState(false);
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [comments, setComments] = useState('');

  // Estados para el modal de cancelación
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);

  useEffect(() => {
    fetchOpenRequests();
  }, [selectedCategory]);

  async function fetchOpenRequests() {
    try {
      setLoading(true);

      console.log('🔍 Fetching requests with profile:', {
        is_professional: userProfile?.is_professional,
        user_id: user?.id,
      });

      let query = supabase
        .from('hires')
        .select(`
          id,
          created_at,
          service_description,
          service_category,
          service_location,
          proposal_message,
          status,
          client_id,
          users!hires_client_id_fkey (
            full_name,
            city
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Si es CLIENTE: solo ver sus propias solicitudes
      // Si es PROFESIONAL: ver todas las solicitudes abiertas (sin profesional asignado)
      if (userProfile?.is_professional === false) {
        // Cliente: ver solo mis solicitudes
        console.log('👤 Usuario es CLIENTE, filtrando por client_id:', user?.id);
        if (user?.id) {
          query = query.eq('client_id', user.id);
        }
      } else if (userProfile?.is_professional === true) {
        // Profesional: ver solo solicitudes sin profesional asignado
        console.log('👷 Usuario es PROFESIONAL, mostrando todas las solicitudes sin profesional');
        query = query.is('professional_id', null);
      } else {
        console.log('⚠️ Tipo de usuario no definido');
      }

      // Filtrar por categoría si está seleccionada
      if (selectedCategory) {
        query = query.eq('service_category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('✅ Solicitudes obtenidas:', data?.length || 0);
      console.log('📋 Primeras solicitudes:', data?.slice(0, 2));

      setRequests(data || []);
    } catch (error) {
      console.error('Error al cargar solicitudes abiertas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchOpenRequests();
    setRefreshing(false);
    onRefresh?.();
  }

  async function handleCancelRequest(requestId: string) {
    setRequestToCancel(requestId);
    setShowCancelModal(true);
  }

  async function confirmCancelRequest() {
    if (!requestToCancel) return;

    try {
      const { error } = await supabase
        .from('hires')
        .update({ status: 'cancelled' })
        .eq('id', requestToCancel);

      if (error) throw error;

      showToast('Solicitud cancelada', 'success');
      setShowCancelModal(false);
      setRequestToCancel(null);
      fetchOpenRequests();
      onRefresh?.();
    } catch (error) {
      console.error('Error al cancelar solicitud:', error);
      showToast('Error al cancelar la solicitud', 'error');
    }
  }

  async function handleCompleteRequest(requestId: string) {
    setSelectedRequestId(requestId);
    setShowCompletionModal(true);
  }

  async function searchProfessionals(query: string) {
    setProfessionalSearch(query);
    
    if (!query.trim()) {
      setProfessionals([]);
      setShowProfessionalList(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, display_name, profession, city, avatar_url, rating')
        .ilike('display_name', `%${query}%`)
        .limit(10);

      if (error) throw error;

      setProfessionals(data || []);
      setShowProfessionalList(true);
    } catch (error) {
      console.error('Error buscando profesionales:', error);
    }
  }

  function selectProfessional(professional: Professional) {
    setSelectedProfessional(professional);
    setProfessionalSearch(professional.display_name);
    setShowProfessionalList(false);
  }

  async function submitCompletion() {
    if (resolvedWithPlatform === null) {
      showToast('Por favor indica si resolviste el servicio con alguien de la plataforma', 'error');
      return;
    }

    if (resolvedWithPlatform && !selectedProfessional) {
      showToast('Por favor selecciona el profesional con quien resolviste el servicio', 'error');
      return;
    }

    if (satisfactionRating === 0) {
      showToast('Por favor califica tu experiencia', 'error');
      return;
    }

    try {
      // Actualizar el hire como completed
      const { error: updateError } = await supabase
        .from('hires')
        .update({ status: 'completed' })
        .eq('id', selectedRequestId);

      if (updateError) throw updateError;

      // Si resolvió con un profesional de la plataforma, guardar la reseña
      if (resolvedWithPlatform && selectedProfessional) {
        const { error: reviewError } = await supabase
          .from('reviews')
          .insert({
            professional_id: selectedProfessional.id,
            client_id: user?.id,
            hire_id: selectedRequestId,
            rating: satisfactionRating,
            comment: comments.trim() || null,
          });

        if (reviewError) {
          console.error('Error guardando reseña:', reviewError);
          showToast('Solicitud finalizada, pero hubo un error al guardar la reseña', 'error');
        } else {
          showToast('✅ Solicitud finalizada y reseña enviada', 'success');
        }
      } else {
        showToast('✅ Solicitud finalizada', 'success');
      }

      setShowCompletionModal(false);
      resetCompletionForm();
      fetchOpenRequests();
    } catch (error) {
      console.error('Error al finalizar solicitud:', error);
      showToast('Error al finalizar la solicitud', 'error');
    }
  }

  function resetCompletionForm() {
    setSelectedRequestId(null);
    setResolvedWithPlatform(null);
    setSelectedProfessional(null);
    setProfessionalSearch('');
    setProfessionals([]);
    setShowProfessionalList(false);
    setSatisfactionRating(0);
    setComments('');
  }

  function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  function getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Plomería': '🔧',
      'Electricidad': '⚡',
      'Carpintería': '🪚',
      'Limpieza': '🧹',
      'Jardinería': '🌱',
      'Pintura': '🎨',
      'Mudanzas': '📦',
      'Reparaciones': '🔨',
      'Otro': '🛠️',
    };
    return icons[category] || '🛠️';
  }

  const renderRequestCard = ({ item }: { item: OpenRequest }) => {
    const isProfessional = userProfile?.is_professional === true;
    const isClient = userProfile?.is_professional === false;

    return (
      <View style={styles.card}>
        <View>
          <View style={styles.cardHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryIcon}>{getCategoryIcon(item.service_category)}</Text>
              <Text style={styles.categoryText}>{item.service_category}</Text>
            </View>
            <Text style={styles.timeAgo}>{getTimeAgo(item.created_at)}</Text>
          </View>

          {isProfessional && (
            <Text style={styles.clientName}>👤 {item.users?.[0]?.full_name || 'Cliente'}</Text>
          )}
          
          <Text style={styles.description} numberOfLines={3}>
            {item.service_description || item.proposal_message || 'Sin descripción'}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.location}>
              📍 {item.service_location || item.users?.[0]?.city || 'Ubicación no especificada'}
            </Text>
            {isProfessional && (
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => router.push(`/chat/${item.client_id}` as any)}
              >
                <Text style={styles.messageButtonText}>💬 Mensaje</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Botones para clientes */}
        {isClient && (
          <View style={styles.clientActions}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => handleCompleteRequest(item.id)}
            >
              <Text style={styles.completeButtonText}>✓ Finalizar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelRequest(item.id)}
            >
              <Text style={styles.cancelButtonText}>✕ Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No hay solicitudes abiertas</Text>
      <Text style={styles.emptySubtitle}>
        {userProfile?.is_professional
          ? 'Cuando los clientes publiquen solicitudes, aparecerán aquí'
          : 'Sé el primero en publicar una solicitud de servicio'}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Cargando solicitudes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Solicitudes Abiertas</Text>
        <Text style={styles.subtitle}>
          {requests.length} {requests.length === 1 ? 'solicitud' : 'solicitudes'}
        </Text>
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequestCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          requests.length === 0 && styles.listContentEmpty
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Modal de confirmación de cancelación */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowCancelModal(false);
          setRequestToCancel(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModalContainer}>
            <Text style={styles.cancelModalTitle}>⚠️ Cancelar Solicitud</Text>
            <Text style={styles.cancelModalMessage}>
              ¿Estás seguro de que quieres cancelar esta solicitud?{' '}
              <Text style={styles.cancelModalWarning}>Esta acción no se puede deshacer.</Text>
            </Text>
            
            <View style={styles.cancelModalButtons}>
              <TouchableOpacity
                style={styles.cancelModalNoButton}
                onPress={() => {
                  setShowCancelModal(false);
                  setRequestToCancel(null);
                }}
              >
                <Text style={styles.cancelModalNoButtonText}>No, mantener</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelModalYesButton}
                onPress={confirmCancelRequest}
              >
                <Text style={styles.cancelModalYesButtonText}>Sí, cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de cuestionario de finalización */}
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCompletionModal(false);
          resetCompletionForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>📝 Finalizar Solicitud</Text>
              
              {/* Pregunta 1: ¿Resolviste con la plataforma? */}
              <Text style={styles.questionText}>¿Resolviste el servicio a través de WorkinGO?</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[styles.optionButton, resolvedWithPlatform === true && styles.optionButtonSelected]}
                  onPress={() => setResolvedWithPlatform(true)}
                >
                  <Text style={[styles.optionButtonText, resolvedWithPlatform === true && styles.optionButtonTextSelected]}>
                    ✓ Sí
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, resolvedWithPlatform === false && styles.optionButtonSelected]}
                  onPress={() => setResolvedWithPlatform(false)}
                >
                  <Text style={[styles.optionButtonText, resolvedWithPlatform === false && styles.optionButtonTextSelected]}>
                    ✕ No
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Pregunta 2: ¿Con quién? (solo si resolvió con plataforma) */}
              {resolvedWithPlatform === true && (
                <>
                  <Text style={[styles.questionText, { marginTop: 20 }]}>
                    ¿Con quién resolviste el servicio?
                  </Text>
                  <View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Buscar profesional por nombre..."
                      placeholderTextColor="#94a3b8"
                      value={professionalSearch}
                      onChangeText={searchProfessionals}
                    />
                    {showProfessionalList && professionals.length > 0 && (
                      <ScrollView style={styles.professionalList} nestedScrollEnabled>
                        {professionals.map((prof) => (
                          <TouchableOpacity
                            key={prof.id}
                            style={[
                              styles.professionalCard,
                              selectedProfessional?.id === prof.id && styles.professionalCardSelected
                            ]}
                            onPress={() => selectProfessional(prof)}
                          >
                            <View style={styles.professionalCardContent}>
                              {prof.avatar_url ? (
                                <Image source={{ uri: prof.avatar_url }} style={styles.professionalAvatar} />
                              ) : (
                                <View style={styles.professionalAvatarPlaceholder}>
                                  <Text style={styles.professionalAvatarText}>
                                    {prof.display_name?.charAt(0)?.toUpperCase() || '?'}
                                  </Text>
                                </View>
                              )}
                              <View style={styles.professionalInfo}>
                                <Text style={styles.professionalCardName}>{prof.display_name}</Text>
                                {prof.profession && (
                                  <Text style={styles.professionalProfession}>{prof.profession}</Text>
                                )}
                                {prof.city && (
                                  <Text style={styles.professionalLocation}>📍 {prof.city}</Text>
                                )}
                                {prof.rating && prof.rating > 0 && (
                                  <Text style={styles.professionalRating}>⭐ {prof.rating.toFixed(1)}</Text>
                                )}
                              </View>
                              {selectedProfessional?.id === prof.id && (
                                <View style={styles.checkmarkContainer}>
                                  <Text style={styles.checkmarkIcon}>✓</Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                    {selectedProfessional && (
                      <View style={styles.selectedProfessional}>
                        <Text style={styles.selectedProfessionalText}>
                          ✓ Seleccionado: {selectedProfessional.display_name}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}

              {/* Pregunta 3: Calificación */}
              <Text style={[styles.questionText, { marginTop: 20 }]}>¿Qué tan satisfecho estás con la resolución?</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setSatisfactionRating(star)}
                  >
                    <Text style={styles.star}>
                      {star <= satisfactionRating ? '⭐' : '☆'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pregunta 4: Comentarios */}
              <Text style={[styles.questionText, { marginTop: 20 }]}>Comentarios adicionales (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Cuéntanos sobre tu experiencia..."
                placeholderTextColor="#94a3b8"
                value={comments}
                onChangeText={setComments}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowCompletionModal(false);
                    resetCompletionForm();
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSubmitButton}
                  onPress={submitCompletion}
                >
                  <Text style={styles.modalSubmitButtonText}>Finalizar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  listContent: {
    padding: 16,
  },
  listContentEmpty: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  timeAgo: {
    fontSize: 12,
    color: '#94a3b8',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  messageButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  clientActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optionButtonSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  optionButtonText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
  optionButtonTextSelected: {
    color: '#1e40af',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  star: {
    fontSize: 36,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubmitButton: {
    flex: 2,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  cancelModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  cancelModalMessage: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  cancelModalWarning: {
    color: '#ef4444',
    fontWeight: '600',
  },
  cancelModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelModalNoButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalNoButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelModalYesButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalYesButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  professionalList: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 300,
    padding: 4,
  },
  professionalCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginVertical: 4,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  professionalCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  professionalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  professionalAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  professionalAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  professionalInfo: {
    flex: 1,
  },
  professionalCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  professionalProfession: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  professionalLocation: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  professionalRating: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkmarkIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  professionalItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  professionalName: {
    fontSize: 15,
    color: '#1e293b',
  },
  selectedProfessional: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  selectedProfessionalText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
  },
});
