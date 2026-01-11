import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Leer credenciales desde variables de entorno Expo (prefijo EXPO_PUBLIC_)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Faltan credenciales de Supabase en .env.local - EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY son requeridas');
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
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
  },
});