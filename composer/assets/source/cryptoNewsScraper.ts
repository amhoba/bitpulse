import { chromium, Browser, Page } from 'playwright';
import winston from 'winston';

export type CryptoNewsArticle = {
  title: string,
  url: string,
  summary?: string,
  published_at?: string,
  image?: string,
};

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

export async function scrapeCryptoNews(): Promise<CryptoNewsArticle[]> {
  const url = 'https://crypto.news/';

  logger.info(`Launching browser to scrape ${url}`);
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page: Page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    logger.info('Page loaded, extracting articles...');

    // Adjust selectors if crypto.news changes structure
    const articles = await page.$$eval('.post-card', (cards) =>
      cards.map(card => {
        const titleEl = card.querySelector('.post-card__title');
        const linkEl = card.querySelector('.post-card__title a');
        const summaryEl = card.querySelector('.post-card__excerpt');
        const timeEl = card.querySelector('time');
        const imageEl = card.querySelector('img');

        return {
          title: titleEl?.textContent?.trim() ?? '',
          url: linkEl?.href ?? '',
          summary: summaryEl?.textContent?.trim() ?? '',
          published_at: timeEl?.getAttribute('datetime') ?? '',
          image: imageEl?.getAttribute('src') ?? '',
        };
      }).filter(article => article.title && article.url)
    );

    logger.info(`Extracted ${articles.length} articles.`);
    await browser.close();

    return articles;
  } catch (error) {
    logger.error(`Scraping failed: ${(error as Error).message}`);
    await browser.close();
    throw error;
  }
}
