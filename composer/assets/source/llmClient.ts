import fetch from 'node-fetch';
import winston from 'winston';

// Setup logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(
            ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`
        )
    ),
    transports: [new winston.transports.Console()],
});

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const MODEL = 'llama-3.3-70b-versatile';

export async function callLLM(prompt: string): Promise<string> {
    if (!GROQ_API_KEY) {
        logger.error('GROQ_API_KEY environment variable is not set.');
        throw new Error('GROQ_API_KEY environment variable is not set.');
    }

    const requestPayload = {
        model: MODEL,
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
        ],
        temperature: 0.7
    };

    let attempt = 0;

    while (true) {
        attempt++;
        logger.info(`🔍 Attempt ${attempt}: Sending prompt to LLM`);
        logger.debug(`Prompt: ${prompt.length > 500 ? prompt.slice(0, 500) + '...' : prompt}`);

        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestPayload)
            });

            const responseText = await response.text();

            if (response.status === 429) {
                // Rate limit hit — check Retry-After header
                const retryAfter = response.headers.get('retry-after');
                const waitSeconds = retryAfter ? parseFloat(retryAfter) : 10; // fallback wait
                logger.warn(`⚠️ Rate limit exceeded (429). Waiting ${waitSeconds}s before retry...`);
                await new Promise(res => setTimeout(res, waitSeconds * 1000));
                continue;
            }

            if (!response.ok) {
                logger.warn(`⚠️ LLM API error: ${response.status} ${response.statusText}`);
                logger.warn(`Response Body: ${responseText}`);
                // Retry on server-side errors
                if (response.status >= 500 && response.status < 600) {
                    logger.info('⏳ Retrying after 3 seconds due to server error...');
                    await new Promise(res => setTimeout(res, 3000));
                    continue;
                }
                throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
            }

            // Log rate limit status headers if present
            const limitHeaders = [
                'x-ratelimit-remaining-requests',
                'x-ratelimit-remaining-tokens',
                'x-ratelimit-reset-requests',
                'x-ratelimit-reset-tokens'
            ];
            for (const h of limitHeaders) {
                const value = response.headers.get(h);
                if (value) logger.info(`📊 ${h}: ${value}`);
            }

            const json = JSON.parse(responseText);
            const content = json.choices?.[0]?.message?.content || '[No content returned]';

            logger.info(`✅ LLM responded successfully on attempt ${attempt}`);
            logger.debug(`Response Content: ${content}`);
            return content;

        } catch (err) {
            logger.error(`❌ LLM call failed (attempt ${attempt}): ${(err as Error).message}`);
            logger.info(`⏳ Waiting 5 seconds before retrying...`);
            await new Promise(res => setTimeout(res, 5000));
        }
    }
}
