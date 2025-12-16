# Sistema de Notificaciones y Contratación - Documentación

## Características Implementadas

### 1. **Toast Notifications (Sistema de Notificaciones Toast)**

Componentes:
- `components/Toast.tsx` - Componente de notificación visual
- `contexts/ToastContext.tsx` - Context para gestionar múltiples notificaciones

**Características:**
- Auto-dismissing después de 3 segundos (configurable)
- 4 tipos: `success` (verde), `error` (rojo), `warning` (naranja), `info` (azul)
- Animación slide-up al aparecer
- Cola de notificaciones (múltiples toasts simultáneamente)
- Iconos automáticos según el tipo

**Uso:**
```tsx
import { useToast } from '../contexts/ToastContext';

export function MyComponent() {
  const { showToast } = useToast();

  const handleAction = () => {
    showToast('Operación completada!', 'success');
    // showToast(message, type, duration)
    // type: 'success' | 'error' | 'info' | 'warning'
    // duration: milisegundos (default: 3000)
  };

  return <View>{/* ... */}</View>;
}
```

**Integración Global:**
- Ya integrado en `app/_layout.tsx`
- Wrappea el componente `RootLayoutNav` con `ToastProvider`
- El contenedor de toasts se muestra en la parte superior de la pantalla

---

### 2. **Validación en Español (validationMessages)**

Archivo: `utils/validationMessages.ts`

**Funciones disponibles:**
- `validateEmail(email)` - Valida formato de email
- `validatePassword(password)` - Valida contraseña (min 6 chars, letra y número)
- `validateName(name, fieldName)` - Valida nombres (letras y espacios)
- `validateBio(bio)` - Valida biografía (10-500 caracteres)
- `validateHireMessage(message)` - Valida mensaje de contratación (10-500 caracteres)

**Mensajes incluidos:**
```javascript
{
  email: { required, invalid },
  password: { required, tooShort, weak, missingUppercase, missingNumber },
  name: { required, tooShort, invalid },
  phone: { required, invalid },
  bio: { required, tooShort, tooLong },
  message: { required, tooShort, tooLong },
  hire: { messageSent, messageError, acceptedSuccess, etc. }
  // ... y muchos más mensajes en español
}
```

**Uso:**
```tsx
import { validateEmail, validationMessages } from '../utils/validationMessages';
import { useToast } from '../contexts/ToastContext';

export function LoginForm() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    const error = validateEmail(email);
    if (error) {
      showToast(error, 'error'); // Muestra mensaje en español
      return;
    }
    // Continuar con login...
  };

  return <View>{/* ... */}</View>;
}
```

---

### 3. **Modal de Pre-Contratación (HireModal)**

Componente: `components/HireModal.tsx`

**Características:**
- Modal full-screen desde la parte inferior (bottom sheet style)
- Muestra información del profesional (nombre, especialidad, tarifa)
- Campo de texto obligatorio para mensaje (10-500 caracteres)
- Contador de caracteres con advertencias visuales
- Validación en tiempo real
- Botones de Cancelar/Enviar Solicitud

**Props:**
```tsx
interface HireModalProps {
  visible: boolean;
  professional: {
    id: string;
    name: string;
    specialty: string;
    rate?: number;
  };
  onConfirm: (message: string) => Promise<void>;
  onCancel: () => void;
}
```

**Uso:**
```tsx
import { HireModal } from '../components/HireModal';
import { useToast } from '../contexts/ToastContext';

export function ProfessionalProfile() {
  const [hireModalVisible, setHireModalVisible] = useState(false);
  const { showToast } = useToast();

  const handleHireConfirm = async (message: string) => {
    // Aquí enviar la solicitud a Supabase
    console.log('Mensaje de contratación:', message);
    // TODO: Crear record en tabla 'hirings'
    // TODO: Enviar notificación al profesional
    setHireModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setHireModalVisible(true)}>
        <Text>Contratar</Text>
      </TouchableOpacity>

      <HireModal
        visible={hireModalVisible}
        professional={{
          id: '123',
          name: 'Juan García',
          specialty: 'Reparación de AC',
          rate: 500
        }}
        onConfirm={handleHireConfirm}
        onCancel={() => setHireModalVisible(false)}
      />
    </View>
  );
}
```

---

### 4. **Servicio de Notificaciones (notificationService)**

Archivo: `services/notificationService.ts`

**Tipos de Notificaciones:**
- `solicitud_enviada` - Cliente envía solicitud a profesional
- `solicitud_aceptada` - Profesional acepta solicitud
- `solicitud_rechazada` - Profesional rechaza solicitud
- `trabajo_completado` - Profesional solicita finalizar
- `aprobacion_completado` - Cliente aprueba finalización
- `mensaje_nuevo` - Nuevo mensaje en chat
- `contacto_compartido` - Se comparten datos de contacto

**Funciones principales:**
```tsx
// Crear notificación
createNotification(
  type: NotificationType,
  userId: string,
  senderId: string,
  senderName: string,
  title: string,
  message: string,
  relatedId?: string,
  relatedType?: string
): Notification

// Crear notificación de email
createEmailNotification(
  notification: Notification,
  email: string,
  subject: string,
  htmlContent: string,
  textContent: string,
  buttonUrl?: string,
  buttonText?: string
): EmailNotification

// Generar HTML para email
generateEmailHTML(
  title: string,
  message: string,
  buttonUrl?: string,
  buttonText?: string,
  recipientName?: string
): string
```

**Templates predefinidos:**
```tsx
notificationTemplates.solicitudEnviada(senderName, jobTitle?)
notificationTemplates.solicitudAceptada(senderName)
notificationTemplates.solicitudRechazada(senderName)
notificationTemplates.trabajoCompletado(senderName)
notificationTemplates.aprobacionCompletado(senderName)
notificationTemplates.mensajeNuevo(senderName)
notificationTemplates.contactoCompartido(senderName)
```

**TODO - Implementación Backend:**
```tsx
// 1. Integrar con Supabase para guardar notificaciones
sendNotification(notification: Notification): Promise<void>

// 2. Integrar con servicio de email (SendGrid, Resend, etc.)
sendEmailNotification(emailNotification: EmailNotification): Promise<void>

// 3. Integrar con push notifications (Expo)
sendPushNotification(
  deviceToken: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<void>
```

---

### 5. **Contacto Visible Solo Después de Aceptación**

**En ClientHirings.tsx:**
```tsx
{item.accepted_status === 'accepted' && (item.professional_phone || item.professional_address) && (
  <View style={styles.contactSection}>
    <Text style={styles.contactLabel}>📍 Datos de contacto del trabajador:</Text>
    {/* Mostrar teléfono, dirección, email */}
  </View>
)}
```

**En ProfessionalJobs.tsx:**
```tsx
{item.client_contact_visible && (item.client_phone || item.client_address) && (
  <View style={styles.contactSection}>
    <Text style={styles.contactLabel}>📍 Datos de contacto compartidos:</Text>
    {/* Mostrar teléfono, dirección, email del cliente */}
  </View>
)}
```

**Estructura de datos necesaria en Supabase:**
```sql
-- Tabla hirings
ALTER TABLE hirings ADD COLUMN hire_message TEXT;
ALTER TABLE hirings ADD COLUMN accepted_status VARCHAR(20);
ALTER TABLE hirings ADD COLUMN professional_phone VARCHAR(20);
ALTER TABLE hirings ADD COLUMN professional_address TEXT;
ALTER TABLE hirings ADD COLUMN professional_email VARCHAR(100);

-- Tabla jobs (para profesionales)
ALTER TABLE jobs ADD COLUMN hire_message TEXT;
ALTER TABLE jobs ADD COLUMN client_contact_visible BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN client_phone VARCHAR(20);
ALTER TABLE jobs ADD COLUMN client_address TEXT;
ALTER TABLE jobs ADD COLUMN client_email VARCHAR(100);
```

---

## Flujo Completo de Contratación

### 1. Cliente envía solicitud:
- Cliente ve perfil del profesional
- Cliente presiona "Contratar"
- Se abre HireModal
- Cliente escribe mensaje (requerido)
- Cliente presiona "Enviar Solicitud"
- ✅ Toast: "Solicitud enviada al trabajador"
- 📧 Email al profesional (TODO)
- 🔔 Push notification al profesional (TODO)

### 2. Profesional recibe solicitud:
- Ve la solicitud en "Mis Trabajos" con estado "pending"
- Lee el mensaje del cliente
- **NO ve datos de contacto todavía**

### 3. Profesional acepta:
- Presiona "Aceptar"
- Estado cambia a "accepted"
- ✅ Toast: "Solicitud aceptada exitosamente"
- 📧 Email al cliente (TODO)
- 🔔 Notificación al cliente (TODO)
- **AHORA sí se comparten datos de contacto**

### 4. Trabajo en progreso:
- Ambos ven estado "in_progress"
- Cliente ve datos de contacto del profesional
- Profesional ve datos de contacto del cliente
- Pueden coordinarse directamente

### 5. Finalización:
- Profesional presiona "Solicitar Finalización"
- Estado cambia a "waiting_client_approval"
- Cliente recibe notificación
- Cliente presiona "Confirmar que está terminado"
- Estado cambia a "completed"
- ✅ Toast: "Trabajo marcado como completado"

---

## Próximos Pasos (TODO)

1. **Email Service Integration:**
   - Setup SendGrid o Resend
   - Implementar `sendEmailNotification()`
   - HTML templates para cada tipo de notificación

2. **Push Notifications:**
   - Expo Push Notifications
   - Almacenar device tokens en Supabase
   - Implementar `sendPushNotification()`

3. **Supabase Tablas:**
   - Crear tabla `notifications` para historial
   - Crear tabla `hirings_messages` para chat
   - Actualizar `jobs` y `hirings` con nuevos campos

4. **Real-time Updates:**
   - Supabase subscriptions para notificaciones en vivo
   - WebSocket para chat

5. **Integration en Componentes:**
   - Conectar handlers de ClientHirings/ProfessionalJobs
   - Reemplazar console.log() con llamadas reales a Supabase
   - Disparar notificaciones en cada acción

---

## Testing

### Test Toast:
```tsx
const { showToast } = useToast();

// Success
showToast('¡Excelente! Operación completada', 'success');

// Error
showToast('Hubo un error, intenta nuevamente', 'error');

// Warning
showToast('Este cambio es importante, ten cuidado', 'warning');

// Info
showToast('Nueva información disponible', 'info');
```

### Test Validación:
```tsx
import { validateEmail, validateHireMessage } from '../utils/validationMessages';

console.log(validateEmail('invalid')); // "Por favor ingresa un email válido"
console.log(validateHireMessage('hola')); // "El mensaje debe tener al menos 10 caracteres"
```

### Test HireModal:
- Abrir desde perfil de profesional
- Escribir menos de 10 caracteres → botón deshabilitado
- Escribir 10+ caracteres → botón habilitado
- Escribir más de 500 caracteres → truncado automáticamente
- Presionar Enviar → callback ejecuta

---

## Color Scheme

Colores utilizados para notificaciones:
- **Success**: `#10b981` (Verde)
- **Error**: `#ef4444` (Rojo)
- **Warning**: `#f59e0b` (Naranja)
- **Info**: `#3b82f6` (Azul)
- **Primary (Brand)**: `#6366f1` (Índigo)

---

## Archivos Creados/Modificados

### Creados:
- ✅ `components/Toast.tsx` - Componente de notificación
- ✅ `contexts/ToastContext.tsx` - Context provider
- ✅ `components/HireModal.tsx` - Modal de contratación
- ✅ `utils/validationMessages.ts` - Validadores en español
- ✅ `services/notificationService.ts` - Servicio de notificaciones

### Modificados:
- ✅ `app/_layout.tsx` - Integración de ToastProvider
- ✅ `components/ClientHirings.tsx` - Contacto visible post-aceptación
- ✅ `components/ProfessionalJobs.tsx` - HireModal + contacto compartido + notificaciones

---

## Notas Importantes

1. **Todos los TODO en el código** indican dónde integrar Supabase y servicios de email/push
2. **El sistema está diseñado para ser escalable** - fácil agregar más tipos de notificaciones
3. **Validación en dos capas**: Cliente (UI) + Servidor (Supabase)
4. **Los toasts son locales** - para notificaciones persistentes usar Supabase
5. **El HireModal requiere mensaje obligatorio** - no se puede contratar sin mensaje
