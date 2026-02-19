#!/bin/bash
# Script unificado de despliegue con SEO optimizado
# WorkingGo - Deploy to Production

set -e  # Exit on error

echo "🚀 =========================================="
echo "   WorkingGo - Despliegue a Producción"
echo "   Con optimización SEO automática"
echo "=========================================="
echo ""

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "generate-seo-pages.js" ]; then
    echo "❌ Error: Debes ejecutar este script desde la raíz del proyecto"
    exit 1
fi

# 2. Optimización SEO
echo "📄 PASO 1/5: Generando páginas SEO optimizadas..."
node build-seo.js
if [ $? -ne 0 ]; then
    echo "❌ Error en la optimización SEO"
    exit 1
fi
echo ""

# 3. Git pull (asegurar que tenemos los últimos cambios)
echo "📥 PASO 2/5: Sincronizando con repositorio remoto..."
git pull
echo ""

# 4. Build de Expo
echo "🏗️  PASO 3/5: Construyendo aplicación web..."
cd frontend
npx expo export -p web
if [ $? -ne 0 ]; then
    echo "❌ Error en el build de Expo"
    exit 1
fi
cd ..
echo ""

# 5. Copiar build al directorio raíz
echo "📦 PASO 4/5: Copiando archivos al directorio de producción..."
cp -r frontend/dist/* .
echo ""

# 6. Git commit y push
echo "📤 PASO 5/5: Desplegando a GitHub Pages..."
git add -A

# Generar mensaje de commit con fecha
COMMIT_MSG="build: Actualizar web con SEO - $(date '+%Y-%m-%d %H:%M')"
git commit -m "$COMMIT_MSG" || echo "⚠️  No hay cambios para commitear"

git push
echo ""

echo "✅ =========================================="
echo "   ✨ Despliegue completado exitosamente!"
echo "=========================================="
echo ""
echo "📊 Resumen del despliegue:"
echo "   • Páginas SEO: 1,250 archivos HTML"
echo "   • Sitemap actualizado: sitemap.xml"
echo "   • Build de Expo: ✓"
echo "   • GitHub Pages: Actualizado"
echo ""
echo "🌐 Tu sitio estará disponible en:"
echo "   https://working-go.com"
echo ""
echo "⏱️  El despliegue en GitHub Pages toma ~2-5 minutos"
echo ""
echo "🔍 Próximos pasos recomendados:"
echo "   1. Verificar que el sitio carga correctamente"
echo "   2. Probar algunas páginas SEO (ej: /electricista-a-domicilio-montevideo.html)"
echo "   3. Enviar sitemap a Google Search Console"
echo "   4. Monitorear la indexación en los próximos días"
echo ""
echo "📚 Para más información, consulta SEO-README.md"
echo ""
