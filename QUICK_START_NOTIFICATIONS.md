# Guía Rápida - Integración de Notificaciones

## Ejemplos de Uso Inmediato

### 1. Usar Toast en un Formulario

```tsx
import { useState } from 'react';
import { TextInput, TouchableOpacity, Text, View } from 'react-native';
import { useToast } from '../contexts/ToastContext';
import { validateEmail, validationMessages } from '../utils/validationMessages';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { showToast } = useToast();

  const handleLogin = async () => {
    // Validar email
    const emailError = validateEmail(email);
    if (emailError) {
      showToast(emailError, 'error'); // Ya en español
      return;
    }

    // Validar password
    if (!password) {
      showToast(validationMessages.password.required, 'error');
      return;
    }

    try {
      // TODO: Llamar a tu API de login
      showToast(validationMessages.auth.loginSuccess, 'success');
    } catch (error) {
      showToast(validationMessages.general.error, 'error');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity onPress={handleLogin}>
        <Text>Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

### 2. Usar HireModal en Perfil de Profesional

```tsx
import { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { HireModal } from '../components/HireModal';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../src/lib/supabase';

export function ProfessionalProfile({ professional }) {
  const [hireModalVisible, setHireModalVisible] = useState(false);
  const { showToast } = useToast();

  const handleHireConfirm = async (message: string) => {
    try {
      // TODO: Crear hiring en Supabase
      const { error } = await supabase.from('hirings').insert({
        professional_id: professional.id,
        hire_message: message,
        status: 'pending',
        accepted_status: 'pending_acceptance',
        // ... otros campos
      });

      if (error) throw error;

      // TODO: Enviar notificación al profesional
      // await notificationService.sendNotification(...)

      // TODO: Enviar email al profesional
      // await emailService.sendEmail(...)

      setHireModalVisible(false);
      // Toast ya se muestra automáticamente en HireModal
    } catch (error) {
      showToast('Error al enviar solicitud', 'error');
      throw error;
    }
  };

  return (
    <View>
      <Text style={{ fontSize: 24 }}>{professional.name}</Text>
      <Text>{professional.specialty}</Text>

      <TouchableOpacity 
        style={{ backgroundColor: '#6366f1', padding: 12, borderRadius: 8 }}
        onPress={() => setHireModalVisible(true)}
      >
        <Text style={{ color: '#fff' }}>Contratar</Text>
      </TouchableOpacity>

      <HireModal
        visible={hireModalVisible}
        professional={{
          id: professional.id,
          name: professional.name,
          specialty: professional.specialty,
          rate: professional.hourly_rate,
        }}
        onConfirm={handleHireConfirm}
        onCancel={() => setHireModalVisible(false)}
      />
    </View>
  );
}
```

---

### 3. Mostrar/Ocultar Contacto Basado en Estado

```tsx
// En ClientHirings.tsx - ya implementado

function renderHiring({ item }: { item: Hiring }) {
  return (
    <View style={styles.card}>
      {/* ... otros contenidos ... */}

      {/* Mostrar contacto SOLO si fue aceptado */}
      {item.accepted_status === 'accepted' && (
        <View style={styles.contactSection}>
          <Text style={styles.contactLabel}>📍 Datos de contacto del trabajador:</Text>
          <View style={styles.contactRow}>
            <Text>📱 {item.professional_phone}</Text>
          </View>
          <View style={styles.contactRow}>
            <Text>📍 {item.professional_address}</Text>
          </View>
        </View>
      )}

      {/* Mostrar mensaje de espera si aún no se aceptó */}
      {item.accepted_status === 'pending_acceptance' && (
        <View style={styles.waitingBox}>
          <Text>⏳ Esperando que el trabajador acepte la solicitud...</Text>
        </View>
      )}
    </View>
  );
}
```

---

### 4. Conectar Handlers con Notificaciones

```tsx
// En ProfessionalJobs.tsx - ejemplo completo

import { createNotification, notificationTemplates } from '../services/notificationService';

async function handleAcceptJob(jobId: string) {
  try {
    const job = jobs.find(j => j.id === jobId);
    if (!job) throw new Error('Job not found');

    // 1. Actualizar Supabase
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'accepted' })
      .eq('id', jobId);

    if (error) throw error;

    // 2. Crear notificación
    const notification = createNotification(
      'solicitud_aceptada',
      job.client_id,                    // Destinatario
      job.professional_id,              // Quien envía
      'Trabajador',                      // Nombre de quien envía
      notificationTemplates.solicitudAceptada(job.professional_name).title,
      notificationTemplates.solicitudAceptada(job.professional_name).message,
      jobId,
      'job'
    );

    // 3. Guardar notificación en Supabase (TODO)
    // await supabase.from('notifications').insert(notification);

    // 4. Enviar email (TODO)
    // await sendEmailNotification(notification, job.client_email);

    // 5. Enviar push (TODO)
    // await sendPushNotification(job.client_device_token, ...);

    // 6. Mostrar toast local
    showToast('Solicitud aceptada exitosamente', 'success');

    // 7. Actualizar UI
    setJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, status: 'accepted' } : j
    ));

  } catch (error) {
    console.error('Error:', error);
    showToast('Error al aceptar la solicitud', 'error');
  }
}
```

---

### 5. Template de Email (Generado Automáticamente)

```tsx
import { generateEmailHTML, notificationTemplates } from '../services/notificationService';

// Generar HTML del email automáticamente
const template = notificationTemplates.solicitudAceptada('Juan García');
const htmlContent = generateEmailHTML(
  template.title,
  template.message,
  'https://app.chooseyourworker.com/jobs/123', // Deep link
  'Ver solicitud',
  'María'
);

// Resultado: Email hermoso con branding de la app
// - Header con logo
// - Mensaje personalizado
// - Botón de call-to-action
// - Footer con info de copyright
```

---

## Checklist de Integración

### Fase 1: Lo Básico (Ya implementado ✅)
- [x] Toast notification system
- [x] Validación en español
- [x] HireModal con validación
- [x] Estructura de notificationService
- [x] Contacto visible post-aceptación

### Fase 2: Backend (TODO)
- [ ] Crear tabla `notifications` en Supabase
- [ ] Integrar SendGrid/Resend para emails
- [ ] Integrar Expo Push Notifications
- [ ] Reemplazar console.log() con Supabase calls
- [ ] Crear API endpoints para notificaciones

### Fase 3: Real-time (TODO)
- [ ] Supabase subscriptions en notificationService
- [ ] WebSocket para chat en vivo
- [ ] Update badge de notificaciones no leídas
- [ ] Sound/vibration en push notifications

### Fase 4: Polish (TODO)
- [ ] Notification history screen
- [ ] Mark as read functionality
- [ ] Notification preferences/settings
- [ ] Testing e2e de flujo completo

---

## Mensajes de Validación Disponibles

```javascript
// Email
validationMessages.email.required        // "El email es requerido"
validationMessages.email.invalid         // "Por favor ingresa un email válido"

// Password
validationMessages.password.required      // "La contraseña es requerida"
validationMessages.password.tooShort      // "Mínimo 6 caracteres"
validationMessages.password.missingNumber // "Debe contener números"

// Hire Message
validationMessages.message.required       // "Debes escribir un mensaje"
validationMessages.message.tooShort       // "Mínimo 10 caracteres"
validationMessages.message.tooLong        // "Máximo 500 caracteres"

// Hire operations
validationMessages.hire.messageSent       // "Solicitud enviada al trabajador"
validationMessages.hire.acceptedSuccess   // "Solicitud aceptada exitosamente"
validationMessages.hire.completionRequested // "Solicitud de finalización enviada"

// Auth
validationMessages.auth.loginSuccess      // "Sesión iniciada exitosamente"
validationMessages.auth.logoutSuccess     // "Sesión cerrada exitosamente"
```

---

## Tips & Tricks

### 1. Custom Toast Duration
```tsx
showToast('Mensaje corto', 'info', 1000);      // 1 segundo
showToast('Mensaje largo', 'info', 5000);      // 5 segundos
```

### 2. Validación Rápida
```tsx
import * as validations from '../utils/validationMessages';

// En lugar de escribir el mensaje manualmente:
showToast(validations.validationMessages.password.tooShort, 'error');

// Usar la función de validación:
const error = validations.validatePassword(password);
if (error) showToast(error, 'error');
```

### 3. Crear Notificación Personalizada
```tsx
const customNotification = createNotification(
  'solicitud_enviada',
  'user_123',
  'pro_456',
  'Juan García',
  '¡Juan García quiere contratar tus servicios!',
  'Revisa el mensaje que dejó para ti',
  'hiring_789',
  'hiring'
);

// Luego guardar en Supabase y enviar email
```

### 4. Email Personalizado
```tsx
const emailNotif = createEmailNotification(
  notification,
  'user@example.com',
  'Nueva solicitud de contratación',
  generateEmailHTML(title, message, deepLink, 'Ver solicitud', 'Juan'),
  'Nueva solicitud de contratación - ...'
);
```

---

## Troubleshooting

### Toast no aparece
- Verificar que `ToastProvider` wrappea `RootLayoutNav` en `_layout.tsx`
- Verificar que `useToast()` está siendo llamado dentro de un componente envuelto por el provider

### Validación no funciona
- Importar la función correcta: `import { validateEmail } from '../utils/validationMessages'`
- Verificar que se está llamando ANTES de mostrar el toast
- Verificar que el mensaje de error está en español (check en validationMessages.ts)

### HireModal no abre
- Verificar que `hireModalVisible` state está en `true`
- Verificar que el componente padre está pasando `visible` prop correctamente
- Verificar que `onCancel` callback está actualizando el estado

### Notificaciones no se envían
- Verificar console.log() - aún no está integrado con Supabase/email
- Todos los `// TODO:` en notificationService.ts necesitan implementación backend
- Una vez implementado, quitar console.log() y descomentar llamadas a APIs

---

## Estructura de Datos Necesaria

```sql
-- Tabla de notificaciones (crear en Supabase)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_name VARCHAR(100),
  title VARCHAR(255),
  message TEXT,
  related_id UUID,
  related_type VARCHAR(50),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

-- Actualizar tabla hirings
ALTER TABLE hirings ADD COLUMN hire_message TEXT;
ALTER TABLE hirings ADD COLUMN accepted_status VARCHAR(20);

-- Actualizar tabla jobs
ALTER TABLE jobs ADD COLUMN hire_message TEXT;
ALTER TABLE jobs ADD COLUMN client_contact_visible BOOLEAN DEFAULT FALSE;
```

---

## Próximos Features

1. **Notification Bell con Badge**
   - Badge rojo mostrando cantidad de notificaciones no leídas

2. **Notification Center**
   - Pantalla dedicada para ver historial de notificaciones
   - Marcar como leído
   - Eliminar notificaciones

3. **Do Not Disturb**
   - Silenciar notificaciones en horarios específicos
   - Preferencias por tipo de notificación

4. **Chat en Vivo**
   - Mensajes en tiempo real entre cliente y profesional
   - Ya con datos de contacto compartidos

5. **Rating & Reviews**
   - Sistema de calificaciones post-trabajo
   - Reviews públicas en perfil

---

**¡Listo para empezar a integrar! 🚀**
