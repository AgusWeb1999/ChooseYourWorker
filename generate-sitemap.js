#!/usr/bin/env node
/**
 * Generador de sitemap.xml dinámico
 * Lee las páginas HTML generadas y crea un sitemap actualizado
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://working-go.com';
const PAGES_DIR = path.join(__dirname, 'servicios');
const OUTPUT_FILE = path.join(__dirname, 'sitemap.xml');

// Páginas estáticas principales
const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/index.html', priority: '1.0', changefreq: 'daily' },
  { url: '/messages.html', priority: '0.8', changefreq: 'weekly' },
  { url: '/profile.html', priority: '0.8', changefreq: 'weekly' },
];

function generateSitemap() {
  console.log('🗺️  Generando sitemap.xml...\n');
  
  const today = new Date().toISOString().split('T')[0];
  let urls = [];
  
  // Agregar páginas estáticas
  STATIC_PAGES.forEach(page => {
    urls.push({
      loc: `${BASE_URL}${page.url}`,
      lastmod: today,
      changefreq: page.changefreq,
      priority: page.priority
    });
  });
  
  // Leer páginas SEO generadas
  if (fs.existsSync(PAGES_DIR)) {
    const seoFiles = fs.readdirSync(PAGES_DIR)
      .filter(file => file.endsWith('.html'));
    
    console.log(`📄 Encontradas ${seoFiles.length} páginas SEO\n`);
    
    seoFiles.forEach(file => {
      urls.push({
        loc: `${BASE_URL}/servicios/${file}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.9'
      });
    });
  }
  
  // Generar XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
  xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
  xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n';
  
  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  // Guardar sitemap
  fs.writeFileSync(OUTPUT_FILE, xml, 'utf8');
  
  console.log(`✅ Sitemap generado exitosamente!`);
  console.log(`📍 Ubicación: ${OUTPUT_FILE}`);
  console.log(`🔗 Total de URLs: ${urls.length}\n`);
  
  return { totalUrls: urls.length, outputFile: OUTPUT_FILE };
}

// Ejecutar si se llama directamente
if (require.main === module) {
  try {
    generateSitemap();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = { generateSitemap };
