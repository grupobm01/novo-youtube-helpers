import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FROM_ADDRESS = "Rewards <no-reply@youtubeawards.online>";

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data: steps, error: stepsError } = await supabaseAdmin
      .from("reminder_email_steps")
      .select("*")
      .eq("is_active", true)
      .order("step_order", { ascending: true });

    if (stepsError) {
      console.error("Erro ao buscar reminder_email_steps:", stepsError);
      return new Response(JSON.stringify({ success: false, error: "steps_fetch_failed" }), { status: 500 });
    }

    if (!steps || steps.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, note: "no_active_steps" }), { status: 200 });
    }

    const { data: pendingProfiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, created_at")
      .is("first_login_at", null);

    if (profilesError) {
      console.error("Erro ao buscar profiles pendentes:", profilesError);
      return new Response(JSON.stringify({ success: false, error: "profiles_fetch_failed" }), { status: 500 });
    }

    if (!pendingProfiles || pendingProfiles.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, note: "no_pending_profiles" }), { status: 200 });
    }

    let totalSent = 0;
    const now = Date.now();

    for (const profile of pendingProfiles) {
      const hoursSinceCreated = (now - new Date(profile.created_at).getTime()) / (1000 * 60 * 60);

      for (const step of steps) {
        if (hoursSinceCreated < step.delay_hours) continue;

        const { data: existingLog } = await supabaseAdmin
          .from("reminder_email_log")
          .select("id")
          .eq("profile_id", profile.id)
          .eq("step_id", step.id)
          .maybeSingle();

        if (existingLog) continue;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_ADDRESS,
            to: profile.email,
            subject: step.subject,
            html: step.body_html.replace(
              /\{\{full_name\}\}/g,
              (profile.full_name && profile.full_name.trim()) || "there",
            ),
          }),
        });

        if (!emailResponse.ok) {
          const errText = await emailResponse.text();
          console.error(`Falha ao enviar step ${step.step_order} para ${profile.email}:`, errText);
          continue;
        }

        await supabaseAdmin.from("reminder_email_log").insert({
          profile_id: profile.id,
          step_id: step.id,
        });

        totalSent++;
      }
    }

    return new Response(JSON.stringify({ success: true, sent: totalSent }), { status: 200 });
  } catch (err) {
    console.error("Erro inesperado em send-reminder-emails:", err);
    return new Response(JSON.stringify({ success: false, error: "unexpected_error" }), { status: 500 });
  }
});