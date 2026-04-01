import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Admin client for creating auth users
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch all legacy users
    const { data: legacyUsers, error: fetchError } = await supabaseAdmin
      .from("User")
      .select("id, email, name, phone, cpf, planId, billingCycle, image, hasCompletedOnboarding, trialEndsAt");

    if (fetchError) {
      throw new Error(`Failed to fetch legacy users: ${fetchError.message}`);
    }

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const legacyUser of legacyUsers || []) {
      try {
        // Check if user already exists in Supabase Auth
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        });

        // Try to find by email across all users
        const { data: userByEmail } = await supabaseAdmin
          .from("profiles")
          .select("old_user_id")
          .eq("old_user_id", legacyUser.id)
          .maybeSingle();

        if (userByEmail) {
          results.skipped++;
          continue;
        }

        // Generate a random password (user will reset it)
        const randomPassword = crypto.randomUUID() + "Aa1!";

        // Create user in Supabase Auth
        const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: legacyUser.email,
          password: randomPassword,
          email_confirm: true,
          user_metadata: {
            name: legacyUser.name,
            legacy_user_id: legacyUser.id,
          },
        });

        if (createError) {
          if (createError.message?.includes("already been registered")) {
            // User exists in Auth but not mapped - find and map them
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
            const existingAuthUser = users?.find((u) => u.email === legacyUser.email);
            if (existingAuthUser) {
              await supabaseAdmin
                .from("profiles")
                .update({
                  old_user_id: legacyUser.id,
                  name: legacyUser.name,
                  phone: legacyUser.phone,
                  cpf: legacyUser.cpf,
                  plan_id: legacyUser.planId,
                  billing_cycle: legacyUser.billingCycle,
                  image: legacyUser.image,
                  has_completed_onboarding: legacyUser.hasCompletedOnboarding,
                })
                .eq("user_id", existingAuthUser.id);
              results.created++;
            } else {
              results.skipped++;
            }
            continue;
          }
          results.errors.push(`${legacyUser.email}: ${createError.message}`);
          continue;
        }

        // Update the auto-created profile with legacy data
        if (newAuthUser?.user) {
          await supabaseAdmin
            .from("profiles")
            .update({
              old_user_id: legacyUser.id,
              name: legacyUser.name,
              phone: legacyUser.phone,
              cpf: legacyUser.cpf,
              plan_id: legacyUser.planId,
              billing_cycle: legacyUser.billingCycle,
              image: legacyUser.image,
              has_completed_onboarding: legacyUser.hasCompletedOnboarding,
              trial_ends_at: legacyUser.trialEndsAt,
            })
            .eq("user_id", newAuthUser.user.id);
        }

        results.created++;
      } catch (err) {
        results.errors.push(`${legacyUser.email}: ${err.message}`);
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
