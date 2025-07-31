import winston from 'winston';
import { scrapeCryptoNews } from './cryptoNewsScraper';
import {
    loadArticlePromptTemplates,
    loadTitlePromptTemplates,
    getArticlePromptById,
    getTitlePromptById,
    fillPromptTemplate,
    PromptTemplate
} from './promptTemplates';
import { callLLM } from './llmClient';
import fs from 'fs';
import path from 'path';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    ),
    transports: [new winston.transports.Console()],
});

// Converts an article URL into a kebab-case filename (lowercase a-z only)
function slugifyUrl(url: string): string {
    const slug = url
        .toLowerCase()
        .replace(/https?:\/\//, '')
        .replace(/[^a-z]/g, '-') // keep only a-z and replace others with hyphens
        .replace(/-+/g, '-')     // collapse repeated hyphens
        .replace(/^-|-$/g, '');  // trim leading/trailing hyphens
    return slug;
}

// Writes a Markdown file to the shared Astro directory
function writeMarkdownFile(filePath: string, title: string, body: string): void {
    const content = `---
title: "${title}"
---

${body.trim()}
`;
    fs.writeFileSync(filePath, content, 'utf-8');
}

// Ask the LLM to pick the best prompt ID from a category
async function choosePromptId(
    category: 'article' | 'title',
    templates: PromptTemplate[],
    article: { title: string; content?: string; images?: string[] }
): Promise<string | undefined> {
    const templateList = templates.map(t => `- ${t.id}: ${t.description}`).join('\n');
    const imagesText = (article.images || []).join('\n');

    const chooserPrompt = `
You are a system that selects the best prompt template ID for the task.

Available ${category} prompts:
${templateList}

Article Title: ${article.title}
Content:
${article.content || '[No content]'}
Images:
${imagesText}

Respond with the most suitable prompt ID only (e.g. "summarize").
    `.trim();

    const result = await callLLM(chooserPrompt);
    const match = result.match(/^[a-zA-Z0-9_-]+/); // Get first word/ID
    return match ? match[0] : undefined;
}

async function main() {
    try {
        logger.info('Starting crypto.news scraping service...');
        const articles = await scrapeCryptoNews();
        logger.info(`Scraping completed. Articles found: ${articles.length}`);

        const articlePrompts = loadArticlePromptTemplates();
        const titlePrompts = loadTitlePromptTemplates();

        for (const article of articles) {
            if (!article.content) {
                logger.warn(`No content for article: ${article.title}`);
                continue;
            }

            const slug = slugifyUrl(article.url);
            const outputPath = path.join('/shared/article', `${slug}.md`);

            if (fs.existsSync(outputPath)) {
                logger.info(`Skipping "${article.title}" — markdown file already exists.`);
                continue;
            }

            const imageUrls = (article.images || []).map(img => img.url);

            // 1. Choose article prompt
            const selectedArticlePromptId = await choosePromptId('article', articlePrompts, {
                title: article.title,
                content: article.content,
                images: imageUrls
            });

            const articlePrompt = selectedArticlePromptId
                ? getArticlePromptById(selectedArticlePromptId)
                : undefined;

            if (!articlePrompt) {
                logger.warn(`No valid article prompt selected for "${article.title}"`);
                continue;
            }

            const filledArticlePrompt = fillPromptTemplate(articlePrompt, {
                content: article.content,
                images: imageUrls.join('\n')
            });

            const articleLLMOutput = await callLLM(filledArticlePrompt);
            logger.info(`Generated article content using prompt '${selectedArticlePromptId}':\n${articleLLMOutput}`);

            // 2. Choose title prompt
            const selectedTitlePromptId = await choosePromptId('title', titlePrompts, {
                title: article.title,
                content: article.content,
                images: imageUrls
            });

            const titlePrompt = selectedTitlePromptId
                ? getTitlePromptById(selectedTitlePromptId)
                : undefined;

            if (!titlePrompt) {
                logger.warn(`No valid title prompt selected for "${article.title}"`);
                continue;
            }

            const filledTitlePrompt = fillPromptTemplate(titlePrompt, {
                content: article.content,
                images: imageUrls.join('\n')
            });

            const titleLLMOutput = await callLLM(filledTitlePrompt);
            logger.info(`Generated SEO title using prompt '${selectedTitlePromptId}': ${titleLLMOutput}`);

            writeMarkdownFile(outputPath, titleLLMOutput, articleLLMOutput);

            logger.info(`✅ Wrote markdown: ${outputPath}`);
            logger.info('--------------------------------------------------\n');
        }

    } catch (error) {
        logger.error(`Error in main execution: ${(error as Error).message}`);
    }
}

async function runCycle() {
    logger.info(`🔄 Starting new content generation cycle at ${new Date().toISOString()}`);
    await main();
    logger.info(`✅ Finished cycle at ${new Date().toISOString()}`);
}

async function scheduleForever(intervalMinutes: number) {
    const intervalMs = intervalMinutes * 60 * 1000;
    while (true) {
        await runCycle();
        logger.info(`⏳ Waiting ${intervalMinutes} minutes before next cycle...`);
        await new Promise(res => setTimeout(res, intervalMs));
    }
}

// Start the recurring loop
scheduleForever(10);
