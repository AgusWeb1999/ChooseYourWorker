import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
// IconSymbol eliminado, se usan emojis manuales
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();

  // Ocultar labels en iOS y Android, solo mostrar en web desktop
  const showLabels = Platform.OS === 'web' && width >= 768;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          height: Platform.OS === 'web' ? 50 : 45,
          paddingBottom: Platform.OS === 'web' ? 2 : 1,
          paddingTop: Platform.OS === 'web' ? 2 : 1,
        },
        tabBarLabelStyle: {
          fontSize: Platform.OS === 'web' ? 13 : 11,
          fontWeight: '600',
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginBottom: showLabels ? 0 : 4,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarShowLabel: showLabels,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: () => <Text style={{fontSize: 20, marginBottom: 0}}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mensajes',
          tabBarIcon: () => <Text style={{fontSize: 20, marginBottom: 0}}>💬</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: () => <Text style={{fontSize: 20, marginBottom: 0}}>👤</Text>,
        }}
      />
    </Tabs>
  );
}