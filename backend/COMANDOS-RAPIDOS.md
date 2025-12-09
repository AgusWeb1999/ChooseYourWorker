# ⚡ Comandos Rápidos - WorkingGo Migration

## 🎯 Ejecutar Migración (Copy & Paste)

### 1. Abrir SQL Editor
```
https://supabase.com/dashboard/project/kfqrubwmtknvjnucwyob/sql/new
```

### 2. Copiar contenido del script
```bash
cat /Users/agusmazzini/Desktop/projectos/chooseYourWorker/backend/1-setup-inicial-sin-permisos.sql | pbcopy
```
*(Esto copia el script al clipboard)*

### 3. Pegar en SQL Editor y ejecutar
- `Cmd + V` para pegar
- Click "Run" o `Cmd + Enter`

### 4. Verificar resultado
Debes ver:
```
✅ Columnas agregadas correctamente
✅ Índices creados exitosamente
✅ Políticas RLS configuradas
```

---

## 🔍 Validar Migración (Copy & Paste)

### Copiar script de validación
```bash
cat /Users/agusmazzini/Desktop/projectos/chooseYourWorker/backend/validar-migracion.sql | pbcopy
```

### Ejecutar en nueva query
- Nueva query en SQL Editor
- `Cmd + V` para pegar
- Click "Run"

---

## 🧪 Queries de Testing Rápido

### Ver estructura de reviews
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reviews'
ORDER BY ordinal_position;
```

### Ver estructura de jobs
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'jobs'
ORDER BY ordinal_position;
```

### Ver jobs actuales (debe estar vacío inicialmente)
```sql
SELECT * FROM jobs;
```

### Ver triggers en jobs
```sql
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'jobs';
```

### Ver políticas RLS en reviews
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'reviews';
```

### Ver índices en jobs
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'jobs';
```

---

## 🚀 Testing del Flujo Completo

### 1. Crear un job de prueba (simular contratación)
```sql
-- Reemplaza los UUIDs con IDs reales de tu DB
INSERT INTO jobs (client_id, professional_id, status)
VALUES (
  'uuid-del-cliente',
  'uuid-del-profesional',
  'pending'
);
```

### 2. Ver el job creado
```sql
SELECT 
  j.id,
  j.status,
  j.created_at,
  u.full_name as cliente,
  p.full_name as profesional
FROM jobs j
JOIN users u ON j.client_id = u.id
JOIN professionals p ON j.professional_id = p.id
ORDER BY j.created_at DESC;
```

### 3. Avanzar job a in_progress
```sql
UPDATE jobs 
SET status = 'in_progress', started_at = NOW()
WHERE status = 'pending'
LIMIT 1;
```

### 4. Completar job
```sql
UPDATE jobs 
SET status = 'completed', completed_at = NOW()
WHERE status = 'in_progress'
LIMIT 1;
```

### 5. Verificar contadores actualizados
```sql
-- Ver jobs_completed del profesional
SELECT 
  p.full_name,
  u.jobs_completed,
  u.jobs_requested
FROM professionals p
JOIN users u ON p.user_id = u.id
WHERE p.id = 'uuid-del-profesional';
```

### 6. Crear review vinculada al job
```sql
INSERT INTO reviews (
  client_id,
  professional_id,
  job_id,
  rating,
  comment
)
VALUES (
  'uuid-del-cliente',
  'uuid-del-profesional',
  'uuid-del-job-completado',
  5,
  'Excelente trabajo!'
);
```

### 7. Verificar rating actualizado
```sql
SELECT 
  p.full_name,
  p.rating,
  COUNT(r.id) as total_reviews
FROM professionals p
LEFT JOIN reviews r ON p.id = r.professional_id
WHERE p.id = 'uuid-del-profesional'
GROUP BY p.id, p.full_name, p.rating;
```

---

## 🔧 Debugging

### Ver último error de trigger
```sql
-- Si un trigger falla, ver detalles en logs
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

### Ver funciones creadas
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%job%' OR routine_name LIKE '%review%'
ORDER BY routine_name;
```

### Resetear jobs de prueba
```sql
DELETE FROM jobs WHERE created_at > NOW() - INTERVAL '1 hour';
```

### Resetear reviews de prueba  
```sql
DELETE FROM reviews WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## 📊 Queries de Estadísticas

### Jobs por estado
```sql
SELECT status, COUNT(*) as total
FROM jobs
GROUP BY status
ORDER BY total DESC;
```

### Reviews por mes
```sql
SELECT 
  DATE_TRUNC('month', created_at) as mes,
  COUNT(*) as total_reviews,
  AVG(rating) as rating_promedio
FROM reviews
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;
```

### Top profesionales por jobs completados
```sql
SELECT 
  p.full_name,
  u.jobs_completed,
  p.rating,
  COUNT(r.id) as total_reviews
FROM professionals p
JOIN users u ON p.user_id = u.id
LEFT JOIN reviews r ON p.id = r.professional_id
GROUP BY p.id, p.full_name, u.jobs_completed, p.rating
ORDER BY u.jobs_completed DESC
LIMIT 10;
```

### Clientes más activos
```sql
SELECT 
  u.full_name,
  u.jobs_requested,
  COUNT(DISTINCT r.id) as reviews_dejadas
FROM users u
LEFT JOIN reviews r ON u.id = r.client_id
WHERE u.jobs_requested > 0
GROUP BY u.id, u.full_name, u.jobs_requested
ORDER BY u.jobs_requested DESC
LIMIT 10;
```

---

## 🆘 Rollback (si algo sale mal)

### Eliminar tabla jobs
```sql
DROP TABLE IF EXISTS jobs CASCADE;
```

### Eliminar tabla client_reviews
```sql
DROP TABLE IF EXISTS client_reviews CASCADE;
```

### Eliminar columna job_id de reviews
```sql
ALTER TABLE reviews DROP COLUMN IF EXISTS job_id;
```

### Eliminar columnas de users
```sql
ALTER TABLE users 
  DROP COLUMN IF EXISTS avatar_url,
  DROP COLUMN IF EXISTS jobs_completed,
  DROP COLUMN IF EXISTS jobs_requested;
```

### Eliminar columnas de professionals
```sql
ALTER TABLE professionals 
  DROP COLUMN IF EXISTS avatar_url,
  DROP COLUMN IF EXISTS phone;
```

---

## 🎯 Comandos del Sistema

### Abrir archivo en VS Code
```bash
code /Users/agusmazzini/Desktop/projectos/chooseYourWorker/backend/1-setup-inicial-sin-permisos.sql
```

### Ver tamaño del script
```bash
wc -l /Users/agusmazzini/Desktop/projectos/chooseYourWorker/backend/1-setup-inicial-sin-permisos.sql
```

### Buscar en el script
```bash
grep -n "CREATE TABLE jobs" /Users/agusmazzini/Desktop/projectos/chooseYourWorker/backend/1-setup-inicial-sin-permisos.sql
```

### Ver cambios recientes
```bash
cd /Users/agusmazzini/Desktop/projectos/chooseYourWorker
git status
git diff backend/
```

---

**💡 Tip:** Guarda este documento para referencia rápida durante el testing.
