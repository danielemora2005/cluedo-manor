import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Assicurati che il percorso sia corretto

export async function POST(request: Request) {
  const body = await request.json();
  const { gameId, hostId, players } = body;

  const { data, error } = await supabase
    .from('games') // Il nome della tua tabella su Supabase
    .insert([{ id: gameId, host_id: hostId, players: players, status: 'lobby' }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
