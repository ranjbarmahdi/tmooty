const cheerio = require('cheerio');
const {
    getBrowser,
    getRandomElement,
    shuffleArray,
    delay,
    convertToEnglishNumber,
} = require('./utils');
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
        const mainLinks = ['https://faradars.org/explore?limit=500'];

        // Push This Page Products Urls To allProductsLinks
        allMainLinks.push(...mainLinks);
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

            let html = await page.content();
            let $ = cheerio.load(html);

            const maxNumber = $('nav[aria-label="Pagination"] > span')
                .map((i, e) => convertToEnglishNumber($(e).text().trim()))
                .get()
                .filter((e) => Number(e))
                .map((i) => Number(i));

            let maxPageNumber = 1;
            if (maxNumber.length) {
                maxPageNumber = Math.max(...maxNumber);
            }
            let nextPageBtn;
            let c = 0;
            do {
                c++;
                console.log(c);
                html = await page.content();
                $ = cheerio.load(html);

                // Getting All Products Urls In This Page
                const productsUrls = $(
                    '#faradars-main > div > main > div > div > div > div > div.w-full.flex.flex-wrap.pb-6 > div.px-4 > div.flex.w-full > div > div > div > a:first-child'
                )
                    .map((i, e) => {
                        const url = $(e).attr('href');
                        if (url?.includes('faradars.org')) {
                            return url;
                        }
                        return 'https://faradars.org' + url;
                    })
                    .get();

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

                nextPageBtn = await page.$$('nav[aria-label="Pagination"] > a:last-child');
                if (c < maxPageNumber) {
                    let btn = nextPageBtn[0];
                    await btn.click();
                }
                await delay(10000);
            } while (c < maxPageNumber);
        } catch (error) {
            console.log('Error In findAllProductsLinks function', error);
        }
    }
}

// ============================================ Main
async function main() {
    try {
        const INITIAL_PAGE_URL = ['https://faradars.org/'];

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
