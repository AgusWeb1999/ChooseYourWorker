import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { notificationTemplates, createNotification } from '../services/notificationService';

interface Hiring {
  id: string;
  created_at: string;
  professional_id: string;
  professional_name: string;
  profession: string;
  professional_phone?: string;
  professional_address?: string;
  professional_email?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  accepted_status?: 'pending_acceptance' | 'accepted' | 'rejected' | 'waiting_your_approval';
  service_date: string;
  notes: string;
  message: string;
  rating?: number;
  review?: string;
}

interface ClientHiringsProps {
  userId: string;
}

export default function ClientHirings({ userId }: ClientHiringsProps) {
  const [hirings, setHirings] = useState<Hiring[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchHirings();
  }, [userId]);

  async function fetchHirings() {
    try {
      // Por ahora simulamos datos ya que la tabla no existe aún
      // TODO: Crear tabla 'hirings' en Supabase
      // Reemplazar con llamada a API cuando esté lista
      setHirings([]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching hirings:', error);
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'accepted': return '#8b5cf6';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En Proceso';
      case 'accepted': return 'Aceptado';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  }

  // Handlers para los botones del cliente
  async function handleApproveCompletion(hiringId: string) {
    try {
      // TODO: Actualizar estado a 'completed' en Supabase
      const hiring = hirings.find(h => h.id === hiringId);
      if (hiring) {
        // TODO: Enviar notificación al trabajador
        // const notification = createNotification(
        //   'aprobacion_completado',
        //   hiring.professional_id,
        //   userId,
        //   'Cliente',
        //   notificationTemplates.aprobacionCompletado(hiring.professional_name).title,
        //   notificationTemplates.aprobacionCompletado(hiring.professional_name).message,
        //   hiringId,
        //   'hiring'
        // );
        showToast('Trabajo marcado como completado', 'success');
      }
      console.log('Trabajo finalizado por cliente:', hiringId);
    } catch (error) {
      console.error('Error al finalizar trabajo:', error);
      showToast('Error al finalizar el trabajo', 'error');
    }
  }

  function renderHiring({ item }: { item: Hiring }) {
    const getAcceptanceStatusColor = (status?: string) => {
      switch (status) {
        case 'accepted': return '#10b981';
        case 'rejected': return '#ef4444';
        case 'pending_acceptance': return '#f59e0b';
        default: return '#64748b';
      }
    };

    const getAcceptanceStatusText = (status?: string) => {
      switch (status) {
        case 'accepted': return '✓ Aceptado';
        case 'rejected': return '✕ Rechazado';
        case 'pending_acceptance': return '⏳ Pendiente de respuesta';
        default: return 'Esperando respuesta';
      }
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.professionalName}>{item.professional_name}</Text>
            <Text style={styles.profession}>{item.profession}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        {/* Acceptance Status Section */}
        {item.accepted_status && (
          <View style={[styles.acceptanceStatusBar, { backgroundColor: getAcceptanceStatusColor(item.accepted_status) + '15', borderLeftColor: getAcceptanceStatusColor(item.accepted_status) }]}>
            <Text style={[styles.acceptanceStatusText, { color: getAcceptanceStatusColor(item.accepted_status) }]}>
              {getAcceptanceStatusText(item.accepted_status)}
            </Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Fecha del servicio:</Text>
            <Text style={styles.infoValue}>{new Date(item.service_date).toLocaleDateString('es-AR')}</Text>
          </View>
          
          {item.message && (
            <View style={styles.messageSection}>
              <Text style={styles.messageLabel}>💬 Tu solicitud:</Text>
              <Text style={styles.messageText}>"{item.message}"</Text>
            </View>
          )}

          {item.accepted_status === 'accepted' && (item.professional_phone || item.professional_address || item.professional_email) && (
            <View style={styles.contactSection}>
              <Text style={styles.contactLabel}>📍 Datos de contacto del trabajador:</Text>
              {item.professional_phone && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>📱</Text>
                  <Text style={styles.contactValue}>{item.professional_phone}</Text>
                </View>
              )}
              {item.professional_address && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>📍</Text>
                  <Text style={styles.contactValue}>{item.professional_address}</Text>
                </View>
              )}
              {item.professional_email && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>✉️</Text>
                  <Text style={styles.contactValue}>{item.professional_email}</Text>
                </View>
              )}
            </View>
          )}

          {item.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📝 Notas:</Text>
              <Text style={styles.infoValue}>{item.notes}</Text>
            </View>
          )}

          {item.status === 'completed' && item.rating && (
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Tu calificación:</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Text key={star} style={styles.star}>
                    {star <= item.rating! ? '⭐' : '☆'}
                  </Text>
                ))}
              </View>
              {item.review && (
                <Text style={styles.reviewText}>"{item.review}"</Text>
              )}
            </View>
          )}

          {item.status === 'completed' && !item.rating && (
            <TouchableOpacity style={styles.reviewButton}>
              <Text style={styles.reviewButtonText}>✍️ Dejar Reseña</Text>
            </TouchableOpacity>
          )}

          {item.accepted_status === 'rejected' && item.status === 'pending' && (
            <View style={styles.rejectedContainer}>
              <Text style={styles.rejectedTitle}>✕ Solicitud Rechazada</Text>
              <Text style={styles.rejectedText}>
                El profesional rechazó tu solicitud de trabajo.
              </Text>
            </View>
          )}

          {item.status === 'in_progress' && item.accepted_status === 'accepted' && (
            <View style={styles.inProgressContainer}>
              <Text style={styles.inProgressTitle}>🔧 Trabajo en proceso</Text>
              <Text style={styles.inProgressText}>
                El profesional está trabajando en tu solicitud. Te avisaremos cuando solicite la finalización.
              </Text>
            </View>
          )}

          {item.status === 'in_progress' && item.accepted_status === 'waiting_your_approval' && (
            <View style={styles.approvalContainer}>
              <Text style={styles.approvalTitle}>✓ ¿Trabajo terminado?</Text>
              <Text style={styles.approvalText}>
                El profesional reportó que completó el trabajo. Confirma si está todo bien.
              </Text>
              <TouchableOpacity 
                style={styles.approveButton}
                onPress={() => handleApproveCompletion(item.id)}
              >
                <Text style={styles.approveButtonText}>✓ Confirmar que está terminado</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Cargando contrataciones...</Text>
      </View>
    );
  }

  if (hirings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>No tenés contrataciones aún</Text>
        <Text style={styles.emptySubtext}>
          Explorá profesionales y contratá servicios para verlos aquí
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={hirings}
        renderItem={renderHiring}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flex: 1,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  profession: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  acceptanceStatusBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 4,
  },
  acceptanceStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
  },
  messageSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  messageLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 14,
    color: '#1e293b',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  ratingSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    fontSize: 20,
    marginRight: 4,
  },
  reviewText: {
    fontSize: 14,
    color: '#1e293b',
    fontStyle: 'italic',
    marginTop: 8,
  },
  reviewButton: {
    marginTop: 12,
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  rejectedContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#ef4444' + '15',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  rejectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 6,
  },
  rejectedText: {
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 18,
  },
  inProgressContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#3b82f6' + '15',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  inProgressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 6,
  },
  inProgressText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  approvalContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#10b981' + '15',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  approvalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 6,
  },
  approvalText: {
    fontSize: 13,
    color: '#065f46',
    lineHeight: 18,
    marginBottom: 12,
  },
  approveButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  contactSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  contactLabel: {
    fontSize: 14,
    color: '#065f46',
    marginBottom: 10,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#047857',
  },
  contactValue: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '500',
  },
});