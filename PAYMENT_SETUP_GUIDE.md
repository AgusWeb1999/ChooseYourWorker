# 💳 Guía de Configuración - Sistema de Pagos (Mercado Pago & PayPal)

## 📋 Checklist Rápido

- [x] Servidor Mercado Pago implementado
- [x] Servidor PayPal implementado
- [x] Frontend integrado
- [x] Webhooks configurados
- [x] Validaciones en lugar
- [ ] **TODO: Agregar tus keys de prueba**
- [ ] **TODO: Probar flujo completo**

---

## 🔑 Paso 1: Obtener Keys de Mercado Pago (Entorno de Prueba)

### 1.1 Acceder a tu Cuenta de Mercado Pago

1. Ve a: https://www.mercadopago.com.ar
2. Inicia sesión con tu cuenta
3. Haz clic en tu perfil → **Configuración**
4. Selecciona: **Credenciales** (o busca en el menú izquierdo)

### 1.2 Copiar las Keys de Prueba

En la sección **Credenciales**, verás dos versiones:
- **Credenciales de Prueba** ← ESTO ES LO QUE NECESITAS AHORA
- **Credenciales de Producción** ← Para cuando la app esté en vivo

**En Credenciales de Prueba encontrarás:**
- **Access Token** (comienza con `TEST-`)
- **Public Key** (comienza con `pk_test_`)

```
Ejemplo (NO USES ESTOS, son ficticios):
ACCESS_TOKEN: TEST-1234567890123456789012345678901234567890
PUBLIC_KEY: pk_test_abcdefghijklmnopqrstuvwxyz
```

### ✅ Paso 1.2.1: Validar que tienes keys de TEST

**Importante:** Las keys de prueba SIEMPRE comienzan con `TEST-` y `pk_test_`
Si no ves eso, estás viendo las keys de producción (cambia a pestaña de "Pruebas")

---

## 🔑 Paso 2: Obtener Keys de PayPal (Entorno de Sandbox)

### 2.1 Crear Cuenta en PayPal Developer

1. Ve a: https://developer.paypal.com
2. Haz clic en **Log In**
3. Si no tienes cuenta, crea una (o usa la cuenta de PayPal existente)

### 2.2 Acceder al Dashboard

1. Una vez logueado, ve a **Dashboard**
2. En el menú izquierdo, selecciona **Credentials**
3. Asegúrate que estés en la pestaña **Sandbox** (no Production)

### 2.3 Copiar las Keys Sandbox

En **Sandbox**, crea o busca tu aplicación y encontrarás:
- **Client ID** (la parte larga que comienza con `AY...`)
- **Secret** (contraseña)

```
Ejemplo (NO USES ESTOS, son ficticios):
CLIENT_ID: AYdJvd8FGw9HdJvd8FGw9HdJvd8FGw9HdJvd8FGw9HdJvd8FGw9H
SECRET: EMqyz_VZ8h9JhNmKlOqRsT1234567890abcdefghij
```

### ✅ Paso 2.2.1: Validar que tienes keys Sandbox

Debes ver en la URL: `/credentials` con `mode=sandbox`
Las keys Sandbox empiezan con `AY...` (Client ID)

---

## 📝 Paso 3: Crear el Archivo `.env` en Backend

### 3.1 Ubicación del archivo

```
/Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/backend/.env
```

### 3.2 Contenido del archivo .env

**COPIA Y PEGA ESTO, reemplazando con tus keys:**

```bash
# Variables de entorno - Backend

# Supabase (YA ESTÁ CONFIGURADO)
SUPABASE_URL=https://oeabhlewxekejmgrucrz.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (tu key aquí)

# Mercado Pago - REEMPLAZA CON TUS KEYS DE PRUEBA
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890123456789012345678901234567890
MERCADOPAGO_PUBLIC_KEY=pk_test_abcdefghijklmnopqrstuvwxyz

# PayPal - REEMPLAZA CON TUS KEYS SANDBOX
PAYPAL_CLIENT_ID=AYdJvd8FGw9HdJvd8FGw9HdJvd8FGw9HdJvd8FGw9H
PAYPAL_CLIENT_SECRET=EMqyz_VZ8h9JhNmKlOqRsT1234567890abcdefghij

# Entorno
NODE_ENV=development

# URLs
FRONTEND_URL=http://localhost:8081
BACKEND_URL=http://localhost:3000

# Puertos
PORT=3000
PAYPAL_PORT=3001
```

### 3.3 Paso a Paso para Llenar cada Campo

#### ✅ MERCADOPAGO_ACCESS_TOKEN
1. En Mercado Pago Dashboard → Credenciales → Credenciales de Prueba
2. Copia el **Access Token** (comienza con `TEST-`)
3. Pega aquí: `MERCADOPAGO_ACCESS_TOKEN=TEST-xxxx...`

#### ✅ MERCADOPAGO_PUBLIC_KEY
1. En mismo lugar, copia **Public Key** (comienza con `pk_test_`)
2. Pega aquí: `MERCADOPAGO_PUBLIC_KEY=pk_test_xxxx...`

#### ✅ PAYPAL_CLIENT_ID
1. En PayPal Developer → Credentials → Sandbox
2. Copia **Client ID**
3. Pega aquí: `PAYPAL_CLIENT_ID=AYxxxx...`

#### ✅ PAYPAL_CLIENT_SECRET
1. En mismo lugar, copia **Secret**
2. Pega aquí: `PAYPAL_CLIENT_SECRET=EMxxxx...`

#### ✅ SUPABASE_SERVICE_KEY (Ya existe)
- Si ya lo tienes configurado, déjalo tal cual
- Si no, ve a tu proyecto Supabase → Settings → API → Service Role key

---

## 📝 Paso 4: Crear el Archivo `.env.local` en Frontend (Expo)

### 4.1 Ubicación del archivo

```
/Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/frontend/.env.local
```

### 4.2 Contenido del archivo

```bash
# Variables de entorno - Frontend Expo

# URLs
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://oeabhlewxekejmgrucrz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (tu anon key)

# Mercado Pago
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=pk_test_abcdefghijklmnopqrstuvwxyz

# PayPal
EXPO_PUBLIC_PAYPAL_CLIENT_ID=AYdJvd8FGw9HdJvd8FGw9HdJvd8FGw9H

# Entorno
EXPO_PUBLIC_ENV=development
```

**IMPORTANTE:** Las variables en el frontend DEBEN comenzar con `EXPO_PUBLIC_`

### 4.3 Dónde obtener SUPABASE_ANON_KEY

1. Ve a tu proyecto Supabase
2. Settings → API
3. Copia **anon public** key
4. Pega en `.env.local`

---

## 🚀 Paso 5: Iniciar los Servidores

### 5.1 Backend - Mercado Pago Server

```bash
cd /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/backend

# Asegúrate que tienes node_modules instalados
npm install

# Inicia el servidor en puerto 3000
npm start

# O si quieres ver logs más detallados:
node server-mercadopago.js
```

**Esperado ver en consola:**
```
Servidor corriendo en puerto 3000
```

### 5.2 Backend - PayPal Server (en otra terminal)

```bash
cd /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/backend

# En OTRA terminal
npm run paypal

# O:
node server-paypal.js
```

**Esperado ver en consola:**
```
Servidor corriendo en puerto 3001
```

### 5.3 Frontend - Expo

```bash
cd /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/frontend

# Instala dependencias si es necesario
npm install

# Inicia Expo
npm start

# En el menú, presiona:
# - 'i' para iOS simulator
# - 'a' para Android emulator
# - 'w' para web
```

---

## ✅ Paso 6: Probar el Flujo Completo

### 6.1 Test en Frontend

1. **Abre la app** (iOS/Android simulator o web)
2. **Haz login** (o crea una cuenta de prueba)
3. **Ve a Profile** → Presiona el botón de "Suscripción" o "Premium"
4. **Selecciona "Plan Premium"**
5. **Elige el método de pago:**
   - Mercado Pago
   - PayPal

### 6.2 Test Mercado Pago

1. Presiona **"Contratar con Mercado Pago"** (si existe el botón)
2. Se abre el navegador con la página de Mercado Pago
3. **IMPORTANTE:** En sandbox, Mercado Pago te ofrece tarjetas de prueba

**Tarjetas de Prueba disponibles (TEST):**

| Tipo | Número | Vencimiento | CVV |
|------|--------|-------------|-----|
| Débito (Aprobada) | 4509 9535 6623 3704 | 11/25 | 123 |
| Crédito (Aprobada) | 5031 7557 3453 0604 | 11/25 | 123 |
| Crédito (Rechazada) | 4532 0151 4532 1578 | 11/25 | 123 |

4. Usa cualquiera de estas tarjetas
5. **Nombre titular:** Cualquier nombre
6. **DNI:** 99999999

### 6.3 Verificar en Backend

En la terminal donde corre el servidor, deberías ver logs como:

```
Webhook recibido: { type: 'payment', data: { id: '1234567890' } }
Pago obtenido: { status: 'approved', ... }
Suscripción activada para usuario xyz123
```

### 6.4 Test PayPal

El flujo es similar:
1. Presiona **"Contratar con PayPal"**
2. Se abre PayPal Sandbox
3. **Login en sandbox:**
   - Email: sb-buyer@business.example.com (o crea uno)
   - Password: 123456 (o similar)
4. Completa la compra

---

## 📊 Verificar Estado de Suscripción

### Opción 1: Dashboard de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Ejecuta:

```sql
SELECT id, email, subscription_type, subscription_status, subscription_end_date 
FROM users 
WHERE id = 'tu_user_id_aqui';
```

### Opción 2: Endpoint de API

```bash
# En tu terminal
curl http://localhost:3000/api/subscription/status/tu_user_id_aqui
```

**Respuesta esperada:**
```json
{
  "subscription_type": "premium",
  "subscription_status": "active",
  "subscription_start_date": "2025-12-18T19:30:00Z",
  "subscription_end_date": "2026-01-18T19:30:00Z",
  "payment_provider": "mercadopago",
  "isActive": true
}
```

---

## 🐛 Troubleshooting

### ❌ "Access Denied" en Mercado Pago

**Problema:** El access token no es válido
**Solución:** 
1. Verifica que el token comienza con `TEST-`
2. Copia de nuevo desde Mercado Pago (asegúrate de estar en Credenciales de Prueba)
3. Reinicia los servidores

### ❌ "Invalid Client ID" en PayPal

**Problema:** El Client ID no es válido
**Solución:**
1. Verifica que estés usando Sandbox, no Production
2. Copia de nuevo desde PayPal Developer
3. Verifica que no haya espacios al pegar

### ❌ "CORS Error" al abrir Mercado Pago/PayPal

**Problema:** El navegador bloquea la petición
**Solución:**
1. Asegúrate que el backend está corriendo (`npm start` en backend/)
2. Verifica que BACKEND_URL está correcto en .env
3. Reinicia Expo

### ❌ "User not found" en backend

**Problema:** El userId no existe en Supabase
**Solución:**
1. Verifica que has hecho login primero
2. Usa el mismo usuario para ambos servidores
3. Comprueba el ID en Supabase directamente

### ❌ Webhook no se recibe

**Problema:** El webhook de Mercado Pago no llega al backend
**Solución:**
1. Asegúrate que tu backend está en internet (no localhost si quieres que MP envíe webhooks)
2. Para testing local, usa ngrok:
   ```bash
   ngrok http 3000
   ```
3. Luego actualiza `BACKEND_URL` en Mercado Pago con la URL de ngrok

---

## 🎯 Checklist Final ANTES de Producción

- [ ] Probaste flujo completo con Mercado Pago
- [ ] Probaste flujo completo con PayPal
- [ ] La suscripción se activa en Supabase
- [ ] El email se recibe con confirmación (si está configurado)
- [ ] Las notificaciones toast aparecen correctamente
- [ ] Cancelar suscripción funciona
- [ ] Ver historial de transacciones funciona

---

## 🔄 Cambiar a Producción (DESPUÉS de probar todo)

### Paso 1: Obtener Keys de Producción

En Mercado Pago y PayPal, ve a **Credenciales de Producción** y copia las keys

### Paso 2: Actualizar .env

```bash
# Reemplazar en backend/.env:
MERCADOPAGO_ACCESS_TOKEN=TU_TOKEN_PRODUCCION (sin TEST-)
PAYPAL_CLIENT_ID=TU_CLIENT_ID_PRODUCCION

NODE_ENV=production
```

### Paso 3: Cambiar URLs

```bash
FRONTEND_URL=https://tudominio.com
BACKEND_URL=https://api.tudominio.com
```

### Paso 4: Verificar Webhooks

En Mercado Pago y PayPal, configura las URLs de webhook a producción

### Paso 5: Deploy

Haz deploy de:
- Backend en tu servidor (Heroku, Railway, AWS, etc.)
- Frontend en Expo EAS o tu hosting

---

## 📞 Resumen Rápido de URLs Importantes

| Recurso | URL |
|---------|-----|
| Mercado Pago Dashboard | https://www.mercadopago.com.ar/settings/credentials |
| PayPal Developer | https://developer.paypal.com/credentials |
| Supabase Dashboard | https://supabase.com/dashboard |
| Backend Mercado Pago | http://localhost:3000 |
| Backend PayPal | http://localhost:3001 |
| API Health Check | `curl http://localhost:3000/api/health` |
| Crear Preferencia | `POST /api/mercadopago/create-preference` |
| Status Suscripción | `GET /api/subscription/status/:userId` |

---

## ✅ Completado

Una vez hayas:
1. ✅ Creado el archivo .env en backend con tus keys
2. ✅ Creado el archivo .env.local en frontend
3. ✅ Iniciado los servidores (backend + frontend)
4. ✅ Probado un pago completo

**¡Tu sistema de pagos estará completamente funcional!** 🎉

---

**¿Necesitas ayuda con alguno de estos pasos? Escribe la URL o el error específico.**
