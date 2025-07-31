import { scrapeCryptoNews } from './cryptoNewsScraper';
import winston from 'winston';
import { loadPromptTemplates, getPromptTemplateById, fillPromptTemplate } from './promptTemplates';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    ),
    transports: [new winston.transports.Console()],
});

async function main() {
    try {
        logger.info('Starting crypto.news scraping service...');
        const articles = await scrapeCryptoNews();
        logger.info('Scraping completed. Articles found: ' + articles.length);

        articles.forEach(article => {
            logger.info(`Title: ${article.title}`);
            logger.info(`URL: ${article.url}`);
            if (article.published_at) logger.info(`Published At: ${article.published_at}`);
            if (article.content) {
                logger.info(`Article Content:\n${article.content}`);
            } else {
                logger.warn('No content scraped for this article.');
            }
            logger.info('---------------------------------------------');
        });

        const templates = loadPromptTemplates();
        logger.info('Prompt templates available:');
        templates.forEach(t =>
            logger.info(`ID: ${t.id} | Name: ${t.name} | Description: ${t.description}`)
        );

        // Example: select template by ID (in future, you can make this more intelligent)
        const selectedTemplateId = 'summarize'; // <-- CHANGE as desired
        const promptTmpl = getPromptTemplateById(selectedTemplateId);
        if (!promptTmpl) {
            logger.error(`Prompt template with ID '${selectedTemplateId}' not found.`);
            process.exit(1);
        }

        for (const article of articles) {
            if (article.content) {
                const prompt = fillPromptTemplate(promptTmpl, { content: article.content });
                logger.info(`Generated Prompt for Article "${article.title}":\n${prompt}\n-----`);
            }
        }

    } catch (error) {
        logger.error(`Error in main execution: ${(error as Error).message}`);
    }
}

main();
