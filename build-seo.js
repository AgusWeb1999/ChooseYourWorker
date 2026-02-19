#!/usr/bin/env node
/**
 * Script de integración para el proceso de build
 * Ejecuta todos los pasos necesarios para optimización SEO
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando proceso de optimización SEO...\n');

// Paso 1: Generar páginas SEO
console.log('📄 Paso 1/4: Generando páginas HTML para SEO...');
try {
  execSync('node generate-seo-pages.js', { stdio: 'inherit' });
  console.log('✅ Páginas SEO generadas\n');
} catch (error) {
  console.error('❌ Error generando páginas SEO:', error.message);
  process.exit(1);
}

// Paso 2: Generar sitemap
console.log('🗺️  Paso 2/4: Generando sitemap.xml...');
try {
  execSync('node generate-sitemap.js', { stdio: 'inherit' });
  console.log('✅ Sitemap actualizado\n');
} catch (error) {
  console.error('❌ Error generando sitemap:', error.message);
  process.exit(1);
}

// Paso 3: Las páginas ya están en /servicios/, no necesitamos copiarlas a la raíz
console.log('📋 Paso 3/4: Verificando estructura de directorios...');
try {
  const serviciosDir = path.join(__dirname, 'servicios');
  if (!fs.existsSync(serviciosDir)) {
    console.error('❌ Directorio /servicios/ no existe');
    process.exit(1);
  }
  
  const files = fs.readdirSync(serviciosDir)
    .filter(file => file.endsWith('.html'));
  
  console.log(`✅ ${files.length} páginas HTML en /servicios/\n`);
} catch (error) {
  console.error('❌ Error verificando estructura:', error.message);
  process.exit(1);
}

// Paso 4: Validar archivos críticos
console.log('🔍 Paso 4/4: Validando archivos críticos...');
const criticalFiles = [
  'sitemap.xml',
  'robots.txt',
  'index.html'
];

let allValid = true;
criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} - NO ENCONTRADO`);
    allValid = false;
  }
});

if (!allValid) {
  console.error('\n❌ Algunos archivos críticos no se encontraron');
  process.exit(1);
}

console.log('\n🎉 Proceso completado exitosamente!');
console.log('\n📊 Resumen:');
console.log(`   • Páginas SEO: ${fs.readdirSync(path.join(__dirname, 'servicios')).filter(f => f.endsWith('.html')).length}`);
console.log(`   • Ubicación: /servicios/`);
console.log(`   • Sitemap actualizado: sitemap.xml`);
console.log(`   • Robots optimizado: robots.txt`);
console.log('\n✨ El sitio está listo para ser indexado por los motores de búsqueda');
console.log('💡 Próximo paso: ejecutar el build y desplegar a producción\n');

process.exit(0);
