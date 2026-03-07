import { createClient } from '@supabase/supabase-js';

let supabase: any = null;

function getSupabase() {
  if (supabase) return supabase;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
}

export async function fetchFallbackFromSupabase(limit = 1000) {
  const client = getSupabase();
  if (!client) {
    console.log('Supabase not configured');
    return null;
  }

  const { data, error } = await client
    .from('round_history')
    .select('*')
    .order('end_timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Supabase fetch error:', error);
    return null;
  }

  return data?.map((r: any) => ({
    id: String(r.round_id),
    roundId: String(r.round_id),
    block: r.block?.toString() || '0',
    winnerTakeAll: r.winner_take_all ?? true,
    oreWinner: r.ore_winner || '0',
    motherlode: r.motherlode?.toString() || '0',
    motherlodeHit: r.motherlode_hit ?? false,
    endTimestamp: r.end_timestamp || 0,
  })) || [];
}
