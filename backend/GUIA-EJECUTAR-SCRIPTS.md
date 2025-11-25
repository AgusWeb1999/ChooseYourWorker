# 🚀 Guía: Cómo Ejecutar los Scripts SQL en Supabase

## ⚠️ IMPORTANTE
**Estos scripts NO se ejecutan automáticamente**. Tienes que ejecutarlos TÚ manualmente en Supabase siguiendo estos pasos:

---

## 📝 PASO A PASO

### **1️⃣ Abre Supabase Dashboard**

1. Ve a: https://supabase.com
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: **ChooseYourWorker**

---

### **2️⃣ Abre el SQL Editor**

En el menú lateral izquierdo, busca y haz clic en:
```
🗂️ SQL Editor
```

Luego haz clic en el botón:
```
➕ New Query
```

---

### **3️⃣ Copia el Script Completo**

1. Abre el archivo: `backend/fix-email-duplicates-complete.sql`
2. **Selecciona TODO el contenido** (Cmd+A en Mac)
3. **Copia** (Cmd+C)

---

### **4️⃣ Pega el Script en Supabase**

1. En el SQL Editor de Supabase
2. **Pega** el script completo (Cmd+V)
3. Verifica que se pegó todo correctamente

---

### **5️⃣ Ejecuta el Script**

1. Haz clic en el botón **"RUN"** (arriba a la derecha)
   - O presiona: `Cmd + Enter`

2. **Espera** a que termine (puede tardar unos segundos)

---

### **6️⃣ Lee los Resultados**

Después de ejecutar, verás en la parte inferior:

#### **Mensajes de NOTICE** (en azul):
```
🔍 Total de emails duplicados: 3
📧 Procesando email: user@example.com
  ✅ Manteniendo usuario: 123e4567-e89b-12d3-a456-426614174000
  ❌ Eliminando duplicado: 987fcdeb-51a2-43f7-8d9e-426614174001
✅ Limpieza completada. Usuarios eliminados: 2
```

#### **Resultados de las queries** (tablas):
- Lista de emails duplicados encontrados
- Constraint creado
- Trigger actualizado
- Estado final de la BD

---

## 📊 QUÉ HACE EL SCRIPT (En Orden)

### **Fase 1: DIAGNÓSTICO** 🔍
- Cuenta cuántos emails están duplicados
- Muestra la lista completa de duplicados

### **Fase 2: LIMPIEZA** 🧹
Para cada email duplicado:
- ✅ **Mantiene** el usuario más antiguo (el primero registrado)
- 🔄 **Transfiere** todos los datos (chats, reseñas, perfil)
- ❌ **Elimina** los duplicados

### **Fase 3: PREVENCIÓN** 🛡️
- Agrega constraint `UNIQUE` en el email
- Mejora el trigger de sincronización
- Crea función de validación `check_email_available()`

### **Fase 4: VALIDACIÓN** ✅
- Verifica que no quedan duplicados
- Confirma que el constraint fue creado
- Muestra estado final

---

## ✅ VERIFICACIÓN MANUAL

Después de ejecutar el script, verifica manualmente que todo está bien:

### **Query 1: ¿Quedan duplicados?**
```sql
SELECT 
  email,
  COUNT(*) as cantidad
FROM public.users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;
```
**Resultado esperado**: 0 filas (sin duplicados)

### **Query 2: ¿Existe el constraint?**
```sql
SELECT conname 
FROM pg_constraint 
WHERE conname = 'users_email_unique';
```
**Resultado esperado**: Muestra `users_email_unique`

### **Query 3: ¿Cuántos usuarios hay?**
```sql
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(DISTINCT email) as emails_unicos
FROM public.users;
```
**Resultado esperado**: total_usuarios = emails_unicos

---

## 🆘 PROBLEMAS COMUNES

### ❌ "relation does not exist"
**Causa**: No estás en el proyecto correcto
**Solución**: Verifica que seleccionaste el proyecto ChooseYourWorker

### ❌ "permission denied"
**Causa**: No tienes permisos de superusuario
**Solución**: 
- Ve a Settings → Database
- Copia la contraseña del usuario `postgres`
- Conéctate como superusuario

### ❌ "constraint already exists"
**Causa**: Ya ejecutaste el script antes
**Solución**: Normal, el script es idempotente (se puede ejecutar varias veces)

### ⚠️ "duplicate key violates unique constraint"
**Causa**: Hay duplicados que el script no pudo resolver
**Solución**: 
1. Ejecuta el diagnóstico manualmente
2. Revisa qué usuarios están duplicados
3. Elimínalos manualmente con `delete-user-complete.sql`

---

## 📱 DESPUÉS DE EJECUTAR EL SCRIPT

### **En el Frontend:**

1. **Detén el servidor** si está corriendo
   ```bash
   # Presiona Ctrl+C en la terminal donde corre Expo
   ```

2. **Limpia la caché y reinicia**
   ```bash
   cd frontend
   npx expo start --clear
   ```

3. **Prueba registrar un usuario nuevo**
   - Usa un email que NO exista
   - Debería funcionar normalmente

4. **Prueba registrar con email duplicado**
   - Usa un email que YA existe
   - Debería mostrar: "Este email ya está registrado"

---

## 🎯 RESUMEN EJECUTIVO

| Script | Cuándo Ejecutarlo | Qué Hace |
|--------|------------------|----------|
| `fix-email-duplicates-complete.sql` | **AHORA** (una sola vez) | Limpia duplicados + Previene futuros |
| `check-duplicate-emails.sql` | Cuando quieras verificar | Solo muestra duplicados (no modifica nada) |
| `delete-user-complete.sql` | Para eliminar un usuario específico | Borra usuario y todos sus datos |

---

## ✨ ORDEN DE EJECUCIÓN

1. ✅ **`fix-email-duplicates-complete.sql`** ← EJECUTA ESTE PRIMERO
2. ✅ Reinicia el frontend (`npx expo start --clear`)
3. ✅ Prueba registrar usuarios nuevos
4. ✅ Verifica que no se crean más duplicados

---

## 📞 AYUDA ADICIONAL

Si después de ejecutar el script sigues teniendo problemas:

1. **Revisa los logs** en la consola de Supabase
2. **Ejecuta las queries de verificación** (arriba)
3. **Comparte el error específico** que ves

---

**Autor**: GitHub Copilot  
**Versión**: 1.0  
**Última actualización**: 2025-11-25
