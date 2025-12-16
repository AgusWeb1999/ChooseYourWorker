/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Paleta de colores moderna y vivida
const tintColorLight = '#6366f1'; // Indigo vibrante
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1e293b',
    background: '#f8fafc',
    tint: tintColorLight,
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#f1f5f9',
    background: '#0f172a',
    tint: tintColorDark,
    icon: '#cbd5e1',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorDark,
  },
};

// Theme object moderno con colores más vividos
export const theme = {
  colors: {
    primary: '#6366f1', // Indigo vibrante
    primaryDark: '#4f46e5',
    primaryLight: '#818cf8',
    secondary: '#8b5cf6', // Púrpura
    accent: '#06b6d4', // Cyan
    success: '#10b981', // Verde esmeralda
    error: '#ef4444', // Rojo vibrante
    warning: '#f59e0b', // Ámbar
    info: '#3b82f6', // Azul
    text: '#1e293b',
    textLight: '#64748b',
    textMuted: '#94a3b8',
    background: '#f8fafc',
    backgroundAlt: '#f1f5f9',
    card: '#ffffff',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
  },
  gradients: {
    primary: ['#6366f1', '#8b5cf6'],
    secondary: ['#06b6d4', '#3b82f6'],
    success: ['#10b981', '#059669'],
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
