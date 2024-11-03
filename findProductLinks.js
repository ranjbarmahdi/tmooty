const cheerio = require('cheerio');
const { getBrowser, getRandomElement, shuffleArray, delay } = require('./utils');
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
                const html = await page.content();
                const $ = cheerio.load(html);

                // Getting All Products Urls In This Page
                const productsUrls = [
                    'https://sabzlearn.ir/course/php/',
                    'https://sabzlearn.ir/course/electronjs/',
                    'https://sabzlearn.ir/course/redis/',
                    'https://sabzlearn.ir/course/nestjs/',
                    'https://sabzlearn.ir/course/telegram-bot-nodejs/',
                    'https://sabzlearn.ir/course/fastify/',
                    'https://sabzlearn.ir/course/zero-api/',
                    'https://sabzlearn.ir/course/php-api-dev/',
                    'https://sabzlearn.ir/course/laravel-reverb/',
                    'https://sabzlearn.ir/course/webpack/',
                    'https://sabzlearn.ir/course/docker/',
                    'https://sabzlearn.ir/course/bad-usb/',
                    'https://sabzlearn.ir/course/0k-hacker/',
                    'https://sabzlearn.ir/course/websocket/',
                    'https://sabzlearn.ir/course/graphql/',
                    'https://sabzlearn.ir/course/javascript-library-development/',
                    'https://sabzlearn.ir/course/browser-extension-with-js/',
                    'https://sabzlearn.ir/course/master-freelance/',
                    'https://sabzlearn.ir/course/livewire/',
                    'https://sabzlearn.ir/course/dashboard-with-css-js/',
                    'https://sabzlearn.ir/course/telegram-bot-php/',
                    'https://sabzlearn.ir/course/algorithm/',
                    'https://sabzlearn.ir/course/applied-projects-with-php/',
                    'https://sabzlearn.ir/course/deploy-for-js/',
                    'https://sabzlearn.ir/course/clean-code-for-js/',
                    'https://sabzlearn.ir/course/ex-project-with-css/',
                    'https://sabzlearn.ir/course/gpt-for-code/',
                    'https://sabzlearn.ir/course/tailwind-css/',
                    'https://sabzlearn.ir/course/20-lib-reactjs/',
                    'https://sabzlearn.ir/course/redux/',
                    'https://sabzlearn.ir/course/next-js/',
                    'https://sabzlearn.ir/course/pwa/',
                    'https://sabzlearn.ir/course/git-github/',
                    'https://sabzlearn.ir/course/typescript/',
                    'https://sabzlearn.ir/course/node-ex/',
                    'https://sabzlearn.ir/course/business-for-programmers/',
                    'https://sabzlearn.ir/course/django-ex/',
                    'https://sabzlearn.ir/course/data-visualization-with-python/',
                    'https://sabzlearn.ir/course/freelance-project-price/',
                    'https://sabzlearn.ir/course/team-experience/',
                    'https://sabzlearn.ir/course/js-exp-project/',
                    'https://sabzlearn.ir/course/api-dev-with-nodejs/',
                    'https://sabzlearn.ir/course/python-code-optimization/',
                    'https://sabzlearn.ir/course/applied-projects-with-python/',
                    'https://sabzlearn.ir/course/canvas/',
                    'https://sabzlearn.ir/course/javascript-interview-questions/',
                    'https://sabzlearn.ir/course/python/',
                    'https://sabzlearn.ir/course/pwk/',
                    'https://sabzlearn.ir/course/linux-for-hackers/',
                    'https://sabzlearn.ir/course/js-20-lib/',
                    'https://sabzlearn.ir/course/creative-projects-with-js/',
                    'https://sabzlearn.ir/course/black-network/',
                    'https://sabzlearn.ir/course/creative-projects-with-html-css/',
                    'https://sabzlearn.ir/course/advance-template-design-with-html-css-flexbox/',
                    'https://sabzlearn.ir/course/reactjs/',
                    'https://sabzlearn.ir/course/regex/',
                    'https://sabzlearn.ir/course/npm-tutorial/',
                    'https://sabzlearn.ir/course/vscode-tutorial/',
                    'https://sabzlearn.ir/course/css-grid/',
                    'https://sabzlearn.ir/course/emmet/',
                    'https://sabzlearn.ir/course/ceh-v11/',
                    'https://sabzlearn.ir/course/flex-box/',
                    'https://sabzlearn.ir/course/black-py/',
                    'https://sabzlearn.ir/course/black-js/',
                    'https://sabzlearn.ir/course/bootstrap5/',
                    'https://sabzlearn.ir/course/free-vuejs-training/',
                    'https://sabzlearn.ir/course/java-script-zero-to-hero/',
                    'https://sabzlearn.ir/course/start-front-end/',
                    'https://sabzlearn.ir/course/html-tutorial/',
                    'https://sabzlearn.ir/course/css-tutorial/',
                ];

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
        const INITIAL_PAGE_URL = ['https://sabzlearn.ir/courses/'];

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
