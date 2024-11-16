const cheerio = require('cheerio');
const { getBrowser, getRandomElement, shuffleArray, delay, scrollToEnd } = require('./utils');
const db = require('./config.js');

// ============================================ insertUrl
async function insertUrl(url) {
    const existsQuery = `
        SELECT * FROM unvisited u 
        where "url"=$1
    `;

    const insertQuery = `
        INSERT INTO unvisited ("url")
        VALUES ($1)
        RETURNING *;
    `;
    const urlInDb = await db.oneOrNone(existsQuery, [url]);
    if (!urlInDb) {
        try {
            const result = await db.query(insertQuery, [url]);
            return result;
        } catch (error) {
            console.log(`Error in insert url function : ${url}\nError:`, error.message);
        }
    }
}

// ============================================ findAllMainLinks
async function findAllMainLinks(page, initialUrl) {
    const allMainLinks = [];
    try {
        const url = initialUrl;
        await page.goto(url, { timeout: 360000 });

        // sleep 5 second
        console.log('-------sleep 5 second');
        await delay(5000);

        // load cheerio
        const html = await page.content();
        const $ = cheerio.load(html);

        // Getting All Main Urls In This Page
        const mainLinks = $('notFound')
            .map((i, a) => $(a).attr('href')?.trim())
            .get();

        // Push This Page Products Urls To allProductsLinks
        allMainLinks.push(initialUrl);
    } catch (error) {
        console.log('Error In findAllMainLinks function', error.message);
    }

    return Array.from(new Set(allMainLinks));
}

// ============================================ findAllPagesLinks
async function findAllPagesLinks(page, mainLinks) {
    let allPagesLinks = [];

    // find pagination and pages
    for (let i = 0; i < mainLinks.length; i++) {
        try {
            const url = mainLinks[i];
            console.log('============================================================');
            console.log('start findind pages for main link :', url);
            await page.goto(url);

            await delay(5000);
            const html = await page.content();
            const $ = cheerio.load(html);

            // find last page number and preduce other pages urls
            const paginationElement = $('notFound');
            console.log('Pagination Element : ', paginationElement.length);
            if (paginationElement.length) {
                let lsatPageNumber = $('notFound')?.last().text()?.trim();
                console.log('Last Page Number : ', lsatPageNumber);
                lsatPageNumber = Number(lsatPageNumber);
                for (let j = 1; j <= lsatPageNumber; j++) {
                    const newUrl = url + `?page=${j}`;
                    allPagesLinks.push(newUrl);
                }
            } else {
                allPagesLinks.push(url);
            }
        } catch (error) {
            console.log('Error in findAllPagesLinks', error);
        }
    }

    allPagesLinks = shuffleArray(allPagesLinks);
    return Array.from(new Set(allPagesLinks));
}

// ============================================ findAllProductsLinks
async function findAllProductsLinks(page, allPagesLinks) {
    for (let i = 0; i < allPagesLinks.length; i++) {
        try {
            const url = allPagesLinks[i];
            console.log('============================================================');
            console.log('Start Finding products urls from page :', url);
            await page.goto(url, { timeout: 180000 });

            // sleep 5 second when switching between pages
            console.log('-------sleep 5 second');
            await delay(5000);

            let nextPageBtn;
            let c = 0;
            do {
                c++;
                console.log(c);
                await scrollToEnd(page);
                await delay(2000);

                const html = await page.content();
                const $ = cheerio.load(html);

                // Getting All Products Urls In This Page
                const productsUrls = [
                    'https://roocket.ir/series/learn-css',
                    'https://roocket.ir/series/laravel-eloquent',
                    'https://roocket.ir/series/web-design-projects',
                    'https://roocket.ir/series/learn-nextjs',
                    'https://roocket.ir/series/woocommerce-complete-tutorial',
                    'https://roocket.ir/series/telegram-bot-with-laravel',
                    'https://roocket.ir/series/learn-react-advanced',
                    'https://roocket.ir/series/whats-new-in-laravel-11',
                    'https://roocket.ir/series/laravel-restful-api-practical',
                    'https://roocket.ir/series/tailwindcss-projects',
                    'https://roocket.ir/series/wordpress-multilingual',
                    'https://roocket.ir/series/learn-wordpress-elementor',
                    'https://roocket.ir/series/learn-react-js',
                    'https://roocket.ir/series/advanced-wordpress-tutorial',
                    'https://roocket.ir/series/zero-programming-step',
                    'https://roocket.ir/series/mastering-in-laravel-queues',
                    'https://roocket.ir/series/coding-with-vscode',
                    'https://roocket.ir/series/learn-basic-of-wordpress',
                    'https://roocket.ir/series/build-ecommerce-site-with-react',
                    'https://roocket.ir/series/finding-an-idea-to-start-a-business',
                    'https://roocket.ir/series/server-managment-with-pachim',
                    'https://roocket.ir/series/learn-mvc-in-php-and-build-a-modern-framework',
                    'https://roocket.ir/series/whats-new-in-laravel-10',
                    'https://roocket.ir/series/react-useful-libraries',
                    'https://roocket.ir/series/typescript-in-react',
                    'https://roocket.ir/series/flutter-from-zero',
                    'https://roocket.ir/series/best-practice-in-react',
                    'https://roocket.ir/series/learn-redux',
                    'https://roocket.ir/series/learn-tailwindcss',
                    'https://roocket.ir/series/learn-dart',
                    'https://roocket.ir/series/advanced-python',
                    'https://roocket.ir/series/whats-new-in-laravel-9',
                    'https://roocket.ir/series/learn-hilt',
                    'https://roocket.ir/series/learn-vuejs',
                    'https://roocket.ir/series/laravel-auth',
                    'https://roocket.ir/series/learn-oop',
                    'https://roocket.ir/series/learn-composer',
                    'https://roocket.ir/series/learn-mysql',
                    'https://roocket.ir/series/learn-php-8',
                    'https://roocket.ir/series/learning-sass',
                    'https://roocket.ir/series/learning-php',
                    'https://roocket.ir/series/learn-livewire',
                    'https://roocket.ir/series/whats-new-in-laravel-8',
                    'https://roocket.ir/series/learn-angular',
                    'https://roocket.ir/series/learn-node',
                    'https://roocket.ir/series/whats-new-in-laravel-7',
                    'https://roocket.ir/series/laravel-projects',
                    'https://roocket.ir/series/learn-laravel',
                    'https://roocket.ir/series/php-security',
                    'https://roocket.ir/series/javascript-projects',
                    'https://roocket.ir/series/learning-typescript',
                    'https://roocket.ir/series/learn-html',
                    'https://roocket.ir/series/learn-webpack',
                    'https://roocket.ir/series/javascript-es6-tutorial',
                    'https://roocket.ir/series/javascript-tutorial',
                    'https://roocket.ir/series/django-scratch',
                    'https://roocket.ir/series/learn-laravel-and-graphql',
                    'https://roocket.ir/series/learn-graphql',
                    'https://roocket.ir/series/learn-python',
                    'https://roocket.ir/series/learn-mongodb',
                    'https://roocket.ir/series/unit-test-javascript',
                    'https://roocket.ir/series/learn-to-create-progressive-web-apps',
                    'https://roocket.ir/series/learn-design-pattern',
                    'https://roocket.ir/series/build-an-educational-website-and-shop-with-nodejs',
                    'https://roocket.ir/series/redis-course',
                    'https://roocket.ir/series/learning-javascript-es7-es8',
                    'https://roocket.ir/series/solid-object-oriented-design',
                    'https://roocket.ir/series/management-and-development-of-open-source-projects',
                    'https://roocket.ir/series/leran-regular-expressions',
                    'https://roocket.ir/series/learn-bootstrap-4',
                    'https://roocket.ir/series/build-a-api-with-nodejs',
                    'https://roocket.ir/series/learn-git-and-github',
                    'https://roocket.ir/series/programming-training-package-laravel',
                    'https://roocket.ir/series/work-with-phpstrom',
                ];
                //  $(
                //     'body > div.z-0.overflow-hidden > div:nth-child(2) > section.mt-14.mb-20 > div > div.grid.grid-cols-12 > div.col-span-12.order-1 > div.mt-12.grid.grid-cols-12 > div > div > div:first-child > a'
                // )
                //     .map((i, e) => 'https://roocket.ir' + $(e).attr('href'))
                //     .get();

                // insert prooduct links to unvisited
                for (let j = 0; j < productsUrls.length; j++) {
                    try {
                        const url = productsUrls[j];
                        await insertUrl(url);
                        await delay(250);
                    } catch (error) {
                        console.log('Error in findAllProductsLinks for loop:', error.message);
                    }
                }

                nextPageBtn = await page.$$('notFound');
                if (nextPageBtn.length) {
                    let btn = nextPageBtn[0];
                    await btn.click();
                }
                await delay(5000);
            } while (nextPageBtn.length);
        } catch (error) {
            console.log('Error In findAllProductsLinks function', error);
        }
    }
}

// ============================================ Main
async function main() {
    try {
        const INITIAL_PAGE_URL = ['https://roocket.ir/series'];

        // get random proxy
        const proxyList = [''];
        const randomProxy = getRandomElement(proxyList);

        // Lunch Browser
        const browser = await getBrowser(randomProxy, false, false);
        const page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080,
        });

        for (const u of INITIAL_PAGE_URL) {
            const mainLinks = await findAllMainLinks(page, u);
            // const AllPagesLinks = await findAllPagesLinks(page, mainLinks);
            await findAllProductsLinks(page, mainLinks);
        }

        // Close page and browser
        console.log('End');
        await page.close();
        await browser.close();
    } catch (error) {
        console.log('Error In main Function', error);
    }
}

main();
