# 🏗️ Arquitectura del Sistema de Notificaciones

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                      APP._LAYOUT.TSX                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ AuthProvider                                            │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ ToastProvider ⭐ NUEVO                            │  │   │
│  │  │  ┌──────────────────────────────────────────────┐ │  │   │
│  │  │  │ RootLayoutNav                              │ │  │   │
│  │  │  │  ├─ Stack (tabs, auth, etc)               │ │  │   │
│  │  │  │  └─ ToastContainer ⭐ NUEVO              │ │  │   │
│  │  │  └──────────────────────────────────────────────┘ │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Toast Notifications

```
Componente A                    ToastContext                  ToastContainer
┌──────────────┐               ┌──────────────┐              ┌──────────────┐
│ useToast()   │               │ showToast()  │              │ Mostrar       │
│              │               │ dismissToast │              │ notificación  │
│ showToast()  │──────────────→│ clearAll()   │─────────────→│              │
│ "¡Éxito!"    │ Create toast  │              │  Update      │ Auto-dismiss  │
│ "success"    │               │ Queue array  │  state       │ después 3s    │
└──────────────┘               └──────────────┘              └──────────────┘
                                       ↑
                                       │ useToast()
                                       │
                                   Componente B
                                   Componente C
                                   Componente N
```

## Estructura de Datos - Notificación

```
Notification {
  id: "notif_1702156234567_0.123"
  type: "solicitud_enviada"  // solicitud_aceptada, trabajo_completado, etc.
  userId: "user_456"          // Destinatario
  senderId: "pro_123"         // Quien envía
  senderName: "Juan García"
  title: "Nueva solicitud de contratación"
  message: "Juan García quiere contratar tus servicios"
  relatedId: "hiring_789"     // Link a solicitud
  relatedType: "hiring"       // Tipo de recurso
  timestamp: 2023-12-15T19:30:00Z
  read: false
  actionUrl: "myapp://hiring/789"  // Deep link
}
```

## Flujo Completo de Contratación - Arquitectura

```
┌────────────────────────────────────────────────────────────────────┐
│                       CLIENTE (ClientHirings)                      │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 1. Lee perfil del profesional                              │ │
│  │    - Presiona "Contratar"                                 │ │
│  │    - Se abre HireModal ⭐ NUEVO                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                             ⬇️                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 2. HireModal (Componente)                                  │ │
│  │    - Mostrar datos del profesional                        │ │
│  │    - TextInput para mensaje (10-500 chars)               │ │
│  │    - Validación en tiempo real                           │ │
│  │    - Botón "Enviar Solicitud"                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                             ⬇️                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 3. handleHireConfirm(message)                              │ │
│  │    ✅ Toast: "Solicitud enviada"                          │ │
│  │    💾 INSERT en tabla 'hirings'                           │ │
│  │    📧 Crear EmailNotification (TODO)                      │ │
│  │    🔔 Crear PushNotification (TODO)                       │ │
│  │    📤 Enviar notificaciones (TODO)                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                                ⬇️
┌────────────────────────────────────────────────────────────────────┐
│                  PROFESIONAL (ProfessionalJobs)                    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 1. Ve "Mis Trabajos"                                       │ │
│  │    - Nueva solicitud con estado "pending"                 │ │
│  │    - Lee el mensaje del cliente                          │ │
│  │    - ❌ NO ve datos de contacto                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                             ⬇️                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 2. Decisión: Aceptar o Rechazar                           │ │
│  │    ┌────────────────────────┐                             │ │
│  │    │ Botón: Aceptar ✓       │                             │ │
│  │    └────────────────────────┘                             │ │
│  │                   ⬇️                                        │ │
│  │    handleAcceptJob(jobId)                                 │ │
│  │    ✅ Toast: "Solicitud aceptada"                        │ │
│  │    🔄 UPDATE status → "accepted"                         │ │
│  │    ✅ AHORA SÍ ve datos de contacto                     │ │
│  │    📧 Enviar email al cliente (TODO)                     │ │
│  │    🔔 Enviar push al cliente (TODO)                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                                ⬇️
┌────────────────────────────────────────────────────────────────────┐
│                       CLIENTE (ClientHirings)                      │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 1. Recibe notificación de aceptación                       │ │
│  │    - Estado: "accepted"                                    │ │
│  │    - ✅ AHORA SÍ ve datos de contacto del profesional    │ │
│  │    - Puede coordinarse por teléfono/WhatsApp            │ │
│  │    - Estado visual: verde ✓ "Aceptado"                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                             ⬇️                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 2. Trabajo en progreso                                     │ │
│  │    - Ambos ven estado "in_progress"                       │ │
│  │    - Datos de contacto visibles en ambos lados           │ │
│  │    - Se coordinan directamente                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                             ⬇️                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 3. Profesional solicita finalizar                          │ │
│  │    - Botón: "Solicitar Finalización"                      │ │
│  │    - Estado: "waiting_client_approval"                    │ │
│  │    - Cliente ve: "¿Trabajo terminado? Confirmar"          │ │
│  │    - Cliente presiona: "Confirmar que está terminado"     │ │
│  │    - Estado final: "completed"                            │ │
│  │    ✅ Toast: "Trabajo marcado como completado"           │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

## Estructura de Archivos

```
frontend/
├── app/
│   └── _layout.tsx ⭐ MODIFICADO
│       └── ToastProvider wrapping
│           └── ToastContainer rendering
│
├── components/
│   ├── Toast.tsx ⭐ NUEVO
│   │   ├── Toast (individual notification)
│   │   └── ToastContainer (queue manager)
│   │
│   ├── HireModal.tsx ⭐ NUEVO
│   │   ├── Professional info display
│   │   ├── Message textarea with validation
│   │   └── Confirm/Cancel actions
│   │
│   ├── ClientHirings.tsx ⭐ MODIFICADO
│   │   ├── Mostrar contacto si accepted
│   │   ├── Toast notifications en handlers
│   │   └── useToast hook
│   │
│   └── ProfessionalJobs.tsx ⭐ MODIFICADO
│       ├── HireModal integration
│       ├── Mostrar contacto si visible
│       ├── Mostrar hire_message
│       └── Toast notifications
│
├── contexts/
│   └── ToastContext.tsx ⭐ NUEVO
│       ├── ToastProvider
│       ├── ToastContextType interface
│       └── useToast hook
│
├── utils/
│   └── validationMessages.ts ⭐ NUEVO
│       ├── 50+ mensajes en español
│       ├── Validadores (email, password, etc)
│       └── Objeto validationMessages
│
└── services/
    └── notificationService.ts ⭐ NUEVO
        ├── Tipos de notificaciones (7)
        ├── createNotification()
        ├── createEmailNotification()
        ├── generateEmailHTML()
        ├── notificationTemplates
        └── TODO functions para backend
```

## State Management Flow

```
┌──────────────────┐
│  ToastContext    │
│  (Global State)  │
└────────┬─────────┘
         │
    ┌────┴────────────────────────────┐
    │                                 │
    ↓                                 ↓
┌──────────────┐                ┌──────────────┐
│  Component A │                │  Component B │
│              │                │              │
│ const {      │                │ const {      │
│   showToast  │                │   showToast  │
│ } = useToast │                │ } = useToast │
│              │                │              │
└──────────────┘                └──────────────┘
    │                                 │
    └────────────┬────────────────────┘
                 │
            showToast("Éxito!", "success")
                 │
                 ↓
    ┌────────────────────────┐
    │  Add to toasts array   │
    │  Set auto-dismiss timer│
    └────────────────────────┘
                 │
                 ↓
    ┌────────────────────────┐
    │ ToastContainer         │
    │ renders notifications  │
    │ with animations        │
    └────────────────────────┘
```

## Email Notification Pipeline (TODO)

```
Client Action
├─ handleHireConfirm(message)
│  │
│  ├─ 1. Save to Supabase
│  │  └─ INSERT INTO hirings (hire_message, etc)
│  │
│  ├─ 2. Create Notification Object
│  │  └─ createNotification(type, userId, senderId, ...)
│  │
│  ├─ 3. Create Email Notification
│  │  └─ createEmailNotification(
│  │     notification,
│  │     recipient@email.com,
│  │     subject,
│  │     htmlContent,
│  │     textContent
│  │  )
│  │
│  ├─ 4. Generate Email HTML (DONE ✓)
│  │  └─ generateEmailHTML(title, message, link, button, name)
│  │
│  ├─ 5. Send Email (TODO)
│  │  └─ POST /api/email/send {to, subject, html, text}
│  │
│  ├─ 6. Send Push Notification (TODO)
│  │  └─ POST /api/push/send {token, title, message}
│  │
│  └─ 7. Store in Database (TODO)
│     └─ INSERT INTO notifications {...}

UI Feedback
└─ showToast("Solicitud enviada", "success")
```

## Validación Pipeline

```
User Input
   │
   ├─ TextInput onChange={setMessage}
   │
   ├─ Validation on blur/submit
   │  │
   │  └─ const error = validateHireMessage(message)
   │     │
   │     ├─ Check if empty
   │     ├─ Check min length (10)
   │     └─ Check max length (500)
   │
   ├─ Error State
   │  │
   │  ├─ IF error: show message
   │  │  └─ Input border → red
   │  │  └─ Button → disabled
   │  │
   │  └─ IF no error: hide message
   │     └─ Input border → normal
   │     └─ Button → enabled
   │
   └─ Submit
      │
      ├─ validateHireMessage(message) again
      │
      ├─ IF valid: proceed
      │  └─ handleHireConfirm(message)
      │
      └─ IF invalid: show toast
         └─ showToast(error, 'error')
```

## Security Architecture

```
┌─────────────────────────────────────────────────────┐
│            CLIENT VALIDATION (UI Layer)            │
│                                                     │
│ ✓ Validate input                                  │
│ ✓ Show errors in UI                               │
│ ✓ Prevent invalid submissions                     │
│                                                     │
│ ⚠️ Can be bypassed - NOT for security!             │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/HTTPS
                   ↓
┌─────────────────────────────────────────────────────┐
│         SERVER VALIDATION (API Layer)              │
│                                                     │
│ ✓ Validate all inputs AGAIN                       │
│ ✓ Check authentication                            │
│ ✓ Check authorization (RLS)                       │
│ ✓ Sanitize data                                   │
│ ✓ Rate limiting                                   │
│                                                     │
│ ✅ This is the real security layer!                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│         DATABASE LAYER (Supabase)                  │
│                                                     │
│ ✓ Row Level Security (RLS)                        │
│ ✓ Encryption at rest                              │
│ ✓ Backups & Recovery                              │
│                                                     │
│ ✅ Final security checkpoint!                      │
└─────────────────────────────────────────────────────┘
```

## Performance Considerations

```
Toast Notifications
├─ Animated with useNativeDriver: true
│  └─ Hardware accelerated (smooth 60fps)
│
├─ Auto-dismiss after 3000ms
│  └─ Prevents memory leaks
│
└─ Queue management
   └─ Multiple toasts don't stack overflows

Validations
├─ Client-side: Instant feedback
│
└─ Server-side: Double check security

HireModal
├─ Bottom sheet: Optimized rendering
│
├─ Character limit: 500 chars
│  └─ Prevents large payloads
│
└─ Input debouncing: (not yet, but recommended)

Notifications
├─ Lazy loaded: Only show when needed
│
├─ Timestamps: Server-generated
│  └─ Prevents client-side time spoofing
│
└─ Pagination: (not yet implemented)
   └─ Load old notifications on demand
```

## Testing Architecture

```
Unit Tests (TODO)
├─ Toast component
├─ HireModal validation
├─ validationMessages functions
└─ notificationService templates

Integration Tests (TODO)
├─ Toast + Context provider
├─ HireModal + Toast
├─ Hire flow (client → professional)
└─ Contact visibility logic

E2E Tests (TODO)
├─ Full hire workflow
├─ Notification delivery
├─ Email sending
└─ Push notifications
```

---

Este diagrama muestra la arquitectura completa del sistema de notificaciones.
Para más detalles, consulta la documentación en los archivos .md correspondientes.
