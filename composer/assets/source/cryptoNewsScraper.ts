import { chromium, Browser, Page } from 'playwright';
import winston from 'winston';

export type CryptoNewsArticle = {
    title: string;
    url: string;
    summary?: string;
    published_at?: string;
    image?: string;
    content?: string;
    author?: string;
    page_image?: string;
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

    // Get title
    const title = await page.$eval('h1.post-detail__title', el => el.textContent?.trim() ?? '');

    // Clean up the article before extracting text
    const contentText = await page.$eval('div.post-detail__content.blocks', el => {
        // Remove summary, related links, disclaimer blocks
        el.querySelectorAll('.cn-block-summary, .cn-block-related-link, .cn-block-disclaimer').forEach(e => e.remove());
        // Remove figure captions and all figure blocks (images), they typically clutter plain text for your use-case
        el.querySelectorAll('figure, figcaption').forEach(e => e.remove());
        // Optionally remove custom badge classes or very short text-only children (may overlap with actual content—use with care)
        // Example for token badges, if found:
        el.querySelectorAll('token-badge, .token-badge-container').forEach(e => e.remove());

        // Return clean, human-friendly article text
        return el.innerText.trim();
    });

    return {
        title,
        content: contentText,
    };
}

