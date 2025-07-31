import { chromium, Browser, Page } from 'playwright';
import winston from 'winston';

export type CryptoNewsArticle = {
    title: string,
    url: string,
    summary?: string,
    published_at?: string,
    image?: string,
    content?: string,      // New: The full body/content of the article
    author?: string,       // New: Author name
    page_image?: string,   // New: Main image in the article (if any)
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

        const articles = await page.$$eval('.home-latest-news__list a.home-latest-news__item', (items) =>
            items.map(item => {
                const titleEl = item.querySelector('.home-latest-news-item__title');
                const url = item.getAttribute('href') ?? '';
                const timeEl = item.querySelector('time');
                return {
                    title: titleEl?.textContent?.trim() ?? '',
                    url,
                    summary: undefined,
                    published_at: timeEl?.getAttribute('datetime') ?? '',
                    image: undefined,
                };
            }).filter(article => article.title && article.url)
        );

        logger.info(`Extracted ${articles.length} articles.`);

        // Now for each article, visit its page and extract more details
        for (const article of articles) {
            try {
                const fullUrl = article.url.startsWith('http') ? article.url : `https://crypto.news${article.url}`;
                logger.info(`Scraping content for: ${article.title}`);
                const articlePage = await context.newPage();
                const detail = await scrapeArticleContent(articlePage, fullUrl);
                Object.assign(article, detail);
                await articlePage.close();
            } catch (err) {
                logger.warn(`Failed to scrape detail for ${article.url}: ${err}`);
            }
        }

        await browser.close();
        return articles;
    } catch (error) {
        logger.error(`Scraping failed: ${(error as Error).message}`);
        await browser.close();
        throw error;
    }
}

export async function scrapeArticleContent(page: Page, url: string): Promise<Partial<CryptoNewsArticle>> {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // The following selectors are placeholders. After you provide a sample HTML/content,
    // I will adapt these!
    const content = await page.$eval('article', el => el.textContent?.trim() ?? '');
    const author = await page.$eval('.author__name', el => el.textContent?.trim() ?? '');
    const page_image = await page.$eval('article img', img => (img as HTMLImageElement).src);

    return {
        content,
        author,
        page_image,
    };
}