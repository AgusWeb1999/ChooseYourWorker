# 🚀 EJECUTAR MIGRACIÓN - FLUJO SIN CUENTA

## ✅ Paso 1: Copiar SQL

En tu terminal:
```bash
cat /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker/supabase/migrations/20260204_guest_contactless_flow.sql | pbcopy
```

## ✅ Paso 2: Ejecutar en Supabase

1. Ir a: https://supabase.com/dashboard/project/kfqrubwmtknvjnucwyob/sql/new
2. `Cmd + V` (pegar)
3. Click "Run"
4. Esperar ~3 segundos

## ✅ Paso 3: Verificar

Debes ver al final del script:
```
✅ Columnas agregadas a hires
✅ Columnas agregadas a reviews
✅ RLS policies configuradas
✅ Constraint check_client_or_guest creado
```

---

## 🧪 Probar la App

1. Ir a `/auth/welcome` SIN estar logueado
2. Click "Buscar Profesionales"
3. Completar descripción del servicio
4. Seleccionar timing
5. Ver profesionales con portfolios
6. Click "Contactar"
7. Ingresar nombre y email
8. ✅ Ver confirmación

---

## ❌ Si algo sale mal

Verificar que las columnas se crearon:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hires' 
AND column_name IN ('guest_client_email', 'guest_client_phone', 'guest_client_name', 'review_token', 'reviewed_by_guest');
```

Debe retornar 5 filas.

---

**¡Listo!** 🎉
