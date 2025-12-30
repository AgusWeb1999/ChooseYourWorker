import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, content-type",
};

function log(msg: string, data?: any) {
  console.log(msg, data ? JSON.stringify(data) : "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let body: any;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      body = await req.json().catch(() => ({}));
    }

    const eventType = body.type || body.topic;
    const paymentId = body.data?.id || body.id;

    if (eventType === "payment" && paymentId) {
      log(`Procesando pago ID: ${paymentId}`);
      const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (mpRes.ok) {
        const payment = await mpRes.json();
        const userId = payment.external_reference;
        const status = payment.status;

        if (userId && status === "approved") {
          const now = new Date();
          const nextMonth = new Date(now);
          nextMonth.setMonth(now.getMonth() + 1);

          // 1. Actualizar tabla privada USERS (para que el usuario gestione su cuenta)
          const updateUsers = await supabase
            .from("users")
            .update({ 
              subscription_type: "premium",
              subscription_status: "active",
              subscription_start_date: now.toISOString(),
              subscription_end_date: nextMonth.toISOString(),
              updated_at: now.toISOString()
            })
            .eq("id", userId);

          if (updateUsers.error) throw updateUsers.error;

          // 2. Actualizar tabla pública PROFESSIONALS (para que aparezca en el Home)
          // Esto es lo nuevo que soluciona tu problema de seguridad
          const updateProf = await supabase
            .from("professionals")
            .update({
              is_premium: true,
              subscription_end_date: nextMonth.toISOString()
            })
            .eq("user_id", userId);

          if (updateProf.error) {
            log("Usuario no es profesional o error al actualizar professionals:", updateProf.error);
            // No lanzamos error aquí para no revertir el pago, solo logueamos
          }

          log(`¡Éxito Total! Usuario ${userId} actualizado a Premium en ambas tablas.`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (e) {
    log("Error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 200, headers: corsHeaders });
  }
});