# Sistema Premium - ChooseYourWorker

## 📋 Resumen

Sistema completo de suscripción premium que diferencia usuarios gratuitos de usuarios premium con las siguientes características:

### ✨ Características Premium
- 💬 **Mensajes ilimitados** (usuarios free: 10 mensajes)
- ⭐ **Perfil destacado** con borde dorado en búsquedas
- 🏆 **Insignia Premium** visible en el perfil
- 📊 **Prioridad** en resultados de búsqueda

---

## 🏗️ Arquitectura

### Frontend
- **React Native + Expo**: Cross-platform (iOS, Android, Web)
- **TypeScript**: Type safety
- **Supabase**: Auth + Database
- **WebView**: Pagos in-app en todas las plataformas

### Backend
- **Node.js**: Servidores de pago
- **MercadoPago SDK**: Pagos para LATAM
- **PayPal SDK**: Pagos internacionales
- **PostgreSQL**: Base de datos con RPC functions

---

## 💳 Sistema de Pagos

### Flujo Completo

1. **Usuario selecciona plan Premium** ($7.99 USD/mes)
2. **Elige método de pago**: MercadoPago o PayPal
3. **Modal in-app se abre** con WebView (o iframe en web)
4. **Usuario completa pago** en plataforma externa
5. **Webhook backend recibe confirmación**
6. **Backend actualiza DB** via `update_subscription` RPC
7. **Frontend detecta success URL** y cierra modal
8. **Frontend refresca perfil** con `refreshProfiles()`
9. **Usuario ve features premium** activados inmediatamente

### Archivos Clave

#### Frontend: `frontend/app/subscription/plan.tsx`
```typescript
// Estados
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

// Handlers de pago
const handlePayWithMercadoPago = async () => {
  // POST a /api/mercadopago/create-preference
  // Abre modal con initPoint
};

const handlePayWithPayPal = async () => {
  // POST a /api/paypal/create-order
  // Abre modal con approval URL
};

// WebView con detección de confirmación
<WebView
  source={{ uri: paymentUrl }}
  onNavigationStateChange={(state) => {
    if (state.url.includes('/subscription/success')) {
      closePaymentModal();
      refreshProfiles(); // Actualiza estado premium
      Alert.alert('Pago exitoso', '...');
    }
  }}
/>
```

#### Backend: `backend/server-mercadopago.js`
```javascript
// Webhook endpoint
app.post('/webhooks', async (req, res) => {
  if (req.body.type === 'payment') {
    const paymentId = req.body.data.id;
    const payment = await mercadopago.payment.get(paymentId);
    
    if (payment.status === 'approved') {
      // Actualizar suscripción en DB
      await supabase.rpc('update_subscription', {
        p_user_id: payment.metadata.user_id,
        p_subscription_type: 'premium',
        p_subscription_status: 'active',
        p_subscription_start: new Date().toISOString(),
        p_subscription_end: new Date(Date.now() + 30*24*60*60*1000).toISOString()
      });
    }
  }
});
```

#### Backend: `backend/server-paypal.js`
```javascript
// Capture order endpoint
app.post('/api/paypal/capture-order', async (req, res) => {
  const { orderID, userId } = req.body;
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  const capture = await client.execute(request);
  
  if (capture.result.status === 'COMPLETED') {
    // Actualizar suscripción
    await supabase.rpc('update_subscription', {
      p_user_id: userId,
      p_subscription_type: 'premium',
      p_subscription_status: 'active',
      p_subscription_start: new Date().toISOString(),
      p_subscription_end: new Date(Date.now() + 30*24*60*60*1000).toISOString()
    });
  }
});
```

---

## 🎨 Sistema Visual Premium

### Home Screen: Destacado de Perfiles

**Archivo**: `frontend/app/(tabs)/index.tsx`

```typescript
// Sorting: Premium primero
const sortedProfessionals = [...filteredResults].sort((a, b) => {
  // Premium users first
  if (a.user?.subscription_type === 'premium' && b.user?.subscription_type !== 'premium') return -1;
  if (a.user?.subscription_type !== 'premium' && b.user?.subscription_type === 'premium') return 1;
  return 0;
});

// Card con borde dorado
const styles = StyleSheet.create({
  premiumCard: {
    borderWidth: 2,
    borderColor: '#fbbf24', // Golden border
    backgroundColor: '#fffbf0', // Light yellow
    shadowColor: '#fbbf24',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  }
});

// Insignia Premium
{isPremium && (
  <View style={styles.premiumBadge}>
    <Text style={styles.premiumText}>⭐ PREMIUM</Text>
  </View>
)}
```

---

## 💬 Sistema de Límites de Mensajes

### Implementación en Chat

**Archivo**: `frontend/app/chat/[id].tsx`

```typescript
// Constantes
const MESSAGE_LIMIT_FREE = 10;

// Estados
const [messageCount, setMessageCount] = useState(0);
const hasReachedLimit = !isPremium && messageCount >= MESSAGE_LIMIT_FREE;

// Contar mensajes al cargar
useEffect(() => {
  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('hire_id', hireId)
      .order('created_at', { ascending: true });
    
    // Contar solo mensajes del usuario actual
    const myMessages = data.filter(msg => msg.sender_id === user?.id);
    setMessageCount(myMessages.length);
  }
  fetchMessages();
}, [hireId]);

// Verificar límite antes de enviar
const sendMessage = async () => {
  if (!isPremium && messageCount >= MESSAGE_LIMIT_FREE) {
    Alert.alert(
      'Límite alcanzado',
      'Has usado tus 10 mensajes gratuitos. Actualiza a Premium para mensajes ilimitados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ver Planes', onPress: () => router.push('/subscription/plan') }
      ]
    );
    return;
  }
  
  // Enviar mensaje...
  setMessageCount(prev => prev + 1);
};

// Warning UI
{!isPremium && (
  <View style={[
    styles.limitWarning,
    hasReachedLimit && styles.limitWarningDanger
  ]}>
    <Text style={styles.limitText}>
      {messageCount}/{MESSAGE_LIMIT_FREE} mensajes usados
    </Text>
    {hasReachedLimit && (
      <TouchableOpacity 
        style={styles.upgradeButton}
        onPress={() => router.push('/subscription/plan')}
      >
        <Text style={styles.upgradeButtonText}>Actualizar a Premium</Text>
      </TouchableOpacity>
    )}
  </View>
)}

// Input deshabilitado si se alcanzó límite
<TextInput
  editable={!hasReachedLimit}
  style={[styles.input, hasReachedLimit && styles.inputDisabled]}
  // ...
/>
```

### Estilos del Warning

```typescript
limitWarning: {
  backgroundColor: '#fff4cc', // Amarillo suave
  padding: 12,
  borderRadius: 8,
  marginBottom: 8,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
limitWarningDanger: {
  backgroundColor: '#ffe0e0', // Rojo suave
},
upgradeButton: {
  backgroundColor: '#fbbf24',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
},
inputDisabled: {
  backgroundColor: '#f5f5f5',
  opacity: 0.6,
},
```

---

## 🔐 Base de Datos

### Tabla `users` - Campos Premium

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  subscription_type VARCHAR DEFAULT 'free', -- 'free' o 'premium'
  subscription_status VARCHAR, -- 'active', 'cancelled', 'expired'
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  payment_provider VARCHAR, -- 'mercadopago' o 'paypal'
  -- ... otros campos
);
```

### RPC Function: `update_subscription`

```sql
CREATE OR REPLACE FUNCTION update_subscription(
  p_user_id UUID,
  p_subscription_type VARCHAR,
  p_subscription_status VARCHAR,
  p_subscription_start TIMESTAMPTZ,
  p_subscription_end TIMESTAMPTZ,
  p_payment_provider VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET 
    subscription_type = p_subscription_type,
    subscription_status = p_subscription_status,
    subscription_start_date = p_subscription_start,
    subscription_end_date = p_subscription_end,
    payment_provider = COALESCE(p_payment_provider, payment_provider),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚀 Deployment

### Variables de Entorno

#### Frontend: `.env`
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.3:3000
EXPO_PUBLIC_BACKEND_PAYPAL_URL=http://192.168.1.3:3001
```

#### Backend: `backend/.env`
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PORT=3000
PAYPAL_PORT=3001
```

### Iniciar Servidores Backend

```bash
# Terminal 1: MercadoPago
cd backend
node server-mercadopago.js
# Escucha en http://0.0.0.0:3000

# Terminal 2: PayPal
cd backend
node server-paypal.js
# Escucha en http://0.0.0.0:3001
```

### Iniciar Frontend

```bash
cd frontend
npx expo start

# Opciones:
# - Presiona 'w' para web
# - Presiona 'a' para Android
# - Presiona 'i' para iOS
# - Escanea QR con Expo Go
```

---

## ✅ Testing Checklist

### 1. Flujo de Pago MercadoPago

- [ ] Click en "Mercado Pago" abre modal
- [ ] Modal muestra página de MercadoPago
- [ ] Completar pago exitoso
- [ ] Webhook recibe notificación
- [ ] DB actualiza `subscription_type = 'premium'`
- [ ] Frontend cierra modal
- [ ] Alert de "Pago exitoso" aparece
- [ ] Home screen muestra borde dorado
- [ ] Chat muestra mensajes ilimitados

### 2. Flujo de Pago PayPal

- [ ] Click en "PayPal" abre modal
- [ ] Modal muestra login de PayPal
- [ ] Completar pago exitoso
- [ ] Backend captura order
- [ ] DB actualiza suscripción
- [ ] Frontend cierra modal y refresca

### 3. Límites de Mensajes (Usuario Free)

- [ ] Enviar 1-9 mensajes: warning amarillo incrementa
- [ ] Enviar mensaje #10: warning se vuelve rojo
- [ ] Intentar mensaje #11: Alert aparece
- [ ] Click "Ver Planes": redirige a `/subscription/plan`
- [ ] Input deshabilitado después de límite

### 4. Usuario Premium

- [ ] No ve warning de límite en chat
- [ ] Puede enviar mensajes ilimitados
- [ ] Perfil tiene borde dorado en home
- [ ] Aparece primero en búsquedas
- [ ] Insignia "⭐ PREMIUM" visible

### 5. Visual Premium

- [ ] Borde dorado (2px) en cards premium
- [ ] Fondo amarillo claro (#fffbf0)
- [ ] Sombra dorada más fuerte
- [ ] Insignia premium visible
- [ ] Sorting funciona (premium primero)

---

## 🐛 Troubleshooting

### Problema: "Network request failed" en pago

**Causa**: Backend no accesible desde dispositivo móvil

**Solución**:
```bash
# Verificar IP local
ifconfig | grep "inet "
# Usar esa IP en EXPO_PUBLIC_BACKEND_URL
# Ejemplo: http://192.168.1.100:3000
```

### Problema: Webhook no actualiza suscripción

**Causa**: Webhook URL no configurada en MercadoPago/PayPal

**Solución MercadoPago**:
1. Ir a https://www.mercadopago.com/developers
2. Configurar Webhook: `https://tu-dominio.com/webhooks`
3. Eventos: `payment.created`, `payment.updated`

**Solución PayPal**:
- Webhook se configura automáticamente con SDK
- Verificar logs en backend: `console.log('Capture result:', capture)`

### Problema: Modal no cierra después de pago

**Causa**: URL de success/failure no detectada

**Solución**:
```typescript
// Verificar que las páginas success/failure existan
// frontend/app/subscription/success.tsx
// frontend/app/subscription/failure.tsx

// Verificar logs del WebView
onNavigationStateChange={(state) => {
  console.log('WebView URL:', state.url); // Debug
  if (state.url.includes('success')) {
    // ...
  }
}}
```

### Problema: Usuario no ve features premium después de pagar

**Causa**: `refreshProfiles()` no se ejecuta

**Solución**:
```typescript
// Asegurar que se llama después de pago exitoso
if (state.url.includes('/subscription/success')) {
  closePaymentModal();
  await refreshProfiles(); // Agregar await
  Alert.alert('Pago exitoso', '...');
}
```

---

## 📚 Referencias

- [MercadoPago API Docs](https://www.mercadopago.com/developers)
- [PayPal SDK Node.js](https://github.com/paypal/Checkout-NodeJS-SDK)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)
- [Expo Router](https://docs.expo.dev/router/introduction/)

---

## 🎯 Resumen de Archivos Modificados

### Frontend
1. ✅ `frontend/app/subscription/plan.tsx` - Modal de pagos in-app
2. ✅ `frontend/app/(tabs)/index.tsx` - Styling premium cards
3. ✅ `frontend/app/chat/[id].tsx` - Sistema de límites de mensajes
4. ✅ `frontend/src/contexts/AuthContext.tsx` - Ya tenía `refreshProfiles()`

### Backend
1. ✅ `backend/server-mercadopago.js` - Webhook + update_subscription
2. ✅ `backend/server-paypal.js` - Capture order + update_subscription

### Base de Datos
1. ✅ Tabla `users` con campos de suscripción
2. ✅ RPC function `update_subscription`

---

## 📅 Próximos Pasos

1. **Testing Completo**: Probar flujo end-to-end con ambos proveedores
2. **Webhooks Production**: Configurar URLs de webhook en producción
3. **Analytics**: Agregar tracking de conversiones premium
4. **Emails**: Enviar confirmación de suscripción por email
5. **Renovación**: Implementar renovación automática mensual
6. **Cancelación**: Permitir cancelar suscripción desde la app

---

**Última actualización**: 2025
**Sistema**: Completamente funcional y listo para testing
