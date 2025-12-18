import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { useAuth } from '../src/contexts/AuthContext';

interface PremiumBannerProps {
  variant?: 'banner' | 'card' | 'inline';
  message?: string;
  style?: ViewStyle;
}

export default function PremiumBanner({ 
  variant = 'banner', 
  message = '¡Pásate a Premium!',
  style 
}: PremiumBannerProps) {
  const router = useRouter();
  const { isPremium, isSubscriptionActive, userProfile } = useAuth();

  // Solo profesionales pueden ver CTA de suscripción
  if (!userProfile?.is_professional) {
    return null;
  }

  // No mostrar si el usuario ya es premium
  if (isPremium && isSubscriptionActive) {
    return null;
  }

  if (variant === 'banner') {
    return (
      <View style={[styles.banner, style]}>
        <View style={styles.bannerContent}>
          <View style={styles.iconWrapper}>
            <Ionicons name="star" size={24} color="#FFD700" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.bannerTitle}>{message}</Text>
            <Text style={styles.bannerSubtitle}>
              Desbloquea mensajes ilimitados y más
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bannerButton}
            onPress={() => router.push('/subscription/plan' as any)}
          >
            <Text style={styles.bannerButtonText}>Upgrade</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (variant === 'card') {
    return (
      <View style={[styles.card, style]}>
        <View style={styles.cardHeader}>
          <Ionicons name="rocket" size={40} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>Mejora tu Experiencia</Text>
        </View>
        <Text style={styles.cardDescription}>
          Con Premium obtienes acceso ilimitado a todas las funcionalidades, perfil destacado, 
          soporte prioritario y mucho más.
        </Text>
        <View style={styles.cardFeatures}>
          <View style={styles.cardFeature}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.cardFeatureText}>Mensajes ilimitados</Text>
          </View>
          <View style={styles.cardFeature}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.cardFeatureText}>Perfil destacado</Text>
          </View>
          <View style={styles.cardFeature}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.cardFeatureText}>Filtros avanzados</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.cardButton}
          onPress={() => router.push('/subscription/plan' as any)}
        >
          <Text style={styles.cardButtonText}>Ver Planes Premium</Text>
          <Ionicons name="sparkles" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  // variant === 'inline'
  return (
    <TouchableOpacity
      style={[styles.inline, style]}
      onPress={() => router.push('/subscription/plan' as any)}
    >
      <View style={styles.inlineContent}>
        <Ionicons name="diamond" size={20} color={theme.colors.primary} />
        <Text style={styles.inlineText}>Hazte Premium</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Banner styles
  banner: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  bannerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Card styles
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  cardFeatures: {
    marginBottom: 20,
    gap: 12,
  },
  cardFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardFeatureText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Inline styles
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
