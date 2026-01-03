import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';

export default function EmailVerifiedScreen() {
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const { refreshProfiles } = useAuth();

  useEffect(() => {
    checkVerification();
  }, []);

  async function checkVerification() {
    try {
      // Esperar un momento para que Supabase complete la actualización
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('❌ No hay sesión activa');
        router.replace('/auth/login');
        return;
      }

      // Verificar el estado en la base de datos
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('email_verified, is_professional, phone, id_number')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error verificando perfil:', error);
        setVerifying(false);
        return;
      }

      console.log('✅ Perfil obtenido:', userProfile);

      // Si ya está verificado en la BD
      if (userProfile?.email_verified === true) {
        setVerified(true);
        setVerifying(false);

        // Actualizar datos adicionales si existen en localStorage
        const pendingData = localStorage.getItem('pending_user_data');
        if (pendingData) {
          const data = JSON.parse(pendingData);
          await supabase
            .from('users')
            .update({
              phone: data.phone,
              id_number: data.id_number,
              country: data.country,
              province: data.province,
              city: data.city,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id);
          
          localStorage.removeItem('pending_user_data');
        }

        // Refrescar perfiles
        await refreshProfiles();

        // Redirigir después de 2 segundos
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 2000);
      } else {
        // Aún no verificado en BD, esperar un poco más
        console.log('⏳ Email aún no verificado en BD, reintentando...');
        setTimeout(checkVerification, 1500);
      }
    } catch (err) {
      console.error('Error en verificación:', err);
      setVerifying(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {verifying ? (
          <>
            <ActivityIndicator size="large" color="#1e3a5f" />
            <Text style={styles.title}>Verificando tu email...</Text>
            <Text style={styles.subtitle}>Por favor espera un momento</Text>
          </>
        ) : verified ? (
          <>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.title}>¡Email Verificado!</Text>
            <Text style={styles.subtitle}>Tu cuenta ha sido activada exitosamente</Text>
            <Text style={styles.redirectText}>Redirigiendo...</Text>
          </>
        ) : (
          <>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.title}>Verificación Pendiente</Text>
            <Text style={styles.subtitle}>
              Hubo un problema al verificar tu email. Por favor intenta nuevamente.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e3a5f',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  redirectText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
