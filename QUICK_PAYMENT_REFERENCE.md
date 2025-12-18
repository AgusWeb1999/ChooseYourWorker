# 💳 Referencia Rápida - Sistema de Pagos

## 🎯 En 5 Minutos

### 1️⃣ Obtén Keys (5 min)

**Mercado Pago:**
- URL: https://www.mercadopago.com.ar/settings/credentials
- Tipo: Credenciales de Prueba
- Copiar: Access Token (TEST-...) + Public Key (pk_test_...)

**PayPal:**
- URL: https://developer.paypal.com/credentials
- Pestaña: Sandbox (NO Production)
- Copiar: Client ID + Secret

### 2️⃣ Crear Archivos (2 min)

```bash
# Backend
nano /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/backend/.env

# Frontend
nano /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/frontend/.env.local
```

**Usa los templates:**
- `backend/.env.template`
- `frontend/.env.local.template`

### 3️⃣ Llenar .env (Backend)

```bash
MERCADOPAGO_ACCESS_TOKEN=TEST-tutoken
MERCADOPAGO_PUBLIC_KEY=pk_test_tukey
PAYPAL_CLIENT_ID=AYtuClientId
PAYPAL_CLIENT_SECRET=EMtuSecret
```

### 4️⃣ Llenar .env.local (Frontend)

```bash
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=pk_test_tukey
EXPO_PUBLIC_PAYPAL_CLIENT_ID=AYtuClientId
```

### 5️⃣ Iniciar Servidores

```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd backend && npm run paypal

# Terminal 3
cd frontend && npm start
```

---

## 📍 Ubicaciones Claves

```
Backend:        /backend
  ├─ server-mercadopago.js    (Puerto 3000)
  ├─ server-paypal.js         (Puerto 3001)
  ├─ .env                      ← CREA ESTO
  └─ 4-subscriptions.sql      (Schema DB)

Frontend:       /frontend
  ├─ app/subscription/
  │  ├─ plan.tsx              (Pantalla de planes)
  │  ├─ success.tsx           (Éxito)
  │  └─ failure.tsx           (Error)
  └─ .env.local               ← CREA ESTO

Database:       Supabase
  ├─ users.subscription_type
  ├─ payment_transactions
  └─ subscription_history
```

---

## 🔗 URLs Importantes

| Recurso | URL |
|---------|-----|
| Mercado Pago Credenciales | https://www.mercadopago.com.ar/settings/credentials |
| PayPal Developer | https://developer.paypal.com/credentials |
| Supabase Dashboard | https://supabase.com/dashboard |
| Backend Local | http://localhost:3000 |
| PayPal Local | http://localhost:3001 |
| Frontend Local | http://localhost:8081 |

---

## 💳 Tarjetas de Prueba Mercado Pago

| Tipo | Número | Venc | CVV |
|------|--------|------|-----|
| Débito OK | 4509 9535 6623 3704 | 11/25 | 123 |
| Crédito OK | 5031 7557 3453 0604 | 11/25 | 123 |
| Rechazada | 4532 0151 4532 1578 | 11/25 | 123 |

**Otros campos:** Cualquier nombre, DNI: 99999999

---

## 🧪 Flujo de Test

```
1. Abre app → Profile tab
2. Presiona "Plan Premium"
3. Elige "Mercado Pago" o "PayPal"
4. Usa tarjeta de prueba
5. Completa compra
6. Verifica en Supabase:
   SELECT * FROM payment_transactions;
```

---

## 📱 Variables de Entorno - Backend

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| MERCADOPAGO_ACCESS_TOKEN | Token de MP | TEST-1234... |
| MERCADOPAGO_PUBLIC_KEY | Key pública de MP | pk_test_abc... |
| PAYPAL_CLIENT_ID | ID de PayPal | AYdef... |
| PAYPAL_CLIENT_SECRET | Secret de PayPal | EMghi... |
| SUPABASE_URL | URL de proyecto | https://xxx.supabase.co |
| SUPABASE_SERVICE_KEY | Service role key | eyJhbGc... |

---

## 📱 Variables de Entorno - Frontend

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| EXPO_PUBLIC_BACKEND_URL | URL backend | http://localhost:3000 |
| EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY | Key MP | pk_test_abc... |
| EXPO_PUBLIC_PAYPAL_CLIENT_ID | ID PayPal | AYdef... |
| EXPO_PUBLIC_SUPABASE_URL | URL Supabase | https://xxx.supabase.co |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Anon key | eyJhbGc... |

**⚠️ IMPORTANTE:** Las variables DEBEN empezar con `EXPO_PUBLIC_` en frontend

---

## ✅ Checklist

```bash
# Antes de probar
☐ .env creado en /backend
☐ .env.local creado en /frontend
☐ Mercado Pago keys obtenidas
☐ PayPal keys obtenidas
☐ npm install en backend
☐ npm install en frontend

# Al iniciar
☐ Backend corriendo: npm start (puerto 3000)
☐ PayPal corriendo: npm run paypal (puerto 3001)
☐ Frontend corriendo: npm start (puerto 8081)

# Después de pago
☐ Webhook en backend (ver terminal)
☐ Transacción en Supabase
☐ Suscripción activa en users.subscription_status
```

---

## 🐛 Errores Comunes

| Error | Solución |
|-------|----------|
| "Access Denied" | Token comienza con TEST-? Copiar de Credenciales de Prueba |
| "Invalid Client ID" | Estás en Sandbox? No Production |
| "CORS Error" | Backend corriendo? Puerto 3000? |
| "User not found" | Hiciste login? ID existe en Supabase? |
| "Module not found" | `npm install` en backend y frontend |

---

## 📊 Comandos Útiles

```bash
# Verificar que backend está corriendo
curl http://localhost:3000/api/subscription/status/user-id

# Ver transacciones
curl http://localhost:3000/api/subscription/transactions/user-id

# Check de salud
curl http://localhost:3000/health

# Ver logs en tiempo real
tail -f /backend/logs.txt
```

---

## 🎯 Próximo Paso

```
1. ✅ Lee esta guía
2. ✅ Obtén keys de Mercado Pago
3. ✅ Obtén keys de PayPal
4. ✅ Crea .env (backend)
5. ✅ Crea .env.local (frontend)
6. ✅ npm start (backend + frontend)
7. ✅ Prueba un pago
8. ✅ Verifica en Supabase

¡Listo! Sistema de pagos operativo 🚀
```

---

**Documentación completa:** [PAYMENT_SETUP_GUIDE.md](PAYMENT_SETUP_GUIDE.md)  
**Checklist detallado:** [PAYMENT_SETUP_CHECKLIST.md](PAYMENT_SETUP_CHECKLIST.md)
