import { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  KeyboardAvoidingView, 
  ScrollView, 
  Keyboard,
  Platform 
} from 'react-native';
import { supabase } from '../src/lib/supabase';

interface AddReviewProps {
  professionalId: string;
  clientId: string;
  hireId: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddReview({ 
  professionalId, 
  clientId, 
  hireId,
  visible, 
  onClose,
  onSuccess 
}: AddReviewProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [costo, setCosto] = useState(''); // Nuevo campo para el costo
  const [loading, setLoading] = useState(false);

  console.log('🟢 AddReview renderizado:', { 
    professionalId, 
    clientId,
    hireId,
    visible,
    hasOnClose: !!onClose,
    hasOnSuccess: !!onSuccess
  });

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    // Validar costo si se ingresa (opcional, pero debe ser número positivo)
    if (costo && isNaN(Number(costo))) {
      Alert.alert('Error', 'El campo "¿Cuánto te salió?" debe ser un número válido o dejarse vacío.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .upsert({
          professional_id: professionalId,
          client_id: clientId,
          hire_id: hireId,
          rating,
          comment: comment.trim() || null,
          costo: costo ? Number(costo) : null,
        }, { onConflict: 'hire_id' });

      if (error) {
        console.error('Error al publicar reseña:', error);
        Alert.alert('Error', error.message || 'No se pudo publicar la reseña');
        setLoading(false);
        return;
      }
      // Éxito - resetear estado y cerrar
      setRating(0);
      setComment('');
      setCosto('');
      setLoading(false);
      onSuccess();
      onClose();
      setTimeout(() => {
        Alert.alert('¡Éxito!', 'Tu reseña ha sido publicada');
      }, 300);
    } catch (error: any) {
      console.error('Error inesperado al publicar reseña:', error);
      Alert.alert('Error', error.message || 'Ocurrió un error al publicar la reseña');
      setLoading(false);
    }
  }

  function renderStarSelector() {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Text style={styles.starText}>
              {star <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Calificar Profesional</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.label}>¿Cómo fue tu experiencia?</Text>
            {renderStarSelector()}
            
            {rating > 0 && (
              <Text style={styles.ratingText}>
                {rating === 1 && '😞 Muy malo'}
                {rating === 2 && '😕 Malo'}
                {rating === 3 && '😐 Regular'}
                {rating === 4 && '😊 Bueno'}
                {rating === 5 && '🤩 Excelente'}
              </Text>
            )}


            <Text style={styles.label}>¿Cuánto te salió? (opcional)</Text>
            <TextInput
              style={styles.costoInput}
              placeholder="Ej: 1500"
              placeholderTextColor="#999"
              value={costo}
              onChangeText={setCosto}
              keyboardType="numeric"
              maxLength={10}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Comentario (opcional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Cuéntanos sobre tu experiencia con este profesional..."
              placeholderTextColor="#999"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={6}
              maxLength={500}
            />
            <Text style={styles.charCount}>{comment.length}/500</Text>

            <TouchableOpacity
              style={[styles.submitButton, (loading || rating === 0) && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading || rating === 0}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Publicando...' : 'Publicar Reseña'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  costoInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#1e3a5f',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  starButton: {
    padding: 8,
  },
  starText: {
    fontSize: 48,
  },
  ratingText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#1e3a5f',
    fontWeight: '600',
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    height: 150,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
