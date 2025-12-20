import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Leer credenciales desde variables de entorno Expo (prefijo EXPO_PUBLIC_)
// Si no están disponibles (producción), usar valores por defecto
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://oeabhlewxekejmgrucrz.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tyR1xlVRs68DuqQQf_r-cw_TcW3IuZ5';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan credenciales de Supabase');
}

let storage;

if (Platform.OS === 'web') {
  // Verificar si estamos en el navegador (no en SSR)
  const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  
  storage = {
    getItem: (key) => {
      if (isBrowser) {
        return Promise.resolve(localStorage.getItem(key));
      }
      return Promise.resolve(null);
    },
    setItem: (key, value) => {
      if (isBrowser) {
        return Promise.resolve(localStorage.setItem(key, value));
      }
      return Promise.resolve();
    },
    removeItem: (key) => {
      if (isBrowser) {
        return Promise.resolve(localStorage.removeItem(key));
      }
      return Promise.resolve();
    },
  };
} else {
  storage = AsyncStorage;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});