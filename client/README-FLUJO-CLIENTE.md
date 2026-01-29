# 🚀 Flujo de Cliente - WorkingGo

## 📋 Resumen de Cambios Recientes

### ✅ Problemas Solucionados
1. **Error de carga `config.js`**: Ahora la configuración de Supabase está incluida directamente en `step-3-proposal.html` como fallback
2. **Eliminada dependencia de archivo externo**: Ya no necesitas un servidor especial; el archivo HTML funciona mejor sin dependencias externas
3. **Mejor manejo de errores**: Si falla algo, verás logs claros en la consola del navegador

---

## 🏗️ Flujo Completo (Sin Registro Previo)

```
┌─────────────────────────────────────────────────────────┐
│ 1. DESCRIBIR PROBLEMA (step-1-describe.html)             │
│    • Campo de texto libre para describir el problema     │
│    • Seleccionar categoría (Sanitario, Electricista, etc)│
│    • Datos guardados en sessionStorage                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CUÁNDO LO NECESITAS (step-2-timing.html)              │
│    • Seleccionar urgencia: Ahora / Hoy / Esta semana    │
│    • Datos guardados junto con paso anterior            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. PROPUESTA DE PROFESIONAL (step-3-proposal.html)       │
│    • Sistema conecta a Supabase AUTOMÁTICAMENTE          │
│    • Busca profesionales de la categoría seleccionada   │
│    • Si hay pocos, completa con otros destacados (10+)  │
│    • Muestra: nombre, tarifa/h, tarifa/día, experiencia │
│    • Botón "Aceptar" o "Ver otra opción"               │
│    • REDIRIGE A REGISTRO SOLO SI ACEPTA LA PROPUESTA    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. REGISTRO (step-4-register.html)                       │
│    • Aparece SOLO si el cliente acepta una propuesta    │
│    • Datos mínimos requeridos (email, teléfono, nombre) │
│    • Una vez registrado, puede chatear                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. CHAT CON PROFESIONAL (step-5-chat.html)              │
│    • Conversación en tiempo real con el profesional     │
│    • Mostrar datos del profesional seleccionado         │
│    • Sistema de notificaciones (opcional)               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuración de Supabase

### Credenciales (ya integradas en `step-3-proposal.html`)

```javascript
// Dentro de step-3-proposal.html (línea ~15):
window.SUPABASE_CONFIG = {
  url: 'https://oeabhlewxekejmgrucrz.supabase.co',
  anonKey: 'sb_publishable_tyR1xlVRs68DuqQQf_r-cw_TcW3IuZ5'
};
```

**📌 Nota:** Si necesitas cambiar estas credenciales, edita directamente en `step-3-proposal.html`.

---

## 🧪 Cómo Probar Localmente

### **OPCIÓN 1: Sin servidor (Recomendado)**

Simplemente abre los archivos HTML en tu navegador. Para Chrome/Safari, haz click derecho:
- **Windows/Linux:** `Archivo → Abrir Archivo`
- **Mac:** `Archivo → Abrir`

O abre directamente desde la terminal:
```bash
# En macOS
open /Users/agusmazzini/Desktop/projectos/chooseYourWorker/client/step-1-describe.html

# En Linux
xdg-open /path/to/step-1-describe.html
```

⚠️ **Limitación**: Algunos navegadores pueden tener restricciones de CORS con sesiones locales. Si ves errores, usa la Opción 2.

---

### **OPCIÓN 2: Con servidor local (Si hay problemas de CORS)**

1. Abre la terminal en la carpeta del proyecto:
```bash
cd /Users/agusmazzini/Desktop/projectos/chooseYourWorker
```

2. Inicia un servidor Python simple:
```bash
python3 -m http.server 8000
```

3. Accede desde el navegador:
```
http://localhost:8000/client/step-1-describe.html
```

4. Para detener el servidor:
```
Control + C
```

---

## ✅ Flujo de Testing Recomendado

### **Paso 1: Verificar Conexión a Supabase**

Abre en el navegador:
```
http://localhost:8000/client/test-simple.html
```

En esta página puedes:
- ✅ Verificar que la biblioteca Supabase se cargó
- ✅ Verificar la configuración
- ✅ Probar conexión a la base de datos
- ✅ Buscar profesionales por categoría
- ✅ Ver logs de ejecución en tiempo real

**Acción:** Haz click en "Probar Conexión" y verifica que todo esté verde ✅

---

### **Paso 2: Flujo Completo del Cliente**

**URL Inicio:** `http://localhost:8000/client/step-1-describe.html`

**Datos de prueba:**
```
Paso 1:
- Problema: "Tengo un caño roto en el baño"
- Categoría: "Sanitario"

Paso 2:
- Urgencia: "Ahora"

Paso 3:
- Ver la propuesta de profesional
- Prueba "Ver otra opción" para cambiar
- Haz click en "Aceptar propuesta"

Paso 4:
- Completa: Email, Teléfono, Nombre
- Haz click en "Registrarse"

Paso 5:
- Deberías ver el chat con el profesional
```

---

## 🔍 Debugging y Logs

Si algo no funciona, abre la **Consola del Navegador** (F12 o Cmd+Option+J en Mac):

```javascript
// Ver logs de:
// ✅ Carga de configuración
// ✅ Inicialización de Supabase
// ✅ Búsqueda de profesionales
// ✅ Errores si los hay
```

---

## 📁 Archivos Clave

| Archivo | Función |
|---------|---------|
| `step-1-describe.html` | Cliente describe el problema |
| `step-2-timing.html` | Cliente selecciona urgencia |
| `step-3-proposal.html` | **PRINCIPAL** - Conecta a Supabase, muestra profesional |
| `step-4-register.html` | Cliente se registra (solo si acepta) |
| `step-5-chat.html` | Chat con profesional |
| `test-simple.html` | **TESTING** - Verifica conexión a Supabase |
| `config.js` | ⚠️ DEPRECATED - Ya no se usa (config está en HTML) |

---

## ⚙️ Variables Globales (sessionStorage)

El flujo usa `sessionStorage` para pasar datos entre páginas:

```javascript
// Paso 1
sessionStorage.setItem('clientProblem', 'Texto del problema');
sessionStorage.setItem('clientCategory', 'Sanitario');

// Paso 2
sessionStorage.setItem('clientUrgency', 'ahora');

// Paso 3
sessionStorage.setItem('selectedProfessional', JSON.stringify({
  id, full_name, hourly_rate, category, ...
}));

// Paso 4
sessionStorage.setItem('clientEmail', 'email@example.com');
sessionStorage.setItem('clientPhone', '555-1234');
sessionStorage.setItem('clientName', 'Juan Pérez');
```

---

## 🚨 Solución de Problemas

### Error: "Cannot read property 'createClient'"
→ La biblioteca Supabase no se cargó. Abre `test-simple.html` y verifica que Supabase está en verde ✅

### Error: "Invalid API key"
→ Las credenciales en `step-3-proposal.html` pueden ser incorrectas. Verifica en `test-simple.html` → "Probar Conexión"

### Error: "No se encuentra tabla 'professionals'"
→ La tabla no existe en Supabase o el nombre es diferente. Revisa en Supabase dashboard

### Los profesionales no se cargan
→ Abre `test-simple.html` → "Cargar Profesionales" para ver si hay datos en la BD

### "sessionStorage no definido"
→ Estás abriendo el archivo directamente. Usa el servidor local (Opción 2)

---

## 📊 Estadísticas de Profesionales

Para ver cuántos profesionales hay disponibles, abre `test-simple.html` y haz click en:
- "Test: Cargar Todos" → Ve el total
- "Test: Buscar por Categoría" → Ve los de una categoría específica

---

## 🎯 Próximos Pasos (Opcional)

- [ ] Agregar validación de email en paso 4
- [ ] Implementar sistema de pago real
- [ ] Agregar ratings/reviews de clientes
- [ ] Integrar notificaciones en tiempo real
- [ ] Agregar fotografías de profesionales
- [ ] Mejorar UI con animaciones

---

**Última actualización:** 2024
**Versión:** 2.0 (Sin registro previo, Supabase integrado)
