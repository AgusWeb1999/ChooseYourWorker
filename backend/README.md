# 🗄️ WorkingGo - Backend Database Scripts

Scripts SQL para configuración del sistema de contrataciones en Supabase.

## 📋 Archivo Principal

### `setup-hires-REAL.sql` ⚡ **PRINCIPAL**
**Ejecutar UNA VEZ para configurar el sistema de contrataciones**

Configura:
- ✅ Tabla `hires` (contrataciones cliente → profesional)
- ✅ Columnas: `phone`, `hires_count`, `completed_hires_count`
- ✅ Columna `hire_id` en tabla `reviews`
- ✅ RLS y políticas de seguridad
- ✅ Trigger para actualizar contadores automáticamente
- ✅ Índices para optimización

**Ver instrucciones:** `../INICIO-RAPIDO.md`

---

## 🔧 Archivos de Diagnóstico (Opcionales)

### `diagnose-and-fix-users.sql`
Para diagnosticar problemas con usuarios duplicados o inconsistentes.

### `diagnose-client-id.sql`
Para verificar referencias de `client_id` en las tablas.

---

## � Cómo Ejecutar

### Método 1: Desde Terminal (macOS/Linux)

```bash
# Copiar script al portapapeles
cat setup-hires-REAL.sql | pbcopy

# Luego pegar en Supabase SQL Editor y ejecutar
```

### Método 2: En Supabase Dashboard

1. **Ir al SQL Editor**
   ```
   https://supabase.com/dashboard/project/[TU_PROJECT_ID]/sql
   ```

2. **Crear Nueva Query**
   - Click en "New Query"
   - Copiar y pegar el contenido de `setup-hires-REAL.sql`
   - Click en "Run" o `Cmd/Ctrl + Enter`

3. **Verificar Éxito**
   - Debes ver mensajes de confirmación al final
   - Verificar que la tabla `hires` existe en Table Editor

---

## 📚 Documentación Adicional

- **Inicio Rápido:** `../INICIO-RAPIDO.md`
- **Implementación Completa:** `../IMPLEMENTACION-HIRES-COMPLETA.md`
- **Archivos Obsoletos:** `LIMPIEZA-SQL.md`

---

## 🗑️ Archivos Movidos

Los scripts antiguos fueron movidos a `_old_scripts/`:
- `1-setup-inicial*.sql`
- `2-reparacion.sql`
- `3-utilidades.sql`
- `setup-contracts*.sql`
- `setup-minimal.sql`
- etc.

Puedes eliminar la carpeta `_old_scripts/` si ya verificaste que todo funciona.

---

## ⚠️ Importante

- ✅ Solo necesitas ejecutar `setup-hires-REAL.sql` una vez
- ✅ El script es idempotente (se puede ejecutar múltiples veces sin problemas)
- ✅ Usa bloques `IF NOT EXISTS` para evitar duplicados
- ⚠️ Haz backup antes si ya tienes datos en producción

---

## 🆘 Troubleshooting

| Problema | Solución |
|----------|----------|
| Error "table already exists" | Normal, el script continúa sin problemas |
| Error "column already exists" | Normal, el script continúa sin problemas |
| Reviews no se vinculan a hires | Verifica que `hire_id` existe en tabla `reviews` |
| Frontend no encuentra `hires` | Verifica RLS políticas en Supabase Dashboard |

---

**Última actualización:** 28 de noviembre de 2025
| Ratings no se actualizan | Ejecutar `2-reparacion.sql` |
| Error de foreign key | Ejecutar `2-reparacion.sql` |

---

**WorkingGo** - Backend limpio y funcional 🚀

---

## 🔔 Configurar Webhooks (Pagos)

Este backend incluye servidores para Mercado Pago (`server-mercadopago.js`) y PayPal (`server-paypal.js`).

### ¿Es obligatorio configurar webhooks para actualizar estados?

- **Mercado Pago:** Recomendado. Ya se utiliza `notification_url` al crear la preferencia y el backend expone `POST /api/mercadopago/webhook` para actualizar estados (aprobado, pendiente, rechazado). Configurar las URLs de notificación en el panel asegura que todas las notificaciones lleguen, incluso si el usuario cierra el navegador.
- **PayPal:** Para activar suscripciones tras el pago usamos `POST /api/paypal/capture-order` (actualiza al instante). Los **webhooks** son necesarios para reflejar eventos posteriores (reembolsos, denegaciones), vía `POST /api/paypal/webhook`.

### Endpoints clave

- Mercado Pago
   - `POST /api/mercadopago/create-preference` → crea preferencia con `notification_url`
   - `POST /api/mercadopago/webhook` → procesa eventos de `payment` y activa la suscripción
   - `GET /api/mercadopago/payment/:paymentId` → consulta estado de pago

- PayPal
   - `POST /api/paypal/create-order` → crea orden
   - `POST /api/paypal/capture-order` → captura y activa suscripción
   - `POST /api/paypal/webhook` → maneja `PAYMENT.CAPTURE.DENIED/REFUNDED/COMPLETED`
   - `GET /api/paypal/order/:orderId` → consulta orden

### Configuración rápida

1. Variables `.env`:
    - `FRONTEND_URL`, `BACKEND_URL`
    - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
    - `MERCADOPAGO_ACCESS_TOKEN`
   - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_WEBHOOK_VERIFY`

2. Ejecutar servidores:

```bash
npm run dev:both
```

3. Paneles de proveedor:
    - Mercado Pago → Notificaciones: produc/prueba → `https://tu-dominio/api/mercadopago/webhook` y `http://localhost:3000/api/mercadopago/webhook` (con `ngrok` si aplica).
   - PayPal → Webhooks: produc/sandbox → `https://tu-dominio/api/paypal/webhook`. Seleccionar eventos: `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`, `PAYMENT.CAPTURE.COMPLETED`. Copiar el `Webhook ID` al `.env` como `PAYPAL_WEBHOOK_ID`. Si no podés configurarlo aún, poné `PAYPAL_WEBHOOK_VERIFY=false` para deshabilitar la validación de firma y procesar eventos igualmente.

4. Pruebas rápida (curl):

```bash
curl -X POST http://localhost:3000/api/mercadopago/webhook \
   -H "Content-Type: application/json" \
   -d '{"type":"payment","data":{"id": "123456789"}}'

curl -X POST http://localhost:3001/api/paypal/webhook \
   -H "Content-Type: application/json" \
   -d '{"event_type":"PAYMENT.CAPTURE.DENIED","resource":{"supplementary_data":{"related_ids":{"order_id":"ORDER-ID"}}}}'
```

### Seguridad (producción)

- Mercado Pago: validar origen del webhook consultando el pago por `id` recibido.
- PayPal: si `PAYPAL_WEBHOOK_VERIFY=true` y `PAYPAL_WEBHOOK_ID` presente, se valida automáticamente la firma (`verify-webhook-signature`). Caso contrario, los webhooks se procesan sin validación para facilitar pruebas/dev.

---

## ✅ Checklist Producción

- [ ] Variables `.env` completas (`SUPABASE_*`, `FRONTEND_URL`, `BACKEND_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `PAYPAL_CLIENT_ID/SECRET`, `PAYPAL_WEBHOOK_ID`).
- [ ] `notification_url` de Mercado Pago apunta a tu dominio público (HTTPS).
- [ ] Webhook de PayPal creado y `Webhook ID` configurado en `.env`.
- [ ] HTTPS habilitado detrás de proxy/ingress.
- [ ] Logs centralizados para auditar eventos de pago.
