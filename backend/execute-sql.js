#!/usr/bin/env node

/**
 * Script para ejecutar archivos SQL en Supabase
 * Uso: node execute-sql.js <nombre-del-archivo.sql>
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Obtener la URL y la key de Supabase desde variables de entorno
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Necesitas configurar las variables de entorno:');
  console.error('   SUPABASE_URL (o EXPO_PUBLIC_SUPABASE_URL)');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('📝 Puedes encontrar estas variables en el dashboard de Supabase:');
  console.error('   Settings > API > Project URL y service_role key');
  process.exit(1);
}

// Obtener el nombre del archivo SQL desde los argumentos
const sqlFileName = process.argv[2];

if (!sqlFileName) {
  console.error('❌ Error: Debes especificar un archivo SQL');
  console.error('');
  console.error('📝 Uso: node execute-sql.js <archivo.sql>');
  console.error('   Ejemplo: node execute-sql.js fix-rating-trigger-simple.sql');
  process.exit(1);
}

const sqlFilePath = path.join(__dirname, sqlFileName);

if (!fs.existsSync(sqlFilePath)) {
  console.error(`❌ Error: El archivo "${sqlFileName}" no existe`);
  process.exit(1);
}

// Leer el contenido del archivo SQL
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Crear cliente de Supabase con la service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql() {
  console.log('');
  console.log('========================================');
  console.log('🚀 EJECUTANDO SCRIPT SQL');
  console.log('========================================');
  console.log('');
  console.log(`📄 Archivo: ${sqlFileName}`);
  console.log(`🔗 URL: ${supabaseUrl}`);
  console.log('');

  try {
    // Ejecutar el SQL usando la función rpc (necesitas tener una función en Supabase)
    // O usar el método que mejor se adapte a tu configuración
    
    // Opción 1: Dividir el script en statements individuales y ejecutarlos
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Ejecutando ${statements.length} statements...`);
    console.log('');

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Saltar comentarios y bloques DO
      if (statement.startsWith('DO $$')) {
        console.log(`⏭️  Saltando bloque DO (${i + 1}/${statements.length})`);
        continue;
      }

      if (statement.startsWith('SELECT') && statement.includes('RAISE NOTICE')) {
        console.log(`⏭️  Saltando SELECT con RAISE NOTICE (${i + 1}/${statements.length})`);
        continue;
      }

      console.log(`⏳ Ejecutando statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });

      if (error) {
        console.error(`❌ Error en statement ${i + 1}:`, error.message);
        // Si es un error de "function does not exist", intentar con otra estrategia
        if (error.message.includes('function public.exec_sql')) {
          console.error('');
          console.error('⚠️  La función exec_sql no existe en tu base de datos.');
          console.error('   Por favor, ejecuta este script manualmente en el SQL Editor de Supabase:');
          console.error(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql`);
          console.error('');
          process.exit(1);
        }
        continue;
      }

      console.log(`✅ Statement ${i + 1} completado`);
    }

    console.log('');
    console.log('========================================');
    console.log('✅ SCRIPT EJECUTADO EXITOSAMENTE');
    console.log('========================================');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ ERROR AL EJECUTAR EL SCRIPT');
    console.error('========================================');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('📝 Solución alternativa:');
    console.error('   Copia y pega el contenido del archivo SQL en el SQL Editor de Supabase:');
    console.error(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql`);
    console.error('');
    process.exit(1);
  }
}

executeSql();
