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
      Alert.alert('Error', error.message);
      setLoading(false);
    } else if (data.user) {
      // Obtener información del perfil del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_professional')
        .eq('auth_uid', data.user.id)
        .single();

      if (!userError && userData) {
        if (userData.is_professional) {
          // Verificar si el trabajador completó su perfil
          const { data: professionalData, error: profError } = await supabase
            .from('professionals')
            .select('id')
            .eq('user_id', data.user.id)
            .single();

          if (profError || !professionalData) {
            // Si es trabajador pero no completó el perfil, redirigir a complete-profile
            Alert.alert(
              'Perfil Incompleto',
              'Por favor completá tu perfil profesional para continuar.',
              [{ text: 'OK', onPress: () => router.replace('auth/complete-profile' as any) }]
            );
          } else {
            // Perfil completo, ir a la app
            router.replace('/(tabs)');
          }
        } else {
          // Es cliente, ir directo a la app
          router.replace('/(tabs)');
        }
      } else {
        // Si no hay datos de usuario, ir a la app de todas formas
        router.replace('/(tabs)');
      }
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Worker</Text>
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1e3a5f',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
    color: '#1e3a5f',
    fontWeight: '600',
  },
});