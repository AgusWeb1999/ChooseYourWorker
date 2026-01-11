import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, Dimensions } from 'react-native';
import { supabase } from '../../src/lib/supabase';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f7fa',
    minHeight: 320,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#6366f1',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e6ed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMsg: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center'
  },
});

function getOtpExpiredError() {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash;
    if (hash.includes('otp_expired')) {
      return 'El link de recuperación ya fue usado o expiró. Solicitá uno nuevo.';
    }
    // También puede venir como parámetro de búsqueda
    const params = new URLSearchParams(window.location.search);
    if (params.get('error_code') === 'otp_expired') {
      return 'El link de recuperación ya fue usado o expiró. Solicitá uno nuevo.';
    }
  }
  return '';
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);

  // Verificar sesión al cargar
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      console.log('🔄 Iniciando proceso de reset de contraseña...');
      
      // IMPORTANTE: Primero cerrar cualquier sesión existente
      // para que el token del link pueda establecer una nueva sesión
      await supabase.auth.signOut();
      console.log('🚪 Sesión anterior cerrada');
      
      // Pequeña pausa para asegurar que se limpió la sesión
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Ahora verificar si hay un token en la URL
      // Supabase automáticamente procesa el hash fragment (#access_token=...)
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Sesión después de procesar token:', session ? 'Sí (válida)' : 'No (expirada)');
      
      if (!session) {
        // Si no hay sesión después de procesar el token, el link expiró
        const otpError = getOtpExpiredError();
        if (otpError) {
          setErrorMsg(otpError);
        } else {
          setErrorMsg('El enlace de recuperación ya fue usado o expiró. Solicitá uno nuevo.');
        }
      } else {
        console.log('✅ Token válido, listo para cambiar contraseña');
      }
      setSessionChecked(true);
    } catch (err) {
      console.error('❌ Error verificando sesión:', err);
      setErrorMsg('Error al verificar tu sesión. Intenta solicitar un nuevo enlace.');
      setSessionChecked(true);
    }
  }

  // Responsive helpers
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 400;

  function validatePassword(pw: string) {
    if (pw.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (!/[A-Z]/.test(pw)) return 'Debe tener al menos una mayúscula';
    if (!/[a-z]/.test(pw)) return 'Debe tener al menos una minúscula';
    if (!/[0-9]/.test(pw)) return 'Debe tener al menos un número';
    return '';
  }

  async function handleReset() {
    setErrorMsg('');
    if (!password || !confirmPassword) {
      setErrorMsg('Completá ambos campos de contraseña');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) {
      setErrorMsg(pwError);
      return;
    }
    
    setLoading(true);
    try {
      // Verificar sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setErrorMsg('Tu sesión expiró. Solicita un nuevo enlace de recuperación.');
        setLoading(false);
        return;
      }
      
      console.log('🔐 Actualizando contraseña...');
      
      // Actualizar contraseña
      const { data, error } = await supabase.auth.updateUser({ password });
      
      setLoading(false);
      
      if (error) {
        console.error('❌ Error actualizando contraseña:', error);
        if (error.message.includes('same as the old password')) {
          setErrorMsg('La nueva contraseña debe ser diferente a la anterior.');
        } else {
          setErrorMsg('No se pudo actualizar la contraseña. Intenta de nuevo.');
        }
      } else {
        console.log('✅ Contraseña actualizada exitosamente');
        
        // Cerrar sesión después de cambiar contraseña (buena práctica)
        await supabase.auth.signOut();
        
        Alert.alert(
          '¡Contraseña actualizada!', 
          'Tu contraseña fue actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.',
          [
            { 
              text: 'Iniciar sesión', 
              onPress: () => router.replace('/auth/login') 
            }
          ]
        );
      }
    } catch (e: any) {
      console.error('❌ Error inesperado:', e);
      setLoading(false);
      setErrorMsg('Ocurrió un error inesperado. Intenta de nuevo.');
    }
  }

  // Mostrar loading mientras verifica sesión
  if (!sessionChecked) {
    return (
      <View style={[styles.container, isSmallScreen && { padding: 12 }]}>
        <Text style={[styles.subtitle, isSmallScreen && { fontSize: 14 }]}>Verificando enlace...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isSmallScreen && { padding: 12 }]}> 
      <Text style={[styles.title, isSmallScreen && { fontSize: 22 }]}>Restablecer contraseña</Text>
      <Text style={[styles.subtitle, isSmallScreen && { fontSize: 13 }]}>Ingresá tu nueva contraseña</Text>
      {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}
      <TextInput
        style={[styles.input, isSmallScreen && { maxWidth: '100%', padding: 12, fontSize: 15 }]}
        placeholder="Nueva contraseña (mín. 8 caracteres)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        textContentType="newPassword"
        returnKeyType="next"
        editable={!errorMsg && !loading}
      />
      <TextInput
        style={[styles.input, isSmallScreen && { maxWidth: '100%', padding: 12, fontSize: 15 }]}
        placeholder="Confirmar contraseña"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        autoCapitalize="none"
        textContentType="newPassword"
        returnKeyType="done"
        editable={!errorMsg && !loading}
      />
      <TouchableOpacity 
        style={[styles.button, isSmallScreen && { maxWidth: '100%', padding: 12 }, (loading || !!errorMsg) && { opacity: 0.5 }]} 
        onPress={handleReset} 
        disabled={loading || !!errorMsg} 
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, isSmallScreen && { fontSize: 16 }]}>
          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </Text>
      </TouchableOpacity>
      
      {errorMsg && (
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#64748b', marginTop: 12 }]} 
          onPress={() => router.replace('/auth/forgot-password')}
        >
          <Text style={styles.buttonText}>Solicitar nuevo enlace</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}