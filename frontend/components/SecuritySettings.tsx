import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform
} from 'react-native';
import { supabase } from '../src/lib/supabase';
import { useRouter } from 'expo-router';

interface SecuritySettingsProps {
  currentEmail: string;
  userId: string;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

export default function SecuritySettings({ currentEmail, userId, setToast }: SecuritySettingsProps) {
  const router = useRouter();
  
  // Estado para cambio de email
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  
  // Estado para cambio de contraseña
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Validar formato de email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar contraseña
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Debe contener al menos una mayúscula';
    }
    if (!/[a-z]/.test(password)) {
      return 'Debe contener al menos una minúscula';
    }
    if (!/[0-9]/.test(password)) {
      return 'Debe contener al menos un número';
    }
    return null;
  };

  // Cambiar email
  const handleChangeEmail = async () => {
    if (!newEmail || newEmail.trim() === '') {
      setToast({ message: 'Ingresa un nuevo email', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    if (!isValidEmail(newEmail)) {
      setToast({ message: 'El formato del email no es válido', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setToast({ message: 'El nuevo email es igual al actual', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setEmailLoading(true);
    try {
      console.log('📧 Cambiando email de', currentEmail, 'a', newEmail);
      
      // Construir redirectTo dinámicamente según entorno
      let emailRedirectTo: string;
      if (Platform.OS === 'web') {
        // En web, usar la URL actual del navegador
        emailRedirectTo = `${window.location.origin}/auth/email-verified`;
      } else {
        // En app nativa, usar deep link
        emailRedirectTo = 'workinggo://auth/email-verified';
      }
      
      console.log('🔗 Redirect configurado:', emailRedirectTo);
      
      // Cambiar email - Supabase enviará automáticamente email de verificación
      const { data, error } = await supabase.auth.updateUser({ 
        email: newEmail,
      }, {
        emailRedirectTo: emailRedirectTo
      });

      if (error) {
        console.error('❌ Error al cambiar email:', error);
        
        // Traducir errores comunes de Supabase al español
        if (error.message.includes('A user with this email address has already been registered')) {
          setToast({ message: 'Ya existe un usuario registrado con este email', type: 'error' });
        } else {
          setToast({ message: 'No se pudo cambiar el email', type: 'error' });
        }
        
        setTimeout(() => setToast(null), 3000);
        setEmailLoading(false);
        return;
      }

      console.log('✅ Email actualizado, verificación enviada');
      
      // Mostrar mensaje de verificación
      setToast({ 
        message: 'Se ha enviado un email de verificación. Por favor, verifica tu nuevo email para completar el cambio', 
        type: 'success' 
      });
      
      // Esperar 3 segundos, cerrar sesión y redirigir al login
      setTimeout(async () => {
        console.log('🚪 Cerrando todas las sesiones...');
        await supabase.auth.signOut({ scope: 'global' });
        router.replace('/auth/login');
      }, 3000);
    } catch (error: any) {
      console.error('❌ Error:', error);
      setToast({ message: 'No se pudo cambiar el email', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setEmailLoading(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async () => {
    console.log('🔐 handleChangePassword llamado');
    console.log('Nueva contraseña:', newPassword ? '***' : 'vacía');
    console.log('Confirmar contraseña:', confirmPassword ? '***' : 'vacía');
    
    if (!newPassword || !confirmPassword) {
      console.log('❌ Campos vacíos');
      console.log('Llamando setToast con error de campos vacíos');
      setToast({ message: 'Completa todos los campos', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      console.log('❌ Contraseñas no coinciden');
      console.log('Llamando setToast con error de contraseñas no coinciden');
      setToast({ message: 'Las contraseñas no coinciden', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      console.log('❌ Error de validación:', passwordError);
      console.log('Llamando setToast con error de validación');
      setToast({ message: passwordError, type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    console.log('✅ Validaciones pasadas, ejecutando cambio');
    setPasswordLoading(true);
    
    try {
      console.log('🔐 Cambiando contraseña...');
      
      // Cambiar contraseña
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Error al cambiar contraseña:', error);
        throw error;
      }

      console.log('✅ Contraseña actualizada');
      
      // Cerrar todas las sesiones
      console.log('🚪 Cerrando todas las sesiones...');
      await supabase.auth.signOut({ scope: 'global' });
      
      setToast({ message: '¡Contraseña actualizada! Inicia sesión nuevamente', type: 'success' });
      setTimeout(() => {
        router.replace('/auth/login');
      }, 2000);
    } catch (error: any) {
      console.error('❌ Error:', error);
      if (error.message?.includes('same as the old password') || error.message?.includes('should be different from the old password')) {
        setToast({ message: 'La nueva contraseña debe ser diferente a la anterior', type: 'error' });
      } else {
        setToast({ message: error.message || 'No se pudo cambiar la contraseña', type: 'error' });
      }
      setTimeout(() => setToast(null), 3000);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Seguridad de la Cuenta</Text>
      
      {/* Email actual */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Email actual</Text>
        <Text style={styles.infoValue}>{currentEmail}</Text>
      </View>

      {/* Botón cambiar email */}
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => setShowEmailForm(!showEmailForm)}
      >
        <Text style={styles.actionButtonText}>
          {showEmailForm ? 'Cancelar cambio de email' : 'Cambiar email'}
        </Text>
      </TouchableOpacity>

      {/* Formulario de cambio de email */}
      {showEmailForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formLabel}>Nuevo email *</Text>
          <TextInput
            style={styles.input}
            placeholder="ejemplo@correo.com"
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!emailLoading}
          />
          <Text style={styles.helpText}>
            ⚠️ Se enviará un email de verificación a tu nuevo correo y se cerrarán todas tus sesiones.
          </Text>
          <TouchableOpacity
            style={[styles.submitButton, emailLoading && styles.buttonDisabled]}
            onPress={handleChangeEmail}
            disabled={emailLoading}
          >
            {emailLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Confirmar cambio de email</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Separador */}
      <View style={styles.separator} />

      {/* Botón cambiar contraseña */}
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => setShowPasswordForm(!showPasswordForm)}
      >
        <Text style={styles.actionButtonText}>
          {showPasswordForm ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
        </Text>
      </TouchableOpacity>

      {/* Formulario de cambio de contraseña */}
      {showPasswordForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formLabel}>Nueva contraseña *</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 8 caracteres"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!passwordLoading}
          />
          
          <Text style={styles.formLabel}>Confirmar nueva contraseña *</Text>
          <TextInput
            style={styles.input}
            placeholder="Repite la contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!passwordLoading}
          />
          
          <Text style={styles.helpText}>
            • Mínimo 8 caracteres{'\n'}
            • Al menos una mayúscula y una minúscula{'\n'}
            • Al menos un número{'\n'}
            ⚠️ Se cerrarán todas tus sesiones en todos los dispositivos
          </Text>
          
          <TouchableOpacity
            style={[styles.submitButton, passwordLoading && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={passwordLoading}
          >
            {passwordLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Confirmar cambio de contraseña</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
});
