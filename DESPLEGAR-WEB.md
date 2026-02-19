# 🚀 GUÍA RÁPIDA: Desplegar cambios a producción (Web)

## ⚠️ IMPORTANTE

Cuando haces cambios en el código y los subes a GitHub, **los cambios NO se ven automáticamente en la web** (https://working-go.com).

Esto es porque GitHub Pages sirve archivos estáticos que se generan con una "build" (compilación). Si solo subes el código fuente sin reconstruir, la web seguirá mostrando la versión anterior.

## ⭐ NUEVO: Despliegue con SEO Automático (RECOMENDADO)

### Usa el script unificado que incluye optimización SEO:

```bash
./deploy-with-seo.sh
```

Este script hace todo automáticamente:
1. ✅ Genera 1,250 páginas HTML optimizadas para SEO
2. ✅ Actualiza el sitemap.xml
3. ✅ Sincroniza con el repositorio
4. ✅ Construye la aplicación web
5. ✅ Despliega a GitHub Pages

**Beneficios del SEO:**
- 📈 Mejor posicionamiento en Google para búsquedas como "electricista montevideo"
- 🎯 1,250 páginas optimizadas (50 profesiones × 24 ciudades + variantes)
- 🔍 ~18,750 combinaciones de keywords cubiertas
- 🚀 Redirección automática a la home después de indexar

---

## 📋 Método Manual (Sin SEO automático)

### Cada vez que hagas cambios y quieras que se vean en la web, ejecuta:

```bash
# 1. Ir al directorio raíz del proyecto
cd /Users/agusmazzini/Desktop/projectos/chooseYourWorker

# 2. Asegurarte de tener los últimos cambios
git pull

# 3. Ir al directorio frontend
cd frontend

# 4. Reconstruir la aplicación web
npx expo export -p web

# 5. Volver al directorio raíz
cd ..

# 6. Copiar la build a la raíz (para GitHub Pages)
cp -r frontend/dist/* .

# 7. Subir los cambios a GitHub
git add -A
git commit -m "build: Actualizar web con nuevos cambios"
git push
```

### ⏱️ Tiempo de despliegue

- **Con SEO automático (./deploy-with-seo.sh):**
  - Generación SEO: ~10 segundos
  - Build de Expo: ~1-2 minutos
  - GitHub Pages: ~2-5 minutos
  - **Total:** ~3-7 minutos

- **Sin SEO (método manual):**
  - Build de Expo: ~1-2 minutos
  - GitHub Pages: ~2-5 minutos
  - **Total:** ~3-7 minutos

## 🔍 SEO: Optimización para motores de búsqueda

### ¿Qué páginas SEO se generan?

Se crean automáticamente páginas para cada combinación de profesión + ciudad:
- Ejemplo: `/electricista-a-domicilio-montevideo.html`
- Ejemplo: `/plomero-a-domicilio-maldonado.html`
- Y 1,248 páginas más...

### Verificar páginas SEO después del despliegue:

1. **Probar páginas individuales:**
   - https://working-go.com/electricista-a-domicilio-montevideo.html
   - https://working-go.com/plomero-a-domicilio-maldonado.html

2. **Verificar sitemap:**
   - https://working-go.com/sitemap.xml

3. **Enviar a Google Search Console:**
   - Ve a [Google Search Console](https://search.google.com/search-console)
   - Sección "Sitemaps"
   - Envía: `https://working-go.com/sitemap.xml`

4. **Solicitar indexación prioritaria:**
   - En Search Console, "Inspección de URL"
   - Ingresa URLs importantes
   - Click en "Solicitar indexación"

### Regenerar páginas SEO manualmente:

Si solo quieres actualizar las páginas SEO sin hacer un despliegue completo:

```bash
node build-seo.js
git add -A
git commit -m "seo: Actualizar páginas de optimización"
git push
```

## 📚 Documentación adicional

- **Guía completa de SEO:** Ver [SEO-README.md](SEO-README.md)
- **Scripts disponibles:**
  - `generate-seo-pages.js` - Genera páginas HTML para SEO
  - `generate-sitemap.js` - Actualiza sitemap.xml
  - `build-seo.js` - Proceso completo de optimización
  - `deploy-with-seo.sh` - Despliegue unificado con SEO

## 🎯 Versión corta (un solo comando)

### Con SEO (recomendado):
```bash
./deploy-with-seo.sh
```

### Sin SEO (método anterior):

```bash
cd frontend && npx expo export -p web && cd .. && cp -r frontend/dist/* . && git add -A && git commit -m "build: Actualizar web" && git push
```

## ✅ Cómo verificar que funcionó

1. **Espera 5 minutos** después del push
2. Abre https://working-go.com
3. **Presiona Ctrl+Shift+R** (Windows/Linux) o **Cmd+Shift+R** (Mac) para forzar la recarga y limpiar caché
4. Verifica que tus cambios estén visibles

## 🔧 Solución de problemas

### "npx: command not found"
Necesitas tener Node.js y npm instalados. Descarga desde: https://nodejs.org/

### "expo export failed"
Asegúrate de que el archivo `.env.local` existe en `frontend/` con las credenciales de Supabase.

### "Los cambios no se ven después de 10 minutos"
1. Limpia el caché del navegador: Ctrl+Shift+R (o Cmd+Shift+R en Mac)
2. Verifica en GitHub que el commit se subió correctamente
3. Ve a la pestaña "Actions" en GitHub para ver si hay errores en el deployment

## 📝 Notas

- **Solo web necesita este proceso**: Los cambios en el código fuente de React Native funcionan en desarrollo sin rebuild
- **Mobile (APK/AAB)**: Requiere un proceso diferente con EAS Build
- **GitHub Pages**: Solo sirve la raíz del proyecto, por eso copiamos `frontend/dist/*` a la raíz

## 🎓 ¿Por qué es necesario esto?

React Native Web (Expo) compila el código TypeScript/JSX a JavaScript vanilla que los navegadores pueden entender. Este proceso de compilación crea archivos estáticos optimizados en la carpeta `dist/`. GitHub Pages necesita estos archivos estáticos en la raíz del repositorio para poder servirlos.

---

**Última actualización:** 19 de diciembre de 2025
