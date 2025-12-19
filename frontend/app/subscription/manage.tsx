import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.3:3000';

export default function ManageSubscription() {
  const router = useRouter();
  const { userProfile, refreshProfiles, isSubscriptionActive } = useAuth();
  // Solo profesionales pueden gestionar suscripción
  if (userProfile?.is_professional !== true) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', left: 16 }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Gestionar Suscripción</Text>
          <TouchableOpacity onPress={() => router.push('/' as any)} style={{ position: 'absolute', right: 16 }}>
            <Ionicons name="home" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Acceso restringido</Text>
          <Text style={{ color: theme.colors.textLight }}>
            La suscripción premium es exclusiva para profesionales.
          </Text>
        </View>
      </View>
    );
  }
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const response = await fetch(
        `${BACKEND_URL}/api/subscription/transactions/${userProfile?.id}`
      );
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancelar Suscripción',
      '¿Estás seguro de que deseas cancelar tu suscripción premium? Perderás el acceso a las funcionalidades premium al finalizar el período actual.',
      [
        {
          text: 'No, mantener',
          style: 'cancel',
        },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(`${BACKEND_URL}/api/subscription/cancel`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: userProfile?.id,
                }),
              });

              if (response.ok) {
                Alert.alert(
                  'Suscripción Cancelada',
                  'Tu suscripción ha sido cancelada. Podrás seguir disfrutando de los beneficios hasta el final del período actual.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        refreshProfiles();
                        router.back();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', 'No se pudo cancelar la suscripción');
              }
            } catch (error) {
              console.error('Error al cancelar suscripción:', error);
              Alert.alert('Error', 'No se pudo cancelar la suscripción');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme.colors.success;
      case 'pending':
        return '#FFA500';
      case 'rejected':
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textLight;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazado';
      case 'cancelled':
        return 'Cancelado';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.pageContent}>
      <View style={styles.contentLimiter}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
            <Text style={styles.navButtonText}>Atrás</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => router.push('/' as any)}>
            <Ionicons name="home" size={22} color={theme.colors.text} />
            <Text style={styles.navButtonText}>Inicio</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Ionicons name="settings" size={60} color={theme.colors.primary} />
          <Text style={styles.title}>Gestionar Suscripción</Text>
        </View>

      {/* Información de la suscripción */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Estado Actual</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Plan:</Text>
          <Text style={[styles.infoBadge, styles.premiumBadge]}>Premium</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado:</Text>
          <Text style={[
            styles.infoBadge,
            { backgroundColor: isSubscriptionActive ? theme.colors.success : theme.colors.error }
          ]}>
            {isSubscriptionActive ? 'Activa' : userProfile?.subscription_status === 'cancelled' ? 'Cancelada' : 'Inactiva'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Inicio:</Text>
          <Text style={styles.infoValue}>
            {userProfile?.subscription_start_date
              ? new Date(userProfile.subscription_start_date).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : 'No disponible'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {isSubscriptionActive ? 'Renovación:' : 'Finaliza:'}
          </Text>
          <Text style={styles.infoValue}>
            {userProfile?.subscription_end_date
              ? new Date(userProfile.subscription_end_date).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : 'No disponible'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Método de pago:</Text>
          <View style={styles.paymentMethod}>
            <Ionicons 
              name={userProfile?.payment_provider === 'mercadopago' ? 'card' : 'logo-paypal'} 
              size={20} 
              color={theme.colors.text} 
            />
            <Text style={styles.infoValue}>
              {userProfile?.payment_provider === 'mercadopago' ? 'Mercado Pago' : 'PayPal'}
            </Text>
          </View>
        </View>
      </View>

      {/* Acciones */}
      {isSubscriptionActive && userProfile?.subscription_status !== 'cancelled' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSubscription}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="close-circle" size={24} color="#fff" />
                <Text style={styles.cancelButtonText}>Cancelar Suscripción</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.cancelNote}>
            Al cancelar, mantendrás el acceso premium hasta el {' '}
            {userProfile?.subscription_end_date
              ? new Date(userProfile.subscription_end_date).toLocaleDateString('es-AR')
              : ''}
          </Text>
        </View>
      )}

      {userProfile?.subscription_status === 'cancelled' && (
        <View style={styles.card}>
          <Text style={styles.warningText}>
            ⚠️ Tu suscripción ha sido cancelada. Podrás disfrutar de los beneficios premium hasta el {' '}
            {userProfile?.subscription_end_date
              ? new Date(userProfile.subscription_end_date).toLocaleDateString('es-AR')
              : ''}.
          </Text>
          
          <TouchableOpacity
            style={styles.renewButton}
            onPress={() => router.push('/subscription/plan' as any)}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.renewButtonText}>Renovar Suscripción</Text>
          </TouchableOpacity>
        </View>
      )}

        {/* Beneficios Premium (alineados con pantalla de suscripción) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tus Beneficios Premium</Text>
          <View style={styles.benefitsList}>
            {[
              'Mensajes ilimitados',
              'Perfil destacado en búsquedas',
              'Insignia de cuenta Premium',
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Navegación */}
        <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
          <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.colors.card }]} onPress={() => router.push('/' as any)}>
            <Ionicons name="home" size={20} color={theme.colors.text} />
            <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Ir al Inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  pageContent: {
    paddingBottom: 32,
  },
  contentLimiter: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.card,
    marginBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 12,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  infoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  premiumBadge: {
    backgroundColor: theme.colors.primary,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelNote: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 12,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 16,
    lineHeight: 20,
  },
  renewButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  renewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    padding: 20,
  },
  transactionItem: {
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  transactionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  transactionStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  transactionId: {
    fontSize: 11,
    color: theme.colors.textLight,
    marginLeft: 52,
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
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  supportCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 24,
    margin: 16,
    alignItems: 'center',
  },
  supportText: {
    fontSize: 16,
    color: theme.colors.text,
    marginVertical: 12,
    textAlign: 'center',
  },
  supportButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
