import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import QuickServiceFlow from '../../components/QuickServiceFlow';

export default function WelcomeScreen() {
  const [showQuickFlow, setShowQuickFlow] = useState(false);

  if (showQuickFlow) {
    return (
      <QuickServiceFlow
        onComplete={() => {
          // Al completar el flujo sin cuenta, redirigir a registro
          router.push('/auth/register');
        }}
        onSkip={() => {
          // Si omite, llevarlo a login
          router.push('/auth/login');
        }}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.logo}>WorkingGo</Text>
        <Text style={styles.heroTitle}>Encontrá al profesional que necesitás</Text>
        <Text style={styles.heroSubtitle}>
          Miles de profesionales verificados listos para ayudarte
        </Text>
      </View>

      {/* Opción principal: Flujo sin cuenta para clientes */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setShowQuickFlow(true)}
      >
        <Text style={styles.primaryButtonIcon}>🔍</Text>
        <View style={styles.primaryButtonContent}>
          <Text style={styles.primaryButtonTitle}>Necesito un profesional</Text>
          <Text style={styles.primaryButtonSubtitle}>
            Describí tu problema y te mostramos opciones
          </Text>
        </View>
        <Text style={styles.primaryButtonArrow}>→</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Opción secundaria: Registro como profesional */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/auth/register')}
      >
        <Text style={styles.secondaryButtonIcon}>💼</Text>
        <View style={styles.secondaryButtonContent}>
          <Text style={styles.secondaryButtonTitle}>Soy profesional</Text>
          <Text style={styles.secondaryButtonSubtitle}>
            Registrate para ofrecer tus servicios
          </Text>
        </View>
        <Text style={styles.secondaryButtonArrow}>→</Text>
      </TouchableOpacity>

      {/* Login para usuarios existentes */}
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => router.push('/auth/login')}
      >
        <Text style={styles.loginButtonText}>Ya tengo cuenta - Iniciar sesión</Text>
      </TouchableOpacity>

      {/* Info adicional */}
      <View style={styles.features}>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>✅</Text>
          <Text style={styles.featureText}>Profesionales verificados</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>⭐</Text>
          <Text style={styles.featureText}>Reviews reales</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>💬</Text>
          <Text style={styles.featureText}>Chat directo</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1e3a5f',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  primaryButtonContent: {
    flex: 1,
  },
  primaryButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  primaryButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  primaryButtonArrow: {
    fontSize: 24,
    color: 'white',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#1e3a5f',
  },
  secondaryButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  secondaryButtonContent: {
    flex: 1,
  },
  secondaryButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  secondaryButtonSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  secondaryButtonArrow: {
    fontSize: 24,
    color: '#1e3a5f',
    marginLeft: 8,
  },
  loginButton: {
    padding: 16,
    marginBottom: 32,
  },
  loginButtonText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
  },
  feature: {
    alignItems: 'center',
    width: 100,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '600',
  },
});
