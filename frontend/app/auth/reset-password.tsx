import { useState } from 'react';
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
  // Permitir tanto access_token como token
  const access_token = params.access_token || params.token;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(getOtpExpiredError());

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
    if (!access_token) {
      setErrorMsg('Token de acceso inválido o ausente. Intenta desde el link de tu email.');
      return;
    }
    setLoading(true);
    try {
      // updateUser({ password }, { accessToken }) no es válido en supabase-js v2
      // Debe usarse solo updateUser({ password }) si el usuario está autenticado con el token
      // Pero en el flujo de reset, el usuario ya está autenticado por el link
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (error) {
        setErrorMsg('No se pudo actualizar la contraseña. Intenta de nuevo.');
      } else {
        Alert.alert('¡Listo!', 'Tu contraseña fue actualizada. Ahora puedes iniciar sesión.', [
          { text: 'OK', onPress: () => router.replace('/auth/login') }
        ]);
      }
    } catch (e) {
      setLoading(false);
      setErrorMsg('No se pudo actualizar la contraseña. Intenta de nuevo.');
    }
  }

  return (
    <View style={[styles.container, isSmallScreen && { padding: 12 }]}> 
      <Text style={[styles.title, isSmallScreen && { fontSize: 22 }]}>Restablecer contraseña</Text>
      <Text style={[styles.subtitle, isSmallScreen && { fontSize: 13 }]}>Ingresá tu nueva contraseña</Text>
      {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}
      <TextInput
        style={[styles.input, isSmallScreen && { maxWidth: '100%', padding: 12, fontSize: 15 }]}
        placeholder="Nueva contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        textContentType="newPassword"
        returnKeyType="next"
        editable={!errorMsg}
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
        editable={!errorMsg}
      />
      <TouchableOpacity style={[styles.button, isSmallScreen && { maxWidth: '100%', padding: 12 }]} onPress={handleReset} disabled={loading || !!errorMsg} activeOpacity={0.8}>
        <Text style={[styles.buttonText, isSmallScreen && { fontSize: 16 }]}>{loading ? 'Actualizando...' : 'Actualizar contraseña'}</Text>
      </TouchableOpacity>
    </View>
  );
}