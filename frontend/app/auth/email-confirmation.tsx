import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { supabase } from '../../src/lib/supabase';

export default function EmailConfirmationScreen({ route }) {
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState(null);
  const email = route?.params?.email || '';

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setResent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirma tu correo electrónico</Text>
      <Text style={styles.text}>
        {email
          ? <>Te enviamos un email a <Text style={styles.email}>{email}</Text> con un enlace para activar tu cuenta.</>
          : 'Te enviamos un email de confirmación con un enlace para activar tu cuenta.'}
      </Text>
      <Text style={styles.text}>Por favor revisa tu bandeja de entrada y sigue las instrucciones.</Text>
      <Text style={styles.text}>¿No recibiste el correo?</Text>
      <TouchableOpacity style={styles.button} onPress={handleResend} disabled={loading || resent}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{resent ? 'Correo reenviado' : 'Reenviar correo'}</Text>}
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 16, textAlign: 'center' },
  text: { fontSize: 16, color: '#374151', marginBottom: 12, textAlign: 'center' },
  email: { color: '#1e3a5f', fontWeight: 'bold' },
  button: { backgroundColor: '#1e3a5f', padding: 14, borderRadius: 10, marginTop: 10, minWidth: 180, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  error: { color: '#b91c1c', marginTop: 10, textAlign: 'center' },
});
