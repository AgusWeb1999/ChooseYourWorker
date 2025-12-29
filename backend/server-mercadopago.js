require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Importar y montar el endpoint de transacciones de suscripción
const apiSubscriptionTransactions = require('./api-subscription-transactions');
app.use(apiSubscriptionTransactions);

// CORS: permitir llamadas desde cualquier origen en desarrollo
app.use(
  cors({
    origin: true, // Permitir todos los orígenes (desarrollo)
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Configuración de Supabase
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en backend/.env');
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY // Usar SERVICE_KEY para operaciones del backend
);

// Log en inicio (enmascarado) para verificar carga de .env sin exponer secretos
const mask = (v) => (v ? `${String(v).slice(0, 4)}… (len:${String(v).length})` : 'undefined');
console.log('[Init] Supabase URL:', SUPABASE_URL, '| Service key:', mask(SUPABASE_SERVICE_KEY));

// Configuración de Mercado Pago
const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const preferenceClient = new Preference(mercadopago);
const paymentClient = new Payment(mercadopago);

// Precio de suscripción mensual
const SUBSCRIPTION_PRICE_USD = 0.5;

// ============================================
// ENDPOINT: Crear preferencia de pago
// ============================================
app.post('/api/mercadopago/create-preference', async (req, res) => {
  try {
    const { userId, currency = 'USD', amount = 20 } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    // Verificar que el usuario existe (por id o por auth_uid)
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      if (userError) {
        console.warn('No encontrado por id, intentando por auth_uid. Error:', userError);
      } else {
        console.warn('Usuario no encontrado por id:', userId);
      }

      const byAuthUid = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('auth_uid', userId)
        .single();

      user = byAuthUid.data;
      userError = byAuthUid.error;

      if (userError || !user) {
        if (userError) {
          console.error('Error consultando users por auth_uid en Supabase:', userError);
        } else {
          console.warn('Usuario no encontrado en tabla users por auth_uid:', userId);
        }
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
    }


    let finalCurrency = currency;
    let finalAmount = amount;

    if (currency === 'ARS') {
      const { data: conversion, error: conversionError } = await supabase.rpc('convert_currency', {
        amount,
        from_currency: 'UYU',
        to_currency: 'ARS',
      });
      if (conversionError || !conversion) {
        console.error('Error al convertir moneda:', conversionError);
        return res.status(500).json({ error: 'No se pudo obtener la cotización UYU→ARS' });
      }
      finalCurrency = 'ARS';
      finalAmount = Number(conversion);
    } else if (currency === 'UYU') {
      // Forzar siempre 20 UYU para uruguayos
      finalCurrency = 'UYU';
      finalAmount = 20;
    }

    console.log('[MP] Preferencia: moneda', finalCurrency, 'monto', finalAmount);

    // Crear preferencia de pago con el monto y moneda correctos
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            title: 'Suscripción Premium - ChooseYourWorker',
            description: 'Suscripción mensual premium con funcionalidades ilimitadas',
            unit_price: finalAmount,
            quantity: 1,
            currency_id: finalCurrency,
          },
        ],
        payer: {
          email: user.email,
          name: user.full_name || undefined,
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/subscription/success`,
          failure: `${process.env.FRONTEND_URL}/subscription/failure`,
          pending: `${process.env.FRONTEND_URL}/subscription/pending`,
        },
        external_reference: userId, // Para identificar el usuario en el webhook
        notification_url: `${process.env.BACKEND_URL}/api/mercadopago/webhook`,
        statement_descriptor: 'ChooseYourWorker',
        metadata: {
          user_id: userId,
          subscription_type: 'premium',
          duration_months: 1,
          original_currency: currency,
          original_amount: amount,
          converted_amount: finalAmount,
          converted_currency: finalCurrency,
        },
      },
    });

    res.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
    });
  } catch (error) {
    console.error('Error al crear preferencia:', error);
    res.status(500).json({ 
      error: 'Error al crear preferencia de pago',
      details: error.message 
    });
  }
});

// ============================================
// WEBHOOK: Notificaciones de Mercado Pago
// ============================================
app.post('/api/mercadopago/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('Webhook recibido:', { type, data });

    // Solo procesar notificaciones de pago
    if (type === 'payment') {
      const paymentId = data.id;

      // Obtener detalles del pago
      const payment = await paymentClient.get({ id: paymentId });

      console.log('Pago obtenido:', payment);

      const userId = payment.external_reference;
      const status = payment.status;

      // Registrar transacción en la base de datos
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          amount: payment.transaction_amount,
          currency: payment.currency_id,
          payment_provider: 'mercadopago',
          transaction_id: payment.id.toString(),
          status: status === 'approved' ? 'approved' : status,
          metadata: payment,
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error al registrar transacción:', transactionError);
      }

      // Si el pago fue aprobado, activar suscripción
      if (status === 'approved') {
        const { error: subscriptionError } = await supabase.rpc('update_subscription', {
          p_user_id: userId,
          p_subscription_type: 'premium',
          p_subscription_status: 'active',
          p_payment_provider: 'mercadopago',
          p_subscription_id: payment.id.toString(),
          p_months: 1,
        });

        if (subscriptionError) {
          console.error('Error al activar suscripción:', subscriptionError);
        } else {
          console.log(`Suscripción activada para usuario ${userId}`);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).send('Error');
  }
});

// ============================================
// ENDPOINT: Verificar estado de pago
// ============================================
app.get('/api/mercadopago/payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await paymentClient.get({ id: paymentId });

    res.json({
      status: payment.status,
      statusDetail: payment.status_detail,
      transactionAmount: payment.transaction_amount,
      currencyId: payment.currency_id,
    });
  } catch (error) {
    console.error('Error al verificar pago:', error);
    res.status(500).json({ error: 'Error al verificar pago' });
  }
});

// ============================================
// ENDPOINT: Cancelar suscripción
// ============================================
app.post('/api/subscription/cancel', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    // 1. Obtener el preapproval/subscription_id del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('subscription_id, payment_provider')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Usuario no encontrado o error:', userError);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // 2. Cancelar la suscripción en Mercado Pago si corresponde
    if (user.payment_provider === 'mercadopago' && user.subscription_id) {
      try {
        // Mercado Pago preapproval cancellation endpoint
        const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        const preapprovalId = user.subscription_id;
        const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mpAccessToken}`,
          },
          body: JSON.stringify({ status: 'cancelled' }),
        });
        const result = await response.json();
        if (!response.ok) {
          console.error('Error Mercado Pago al cancelar preapproval:', result);
          // No retornamos error, seguimos con la cancelación local
        }
      } catch (mpError) {
        console.error('Error llamando a Mercado Pago para cancelar preapproval:', mpError);
        // No retornamos error, seguimos con la cancelación local
      }
    }

    // 3. Cancelar la suscripción en Supabase
    const { error } = await supabase.rpc('cancel_subscription', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error al cancelar suscripción:', error);
      return res.status(500).json({ error: 'Error al cancelar suscripción' });
    }

    res.json({ message: 'Suscripción cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    res.status(500).json({ error: 'Error al cancelar suscripción' });
  }
});

// ============================================
// ENDPOINT: Obtener historial de transacciones
// ============================================
app.get('/api/subscription/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener transacciones:', error);
      return res.status(500).json({ error: 'Error al obtener transacciones' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
});

// ============================================
// ENDPOINT: Obtener estado de suscripción
// ============================================
app.get('/api/subscription/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('subscription_type, subscription_status, subscription_start_date, subscription_end_date, payment_provider')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error al obtener estado de suscripción:', error);
      return res.status(500).json({ error: 'Error al obtener estado de suscripción' });
    }

    const isActive = await supabase.rpc('is_subscription_active', {
      user_uuid: userId,
    });

    res.json({
      ...data,
      isActive: isActive.data,
    });
  } catch (error) {
    console.error('Error al obtener estado de suscripción:', error);
    res.status(500).json({ error: 'Error al obtener estado de suscripción' });
  }
});

// ============================================
// CRON JOB: Expirar suscripciones vencidas
// ============================================
// Este endpoint debe ser llamado diariamente por un cron job
app.post('/api/subscription/expire', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('expire_subscriptions');

    if (error) {
      console.error('Error al expirar suscripciones:', error);
      return res.status(500).json({ error: 'Error al expirar suscripciones' });
    }

    res.json({ 
      message: 'Suscripciones expiradas exitosamente',
      affectedCount: data 
    });
  } catch (error) {
    console.error('Error al expirar suscripcione    curl -s http://localhost:3000/api/debug/user/4dda91f1-b277-4fbf-b810-a99fb8102771 | jqs:', error);
    res.status(500).json({ error: 'Error al expirar suscripciones' });
  }
});

// ============================================
// HEALTHCHECK
// ============================================
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ============================================
// DEBUG: Consultar usuario
// ============================================
app.get('/api/debug/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const byId = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', id)
      .maybeSingle();

    const byAuthUid = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('auth_uid', id)
      .maybeSingle();

    res.json({
      byId: { data: byId.data, error: byId.error },
      byAuthUid: { data: byAuthUid.data, error: byAuthUid.error },
    });
  } catch (e) {
    console.error('Error en debug user:', e);
    res.status(500).json({ error: 'debug_failed', details: e.message });
  }
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Escuchar en todas las interfaces para permitir conexiones desde móvil
app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor MercadoPago corriendo en http://${HOST}:${PORT}`);
  console.log(`📱 Acceso desde red local: http://192.168.1.3:${PORT}`);
});

module.exports = app;
