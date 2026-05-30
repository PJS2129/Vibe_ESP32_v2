export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is missing or not configured. Please set OPENAI_API_KEY in .env.local or your deployment environment variables.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert MicroPython developer for ESP32.
Generate only executable, syntactically correct MicroPython code based on the user's natural language request.
IMPORTANT RULES:
1. Do NOT wrap the code in markdown blocks (do NOT use \`\`\`python ... \`\`\`). Output ONLY raw python code text.
2. Provide clean comments in Korean within the code to explain what it does.
3. Make sure to use correct ESP32 pin configurations. If not specified, use typical ESP32 pins (e.g. GPIO 2 for built-in LED) and comment about it.
4. Use standard MicroPython libraries (e.g. machine, time, neopixel, network) and write professional, optimized code.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return new Response(JSON.stringify({ error: `OpenAI API returned error: ${errorData}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return the response stream directly to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
