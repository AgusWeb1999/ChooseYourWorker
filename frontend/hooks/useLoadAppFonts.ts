import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

export function useLoadAppFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Forzar ruta local en web para evitar error 404
        await Font.loadAsync({
          ...MaterialIcons.font,
          Ionicons: require('../assets/fonts/Ionicons.ttf'),
        });
      } else {
        await Font.loadAsync({
          ...MaterialIcons.font,
          ...Ionicons.font,
        });
      }
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  return fontsLoaded;
}
