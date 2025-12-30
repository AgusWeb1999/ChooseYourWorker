import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { theme } from '../../constants/theme';
import { supabase } from '../../src/lib/supabase'; // Importamos cliente supabase directo

// URL de tu nueva función para cancelar
const CANCEL_FUNCTION_URL = 'https://oeabhlewxekejmgrucrz.supabase.co/functions/v1/cancel-subscription';

export default function ManageSubscription() {
  const router = useRouter();
  const { userProfile, refreshProfiles, isSubscriptionActive } = useAuth();
  const [loading, setLoading] = useState(false);

  // Solo profesionales
  if (userProfile?.is_professional !== true) {
    return null; // O tu vista de error
  }

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancelar Suscripción',
      '¿Estás seguro? Perderás el acceso premium al finalizar tu periodo actual.',
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
              
              // Llamamos a la Edge Function
              const response = await fetch(CANCEL_FUNCTION_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${anonKey}`
                },
                body: JSON.stringify({ userId: userProfile?.id }),
              });

              const data = await response.json();

              if (response.ok) {
                await refreshProfiles(); // Actualizar contexto local
                Alert.alert(
                  'Suscripción Cancelada',
                  'No se te volverá a cobrar. Mantienes tus beneficios hasta la fecha de vencimiento.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } else {
                throw new Error(data.error || 'Error al cancelar');
              }
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'No se pudo cancelar la suscripción. Intenta más tarde.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.pageContent}>
      <View style={styles.contentLimiter}>
        
        {/* Header simple */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{position:'absolute', left: 16, top: 24}}>
             <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mi Suscripción</Text>
        </View>

        {/* Estado Actual */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Estado Actual</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Plan:</Text>
            <Text style={[styles.infoBadge, styles.premiumBadge]}>👑 Premium</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado:</Text>
            <Text style={[
              styles.infoBadge,
              { backgroundColor: isSubscriptionActive ? theme.colors.success : theme.colors.error }
            ]}>
              {isSubscriptionActive ? '🟢 Activa' : '🔴 Inactiva'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vence el:</Text>
            <Text style={styles.infoValue}>
              {userProfile?.subscription_end_date
                ? new Date(userProfile.subscription_end_date).toLocaleDateString('es-AR')
                : 'No disponible'}
            </Text>
          </View>
        </View>

        {/* Botón de Cancelar */}
        {isSubscriptionActive && userProfile?.subscription_status === 'active' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Zona de Peligro</Text>
            <Text style={{marginBottom: 16, color: theme.colors.textLight}}>
              Si cancelas, mantendrás tus beneficios hasta el final del ciclo, pero no se renovará.
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancelar Suscripción</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Botón de Renovar (Si está cancelada o vencida) */}
        {(!isSubscriptionActive || userProfile?.subscription_status === 'cancelled') && (
           <View style={styles.card}>
             <Text style={styles.sectionTitle}>Renovar</Text>
             <TouchableOpacity
               style={styles.renewButton}
               onPress={() => router.push('/subscription/plan' as any)}
             >
               <Text style={styles.renewButtonText}>Renovar Plan Premium</Text>
             </TouchableOpacity>
           </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  pageContent: { paddingBottom: 40 },
  contentLimiter: { width: '100%', maxWidth: 800, alignSelf: 'center' },
  header: { alignItems: 'center', padding: 24, backgroundColor: theme.colors.card, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginTop: 12 },
  card: { backgroundColor: theme.colors.card, borderRadius: 12, padding: 20, margin: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  infoLabel: { fontSize: 16, color: theme.colors.textLight },
  infoValue: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  infoBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontSize: 14, fontWeight: '600', color: '#fff' },
  premiumBadge: { backgroundColor: theme.colors.primary },
  cancelButton: { backgroundColor: theme.colors.error, padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  renewButton: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  renewButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});