import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendToClaude, analyzeObservations, generateReportSummary } from '@/lib/claude/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'analyze': {
        const { observationIds } = params;
        
        if (!observationIds || !Array.isArray(observationIds)) {
          return NextResponse.json(
            { error: 'Invalid observation IDs' },
            { status: 400 }
          );
        }

        // Fetch observations from database
        const { data: observations, error } = await supabase
          .from('observations')
          .select('note, labels, taken_at, created_at')
          .in('id', observationIds)
          .eq('user_id', user.id);

        if (error) {
          return NextResponse.json(
            { error: 'Failed to fetch observations' },
            { status: 500 }
          );
        }

        const analysis = await analyzeObservations(observations || []);
        return NextResponse.json(analysis);
      }

      case 'generate_summary': {
        const { observationIds, reportTitle, customPrompt } = params;
        
        if (!observationIds || !Array.isArray(observationIds) || !reportTitle) {
          return NextResponse.json(
            { error: 'Invalid parameters' },
            { status: 400 }
          );
        }

        // Fetch observations from database
        const { data: observations, error } = await supabase
          .from('observations')
          .select('note, labels, taken_at, created_at')
          .in('id', observationIds)
          .eq('user_id', user.id);

        if (error) {
          return NextResponse.json(
            { error: 'Failed to fetch observations' },
            { status: 500 }
          );
        }

        const summary = await generateReportSummary(
          observations || [],
          reportTitle,
          customPrompt
        );
        return NextResponse.json(summary);
      }

      case 'chat': {
        const { messages, systemPrompt } = params;
        
        if (!messages || !Array.isArray(messages)) {
          return NextResponse.json(
            { error: 'Invalid messages' },
            { status: 400 }
          );
        }

        const response = await sendToClaude(messages, systemPrompt);
        return NextResponse.json(response);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}