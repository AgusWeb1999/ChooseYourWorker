import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userProfile: any | null;
  professionalProfile: any | null;
  loading: boolean;
  needsProfileCompletion: boolean;
  isPremium: boolean;
  isSubscriptionActive: boolean;
  signOut: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  resetAppState: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userProfile: null,
  professionalProfile: null,
  loading: true,
  needsProfileCompletion: false,
  isPremium: false,
  isSubscriptionActive: false,
  signOut: async () => {},
  refreshProfiles: async () => {},
  resetAppState: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Limpia sesión, perfiles y datos persistentes (localStorage/AsyncStorage y flags de onboarding)
    async function resetAppState() {
      setSession(null);
      setUserProfile(null);
      setProfessionalProfile(null);
      setLoading(false);
      // Limpiar localStorage (web)
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('supabase.auth.token');
        window.localStorage.removeItem('onboardingSeen_profesional');
        window.localStorage.removeItem('onboardingSeen_cliente');
      }
      // Limpiar AsyncStorage (nativo)
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.removeItem('supabase.auth.token');
        await AsyncStorage.removeItem('onboardingSeen_profesional');
        await AsyncStorage.removeItem('onboardingSeen_cliente');
      } catch {}
    }
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [professionalProfile, setProfessionalProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId: any;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setProfessionalProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  async function fetchUserProfile(authUid: string) {
    console.log('🔍 Fetching user profile for:', authUid);
    
    // Intentar buscar por id primero (sincronizado con auth.users)
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUid)
      .single();

    // Si no funciona, intentar por auth_uid (por compatibilidad)
    if (error) {
      console.log('⚠️ No encontrado por id, intentando por auth_uid...');
      const result = await supabase
        .from('users')
        .select('*')
        .eq('auth_uid', authUid)
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (!error && data) {
      console.log('✅ User profile found:', data);
      setUserProfile(data);
      
      // If professional, check if they completed their profile
      if (data.is_professional) {
        console.log('👷 User is a worker, fetching professional profile...');
        await fetchProfessionalProfile(data.id);
      } else {
        console.log('👤 User is a client, no professional profile needed');
        setProfessionalProfile(null);
      }
    } else {
      console.log('❌ Error fetching user profile:', error);
      setUserProfile(null);
      setProfessionalProfile(null);
    }
    setLoading(false);
  }

  async function fetchProfessionalProfile(userId: string) {
    console.log('🔍 Fetching professional profile for user_id:', userId);
    
    // Primero verificar cuántos perfiles hay
    const { data: allProfiles, error: countError } = await supabase
      .from('professionals')
      .select('id, display_name')
      .eq('user_id', userId);
    
    if (countError) {
      console.error('❌ Error counting profiles:', countError);
    } else {
      console.log(`📊 Found ${allProfiles?.length || 0} professional profile(s) for user ${userId}:`, allProfiles);
    }
    
    // Ahora buscar el perfil único
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching professional profile:', error);
      setProfessionalProfile(null);
    } else if (!data) {
      console.log('⚠️ No professional profile found for user:', userId);
      setProfessionalProfile(null);
    } else {
      console.log('✅ Professional profile found:', data);
      setProfessionalProfile(data);
    }
  }

  async function refreshProfiles() {
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
    setProfessionalProfile(null);
  }

  // Solo los profesionales deben completar perfil
  const needsProfileCompletion = 
    session !== null && 
    userProfile !== null &&
    userProfile?.is_professional === true && professionalProfile === null;

  // Check if user has premium subscription
  const isPremium = userProfile?.subscription_type === 'premium';
  
  // Check if subscription is active
  const isSubscriptionActive = 
    isPremium && 
    userProfile?.subscription_status === 'active' &&
    userProfile?.subscription_end_date &&
    new Date(userProfile.subscription_end_date) > new Date();

  console.log('📊 Auth State:', {
    hasSession: !!session,
    hasUserProfile: !!userProfile,
    isWorker: userProfile?.is_professional,
    hasProfessionalProfile: !!professionalProfile,
    needsProfileCompletion,
    isPremium,
    isSubscriptionActive,
  });

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      userProfile,
      professionalProfile,
      loading,
      needsProfileCompletion,
      isPremium,
      isSubscriptionActive,
      signOut,
      refreshProfiles,
      resetAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);