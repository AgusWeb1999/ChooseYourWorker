# 📁 Backend - Scripts SQL y Documentación

## 📚 Documentación Principal

### ✅ [README.md](./README.md)
Documentación general del backend y estructura del proyecto.

### ✅ [README-BIDIRECTIONAL-REVIEWS.md](./README-BIDIRECTIONAL-REVIEWS.md)
Sistema completo de calificaciones bidireccionales (Clientes ↔ Trabajadores).

---

## 🔧 Scripts SQL Esenciales

### 1. Configuración Inicial

#### `create-missing-functions.sql` ⭐
**Uso:** Primera vez o después de un reset
**Qué hace:**
- Crea función `check_email_available()` para validar emails
- Crea/actualiza trigger `handle_new_user()` para sincronizar usuarios
- Captura correctamente el tipo de usuario (cliente/trabajador)

```bash
# Ejecutar en: Supabase SQL Editor
```

#### `recreate-trigger-with-permissions.sql` 🔥
**Uso:** Si el trigger no funciona o hay problemas de permisos
**Qué hace:**
- Elimina y recrea completamente el trigger con permisos elevados
- Más robusto que `create-missing-functions.sql`

```bash
# Ejecutar si el registro no funciona correctamente
```

---

### 2. Diagnóstico y Mantenimiento

#### `verify-trigger-working.sql` 🔍
**Uso:** Verificar si el sistema está funcionando
**Qué hace:**
- Verifica que el trigger existe
- Muestra la definición de la función
- Verifica usuarios específicos

```bash
# Ejecutar para diagnosticar problemas
```

#### `diagnose-and-fix-users.sql` 🩹
**Uso:** Arreglar usuarios mal sincronizados
**Qué hace:**
- Diagnostica usuarios con tipo incorrecto
- Sincroniza automáticamente basándose en metadatos
- Verifica que quedaron correctos

```bash
# Ejecutar si usuarios antiguos tienen tipo incorrecto
```

#### `verificar-registro.sql` ✅
**Uso:** Verificar usuarios registrados
**Qué hace:**
- Muestra todos los usuarios con su tipo
- Cuenta usuarios por tipo
- Verifica correspondencia entre tablas

```bash
# Ejecutar para ver el estado actual de usuarios
```

---

### 3. Gestión de Conversaciones

#### `fix-conversations.sql` 💬
**Uso:** Arreglar sistema de chat
**Qué hace:**
- Crea/actualiza función `get_or_create_conversation()`
- Arregla foreign keys en tabla `conversations`
- Crea función `get_conversation_messages()`

```bash
# Ejecutar si el chat no funciona
```

---

### 4. Reset y Limpieza

#### `reset-all-clients.sql` ⚠️
**Uso:** Empezar de cero (PELIGROSO)
**Qué hace:**
- Elimina TODOS los clientes (no profesionales)
- Elimina reviews, mensajes, conversaciones
- Resetea ratings de profesionales

```bash
# ⚠️ PELIGROSO: Solo usar en desarrollo
# Mantiene profesionales, elimina todo lo demás
```

---

## 📖 Guías de Uso

### Para Empezar de Cero
1. Ejecutar `reset-all-clients.sql` (opcional)
2. Ejecutar `create-missing-functions.sql`
3. Registrar usuarios de prueba

### Si el Registro No Funciona
1. Ejecutar `verify-trigger-working.sql` (diagnóstico)
2. Ejecutar `recreate-trigger-with-permissions.sql` (arreglo)
3. Probar registro de nuevo
4. Si usuarios anteriores están mal: `diagnose-and-fix-users.sql`

### Si el Chat No Funciona
1. Ejecutar `fix-conversations.sql`
2. Probar enviar mensaje

### Para Verificar el Estado
1. Ejecutar `verificar-registro.sql`
2. Revisar que usuarios tengan el tipo correcto

---

## 🗂️ Estructura de la Base de Datos

### Tablas Principales
- `auth.users` - Usuarios de autenticación (Supabase Auth)
- `public.users` - Información de usuarios sincronizada
- `public.professionals` - Perfiles de trabajadores
- `public.reviews` - Calificaciones de clientes a trabajadores
- `public.client_reviews` - Calificaciones de trabajadores a clientes
- `public.conversations` - Conversaciones del chat
- `public.messages` - Mensajes del chat

### Triggers Activos
- `on_auth_user_created` - Sincroniza usuarios de auth a public
- Triggers de rating - Actualizan promedios automáticamente

### Funciones Importantes
- `check_email_available(p_email)` - Verifica disponibilidad de email
- `handle_new_user()` - Sincroniza usuarios automáticamente
- `get_or_create_conversation(p_user1_id, p_user2_id)` - Gestiona conversaciones
- `get_conversation_messages(p_conversation_id)` - Obtiene mensajes

---

## 🔒 Políticas RLS (Row Level Security)

Todas las tablas tienen políticas RLS habilitadas:
- **reviews**: Todos leen, solo clientes crean/editan sus propias
- **client_reviews**: Todos leen, solo profesionales crean/editan sus propias
- **conversations**: Solo participantes pueden ver/editar
- **messages**: Solo participantes de la conversación pueden ver/crear

---

## 🆘 Troubleshooting

### Problema: No puedo registrarme
**Solución:** Ejecutar `create-missing-functions.sql`

### Problema: Me registro como cliente siendo trabajador
**Solución:** 
1. Ejecutar `recreate-trigger-with-permissions.sql`
2. Ejecutar `diagnose-and-fix-users.sql` para arreglar usuarios existentes

### Problema: El chat no funciona
**Solución:** Ejecutar `fix-conversations.sql`

### Problema: Las calificaciones no se actualizan
**Solución:** Verificar que los triggers de rating existen (ver `create-missing-functions.sql`)

---

## 📝 Notas Importantes

- Todos los scripts son **idempotentes** (se pueden ejecutar múltiples veces)
- Los scripts usan `CREATE OR REPLACE` para no fallar si ya existen
- Siempre hay mensajes de verificación al final de cada script
- Los scripts de reset son **PELIGROSOS** y solo deben usarse en desarrollo

---

## 🎯 Scripts por Prioridad

### Alta Prioridad (Siempre Necesarios)
1. ✅ `create-missing-functions.sql`
2. ✅ `fix-conversations.sql`

### Media Prioridad (Según Necesidad)
3. 🔧 `diagnose-and-fix-users.sql`
4. 🔧 `verify-trigger-working.sql`
5. 🔧 `verificar-registro.sql`

### Baja Prioridad (Emergencias)
6. ⚠️ `recreate-trigger-with-permissions.sql`
7. ⚠️ `reset-all-clients.sql`

---

✅ **Sistema listo para usar en producción**
