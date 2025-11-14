// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const [{ count: certCount }, { count: txnCount }, recentRes] = await Promise.all([
      supabase.from("certificates").select("id", { count: "exact", head: true }),
      supabase.from("blockchain_transactions").select("id", { count: "exact", head: true }),
      supabase
        .from("blockchain_transactions")
        .select("id,timestamp,transaction_type,current_hash,previous_hash")
        .order("timestamp", { ascending: false })
        .limit(10),
    ]);

    if (recentRes.error) throw recentRes.error;

    return new Response(
      JSON.stringify({
        total_certificates: certCount ?? 0,
        total_transactions: txnCount ?? 0,
        recent_transactions: recentRes.data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (e) {
    console.error("public-stats error", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
