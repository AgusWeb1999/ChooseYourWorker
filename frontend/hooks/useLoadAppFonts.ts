import { useEffect, useState } from 'react';
import * as Font from 'expo-font';


export function useLoadAppFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      // No se cargan más fuentes de iconos
      await Font.loadAsync({});
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  return fontsLoaded;
}
