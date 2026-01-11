import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';

export default function EmailVerifiedScreen() {
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [isEmailChange, setIsEmailChange] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshProfiles } = useAuth();
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log('🌐 URL completa:', window.location.href);
    console.log('🔗 Search params:', window.location.search);
    console.log('# Hash params:', window.location.hash);
    
    // Verificar si hay errores en la URL (pueden estar en hash o search)
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);
    
    const errorParam = hashParams.get('error') || searchParams.get('error');
    const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
    const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
    const message = hashParams.get('message');
    
    // Verificar si hay tokens de acceso (indica que Supabase procesó correctamente)
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const typeFromHash = hashParams.get('type');
    
    console.log('🔍 Parámetros detectados:', { 
      errorParam, 
      errorCode, 
      errorDescription,
      message,
      accessToken: accessToken ? 'presente' : 'no',
      refreshToken: refreshToken ? 'presente' : 'no',
      typeFromHash
    });
    
    // Detectar el mensaje de confirmación de email antiguo
    if (message && message.includes('confirm link sent to the other email')) {
      console.log('📧 Confirmación del email antiguo recibida');
      setVerifying(false);
      setIsEmailChange(true);
      setError(null);
      setVerified(false);
      
      // Mostrar mensaje especial (no es error, es un paso intermedio)
      // Se manejará en el render con un estado especial
      return;
    }
    
    if (errorParam) {
      setVerifying(false);
      
      // Traducir errores comunes
      if (errorCode === 'otp_expired') {
        setError('El link de verificación ha expirado. Por favor, solicita un nuevo cambio de email desde tu perfil.');
      } else if (errorParam === 'access_denied') {
        setError('El link de verificación es inválido o ha expirado. Por favor, solicita un nuevo cambio de email.');
      } else {
        setError(errorDescription || 'Hubo un problema con la verificación. Por favor, intenta nuevamente.');
      }
      
      // Redirigir al login después de 5 segundos
      setTimeout(() => {
        router.replace('/auth/login');
      }, 5000);
      
      return;
    }
    
    // Determinar el tipo de verificación:
    // - Si typeFromHash es 'recovery', es un cambio de email
    // - Si hay access_token en el hash, Supabase procesó exitosamente
    const type = searchParams.get('type') || typeFromHash;
    
    console.log('📧 Tipo de verificación detectado:', type);
    
    // Si hay tokens en el hash, es una verificación exitosa de cambio de email
    if (accessToken && (type === 'recovery' || typeFromHash === 'recovery')) {
      console.log('✅ Cambio de email detectado (recovery type), ejecutando handleEmailChangeVerification()');
      setIsEmailChange(true);
      handleEmailChangeVerification();
    } else if (type === 'email_change') {
      console.log('✅ Es un cambio de email, ejecutando handleEmailChangeVerification()');
      setIsEmailChange(true);
      handleEmailChangeVerification();
    } else {
      console.log('✅ Es una verificación de registro, ejecutando checkVerification()');
      checkVerification();
    }
  }, []);

  async function handleEmailChangeVerification() {
    try {
      console.log('📧 Iniciando verificación de cambio de email...');
      
      // Esperar un poco para que Supabase procese el token
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Obtener la sesión actual - el token en la URL debería haber creado una sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('🔍 Sesión después de verificación:', session);
      console.log('❌ Error de sesión:', sessionError);
      
      if (!session?.user) {
        console.error('❌ No se pudo obtener la sesión después de la verificación');
        setError('No se pudo completar el cambio de email. El link puede ser inválido.');
        setVerifying(false);
        
        setTimeout(() => {
          router.replace('/auth/login');
        }, 4000);
        return;
      }
      
      const newEmail = session.user.email;
      const userId = session.user.id;
      
      console.log('✅ Usuario autenticado:', { email: newEmail, userId });
      
      // Verificar que el email se actualizó en auth.users
      if (!newEmail) {
        console.error('❌ No se detectó el nuevo email');
        setError('No se pudo verificar el cambio de email.');
        setVerifying(false);
        
        setTimeout(() => {
          router.replace('/auth/login');
        }, 4000);
        return;
      }
      
      // Actualizar el email en la tabla users
      console.log('📝 Actualizando email en tabla users...');
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ 
          email: newEmail,
          updated_at: new Date().toISOString()
        })
        .eq('auth_uid', userId)
        .select();
      
      if (updateError) {
        console.error('❌ Error actualizando tabla users:', updateError);
        setError('El email se actualizó en el sistema de autenticación pero hubo un problema al sincronizar con tu perfil.');
        setVerifying(false);
        
        setTimeout(() => {
          router.replace('/auth/login');
        }, 4000);
        return;
      }
      
      console.log('✅ Email actualizado exitosamente en tabla users:', updateData);
      
      // TODO EXITOSO
      setVerified(true);
      setVerifying(false);
      
      // Cerrar la sesión actual para forzar un nuevo login
      console.log('🚪 Cerrando sesión para forzar nuevo login...');
      await supabase.auth.signOut();
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        console.log('➡️ Redirigiendo al login...');
        router.replace('/auth/login');
      }, 3000);
    } catch (err) {
      console.error('❌ Error en cambio de email:', err);
      setError('Ocurrió un error al procesar el cambio de email.');
      setVerifying(false);
      
      setTimeout(() => {
        router.replace('/auth/login');
      }, 4000);
    }
  }

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
              barrio: data.barrio,
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
        {error ? (
          <>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.title}>Error en la Verificación</Text>
            <Text style={styles.subtitle}>{error}</Text>
            <Text style={styles.redirectText}>Redirigiendo al login...</Text>
          </>
        ) : !verifying && isEmailChange && !verified ? (
          <>
            <Text style={styles.infoIcon}>📧</Text>
            <Text style={styles.title}>Confirmación Recibida</Text>
            <Text style={styles.subtitle}>
              Hemos confirmado tu solicitud de cambio de email.
            </Text>
            <Text style={styles.subtitle}>
              Por favor, revisa tu <Text style={styles.bold}>nuevo email</Text> y haz clic en el segundo link de confirmación para completar el cambio.
            </Text>
            <Text style={styles.infoText}>
              Nota: Necesitas confirmar en ambos emails (antiguo y nuevo) para completar el cambio de seguridad.
            </Text>
          </>
        ) : verifying ? (
          <>
            <ActivityIndicator size="large" color="#1e3a5f" />
            <Text style={styles.title}>
              {isEmailChange ? 'Verificando cambio de email...' : 'Verificando tu email...'}
            </Text>
            <Text style={styles.subtitle}>Por favor espera un momento</Text>
          </>
        ) : verified ? (
          <>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.title}>
              {isEmailChange ? '¡Email Actualizado Correctamente!' : '¡Email Verificado!'}
            </Text>
            <Text style={styles.subtitle}>
              {isEmailChange 
                ? 'Tu email ha sido actualizado exitosamente. Ahora puedes iniciar sesión con tu nuevo email.' 
                : 'Tu cuenta ha sido activada exitosamente'
              }
            </Text>
            <Text style={styles.redirectText}>
              {isEmailChange ? 'Redirigiendo al login...' : 'Redirigiendo...'}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.title}>Verificación Pendiente</Text>
            <Text style={styles.subtitle}>
              Hubo un problema al verificar. Por favor intenta nuevamente.
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
  infoIcon: {
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
  infoText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  bold: {
    fontWeight: '700',
    color: '#1e3a5f',
  },
});
