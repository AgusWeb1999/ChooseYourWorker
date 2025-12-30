import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { BackHandler } from 'react-native';

export default function SubscriptionSuccess() {
  const router = useRouter();
  const { refreshProfiles } = useAuth();

  useEffect(() => {
    refreshProfiles();
    
    // Bloquear botón atrás físico
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={{fontSize: 96, marginBottom: 8}}>✅</Text>
        </View>
        
        <Text style={styles.title}>¡Pago Exitoso!</Text>
        <Text style={styles.subtitle}>
          Tu suscripción premium ha sido activada
        </Text>
        
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Ya puedes disfrutar de:</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={{fontSize: 22, marginRight: 8}}>✅</Text>
              <Text style={styles.benefitText}>Mensajes ilimitados</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={{fontSize: 22, marginRight: 8}}>✅</Text>
              <Text style={styles.benefitText}>Perfil destacado</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={{fontSize: 22, marginRight: 8}}>✅</Text>
              <Text style={styles.benefitText}>Soporte prioritario</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.buttonText}>Comenzar a Explorar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/subscription/manage' as any)}
        >
          <Text style={styles.secondaryButtonText}>Ver Mi Suscripción</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textLight,
    marginBottom: 32,
    textAlign: 'center',
  },
  benefitsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
