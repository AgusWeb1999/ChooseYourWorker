# ✅ Sistema de Pagos - Checklist de Configuración

## 📋 Estado Actual del Proyecto

### ✅ Implementado y Listo

**Backend:**
- ✅ Servidor Mercado Pago (puerto 3000) - `/backend/server-mercadopago.js`
- ✅ Servidor PayPal (puerto 3001) - `/backend/server-paypal.js`
- ✅ Webhooks configurados
- ✅ Database schema para suscripciones - `/backend/4-subscriptions.sql`
- ✅ Funciones RPC para gestionar suscripciones
- ✅ Tablas: `payment_transactions`, `subscription_history`, `subscription_plans`

**Frontend:**
- ✅ Pantalla de planes - `/frontend/app/subscription/plan.tsx`
- ✅ Pantalla de éxito - `/frontend/app/subscription/success.tsx`
- ✅ Pantalla de fallo - `/frontend/app/subscription/failure.tsx`
- ✅ Gestión de suscripción - `/frontend/app/subscription/manage.tsx`
- ✅ Botones de pago integrados
- ✅ Links a Mercado Pago y PayPal

**Supabase:**
- ✅ Tablas creadas
- ✅ RLS policies configuradas
- ✅ Funciones RPC implementadas

---

## 🚀 Checklist de Configuración (HAZLO AHORA)

### ✅ PASO 1: Obtener Keys de Mercado Pago

```
☐ 1. Acceder a https://www.mercadopago.com.ar
☐ 2. Iniciar sesión con tu cuenta
☐ 3. Ir a: Configuración → Credenciales
☐ 4. Seleccionar "Credenciales de Prueba" (importante)
☐ 5. Copiar:
    - Access Token (comienza con TEST-)
    - Public Key (comienza con pk_test_)
☐ 6. Guardar en un lugar seguro temporalmente
```

**Verificación:** El token debe empezar con `TEST-` (no con `PROD-`)

---

### ✅ PASO 2: Obtener Keys de PayPal

```
☐ 1. Acceder a https://developer.paypal.com
☐ 2. Iniciar sesión (crear cuenta si es necesario)
☐ 3. Ir a: Dashboard → Credentials
☐ 4. Verificar estar en pestaña "Sandbox" (NO Production)
☐ 5. Copiar:
    - Client ID
    - Secret
☐ 6. Guardar en un lugar seguro temporalmente
```

**Verificación:** Debes ver `mode=sandbox` en la URL

---

### ✅ PASO 3: Crear archivo .env en Backend

```bash
# Ruta:
/Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/backend/.env

# Contenido: (copia y pega, reemplazando valores)
```

```bash
SUPABASE_URL=https://oeabhlewxekejmgrucrz.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

PAYPAL_CLIENT_ID=AYxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=EXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

NODE_ENV=development

FRONTEND_URL=http://localhost:8081
BACKEND_URL=http://localhost:3000

PORT=3000
PAYPAL_PORT=3001
```

**Pasos:**
```bash
☐ 1. Abre terminal
☐ 2. cd /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/backend
☐ 3. nano .env  (o usa tu editor favorito)
☐ 4. Pega el contenido arriba
☐ 5. Reemplaza:
     - MERCADOPAGO_ACCESS_TOKEN → TU_TOKEN_DE_MERCADO_PAGO
     - MERCADOPAGO_PUBLIC_KEY → TU_PUBLIC_KEY
     - PAYPAL_CLIENT_ID → TU_CLIENT_ID
     - PAYPAL_CLIENT_SECRET → TU_SECRET
☐ 6. Presiona Ctrl+X, luego Y, luego Enter (si usas nano)
☐ 7. Verifica: cat .env (debe mostrar tus valores)
```

---

### ✅ PASO 4: Crear archivo .env.local en Frontend

```bash
# Ruta:
/Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/frontend/.env.local

# Contenido:
```

```bash
EXPO_PUBLIC_SUPABASE_URL=https://oeabhlewxekejmgrucrz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

EXPO_PUBLIC_BACKEND_URL=http://localhost:3000

EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

EXPO_PUBLIC_PAYPAL_CLIENT_ID=AYxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

EXPO_PUBLIC_ENV=development
```

**Pasos:**
```bash
☐ 1. cd /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/frontend
☐ 2. nano .env.local  (o usa tu editor)
☐ 3. Pega el contenido arriba
☐ 4. Reemplaza con tus valores:
     - EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY → pk_test_xxx
     - EXPO_PUBLIC_PAYPAL_CLIENT_ID → AY_xxx
☐ 5. Guarda (Ctrl+X, Y, Enter)
☐ 6. Verifica: cat .env.local
```

**IMPORTANTE:** Las variables DEBEN empezar con `EXPO_PUBLIC_`

---

### ✅ PASO 5: Verificar Database Schema

La tabla de suscripciones ya debería estar creada, pero verificamos:

```bash
☐ 1. Acceder a Supabase: https://supabase.com/dashboard
☐ 2. Seleccionar proyecto ChooseYourWorker
☐ 3. Ir a: SQL Editor
☐ 4. Copiar y ejecutar:

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

☐ 5. Buscar estas columnas (deben existir):
    - subscription_type
    - subscription_status
    - subscription_start_date
    - subscription_end_date
    - payment_provider
    - subscription_id

☐ 6. Si falta algo, ejecutar: /backend/4-subscriptions.sql en Supabase
```

---

### ✅ PASO 6: Instalar Dependencias

```bash
# Backend
☐ 1. cd /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/backend
☐ 2. npm install
☐ 3. Esperar a que termine

# Frontend
☐ 4. cd /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/frontend
☐ 5. npm install  (si es necesario)
☐ 6. Esperar a que termine
```

---

### ✅ PASO 7: Iniciar Servidores

**Terminal 1 - Mercado Pago Server (Puerto 3000):**
```bash
cd /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/backend
npm start
```

**Esperado ver:**
```
Servidor corriendo en puerto 3000
```

---

**Terminal 2 - PayPal Server (Puerto 3001):**
```bash
cd /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/backend
npm run paypal
```

**Esperado ver:**
```
Servidor corriendo en puerto 3001
```

---

**Terminal 3 - Frontend (Expo):**
```bash
cd /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/frontend
npm start
```

**Esperado ver:**
```
› Press i to open iOS simulator
› Press a to open Android emulator
› Press w to open web
```

---

### ✅ PASO 8: Probar Flujo Completo

**En la App:**
```
☐ 1. Haz login (o crea una cuenta)
☐ 2. Ve a "Profile" tab
☐ 3. Busca el botón "Suscripción" o "Plan Premium"
☐ 4. Presiona para abrir pantalla de planes
☐ 5. Selecciona "Contratar con Mercado Pago"
```

**En Mercado Pago:**
```
☐ 6. Espera a que se abra mercadopago.com
☐ 7. Prueba con tarjeta: 4509 9535 6623 3704
☐ 8. Vencimiento: 11/25
☐ 9. CVV: 123
☐ 10. Nombre: Cualquiera
☐ 11. DNI: 99999999
☐ 12. Presiona "Pagar"
```

**Verificación en Backend:**
```bash
☐ 13. En la terminal de backend, debes ver:
    Webhook recibido: { type: 'payment', data: { id: '...' } }
    Pago obtenido: { status: 'approved', ... }
    Suscripción activada para usuario xyz
```

**Verificación en Supabase:**
```bash
☐ 14. Ve a Supabase SQL Editor
☐ 15. Ejecuta:
    SELECT id, email, subscription_type, subscription_status 
    FROM users 
    WHERE subscription_type = 'premium';
☐ 16. Tu usuario debe aparecer con subscription_type='premium'
```

---

## 🧪 Prueba PayPal (Igual Que Mercado Pago)

```
☐ 1. Repite pasos 1-5 pero selecciona "Contratar con PayPal"
☐ 2. Se abre sandbox.paypal.com
☐ 3. Login con: sb-buyer@business.example.com
☐ 4. Password: 123456
☐ 5. Completa la compra
☐ 6. Verifica en backend y Supabase
```

---

## ❌ Troubleshooting

### Problema: "Access Denied en Mercado Pago"

```
✓ Verificar que el token comienza con TEST-
✓ Copiar de nuevo del dashboard (credenciales de PRUEBA)
✓ Quitar espacios en blanco al pegar
✓ Reiniciar servidor: npm start
```

### Problema: "CORS Error"

```
✓ Asegúrate que backend está corriendo
✓ Verifica que PORT=3000 en .env
✓ Reinicia: npm start
```

### Problema: "User not found"

```
✓ Verifica que has hecho login primero
✓ El userId debe existir en Supabase
✓ Comprueba en: SELECT id FROM users;
```

### Problema: "Webhook no se recibe"

```
✓ Para pruebas locales está bien (ver logs en terminal)
✓ Si necesitas webhooks en producción, usar ngrok
```

---

## 📊 Verificación Final

```bash
☐ Mercado Pago: Pago completado ✓
☐ PayPal: Pago completado ✓
☐ Backend: Webhooks recibidos ✓
☐ Supabase: Suscripción guardada ✓
☐ Frontend: Toast de éxito mostrado ✓
☐ Suscripción: Activa en base de datos ✓
```

Si todos marcan ✓, **¡listo para producción!**

---

## 🚀 Próximo Paso: Producción

Cuando hayas probado todo localmente:

1. **Obtener keys de Producción** en Mercado Pago y PayPal
2. **Actualizar .env** con keys de producción
3. **Deploy backend** a servidor (Heroku, Railway, etc.)
4. **Deploy frontend** a Expo EAS o hosting
5. **Cambiar URLs** a tus dominios reales
6. **Probar flujo completo** en producción

---

## 📝 Resumen de Archivos Modificados/Creados

### ✅ Backend
- ✅ `/backend/server-mercadopago.js` - Servidor completo
- ✅ `/backend/server-paypal.js` - Servidor completo
- ✅ `/backend/4-subscriptions.sql` - Schema de DB
- ✅ `/backend/.env.template` - Template de vars de entorno
- 📝 `/backend/.env` ← CREA ESTE (copia de .env.template)

### ✅ Frontend
- ✅ `/frontend/app/subscription/*` - Pantallas completas
- ✅ `/frontend/.env.local.template` - Template
- 📝 `/frontend/.env.local` ← CREA ESTE (copia de .env.local.template)

### 📚 Documentación
- 📘 `/PAYMENT_SETUP_GUIDE.md` - Guía detallada (leyendo ahora)
- 📗 `/backend/.env.template` - Template de vars
- 📙 `/frontend/.env.local.template` - Template de vars

---

## ✅ Todo Listo

Una vez hayas completado estos pasos:

1. ✅ Mercado Pago configurado
2. ✅ PayPal configurado
3. ✅ Backend corriendo
4. ✅ Frontend corriendo
5. ✅ Un pago exitoso completado

**Tu sistema de suscripciones estará 100% operativo.** 🎉

---

**¿Necesitas ayuda? Revisa el archivo PAYMENT_SETUP_GUIDE.md o reporta el error específico.**
