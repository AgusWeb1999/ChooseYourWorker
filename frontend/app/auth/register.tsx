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
      Alert.alert('Error', 'Please fill in all fields and select account type');
      return;
    }

    setLoading(true);
    
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
      Alert.alert('Error', error.message);
    } else {
      // Update user record with is_professional flag
      if (data.user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_professional: userType === 'worker' })
          .eq('auth_uid', data.user.id);

        if (updateError) {
          console.log('Error updating user type:', updateError);
        }
      }

      Alert.alert(
        'Success', 
        'Account created! Please check your email to verify.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join Choose Your Worker</Text>

    <TextInput
    style={styles.input}
    placeholder="Full Name"
    placeholderTextColor="#999"
    value={fullName}
    onChangeText={setFullName}
    />


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
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
    />

      <Text style={styles.label}>I am a:</Text>
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
            🔍 Looking for workers
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
            🛠️ Offering services
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/auth/login" asChild>
          <TouchableOpacity>
            <Text style={styles.link}>Sign In</Text>
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