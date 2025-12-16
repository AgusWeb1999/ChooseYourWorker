import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completá todos los campos');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Mensajes de error más claros y amigables
      let errorMessage = 'Las credenciales ingresadas son incorrectas. Volvé a intentarlo o solicitá cambio de clave si la olvidaste.';
      
      // Casos específicos de error
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Las credenciales ingresadas son incorrectas. Verificá tu email y contraseña.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Debés confirmar tu email antes de iniciar sesión. Revisá tu bandeja de entrada.';
      } else if (error.message.includes('User not found')) {
        errorMessage = 'No existe una cuenta con este email. ¿Querés registrarte?';
      }
      
      Alert.alert('Error de inicio de sesión', errorMessage);
      setLoading(false);
    } else if (data.user) {
      // El AuthContext ya maneja la navegación automáticamente
      // Solo necesitamos redirigir a tabs, el _layout.tsx se encargará del resto
      console.log('✅ Login successful, redirecting to tabs...');
      router.replace('/(tabs)');
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      Alert.alert('Email requerido', 'Por favor ingresá tu email para recuperar tu contraseña');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://working-go.com/auth/reset-password',
    });

    if (error) {
      Alert.alert('Error', 'No se pudo enviar el email de recuperación. Intentá de nuevo.');
    } else {
      Alert.alert('Email enviado', 'Revisá tu bandeja de entrada para restablecer tu contraseña');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WorkingGo</Text>
      <Text style={styles.subtitle}>Iniciá sesión en tu cuenta</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.forgotPassword}
        onPress={handlePasswordReset}
      >
        <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿No tenés cuenta? </Text>
        {/* @ts-ignore */}
        <Link href="/auth/register" asChild>
          <TouchableOpacity>
            <Text style={styles.link}>Registrate</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#6366f1',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e6ed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPassword: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#6366f1',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
  },
  link: {
    color: '#6366f1',
    fontWeight: '600',
  },
});