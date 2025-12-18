# 💳 Diagrama del Sistema de Pagos

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO (App Expo)                       │
│                                                                 │
│  Profile → "Plan Premium" → Elige Mercado Pago / PayPal       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          ↓                                 ↓
    ┌──────────────┐            ┌──────────────────┐
    │ Mercado Pago │            │     PayPal       │
    │  (Port 3000) │            │   (Port 3001)    │
    └──────┬───────┘            └────────┬─────────┘
           │                             │
           ├─────────────────┬───────────┘
           │                 │
           ↓                 ↓
    ┌──────────────────────────────────┐
    │    SUPABASE (Base de Datos)      │
    │                                  │
    │  • users (subscription_type)     │
    │  • payment_transactions          │
    │  • subscription_history          │
    └──────────────────────────────────┘
```

---

## 🔄 Flujo de Pago - Mercado Pago

```
┌─────────────────────────────────────────────────────────────────────┐
│ PASO 1: Usuario en App                                              │
│                                                                     │
│ Frontend (Expo)                          Backend (Node.js)          │
│ ┌──────────────────────┐                 ┌──────────────────┐      │
│ │ Plan Premium Screen  │                 │                  │      │
│ │ ┌────────────────┐   │                 │ server-mercado   │      │
│ │ │ "Pagar Ahora"  │─────────POST───────→│ pago.js:3000     │      │
│ │ └────────────────┘   │   /create-      │                  │      │
│ │                      │   preference    │                  │      │
│ └──────────────────────┘                 └──────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                                                   │
                                                   ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PASO 2: Backend crea Preferencia                                    │
│                                                                     │
│ 1. Verifica usuario en Supabase                                    │
│ 2. Crea items de pago:                                             │
│    - Título: "Suscripción Premium"                                 │
│    - Precio: $4999 ARS (o $9.99 USD)                              │
│    - Cantidad: 1                                                   │
│ 3. Envía a MercadoPago API                                         │
│ 4. Recibe: preference.id + init_point (URL de checkout)           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PASO 3: Frontend abre URL de Mercado Pago                           │
│                                                                     │
│ Browser → Linking.openURL(init_point)                             │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────┐        │
│ │ https://www.mercadopago.com.ar/checkout/...           │        │
│ │                                                         │        │
│ │ Usuario ve:                                             │        │
│ │ ✓ Resumen de compra                                    │        │
│ │ ✓ Campo de tarjeta                                     │        │
│ │ ✓ Botón "Pagar"                                        │        │
│ └─────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
                      │
                      │ Usuario completa pago
                      ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PASO 4: Mercado Pago procesa pago                                   │
│                                                                     │
│ ✓ Valida tarjeta                                                   │
│ ✓ Procesa transacción                                              │
│ ✓ Status: approved / rejected / pending                            │
└─────────────────────────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    ✓ APPROVED  ✗ REJECTED  ⏳ PENDING
        │             │             │
        ↓             ↓             ↓
┌────────────┐  ┌─────────┐  ┌──────────┐
│ /success   │  │ /failure│  │ /pending │
└────────────┘  └─────────┘  └──────────┘
        │             │             │
        └─────────────┼─────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PASO 5: Webhook - Mercado Pago notifica al Backend                  │
│                                                                     │
│ POST /api/mercadopago/webhook                                      │
│ {                                                                   │
│   "type": "payment",                                                │
│   "data": {                                                         │
│     "id": "paymentId",                                              │
│     "status": "approved",                                           │
│     "transaction_amount": 4999,                                     │
│     "external_reference": "userId"                                  │
│   }                                                                 │
│ }                                                                   │
│                                                                     │
│ Backend recibe webhook:                                             │
│ 1. ✓ Extrae paymentId                                              │
│ 2. ✓ Extrae userId (external_reference)                            │
│ 3. ✓ Verifica status = approved                                    │
│ 4. ✓ Registra en payment_transactions                              │
│ 5. ✓ Llama RPC: update_subscription(userId, 'premium', 'active')  │
│ 6. ✓ Retorna OK (200)                                              │
└─────────────────────────────────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PASO 6: Supabase actualiza usuarios                                 │
│                                                                     │
│ UPDATE users SET                                                    │
│   subscription_type = 'premium',                                    │
│   subscription_status = 'active',                                   │
│   subscription_start_date = NOW(),                                  │
│   subscription_end_date = NOW() + 1 month,                         │
│   payment_provider = 'mercadopago',                                │
│   subscription_id = 'paymentId'                                     │
│ WHERE id = userId;                                                  │
│                                                                     │
│ INSERT subscription_history:                                        │
│   action = 'activated'                                              │
└─────────────────────────────────────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────────────┐
│ PASO 7: Frontend detecta cambio                                     │
│                                                                     │
│ AuthContext se actualiza:                                           │
│ ✓ isPremium = true                                                 │
│ ✓ isSubscriptionActive = true                                      │
│                                                                     │
│ UI muestra:                                                         │
│ ✓ Toast: "¡Suscripción activada exitosamente!"                   │
│ ✓ Pantalla Premium (con todos los beneficios)                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Pago - PayPal (Similar)

```
App (Expo)
    ↓
POST /api/paypal/create-order
    ↓
Backend crea orden en PayPal
    ↓
Linking.openURL(paypal.com/checkout)
    ↓
Usuario paga en PayPal Sandbox
    ↓
Webhook /api/paypal/webhook
    ↓
Backend actualiza Supabase
    ↓
Frontend muestra éxito
```

---

## 📊 Base de Datos - Esquema

### Tabla: users (modificada)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR,
  full_name VARCHAR,
  ...
  -- Campos de suscripción
  subscription_type TEXT DEFAULT 'free',  -- 'free' o 'premium'
  subscription_status TEXT DEFAULT 'inactive',  -- 'active' o 'inactive'
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  payment_provider TEXT,  -- 'mercadopago' o 'paypal'
  subscription_id TEXT    -- ID de pago del proveedor
);
```

### Tabla: payment_transactions (nueva)

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2),           -- 4999.00 o 9.99
  currency TEXT,                  -- 'ARS' o 'USD'
  payment_provider TEXT,          -- 'mercadopago' o 'paypal'
  transaction_id TEXT,            -- ID único del proveedor
  subscription_id TEXT,           -- Suscripción ID
  status TEXT,                    -- 'approved', 'rejected', 'pending'
  metadata JSONB,                 -- Datos completos del proveedor
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Tabla: subscription_history (nueva)

```sql
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  subscription_type TEXT,        -- 'free' o 'premium'
  action TEXT,                   -- 'activated', 'renewed', 'cancelled', 'expired'
  payment_provider TEXT,         -- Quién pagó
  transaction_id UUID,           -- Link a payment_transactions
  created_at TIMESTAMPTZ
);
```

---

## 🔗 Endpoints del Backend

### Mercado Pago (Puerto 3000)

```
POST /api/mercadopago/create-preference
├─ Input: { userId, currency }
├─ Output: { preferenceId, initPoint }
└─ Uso: Crear URL de checkout

POST /api/mercadopago/webhook
├─ Input: { type, data }
├─ Acción: Procesa pago y activa suscripción
└─ Output: OK (200)

GET /api/mercadopago/payment/:paymentId
├─ Input: paymentId
├─ Output: { status, statusDetail, transactionAmount }
└─ Uso: Verificar estado de pago
```

### Paypal (Puerto 3001)

```
POST /api/paypal/create-order
├─ Input: { userId }
├─ Output: { orderId }
└─ Uso: Crear orden de PayPal

POST /api/paypal/webhook
├─ Input: { event_type, resource }
├─ Acción: Procesa pago y activa suscripción
└─ Output: OK (200)

GET /api/paypal/verify/:orderId
├─ Input: orderId
├─ Output: { status, paymentId }
└─ Uso: Verificar orden
```

### Suscripciones (Ambos puertos)

```
GET /api/subscription/status/:userId
├─ Output: { subscription_type, subscription_status, isActive }
└─ Uso: Ver si es premium y cuándo vence

GET /api/subscription/transactions/:userId
├─ Output: Array de transacciones
└─ Uso: Historial de pagos

POST /api/subscription/cancel
├─ Input: { userId }
├─ Acción: Cancela suscripción
└─ Output: { message }

POST /api/subscription/expire
├─ Acción: Expira suscripciones vencidas (cron job diario)
└─ Output: { affectedCount }
```

---

## 🧬 Variables de Entorno Necesarias

### Backend (.env)

```bash
# APIs Externas
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx
MERCADOPAGO_PUBLIC_KEY=pk_test_xxx
PAYPAL_CLIENT_ID=AYxxx
PAYPAL_CLIENT_SECRET=EMxxx

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Configuración
NODE_ENV=development
FRONTEND_URL=http://localhost:8081
BACKEND_URL=http://localhost:3000
PORT=3000
PAYPAL_PORT=3001
```

### Frontend (.env.local)

```bash
# APIs Externas (PUBLIC = visible en cliente)
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=pk_test_xxx
EXPO_PUBLIC_PAYPAL_CLIENT_ID=AYxxx

# Supabase (PUBLIC)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URLs (PUBLIC)
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_ENV=development
```

---

## 🧪 Secuencia de Prueba

```
1. Iniciar Servidores
   ├─ npm start (backend, port 3000)
   ├─ npm run paypal (backend, port 3001)
   └─ npm start (frontend)

2. Abrir App
   ├─ Login
   └─ Ve a Profile tab

3. Ir a Plan Premium
   ├─ Elige Mercado Pago
   └─ Se abre checkout

4. Usar Tarjeta de Prueba
   ├─ 4509 9535 6623 3704
   ├─ 11/25
   ├─ 123
   └─ Presiona Pagar

5. Verificar en Backend
   ├─ Ver logs de webhook
   └─ Debe decir "Suscripción activada"

6. Verificar en Supabase
   ├─ SELECT * FROM payment_transactions;
   ├─ SELECT subscription_type FROM users WHERE id = 'tuUserId';
   └─ Debe mostrar 'premium'
```

---

## 📋 Funciones RPC (Supabase)

### update_subscription(userId, type, status, provider, id, months)

```sql
Actualiza la suscripción de un usuario.

Parámetros:
  p_user_id: ID del usuario
  p_subscription_type: 'free' o 'premium'
  p_subscription_status: 'active' o 'inactive'
  p_payment_provider: 'mercadopago' o 'paypal'
  p_subscription_id: ID de pago del proveedor
  p_months: Duración en meses

Acciones:
  1. UPDATE users (set subscription fields)
  2. INSERT subscription_history
```

### cancel_subscription(userId)

```sql
Cancela la suscripción de un usuario.

Acciones:
  1. UPDATE users (set status = 'cancelled')
  2. INSERT subscription_history (action = 'cancelled')
```

### expire_subscriptions()

```sql
Expira automáticamente suscripciones vencidas.

Debe ejecutarse diariamente (cron job).

Acciones:
  1. UPDATE users (subscription_end_date < NOW())
  2. INSERT subscription_history (action = 'expired')

Returns: Número de suscripciones expiradas
```

### is_subscription_active(userId)

```sql
Verifica si un usuario tiene suscripción premium activa.

Returns: true/false
```

---

## 🎯 Flujo Completo (Resumen)

```
Usuario abre app
    ↓
Va a Profile → Plan Premium
    ↓
Elige método de pago (MP o PP)
    ↓
Frontend envía POST a backend
    ↓
Backend crea preferencia/orden
    ↓
Frontend abre URL de pago
    ↓
Usuario completa pago en MP/PP
    ↓
MP/PP envía webhook a backend
    ↓
Backend procesa webhook
    ↓
Backend actualiza Supabase
    ↓
Frontend detecta cambio (isPremium = true)
    ↓
App muestra pantalla premium
    ↓
✅ ¡Listo!
```

---

**Documentación:** Consulta [PAYMENT_SETUP_GUIDE.md](PAYMENT_SETUP_GUIDE.md) para instrucciones detalladas.
