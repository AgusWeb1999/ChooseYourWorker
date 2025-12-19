import { useWindowDimensions as useRNWindowDimensions } from 'react-native';

/**
 * Hook para obtener dimensiones de ventana en plataformas nativas
 * Usa el hook nativo de React Native que ya maneja los cambios automáticamente
 */
export function useWindowDimensions() {
  return useRNWindowDimensions();
}
