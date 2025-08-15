import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: observations, error } = await supabase
      .from('observations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching observations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch observations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ observations });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('observations')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating observation:', error);
      return NextResponse.json(
        { error: 'Failed to create observation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ observation: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
