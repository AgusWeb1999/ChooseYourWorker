# 📚 Ejemplos de Integración - Sistema de Suscripciones

Este archivo contiene ejemplos de código para integrar el sistema de suscripciones en diferentes partes de tu aplicación.

---

## 📱 Ejemplo 1: Pantalla Home con Banner Premium

```tsx
// app/(tabs)/index.tsx
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import PremiumBanner from '../../components/PremiumBanner';
import { useAuth } from '../../src/contexts/AuthContext';

export default function HomeScreen() {
  const { isPremium } = useAuth();

  return (
    <ScrollView style={styles.container}>
      {/* Contenido existente */}
      <Text style={styles.title}>Bienvenido a ChooseYourWorker</Text>
      
      {/* Banner Premium - Solo para usuarios free */}
      {!isPremium && (
        <PremiumBanner 
          variant="banner" 
          message="¡Desbloquea todo el potencial!" 
        />
      )}
      
      {/* Más contenido */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', padding: 16 },
});
```

---

## 💬 Ejemplo 2: Limitar Mensajes para Usuarios Free

```tsx
// app/(tabs)/messages.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import PremiumGate from '../../components/PremiumGate';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function MessagesScreen() {
  const { isPremium } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  
  const FREE_MESSAGE_LIMIT = 5;
  
  // Simular carga de mensajes
  useEffect(() => {
    loadMessages();
  }, []);
  
  const loadMessages = async () => {
    // Tu lógica para cargar mensajes desde Supabase
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    setMessages(data || []);
  };
  
  // Limitar mensajes para usuarios free
  const displayedMessages = isPremium 
    ? messages 
    : messages.slice(0, FREE_MESSAGE_LIMIT);
  
  const hasLockedMessages = !isPremium && messages.length > FREE_MESSAGE_LIMIT;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Mensajes</Text>
      
      {/* Indicador de plan */}
      {!isPremium && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitText}>
            📬 {displayedMessages.length} de {FREE_MESSAGE_LIMIT} mensajes gratis
          </Text>
        </View>
      )}
      
      <FlatList
        data={displayedMessages}
        renderItem={({ item }) => (
          <MessageItem message={item} />
        )}
        keyExtractor={item => item.id}
      />
      
      {/* Mensajes bloqueados para usuarios free */}
      {hasLockedMessages && (
        <PremiumGate feature="Mensajes ilimitados">
          <View style={styles.lockedMessages}>
            <Text style={styles.lockedText}>
              +{messages.length - FREE_MESSAGE_LIMIT} mensajes más
            </Text>
          </View>
        </PremiumGate>
      )}
    </View>
  );
}

const MessageItem = ({ message }) => (
  <View style={styles.messageItem}>
    <Text style={styles.messageName}>{message.sender_name}</Text>
    <Text style={styles.messageText}>{message.text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16 },
  limitBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  limitText: { fontSize: 14, color: '#856404', textAlign: 'center' },
  messageItem: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  messageName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  messageText: { fontSize: 14, color: '#666' },
  lockedMessages: {
    backgroundColor: '#f8f9fa',
    padding: 40,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    opacity: 0.5,
  },
  lockedText: { fontSize: 16, fontWeight: '600' },
});
```

---

## 🔍 Ejemplo 3: Filtros Avanzados Solo para Premium

```tsx
// app/(tabs)/explore.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import PremiumGate from '../../components/PremiumGate';
import { useAuth } from '../../src/contexts/AuthContext';

export default function SearchScreen() {
  const { isPremium } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Buscar Profesionales</Text>
      
      {/* Filtros básicos - siempre disponibles */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Filtros Básicos</Text>
        <BasicFilters />
      </View>
      
      {/* Filtros avanzados - solo premium */}
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Filtros Avanzados</Text>
        {isPremium ? (
          <AdvancedFilters />
        ) : (
          <PremiumGate feature="Filtros avanzados de búsqueda">
            <View style={styles.lockedFilters}>
              <AdvancedFilters />
            </View>
          </PremiumGate>
        )}
      </View>
      
      {/* Resultados */}
      <SearchResults />
    </ScrollView>
  );
}

const BasicFilters = () => (
  <View>
    <Text>• Ubicación</Text>
    <Text>• Categoría</Text>
    <Text>• Precio</Text>
  </View>
);

const AdvancedFilters = () => (
  <View>
    <Text>• Valoración mínima</Text>
    <Text>• Años de experiencia</Text>
    <Text>• Disponibilidad inmediata</Text>
    <Text>• Certificaciones</Text>
  </View>
);

const SearchResults = () => (
  <View style={{ padding: 16 }}>
    <Text>Resultados de búsqueda...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 16 },
  filterSection: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 12 
  },
  lockedFilters: {
    opacity: 0.3,
  },
});
```

---

## 👤 Ejemplo 4: Sección de Suscripción en Perfil

```tsx
// app/(tabs)/profile.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PremiumBanner from '../../components/PremiumBanner';

export default function ProfileScreen() {
  const { userProfile, isPremium, isSubscriptionActive } = useAuth();
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* Información del usuario */}
      <View style={styles.profileCard}>
        <Text style={styles.name}>{userProfile?.full_name}</Text>
        <Text style={styles.email}>{userProfile?.email}</Text>
      </View>
      
      {/* Sección de suscripción */}
      <View style={styles.subscriptionCard}>
        {isPremium && isSubscriptionActive ? (
          <>
            <View style={styles.premiumHeader}>
              <Ionicons name="star" size={32} color="#FFD700" />
              <Text style={styles.premiumTitle}>Premium Active</Text>
            </View>
            <Text style={styles.subscriptionInfo}>
              Renovación: {new Date(userProfile?.subscription_end_date).toLocaleDateString('es-AR')}
            </Text>
            <Text style={styles.subscriptionInfo}>
              Método: {userProfile?.payment_provider === 'mercadopago' ? 'Mercado Pago' : 'PayPal'}
            </Text>
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={() => router.push('/subscription/manage' as any)}
            >
              <Text style={styles.manageButtonText}>Gestionar Suscripción</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.freeTitle}>Plan Gratuito</Text>
            <Text style={styles.freeDescription}>
              Actualiza a Premium para desbloquear todas las funcionalidades
            </Text>
            <PremiumBanner variant="inline" />
          </>
        )}
      </View>
      
      {/* Mostrar card de upgrade si es free */}
      {!isPremium && (
        <PremiumBanner 
          variant="card" 
          message="Mejora tu experiencia"
        />
      )}
      
      {/* Resto de opciones del perfil */}
      <View style={styles.optionsCard}>
        <TouchableOpacity style={styles.option}>
          <Text>Editar Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Text>Configuración</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  profileCard: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14, color: '#666' },
  subscriptionCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 8,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  subscriptionInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  manageButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  manageButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  freeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  freeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  optionsCard: {
    backgroundColor: 'white',
    padding: 16,
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
```

---

## 🚫 Ejemplo 5: Límite de Contactos con Hook Personalizado

```tsx
// hooks/useContactLimit.ts
import { useAuth } from '../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export function useContactLimit() {
  const { isPremium } = useAuth();
  const router = useRouter();
  
  const MAX_FREE_CONTACTS = 3;
  
  const checkContactLimit = async (currentContactCount: number) => {
    if (isPremium) {
      return true; // Sin límite para premium
    }
    
    if (currentContactCount >= MAX_FREE_CONTACTS) {
      Alert.alert(
        'Límite Alcanzado',
        \`Has alcanzado el límite de \${MAX_FREE_CONTACTS} contactos para usuarios gratuitos. Actualiza a Premium para contactos ilimitados.\`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Ver Premium', 
            onPress: () => router.push('/subscription/plan' as any)
          },
        ]
      );
      return false;
    }
    
    return true;
  };
  
  return { checkContactLimit, isPremium, MAX_FREE_CONTACTS };
}

// Uso en componente:
import { useContactLimit } from '../../hooks/useContactLimit';

function ContactButton({ professionalId }) {
  const { checkContactLimit } = useContactLimit();
  
  const handleContact = async () => {
    // Obtener cantidad actual de contactos
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    const canContact = await checkContactLimit(count || 0);
    
    if (canContact) {
      // Proceder con el contacto
      await sendContactRequest(professionalId);
    }
  };
  
  return (
    <TouchableOpacity onPress={handleContact}>
      <Text>Contactar</Text>
    </TouchableOpacity>
  );
}
```

---

## 🎁 Ejemplo 6: Modal de Onboarding Premium (Primera Vez)

```tsx
// components/PremiumOnboarding.tsx
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export function PremiumOnboarding() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    checkFirstTime();
  }, []);
  
  const checkFirstTime = async () => {
    const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenPremiumOnboarding');
    if (!hasSeenOnboarding) {
      setTimeout(() => setVisible(true), 2000); // Mostrar después de 2 segundos
    }
  };
  
  const handleClose = async () => {
    await AsyncStorage.setItem('hasSeenPremiumOnboarding', 'true');
    setVisible(false);
  };
  
  const handleUpgrade = async () => {
    await handleClose();
    router.push('/subscription/plan' as any);
  };
  
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Ionicons name="rocket" size={80} color="#007AFF" />
          <Text style={styles.modalTitle}>¡Bienvenido a ChooseYourWorker!</Text>
          <Text style={styles.modalDescription}>
            Prueba Premium y desbloquea todas las funcionalidades
          </Text>
          
          <View style={styles.features}>
            <Text>✨ Mensajes ilimitados</Text>
            <Text>🎯 Perfil destacado</Text>
            <Text>🔍 Filtros avanzados</Text>
          </View>
          
          <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
            <Text style={styles.upgradeBtnText}>Ver Planes Premium</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.skipText}>Continuar con plan gratuito</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: 24,
    gap: 12,
  },
  upgradeBtn: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipText: {
    color: '#666',
    fontSize: 14,
  },
});

// Uso en _layout.tsx
import { PremiumOnboarding } from '../components/PremiumOnboarding';

export default function RootLayout() {
  return (
    <>
      <Stack>
        {/* tus rutas */}
      </Stack>
      <PremiumOnboarding />
    </>
  );
}
```

---

## 📊 Ejemplo 7: Validación de Backend para Features Premium

```typescript
// En tu backend o función de Supabase
export const checkPremiumAccess = async (userId: string, feature: string) => {
  const { data: user } = await supabase
    .from('users')
    .select('subscription_type, subscription_status, subscription_end_date')
    .eq('id', userId)
    .single();

  const isActive = 
    user.subscription_type === 'premium' &&
    user.subscription_status === 'active' &&
    new Date(user.subscription_end_date) > new Date();

  if (!isActive) {
    throw new Error(\`Premium subscription required for feature: \${feature}\`);
  }

  return true;
};

// Uso en endpoint
app.post('/api/messages/send-unlimited', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Validar acceso premium
    await checkPremiumAccess(userId, 'unlimited_messages');
    
    // Proceder con la funcionalidad
    await sendMessage(req.body);
    
    res.json({ success: true });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});
```

---

## 🎨 Ejemplo 8: Badge Premium en Perfiles

```tsx
// components/PremiumBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const PremiumBadge = ({ size = 'small' }) => {
  const isSmall = size === 'small';
  
  return (
    <View style={[styles.badge, isSmall && styles.badgeSmall]}>
      <Ionicons 
        name="star" 
        size={isSmall ? 12 : 16} 
        color="#FFD700" 
      />
      <Text style={[styles.text, isSmall && styles.textSmall]}>
        Premium
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  textSmall: {
    fontSize: 11,
  },
});

// Uso en lista de profesionales
{professional.is_premium && <PremiumBadge size="small" />}
```

---

## 💡 Tips de Implementación

1. **Siempre valida en backend**: No confíes solo en validación del frontend
2. **Usa Analytics**: Trackea cuando los usuarios ven features bloqueadas
3. **UX suave**: Muestra previews de features premium en lugar de ocultarlas completamente
4. **Feedback claro**: Explica exactamente qué obtienen al hacerse premium
5. **Testing**: Prueba el flujo completo con cuentas de test

---

Para más información, consulta:
- `IMPLEMENTACION-SUSCRIPCIONES.md` - Guía de implementación
- `MEJORES-PRACTICAS.md` - Estrategias de conversión
