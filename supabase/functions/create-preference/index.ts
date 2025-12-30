import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Recibimos los nuevos datos del frontend
    const { userId, currency = "UYU", amount = 20, email, fullName } = await req.json();

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const webhookUrl = "https://oeabhlewxekejmgrucrz.supabase.co/functions/v1/mp-webhook";

    // Lógica para separar Nombre y Apellido (MP lo pide separado)
    let nameParts = (fullName || "Usuario").trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "User";

    const preference = {
      // 1. ITEMS DETALLADOS (Sube puntaje)
      items: [{
        id: "premium_subscription", // MP pide ID
        title: "Suscripción Premium - WorkingGo",
        description: "Acceso ilimitado a funcionalidades premium para profesionales", // MP pide descripción
        category_id: "services", // MP pide categoría
        picture_url: "https://working-go.com/assets/premium-badge.png", // Opcional, ayuda visual
        unit_price: Number(amount),
        quantity: 1,
        currency_id: currency,
      }],
      
      // 2. DATOS DEL PAGADOR (Obligatorio para aprobación de fraude)
      payer: {
        name: firstName,
        surname: lastName,
        email: email || "usuario@working-go.com", // Fallback por seguridad
        // Si tuvieras teléfono o dirección, agregarlos aquí subiría más el score
      },

      // 3. NOMBRE EN EL RESUMEN BANCARIO
      statement_descriptor: "WORKINGGO PREMIUM", 

      back_urls: {
        success: "https://working-go.com/subscription/success",
        failure: "https://working-go.com/subscription/failure",
        pending: "https://working-go.com/subscription/pending"
      },
      auto_return: "approved",
      
      // 4. REFERENCIAS INTERNAS (Conciliación)
      external_reference: userId,
      notification_url: webhookUrl,
      
      // 5. Configuración extra recomendada
      binary_mode: true, // Aprobación instantánea (sin pendientes eternos)
      expires: false,
    };

    console.log("Creando preferencia enriquecida para:", email);

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