import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  error?: string;
}

// Send message to Claude
export async function sendToClaude(
  messages: ClaudeMessage[],
  systemPrompt?: string
): Promise<ClaudeResponse> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    console.log('API Key present:', !!process.env.ANTHROPIC_API_KEY);
    console.log('API Key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 7));

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return { content: content.text };
    }

    throw new Error('Unexpected response format from Claude');
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Analyze observation photos and notes
export async function analyzeObservations(observations: Array<{
  note?: string | null;
  labels?: string[] | null;
  taken_at: string;
}>) {
  const systemPrompt = `You are an expert construction site analyst. Analyze the provided observations and provide insights about patterns, potential issues, and recommendations. Focus on safety, quality control, and project management insights.`;

  const observationSummary = observations.map((obs, index) => `
Observation ${index + 1}:
- Date: ${obs.taken_at}
- Note: ${obs.note || 'No note provided'}
- Labels: ${obs.labels?.join(', ') || 'No labels'}
  `).join('\n');

  const userMessage = `Please analyze these construction site observations and provide insights:

${observationSummary}

Please provide:
1. Key patterns or trends
2. Potential safety concerns
3. Quality control recommendations
4. Next steps or actions to consider`;

  return sendToClaude([{ role: 'user', content: userMessage }], systemPrompt);
}

// Generate report summary
export async function generateReportSummary(
  observations: Array<{
    note?: string | null;
    labels?: string[] | null;
    taken_at: string;
  }>,
  reportTitle: string,
  customPrompt?: string
) {
  const systemPrompt = `You are a professional construction report writer. Create concise, professional summaries for construction site reports based on observations data.`;

  const observationSummary = observations.map((obs, index) => `
Observation ${index + 1}:
- Date: ${obs.taken_at}
- Note: ${obs.note || 'No note provided'}
- Labels: ${obs.labels?.join(', ') || 'No labels'}
  `).join('\n');

  const userMessage = customPrompt || `Create a professional report summary for "${reportTitle}" based on these observations:

${observationSummary}

Please provide a concise summary that includes:
1. Overview of activities observed
2. Key findings or notable items
3. Any recommendations or follow-up actions`;

  return sendToClaude([{ role: 'user', content: userMessage }], systemPrompt);
}