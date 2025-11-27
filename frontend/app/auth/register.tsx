import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'client' | 'worker' | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password || !fullName || !userType) {
      Alert.alert('Error', 'Por favor completa todos los campos y selecciona el tipo de cuenta');
      return;
    }

    setLoading(true);
    
    console.log('🚀 Registering user:', { email, fullName, userType });
    
    // Validar que el email no exista antes de registrar
    console.log('🔍 Checking if email is available...');
    const { data: emailCheck, error: emailCheckError } = await supabase
      .rpc('check_email_available', { p_email: email });
    
    if (emailCheckError) {
      console.log('❌ Error checking email:', emailCheckError);
      Alert.alert('Error', 'No se pudo verificar el email');
      setLoading(false);
      return;
    }
    
    if (!emailCheck) {
      console.log('❌ Email already exists');
      Alert.alert('Error', 'Este email ya está registrado. Por favor usa otro email o inicia sesión.');
      setLoading(false);
      return;
    }
    
    console.log('✅ Email is available');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
        },
      },
    });

    if (error) {
      console.log('❌ Registration error:', error);
      Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }

    console.log('✅ User registered successfully:', data);

    // Update user record with is_professional flag
    if (data.user) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_professional: userType === 'worker' })
        .eq('id', data.user.id);  // Usar 'id' en lugar de 'auth_uid'

      if (updateError) {
        console.log('Error updating user type:', updateError);
      }
    }

    // Wait a bit for database to update
    console.log('⏳ Waiting for database update...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    setLoading(false);
    
    // _layout.tsx will handle automatic redirection
    // If worker without profile -> complete-profile
    // If client -> main app (tabs)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>
      <Text style={styles.subtitle}>Únete a WorkingGo</Text>

    <TextInput
    style={styles.input}
    placeholder="Nombre Completo"
    placeholderTextColor="#999"
    value={fullName}
    onChangeText={setFullName}
    />


    <TextInput
        style={styles.input}
        placeholder="Correo Electrónico"
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

      <Text style={styles.label}>Soy:</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            userType === 'client' && styles.typeButtonActive,
          ]}
          onPress={() => setUserType('client')}
        >
          <Text style={[
            styles.typeButtonText,
            userType === 'client' && styles.typeButtonTextActive,
          ]}>
            🔍 Buscando trabajadores
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            userType === 'worker' && styles.typeButtonActive,
          ]}
          onPress={() => setUserType('worker')}
        >
          <Text style={[
            styles.typeButtonText,
            userType === 'worker' && styles.typeButtonTextActive,
          ]}>
            🛠️ Ofreciendo servicios
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
        {/* @ts-ignore */}
        <Link href="/auth/login" asChild>
          <TouchableOpacity>
            <Text style={styles.link}>Iniciar Sesión</Text>
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#1e3a5f',
    backgroundColor: '#f0f4f8',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#1e3a5f',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
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