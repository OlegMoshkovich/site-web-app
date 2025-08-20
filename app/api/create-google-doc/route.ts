import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📤 Sending to Zapier:', JSON.stringify(body, null, 2));
    
    const zapierWebhookUrl = process.env.NEXT_PUBLIC_ZAPIER_WEBHOOK_URL;
    
    if (!zapierWebhookUrl || zapierWebhookUrl.includes('YOUR_WEBHOOK_ID')) {
      return NextResponse.json(
        { error: 'Zapier webhook URL not configured' },
        { status: 500 }
      );
    }

    console.log('🔗 Zapier URL:', zapierWebhookUrl);

    // Forward the request to Zapier
    const response = await fetch(zapierWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('📥 Zapier response status:', response.status);
    console.log('📥 Zapier response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Zapier error response:', errorText);
      throw new Error(`Zapier webhook failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Zapier result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Google Doc creation initiated',
      data: result
    });

  } catch (error) {
    console.error('Error in create-google-doc API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create Google Doc',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}