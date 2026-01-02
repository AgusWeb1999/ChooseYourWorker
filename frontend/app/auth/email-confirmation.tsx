import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { supabase } from '../../src/lib/supabase';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

export default function EmailConfirmationScreen() {
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useLocalSearchParams<{ email?: string }>();
  const { signOut, userProfile } = useAuth();
  
  // Get email from params or userProfile
  const email = params.email || userProfile?.email || '';

  const handleResend = async () => {
    if (!email) {
      setError('No se encontró el email. Por favor vuelve al inicio e inicia sesión nuevamente.');
      return;
    }
    
    // Ensure email is a string (not an array)
    const emailStr = Array.isArray(email) ? email[0] : email;
    
    setLoading(true);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resend({ 
        type: 'signup', 
        email: emailStr 
      });
      if (resendError) throw resendError;
      setResent(true);
    } catch (err: any) {
      setError(err.message || 'Error al reenviar el correo');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📧 Confirma tu correo electrónico</Text>
      <Text style={styles.text}>
        {email
          ? <>Te enviamos un email a <Text style={styles.email}>{email}</Text> con un enlace para activar tu cuenta.</>
          : 'Te enviamos un email de confirmación con un enlace para activar tu cuenta.'}
      </Text>
      <Text style={styles.text}>Por favor revisa tu bandeja de entrada y spam, y sigue las instrucciones.</Text>
      
      <Text style={styles.subtitle}>¿No recibiste el correo?</Text>
      <TouchableOpacity style={styles.button} onPress={handleResend} disabled={loading || resent}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{resent ? '✓ Correo reenviado' : 'Reenviar correo'}</Text>}
      </TouchableOpacity>
      
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.divider} />

      <Text style={styles.helpText}>¿Email incorrecto o quieres usar otra cuenta?</Text>
      <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToLogin}>
        <Text style={styles.secondaryButtonText}>← Volver al inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 16, textAlign: 'center' },
  text: { fontSize: 16, color: '#374151', marginBottom: 12, textAlign: 'center', lineHeight: 24 },
  email: { color: '#1e3a5f', fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 20, marginBottom: 12, textAlign: 'center', fontWeight: '600' },
  button: { backgroundColor: '#1e3a5f', padding: 14, borderRadius: 10, marginTop: 10, minWidth: 200, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  error: { color: '#b91c1c', marginTop: 10, textAlign: 'center', fontSize: 14 },
  divider: { width: '100%', height: 1, backgroundColor: '#e5e7eb', marginVertical: 30 },
  helpText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 12 },
  secondaryButton: { backgroundColor: '#f3f4f6', padding: 14, borderRadius: 10, minWidth: 200, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' },
  secondaryButtonText: { color: '#374151', fontWeight: '600', fontSize: 16 },
});
