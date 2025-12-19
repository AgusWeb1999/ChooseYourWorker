# 🔑 OBTENER CLAVE ANON DE SUPABASE

## ⚠️ URGENTE: La clave ANON de Supabase es inválida o expiró

Para que la aplicación funcione en producción (GitHub Pages), necesitas obtener la clave ANON actualizada desde Supabase.

## 📋 Pasos para obtener la clave:

1. **Ir a Supabase Dashboard**
   - Abre https://supabase.com/dashboard
   - Inicia sesión con tu cuenta

2. **Seleccionar tu proyecto**
   - Busca el proyecto: `oeabhlewxekejmgrucrz`
   - Haz clic para abrirlo

3. **Ir a Settings → API**
   - En el menú lateral, ve a `Settings` (⚙️)
   - Luego haz clic en `API`

4. **Copiar la clave ANON**
   - Busca la sección: **Project API keys**
   - Encontrarás dos claves:
     - `anon` `public` ← **ESTA ES LA QUE NECESITAS** ✅
     - `service_role` `secret` ← ⚠️ NO uses esta (es privada)
   
   - La clave `anon` debe verse algo así:
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
     ```

5. **Actualizar en el proyecto**
   
   Opción A - Archivo .env.local (para desarrollo):
   ```bash
   cd frontend
   nano .env.local
   ```
   Actualiza esta línea:
   ```
   EXPO_PUBLIC_SUPABASE_ANON_KEY=LA_CLAVE_QUE_COPIASTE
   ```

   Opción B - Archivo supabase.js (para producción):
   ```bash
   nano frontend/src/lib/supabase.js
   ```
   En la línea 9, reemplaza `YOUR_ACTUAL_KEY_HERE` con la clave que copiaste.

6. **Reconstruir y desplegar**
   ```bash
   cd frontend
   npx expo export -p web
   cd ..
   cp -r frontend/dist/* .
   git add -A
   git commit -m "fix: Actualizar clave ANON de Supabase"
   git push
   ```

## ❓ ¿Por qué necesito hacer esto?

La clave ANON de Supabase es una credencial pública que permite a tu app conectarse a la base de datos. Parece que la clave actual en el código expiró o es inválida, por eso ves el error "Invalid API key".

## 🔒 ¿Es seguro exponer esta clave?

Sí, la clave `anon` está diseñada para ser pública. La seguridad de tus datos se maneja mediante:
- Row Level Security (RLS) policies en Supabase
- Autenticación de usuarios
- Permisos a nivel de base de datos

La clave `anon` solo permite operaciones que tú hayas autorizado mediante RLS.

## 📞 ¿Necesitas ayuda?

Si tienes problemas para encontrar la clave, compárteme:
1. Una captura de la sección API en Supabase
2. O copia/pega la clave aquí y yo la actualizaré en el código
