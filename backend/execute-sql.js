const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kfqrubwmtknvjnucwyob.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY no está configurada');
  console.log('Por favor, exporta tu service key:');
  console.log('export SUPABASE_SERVICE_KEY="tu-service-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSqlFile(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`📄 Ejecutando: ${filename}`);
    console.log('─'.repeat(60));
    
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      return false;
    }
    
    console.log('✅ Script ejecutado exitosamente');
    if (data) {
      console.log('Resultado:', data);
    }
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Obtener el archivo desde los argumentos
const filename = process.argv[2];

if (!filename) {
  console.error('❌ Uso: node execute-sql.js <archivo.sql>');
  process.exit(1);
}

executeSqlFile(filename).then(success => {
  process.exit(success ? 0 : 1);
});
