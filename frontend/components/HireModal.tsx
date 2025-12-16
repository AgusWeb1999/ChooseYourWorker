import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { validationMessages, validateHireMessage } from '../utils/validationMessages';
import { useToast } from '../contexts/ToastContext';

interface HireModalProps {
  visible: boolean;
  professional: {
    id: string;
    name: string;
    specialty: string;
    rate?: number;
  };
  onConfirm: (message: string) => Promise<void>;
  onCancel: () => void;
}

export function HireModal({ visible, professional, onConfirm, onCancel }: HireModalProps) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleValidate = () => {
    const validationError = validateHireMessage(message);
    setError(validationError);
    return !validationError;
  };

  const handleConfirm = async () => {
    if (!handleValidate()) return;

    setLoading(true);
    try {
      await onConfirm(message);
      setMessage('');
      setError(null);
      showToast(validationMessages.hire.messageSent, 'success');
    } catch (err) {
      showToast(validationMessages.hire.messageError, 'error');
      console.error('Error hiring professional:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setMessage('');
    setError(null);
    onCancel();
  };

  const characterCount = message.length;
  const maxCharacters = 500;
  const isNearLimit = characterCount > maxCharacters - 50;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Contratar Trabajador</Text>
              <TouchableOpacity onPress={handleCancel} disabled={loading}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Professional Info */}
            <View style={styles.professionalInfo}>
              <Text style={styles.professionalName}>{professional.name}</Text>
              <Text style={styles.specialty}>{professional.specialty}</Text>
              {professional.rate && (
                <Text style={styles.rate}>
                  Tarifa: ${professional.rate}/hora
                </Text>
              )}
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionsText}>
                Envía un mensaje al trabajador describiendo el trabajo que necesitas. El trabajador podrá revisar tu mensaje antes de aceptar la solicitud.
              </Text>
            </View>

            {/* Message Input */}
            <View style={styles.messageSection}>
              <Text style={styles.label}>Tu Mensaje *</Text>
              <TextInput
                style={[
                  styles.input,
                  error && styles.inputError,
                  message.length >= maxCharacters && styles.inputWarning,
                ]}
                placeholder="Describe el trabajo que necesitas..."
                placeholderTextColor="#9ca3af"
                value={message}
                onChangeText={(text) => {
                  setMessage(text.slice(0, maxCharacters));
                  if (text.length > 0) {
                    setError(null);
                  }
                }}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!loading}
              />

              {/* Character Counter */}
              <View style={styles.counterContainer}>
                <Text
                  style={[
                    styles.counter,
                    isNearLimit && styles.counterWarning,
                    message.length >= maxCharacters && styles.counterError,
                  ]}
                >
                  {characterCount}/{maxCharacters}
                </Text>
              </View>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Validation Helper */}
              {message.length > 0 && message.length < 10 && (
                <Text style={styles.helperText}>
                  Mínimo 10 caracteres ({10 - message.length} caracteres faltantes)
                </Text>
              )}
            </View>

            {/* Benefits Info */}
            <View style={styles.benefitsBox}>
              <Text style={styles.benefitsTitle}>¿Qué sucede después?</Text>
              <Text style={styles.benefitItem}>✓ El trabajador recibirá tu solicitud y mensaje</Text>
              <Text style={styles.benefitItem}>✓ Podrá revisar los detalles antes de aceptar</Text>
              <Text style={styles.benefitItem}>✓ Recibirás una notificación cuando acepte</Text>
              <Text style={styles.benefitItem}>✓ Compartirán datos de contacto una vez confirmado</Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.buttonCancel, loading && styles.buttonDisabled]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.buttonCancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.buttonConfirm,
                (loading || !message || error) && styles.buttonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={loading || !message || !!error}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonConfirmText}>Enviar Solicitud</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#9ca3af',
    padding: 5,
  },
  professionalInfo: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  rate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  instructions: {
    backgroundColor: '#e0e7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  instructionsText: {
    fontSize: 13,
    color: '#4338ca',
    lineHeight: 18,
  },
  messageSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 120,
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputWarning: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  counterContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  counter: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  counterWarning: {
    color: '#f59e0b',
  },
  counterError: {
    color: '#ef4444',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  benefitsBox: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 10,
  },
  benefitItem: {
    fontSize: 13,
    color: '#047857',
    marginBottom: 6,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  buttonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  buttonConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
