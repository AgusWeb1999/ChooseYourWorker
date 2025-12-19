import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9BA1A6',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(99, 102, 241, 0.1)',
          elevation: 12,
          shadowColor: '#6366f1',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          height: Platform.OS === 'web' ? 75 : 60,
          paddingBottom: Platform.OS === 'web' ? 10 : 6,
          paddingTop: Platform.OS === 'web' ? 10 : 6,
          backdropFilter: 'blur(10px)',
        },
        tabBarLabelStyle: {
          fontSize: Platform.OS === 'web' ? 13 : 11,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 0,
          display: 'flex',
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 4,
        },
        tabBarItemStyle: {
          paddingVertical: Platform.OS === 'web' ? 6 : 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '🏠 Inicio',
          tabBarIcon: ({ color }) => <IconSymbol size={18} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '💬 Mensajes',
          tabBarIcon: ({ color }) => <IconSymbol size={18} name="bubble.left.and.bubble.right.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '👤 Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={18} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}