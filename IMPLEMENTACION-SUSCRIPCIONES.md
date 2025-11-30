# 🚀 GUÍA DE IMPLEMENTACIÓN - SISTEMA DE SUSCRIPCIONES PREMIUM

## 📋 Resumen del Sistema

Se ha implementado un sistema completo de suscripciones premium con:
- ✅ Integración con Mercado Pago y PayPal
- ✅ Base de datos para tracking de suscripciones y pagos
- ✅ Backend con endpoints y webhooks
- ✅ Frontend con pantallas de pago y gestión
- ✅ Sistema de restricciones para usuarios free
- ✅ Términos y condiciones

---

## 🗄️ PASO 1: CONFIGURAR BASE DE DATOS

### Ejecutar script SQL en Supabase

1. Ve a tu proyecto en Supabase (https://app.supabase.com)
2. Navega a SQL Editor
3. Ejecuta el archivo: `backend/4-subscriptions.sql`

Este script crea:
- Campos de suscripción en tabla `users`
- Tabla `payment_transactions` para historial de pagos
- Tabla `subscription_history` para auditoría
- Tabla `subscription_plans` con precios
- Funciones para gestionar suscripciones
- Políticas RLS de seguridad
- Vistas útiles

---

## 🔧 PASO 2: CONFIGURAR BACKEND

### Instalar dependencias

```bash
cd backend
npm install
```

Esto instalará:
- express
- mercadopago
- @paypal/checkout-server-sdk
- @supabase/supabase-js
- dotenv
- cors

### Crear archivo .env

Copia `.env.example` a `.env` y completa:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Supabase
SUPABASE_URL=https://oeabhlewxekejmgrucrz.supabase.co
SUPABASE_SERVICE_KEY=tu_service_key_de_supabase

# Mercado Pago (obtener en https://www.mercadopago.com.ar/developers)
MERCADOPAGO_ACCESS_TOKEN=tu_access_token
MERCADOPAGO_PUBLIC_KEY=tu_public_key

# PayPal (obtener en https://developer.paypal.com)
PAYPAL_CLIENT_ID=tu_client_id
PAYPAL_CLIENT_SECRET=tu_client_secret
NODE_ENV=development  # cambiar a 'production' en producción

# URLs
FRONTEND_URL=http://localhost:8081
BACKEND_URL=http://localhost:3000

# Puertos
PORT=3000
PAYPAL_PORT=3001
```

### Obtener credenciales de Mercado Pago

1. Regístrate en https://www.mercadopago.com.ar/developers
2. Ve a "Tus integraciones" → "Credenciales"
3. Copia el `Access Token` y `Public Key`
4. Usa credenciales de TEST para desarrollo
5. Usa credenciales de PRODUCCIÓN cuando vayas a producción

### Obtener credenciales de PayPal

1. Regístrate en https://developer.paypal.com
2. Ve a "Dashboard" → "Apps & Credentials"
3. Crea una nueva app o usa la Sandbox
4. Copia `Client ID` y `Secret`
5. Para producción, cambia a credenciales LIVE

### Iniciar servidores

```bash
# Opción 1: Iniciar ambos servidores a la vez
npm run dev:both

# Opción 2: Iniciar servidores por separado
npm run dev              # Mercado Pago en puerto 3000
npm run dev:paypal       # PayPal en puerto 3001
```

### Configurar webhooks (IMPORTANTE para producción)

#### Mercado Pago:
1. Ve a https://www.mercadopago.com.ar/developers/panel/webhooks
2. Agrega URL: `https://tu-dominio.com/api/mercadopago/webhook`
3. Selecciona evento: `payment`

#### PayPal:
1. Ve a https://developer.paypal.com → tu app → Webhooks
2. Agrega URL: `https://tu-dominio.com/api/paypal/webhook`
3. Selecciona eventos:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`

---

## 📱 PASO 3: CONFIGURAR FRONTEND

### Agregar variable de entorno

Crea o edita `.env` en la carpeta `frontend`:

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
```

Para producción:
```env
EXPO_PUBLIC_BACKEND_URL=https://tu-backend.com
```

### Estructura de archivos creados

```
frontend/
├── app/
│   └── subscription/
│       ├── plan.tsx         # Selección de plan y pago
│       ├── manage.tsx       # Gestión de suscripción
│       ├── success.tsx      # Pantalla de pago exitoso
│       ├── failure.tsx      # Pantalla de pago fallido
│       └── terms.tsx        # Términos y condiciones
├── components/
│   ├── PremiumBanner.tsx    # Banner CTA para premium
│   └── PremiumGate.tsx      # Componente de restricción
└── src/
    └── contexts/
        └── AuthContext.tsx  # Actualizado con datos de suscripción
```

---

## 🎨 PASO 4: INTEGRAR EN TU APP

### 1. Agregar banner Premium en pantallas clave

#### En la pantalla principal (index.tsx):

```tsx
import PremiumBanner from '../../components/PremiumBanner';

export default function HomeScreen() {
  return (
    <ScrollView>
      {/* Tu contenido existente */}
      
      <PremiumBanner variant="banner" />
      
      {/* Más contenido */}
    </ScrollView>
  );
}
```

#### En pantalla de exploración (explore.tsx):

```tsx
import PremiumBanner from '../../components/PremiumBanner';

export default function ExploreScreen() {
  return (
    <View>
      {/* Tu contenido */}
      
      <PremiumBanner 
        variant="card" 
        message="¿Quieres destacar más?" 
      />
    </View>
  );
}
```

### 2. Restringir funcionalidades con PremiumGate

#### Limitar mensajes:

```tsx
import PremiumGate from '../../components/PremiumGate';
import { useAuth } from '../../src/contexts/AuthContext';

export default function MessagesScreen() {
  const { isPremium } = useAuth();
  const [messages, setMessages] = useState([]);
  
  // Limitar a 5 mensajes para usuarios free
  const displayedMessages = isPremium ? messages : messages.slice(0, 5);
  
  return (
    <View>
      {displayedMessages.map(msg => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      
      {!isPremium && messages.length > 5 && (
        <PremiumGate feature="Mensajes ilimitados">
          <View style={styles.lockedMessages}>
            <Text>+{messages.length - 5} mensajes más</Text>
          </View>
        </PremiumGate>
      )}
    </View>
  );
}
```

#### Filtros avanzados:

```tsx
import PremiumGate from '../../components/PremiumGate';
import { useAuth } from '../../src/contexts/AuthContext';

export default function SearchScreen() {
  const { isPremium } = useAuth();
  
  return (
    <View>
      {/* Filtros básicos siempre visibles */}
      <BasicFilters />
      
      {/* Filtros avanzados solo para premium */}
      {isPremium ? (
        <AdvancedFilters />
      ) : (
        <PremiumGate feature="Filtros avanzados de búsqueda">
          <AdvancedFilters />
        </PremiumGate>
      )}
    </View>
  );
}
```

### 3. Agregar acceso rápido al perfil

#### En profile.tsx:

```tsx
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { isPremium, isSubscriptionActive, userProfile } = useAuth();
  const router = useRouter();
  
  return (
    <ScrollView>
      {/* Sección de suscripción */}
      <View style={styles.subscriptionCard}>
        {isPremium && isSubscriptionActive ? (
          <>
            <Text style={styles.premiumBadge}>✨ Premium</Text>
            <Text>Suscripción activa hasta: {
              new Date(userProfile?.subscription_end_date).toLocaleDateString()
            }</Text>
            <TouchableOpacity onPress={() => router.push('/subscription/manage')}>
              <Text>Gestionar Suscripción</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text>Plan Gratuito</Text>
            <TouchableOpacity onPress={() => router.push('/subscription/plan')}>
              <Text>Hacerse Premium</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      
      {/* Resto del perfil */}
    </ScrollView>
  );
}
```

---

## ⚙️ PASO 5: CONFIGURAR CRON JOB (IMPORTANTE)

Para expirar automáticamente las suscripciones vencidas, configura un cron job que llame diariamente a:

```bash
POST https://tu-backend.com/api/subscription/expire
```

### Opciones:

#### 1. Usando cron en el servidor (Linux):

```bash
crontab -e
```

Agregar:
```
0 2 * * * curl -X POST https://tu-backend.com/api/subscription/expire
```

#### 2. Usando servicio como EasyCron o cron-job.org:

1. Registrarse en https://cron-job.org
2. Crear nuevo cron job
3. URL: `https://tu-backend.com/api/subscription/expire`
4. Frecuencia: Diaria a las 2:00 AM

#### 3. Usando Supabase Edge Functions:

Crea una función que se ejecute diariamente:

```sql
-- En Supabase SQL Editor
SELECT cron.schedule(
  'expire-subscriptions',
  '0 2 * * *', -- Diario a las 2 AM
  $$
    SELECT expire_subscriptions();
  $$
);
```

---

## 🧪 PASO 6: TESTING

### Test en modo desarrollo

1. **Iniciar backend:**
   ```bash
   cd backend
   npm run dev:both
   ```

2. **Iniciar frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Probar flujo completo:**
   - Registrarse como usuario nuevo
   - Ver pantalla de planes en `/subscription/plan`
   - Intentar pagar con Mercado Pago (usar tarjetas de test)
   - Intentar pagar con PayPal (usar cuenta sandbox)
   - Verificar que se activa la suscripción
   - Probar cancelación en `/subscription/manage`

### Tarjetas de test - Mercado Pago

```
Aprobado:
  Número: 4509 9535 6623 3704
  Código: 123
  Fecha: 11/25

Rechazado:
  Número: 4000 0000 0000 0002
  Código: 123
  Fecha: 11/25
```

### PayPal Sandbox

Crear cuentas de prueba en:
https://developer.paypal.com/dashboard/accounts

---

## 🚀 PASO 7: DEPLOY A PRODUCCIÓN

### Backend

1. **Deploy en Railway, Render o similar:**
   ```bash
   # Asegúrate de tener un Procfile o script de inicio
   # Railway y Render detectan automáticamente Node.js
   ```

2. **Configurar variables de entorno en producción:**
   - Todas las variables del `.env`
   - Cambiar `NODE_ENV` a `production`
   - Usar credenciales LIVE de Mercado Pago y PayPal
   - Actualizar URLs de frontend y backend

3. **Configurar webhooks con URL de producción**

### Frontend

1. **Actualizar `.env`:**
   ```env
   EXPO_PUBLIC_BACKEND_URL=https://tu-backend-produccion.com
   ```

2. **Build de producción:**
   ```bash
   # Para Android
   eas build --platform android --profile production
   
   # Para iOS
   eas build --platform ios --profile production
   
   # Para Web
   npm run build
   ```

---

## 📊 PASO 8: MONITOREO

### Queries útiles en Supabase

```sql
-- Ver suscripciones activas
SELECT * FROM active_premium_users;

-- Ver transacciones recientes
SELECT * FROM recent_transactions;

-- Contar usuarios premium
SELECT COUNT(*) FROM users WHERE subscription_type = 'premium' AND subscription_status = 'active';

-- Revenue mensual
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(amount) as revenue,
  COUNT(*) as transactions
FROM payment_transactions
WHERE status = 'approved'
GROUP BY month
ORDER BY month DESC;
```

---

## 🔒 SEGURIDAD

### Checklist de seguridad:

- ✅ Nunca exponer `SUPABASE_SERVICE_KEY` en el frontend
- ✅ Validar webhooks con firmas (implementar en producción)
- ✅ Usar HTTPS en producción
- ✅ Limitar rate de requests a endpoints sensibles
- ✅ Validar datos en backend antes de procesar
- ✅ Mantener logs de transacciones para auditoría

---

## 🐛 TROUBLESHOOTING

### "No se puede crear preferencia de pago"
- Verificar credenciales de Mercado Pago en `.env`
- Verificar que el backend esté corriendo
- Revisar logs del servidor

### "Webhook no se ejecuta"
- Verificar URL pública del webhook
- Revisar logs en panel de Mercado Pago/PayPal
- Probar webhook manualmente con Postman

### "Suscripción no se activa después del pago"
- Verificar que el webhook reciba la notificación
- Revisar logs del servidor
- Verificar que el `user_id` sea correcto

### "Usuario sigue teniendo acceso después de cancelar"
- Esto es correcto: mantiene acceso hasta fin de período
- Para revocar inmediatamente, actualizar manualmente en DB

---

## 📞 SOPORTE

Para dudas sobre:
- **Mercado Pago:** https://www.mercadopago.com.ar/developers/es/support
- **PayPal:** https://developer.paypal.com/support/
- **Supabase:** https://supabase.com/docs

---

## 🎯 PRÓXIMOS PASOS OPCIONALES

1. **Planes anuales** con descuento
2. **Cupones de descuento**
3. **Programa de referidos**
4. **Prueba gratis de 7 días**
5. **Estadísticas de uso para usuarios premium**
6. **Notificaciones push** para renovación de suscripción
7. **Panel de administración** para gestionar usuarios

---

## ✅ CHECKLIST FINAL

Antes de lanzar a producción:

- [ ] Base de datos configurada con script SQL
- [ ] Backend deployado con variables de entorno
- [ ] Frontend compilado con URL de backend correcta
- [ ] Webhooks configurados y funcionando
- [ ] Cron job para expirar suscripciones
- [ ] Credenciales de producción configuradas
- [ ] Términos y condiciones revisados por legal
- [ ] Testing completo del flujo de pago
- [ ] Monitoreo de transacciones configurado
- [ ] Backup de base de datos configurado

---

**¡Sistema de suscripciones listo para usar! 🎉**
