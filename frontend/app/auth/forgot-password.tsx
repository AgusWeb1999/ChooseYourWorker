import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, Dimensions } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 400;

  async function handleSend() {
    setErrorMsg('');
    if (!email) {
      setErrorMsg('Por favor ingresa tu email');
      return;
    }
    setLoading(true);
    // Usar función RPC para verificar existencia del email en auth.users
    const { data: existsData, error: existsError } = await supabase.rpc('email_exists', { email_input: email });
    if (existsError) {
      setLoading(false);
      setErrorMsg('Error al buscar el email. Intenta de nuevo.');
      return;
    }
    if (!existsData) {
      setLoading(false);
      setErrorMsg('Email no encontrado.');
      return;
    }
    // Construir redirectTo dinámicamente según entorno
    let frontendUrl = process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://working-go.com';
    // El path debe coincidir con tu ruta de reset-password
    let redirectTo = `${frontendUrl}/auth/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);
    if (error) {
      if (error.status === 429) {
        setErrorMsg('Demasiados intentos. Espera unos minutos antes de volver a intentarlo.');
      } else {
        setErrorMsg('No se pudo enviar el email. Intenta de nuevo.');
      }
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.replace('/auth/login');
      }, 2000);
    }
  }

  if (success) {
    return (
      <View style={[styles.container, isSmallScreen && { padding: 12 }] }>
        <Text style={[styles.title, isSmallScreen && { fontSize: 22 }]}>¡Email enviado!</Text>
        <Text style={[styles.subtitle, isSmallScreen && { fontSize: 14 }]}>Revisa tu bandeja de entrada para restablecer tu contraseña.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isSmallScreen && { padding: 12 }] }>
      <Text style={[styles.title, isSmallScreen && { fontSize: 22 }]}>Recuperar contraseña</Text>
      <Text style={[styles.subtitle, isSmallScreen && { fontSize: 14 }]}>Ingresa el email asociado a tu cuenta</Text>
      <TextInput
        style={[styles.input, isSmallScreen && { maxWidth: '100%', padding: 12, fontSize: 15 }]}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />
      {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}
      <TouchableOpacity
        style={[styles.button, isSmallScreen && { maxWidth: '100%', padding: 12 }]}
        onPress={handleSend}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, isSmallScreen && { fontSize: 16 }]}>{loading ? 'Enviando...' : 'Enviar email'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/auth/login')}>
        <Text style={styles.backLinkText}>Volver al login</Text>
      </TouchableOpacity>
    </View>
  );
}

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
    textAlign: 'center',
  },
  backLink: {
    marginTop: 24,
  },
  backLinkText: {
    color: '#6366f1',
    fontSize: 15,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
