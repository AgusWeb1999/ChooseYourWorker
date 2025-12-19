import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import WebView from 'react-native-webview';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.3:3000';
// PayPal server may run on a different port (3001 in dev)
const PAYPAL_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_PAYPAL_URL
  || (BACKEND_URL.includes(':3000') ? BACKEND_URL.replace(':3000', ':3001') : BACKEND_URL);

export default function SubscriptionPlan() {
  const router = useRouter();
  const { userProfile, isPremium, isSubscriptionActive, refreshProfiles } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'mercadopago' | 'paypal' | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const features = [
    { icon: 'chatbubbles', text: 'Mensajes ilimitados', free: false, premium: true },
    { icon: 'search', text: 'Búsqueda básica', free: true, premium: true },
    { icon: 'star', text: 'Perfil destacado en búsquedas', free: false, premium: true },
    { icon: 'ribbon', text: 'Insignia de cuenta Premium', free: false, premium: true },
  ];

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentUrl(null);
    setSelectedProvider(null);
  };

  const isLocalUrl = (url: string) => url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1');

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
          currency: 'USD',
        }),
      });

      const data = await response.json();

      if (data.initPoint) {
        // Usar modal con WebView en todas las plataformas
        setPaymentUrl(data.initPoint);
        setShowPaymentModal(true);
      } else {
        Alert.alert('Error', 'No se pudo crear la preferencia de pago');
      }
    } catch (error) {
      console.error('Error al crear preferencia de Mercado Pago:', error);
      Alert.alert('Error', 'No se pudo iniciar el pago con Mercado Pago');
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithPayPal = async () => {
    try {
      setLoading(true);
      setSelectedProvider('paypal');

      const response = await fetch(`${PAYPAL_BACKEND_URL}/api/paypal/create-order`, {
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

        // Usar modal con WebView en todas las plataformas
        setPaymentUrl(paypalUrl);
        setShowPaymentModal(true);
      } else {
        Alert.alert('Error', 'No se pudo crear la orden de PayPal');
      }
    } catch (error) {
      console.error('Error al crear orden de PayPal:', error);
      Alert.alert('Error', 'No se pudo iniciar el pago con PayPal');
    } finally {
      setLoading(false);
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
      <View style={styles.container}>
        <View style={styles.contentLimiter}>
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
        </View>
      </View>
    );
  }

  // Solo profesionales pueden ver planes de suscripción
  if (userProfile?.is_professional !== true) {
    return (
      <View style={styles.container}>
        <View style={styles.contentLimiter}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Suscripción Premium</Text>
            <Text style={styles.subtitle}>
              Esta suscripción es exclusiva para profesionales.
            </Text>
            <TouchableOpacity 
              style={[styles.backButton, { left: 'auto', right: 16 }]}
              onPress={() => router.push('/' as any)}
            >
              <Ionicons name="home" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.contentLimiter}>
        <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Elige tu Plan</Text>
        <Text style={styles.subtitle}>
          Desbloquea todas las funcionalidades de WorkingGo
        </Text>
        <TouchableOpacity 
          style={[styles.backButton, { left: 'auto', right: 16 }]}
          onPress={() => router.push('/' as any)}
        >
          <Ionicons name="home" size={24} color={theme.colors.text} />
        </TouchableOpacity>
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
          <Text style={styles.planPrice}>USD $7.99</Text>
        </View>
        <Text style={styles.planPeriod}>/mes</Text>
        <Text style={styles.planDuration}>por mes</Text>

        <View style={styles.featuresList}>
          {features.filter(f => f.premium).map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name={feature.icon as any} size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>{feature.text}</Text>
              <Ionicons name="checkmark" size={20} color={theme.colors.success} />
            </View>
          ))}
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Selecciona tu método de pago:</Text>

          <View style={styles.paymentButtonsContainer}>
            {/* Mercado Pago */}
            <View style={styles.paymentMethodWrapper}>
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
                    <Text style={styles.paymentButtonText}>Mercado Pago</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleViewTerms('mercadopago')}>
                <Text style={styles.termsLink}>Ver términos</Text>
              </TouchableOpacity>
            </View>

            {/* PayPal */}
            <View style={styles.paymentMethodWrapper}>
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
                    <Text style={styles.paymentButtonText}>PayPal</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleViewTerms('paypal')}>
                <Text style={styles.termsLink}>Ver términos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
          <Text style={styles.securityText}>
            Pagos seguros. Puedes cancelar en cualquier momento.
          </Text>
        </View>
      </View>
    </ScrollView>

    {/* Payment Modal */}
    <Modal
      visible={showPaymentModal}
      transparent={true}
      animationType="slide"
      onRequestClose={closePaymentModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedProvider === 'mercadopago' ? 'Mercado Pago' : 'PayPal'}
            </Text>
            <TouchableOpacity onPress={closePaymentModal}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          {paymentUrl && Platform.OS === 'web' ? (
            <iframe
              src={paymentUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="Payment"
              onLoad={(e: any) => {
                const iframe = e.target;
                try {
                  const iframeUrl = iframe.contentWindow?.location.href;
                  if (iframeUrl && (iframeUrl.includes('/subscription/success') || iframeUrl.includes('/subscription/failure'))) {
                    closePaymentModal();
                    if (iframeUrl.includes('/subscription/success')) {
                      // Refrescar perfil para obtener estado premium actualizado
                      refreshProfiles();
                      Alert.alert(
                        'Pago exitoso',
                        'Tu suscripción Premium ha sido activada',
                        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
                      );
                    }
                  }
                } catch (err) {
                  // Cross-origin restriction
                }
              }}
            />
          ) : paymentUrl ? (
            <WebView
              source={{ uri: paymentUrl }}
              style={styles.webview}
              onNavigationStateChange={(state: any) => {
                console.log('WebView URL:', state.url);
                
                // Detectar páginas de confirmación
                if (state.url.includes('/subscription/success') || state.url.includes('success')) {
                  closePaymentModal();
                  // Refrescar perfil para obtener estado premium actualizado
                  refreshProfiles();
                  Alert.alert(
                    'Pago exitoso',
                    'Tu suscripción Premium ha sido activada',
                    [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
                  );
                } else if (state.url.includes('/subscription/failure') || state.url.includes('failure')) {
                  closePaymentModal();
                  Alert.alert(
                    'Pago cancelado',
                    'El pago no se completó. Intenta nuevamente.',
                    [{ text: 'OK' }]
                  );
                }
              }}
            />
          ) : (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          )}
        </View>
      </View>
    </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentLimiter: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS !== 'web' ? 60 : 24,
    backgroundColor: theme.colors.card,
    marginBottom: 16,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 24,
    padding: 8,
    zIndex: 10,
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
  planPeriod: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'right',
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
    marginBottom: 24,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  paymentButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  paymentMethodWrapper: {
    flex: 1,
    gap: 8,
  },
  paymentButton: {
    backgroundColor: '#009EE3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 56,
  },
  paypalButton: {
    backgroundColor: '#0070BA',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  termsLink: {
    fontSize: 12,
    color: theme.colors.primary,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.textLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  webview: {
    flex: 1,
  },
});