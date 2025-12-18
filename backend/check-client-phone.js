#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Known Supabase credentials
const SUPABASE_URL = 'https://oeabhlewxekejmgrucrz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lYWJobGV3eGVrZWptZ3J1Y3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTIzNTk4NjcsImV4cCI6MjAyNzkzNTg2N30.vY7O6KBvR0SfnbjIqVDtw0hI0MfHLfUpBJO4DQmVd0Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkClientPhones() {
  try {
    console.log('🔍 Verificando teléfonos de clientes...\n');

    // Get all clients
    const { data: clients, error: clientError } = await supabase
      .from('users')
      .select('id, full_name, email, phone, address, user_type')
      .eq('user_type', 'client');

    if (clientError) throw clientError;

    console.log(`📊 Total de clientes: ${clients.length}\n`);
    console.log('Clientes con teléfono:');
    const withPhone = clients.filter(c => c.phone);
    console.log(`  ✓ ${withPhone.length} clientes tienen teléfono`);
    const withoutPhone = clients.filter(c => !c.phone);
    console.log(`  ✗ ${withoutPhone.length} clientes SIN teléfono\n`);

    if (withoutPhone.length > 0 && withoutPhone.length <= 5) {
      console.log('Clientes sin teléfono:');
      withoutPhone.forEach(c => {
        console.log(`  - ${c.full_name} (${c.email})`);
      });
    }

    // Check hires for specific job
    console.log('\n🎯 Analizando trabajos activos...');
    const { data: hires, error: hiresError } = await supabase
      .from('hires')
      .select(`
        id, status, professional_id, client_id,
        client:client_id (id, full_name, email, phone, address)
      `)
      .in('status', ['pending', 'accepted', 'in_progress']);

    if (hiresError) throw hiresError;

    console.log(`\n📋 Trabajos con status pending/accepted/in_progress: ${hires.length}\n`);
    
    hires.forEach((hire, idx) => {
      console.log(`${idx + 1}. Trabajo ID: ${hire.id}`);
      console.log(`   Status: ${hire.status}`);
      console.log(`   Cliente: ${hire.client?.full_name}`);
      console.log(`   Teléfono: ${hire.client?.phone || '❌ NO TIENE'}`);
      console.log(`   Email: ${hire.client?.email}`);
      console.log(`   Dirección: ${hire.client?.address || 'N/A'}`);
      console.log('');
    });

    if (withoutPhone.length > 0) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
      console.log(`   ${withoutPhone.length} clientes no tienen teléfono registrado.`);
      console.log('   Debes completar tu perfil con tu número de teléfono.');
      console.log('\n🔧 SOLUCIÓN:');
      console.log('   1. Login como cliente');
      console.log('   2. Ir a Perfil');
      console.log('   3. Actualizar número de teléfono');
      console.log('   4. Guardar cambios\n');
    } else {
      console.log('\n✅ Todos los clientes tienen teléfono registrado!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkClientPhones();
