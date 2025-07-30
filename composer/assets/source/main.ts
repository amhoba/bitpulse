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
      if (article.summary) logger.info(`Summary: ${article.summary}`);
      if (article.published_at) logger.info(`Published At: ${article.published_at}`);
      if (article.image) logger.info(`Image URL: ${article.image}`);
      logger.info('---------------------------------------------');
    });

  } catch (error) {
    logger.error(`Error in main execution: ${(error as Error).message}`);
  }
}

main();
