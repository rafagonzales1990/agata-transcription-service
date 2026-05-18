import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Newsletter {
  id: string;
  title: string;
  subject: string;
  html: string;
  status: string;
  audience: string;
  scheduled_at: string | null;
}

interface Lead {
  id: string;
  email: string;
  name: string | null;
  active: boolean;
}

interface Recipient {
  email: string;
  name: string;
  lead_id: string | null;
}

function renderTemplate(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { newsletter_id } = await req.json();

    if (!newsletter_id) {
      return new Response(
        JSON.stringify({ error: "newsletter_id obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Buscar newsletter
    const { data: newsletter, error: nlError } = await supabaseAdmin
      .from("newsletters")
      .select("*")
      .eq("id", newsletter_id)
      .maybeSingle();

    if (nlError || !newsletter) {
      return new Response(
        JSON.stringify({ error: "Newsletter não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newsletter.status === "sending" || newsletter.status === "sent") {
      return new Response(
        JSON.stringify({ error: `Newsletter já está com status: ${newsletter.status}` }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Marcar como 'sending'
    await supabaseAdmin
      .from("newsletters")
      .update({ status: "sending" })
      .eq("id", newsletter_id);

    const recipients: Recipient[] = [];
    const emailsSeen = new Set<string>();

    // 3. Buscar leads ativos (audience = 'leads' | 'all')
    if (newsletter.audience === "leads" || newsletter.audience === "all") {
      const { data: leads } = await supabaseAdmin
        .from("leads")
        .select("id, email, name, active")
        .eq("active", true);

      for (const lead of (leads ?? []) as Lead[]) {
        if (!emailsSeen.has(lead.email.toLowerCase())) {
          emailsSeen.add(lead.email.toLowerCase());
          recipients.push({
            email: lead.email,
            name: lead.name ?? "",
            lead_id: lead.id,
          });
        }
      }
    }

    // 4. Buscar usuários do app (audience = 'users' | 'all')
    if (newsletter.audience === "users" || newsletter.audience === "all") {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      for (const user of authUsers?.users ?? []) {
        if (!user.email) continue;
        if (!emailsSeen.has(user.email.toLowerCase())) {
          emailsSeen.add(user.email.toLowerCase());
          const name =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email.split("@")[0];
          recipients.push({
            email: user.email,
            name,
            lead_id: null,
          });
        }
      }
    }

    // 5. Filtrar quem já recebeu esta newsletter
    const { data: alreadySent } = await supabaseAdmin
      .from("newsletter_sends")
      .select("lead_id")
      .eq("newsletter_id", newsletter_id);

    const alreadySentIds = new Set(
      (alreadySent ?? []).map((s: { lead_id: string | null }) => s.lead_id).filter(Boolean)
    );

    const toSend = recipients.filter(
      (r) => !r.lead_id || !alreadySentIds.has(r.lead_id)
    );

    if (toSend.length === 0) {
      await supabaseAdmin
        .from("newsletters")
        .update({ status: "sent", sent_at: new Date().toISOString(), recipient_count: 0 })
        .eq("id", newsletter_id);

      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "Nenhum destinatário novo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Enviar via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
    const FROM_EMAIL = "Ágata Transcription <noreply@agatatranscription.com>";

    let sentCount = 0;
    const sendsToRecord: { newsletter_id: string; lead_id: string; sent_at: string }[] = [];

    for (const recipient of toSend) {
      const personalizedHtml = renderTemplate(newsletter.html ?? "", {
        userName: recipient.name,
        userEmail: recipient.email,
      });

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [recipient.email],
          subject: newsletter.subject,
          html: personalizedHtml,
        }),
      });

      if (resendRes.ok) {
        sentCount++;
        if (recipient.lead_id) {
          sendsToRecord.push({
            newsletter_id,
            lead_id: recipient.lead_id,
            sent_at: new Date().toISOString(),
          });
        }
      } else {
        const errBody = await resendRes.text();
        console.error(`Falha ao enviar para ${recipient.email}:`, errBody);
      }
    }

    // 7. Registrar envios em newsletter_sends
    if (sendsToRecord.length > 0) {
      await supabaseAdmin
        .from("newsletter_sends")
        .upsert(sendsToRecord, { onConflict: "newsletter_id,lead_id" });
    }

    // 8. Atualizar status final
    await supabaseAdmin
      .from("newsletters")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        recipient_count: sentCount,
      })
      .eq("id", newsletter_id);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, total: toSend.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-newsletter error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
