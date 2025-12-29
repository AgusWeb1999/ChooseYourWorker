import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export default function SubscriptionFailure() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={{ fontSize: 100, color: theme.colors.error, textAlign: 'center' }}>❌</Text>
        </View>
        
        <Text style={styles.title}>Pago No Completado</Text>
        <Text style={styles.subtitle}>
          No se pudo procesar tu pago. Por favor, intenta nuevamente.
        </Text>
        
        <View style={styles.reasonsCard}>
          <Text style={styles.reasonsTitle}>Posibles causas:</Text>
          <View style={styles.reasonsList}>
            <View style={styles.reasonItem}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>⚠️</Text>
              <Text style={styles.reasonText}>Fondos insuficientes</Text>
            </View>
            <View style={styles.reasonItem}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>⚠️</Text>
              <Text style={styles.reasonText}>Datos de tarjeta incorrectos</Text>
            </View>
            <View style={styles.reasonItem}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>⚠️</Text>
              <Text style={styles.reasonText}>Límite de compras excedido</Text>
            </View>
            <View style={styles.reasonItem}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>⚠️</Text>
              <Text style={styles.reasonText}>Problemas de conexión</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/subscription/plan' as any)}
        >
          <Text style={styles.buttonText}>Intentar Nuevamente</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.secondaryButtonText}>Volver al Inicio</Text>
        </TouchableOpacity>

        <View style={styles.supportCard}>
          <Text style={{ fontSize: 32, color: theme.colors.primary }}>❓</Text>
          <Text style={styles.supportText}>
            ¿Necesitas ayuda?
          </Text>
          <Text style={styles.supportEmail}>
            soporte@workinggo.com
          </Text>
        </View>
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
    lineHeight: 26,
  },
  reasonsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 32,
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  reasonsList: {
    gap: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reasonText: {
    fontSize: 14,
    color: theme.colors.textLight,
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
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  supportCard: {
    alignItems: 'center',
    padding: 16,
  },
  supportText: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 8,
  },
  supportEmail: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
});
