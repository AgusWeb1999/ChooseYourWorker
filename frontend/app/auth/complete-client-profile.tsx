import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function CompleteClientProfileScreen() {
  const router = useRouter();
  const { userProfile, refreshProfiles } = useAuth();
  const { showToast } = useToast();
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userProfile) {
      setFormData({
        phone: userProfile.phone || '',
        address: userProfile.address || '',
      });
    }
  }, [userProfile]);

  function validateForm() {
    const newErrors: Record<string, string> = {};
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'El telefono es requerido';
    } else if (formData.phone.length < 8) {
      newErrors.phone = 'Telefono invalido (minimo 8 digitos)';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'La direccion es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validateForm() || !userProfile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          phone: formData.phone.trim(),
          address: formData.address.trim(),
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      await refreshProfiles();
      
      showToast('Perfil completado exitosamente', 'success');
      
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Error al guardar perfil', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Completar tu perfil</Text>
            <Text style={styles.subtitle}>
              Agrega tu telefono y direccion para que los trabajadores puedan contactarte cuando acepten tu solicitud
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>📱 Telefono *</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="Ej: 1155551234"
                value={formData.phone}
                onChangeText={(text) => {
                  setFormData({ ...formData, phone: text });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                keyboardType="phone-pad"
                editable={!saving}
                placeholderTextColor="#9ca3af"
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
              <Text style={styles.helperText}>
                Este numero sera compartido con trabajadores que acepten tu solicitud
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>📍 Direccion *</Text>
              <TextInput
                style={[styles.input, styles.addressInput, errors.address && styles.inputError]}
                placeholder="Tu direccion completa"
                value={formData.address}
                onChangeText={(text) => {
                  setFormData({ ...formData, address: text });
                  if (errors.address) setErrors({ ...errors, address: '' });
                }}
                editable={!saving}
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
              {errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar cambios</Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>¿Por que estos datos?</Text>
            <Text style={styles.infoText}>
              Tu telefono sera compartido cuando un trabajador acepte tu solicitud.{'\n'}
              Tu direccion ayuda a los trabajadores a ubicar el lugar de trabajo.{'\n'}
              Estos datos son necesarios para que puedan contactarte y llegar al sitio.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  addressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 6,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#ecfdf5',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    padding: 16,
    borderRadius: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#065f46',
    lineHeight: 22,
  },
});
