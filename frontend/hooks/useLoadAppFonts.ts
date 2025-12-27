import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

export function useLoadAppFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        ...MaterialIcons.font,
        ...Ionicons.font,
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  return fontsLoaded;
}
