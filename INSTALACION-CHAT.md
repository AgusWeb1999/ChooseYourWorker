# 🚀 Sistema de Chat - Guía de Instalación Rápida

> **⚠️ IMPORTANTE**: El script ha sido corregido para usar `full_name` de la tabla `users` y `display_name` de la tabla `professionals`. Si encuentras errores sobre columnas no existentes, consulta `CORRECCION-CHAT.md`.

## ✅ ¿Qué se implementó?

Sistema completo de mensajería interna con:
- Chat 1 a 1 entre clientes y trabajadores
- Mensajes en tiempo real
- Lista de conversaciones con contador de no leídos
- Integración desde perfil de profesional
- Políticas de seguridad RLS completas

---

## 📋 Pasos de Instalación

### 1️⃣ Backend (Supabase)

#### A. Ejecutar Script SQL Principal

1. Abre Supabase Dashboard
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `backend/create-chat-system.sql`
4. Ejecuta el script (Run)
5. Verifica que aparezcan mensajes de éxito

**Script ejecuta:**
- ✅ Crea tabla `conversations`
- ✅ Crea tabla `messages`
- ✅ Crea índices de performance
- ✅ Crea función `get_or_create_conversation()`
- ✅ Crea trigger `update_conversation_timestamp`
- ✅ Configura políticas RLS
- ✅ Crea vista `conversation_list`

#### B. Habilitar Realtime (IMPORTANTE)

1. En Supabase Dashboard, ve a **Database → Replication**
2. Busca la tabla `messages`
3. **Habilita Realtime** marcando el checkbox
4. Click en **Save**

Sin este paso, los mensajes no se actualizarán en tiempo real.

#### C. Verificar Instalación (Opcional)

```bash
# Ejecutar script de verificación en SQL Editor
backend/verify-chat-system.sql
```

Este script verifica:
- Tablas creadas correctamente
- Funciones disponibles
- Triggers activos
- Políticas RLS configuradas
- Índices presentes

---

### 2️⃣ Frontend (React Native)

#### A. Archivos Creados

Los siguientes archivos ya están creados y listos:

```
✅ frontend/app/chat/[id].tsx              # Pantalla de chat individual
✅ frontend/app/(tabs)/messages.tsx        # Tab de lista de conversaciones
✅ frontend/app/(tabs)/_layout.tsx         # Actualizado con tab de mensajes
✅ frontend/app/professional/[id].tsx      # Actualizado con botón de mensaje
```

#### B. Verificar Dependencias

Todas las dependencias necesarias ya están instaladas:
- ✅ `@supabase/supabase-js`
- ✅ `expo-router`
- ✅ `react-native`

#### C. Reiniciar App

```bash
cd frontend

# Limpiar caché
npx expo start -c

# O simplemente
npx expo start
```

---

## 🧪 Testing del Sistema

### Test 1: Crear Conversación Nueva

1. Abre la app
2. Ve a **Home** (tab inferior)
3. Selecciona un **profesional**
4. Presiona el botón **"Enviar Mensaje"** (azul)
5. Verifica que se abre la pantalla de chat
6. Escribe un mensaje y envía
7. ✅ El mensaje debe aparecer inmediatamente

### Test 2: Ver Lista de Conversaciones

1. Ve al tab **"Mensajes"** (icono de burbujas)
2. Verifica que aparece la conversación recién creada
3. Debe mostrar:
   - Nombre del otro usuario
   - Su profesión (si es trabajador)
   - Preview del último mensaje
   - Timestamp formateado
4. ✅ Pull to refresh debe funcionar

### Test 3: Chat en Tiempo Real

**Necesitas dos dispositivos o usar web + móvil:**

1. Dispositivo A: Abre conversación
2. Dispositivo B: Abre la misma conversación
3. Dispositivo A: Envía mensaje
4. ✅ Dispositivo B debe recibir el mensaje instantáneamente sin refrescar

### Test 4: Mensajes No Leídos

1. Usuario A envía 3 mensajes a Usuario B
2. Usuario B aún no abre la conversación
3. En la lista de mensajes de B:
   - ✅ Debe aparecer badge rojo con "3"
   - ✅ El mensaje debe estar en **negrita**
4. Usuario B abre la conversación
5. ✅ El badge debe desaparecer
6. ✅ El mensaje ya no está en negrita

### Test 5: Iniciar Chat desde Perfil

1. Como **cliente**, busca un trabajador
2. Abre su perfil
3. Verifica que aparecen 3 botones:
   - 📱 **Enviar Mensaje** (azul)
   - 💬 **WhatsApp** (verde)
   - 📞 **Llamar** (azul oscuro)
4. Presiona **Enviar Mensaje**
5. ✅ Debe abrir el chat directamente

---

## 🔧 Troubleshooting

### ❌ Problema: "RPC function not found"

**Causa**: No se ejecutó el script SQL del backend.

**Solución**:
```sql
-- Ejecutar en SQL Editor de Supabase
backend/create-chat-system.sql
```

---

### ❌ Problema: Los mensajes no se actualizan en tiempo real

**Causa**: Realtime no está habilitado en la tabla `messages`.

**Solución**:
1. Supabase Dashboard → **Database → Replication**
2. Buscar tabla `messages`
3. ✅ Marcar checkbox **Enable Realtime**
4. Click **Save**
5. Reiniciar la app

---

### ❌ Problema: "Cannot read property 'id' of null"

**Causa**: Usuario no está autenticado.

**Solución**:
1. Cerrar sesión
2. Volver a iniciar sesión
3. Verificar que `useAuth()` retorna el usuario

---

### ❌ Problema: No veo conversaciones de otros usuarios

**Causa**: Políticas RLS mal configuradas.

**Solución**:
```sql
-- Re-ejecutar las políticas RLS del script
backend/create-chat-system.sql

-- Específicamente la sección 6: POLÍTICAS RLS
```

---

### ❌ Problema: Error de TypeScript en IconSymbol

**Causa**: Import faltante.

**Solución**:
```typescript
// Agregar en el archivo que falla
import { IconSymbol } from '@/components/ui/icon-symbol';
```

---

### ❌ Problema: El teclado tapa el input en iOS

**Causa**: Ya está solucionado con KeyboardAvoidingView.

**Si persiste**:
```typescript
// Ajustar el keyboardVerticalOffset
<KeyboardAvoidingView
  keyboardVerticalOffset={120} // Aumentar este valor
>
```

---

## 📊 Verificación de Estado

### Backend (Supabase)

```sql
-- Ejecutar en SQL Editor para ver estadísticas
SELECT 
    'Conversaciones' as tipo,
    COUNT(*) as total
FROM conversations

UNION ALL

SELECT 
    'Mensajes' as tipo,
    COUNT(*) as total
FROM messages;
```

### Frontend (React Native)

```bash
# Ver logs de la app
npx expo start

# En la consola, verifica que no haya errores
# Debería aparecer:
# ✅ Loaded conversations
# ✅ Subscribed to messages channel
# ✅ Message sent successfully
```

---

## 🎯 Próximos Pasos

Una vez que el sistema de chat esté funcionando, puedes implementar:

1. **Fotos de perfil**
   - Subir avatar en perfil de usuario
   - Mostrar en lista de conversaciones y chat

2. **Indicador "escribiendo..."**
   - Mostrar cuando el otro usuario está escribiendo
   - Usar Supabase Presence

3. **Envío de imágenes**
   - Integrar con Supabase Storage
   - Galería de imágenes en chat

4. **Notificaciones Push**
   - Configurar Expo Push Notifications
   - Enviar cuando llegue mensaje nuevo

5. **Búsqueda en conversaciones**
   - Buscar por nombre de usuario
   - Buscar en contenido de mensajes

---

## 📚 Documentación Completa

Para más detalles, revisa:

- 📄 **Backend**: `backend/README-CHAT-SYSTEM.md`
  - Estructura de base de datos
  - Funciones y triggers
  - Políticas RLS
  - Uso desde frontend

- 📄 **Frontend**: `frontend/README-CHAT-SYSTEM.md`
  - Componentes detallados
  - Flujo de usuario
  - Diseño UI/UX
  - APIs de Supabase

---

## ✅ Checklist Final

Antes de considerar el sistema completo, verifica:

### Backend
- [ ] Script SQL ejecutado sin errores
- [ ] Tabla `conversations` existe
- [ ] Tabla `messages` existe
- [ ] Función `get_or_create_conversation` existe
- [ ] Políticas RLS configuradas
- [ ] Realtime habilitado en tabla `messages`

### Frontend
- [ ] Tab "Mensajes" aparece en navegación
- [ ] Botón "Enviar Mensaje" en perfil de profesional
- [ ] Pantalla de chat se abre correctamente
- [ ] Mensajes se envían sin errores
- [ ] Mensajes se reciben en tiempo real
- [ ] Contador de no leídos funciona
- [ ] No hay errores de TypeScript

### UX
- [ ] El diseño se ve bien en iOS y Android
- [ ] El teclado no tapa el input
- [ ] Los mensajes hacen scroll automático
- [ ] Los timestamps están bien formateados
- [ ] El estado vacío se ve bien
- [ ] Pull to refresh funciona

---

## 🎉 ¡Listo!

Si completaste todos los pasos y los tests pasaron, tu sistema de chat está **100% funcional**.

**¿Problemas?** Revisa el troubleshooting o los READMEs detallados.

**¿Todo bien?** Puedes pasar al siguiente feature: fotos de perfil, dashboard, o mejoras en Explore.

---

**Última actualización**: 25 de noviembre de 2025
