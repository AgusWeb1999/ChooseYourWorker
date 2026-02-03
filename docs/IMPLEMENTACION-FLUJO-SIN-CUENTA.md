# 🚀 IMPLEMENTACIÓN: FLUJO SIN CUENTA (CONTACTLESS)

## ✅ ¿Qué implementamos?

Sistema que permite a usuarios **sin cuenta** contactar profesionales y dejar reseñas después del trabajo.

---

## 📋 CAMBIOS REALIZADOS

### 1. Base de Datos

**Archivo:** `supabase/migrations/20260204_guest_contactless_flow.sql`

**Cambios en tabla `hires`:**
- ✅ `client_id` ahora puede ser NULL
- ✅ Nuevas columnas:
  - `guest_client_email` (VARCHAR 255)
  - `guest_client_phone` (VARCHAR 50)
  - `guest_client_name` (VARCHAR 255)
  - `review_token` (UUID, único)
  - `reviewed_by_guest` (BOOLEAN)
- ✅ Constraint: Debe tener `client_id` O `guest_client_email` (no ambos)
- ✅ Índice en `review_token` para búsqueda rápida

**Cambios en tabla `reviews`:**
- ✅ `is_guest_review` (BOOLEAN) - indica si es reseña de invitado
- ✅ `guest_reviewer_name` (VARCHAR 255) - nombre del reviewer invitado

**RLS Policies:**
- ✅ Anónimos pueden leer hires con `review_token` válido
- ✅ Anónimos pueden actualizar `reviewed_by_guest` con token válido
- ✅ Anónimos pueden insertar reviews si el hire tiene token válido y no fue revisado

---

### 2. Frontend - QuickServiceFlow

**Archivo:** `frontend/components/QuickServiceFlow.tsx`

**Flujo extendido (antes 3 pasos, ahora 5):**
1. ✅ Describir servicio (categoría, descripción, ubicación)
2. ✅ Timing (cuándo necesita el servicio)
3. ✅ Profesionales disponibles (con portfolios cargados)
4. **✅ NUEVO: Información de contacto** (nombre, email, teléfono opcional)
5. **✅ NUEVO: Confirmación** (mensaje de éxito con instrucciones)

**Nuevos estados:**
```typescript
const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
const [guestName, setGuestName] = useState('');
const [guestEmail, setGuestEmail] = useState('');
const [guestPhone, setGuestPhone] = useState('');
const [submitting, setSubmitting] = useState(false);
```

**Nueva función:** `handleSubmitContactInfo()`
- Valida nombre y email
- Crea hire en la DB con datos de invitado
- Genera `review_token` automáticamente (vía DEFAULT en DB)
- Pasa al paso 5 (confirmación)

**Cambios en:** `handleSelectProfessional()`
- Antes: Redirigía a `/auth/register`
- Ahora: Guarda profesional y va al paso 4 (info de contacto)

---

### 3. Portfolio Loading Fix

**Cambio en:** `handleNextFromTiming()`

Antes:
```typescript
portfolio_images: [] // Portfolio no disponible
```

Ahora:
```typescript
const { data: portfolioData } = await supabase
  .from('portfolio_images')
  .select('image_url')
  .eq('professional_id', prof.id)
  .order('created_at', { ascending: false })
  .limit(3);

portfolio_images: (portfolioData || [])
  .map(p => p.image_url)
  .filter(url => url && url.startsWith('http'))
```

✅ Los profesionales ahora muestran hasta 3 imágenes de portfolio

---

## 🔧 CÓMO EJECUTAR LA MIGRACIÓN

### Opción 1: Supabase Dashboard
1. Ir a: https://supabase.com/dashboard/project/TU_PROYECTO/sql/new
2. Copiar contenido de `supabase/migrations/20260204_guest_contactless_flow.sql`
3. Pegar y ejecutar

### Opción 2: CLI
```bash
supabase db push
```

---

## 🎯 FLUJO COMPLETO

### Usuario SIN cuenta:

1. **Describe su problema** → Selecciona categoría y escribe descripción
2. **Elige timing** → Urgente, hoy, o esta semana
3. **Ve profesionales** → Lista con ratings, portfolios, y precios
4. **Contacta** → Ingresa nombre y email (sin crear cuenta)
5. **Confirmación** → Recibe mensaje: "Te enviamos email con datos del profesional"

### Lo que sucede en el backend:

```sql
INSERT INTO hires (
  professional_id,
  guest_client_email,
  guest_client_phone,
  guest_client_name,
  status,
  service_description,
  service_category,
  service_location
) VALUES (...);
```

- Se genera `review_token` automático (UUID)
- `client_id` queda en NULL
- `reviewed_by_guest` = false

---

## 📧 PENDIENTE: Sistema de Emails

**TODO:** Crear Edge Function para enviar emails

**Email al profesional:**
```
Asunto: Nueva solicitud de servicio

Tienes una nueva solicitud:
- Servicio: [categoria]
- Cliente: [guest_client_name]
- Email: [guest_client_email]
- Teléfono: [guest_client_phone]
- Descripción: [service_description]
- Ubicación: [service_location]
```

**Email al cliente:**
```
Asunto: Contacto del profesional [nombre]

Te compartimos los datos de tu profesional:
- Nombre: [professional.display_name]
- Teléfono: [professional.phone]
- Profesión: [professional.profession]

Después del trabajo, dejá tu reseña aquí:
https://tuapp.com/review/[review_token]
```

---

## 📄 PENDIENTE: Página de Review

**TODO:** Crear `frontend/app/review/[token].tsx`

**Funcionalidad:**
1. Recibe token desde URL
2. Busca hire con ese token
3. Valida que `reviewed_by_guest = false`
4. Muestra info del profesional
5. Permite dejar rating + comentario
6. Al enviar:
   - Inserta en `reviews` con `is_guest_review = true`
   - Actualiza `hires.reviewed_by_guest = true`
   - Actualiza rating del profesional

---

## ✅ TESTING

### Probar flujo completo:

1. Ir a `/auth/welcome` SIN estar logueado
2. Click en "Buscar Profesionales"
3. Completar paso 1 (descripción)
4. Completar paso 2 (timing)
5. Ver lista de profesionales con portfolios
6. Click "Contactar" en un profesional
7. Ingresar nombre y email
8. Verificar que se crea el hire en la DB:
```sql
SELECT * FROM hires 
WHERE guest_client_email = 'test@example.com';
```

---

## 🔒 SEGURIDAD

✅ RLS configurado para:
- Anónimos solo pueden leer hires con token válido
- Anónimos solo pueden actualizar `reviewed_by_guest` (no otros campos)
- Anónimos solo pueden insertar reviews si el token es válido

---

## 📊 PRÓXIMOS PASOS

1. ⏳ Crear Edge Function para envío de emails
2. ⏳ Crear página de review `/review/[token]`
3. ⏳ Agregar notificaciones al profesional
4. ⏳ Dashboard para profesionales: ver solicitudes de invitados

---

**¡Implementación completada!** 🎉
