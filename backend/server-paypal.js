require('dotenv').config();
const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Configuración de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configuración de PayPal
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (process.env.NODE_ENV === 'production') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
}

const client = new paypal.core.PayPalHttpClient(environment());

// Precio de suscripción
const SUBSCRIPTION_PRICE_USD = 9.99;

// ============================================
// ENDPOINT: Crear orden de PayPal
// ============================================
app.post('/api/paypal/create-order', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      application_context: {
        brand_name: 'ChooseYourWorker',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL}/subscription/success`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      },
      purchase_units: [
        {
          description: 'Suscripción Premium Mensual - ChooseYourWorker',
          custom_id: userId, // Para identificar el usuario
          amount: {
            currency_code: 'USD',
            value: SUBSCRIPTION_PRICE_USD.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: SUBSCRIPTION_PRICE_USD.toFixed(2),
              },
            },
          },
          items: [
            {
              name: 'Suscripción Premium Mensual',
              description: 'Acceso completo a funcionalidades premium por 1 mes',
              unit_amount: {
                currency_code: 'USD',
                value: SUBSCRIPTION_PRICE_USD.toFixed(2),
              },
              quantity: '1',
              category: 'DIGITAL_GOODS',
            },
          ],
        },
      ],
    });

    const order = await client.execute(request);

    res.json({
      orderId: order.result.id,
    });
  } catch (error) {
    console.error('Error al crear orden de PayPal:', error);
    res.status(500).json({ 
      error: 'Error al crear orden de pago',
      details: error.message 
    });
  }
});

// ============================================
// ENDPOINT: Capturar pago de PayPal
// ============================================
app.post('/api/paypal/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId es requerido' });
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client.execute(request);
    const captureData = capture.result;

    console.log('Captura exitosa:', captureData);

    // Obtener el userId del custom_id
    const userId = captureData.purchase_units[0].custom_id;
    const paymentId = captureData.purchase_units[0].payments.captures[0].id;
    const amount = parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value);

    // Registrar transacción
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        currency: 'USD',
        payment_provider: 'paypal',
        transaction_id: paymentId,
        subscription_id: orderId,
        status: 'approved',
        metadata: captureData,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error al registrar transacción:', transactionError);
    }

    // Activar suscripción
    const { error: subscriptionError } = await supabase.rpc('update_subscription', {
      p_user_id: userId,
      p_subscription_type: 'premium',
      p_subscription_status: 'active',
      p_payment_provider: 'paypal',
      p_subscription_id: orderId,
      p_months: 1,
    });

    if (subscriptionError) {
      console.error('Error al activar suscripción:', subscriptionError);
      return res.status(500).json({ error: 'Error al activar suscripción' });
    }

    res.json({
      status: 'success',
      orderId: orderId,
      paymentId: paymentId,
    });
  } catch (error) {
    console.error('Error al capturar pago:', error);
    res.status(500).json({ 
      error: 'Error al procesar pago',
      details: error.message 
    });
  }
});

// ============================================
// WEBHOOK: Notificaciones de PayPal
// ============================================
app.post('/api/paypal/webhook', async (req, res) => {
  try {
    const webhookEvent = req.body;

    console.log('Webhook de PayPal recibido:', webhookEvent);

    // Verificar el webhook (en producción, debes validar la firma)
    const eventType = webhookEvent.event_type;

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Pago completado (ya manejado en capture-order)
        console.log('Pago completado:', webhookEvent.resource);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        // Pago denegado
        const deniedOrderId = webhookEvent.resource.supplementary_data.related_ids.order_id;
        console.log('Pago denegado:', deniedOrderId);
        
        // Actualizar transacción
        await supabase
          .from('payment_transactions')
          .update({ status: 'rejected' })
          .eq('subscription_id', deniedOrderId);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        // Pago reembolsado
        const refundedOrderId = webhookEvent.resource.supplementary_data.related_ids.order_id;
        console.log('Pago reembolsado:', refundedOrderId);
        
        // Actualizar transacción y cancelar suscripción
        await supabase
          .from('payment_transactions')
          .update({ status: 'refunded' })
          .eq('subscription_id', refundedOrderId);

        // Obtener userId de la transacción
        const { data: transaction } = await supabase
          .from('payment_transactions')
          .select('user_id')
          .eq('subscription_id', refundedOrderId)
          .single();

        if (transaction) {
          await supabase.rpc('cancel_subscription', {
            p_user_id: transaction.user_id,
          });
        }
        break;

      default:
        console.log('Evento no manejado:', eventType);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error en webhook de PayPal:', error);
    res.status(500).send('Error');
  }
});

// ============================================
// ENDPOINT: Obtener detalles de orden
// ============================================
app.get('/api/paypal/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const request = new paypal.orders.OrdersGetRequest(orderId);
    const order = await client.execute(request);

    res.json(order.result);
  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({ error: 'Error al obtener orden' });
  }
});

const PORT = process.env.PAYPAL_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor PayPal corriendo en puerto ${PORT}`);
});

module.exports = app;
