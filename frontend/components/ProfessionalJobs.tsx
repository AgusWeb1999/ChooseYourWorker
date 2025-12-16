import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { HireModal } from './HireModal';
import { useToast } from '../contexts/ToastContext';
import { notificationTemplates, createNotification } from '../services/notificationService';

interface Job {
  id: string;
  created_at: string;
  client_id: string;
  client_name: string;
  client_email?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'waiting_client_approval' | 'cancelled';
  service_date: string;
  notes: string;
  hire_message?: string;
  client_contact_visible: boolean;
  client_phone?: string;
  client_address?: string;
  rating?: number;
  review?: string;
  payment_amount?: number;
}

interface ProfessionalJobsProps {
  professionalId: string;
}

export default function ProfessionalJobs({ professionalId }: ProfessionalJobsProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [hireModalVisible, setHireModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, [professionalId]);

  async function fetchJobs() {
    try {
      // Por ahora simulamos datos ya que la tabla no existe aún
      // TODO: Crear tabla 'jobs' en Supabase
      // TODO: Crear tabla 'jobs' en Supabase
      // Reemplazar con llamada a API cuando esté lista
      setJobs([]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'accepted': return '#8b5cf6';
      case 'pending': return '#f59e0b';
      case 'waiting_client_approval': return '#06b6d4';
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
      case 'waiting_client_approval': return 'Esperando confirmación del cliente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  }

  // Handlers para los botones
  async function handleAcceptJob(jobId: string) {
    try {
      // TODO: Actualizar estado a 'accepted' en Supabase
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        // TODO: Integrar notificación al cliente
        // const notification = createNotification(
        //   'solicitud_aceptada',
        //   job.client_id,
        //   professionalId,
        //   'Trabajador',
        //   notificationTemplates.solicitudAceptada(job.client_name).title,
        //   notificationTemplates.solicitudAceptada(job.client_name).message,
        //   jobId,
        //   'job'
        // );
        showToast('Solicitud aceptada exitosamente', 'success');
      }
      console.log('Trabajo aceptado:', jobId);
    } catch (error) {
      console.error('Error al aceptar trabajo:', error);
      showToast('Error al aceptar la solicitud', 'error');
    }
  }

  async function handleRejectJob(jobId: string) {
    try {
      // TODO: Actualizar estado a 'cancelled' en Supabase
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        // TODO: Integrar notificación al cliente
        showToast('Solicitud rechazada', 'info');
      }
      console.log('Trabajo rechazado:', jobId);
    } catch (error) {
      console.error('Error al rechazar trabajo:', error);
      showToast('Error al rechazar la solicitud', 'error');
    }
  }

  async function handleRequestCompletion(jobId: string) {
    try {
      // TODO: Actualizar estado a 'waiting_client_approval' en Supabase
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        // TODO: Integrar notificación al cliente
        showToast('Solicitud de finalización enviada', 'success');
      }
      console.log('Solicitud de finalización enviada:', jobId);
    } catch (error) {
      console.error('Error al solicitar finalización:', error);
      showToast('Error al solicitar finalización', 'error');
    }
  }

  async function handleHireConfirm(message: string) {
    if (!selectedJob) return;
    
    try {
      // TODO: Crear record en tabla de hirings/jobs
      // TODO: Enviar notificación al trabajador con el mensaje
      const notification = createNotification(
        'solicitud_enviada',
        selectedJob.client_id,
        professionalId,
        'Cliente',
        notificationTemplates.solicitudEnviada(selectedJob.client_name).title,
        notificationTemplates.solicitudEnviada(selectedJob.client_name).message,
        selectedJob.id,
        'job'
      );
      
      console.log('Solicitud de contratación enviada:', {
        jobId: selectedJob.id,
        message,
        notification,
      });

      setHireModalVisible(false);
      setSelectedJob(null);
    } catch (error) {
      console.error('Error en handleHireConfirm:', error);
      throw error;
    }
  }

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(job => job.status === filter);

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    totalEarned: jobs
      .filter(j => j.status === 'completed')
      .reduce((sum, j) => sum + (j.payment_amount || 0), 0),
  };

  function renderJob({ item }: { item: Job }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.clientName}>{item.client_name}</Text>
            <Text style={styles.date}>📅 {new Date(item.service_date).toLocaleDateString('es-AR')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {item.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📝 Descripción:</Text>
              <Text style={styles.infoValue}>{item.notes}</Text>
            </View>
          )}

          {item.hire_message && (
            <View style={styles.messageSection}>
              <Text style={styles.messageLabel}>📬 Mensaje del cliente:</Text>
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>{item.hire_message}</Text>
              </View>
            </View>
          )}

          {item.client_contact_visible && (item.client_phone || item.client_address) && (
            <View style={styles.contactSection}>
              <Text style={styles.contactLabel}>📍 Datos de contacto compartidos:</Text>
              {item.client_phone && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>📱</Text>
                  <Text style={styles.contactValue}>{item.client_phone}</Text>
                </View>
              )}
              {item.client_address && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>📍</Text>
                  <Text style={styles.contactValue}>{item.client_address}</Text>
                </View>
              )}
              {item.client_email && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>✉️</Text>
                  <Text style={styles.contactValue}>{item.client_email}</Text>
                </View>
              )}
            </View>
          )}

          {item.payment_amount && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>💰 Pago:</Text>
              <Text style={styles.paymentAmount}>
                ${item.payment_amount.toLocaleString('es-AR')}
              </Text>
            </View>
          )}

          {item.status === 'completed' && item.rating && (
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Calificación del cliente:</Text>
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

          {item.status === 'pending' && (
            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => handleAcceptJob(item.id)}
              >
                <Text style={styles.acceptButtonText}>✓ Aceptar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.declineButton}
                onPress={() => handleRejectJob(item.id)}
              >
                <Text style={styles.declineButtonText}>✕ Rechazar</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.status === 'in_progress' && (
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={() => handleRequestCompletion(item.id)}
            >
              <Text style={styles.completeButtonText}>⏳ Solicitar Finalización</Text>
            </TouchableOpacity>
          )}

          {item.status === 'waiting_client_approval' && (
            <View style={styles.waitingApprovalContainer}>
              <Text style={styles.waitingApprovalTitle}>⏳ Esperando confirmación del cliente</Text>
              <Text style={styles.waitingApprovalText}>
                Solicitaste finalizar el trabajo. El cliente debe confirmar que está completo.
              </Text>
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
        <Text style={styles.loadingText}>Cargando trabajos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.in_progress}</Text>
          <Text style={styles.statLabel}>En Proceso</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Todos ({stats.total})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'pending' && styles.filterChipActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pendientes ({stats.pending})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'in_progress' && styles.filterChipActive]}
          onPress={() => setFilter('in_progress')}
        >
          <Text style={[styles.filterText, filter === 'in_progress' && styles.filterTextActive]}>
            En Proceso ({stats.in_progress})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'completed' && styles.filterChipActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Completados ({stats.completed})
          </Text>
        </TouchableOpacity>
      </View>

      {filteredJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💼</Text>
          <Text style={styles.emptyText}>No hay trabajos en esta categoría</Text>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderJob}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <HireModal
        visible={hireModalVisible}
        professional={selectedJob ? {
          id: selectedJob.id,
          name: selectedJob.client_name,
          specialty: selectedJob.notes.substring(0, 50),
          rate: selectedJob.payment_amount,
        } : {
          id: '',
          name: '',
          specialty: '',
        }}
        onConfirm={handleHireConfirm}
        onCancel={() => {
          setHireModalVisible(false);
          setSelectedJob(null);
        }}
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardWide: {
    flex: 1,
    minWidth: '100%',
    backgroundColor: '#6366f1',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  statValueMoney: {
    color: '#fff',
    fontSize: 24,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
    paddingTop: 0,
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
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#64748b',
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
  cardBody: {
    padding: 16,
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
  paymentAmount: {
    fontSize: 20,
    color: '#10b981',
    fontWeight: 'bold',
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
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  declineButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  completeButton: {
    marginTop: 12,
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  waitingApprovalContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#06b6d4' + '15',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4',
  },
  waitingApprovalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0891b2',
    marginBottom: 6,
  },
  waitingApprovalText: {
    fontSize: 13,
    color: '#0891b2',
    lineHeight: 18,
  },
  messageSection: {
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  messageLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '600',
  },
  messageBubble: {
    backgroundColor: '#e0e7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
});
