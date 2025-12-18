import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function CompleteClientProfileScreen() {
  const router = useRouter();
  const { userProfile, refreshProfiles } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        email: userProfile.email || '',
        address: userProfile.address || '',
      });
    }
  }, [userProfile]);

  function validateForm() {
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
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
          full_name: formData.full_name,
          email: formData.email,
          address: formData.address,
          completed_profile: true,
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      // Refresh profile
      await refreshProfiles();
      
      showToast('✅ Perfil completado exitosamente', 'success');
      
      // Navigate back or to home
      setTimeout(() => {
        router.replace('/(tabs)/');
      }, 1000);
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('❌ Error al guardar perfil', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Completar tu perfil</Text>
          <Text style={styles.subtitle}>
            Necesitamos estos datos para que los trabajadores puedan contactarte
          </Text>
        </View>

        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.field}>
            <Text style={styles.label}>👤 Nombre completo</Text>
            <TextInput
              style={[styles.input, errors.full_name && styles.inputError]}
              placeholder="Tu nombre completo"
              value={formData.full_name}
              onChangeText={(text) => {
                setFormData({ ...formData, full_name: text });
                if (errors.full_name) setErrors({ ...errors, full_name: '' });
              }}
              editable={!saving}
              placeholderTextColor="#9ca3af"
            />
            {errors.full_name && (
              <Text style={styles.errorText}>{errors.full_name}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>📧 Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="tu@email.com"
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              keyboardType="email-address"
              editable={!saving}
              placeholderTextColor="#9ca3af"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Address */}
          <View style={styles.field}>
            <Text style={styles.label}>📍 Dirección</Text>
            <TextInput
              style={[styles.input, styles.addressInput, errors.address && styles.inputError]}
              placeholder="Tu dirección completa"
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
            <Text style={styles.saveButtonText}>✓ Guardar cambios</Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ ¿Por qué estos datos?</Text>
          <Text style={styles.infoText}>
            • Tu <Text style={styles.infoBold}>teléfono</Text> se compartirá cuando un trabajador acepte tu solicitud{'\n'}
            • Tu <Text style={styles.infoBold}>dirección</Text> ayuda a trabajadores a ubicarse{'\n'}
            • Tu <Text style={styles.infoBold}>email</Text> usamos para notificaciones importantes
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
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
  countryPicker: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#111827',
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
  infoBold: {
    fontWeight: '700',
  },
});