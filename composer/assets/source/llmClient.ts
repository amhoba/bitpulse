import fetch from 'node-fetch';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY || ''; // Ensure this is set securely

const MODEL = 'mixtral-8x7b-32768'; // or 'llama3-70b-8192', etc.

export async function callLLM(prompt: string): Promise<string> {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY environment variable is not set.');
    }

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error: ${response.status} ${response.statusText} — ${errText}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    return content || '[No content returned]';
}
