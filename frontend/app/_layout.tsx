import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

function RootLayoutNav() {
  const { session, loading, needsProfileCompletion, userProfile } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    console.log('🔄 Navigation effect triggered:', { loading, hasSession: !!session, hasUserProfile: !!userProfile });
    
    if (loading) {
      console.log('⏳ Still loading, skipping navigation...');
      return;
    }

    const inAuthGroup = (segments[0] as string) === 'auth';
    const inCompleteProfile = segments[1] === 'complete-profile';
    const isWorker = userProfile?.is_professional === true;

    console.log('🔄 Navigation check:', {
      hasSession: !!session,
      loading,
      segments: segments.join('/'),
      inAuthGroup,
      inCompleteProfile,
      isWorker,
      needsProfileCompletion,
      userProfile: userProfile ? { id: userProfile.id, is_professional: userProfile.is_professional } : null,
    });

    if (!session && !inAuthGroup) {
      // No session and not in auth -> go to login
      console.log('➡️ Redirecting to login (no session)');
      router.replace('/auth/login' as any);
    } else if (session && needsProfileCompletion && !inCompleteProfile) {
      // Worker needs to complete profile -> go to complete-profile
      console.log('➡️ Redirecting to complete worker profile');
      router.replace('/auth/complete-profile' as any);
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="auth/complete-profile" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}