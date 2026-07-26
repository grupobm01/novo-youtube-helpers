// Testes de integração para a edge function `digistore-webhook`.
//
// Chama a function já deployada em produção, simulando exatamente
// a chamada GET que o Digistore24 faz no S2S Postback, e valida:
//   1. Token inválido → 401
//   2. Sem email → 400
//   3. Chamada válida → 200 com { success: true, userId, order_id }
//
// Rode com o tool `test_edge_functions` (Deno test runner).

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const FN_URL = `${SUPABASE_URL.replace(".supabase.co", ".functions.supabase.co")}/digistore-webhook`;

// email único por execução para não colidir com corridas anteriores
const uniqueEmail = () =>
  `digistore-test+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

Deno.test("rejeita chamada sem token com 401", async () => {
  const res = await fetch(`${FN_URL}?email=${encodeURIComponent(uniqueEmail())}`);
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.success, false);
  assertEquals(body.error, "invalid_token");
});

Deno.test("rejeita chamada com token errado com 401", async () => {
  const res = await fetch(`${FN_URL}?postbackType=errado&email=${encodeURIComponent(uniqueEmail())}`);
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "invalid_token");
});

Deno.test("rejeita chamada sem email com 400", async () => {
  const res = await fetch(`${FN_URL}?postbackType=lvbl2023`);
  const body = await res.json();
  assertEquals(res.status, 400);
  assertEquals(body.error, "missing_email");
});

Deno.test("aceita postback válido do Digistore e responde 200", async () => {
  const email = uniqueEmail();
  const orderId = `TEST-${Date.now()}`;
  const params = new URLSearchParams({
    postbackType: "lvbl2023",
    email,
    first_name: "Test",
    last_name: "Buyer",
    order_id: orderId,
  });

  const res = await fetch(`${FN_URL}?${params.toString()}`);
  const body = await res.json();

  assertEquals(res.status, 200, `Resposta inesperada: ${JSON.stringify(body)}`);
  assertEquals(body.success, true);
  assertEquals(body.order_id, orderId);
  assert(typeof body.userId === "string" && body.userId.length > 0, "userId ausente");
});

Deno.test("segunda chamada com mesmo email reutiliza o usuário (idempotente)", async () => {
  const email = uniqueEmail();
  const url = `${FN_URL}?postbackType=lvbl2023&email=${encodeURIComponent(email)}&first_name=Ana&last_name=Silva&order_id=IDEMP-1`;

  const first = await fetch(url);
  const firstBody = await first.json();
  assertEquals(first.status, 200, JSON.stringify(firstBody));

  const second = await fetch(url.replace("IDEMP-1", "IDEMP-2"));
  const secondBody = await second.json();
  assertEquals(second.status, 200, JSON.stringify(secondBody));

  assertEquals(firstBody.userId, secondBody.userId, "userId deveria ser o mesmo");
});