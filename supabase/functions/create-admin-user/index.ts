import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key (has full admin privileges)
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create the admin user
    const { data: newUser, error: createUserError } = await supabaseAdminClient.auth.admin.createUser({
      email: 'admin@example.com',
      password: '102030102030',
      email_confirm: true, // Automatically confirm email
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
      },
    });

    if (createUserError) {
      console.error("Error creating admin user:", createUserError.message);
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update the profile with admin role
    const { error: profileError } = await supabaseAdminClient
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', newUser.user?.id);

    if (profileError) {
      console.error("Error updating profile:", profileError.message);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Admin user created successfully', userId: newUser.user?.id }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Edge Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});