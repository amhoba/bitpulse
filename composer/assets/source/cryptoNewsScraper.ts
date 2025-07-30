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
        const articles = await page.$$eval('.home-latest-news__list a.home-latest-news__item', (items) =>
            items.map(item => {
                const titleEl = item.querySelector('.home-latest-news-item__title');
                const url = item.getAttribute('href') ?? '';
                const timeEl = item.querySelector('time');

                return {
                    title: titleEl?.textContent?.trim() ?? '',
                    url,
                    summary: undefined, // No summary available in this section
                    published_at: timeEl?.getAttribute('datetime') ?? '',
                    image: undefined, // No image available in this section
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
