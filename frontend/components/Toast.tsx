import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onDismiss(message.id);
      });
    }, message.duration || 3000);

    return () => clearTimeout(timer);
  }, [message.id, message.duration, fadeAnim, onDismiss]);

  const getBackgroundColor = () => {
    switch (message.type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#64748b';
    }
  };

  const getIcon = () => {
    switch (message.type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: getBackgroundColor() }]}>
        <Text style={styles.icon}>{getIcon()}</Text>
        <Text style={styles.message}>{message.message}</Text>
      </View>
    </Animated.View>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  return (
    <View style={styles.toastContainer}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast}
          onDismiss={onDismiss}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 12,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
});
