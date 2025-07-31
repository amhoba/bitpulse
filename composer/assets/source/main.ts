import { scrapeCryptoNews } from './cryptoNewsScraper';
import winston from 'winston';

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

    } catch (error) {
        logger.error(`Error in main execution: ${(error as Error).message}`);
    }
}

main();
