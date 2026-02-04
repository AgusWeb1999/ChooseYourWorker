import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

interface HireData {
  id: string;
  professional_id: string;
  guest_client_name: string;
  guest_client_email: string;
  service_category?: string;
  service_description?: string;
  service_location?: string;
  reviewed_by_guest: boolean;
  professional: {
    display_name: string;
    profession?: string;
  };
}

export default function GuestReviewPage() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hire, setHire] = useState<HireData | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchHireByToken();
    }
  }, [token]);

  async function fetchHireByToken() {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('hires')
        .select(`
          id,
          professional_id,
          guest_client_name,
          guest_client_email,
          service_category,
          service_description,
          service_location,
          reviewed_by_guest,
          professional:professional_id (
            display_name,
            profession
          )
        `)
        .eq('review_token', token)
        .single();

      if (error) throw error;

      if (!data) {
        setError('El enlace de revisión no es válido o ha expirado.');
        return;
      }

      if (data.reviewed_by_guest) {
        setError('Ya has dejado una reseña para este trabajo.');
        return;
      }

      // Supabase devuelve professional como array, convertir a objeto
      const professionalData = Array.isArray(data.professional) ? data.professional[0] : data.professional;
      
      setHire({
        ...data,
        professional: professionalData
      } as HireData);
    } catch (err) {
      console.error('Error fetching hire:', err);
      setError('No se pudo cargar la información del trabajo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (rating === 0) {
      setError('Por favor selecciona una calificación.');
      return;
    }

    if (!hire) return;

    setSubmitting(true);
    setError('');

    try {
      // Insertar review
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          professional_id: hire.professional_id,
          hire_id: hire.id,
          rating,
          comment: comment.trim() || null,
          is_guest_review: true,
          guest_reviewer_name: hire.guest_client_name,
        })
        .select('id')
        .single();

      if (reviewError) throw reviewError;

      // Marcar como reviewed y completado
      const { error: updateError } = await supabase
        .from('hires')
        .update({ 
          reviewed_by_guest: true,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('review_token', token);

      if (updateError) throw updateError;

      // Enviar email al profesional notificándole de la nueva reseña
      if (reviewData?.id) {
        const frontendUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            type: 'new_review',
            reviewId: reviewData.id,
            frontendUrl
          }
        });

        if (emailError) {
          console.warn('Aviso: Email no enviado al profesional (pero reseña se guardó)', emailError);
        } else {
          console.log('✅ Email de nueva reseña enviado al profesional');
        }
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('No se pudo enviar la reseña. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            disabled={submitting}
          >
            <Text style={styles.star}>
              {star <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (error && !hire) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Enlace inválido</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>¡Gracias por tu reseña!</Text>
        <Text style={styles.successMessage}>
          Tu calificación ha sido enviada a {hire?.professional.display_name}.
        </Text>
        <Text style={styles.successSubtext}>
          Las reseñas ayudan a otros usuarios a encontrar profesionales de confianza.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Califica tu experiencia</Text>
        <Text style={styles.subtitle}>
          ¿Cómo fue el servicio de <Text style={styles.professionalName}>{hire?.professional.display_name}</Text>?
        </Text>
      </View>

      <View style={styles.serviceInfo}>
        <Text style={styles.serviceLabel}>Servicio solicitado</Text>
        {hire?.service_category && (
          <Text style={styles.serviceCategory}>📦 {hire.service_category}</Text>
        )}
        {hire?.service_description && (
          <Text style={styles.serviceDescription}>{hire.service_description}</Text>
        )}
        {hire?.service_location && (
          <Text style={styles.serviceLocation}>📍 {hire.service_location}</Text>
        )}
      </View>

      <View style={styles.ratingSection}>
        <Text style={styles.ratingLabel}>Tu calificación *</Text>
        {renderStars()}
        {rating > 0 && (
          <Text style={styles.ratingText}>
            {rating === 1 && 'Muy malo'}
            {rating === 2 && 'Malo'}
            {rating === 3 && 'Regular'}
            {rating === 4 && 'Bueno'}
            {rating === 5 && 'Excelente'}
          </Text>
        )}
      </View>

      <View style={styles.commentSection}>
        <Text style={styles.commentLabel}>Comentario (opcional)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Cuéntanos sobre tu experiencia..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
          editable={!submitting}
        />
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting || rating === 0}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Enviar reseña</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Al enviar esta reseña confirmas que has recibido el servicio de {hire?.professional.display_name}.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  professionalName: {
    fontWeight: '600',
    color: '#6366f1',
  },
  serviceInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  serviceCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 8,
  },
  serviceLocation: {
    fontSize: 14,
    color: '#64748b',
  },
  ratingSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    fontSize: 48,
  },
  ratingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  commentSection: {
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
