import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized: Missing Authorization header', { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    // Verify the user's role
    const { data: { user: currentUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !currentUser) {
      console.error("Error getting current user:", userError?.message);
      return new Response('Unauthorized: Invalid user session', { status: 401, headers: corsHeaders });
    }

    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (profileError || !profileData) {
      console.error("Error fetching current user profile:", profileError?.message);
      return new Response('Unauthorized: User profile not found', { status: 401, headers: corsHeaders });
    }

    const allowedRoles = ['admin', 'manager', 'supervisor'];
    if (!allowedRoles.includes(profileData.role)) {
      return new Response('Forbidden: Insufficient permissions', { status: 403, headers: corsHeaders });
    }

    const { email, password, first_name, last_name, role } = await req.json();

    if (!email || !password || !first_name || !last_name || !role) {
      return new Response('Bad Request: Missing required fields (email, password, first_name, last_name, role)', { status: 400, headers: corsHeaders });
    }

    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: newUser, error: createUserError } = await supabaseAdminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email
      user_metadata: {
        first_name,
        last_name,
        role, // Pass the role to the handle_new_user trigger
      },
    });

    if (createUserError) {
      console.error("Error creating user:", createUserError.message);
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'User created successfully', userId: newUser.user?.id }), {
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