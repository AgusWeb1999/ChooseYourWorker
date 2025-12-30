import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { userId } = await req.json();

    if (!userId) throw new Error("UserId is required");

    // Actualizamos el estado a 'cancelled'
    // IMPORTANTE: NO borramos la fecha end_date, para que siga disfrutando hasta que venza.
    const { error } = await supabase
      .from("users")
      .update({ 
        subscription_status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (error) throw error;

    return new Response(JSON.stringify({ message: "Subscription cancelled" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});