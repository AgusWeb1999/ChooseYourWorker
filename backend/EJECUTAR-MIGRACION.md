# 🚀 Guía de Ejecución de Migración - WorkingGo

## ✅ Pre-requisitos

Antes de ejecutar la migración, asegúrate de:
- [ ] Tener acceso al dashboard de Supabase
- [ ] Tener un backup de la base de datos (opcional pero recomendado)
- [ ] Estar en el proyecto correcto: `kfqrubwmtknvjnucwyob`

---

## 📋 Paso 1: Abrir SQL Editor

1. Ve a: https://supabase.com/dashboard/project/kfqrubwmtknvjnucwyob/sql/new
2. Crea un nuevo query

---

## 📄 Paso 2: Copiar el Script

**Archivo a ejecutar**: `/backend/1-setup-inicial-sin-permisos.sql`

Este script incluye:

### ✨ Nuevas Características
- ✅ Sistema de avatares para usuarios y profesionales
- ✅ Tabla `jobs` para gestionar contrataciones
- ✅ Tabla `client_reviews` para que profesionales califiquen clientes
- ✅ Campo `job_id` en tabla `reviews` (compatible con reviews legacy)
- ✅ Campos `jobs_completed` y `jobs_requested` en users
- ✅ Campo `phone` en professionals
- ✅ Triggers automáticos para lifecycle de jobs y ratings

### 🔒 Seguridad
- Políticas RLS configuradas correctamente
- Permisos solo para usuarios autenticados
- Validación de relaciones (cliente-profesional)

### 📊 Índices
- Optimizaciones para queries frecuentes
- Índices en foreign keys y campos de búsqueda

---

## ▶️ Paso 3: Ejecutar

1. **Pega** todo el contenido del archivo en el SQL Editor
2. **Click** en el botón "Run" (esquina superior derecha)
3. **Espera** a que termine (puede tardar 5-10 segundos)

---

## ✅ Paso 4: Verificar Resultados

Deberías ver **3 mensajes de éxito**:

```
✅ Columnas agregadas correctamente
✅ Índices creados exitosamente
✅ Políticas RLS configuradas
```

Si ves estos 3 mensajes, la migración fue exitosa.

---

## 🔍 Paso 5: Validación Post-Migración

Ejecuta estas queries para validar:

### Verificar columna job_id en reviews:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reviews' AND column_name = 'job_id';
```

**Resultado esperado**: Debería mostrar la columna `job_id` tipo UUID, nullable.

### Verificar tabla jobs:
```sql
SELECT COUNT(*) FROM jobs;
```

**Resultado esperado**: `0` (tabla vacía, recién creada)

### Verificar triggers:
```sql
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table IN ('jobs', 'reviews', 'client_reviews');
```

**Resultado esperado**: Deberías ver varios triggers:
- `update_professional_rating_on_review`
- `update_client_rating_on_review`
- `increment_jobs_completed`
- `update_job_rating`
- etc.

---

## ⚠️ Problemas Comunes

### Error: "permission denied"
- **Causa**: Falta de permisos en Supabase
- **Solución**: Este script YA está diseñado para no cambiar roles. Si ves este error, es un problema de configuración de Supabase.

### Error: "column already exists"
- **Causa**: El script ya se ejecutó parcialmente
- **Solución**: El script es **idempotente**, puedes volver a ejecutarlo sin problemas.

### Error: "relation does not exist"
- **Causa**: Tabla base no existe (ej: `users`, `professionals`)
- **Solución**: Primero debes tener las tablas base creadas. Este script asume que ya existen.

---

## 🎯 Siguiente Paso

Una vez ejecutada la migración exitosamente, puedes:

1. **Probar el frontend**: El código en `app/professional/[id].tsx` ya está actualizado
2. **Crear un job de prueba**: Usa la interfaz de "Contratar"
3. **Completar el job**: Y verificar que se habiliten las reviews
4. **Dejar una review**: Confirmar que se vincula correctamente al job

---

## 📞 Soporte

Si encuentras algún error durante la migración:
1. Copia el mensaje de error completo
2. Copia la query que falló
3. Consulta con el desarrollador

---

**✨ ¡Buena suerte con la migración!**
