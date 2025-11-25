# 🔧 Ejecutar Fix del Trigger de Rating

## ⚠️ IMPORTANTE
Este script arregla el trigger de rating que tiene referencias a columnas inexistentes (`total_jobs`).

## 📋 Pasos para ejecutar

### 1. Abrir el SQL Editor de Supabase
1. Ve a tu dashboard de Supabase
2. Click en el menú lateral: **SQL Editor**
3. Click en **New Query**

### 2. Copiar el contenido del script
Copia TODO el contenido del archivo: `fix-rating-trigger-simple.sql`

### 3. Pegar y ejecutar
1. Pega el contenido en el editor SQL
2. Click en el botón **Run** o presiona `Ctrl/Cmd + Enter`

### 4. Verificar resultados
Deberías ver:
- ✅ Triggers eliminados
- ✅ Función eliminada y recreada
- ✅ Nuevo trigger creado
- ✅ Ratings recalculados
- 📊 Tabla con los professionals y sus ratings actualizados

## 🎯 Qué hace este script

1. **Elimina todos los triggers relacionados** (usando CASCADE)
2. **Elimina la función antigua** con referencias incorrectas
3. **Crea la función nueva** que solo usa columnas que existen:
   - `rating` (promedio de reseñas)
   - `rating_count` (cantidad de reseñas)
4. **Crea el trigger** que se ejecuta en INSERT/UPDATE/DELETE de reviews
5. **Recalcula todos los ratings** existentes

## ✅ Verificar que funciona

Después de ejecutar el script:

1. **Recarga el frontend**: Presiona `r` en el terminal de Expo
2. **Intenta dejar una reseña** en cualquier profesional
3. **Verifica que se actualiza el rating** automáticamente

## ❓ Si hay errores

Si aparece un error como:
```
function update_professional_rating() does not exist
```

Es porque hay **triggers huérfanos** que necesitan ser eliminados primero.

**Solución**: Ejecuta primero este comando en el SQL Editor:

```sql
-- Eliminar TODOS los triggers relacionados
DROP TRIGGER IF EXISTS update_rating_after_review ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_rating_on_insert ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_rating_on_update ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_rating_on_delete ON public.reviews;

-- Eliminar la función con CASCADE
DROP FUNCTION IF EXISTS update_professional_rating() CASCADE;
```

Y después ejecuta el script completo de nuevo.

---

## 🔗 Enlaces útiles

- **SQL Editor**: `https://supabase.com/dashboard/project/[TU_PROJECT_ID]/sql`
- **Tabla Reviews**: `https://supabase.com/dashboard/project/[TU_PROJECT_ID]/editor/reviews`
- **Tabla Professionals**: `https://supabase.com/dashboard/project/[TU_PROJECT_ID]/editor/professionals`

---

## 📝 Notas

- Este script es **idempotente**: puedes ejecutarlo múltiples veces sin problemas
- Usa `CASCADE` para eliminar automáticamente cualquier dependencia
- Los ratings se recalculan automáticamente basados en las reseñas existentes
