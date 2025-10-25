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
    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Response(JSON.stringify({ error: 'userIds must be a non-empty array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Authenticate the caller (must be an admin/manager/supervisor)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized: Missing Authorization header', { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user: currentUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !currentUser) {
      return new Response('Unauthorized: Invalid user session', { status: 401, headers: corsHeaders });
    }

    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    const allowedRoles = ['admin', 'manager', 'supervisor'];
    if (profileError || !profileData || !allowedRoles.includes(profileData.role)) {
      return new Response('Forbidden: Insufficient permissions', { status: 403, headers: corsHeaders });
    }

    // 2. Use Service Role Key to fetch user emails
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: usersData, error: listError } = await supabaseAdminClient.auth.admin.listUsers();

    if (listError) {
      console.error("Error listing users:", listError.message);
      throw new Error('Failed to retrieve user list.');
    }

    const emailMap = new Map();
    usersData.users.forEach(user => {
      if (userIds.includes(user.id)) {
        emailMap.set(user.id, user.email);
      }
    });

    const result = userIds.map((id: string) => ({
      id,
      email: emailMap.get(id) || null,
    }));

    return new Response(JSON.stringify(result), {
      status: 200,
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