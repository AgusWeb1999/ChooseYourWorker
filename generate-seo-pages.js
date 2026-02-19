#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PROFESSIONS = [
  'Carpintero', 'Electricista', 'Plomero', 'Pintor', 'Técnico de HVAC',
  'Jardinero', 'Limpieza del Hogar', 'Mantenimiento General', 'Servicios de Mudanza',
  'Cerrajero', 'Albañil', 'Gasista', 'Techista', 'Decorador', 'Control de Plagas',
  'Mecánico', 'Chofer', 'Niñera', 'Cuidador de Adultos', 'Cocinero', 'Panadero',
  'Peluquero', 'Estilista', 'Manicurista', 'Masajista', 'Fotógrafo', 'Diseñador Gráfico',
  'Programador', 'Profesor Particular', 'Entrenador Personal', 'Fumigador', 'Mudanzas',
  'Reparación de Computadoras', 'Reparación de Celulares', 'Reparación de Electrodomésticos',
  'Tapicero', 'Vidriero', 'Herrero', 'Soldador', 'Montador de Muebles', 'Paseador de Perros',
  'Veterinario', 'Animador de Eventos', 'DJ', 'Músico', 'Cantante', 'Traductor', 'Redactor',
  'Community Manager', 'Marketing Digital'
];

const CITIES_URUGUAY = [
  'Montevideo', 'Maldonado', 'Canelones', 'Salto', 'Paysandú', 
  'Las Piedras', 'Rivera', 'Melo', 'Mercedes', 'Artigas',
  'Minas', 'San José', 'Durazno', 'Florida', 'Treinta y Tres',
  'Rocha', 'Colonia', 'Tacuarembó', 'Carmelo', 'Fray Bentos',
  'Ciudad de la Costa', 'Pando', 'La Paz', 'Progreso'
];

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

function generateHTML(profession, city) {
  const slug = slugify(profession + '-' + city);
  const title = profession + ' en ' + city + ' | WorkingGo';
  const desc = 'Encontrá y contratá ' + profession.toLowerCase() + ' profesionales en ' + city + '. Servicio a domicilio verificado en WorkingGo.';
  const url = 'https://working-go.com/servicios/' + slug + '.html';
  
  return '<!DOCTYPE html>' +
    '<html lang="es">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + title + '</title>' +
    '<meta name="description" content="' + desc + '">' +
    '<meta name="keywords" content="' + profession.toLowerCase() + ' ' + city.toLowerCase() + ', contratar ' + profession.toLowerCase() + ', ' + profession.toLowerCase() + ' a domicilio">' +
    '<link rel="canonical" href="' + url + '">' +
    '<meta http-equiv="refresh" content="0;url=/">' +
    '<style>' +
    'body{font-family:sans-serif;max-width:800px;margin:50px auto;padding:20px;text-align:center}' +
    'h1{color:#667eea;font-size:2.5em}' +
    '.btn{display:inline-block;background:#667eea;color:white;padding:15px 40px;text-decoration:none;border-radius:8px;margin:20px 0}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<h1>' + profession + ' en ' + city + '</h1>' +
    '<p style="font-size:1.2em;color:#666">Profesionales verificados disponibles en WorkingGo</p>' +
    '<a href="/" class="btn">Ver Profesionales Ahora</a>' +
    '<p style="margin:30px 0;color:#999">Redirigiendo...</p>' +
    '</body>' +
    '</html>';
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true});
  }
}

function generateAllPages() {
  console.log('🚀 Generando páginas SEO optimizadas...\n');
  const outputDir = path.join(__dirname, 'servicios');
  ensureDirectoryExists(outputDir);
  let totalPages = 0;
  const allUrls = [];
  
  PROFESSIONS.forEach(profession => {
    CITIES_URUGUAY.forEach(city => {
      const slug = slugify(profession + '-' + city);
      const filePath = path.join(outputDir, slug + '.html');
      const html = generateHTML(profession, city);
      fs.writeFileSync(filePath, html, 'utf8');
      allUrls.push('https://working-go.com/servicios/' + slug + '.html');
      totalPages++;
      if (totalPages % 50 === 0) {
        console.log('✓ Generadas ' + totalPages + ' páginas...');
      }
    });
  });
  
  PROFESSIONS.forEach(profession => {
    const slug = slugify(profession + '-uruguay');
    const filePath = path.join(outputDir, slug + '.html');
    const html = generateHTML(profession, 'Uruguay');
    fs.writeFileSync(filePath, html, 'utf8');
    allUrls.push('https://working-go.com/servicios/' + slug + '.html');
    totalPages++;
  });
  
  console.log('\n✅ Completado! Generadas ' + totalPages + ' páginas HTML optimizadas\n');
  console.log('📁 Ubicación: ' + outputDir + '\n');
  
  const urlsFilePath = path.join(outputDir, 'urls-list.txt');
  fs.writeFileSync(urlsFilePath, allUrls.join('\n'), 'utf8');
  console.log('📋 Lista de URLs generada: ' + urlsFilePath + '\n');
  
  return {totalPages: totalPages, outputDir: outputDir, allUrls: allUrls};
}

if (require.main === module) {
  try {
    generateAllPages();
    console.log('🎉 Proceso completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = {generateAllPages: generateAllPages, generateHTML: generateHTML, slugify: slugify};
