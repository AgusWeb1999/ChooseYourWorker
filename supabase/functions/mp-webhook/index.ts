import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, content-type",
};

// Función auxiliar para logs limpios en Supabase Dashboard
function log(msg: string, data?: any) {
  console.log(msg, data ? JSON.stringify(data) : "");
}

serve(async (req) => {
  // Manejo de CORS (Pre-flight)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Manejo robusto del Body (JSON o Form)
    let body: any;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      body = {};
      for (const [key, value] of form.entries()) {
        body[key] = value;
      }
    } else {
      // Intento final de parseo
      body = await req.json().catch(() => ({}));
    }

    log("Webhook recibido. Payload:", body);

    // 2. Verificación GET (MercadoPago a veces verifica la URL así)
    if (req.method === "GET") {
      log("Recibida petición GET de verificación");
      return new Response("ok", { headers: corsHeaders });
    }

    // 3. Validar tipo de evento (Payment)
    const eventType = body.type || body.topic;
    const paymentId = body.data?.id || body.id;

    if (eventType === "payment" && paymentId) {
      log(`Procesando pago ID: ${paymentId}`);
      
      const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

      // 4. Consultar API de MercadoPago
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (mpRes.ok) {
        const payment = await mpRes.json();
        log("Estado del pago en MP:", { status: payment.status, ref: payment.external_reference });

        const userId = payment.external_reference;
        const status = payment.status;

        if (userId && status === "approved") {
          // Calcular fechas (1 mes de suscripción)
          const now = new Date();
          const nextMonth = new Date(now);
          nextMonth.setMonth(now.getMonth() + 1);

          // 5. Actualizar Usuario en Supabase
          const { error } = await supabase
            .from("users")
            .update({ 
              subscription_type: "premium",
              subscription_status: "active",
              subscription_start_date: now.toISOString(),
              subscription_end_date: nextMonth.toISOString(),
              updated_at: now.toISOString()
            })
            .eq("id", userId);

          if (error) {
            log("Error CRÍTICO al actualizar BD:", error);
            throw error;
          } else {
            log(`¡Éxito! Usuario ${userId} actualizado a Premium.`);
          }
        } else {
          log("El pago no está aprobado o falta el ID de usuario.", { userId, status });
        }
      } else {
        log("Error al consultar API de MercadoPago", { status: mpRes.status });
      }
    } else {
      log("Evento ignorado (no es pago o falta ID)", body);
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (e) {
    log("Excepción en Webhook:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});