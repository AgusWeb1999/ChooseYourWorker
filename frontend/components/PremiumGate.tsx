import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { useAuth } from '../src/contexts/AuthContext';

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  showBanner?: boolean;
}

/**
 * Componente que restringe el acceso a funcionalidades premium
 * Muestra un modal cuando un usuario free intenta acceder a una funcionalidad premium
 */
export default function PremiumGate({ children, feature, showBanner = true }: PremiumGateProps) {
  const router = useRouter();
  const { isPremium, isSubscriptionActive, userProfile } = useAuth();
  const [showModal, setShowModal] = React.useState(false);

  // Si el usuario es premium, mostrar el contenido sin restricciones
  if (isPremium && isSubscriptionActive) {
    return <>{children}</>;
  }

  // No mostrar CTA a clientes; permitir el contenido sin bloqueo
  if (!userProfile?.is_professional) {
    return <>{children}</>;
  }

  // Si no debe mostrar banner, simplemente bloquear
  if (!showBanner) {
    return null;
  }

  // Para usuarios free, interceptar la acción y mostrar modal
  const handlePress = () => {
    setShowModal(true);
  };

  return (
    <>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.lockedContainer}>
          {children}
          <View style={styles.overlay}>
            <View style={styles.lockBadge}>
              <Text style={{ fontSize: 22, color: '#fff', marginRight: 6 }}>🔒</Text>
              <Text style={styles.lockText}>Premium</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 54, color: theme.colors.primary }}>💎</Text>
            </View>

            <Text style={styles.modalTitle}>Funcionalidad Premium</Text>
            <Text style={styles.modalDescription}>
              {feature} es una funcionalidad exclusiva para usuarios Premium.
            </Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Text style={{ fontSize: 22, color: theme.colors.success, marginRight: 6 }}>✅</Text>
                <Text style={styles.benefitText}>Mensajes ilimitados</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={{ fontSize: 22, color: theme.colors.success, marginRight: 6 }}>✅</Text>
                <Text style={styles.benefitText}>Perfil destacado en búsquedas</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={{ fontSize: 22, color: theme.colors.success, marginRight: 6 }}>✅</Text>
                <Text style={styles.benefitText}>Insignia de cuenta Premium</Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Desde</Text>
              <Text style={styles.price}>Acceso Premium</Text>
            </View>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => {
                setShowModal(false);
                router.push('/subscription/plan' as any);
              }}
            >
              <Text style={{ fontSize: 22, color: '#fff', marginRight: 8 }}>🚀</Text>
              <Text style={styles.upgradeButtonText}>Hacerme Premium</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Quizás después</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  lockedContainer: {
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  lockText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  priceUSD: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    gap: 8,
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: theme.colors.textLight,
    fontSize: 14,
  },
});
