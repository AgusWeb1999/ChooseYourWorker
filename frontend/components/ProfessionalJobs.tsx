import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { notificationTemplates } from '../services/notificationService';
import { useAuth } from '../src/contexts/AuthContext';

interface Job {
  id: string;
  created_at: string;
  client_id: string;
  client_name: string;
  client_email?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'waiting_client_approval' | 'cancelled';
  service_date: string;
  notes: string;
  proposal_message?: string;
  client_contact_visible: boolean;
  client_phone?: string;
  client_address?: string;
  rating?: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'waiting_client_approval' | 'cancelled' | 'rejected';
  payment_amount?: number;
}

interface ProfessionalJobsProps {
  professionalId: string;
}

export default function ProfessionalJobs({ professionalId }: ProfessionalJobsProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const { showToast } = useToast();
  const { userProfile } = useAuth();

  useEffect(() => {
    fetchJobs();
  }, [professionalId]);

  async function fetchJobs() {
    try {
      const { data, error } = await supabase
        .from('hires')
        .select(`
          id, created_at, status, proposal_message, client_id, professional_id,
          started_at, completed_at,
          client:client_id ( id, full_name, email, phone, address )
        `)
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Job[] = (data || []).map((item: any) => ({
        id: item.id,
        created_at: item.created_at,
        client_id: item.client_id,
        client_name: item.client?.full_name || 'Cliente',
        client_email: item.client?.email,
        status: item.status,
        service_date: item.created_at,
        notes: '',
        proposal_message: item.proposal_message || '',
        client_contact_visible: ['accepted', 'in_progress', 'waiting_client_approval', 'completed'].includes(item.status),
        client_phone: item.client?.phone,
        client_address: item.client?.address,
      }));

      console.log('📋 JOBS FETCHED:', mapped.map(j => ({
        status: j.status,
        phone: j.client_phone,
        address: j.client_address,
        email: j.client_email
      })));

      setJobs(mapped);
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
      case 'pending': return '#f59e0b';
      case 'accepted': return '#8b5cf6';
      case 'waiting_client_approval': return '#06b6d4';
      case 'rejected': return '#ef4444';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En Proceso';
      case 'pending': return 'Pendiente';
      case 'waiting_client_approval': return 'Esperando confirmación del cliente';
      case 'rejected': return 'Rechazado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  }

  // Handlers para los botones
  async function handleAcceptJob(jobId: string) {
    try {
      const job = jobs.find(j => j.id === jobId);
      
      // Actualizar el hire
      const { error: updateError } = await supabase
        .from('hires')
        .update({ status: 'in_progress', started_at: new Date().toISOString(), accepted_at: new Date().toISOString() })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Crear notificación
      if (job) {
        const { error: notifError } = await supabase.from('notifications').insert({
          type: 'solicitud_aceptada',
          user_id: job.client_id,
          sender_id: userProfile?.id,
          sender_name: userProfile?.full_name || 'Trabajador',
          title: notificationTemplates.solicitudAceptada(userProfile?.full_name || 'Trabajador').title,
          message: notificationTemplates.solicitudAceptada(userProfile?.full_name || 'Trabajador').message,
          related_id: jobId,
          related_type: 'hire',
        });
        
        if (notifError) {
          console.warn('Aviso: Notificación no enviada (pero trabajo se aceptó)', notifError);
        }
      }
      
      showToast('Solicitud aceptada exitosamente', 'success');
      // Re-fetch jobs después de un pequeño delay para asegurar que los datos estén actualizados
      await new Promise(resolve => setTimeout(resolve, 500));
      fetchJobs();
    } catch (error) {
      console.error('Error al aceptar trabajo:', error);
      showToast('Error al aceptar la solicitud', 'error');
    }
  }

  async function handleRejectJob(jobId: string) {
    try {
      const job = jobs.find(j => j.id === jobId);
      
      // Actualizar el hire
      const { error: updateError } = await supabase
        .from('hires')
        .update({ status: 'rejected', rejected_at: new Date().toISOString() })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Crear notificación
      if (job) {
        const { error: notifError } = await supabase.from('notifications').insert({
          type: 'solicitud_rechazada',
          user_id: job.client_id,
          sender_id: userProfile?.id,
          sender_name: userProfile?.full_name || 'Trabajador',
          title: notificationTemplates.solicitudRechazada(userProfile?.full_name || 'Trabajador').title,
          message: notificationTemplates.solicitudRechazada(userProfile?.full_name || 'Trabajador').message,
          related_id: jobId,
          related_type: 'hire',
        });
        
        if (notifError) {
          console.warn('Aviso: Notificación no enviada (pero trabajo se rechazó)', notifError);
        }
      }
      
      showToast('Solicitud rechazada', 'info');
      // Re-fetch jobs después de un pequeño delay para asegurar que los datos estén actualizados
      await new Promise(resolve => setTimeout(resolve, 500));
      fetchJobs();
    } catch (error) {
      console.error('Error al rechazar trabajo:', error);
      showToast('Error al rechazar la solicitud', 'error');
    }
  }

  async function handleRequestCompletion(jobId: string) {
    try {
      const job = jobs.find(j => j.id === jobId);
      
      // Actualizar el hire
      const { error: updateError } = await supabase
        .from('hires')
        .update({ status: 'waiting_client_approval', completion_requested_at: new Date().toISOString() })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Crear notificación
      if (job) {
        const { error: notifError } = await supabase.from('notifications').insert({
          type: 'trabajo_completado',
          user_id: job.client_id,
          sender_id: userProfile?.id,
          sender_name: userProfile?.full_name || 'Trabajador',
          title: notificationTemplates.trabajoCompletado(userProfile?.full_name || 'Trabajador').title,
          message: notificationTemplates.trabajoCompletado(userProfile?.full_name || 'Trabajador').message,
          related_id: jobId,
          related_type: 'hire',
        });
        
        if (notifError) {
          console.warn('Aviso: Notificación no enviada (pero trabajo se marcó como completado)', notifError);
        }
      }
      
      showToast('Solicitud de finalización enviada', 'success');
      // Re-fetch jobs después de un pequeño delay para asegurar que los datos estén actualizados
      await new Promise(resolve => setTimeout(resolve, 500));
      fetchJobs();
    } catch (error) {
      console.error('Error al solicitar finalización:', error);
      showToast('Error al solicitar finalización', 'error');
    }
  }

  function openWhatsApp(phoneNumber: string) {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}`;
    window.open(url, '_blank');
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
    // Debug logging
    console.log(`🔍 Rendering job ${item.id}:`, {
      status: item.status,
      phone: item.client_phone,
      address: item.client_address,
      showContact: (item.status === 'in_progress' || item.status === 'accepted' || item.status === 'waiting_client_approval'),
    });
    
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

          {item.proposal_message && (
            <View style={styles.messageSection}>
              <Text style={styles.messageLabel}>📬 Mensaje del cliente:</Text>
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>{item.proposal_message}</Text>
              </View>
            </View>
          )}

          {(item.status === 'in_progress' || item.status === 'accepted' || item.status === 'waiting_client_approval') && (
            <View style={styles.activeContactSection}>
              <Text style={styles.contactLabel}>👥 Contacto del cliente:</Text>
              {item.client_phone ? (
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>📱</Text>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactValue}>{item.client_phone}</Text>
                    <TouchableOpacity 
                      style={styles.whatsappButton}
                      onPress={() => openWhatsApp(item.client_phone || '')}
                    >
                      <Text style={styles.whatsappButtonText}>💬 Abrir WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.contactValue}>Número no disponible</Text>
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
  contactInfo: {
    flex: 1,
  },
  contactValue: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '500',
    marginBottom: 6,
  },
  whatsappButton: {
    backgroundColor: '#25d366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  whatsappButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  activeContactSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
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
