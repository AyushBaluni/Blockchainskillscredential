// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toHex(buffer: ArrayBuffer) {
  const byteArray = new Uint8Array(buffer);
  const hexCodes = [...byteArray].map((value) => value.toString(16).padStart(2, "0"));
  return hexCodes.join("");
}

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return toHex(hashBuffer);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cert_number } = await req.json();
    if (!cert_number) {
      return new Response(JSON.stringify({ error: "cert_number is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Use existing DB function to fetch data consistently
    const { data: verifyData, error: verifyError } = await supabase
      .rpc("verify_certificate_public" as any, { cert_number }) as any;

    if (verifyError || !verifyData || (Array.isArray(verifyData) && verifyData.length === 0)) {
      return new Response(JSON.stringify({ valid: false, message: "Certificate not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const cert = Array.isArray(verifyData) ? verifyData[0] : verifyData;

    const isValid = cert.status === "issued";

    // Ensure blockchain hash exists
    let blockchain_hash = cert.blockchain_hash as string | null;
    if (!blockchain_hash) {
      const canonical = JSON.stringify({
        certificate_number: cert.certificate_number,
        qualification_name: cert.qualification_name,
        qualification_level: cert.qualification_level,
        ncrf_level: cert.ncrf_level,
        issue_date: cert.issue_date,
        expiry_date: cert.expiry_date,
        learner_full_name: cert.learner_full_name,
        institution_name: cert.institution_name,
      });
      blockchain_hash = await sha256(canonical);

      // Update certificate with new hash
      await supabase
        .from("certificates")
        .update({ blockchain_hash, blockchain_timestamp: new Date().toISOString() })
        .eq("certificate_number", cert.certificate_number);
    }

    // Insert blockchain transaction
    const current_hash = await sha256(JSON.stringify({
      certificate_number: cert.certificate_number,
      at: new Date().toISOString(),
      action: "verification",
    }));

    await supabase.from("blockchain_transactions").insert({
      transaction_data: {
        event: "verification",
        certificate_number: cert.certificate_number,
        result: isValid ? "valid" : `status:${cert.status}`,
      },
      previous_hash: blockchain_hash,
      current_hash,
      transaction_type: "verification",
      certificate_id: null,
    });

    const response = {
      valid: isValid,
      certificate: {
        certificate_number: cert.certificate_number,
        qualification_name: cert.qualification_name,
        qualification_level: cert.qualification_level,
        ncrf_level: cert.ncrf_level,
        issue_date: cert.issue_date,
        expiry_date: cert.expiry_date,
        blockchain_hash,
        blockchain_timestamp: cert.blockchain_timestamp,
        status: cert.status,
      },
      institution: {
        name: cert.institution_name,
        registration_number: cert.institution_registration_number,
        ncvet_approved: cert.institution_ncvet_approved,
      },
      learner: { full_name: cert.learner_full_name },
      message: isValid ? "Certificate is valid and blockchain-verified!" : `Certificate status: ${cert.status}`,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("verify-and-log error", e);
    return new Response(JSON.stringify({ valid: false, message: "Internal error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
