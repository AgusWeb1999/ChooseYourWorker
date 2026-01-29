# 🧪 Guía de Testing - Nuevo Flujo de Clientes

## 📋 Instrucciones para probar el nuevo flujo en LOCAL

### 1️⃣ **Asegúrate de que el servidor esté corriendo**

```bash
# El servidor debe estar en puerto 8000
http://localhost:8000
```

Si no está corriendo:
```bash
cd /Users/agusmazzini/Desktop/projectos/chooseYourWorker
python3 -m http.server 8000
```

---

## 🚀 **Flujo completo de cliente**

### **PASO 1: Describir el problema**
**URL:** `http://localhost:8000/client/step-1-describe.html`

**Qué probar:**
- ✅ Campo de texto libre (obligatorio)
- ✅ Opción de subir foto/audio (opcional)
- ✅ Seleccionar categoría (Sanitario, Electricista, Plomero, etc.)
- ✅ Botón "Siguiente" deshabilitado hasta llenar el campo
- ✅ Los datos se guardan en `sessionStorage`

**Datos de prueba:**
```
Problema: "Tengo un caño roto en el baño y pierde agua constantemente"
Categoría: "Sanitario"
```

---

### **PASO 2: Cuándo lo necesitas**
**URL:** `http://localhost:8000/client/step-2-timing.html`

**Qué probar:**
- ✅ 3 opciones de tiempo: Ahora / Hoy / Esta semana
- ✅ Seleccionar una opción marca visualmente
- ✅ Botón siguiente se habilita al seleccionar
- ✅ Los datos se guardan junto con el problema anterior

**Opciones:**
- ⚡ Ahora (urgente)
- ☀️ Hoy
- 📅 Esta semana

---

### **PASO 3: Ver propuesta (DATOS REALES DE SUPABASE)**
**URL:** `http://localhost:8000/client/step-3-proposal.html`

**Qué probar:**
- ✅ **Datos REALES** traídos de Supabase (tabla `professionals`)
- ✅ Nombre del profesional
- ✅ Categoría / especialidad
- ✅ Rating y número de trabajos
- ✅ Rango de precio
- ✅ Ciudad donde opera
- ✅ Bio/descripción
- ✅ Botón "Aceptar" y "Ver otra opción"
- ✅ **NUEVO:** El botón "Ver otra opción" ahora carga profesionales REALES de la lista
- ✅ **NUEVO:** Mostrar contador de opciones (Ej: "Opción 1 de 5")
- ✅ **NUEVO:** Si no hay profesionales, mostrar mensaje "Buscando..."

**Datos esperados:**
- Profesionales suscritos en tu base de datos
- Ordenados por rating (mejor primero)
- Mostrar avatar por defecto si no hay foto
- Fallback a lista mock si Supabase falla

**Mejoras implementadas:**
- 🔧 Corregido error de scope de `currentProfessionalIndex` (ahora es `window.step3State.currentProfessionalIndex`)
- 🔄 "Ver otra opción" itera sobre todos los profesionales cargados, no solo los mock
- 📊 Contador de opciones disponibles
- ⚠️ Mejor manejo de errores y fallback

---

### **🧪 Testing Step 3 avanzado**
**URL:** `http://localhost:8000/client/test-step-3.html`

Esta página de testing permite validar que step-3 funcione correctamente:

**Qué hace:**
1. Configura un cliente con categoría y descripción
2. Abre Step 3 en una nueva pestaña
3. Verifica que `window.step3State` esté definido correctamente
4. Verifica que los datos se carguen en sessionStorage
5. Muestra logs de consola para debugging

**Pasos para usar:**
1. Abre `test-step-3.html` en el navegador
2. Selecciona una categoría (Ej: "Sanitario")
3. Ingresa una descripción del problema
4. Click "Guardar datos del cliente"
5. Click "Abrir Step 3" (se abrirá en nueva pestaña)
6. Espera a que cargue (verá "Buscando...")
7. Vuelve a `test-step-3.html` y click "Verificar estado"
8. Deberías ver la lista de profesionales cargados

**Console logs esperados:**
```
📍 Step-3: Buscando profesionales en categoría: Sanitario
✅ Profesionales desde Supabase: 5
✅ Propuesta inicial cargada: Carlos Rodríguez
🔄 Siguiente opción: Miguel Torres (2/5)
```

---

### **📦 Estado global de Step 3**

El estado se guarda en `window.step3State`:

```javascript
{
  allProfessionals: [
    { id: 'prof_1', display_name: 'Carlos', rating: 4.9, ... },
    { id: 'prof_2', display_name: 'Miguel', rating: 4.7, ... },
    ...
  ],
  currentProfessionalIndex: 0,      // Índice actual
  clientCategory: 'Sanitario',      // Categoría del cliente
  isLoading: false,                 // Si está cargando
  hasError: false                   // Si hubo error
}
```

---

### **PASO 4: Registro mínimo**
**URL:** `http://localhost:8000/client/step-4-register.html`

**Qué probar:**
- ✅ Solo 3 campos: Nombre, email o teléfono
- ✅ Sin contraseña
- ✅ Sin validación de email
- ✅ Botón registrarse crea usuario mínimo
- ✅ Error handling si falla

**Nota:** En local, el usuario se crea en el navegador (sessionStorage). En producción, irá a Supabase.

---

### **PASO 5: Chat y seguimiento**
**URL:** `http://localhost:8000/client/step-5-chat.html`

**Qué probar:**
- ✅ Mensajes enviados/recibidos
- ✅ Estados del trabajo (Coordinando, En curso)
- ✅ Información del profesional en header
- ✅ Auto-scroll de mensajes
- ✅ Enviar con Enter o botón

---

## 🔌 **Integración con Supabase**

### **Archivo de configuración:**
- **Ubicación:** `client/supabase-config.js`
- **Funciones disponibles:**
  ```javascript
  window.WorkingGoSupabase.fetchProfessionals()
  window.WorkingGoSupabase.fetchProfessionalsByCategory(category)
  window.WorkingGoSupabase.fetchProfessionalsByCity(city)
  window.WorkingGoSupabase.createClientIssue(issueData)
  window.WorkingGoSupabase.updateIssueStatus(issueId, updates)
  ```

### **Base de datos Supabase:**
- **Tabla:** `professionals`
- **Campos usados:**
  - `id`, `display_name`, `category`, `hourly_rate`
  - `bio`, `avatar_url`, `rating`, `reviews_count`
  - `city`, `is_active`

---

## 📊 **Mock Data vs Datos Reales**

| Aspecto | Mock | Real |
|---------|------|------|
| **Paso 1-2** | ✅ Mock en navegador | ✅ Mock en navegador |
| **Paso 3** | ✅ Mock datos | ✅ **Supabase!** |
| **Paso 4** | ✅ Mock (localStorage) | 🔄 Will use Supabase.auth |
| **Paso 5** | ✅ Demo messages | 🔄 Will use Realtime |

---

## 🧪 **Checklist de Testing**

### **Navegación:**
- [ ] Botón "Atrás" funciona en todos los pasos
- [ ] Botón "Siguiente" solo se habilita con datos válidos
- [ ] Los datos persisten entre pasos

### **Datos:**
- [ ] Paso 1: El problema se guarda (abrir DevTools > Application > SessionStorage)
- [ ] Paso 2: El timing se guarda
- [ ] Paso 3: Se traen profesionales REALES de Supabase
- [ ] Paso 4: El usuario se guarda en localStorage

### **UX/UI:**
- [ ] Responsive en mobile (F12 > Toggle Device Toolbar)
- [ ] Animaciones funcionan suavemente
- [ ] Colores y gradientes se ven bien
- [ ] Texto legible en todos los tamaños

### **Error Handling:**
- [ ] Si no hay profesionales, mostrar mensaje claro
- [ ] Si Supabase no está disponible, usar mock data
- [ ] Sin crashes en consola

---

## 🐛 **Debugging**

### **Abrir DevTools:**
```
Mac: Cmd + Option + I
Win/Linux: Ctrl + Shift + I
```

### **Ver SessionStorage:**
```
DevTools > Application > SessionStorage > http://localhost:8000
```

### **Ver Supabase calls:**
```
DevTools > Network > Fetch/XHR
```

### **Ver errores:**
```
DevTools > Console
```

---

## 📝 **Notas importantes**

1. **Supabase en local**: Los datos se traen de la instancia de Supabase en la nube
2. **Sin autenticación real**: En local usamos mock users, en producción usaremos Supabase Auth
3. **Sin notificaciones**: Las notificaciones reales irán por WebSocket (Realtime de Supabase)
4. **Sin pagos**: Sistema de pagos NO está implementado en this MVP

---

## 🚀 **Próximos pasos**

Una vez que verifiques que TODO funciona:

1. ✅ Integrar autenticación real de Supabase (Paso 4)
2. ✅ Implementar WebSocket para chat en vivo (Paso 5)
3. ✅ Crear tabla `issues` para almacenar problemas
4. ✅ Implementar algoritmo de matching automático (backend)
5. ✅ Sistema de notificaciones en tiempo real

---

¡**Que comience el testing!** 🎉
