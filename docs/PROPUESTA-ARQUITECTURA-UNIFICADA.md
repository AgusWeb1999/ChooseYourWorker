# 🏗️ Propuesta: Arquitectura Unificada WorkingGo

## 📊 Situación Actual

### Flujo HTML (client/)
- **Sin autenticación previa**
- 5 pasos progresivos
- Experiencia rápida y directa
- Registro solo al final
- Permite probar antes de comprometerse

### Flujo React (frontend/app)
- **Requiere login/registro primero**
- Home con profesionales
- Chat, perfil, notificaciones
- Gestión de hires completa
- Todo con autenticación

## 🎯 Arquitectura Unificada Propuesta

### 1. **Nuevo Flujo de Entrada (Sin Autenticación)**

```
Landing Page (index.html - actual)
    ↓
Buscar Servicio (Sin Login)
    ↓
Ver Profesionales (Previews limitados)
    ↓
Seleccionar Profesional
    ↓
[AQUÍ SE SOLICITA LOGIN/REGISTRO]
    ↓
App React Autenticada
```

**Beneficios:**
- ✅ Los clientes exploran sin fricción
- ✅ Solo registran cuando realmente quieren contactar
- ✅ Reduce abandono en registro inicial

### 2. **Home Rediseñado: "Marketplace de Servicios"**

**Para Clientes:**
- Ver profesionales disponibles (actual)
- **NUEVO:** Ver "Solicitudes Abiertas" de otros clientes buscando servicios
- Publicar su propia solicitud de servicio

**Para Profesionales:**
- Ver sus hires/propuestas (actual)
- **NUEVO:** Ver "Solicitudes Abiertas" de clientes que buscan servicios
- Contactar a clientes directamente
- Enviar propuestas a solicitudes

**Diseño visual:**
```
┌─────────────────────────────────┐
│   🏠 Home WorkingGo             │
├─────────────────────────────────┤
│                                 │
│  👥 Profesionales Destacados    │
│  [Cards de profesionales]       │
│                                 │
│  📋 Solicitudes Abiertas        │
│  [Cards de clientes buscando]   │
│  - "Busco electricista"         │
│  - "Necesito plomero"           │
│  - Categoría, ubicación, etc    │
│                                 │
└─────────────────────────────────┘
```

### 3. **Estructura de Tablas (Sin Crear Nuevas)**

Usar las tablas existentes:

#### **Tabla: `hires`** (YA EXISTE)
```sql
- id
- client_id (quien busca el servicio)
- professional_id (quien acepta, PUEDE SER NULL al inicio)
- status: 
  * 'open_request' → NUEVO: Cliente publicó solicitud sin profesional asignado
  * 'pending' → Ya tiene profesional, esperando aceptación
  * 'in_progress' → Trabajo activo
  * 'completed' → Finalizado
  * 'cancelled' → Cancelado
- proposal_message (mensaje del cliente o profesional)
- created_at, updated_at
- started_at, completed_at
```

**Cambios mínimos:**
- ✅ Agregar estado `'open_request'`
- ✅ Permitir `professional_id = NULL` temporalmente
- ✅ Agregar índice en `status` para queries rápidas

#### **Tabla: `users`** (YA EXISTE)
Sin cambios necesarios

#### **Tabla: `professionals`** (YA EXISTE)  
Sin cambios necesarios

#### **Tabla: `notifications`** (YA EXISTE)
Sin cambios necesarios - ya maneja notificaciones de propuestas

### 4. **Flujo Completo Unificado**

#### **Caso A: Cliente busca profesional**
1. Landing → Busca categoría (sin login)
2. Ve profesionales (previews)
3. Selecciona uno → **Login/Registro**
4. Envía propuesta → Crea `hire` con status `pending`
5. Profesional acepta → Status `in_progress`
6. Se completa → Status `completed`

#### **Caso B: Cliente publica solicitud abierta**
1. Cliente logueado → Home
2. Click "Publicar Solicitud"
3. Describe necesidad
4. Se crea `hire` con `professional_id = NULL`, status `open_request`
5. Aparece en "Solicitudes Abiertas"
6. Profesionales ven y contactan
7. Cliente elige uno → Se asigna `professional_id`, status `pending`
8. Continúa flujo normal

#### **Caso C: Profesional busca trabajo**
1. Profesional logueado → Home
2. Ve "Solicitudes Abiertas"
3. Filtra por categoría/ubicación
4. Contacta al cliente (chat o propuesta)
5. Si acepta → Se asigna como `professional_id`, status `pending`
6. Continúa flujo normal

### 5. **Componentes a Migrar/Crear en React**

#### Migrar del HTML a React:
- ✅ `step-1-describe.html` → Componente `ServiceRequestForm`
- ✅ `step-2-timing.html` → Integrar en `ServiceRequestForm`
- ✅ `step-3-proposal.html` → Ya existe en React (`ProfessionalsList`)
- ✅ `step-4-register.html` → Ya existe (`register.tsx`)
- ✅ `step-5-chat.html` → Ya existe (`chat/[id].tsx`)

#### Nuevos Componentes:
- 📱 `OpenRequests.tsx` → Lista de solicitudes abiertas
- 📱 `OpenRequestCard.tsx` → Card individual de solicitud
- 📱 `PublishRequestModal.tsx` → Modal para publicar solicitud
- 📱 `UnifiedHome.tsx` → Home rediseñado

### 6. **Plan de Implementación por Fases**

#### **Fase 1: Preparación BD (1 día)**
```sql
-- Agregar nuevo status
ALTER TYPE hire_status ADD VALUE IF NOT EXISTS 'open_request';

-- Permitir professional_id NULL
ALTER TABLE hires ALTER COLUMN professional_id DROP NOT NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_hires_open_requests 
ON hires(status, created_at) WHERE status = 'open_request';

-- Nueva columna opcional (si quieres más info en solicitudes)
ALTER TABLE hires ADD COLUMN IF NOT EXISTS service_description TEXT;
ALTER TABLE hires ADD COLUMN IF NOT EXISTS service_category VARCHAR(100);
ALTER TABLE hires ADD COLUMN IF NOT EXISTS service_location VARCHAR(200);
```

#### **Fase 2: Componentes Nuevos (2-3 días)**
1. Crear `OpenRequests.tsx`
2. Crear `OpenRequestCard.tsx`
3. Crear `PublishRequestModal.tsx`
4. Integrar en `index.tsx` (Home)

#### **Fase 3: Migrar Flujo HTML a React (2-3 días)**
1. Crear `ServiceRequestForm.tsx` combinando step-1 y step-2
2. Adaptar `ProfessionalsList` para mostrar según categoría
3. Integrar flujo completo en app React
4. Agregar modal "Login/Registro" cuando se selecciona profesional

#### **Fase 4: Lógica de Negocio (2 días)**
1. APIs para crear solicitudes abiertas
2. APIs para que profesionales respondan a solicitudes
3. Actualizar sistema de notificaciones
4. Testing de flujos completos

#### **Fase 5: Mantener HTML como Opción Rápida (Opcional)**
- Dejar `index.html` como landing rápida
- Redirigir a app React después de explorar

### 7. **Queries Principales**

#### Ver Solicitudes Abiertas (Para Profesionales)
```typescript
const { data } = await supabase
  .from('hires')
  .select(`
    id, created_at, service_description, service_category, 
    service_location, proposal_message,
    client:client_id (full_name, city, phone)
  `)
  .eq('status', 'open_request')
  .order('created_at', { ascending: false });
```

#### Crear Solicitud Abierta
```typescript
const { data } = await supabase
  .from('hires')
  .insert({
    client_id: userId,
    professional_id: null,
    status: 'open_request',
    service_description: 'Necesito reparar mi baño...',
    service_category: 'Sanitario',
    service_location: 'Montevideo',
    proposal_message: 'Urgente, necesito cotización'
  });
```

#### Profesional Acepta Solicitud
```typescript
const { data } = await supabase
  .from('hires')
  .update({
    professional_id: professionalId,
    status: 'pending'
  })
  .eq('id', hireId)
  .eq('status', 'open_request'); // Solo si sigue abierta
```

### 8. **Ventajas de Esta Arquitectura**

✅ **Bajo costo de desarrollo:** Usa tablas existentes
✅ **Mejor UX:** Dos formas de conectar (cliente busca o profesional busca)
✅ **Mantiene funcionalidades:** Chats, notificaciones, reviews
✅ **Escalable:** Fácil agregar filtros, búsquedas, etc.
✅ **SEO:** Mantener HTML para landing rápida
✅ **Migración gradual:** Puedes hacer fase por fase

### 9. **Diseño de Interfaz Propuesta**

#### Home Unificado
```tsx
<View style={styles.container}>
  {/* Tabs superiores */}
  <View style={styles.tabs}>
    <Tab active={tab === 'professionals'}>Profesionales</Tab>
    <Tab active={tab === 'requests'}>Solicitudes</Tab>
  </View>

  {tab === 'professionals' && (
    <ProfessionalsList />
  )}

  {tab === 'requests' && (
    <>
      <Button onPress={openPublishModal}>
        Publicar mi solicitud
      </Button>
      <OpenRequestsList />
    </>
  )}
</View>
```

### 10. **Próximos Pasos Recomendados**

1. ✅ Revisar esta propuesta
2. ✅ Aprobar cambios en BD
3. ✅ Comenzar con Fase 1 (BD)
4. ✅ Crear componentes nuevos (Fase 2)
5. ✅ Migrar flujo HTML a React (Fase 3)
6. ✅ Testing completo antes de deploy

---

## 💡 Resumen Ejecutivo

**Problema:** Dos flujos separados (HTML sin login + React con login)

**Solución:** 
- Mantener exploración sin login (HTML o React)
- Centralizar todo en React después del login
- Home como "marketplace bidireccional"
- Sin crear tablas nuevas, solo agregar columnas opcionales
- Migración gradual y segura

**Impacto:**
- Mejor experiencia de usuario
- Mayor tasa de conversión
- Más oportunidades para profesionales
- Código más mantenible y escalable
