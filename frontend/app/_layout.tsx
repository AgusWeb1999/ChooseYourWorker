import { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ToastProvider, useToast } from '../contexts/ToastContext';
import { ToastContainer } from '../components/Toast';

function RootLayoutNav() {
  const { session, loading, needsProfileCompletion, userProfile } = useAuth();
  const { toasts, dismissToast } = useToast();
  const segments = useSegments();

  useEffect(() => {
    console.log('🔄 Navigation effect triggered:', { loading, hasSession: !!session, hasUserProfile: !!userProfile });
    
    if (loading) {
      console.log('⏳ Still loading, skipping navigation...');
      return;
    }

    const inAuthGroup = (segments[0] as string) === 'auth';
    const inCompleteProfile = segments[1] === 'complete-profile' || segments[1] === 'complete-client-profile';
    const isWorker = userProfile?.is_professional === true;
    const isClient = userProfile?.is_professional === false;

    console.log('🔄 Navigation check:', {
      hasSession: !!session,
      loading,
      segments: segments.join('/'),
      inAuthGroup,
      inCompleteProfile,
      isWorker,
      isClient,
      needsProfileCompletion,
      userProfile: userProfile ? { id: userProfile.id, is_professional: userProfile.is_professional, phone: userProfile.phone } : null,
    });

    if (!session && !inAuthGroup) {
      // No session and not in auth -> go to login
      console.log('➡️ Redirecting to login (no session)');
      router.replace('/auth/login' as any);
    } else if (session && needsProfileCompletion && !inCompleteProfile) {
      // Someone needs to complete profile
      if (isWorker) {
        console.log('➡️ Redirecting to complete worker profile');
        router.replace('/auth/complete-profile' as any);
      } else if (isClient) {
        console.log('➡️ Redirecting to complete client profile');
        router.replace('/auth/complete-client-profile' as any);
      }
    } else if (session && !needsProfileCompletion && inCompleteProfile) {
      // Profile is complete but still in complete-profile page -> go to tabs
      console.log('➡️ Redirecting to tabs (profile already complete, leaving form)');
      router.replace('/(tabs)');
    } else if (session && !needsProfileCompletion && inAuthGroup && !inCompleteProfile) {
      // Has session, profile complete and in auth -> go to tabs
      console.log('➡️ Redirecting to tabs (profile complete)');
      router.replace('/(tabs)');
    } else {
      console.log('✋ No navigation action taken');
    }
  }, [session, loading, segments, needsProfileCompletion, userProfile]);

  if (loading) {
    return null;
  }

  return (
    <View style={styles.appContainer}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/complete-profile" />
        <Stack.Screen name="auth/complete-client-profile" />
      </Stack>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RootLayoutNav />
      </ToastProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});