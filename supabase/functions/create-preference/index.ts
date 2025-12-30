import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Manejo de CORS
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Recibe userId, currency y amount desde el frontend
    const { userId, currency = "UYU", amount = 20 } = await req.json();

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    
    // MEJORA: Definimos la URL exacta de TU proyecto para evitar errores de cálculo
    // Esta es la URL de la función webhook que acabamos de arreglar
    const webhookUrl = "https://oeabhlewxekejmgrucrz.supabase.co/functions/v1/mp-webhook";

    console.log("Creando preferencia para usuario:", userId);
    console.log("Webhook destino:", webhookUrl);

    const preference = {
      items: [{
        title: "Suscripción Premium - WorkingGo",
        unit_price: Number(amount), // Aseguramos que sea número
        quantity: 1,
        currency_id: currency,
      }],
      back_urls: {
        // Asegúrate de que estas URLs existan en tu Frontend
        success: "https://working-go.com/subscription/success",
        failure: "https://working-go.com/subscription/failure",
      },
      auto_return: "approved",
      external_reference: userId,
      notification_url: webhookUrl, // <--- Aquí usamos la URL fija y segura
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${accessToken}` 
      },
      body: JSON.stringify(preference),
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error("Error MP:", data);
      throw new Error(JSON.stringify(data));
    }

    return new Response(JSON.stringify({ initPoint: data.init_point }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error create-preference:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});