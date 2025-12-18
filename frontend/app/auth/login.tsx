import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      const msg = 'Por favor completá tu email y contraseña';
      setErrorMsg(msg);
      Alert.alert('Campos incompletos', msg);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const msg = 'Ingresá un email válido (ej: usuario@correo.com)';
      setErrorMsg(msg);
      Alert.alert('Email inválido', msg);
      return;
    }

    if (password.length < 6) {
      const msg = 'La contraseña debe tener al menos 6 caracteres';
      setErrorMsg(msg);
      Alert.alert('Contraseña corta', msg);
      return;
    }

    if (!termsAccepted) {
      const msg = 'Debes aceptar los Términos de Servicio para continuar';
      setErrorMsg(msg);
      Alert.alert('Términos requeridos', msg);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Mensajes de error más claros y amigables
      let errorMessage = 'Usuario o contraseña incorrecto';
      let fieldErrors: { email?: string; password?: string } = {};
      
      // Casos específicos de error
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Usuario o contraseña incorrecto';
        fieldErrors = { email: '', password: '' }; // Marca ambos campos en rojo
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Debés confirmar tu email antes de iniciar sesión. Revisá tu bandeja de entrada.';
        fieldErrors = { email: 'Email no confirmado' };
      } else if (error.message.includes('User not found')) {
        errorMessage = 'Usuario no encontrado';
        fieldErrors = { email: 'Usuario no existe' };
      }

      // Mostrar inline (web) y también con Alert (nativo)
      setErrorMsg(errorMessage);
      setErrors(fieldErrors);
      Alert.alert('Error de inicio de sesión', errorMessage);
      setLoading(false);
    } else if (data.user) {
      // El AuthContext ya maneja la navegación automáticamente
      // Solo necesitamos redirigir a tabs, el _layout.tsx se encargará del resto
      console.log('✅ Login successful, redirecting to tabs...');
      setErrorMsg(null);
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
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      <Text style={styles.title}>WorkingGo</Text>
      <Text style={styles.subtitle}>Iniciá sesión en tu cuenta</Text>

      {errorMsg ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors({ ...errors, email: undefined });
          setErrorMsg(null);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        />

      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors({ ...errors, password: undefined });
          setErrorMsg(null);
        }}
        secureTextEntry
      />

      <View style={styles.termsContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View style={[styles.checkboxInner, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
        <View style={styles.termsText}>
          <Text style={styles.termsLabel}>He leído y acepto los </Text>
          {/* @ts-ignore */}
          <Link href="/auth/terms-of-service" asChild>
            <TouchableOpacity>
              <Text style={styles.termsLink}>Términos de Servicio</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
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
  inputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    marginTop: 2,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsLabel: {
    fontSize: 13,
    color: '#666',
  },
  termsLink: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
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
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
  },
});