import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { theme } from '../../constants/theme';
import WebView from 'react-native-webview';

// --- CONFIGURACIÓN DE URLS ---
// Asegúrate de que tu proyecto ID sea correcto (oeabhlewxekejmgrucrz)
const SUPABASE_FUNCTION_URL = 'https://oeabhlewxekejmgrucrz.supabase.co/functions/v1/create-preference';

export default function SubscriptionPlan() {
  const router = useRouter();
  const { userProfile, isPremium, isSubscriptionActive, refreshProfiles } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'mercadopago' | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Cotización ARS
  const [cotizacion, setCotizacion] = useState<number | null>(null);
  const [cotizacionLoading, setCotizacionLoading] = useState(false);

  // 1. Redireccionar si no es profesional
  useEffect(() => {
    if (userProfile && userProfile.is_professional !== true) {
      router.replace('/');
    }
  }, [userProfile]);

  // 2. Obtener cotización si es Argentina
  useEffect(() => {
    const fetchCotizacion = async () => {
      if (userProfile?.country_code === 'AR') {
        setCotizacionLoading(true);
        try {
          const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
          const headers = new Headers();
          headers.append('Content-Type', 'application/json');
          if (anonKey) {
            headers.append('apikey', anonKey);
            headers.append('Authorization', `Bearer ${anonKey}`);
          }
          
          const response = await fetch('https://oeabhlewxekejmgrucrz.supabase.co/rest/v1/rpc/convert_currency', {
            method: 'POST',
            headers,
            body: JSON.stringify({ amount: 20, from_currency: 'UYU', to_currency: 'ARS' })
          });
          
          const data = await response.json();
          
          // Manejo flexible de la respuesta (número directo o objeto JSON)
          if (typeof data === 'number') {
            setCotizacion(data);
          } else if (typeof data === 'object' && data !== null && (data.result || data.output)) {
            setCotizacion(Number(data.result || data.output));
          } else {
            setCotizacion(null);
          }
        } catch (e) {
          console.error("Error fetching cotizacion:", e);
          setCotizacion(null);
        } finally {
          setCotizacionLoading(false);
        }
      } else {
        setCotizacion(null);
      }
    };
    fetchCotizacion();
  }, [userProfile?.country_code]);

  const features = [
    {emoji: '💬', text: 'Mensajes ilimitados', free: false, premium: true },
    {emoji: '🔍', text: 'Búsqueda básica', free: true, premium: true },
    {emoji: '🌟', text: 'Perfil destacado en búsquedas', free: false, premium: true },
    {emoji: '🏅', text: 'Insignia de cuenta Premium', free: false, premium: true },
  ];

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentUrl(null);
    setSelectedProvider(null);
  };

  // Variables de entorno con fallbacks
  const DEFAULT_CURRENCY = process.env.EXPO_PUBLIC_PAYMENT_CURRENCY || 'UYU';
  const DEFAULT_AMOUNT = Number(process.env.EXPO_PUBLIC_PAYMENT_AMOUNT || '20');

  const handlePayWithMercadoPago = async () => {
    try {
      setLoading(true);
      setSelectedProvider('mercadopago');

      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (!anonKey) {
        throw new Error("Falta la variable de entorno EXPO_PUBLIC_SUPABASE_ANON_KEY");
      }

      let currency = DEFAULT_CURRENCY;
      let amount = DEFAULT_AMOUNT;

      // Lógica específica para Argentina
      if (userProfile?.country_code === 'AR') {
        currency = 'ARS';
        amount = cotizacion ? Number(cotizacion) : 0;
        if (!amount || amount <= 0) {
          Alert.alert('Error', 'No se pudo obtener la cotización ARS. Intenta más tarde.');
          setLoading(false);
          return;
        }
      }

      // Llamada a tu Edge Function (create-preference)
      const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey, 
          'Authorization': `Bearer ${anonKey}` 
        },
        body: JSON.stringify({
          userId: userProfile?.id,
          currency,
          amount,
        }),
      });

      const data = await response.json();

      if (data.initPoint) {
        // --- LÓGICA DIFERENCIADA WEB VS NATIVE ---
        if (Platform.OS === 'web') {
          // En Web redirigimos para evitar problemas de iframe/CORS
          window.location.href = data.initPoint;
        } else {
          // En App Nativa abrimos WebView
          setPaymentUrl(data.initPoint);
          setShowPaymentModal(true);
        }
      } else {
        Alert.alert('Error', 'No se pudo crear la preferencia de pago');
      }
    } catch (error) {
      console.error('Error al crear preferencia de Mercado Pago:', error);
      Alert.alert('Error', 'No se pudo iniciar el pago con Mercado Pago');
    } finally {
      // Solo desactivamos loading si estamos en app nativa. 
      // En web, la página recargará al ir a MP, así que dejar el loading da mejor UX.
      if (Platform.OS !== 'web') {
        setLoading(false);
      }
    }
  };

  const handleViewTerms = (provider: 'mercadopago') => {
    router.push({
      pathname: '/subscription/terms',
      params: { provider },
    } as any);
  };

  // --- VISTA: USUARIO YA PREMIUM ---
  if (isPremium && isSubscriptionActive) {
    return (
      <View style={styles.container}>
        <View style={styles.contentLimiter}>
          <View style={styles.header}>
            <Text style={{fontSize: 64, marginBottom: 8}}>✅</Text>
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
              <Text style={styles.infoValue}>Mercado Pago</Text>
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
                <Text style={styles.featureText}>{feature.text}</Text>
                <Text style={{fontSize: 20, marginLeft: 8}}>✅</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // --- VISTA: SELECCIÓN DE PLAN ---
  return (
    <View style={styles.container}>
      <ScrollView style={styles.contentLimiter}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={{fontSize: 20}}>⬅️</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Elige tu Plan</Text>
          <Text style={styles.subtitle}>
            Desbloquea todas las funcionalidades de WorkingGo
          </Text>
          <TouchableOpacity 
            style={[styles.backButton, { left: 'auto', right: 16 }]}
            onPress={() => router.push('/' as any)}
          >
            <Text style={{fontSize: 20}}>🏠</Text>
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
                <Text style={{fontSize: 18, marginRight: 8}}>{feature.emoji}</Text>
                <Text style={[
                  styles.featureText,
                  !feature.free && styles.featureDisabled
                ]}>
                  {feature.text}
                </Text>
                {feature.free ? (
                  <Text style={{fontSize: 18, marginLeft: 8}}>✅</Text>
                ) : (
                  <Text style={{fontSize: 18, marginLeft: 8}}>❌</Text>
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
            {userProfile?.country_code === 'AR' ? (
              cotizacionLoading ? (
                <Text style={styles.planPrice}>ARS $ ...</Text>
              ) : cotizacion ? (
                <Text style={styles.planPrice}>ARS $ {cotizacion.toFixed(2)}</Text>
              ) : (
                <Text style={styles.planPrice}>ARS $ --</Text>
              )
            ) : (
              <Text style={styles.planPrice}>UYU $20</Text>
            )}
          </View>
          <Text style={styles.planPeriod}>/mes</Text>
          <Text style={styles.planDuration}>Cobro mensual recurrente</Text>

          <View style={styles.featuresList}>
            {features.filter(f => f.premium).map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={{fontSize: 18, marginRight: 8}}>{feature.emoji}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
                <Text style={{fontSize: 20, marginLeft: 8}}>✅</Text>
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
                      <Text style={styles.paymentButtonText}>💳 Mercado Pago</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleViewTerms('mercadopago')}>
                  <Text style={styles.termsLink}>Ver términos</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.securityNote}>
            <Text style={{fontSize: 20, marginRight: 8}}>🛡️</Text>
            <Text style={styles.securityText}>
              Pagos seguros. Puedes cancelar en cualquier momento.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Payment Modal (SOLO MOBILE) */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closePaymentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mercado Pago</Text>
              <TouchableOpacity onPress={closePaymentModal}>
                <Text style={{fontSize: 24, color: theme.colors.text}}>✖️</Text>
              </TouchableOpacity>
            </View>
            
            {/* Solo mostramos WebView si hay URL y NO es web (por seguridad extra) */}
            {paymentUrl && Platform.OS !== 'web' ? (
              <WebView
                source={{ uri: paymentUrl }}
                style={styles.webview}
                startInLoadingState={true}
                renderLoading={() => <ActivityIndicator style={{position:'absolute', top: '50%', left: '50%'}} />}
                onNavigationStateChange={(state) => {
                  console.log('WebView URL:', state.url);
                  
                  // Detectar ÉXITO
                  if (state.url.includes('/subscription/success') || state.url.includes('collection_status=approved')) {
                    closePaymentModal();
                    
                    // Estrategia anti-carrera (Race Condition)
                    Alert.alert(
                      '✅ Procesando pago...',
                      'Estamos confirmando tu suscripción con Mercado Pago.',
                      [{ 
                        text: 'Aceptar', 
                        onPress: async () => {
                          // 1. Refrescar ya
                          await refreshProfiles();
                          // 2. Refrescar en 4 segundos por si el webhook se demoró
                          setTimeout(() => refreshProfiles(), 4000);
                          router.replace('/(tabs)');
                        } 
                      }]
                    );
                  } 
                  // Detectar FALLO
                  else if (state.url.includes('/subscription/failure')) {
                    closePaymentModal();
                    Alert.alert(
                      'Pago cancelado',
                      'El pago no se completó o fue rechazado.',
                      [{ text: 'OK' }]
                    );
                  }
                }}
              />
            ) : (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                 <ActivityIndicator size="large" color={theme.colors.primary} />
                 <Text style={{marginTop: 10}}>Cargando pasarela de pago...</Text>
              </View>
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