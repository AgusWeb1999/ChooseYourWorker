# 📋 Especificación: Nuevo Flujo de Clientes WorkingGo

**Fecha:** 28 de enero de 2026  
**Versión:** 2.0  
**Estado:** En implementación

---

## 🎯 Objetivo

Simplificar el onboarding de clientes eliminando el registro obligatorio inicial y la navegación compleja de búsqueda. El cliente reporta un problema, el sistema hace el matching, y solo confirma una propuesta.

---

## 🔄 Flujo Visual

```
ENTRADA (home)
    ↓
[1] DESCRIBIR PROBLEMA
    - Campo de texto libre
    - Opcionalmente: foto/audio
    - Crear issue en estado "draft"
    ↓
[2] CUÁNDO LO NECESITAS
    - Botones: Ahora / Hoy / Esta semana
    - Guardar en issue
    - Trigger matching backend
    ↓
MATCHING AUTOMÁTICO (backend)
    ↓ (Pendiente) → Mostrar: "Buscando profesional ideal..."
    ↓ (Success) → Siguiente paso
    ↓
[3] VER PROPUESTA
    - Mostrar 1 profesional
    - Datos: quién es, cuándo puede ir, precio
    - Botones: Aceptar / Ver otra opción
    ↓
[4] REGISTRO MÍNIMO (si acepta)
    - Nombre
    - Teléfono O Email
    - Crear usuario
    - Asociar issue
    ↓
[5] CHAT & SEGUIMIENTO
    - Habilitar chat
    - Ver estado del trabajo
    - Recordatorios

```

---

## 📝 Estados del Issue

```
draft
  ↓
waiting_match (sistema buscando)
  ├→ matched (encontró profesional)
  │   ↓
  │  confirmed (cliente aceptó)
  │   ↓
  │  in_progress (trabajo en curso)
  │   ↓
  │  completed (finalizado)
  │
  └→ pending (no hay match inmediato)
       ↓
      (notificación futura cuando aparezca)
```

---

## 📊 Cambios por componente

### Frontend

**archivo: `index.html`**
- Cambiar sección hero y CTA
- Crear enlace a primer paso del flujo
- Eliminar card de "Buscar profesionales"
- Mantener card de profesionales (para workers)

**archivos nuevos:**
- `client/step-1-describe.html` - Describir problema
- `client/step-2-timing.html` - Cuándo lo necesita
- `client/step-3-proposal.html` - Ver propuesta
- `client/step-4-register.html` - Registro mínimo
- `client/step-5-chat.html` - Chat y seguimiento

### Backend (Supabase)

**Tabla: `issues`**
```sql
id (uuid)
client_id (uuid, nullable - permite draft sin usuario)
description (text)
attachments (json) - URLs de fotos/audios
timing (enum: 'now', 'today', 'this_week')
inferred_category (text) - detectado por IA
zone (text) - ubicación del cliente
state (enum: draft, waiting_match, matched, confirmed, in_progress, completed)
matched_professional_id (uuid, nullable)
created_at (timestamp)
updated_at (timestamp)
```

**Tabla: `issue_proposals`**
```sql
id (uuid)
issue_id (uuid)
professional_id (uuid)
proposed_timing (text)
estimated_price_range (jsonb) - {min, max}
status (enum: pending, accepted, rejected)
created_at (timestamp)
```

**Funciones/Triggers:**
- `trigger_matching()` - Cuando issue pasa a waiting_match
- `infer_category()` - Detectar rubro del texto
- `find_best_match()` - Algoritmo de matching (rubro, zona, score)

### API Endpoints necesarios

```
POST /api/issues
  - Crear issue (draft)
  - Sin auth requerida
  - Response: issue_id

PUT /api/issues/{id}
  - Actualizar timing (trigger matching)
  - Sin auth requerida
  - Body: { timing: 'now|today|this_week' }
  - Response: estado actualizado

GET /api/issues/{id}/proposal
  - Obtener propuesta matched
  - Sin auth requerida
  - Response: { professional, timing, price_range }

POST /api/issues/{id}/confirm
  - Confirmar propuesta + crear usuario
  - Sin auth requerida
  - Body: { name, phone_or_email }
  - Response: { user_id, token }

GET /api/issues/{id}/chat
  - Obtener mensajes
  - Con auth
```

---

## ✋ Cambios que NO se tocan

- ❌ Flujo de profesionales
- ❌ Sistema de pagos
- ❌ Lógica de ranking
- ❌ Diseño visual general (solo CTA y orden)

---

## 🔗 Frase clave

> "El cliente no busca profesionales, reporta un problema y confirma una solución."

---

## 📅 Fases de implementación

### Fase 1: Frontend + UX (esta semana)
- [ ] Modificar index.html con nuevo flujo
- [ ] Crear páginas de los 4 pasos
- [ ] Diseño responsive

### Fase 2: Backend (próxima semana)
- [ ] Crear tablas en Supabase
- [ ] Endpoints API
- [ ] Función de matching básica

### Fase 3: Testing
- [ ] Flujo completo cliente
- [ ] Edge cases (sin match, etc)

---

## 🎨 CTA cambios

**Antes:** "Buscar Profesionales"
**Después:** "Reportar un Problema"

**Frase:** "Describe qué necesitas, nosotros buscamos al profesional ideal"

