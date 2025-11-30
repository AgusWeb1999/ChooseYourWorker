import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export default function SubscriptionPlan() {
  const router = useRouter();
  const { userProfile, isPremium, isSubscriptionActive } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'mercadopago' | 'paypal' | null>(null);

  const features = [
    { icon: 'chatbubbles', text: 'Mensajes ilimitados', free: false, premium: true },
    { icon: 'search', text: 'Búsqueda básica', free: true, premium: true },
    { icon: 'funnel', text: 'Filtros avanzados', free: false, premium: true },
    { icon: 'star', text: 'Perfil destacado', free: false, premium: true },
    { icon: 'headset', text: 'Soporte prioritario', free: false, premium: true },
    { icon: 'analytics', text: 'Estadísticas detalladas', free: false, premium: true },
    { icon: 'shield-checkmark', text: 'Verificación premium', free: false, premium: true },
    { icon: 'notifications', text: 'Notificaciones en tiempo real', free: false, premium: true },
  ];

  const handlePayWithMercadoPago = async () => {
    try {
      setLoading(true);
      setSelectedProvider('mercadopago');

      const response = await fetch(`${BACKEND_URL}/api/mercadopago/create-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userProfile?.id,
          currency: 'ARS',
        }),
      });

      const data = await response.json();

      if (data.initPoint) {
        // Abrir Mercado Pago en el navegador
        await Linking.openURL(data.initPoint);
      } else {
        Alert.alert('Error', 'No se pudo crear la preferencia de pago');
      }
    } catch (error) {
      console.error('Error al crear preferencia de Mercado Pago:', error);
      Alert.alert('Error', 'No se pudo iniciar el pago con Mercado Pago');
    } finally {
      setLoading(false);
      setSelectedProvider(null);
    }
  };

  const handlePayWithPayPal = async () => {
    try {
      setLoading(true);
      setSelectedProvider('paypal');

      const response = await fetch(`${BACKEND_URL}/api/paypal/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userProfile?.id,
        }),
      });

      const data = await response.json();

      if (data.orderId) {
        // Crear URL de PayPal (sandbox o producción)
        const paypalUrl = process.env.NODE_ENV === 'production'
          ? `https://www.paypal.com/checkoutnow?token=${data.orderId}`
          : `https://www.sandbox.paypal.com/checkoutnow?token=${data.orderId}`;
        
        await Linking.openURL(paypalUrl);
      } else {
        Alert.alert('Error', 'No se pudo crear la orden de PayPal');
      }
    } catch (error) {
      console.error('Error al crear orden de PayPal:', error);
      Alert.alert('Error', 'No se pudo iniciar el pago con PayPal');
    } finally {
      setLoading(false);
      setSelectedProvider(null);
    }
  };

  const handleViewTerms = (provider: 'mercadopago' | 'paypal') => {
    router.push({
      pathname: '/subscription/terms',
      params: { provider },
    } as any);
  };

  if (isPremium && isSubscriptionActive) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
          <Text style={styles.title}>¡Eres Premium! 🎉</Text>
          <Text style={styles.subtitle}>
            Disfrutando de todas las funcionalidades
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tu Suscripción</Text>
          <View style={styles.subscriptionInfo}>
            <Text style={styles.infoLabel}>Estado:</Text>
            <Text style={styles.infoValue}>Activa</Text>
          </View>
          <View style={styles.subscriptionInfo}>
            <Text style={styles.infoLabel}>Renovación:</Text>
            <Text style={styles.infoValue}>
              {userProfile?.subscription_end_date
                ? new Date(userProfile.subscription_end_date).toLocaleDateString('es-AR')
                : 'No disponible'}
            </Text>
          </View>
          <View style={styles.subscriptionInfo}>
            <Text style={styles.infoLabel}>Método de pago:</Text>
            <Text style={styles.infoValue}>
              {userProfile?.payment_provider === 'mercadopago' ? 'Mercado Pago' : 'PayPal'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => router.push('/subscription/manage' as any)}
        >
          <Text style={styles.manageButtonText}>Gestionar Suscripción</Text>
        </TouchableOpacity>

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Beneficios Premium</Text>
          {features.filter(f => f.premium).map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name={feature.icon as any} size={24} color={theme.colors.primary} />
              <Text style={styles.featureText}>{feature.text}</Text>
              <Ionicons name="checkmark" size={24} color={theme.colors.success} />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Elige tu Plan</Text>
        <Text style={styles.subtitle}>
          Desbloquea todas las funcionalidades de ChooseYourWorker
        </Text>
      </View>

      {/* Plan Free */}
      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <Text style={styles.planName}>Gratis</Text>
          <Text style={styles.planPrice}>$0</Text>
        </View>
        <View style={styles.featuresList}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons 
                name={feature.icon as any} 
                size={20} 
                color={feature.free ? theme.colors.primary : theme.colors.textLight} 
              />
              <Text style={[
                styles.featureText,
                !feature.free && styles.featureDisabled
              ]}>
                {feature.text}
              </Text>
              {feature.free ? (
                <Ionicons name="checkmark" size={20} color={theme.colors.success} />
              ) : (
                <Ionicons name="close" size={20} color={theme.colors.error} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Plan Premium */}
      <View style={[styles.planCard, styles.premiumCard]}>
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>RECOMENDADO</Text>
        </View>
        <View style={styles.planHeader}>
          <Text style={styles.planName}>Premium</Text>
          <View>
            <Text style={styles.planPrice}>$4,999</Text>
            <Text style={styles.planPriceUSD}>≈ USD 9.99</Text>
          </View>
        </View>
        <Text style={styles.planDuration}>por mes</Text>
        
        <View style={styles.featuresList}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name={feature.icon as any} size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>{feature.text}</Text>
              <Ionicons name="checkmark" size={20} color={theme.colors.success} />
            </View>
          ))}
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Selecciona tu método de pago:</Text>
          
          {/* Mercado Pago */}
          <TouchableOpacity
            style={styles.paymentButton}
            onPress={handlePayWithMercadoPago}
            disabled={loading}
          >
            {loading && selectedProvider === 'mercadopago' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="card" size={24} color="#fff" />
                <Text style={styles.paymentButtonText}>Pagar con Mercado Pago</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleViewTerms('mercadopago')}>
            <Text style={styles.termsLink}>Ver términos y condiciones</Text>
          </TouchableOpacity>

          {/* PayPal */}
          <TouchableOpacity
            style={[styles.paymentButton, styles.paypalButton]}
            onPress={handlePayWithPayPal}
            disabled={loading}
          >
            {loading && selectedProvider === 'paypal' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-paypal" size={24} color="#fff" />
                <Text style={styles.paymentButtonText}>Pagar con PayPal</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleViewTerms('paypal')}>
            <Text style={styles.termsLink}>Ver términos y condiciones</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
        <Text style={styles.securityText}>
          Pagos seguros. Puedes cancelar en cualquier momento.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.card,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 20,
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  manageButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 20,
    margin: 16,
  },
  planCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginBottom: 8,
  },
  premiumCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  premiumBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  planPriceUSD: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'right',
  },
  planDuration: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 16,
  },
  featuresList: {
    marginTop: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  featureDisabled: {
    color: theme.colors.textLight,
    textDecorationLine: 'line-through',
  },
  paymentSection: {
    marginTop: 24,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  paymentButton: {
    backgroundColor: '#009EE3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  paypalButton: {
    backgroundColor: '#0070BA',
    marginTop: 16,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsLink: {
    fontSize: 12,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    margin: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textLight,
  },
});
