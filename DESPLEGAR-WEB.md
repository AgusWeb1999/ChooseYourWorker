# 🚀 GUÍA RÁPIDA: Desplegar cambios a producción (Web)

## ⚠️ IMPORTANTE

Cuando haces cambios en el código y los subes a GitHub, **los cambios NO se ven automáticamente en la web** (https://working-go.com).

Esto es porque GitHub Pages sirve archivos estáticos que se generan con una "build" (compilación). Si solo subes el código fuente sin reconstruir, la web seguirá mostrando la versión anterior.

## 📋 Pasos para desplegar cambios a producción

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

- La build tarda: **1-2 minutos**
- GitHub Pages actualiza en: **2-5 minutos** después del push
- **Total:** ~5-7 minutos desde que ejecutas los comandos hasta que se ve en la web

## 🎯 Versión corta (un solo comando)

Si estás en el directorio raíz del proyecto, puedes ejecutar todo de una vez:

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
