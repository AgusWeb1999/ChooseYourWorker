import { useState, useEffect } from 'react';

interface WindowDimensions {
  width: number;
  height: number;
}

/**
 * Hook personalizado para obtener las dimensiones de la ventana en Web
 * Se actualiza automáticamente cuando la ventana cambia de tamaño
 */
export function useWindowDimensions(): WindowDimensions {
  const [dimensions, setDimensions] = useState<WindowDimensions>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Solo ejecutar en el navegador
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Agregar listener para cambios de tamaño
    window.addEventListener('resize', handleResize);

    // Llamar inmediatamente para obtener las dimensiones actuales
    handleResize();

    // Cleanup: remover listener cuando el componente se desmonta
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return dimensions;
}
