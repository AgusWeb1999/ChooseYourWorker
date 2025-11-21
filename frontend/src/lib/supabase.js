import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://oeabhlewxekejmgrucrz.supabase.co';
const supabaseAnonKey = 'sb_publishable_tyR1xlVRs68DuqQQf_r-cw_TcW3IuZ5';

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
    detectSessionInUrl: false,
  },
});