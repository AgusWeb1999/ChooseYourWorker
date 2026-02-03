# Migración: completion_surveys

## ⚠️ ERROR ACTUAL
La tabla `completion_surveys` no existe en tu base de datos de Supabase, causando este error:
```
Error al finalizar solicitud: {code: 'PGRST205', message: "Could not find the table 'public.completion_surveys' in the schema cache"}
```

## 🔧 SOLUCIÓN

Debes ejecutar la migración que ya existe en el proyecto. Hay 2 opciones:

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [https://supabase.com](https://supabase.com)
2. Ve a **SQL Editor** en el menú lateral
3. Haz clic en **New Query**
4. Copia y pega el contenido del archivo:
   ```
   supabase/migrations/20260202_completion_surveys.sql
   ```
5. Haz clic en **Run** (o presiona Cmd/Ctrl + Enter)

### Opción 2: Usando Supabase CLI

Si tienes Supabase CLI instalado:

```bash
cd /Users/maximilianogonzalez/Documents/GitHub/ChooseYourWorker
npx supabase db push
```

O ejecuta específicamente la migración:

```bash
npx supabase migration up
```

## ✅ Verificación

Después de ejecutar la migración, verifica que la tabla se creó correctamente:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'completion_surveys';
```

Deberías ver un resultado con la tabla.

## 📝 Qué hace esta migración

Crea la tabla `completion_surveys` que almacena:
- Si el cliente resolvió el servicio con un profesional de la plataforma
- Nombre del profesional (si aplicable)
- Calificación de satisfacción (1-5 estrellas)
- Comentarios adicionales

## 🔄 Código ya actualizado

He actualizado `OpenRequests.tsx` para que:
- ✅ Si la tabla existe, guarda la encuesta
- ✅ Si la tabla NO existe, marca el hire como completado pero no falla
- ✅ El botón "Finalizar" ahora funciona aunque la tabla no exista
- ✅ Se eliminaron las warnings de React Native Web (shadow* -> boxShadow)

## 🐛 Otros problemas

El **botón "Cancelar"** del componente sí funciona. El comportamiento correcto es:
- Muestra un diálogo de confirmación
- Si confirmas, actualiza el hire a `status: 'cancelled'`
- Refresca la lista

Si no ves ninguna acción, verifica la consola del navegador para ver si hay algún error.
