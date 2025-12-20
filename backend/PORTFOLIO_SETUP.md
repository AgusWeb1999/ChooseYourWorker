# Configuración del Portafolio de Trabajadores

Esta guía te ayudará a configurar la funcionalidad de portafolio de imágenes para trabajadores en WorkingGo.

## 📋 Pasos de Configuración

### 1. Crear la Tabla en Supabase

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Abre el **SQL Editor**
3. Ejecuta el script `backend/setup-portfolio.sql`
4. Verifica que la tabla `portfolio_images` se haya creado correctamente

### 2. Crear el Bucket de Storage

1. Ve a **Storage** en el menú lateral de Supabase
2. Haz clic en **"New bucket"**
3. Configura el bucket:
   - **Name**: `portfolio`
   - **Public bucket**: ✅ (marcado)
   - Haz clic en **"Create bucket"**

### 3. Configurar Políticas de Storage

Una vez creado el bucket `portfolio`:

#### Política 1: Lectura Pública
1. Haz clic en el bucket `portfolio`
2. Ve a **Policies** > **New Policy**
3. Selecciona **"For full customization"**
4. Configura:
   - **Policy name**: `Permitir lectura pública`
   - **Allowed operation**: `SELECT`
   - **Policy definition**: 
   ```sql
   true
   ```
5. Clic en **Review** y **Save policy**

#### Política 2: Subida de Imágenes
1. Crea otra política: **New Policy** > **"For full customization"**
2. Configura:
   - **Policy name**: `Permitir subida de imágenes al profesional`
   - **Allowed operation**: `INSERT`
   - **Policy definition**:
   ```sql
   bucket_id = 'portfolio' AND 
   (storage.foldername(name))[1] IN (
     SELECT id::text 
     FROM professionals 
     WHERE user_id = auth.uid()
   )
   ```
3. Clic en **Review** y **Save policy**

#### Política 3: Eliminación de Imágenes
1. Crea otra política: **New Policy** > **"For full customization"**
2. Configura:
   - **Policy name**: `Permitir eliminación de imágenes al profesional`
   - **Allowed operation**: `DELETE`
   - **Policy definition**:
   ```sql
   bucket_id = 'portfolio' AND 
   (storage.foldername(name))[1] IN (
     SELECT id::text 
     FROM professionals 
     WHERE user_id = auth.uid()
   )
   ```
3. Clic en **Review** y **Save policy**

### 4. Verificar la Instalación

Para verificar que todo está configurado correctamente:

1. Inicia sesión en la app como trabajador
2. Ve a **Perfil**
3. Toca **"📸 Mi Portafolio de Trabajos"**
4. Intenta subir una imagen
5. Verifica que se suba correctamente y aparezca en el grid

## 🎯 Funcionalidades

### Para Trabajadores
- ✅ Subir hasta 5 imágenes de trabajos realizados
- ✅ Ver todas sus imágenes en un grid responsive
- ✅ Eliminar imágenes individualmente
- ✅ Las imágenes se muestran en su perfil público

### Para Clientes
- ✅ Ver el portafolio de trabajos de cualquier profesional
- ✅ Navegar por las imágenes antes de contratar

## 📱 Uso en la App

### Como Trabajador

1. **Acceder al Portafolio**:
   - Ve a **Perfil** (tab inferior)
   - Toca **"📸 Mi Portafolio de Trabajos"**

2. **Agregar Imagen**:
   - Toca el botón **"+ Agregar foto"**
   - Selecciona una imagen de tu galería
   - La imagen se subirá automáticamente

3. **Eliminar Imagen**:
   - Toca el botón **"×"** en la esquina superior derecha de la imagen
   - Confirma la eliminación

### Como Cliente

Las imágenes del portafolio se mostrarán automáticamente en el perfil público del trabajador cuando navegues por la lista de profesionales.

## 🔧 Solución de Problemas

### Error: "No se pudo subir la imagen"
- Verifica que el bucket `portfolio` existe y es público
- Revisa que las políticas de storage estén configuradas correctamente
- Asegúrate de que el usuario esté autenticado

### Error: "Permiso denegado"
- Verifica que el usuario sea un trabajador (tiene `professional_profile`)
- Revisa las políticas RLS de la tabla `portfolio_images`
- Comprueba las políticas del bucket `portfolio`

### Las imágenes no se ven
- Verifica que el bucket sea público
- Revisa la URL de la imagen en la base de datos
- Comprueba que la política de lectura pública esté activa

## 📊 Límites

- **Máximo de imágenes por trabajador**: 5
- **Tamaño recomendado**: Hasta 5 MB por imagen
- **Formatos soportados**: JPG, PNG, WEBP
- **Relación de aspecto recomendada**: 4:3

## 🔒 Seguridad

- ✅ Solo los trabajadores pueden subir imágenes a su propio portafolio
- ✅ Solo los trabajadores pueden eliminar sus propias imágenes
- ✅ Las imágenes son públicas y visibles para todos
- ✅ Las rutas de storage están organizadas por `professional_id`

## 📝 Notas Técnicas

- Las imágenes se almacenan en: `portfolio/{professional_id}/{filename}`
- El componente es responsive y se adapta a móvil, tablet y web
- Las imágenes se redimensionan automáticamente al 70% de calidad
- Se usa aspect ratio 4:3 para mejor visualización

---

¿Problemas? Contacta a: workinggoam@gmail.com
