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
                    'https://codeyad.com/course/learn-restful-api-in-asp-net-core',
                    'https://codeyad.com/course/learn-using-typescript-in-react',
                    'https://codeyad.com/course/microservices-in-nodejs',
                    'https://codeyad.com/course/educational-site-with-laravel-and-livewire-as-modular',
                    'https://codeyad.com/course/laravel-from-beginner-to-professional',
                    'https://codeyad.com/course/learn-game-developing-with-unity-3d',
                    'https://codeyad.com/course/learn-sql-server-2016',
                    'https://codeyad.com/course/comprehensive-training-of-nft',
                    'https://codeyad.com/course/planning-and-time-management-for-programmers',
                    'https://codeyad.com/course/free-digital-marketing-curses',
                    'https://codeyad.com/course/learn-seo-specialized',
                    'https://codeyad.com/course/learn-front-end-design',
                    'https://codeyad.com/course/wordpress-template-design-tutorial',
                    'https://codeyad.com/course/learn-software-development-with-asp-net-core',
                    'https://codeyad.com/course/machine-learning-with-cnetmlnet',
                    'https://codeyad.com/course/learn-nuxt',
                    'https://codeyad.com/course/network-plus',
                    'https://codeyad.com/course/web-scraping-with-python',
                    'https://codeyad.com/course/learn-angular-and-typescript',
                    'https://codeyad.com/course/website-uxui-design-with-figma',
                    'https://codeyad.com/course/learn-ux-design-with-figma',
                    'https://codeyad.com/course/learn-fullstack-developing-with-php',
                    'https://codeyad.com/course/learn-mongodb-database',
                    'https://codeyad.com/course/linkedin-for-freelancers',
                    'https://codeyad.com/course/training-on-designing-a-store-website-with-wordpress',
                    'https://codeyad.com/course/learn-machine-learning',
                    'https://codeyad.com/course/learn-react',
                    'https://codeyad.com/course/designing-an-educational-site-with-wordpress',
                    'https://codeyad.com/course/learn-python',
                    'https://codeyad.com/course/learn-clean-code',
                    'https://codeyad.com/course/learn-dart-language',
                    'https://codeyad.com/course/learn-html-css',
                    'https://codeyad.com/course/iyzico-asp-net-core',
                    'https://codeyad.com/course/learn-java',
                    'https://codeyad.com/course/learn-razor-pages-in-asp-net-core',
                    'https://codeyad.com/course/teaching-semi-advanced-solidity-and-blockchain-topics-from-defi-to-nfts',
                    'https://codeyad.com/course/watch-store-laravel-livewire-swagger',
                    'https://codeyad.com/course/learn-asp-net-mvc-preliminary',
                    'https://codeyad.com/course/learn-php',
                    'https://codeyad.com/course/learn-rtl-the-template-in-bootstrap',
                    'https://codeyad.com/course/learn-google-recaptcha-in-asp-net-core',
                    'https://codeyad.com/course/asp-net-core-preliminary',
                    'https://codeyad.com/course/building-framework-similar-laravel',
                    'https://codeyad.com/course/learn-web-design-with-php',
                    'https://codeyad.com/course/learn-javascript',
                    'https://codeyad.com/course/learn-livewire',
                    'https://codeyad.com/course/learn-jquery',
                    'https://codeyad.com/course/learn-csharp',
                    'https://codeyad.com/course/elementor',
                    'https://codeyad.com/course/livewire3',
                    'https://codeyad.com/course/learn-signalr',
                    'https://codeyad.com/course/teach-php-very-simple',
                    'https://codeyad.com/course/async-programming-in-csharp-dot-net',
                    'https://codeyad.com/course/learn-pagging-in-asp-net-core',
                    'https://codeyad.com/course/learn-flexbox',
                    'https://codeyad.com/course/install-and-config-laragon',
                    'https://codeyad.com/course/learn-request-library-in-python',
                    'https://codeyad.com/course/install-and-config-tailwind-in-laravel',
                    'https://codeyad.com/course/learn-practice-front-end',
                    'https://codeyad.com/course/modular-coding-in-laravel',
                    'https://codeyad.com/course/learn-css-grid',
                    'https://codeyad.com/course/create-resume',
                    'https://codeyad.com/course/identity-asp-net-core',
                    'https://codeyad.com/course/make-telegram-bot-with-laravel',
                    'https://codeyad.com/course/python-desktop-developer',
                    'https://codeyad.com/course/website-management-panel-design-with-javascript',
                    'https://codeyad.com/course/learn-tailwind-css',
                    'https://codeyad.com/course/socketio-in-nodejs-tutorial',
                    'https://codeyad.com/course/learn-nodejs',
                    'https://codeyad.com/course/learn-typescript',
                    'https://codeyad.com/course/problem-solving-techniques-for-programmers',
                    'https://codeyad.com/course/learn-flutter',
                    'https://codeyad.com/course/refactoring',
                    'https://codeyad.com/course/learn-bootstrap-5',
                    'https://codeyad.com/course/learn-ef-core',
                    'https://codeyad.com/course/learn-nuxtjs-vuejs',
                    'https://codeyad.com/course/learn-rabbitmq-in-asp-net-core',
                    'https://codeyad.com/course/design-sheypoor-with-tailwindcss',
                    'https://codeyad.com/course/learn-shop-site-development-with-laravel-and-livewire',
                    'https://codeyad.com/course/wordpress-security',
                    'https://codeyad.com/course/learn-blockchain-development-with-solidity',
                    'https://codeyad.com/course/discipline',
                    'https://codeyad.com/course/learn-essential-linux',
                    'https://codeyad.com/course/learn-advanced-asp-net-mvc',
                    'https://codeyad.com/course/nextjs-react-framework',
                    'https://codeyad.com/course/learn-web-development-with-materialize-framework',
                    'https://codeyad.com/course/learn-pwa',
                    'https://codeyad.com/course/rest-api',
                    'https://codeyad.com/course/learn-django',
                    'https://codeyad.com/course/learn-django-rest-framework',
                    'https://codeyad.com/course/how-to-use-ai-as-a-programmer',
                    'https://codeyad.com/course/migration-programming',
                    'https://codeyad.com/course/image-processing-and-computer-vision-with-opencv',
                    'https://codeyad.com/course/learning-matplotlib-in-python',
                    'https://codeyad.com/course/website-template-design-with-javascript',
                    'https://codeyad.com/course/system-design',
                    'https://codeyad.com/course/learn-google-search-console',
                    'https://codeyad.com/course/learn-laravel',
                    'https://codeyad.com/course/learn-screaming-frog',
                    'https://codeyad.com/course/design-patterns-for-all-programmers',
                    'https://codeyad.com/course/learn-advanced-wordpress-without-coding',
                    'https://codeyad.com/course/learn-wordpress-preliminary',
                    'https://codeyad.com/course/earn-money-from-wordpress',
                    'https://codeyad.com/course/learn-cpp',
                    'https://codeyad.com/course/learn-git-and-github',
                    'https://codeyad.com/course/learn-advanced-csharp-net',
                    'https://codeyad.com/course/computer-networking-concepts',
                    'https://codeyad.com/course/basic-concepts-blockchain',
                    'https://codeyad.com/course/learn-seo-preliminary',
                    'https://codeyad.com/course/learn-algorithm-flowchart',
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
        const INITIAL_PAGE_URL = ['https://codeyad.com/courses'];

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
