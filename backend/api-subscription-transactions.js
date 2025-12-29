// Endpoint: /api/subscription/transactions/:userId
// Devuelve el historial de transacciones de suscripción de un usuario

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// GET /api/subscription/transactions/:userId
router.get('/api/subscription/transactions/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'userId requerido' });
  }

  // Consulta la función de Supabase para obtener transacciones
  const { data, error } = await supabase.rpc('get_user_subscription_transactions', { user_id: userId });
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data || []);
});

module.exports = router;
