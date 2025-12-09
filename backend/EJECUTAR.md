# 🚀 Guía de Migración - WorkingGo Jobs System

## 📋 Archivos Disponibles

### Scripts de Migración:
- **`1-setup-inicial-sin-permisos.sql`** ⭐ **USAR ESTE** - Script principal, compatible con Supabase
- **`1-setup-inicial.sql`** - Script legacy (requiere SET ROLE postgres)
- **`4-migracion-jobs.sql`** - Para migrar bases de datos legacy

### Scripts de Validación:
- **`validar-migracion.sql`** - Verifica que todo se instaló correctamente
- **`verificar-registro.sql`** - Verifica el sistema de registro de usuarios
- **`verify-trigger-working.sql`** - Verifica que los triggers funcionen

### Scripts de Utilidad:
- **`3-utilidades.sql`** - Queries útiles para debugging
- **`reset-all-clients.sql`** - Resetea datos de clientes (CUIDADO)

---

## ✅ Ejecución Recomendada (Supabase Dashboard)

### Paso 1: Abrir SQL Editor

Accede a:
```
https://supabase.com/dashboard/project/kfqrubwmtknvjnucwyob/sql/new
```

### Paso 2: Ejecutar Migración Principal

1. **Abre el archivo:** `1-setup-inicial-sin-permisos.sql`
2. **Copia TODO el contenido** (524 líneas)
3. **Pégalo en el SQL Editor**
4. **Click en "Run"** (esquina superior derecha)
5. **Espera 5-10 segundos**

### Paso 3: Verificar Resultado

Deberías ver al final:

```
✅ Columnas agregadas correctamente
✅ Índices creados exitosamente
✅ Políticas RLS configuradas
```

Si ves estos 3 mensajes, **¡todo funcionó!** ✨

### Paso 4: Validar Instalación (Opcional)

1. **Abre una nueva query**
2. **Copia y ejecuta:** `validar-migracion.sql`
3. **Verifica** que todos los elementos muestren ✅

---

## 🔧 Opción Alternativa: Terminal con psql

Si tienes acceso directo a PostgreSQL:

```bash
# Desde el directorio backend/
cd /Users/agusmazzini/Desktop/projectos/chooseYourWorker/backend

# Ejecutar el script
psql "postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]" -f 1-setup-inicial-sin-permisos.sql
```

---

## 📊 ¿Qué Hace Este Script?

### 1. Sistema de Avatares
- Agrega `avatar_url` a `users` y `professionals`
- Permite subir fotos de perfil

### 2. Sistema de Jobs (Contrataciones)
- Crea tabla `jobs` con estados: pending, in_progress, completed, cancelled
- Agrega `jobs_completed` y `jobs_requested` en users
- Triggers automáticos para actualizar contadores

### 3. Sistema de Reviews Mejorado
- Agrega `job_id` a tabla `reviews` (opcional, para compatibilidad)
- Crea tabla `client_reviews` para que profesionales califiquen clientes
- Triggers para actualizar ratings automáticamente

### 4. Información de Contacto
- Agrega campo `phone` a professionals
- Se muestra solo DESPUÉS de contratar

### 5. Seguridad (RLS)
- Políticas para que cada usuario solo vea/edite sus datos
- Validación de relaciones cliente-profesional
- Protección contra accesos no autorizados

---

## ⚠️ Problemas Comunes

### ❌ Error: "permission denied for table"
**Solución:** Usa `1-setup-inicial-sin-permisos.sql` en lugar de `1-setup-inicial.sql`

### ❌ Error: "column already exists"
**Solución:** El script es idempotente, puedes ejecutarlo de nuevo sin problemas

### ❌ Error: "relation does not exist"
**Solución:** Asegúrate de que las tablas base (`users`, `professionals`) ya existen

---

## 🎯 Siguiente Paso

Una vez ejecutada la migración:

1. ✅ **Verifica** con `validar-migracion.sql`
2. ✅ **Prueba el frontend:** La UI en `app/professional/[id].tsx` ya está lista
3. ✅ **Crea un job de prueba:** Botón "Contratar"
4. ✅ **Completa el job:** Y verifica que se habiliten las reviews

---

## 📚 Documentación Adicional

- **`EJECUTAR-MIGRACION.md`** - Guía detallada paso a paso
- **`SCRIPTS-README.md`** - Descripción de todos los scripts
- **`README.md`** - Documentación general del backend

---

**¿Listo para ejecutar?** 🚀

1. Abre Supabase SQL Editor
2. Copia `1-setup-inicial-sin-permisos.sql`
3. Ejecuta
4. Verifica los 3 ✅

**¡Eso es todo!** ✨
SUPABASE_URL=https://[tu-proyecto].supabase.co
SUPABASE_SERVICE_KEY=[tu-service-key]
```

---

## ⚠️ IMPORTANTE: Orden de Ejecución

### Para bases de datos NUEVAS:
```
1. 1-setup-inicial.sql       ← Ejecutar primero
```

### Para bases de datos EXISTENTES:
```
1. 4-migracion-jobs.sql      ← Ejecutar primero (migra al nuevo sistema)
2. 2-reparacion.sql          ← Si hay problemas (opcional)
```

---

## ✅ Verificación Post-Ejecución

Después de ejecutar, verifica que se crearon:

### Nuevas Tablas:
```sql
SELECT * FROM public.jobs LIMIT 1;
SELECT * FROM public.client_reviews LIMIT 1;
```

### Nuevas Columnas en users:
```sql
SELECT phone, jobs_requested_count, rating, rating_count 
FROM public.users LIMIT 1;
```

### Nuevas Columnas en professionals:
```sql
SELECT completed_jobs_count 
FROM public.professionals LIMIT 1;
```

### Nueva columna en reviews:
```sql
SELECT job_id 
FROM public.reviews LIMIT 1;
```

---

## 🆘 Solución de Problemas

### Error: "relation already exists"
✅ Normal - el script usa `IF NOT EXISTS`

### Error: "column already exists"
✅ Normal - el script usa `ADD COLUMN IF NOT EXISTS`

### Error de permisos
❌ Asegúrate de usar el Service Role Key, no la Anon Key

### Otros errores
📝 Copia el mensaje de error completo y compártelo

---

## 📊 Próximos Pasos

Después de ejecutar exitosamente:

1. ✅ Verifica que el frontend compile sin errores
2. ✅ Prueba crear un job desde la app
3. ✅ Prueba finalizar un job
4. ✅ Prueba dejar una review después de completar
5. ✅ Verifica que los contadores se actualicen

---

**WorkingGo** - Sistema de Jobs listo para usar! 🚀
