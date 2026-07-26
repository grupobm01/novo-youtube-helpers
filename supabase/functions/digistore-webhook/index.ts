// supabase/functions/digistore-webhook/index.ts
//
// Recebe o postback do Digistore24, aceitando JSON ou form-urlencoded.
//
// Filtros aplicados, nesta ordem:
// 0. Compliance: bloqueia emails/domínios/nomes conhecidos de teste
//    e compliance do próprio Digistore24 (nunca cria conta pra eles)
// 1. Segurança: postbackType === "lvbl2023"
// 2. Regra de negócio: status === "completed"
// 3. Regra de negócio: utmSource contém "fb" ou "tiktok"
//
// Usuário existente: não altera nada, só loga "existing_user_kept".
// Usuário novo: cria + upsert inicial com balance 240.
//
// Toda chamada (processada ou bloqueada) é registrada em
// public.postback_logs.
//
// Mantido por decisão do dono do projeto: senha fixa "123456".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPECTED_TOKEN_VALUE = "lvbl2023";
const ALLOWED_UTM_SOURCES = ["fb", "tiktok"];

// ============================================================
// FILTRO DE COMPLIANCE DIGISTORE
// ============================================================
const BLOCKED_EMAILS = new Set([
  "sergiu.leonte@digistore24.team",
  "676158@test-ds24.com",
  "676157@test-ds24.com",
  "676156@test-ds24.com",
  "676155@test-ds24.com",
  "676154@test-ds24.com",
  "jepibex833@niprack.com",
  "mirjana.milovanovic@digistore24.team",
  "raven.pinlac@digistore24.team",
  "672838@test-ds24.com",
  "alindigitest@gmail.com",
  "667069@test-ds24.com",
  "667068@test-ds24.com",
  "667067@test-ds24.com",
  "667066@test-ds24.com",
  "667065@test-ds24.com",
  "fodah41074@2insp.com",
  "645264@test-ds24.com",
]);

const BLOCKED_DOMAINS = [
  "@test-ds24.com",
  "@digistore24.team",
  "@digistore24.com",
  "@digistore.com",
  "@ds24.com",
  "@ds-24.com",
  "@test.com",
];

const BLOCKED_LOCAL_KEYWORDS = ["digistore", "ds24", "digi24"];

const BLOCKED_NAME_PATTERNS = [
  "digistore",
  "digi store",
  "ds24",
  "ds-24",
  "digistore24",
  "digistore24-tester",
  "digitesting",
  "digitest",
  "testdigi",
  "test-digi",
  "digi-test",
  "digi24",
  "tester24",
  "compliance",
  "test account",
  "test user",
  "testaccount",
];

function checkDigistoreCompliance(
  email: string,
  firstName: string,
  lastName: string,
): { blocked: boolean; reason: string } {
  const buyerEmail = email.trim().toLowerCase();
  const fullName = `${firstName} ${lastName}`.trim().toLowerCase();

  if (BLOCKED_EMAILS.has(buyerEmail)) {
    return { blocked: true, reason: "email_exact_match" };
  }

  for (const domain of BLOCKED_DOMAINS) {
    if (buyerEmail.endsWith(domain)) {
      return { blocked: true, reason: `blocked_domain:${domain}` };
    }
  }

  const localPart = buyerEmail.split("@")[0] || "";
  for (const kw of BLOCKED_LOCAL_KEYWORDS) {
    if (localPart.includes(kw)) {
      return { blocked: true, reason: `blocked_local_keyword:${kw}` };
    }
  }

  for (const pattern of BLOCKED_NAME_PATTERNS) {
    if (fullName.includes(pattern)) {
      return { blocked: true, reason: `blocked_name_pattern:${pattern}` };
    }
  }

  if (/\btest\b/.test(fullName)) {
    return { blocked: true, reason: "blocked_name_pattern:test" };
  }

  return { blocked: false, reason: "ok" };
}
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://www.digistore24.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

interface DigistorePayload {
  [key: string]: string | undefined;
}

async function logPostback(
  supabaseAdmin: ReturnType<typeof createClient>,
  rawParams: unknown,
  success: boolean,
  error?: string,
  resolvedEmail?: string,
  resolvedUserId?: string,
) {
  try {
    await supabaseAdmin.from("postback_logs").insert({
      raw_params: rawParams,
      success,
      error: error ?? null,
      resolved_email: resolvedEmail ?? null,
      resolved_user_id: resolvedUserId ?? null,
    });
  } catch (logErr) {
    console.error("Falha ao gravar postback_logs:", logErr);
  }
}

function isAllowedUtmSource(utmSource: string | undefined): boolean {
  if (!utmSource) return false;
  const lower = utmSource.toLowerCase();
  return ALLOWED_UTM_SOURCES.some((allowed) => lower.includes(allowed));
}

async function parseRequestBody(req: Request): Promise<DigistorePayload> {
  const contentType = req.headers.get("content-type") || "";

  const urlParams: DigistorePayload = {};
  try {
    const url = new URL(req.url);
    url.searchParams.forEach((value, key) => {
      urlParams[key] = value;
    });
  } catch {
    // ignora
  }

  if (req.method === "GET" || req.method === "HEAD") {
    return urlParams;
  }

  let bodyParams: DigistorePayload = {};
  try {
    if (contentType.includes("application/json")) {
      bodyParams = await req.json();
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        bodyParams[key] = String(value);
      });
    } else {
      const rawText = await req.text();
      if (rawText.trim()) {
        try {
          bodyParams = JSON.parse(rawText);
        } catch {
          const params = new URLSearchParams(rawText);
          params.forEach((value, key) => {
            bodyParams[key] = value;
          });
        }
      }
    }
  } catch {
    // se falhar parse do body, ainda temos urlParams
  }

  return { ...urlParams, ...bodyParams };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  let payload: DigistorePayload;
  try {
    payload = await parseRequestBody(req);
  } catch (parseErr) {
    console.error("Falha ao parsear corpo da requisição:", parseErr);
    await logPostback(supabaseAdmin, {}, false, "unparseable_body");
    return new Response(
      JSON.stringify({ success: false, error: "unparseable_body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const email = payload.email || "";
    const firstName = payload.firstName || "";
    const lastName = payload.lastName || "";
    const orderId = payload.orderId;

    // 0. Compliance: bloqueia contas de teste/compliance do Digistore
    const compliance = checkDigistoreCompliance(email, firstName, lastName);
    if (compliance.blocked) {
      await logPostback(supabaseAdmin, payload, false, `blocked_compliance:${compliance.reason}`);
      return new Response(
        JSON.stringify({ success: false, error: "blocked_compliance", reason: compliance.reason }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Segurança: token fixo
    if (payload.postbackType !== EXPECTED_TOKEN_VALUE) {
      await logPostback(supabaseAdmin, payload, false, "invalid_token");
      return new Response(
        JSON.stringify({ success: false, error: "invalid_token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Regra de negócio: só processa transação completa
    if (payload.status !== "completed") {
      await logPostback(supabaseAdmin, payload, false, "status_not_completed");
      return new Response(
        JSON.stringify({ success: false, error: "status_not_completed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Regra de negócio: só processa se veio de FB ou TikTok
    if (!isAllowedUtmSource(payload.utmSource)) {
      await logPostback(supabaseAdmin, payload, false, "utm_source_not_allowed");
      return new Response(
        JSON.stringify({ success: false, error: "utm_source_not_allowed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!email) {
      await logPostback(supabaseAdmin, payload, false, "missing_email");
      return new Response(
        JSON.stringify({ success: false, error: "missing_email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      await logPostback(supabaseAdmin, payload, true, "existing_user_kept", email, existingProfile.id as string);
      return new Response(
        JSON.stringify({ success: true, userId: existingProfile.id, note: "existing_user_kept" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "123456",
      email_confirm: true,
      user_metadata: {
        full_name: [firstName, lastName].filter(Boolean).join(" "),
      },
    });

    if (createError || !created?.user) {
      console.error("Erro ao criar usuário:", createError, "order_id:", orderId);
      await logPostback(supabaseAdmin, payload, false, "user_creation_failed", email);
      return new Response(
        JSON.stringify({ success: false, error: "user_creation_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = created.user.id;

    const { error: upsertError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          full_name: [firstName, lastName].filter(Boolean).join(" ") || undefined,
          balance: 240,
          avatar_color: "rgb(21, 101, 192)",
          member_since: new Date().toLocaleString("en-US", { month: "short", year: "numeric" }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (upsertError) {
      console.error("Erro no upsert de profile:", upsertError, "order_id:", orderId);
      await logPostback(supabaseAdmin, payload, false, "profile_upsert_failed", email, userId);
      return new Response(
        JSON.stringify({ success: false, error: "profile_upsert_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await logPostback(supabaseAdmin, payload, true, undefined, email, userId);

    return new Response(
      JSON.stringify({ success: true, userId, order_id: orderId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro inesperado no postback:", err);
    await logPostback(supabaseAdmin, payload, false, "unexpected_error");
    return new Response(
      JSON.stringify({ success: false, error: "unexpected_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
