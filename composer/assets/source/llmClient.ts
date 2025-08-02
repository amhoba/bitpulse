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
const GROQ_API_KEY = process.env.GROQ_API_KEY || ''; // Ensure this is set securely
const MODEL = 'llama3-70b-8192'; // or 'llama3-70b-8192', etc.

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
    let delay = 1000; // start with 1 second

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

            if (!response.ok) {
                logger.warn(`⚠️ Groq API error (attempt ${attempt}): ${response.status} ${response.statusText}`);
                logger.warn(`Response Body: ${responseText}`);
                throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
            }

            const json = JSON.parse(responseText);
            const content = json.choices?.[0]?.message?.content || '[No content returned]';

            logger.info(`✅ LLM responded successfully on attempt ${attempt}.`);
            logger.debug(`Response Content: ${content}`);

            return content;

        } catch (error) {
            logger.error(`❌ LLM call failed on attempt ${attempt}: ${(error as Error).message}`);
            logger.info(`⏳ Retrying in ${delay / 1000} seconds...`);
            await new Promise(res => setTimeout(res, delay));
            delay = Math.min(delay * 2, 60000); // Exponential backoff capped at 60 seconds
        }
    }
}
