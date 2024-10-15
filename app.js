const {
    getBrowser,
    getRandomElement,
    delay,
    checkMemoryCpu,
    downloadImages,
    convertToEnglishNumber,
} = require('./utils');
const omitEmpty = require('omit-empty');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const db = require('./config.js');
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const os = require('os');
// const cron = require('node-cron');
// const CronJob = require('cron').CronJob;

// ============================================ existsUrl
async function existsUrl() {
    const existsQuery = `
        SELECT * FROM unvisited u 
        limit 1
    `;
    try {
        const urlRow = await db.oneOrNone(existsQuery);
        if (urlRow) return true;
        return false;
    } catch (error) {
        console.log('we have no url', error);
    }
}

// ============================================ removeUrl
async function removeUrl() {
    const existsQuery = `
        SELECT * FROM unvisited u 
        ORDER BY RANDOM()
        limit 1
    `;
    const deleteQuery = `
          DELETE FROM unvisited 
          WHERE id=$1
     `;
    try {
        const urlRow = await db.oneOrNone(existsQuery);
        if (urlRow) {
            await db.query(deleteQuery, [urlRow.id]);
        }
        return urlRow;
    } catch (error) {
        console.log('we have no url', error);
    }
}

// ============================================ insertProduct
async function insertCourse(queryValues) {
    const query = `
          insert into products ("url", "title", "sku", "description", "headlines", "price", "discount", "number_of_students", "duration", "teacher_name", "course_type", "course_level", "certificate_type", "education_place")
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     `;

    try {
        const result = await db.oneOrNone(query, queryValues);
        return result;
    } catch (error) {
        console.log('Error in insertCource :', error.message);
    }
}

// ============================================ insertUrlToProblem
async function insertUrlToProblem(url) {
    const existsQuery = `
        SELECT * FROM problem u 
        where "url"=$1
    `;

    const insertQuery = `
        INSERT INTO problem ("url")
        VALUES ($1)
        RETURNING *;
    `;
    const urlInDb = await db.oneOrNone(existsQuery, [url]);
    if (!urlInDb) {
        try {
            const result = await db.query(insertQuery, [url]);
            return result;
        } catch (error) {
            console.log(`Error in insertUrlToProblem  function : ${url}\nError:`, error.message);
        }
    }
}

// ============================================ insertUrlToVisited
async function insertUrlToVisited(url) {
    const existsQuery = `
        SELECT * FROM visited u 
        where "url"=$1
    `;

    const insertQuery = `
        INSERT INTO visited ("url")
        VALUES ($1)
        RETURNING *;
    `;
    const urlInDb = await db.oneOrNone(existsQuery, [url]);
    if (!urlInDb) {
        try {
            const result = await db.query(insertQuery, [url]);
            return result;
        } catch (error) {
            console.log(`Error in insertUrlToVisited function : ${url}\nError:`, error.message);
        }
    }
}

// ============================================ findMinPrice
async function getPrice(page, xpaths, currency) {
    let price = Infinity;
    let xpath = '';
    try {
        if (xpaths.length == 0) {
            return [price, xpath];
        }

        // Find Price
        for (const _xpath of xpaths) {
            try {
                const priceElements = await page.$x(_xpath);
                if (priceElements.length) {
                    let priceText = await page.evaluate(
                        (elem) => elem.textContent?.replace(/[^\u06F0-\u06F90-9]/g, ''),
                        priceElements[0]
                    );
                    priceText = convertToEnglishNumber(priceText);
                    let priceNumber = currency ? Number(priceText) : Number(priceText) * 10;
                    if (priceNumber < price && priceNumber !== 0) {
                        price = priceNumber;
                        xpath = _xpath;
                    }
                }
            } catch (error) {
                console.log('Error in getPrice Function Foor Loop :', error.message);
            }
        }
    } catch (error) {
        console.log('Error In getPrice :', error);
    } finally {
        return [price, xpath];
    }
}

// ============================================ scrapeCourse
async function scrapeCourse(page, courseURL, imagesDIR, documentsDir) {
    try {
        console.log(`======================== Start scraping : \n${courseURL}\n`);
        await page.goto(courseURL, { timeout: 180000 });
        await delay(5000);
        
        let html = await page.content();
        let $ = await cheerio.load(html);
        
        // Generate uuidv4
        const uuid = uuidv4().replace(/-/g, '');
        

        const data = {};
        data['url'] = courseURL;

        data['title'] = $('').length ? $('').text().trim() : '';

        data['sku'] = uuid;

        data['description'] = ''

        data['headlines'] = $(
            '.accommodation-pdp-specifications__container > .accommodation-pdp-specification > .accommodation-pdp-specification-content'
        )
            .map((i, e) => {
                const title = $(e)
                    .find('.accommodation-pdp-specification-content__title')
                    .text()
                    ?.trim();
                const ambients = $(e)
                    .find(
                        '.accommodation-pdp-specification-description > .accommodation-pdp-specification-description__item'
                    )
                    .map((i, e) => $(e).text()?.trim())
                    .get()
                    .join('\n');
                return `${title}:\n${ambients}`;
            })
            .get()
            .join('\n\n');

        data['price'] = ''
        data['discount'] = ''
        data['number_of_students'] = $("notFound").text()?.trim() || "";
        data['duration'] = $("notFound").text()?.trim() || "";
        data['teacher_name'] = $("notFound").text()?.trim() || "";
        data['course_type'] = $("notFound").text()?.trim() || "";
        data['course_level'] = $("notFound").text()?.trim() || "";
        data['certificate_type'] = $("notFound").text()?.trim() || "";
        data['education_place'] = $("notFound").text()?.trim() || "";

        data['price'] = '';
        data['xpath'] = '';

        // price_1
        const xpaths = [];
        const mainXpath = '';
        if (xpaths.length) {
            // Find Price
            const [amount, xpath] = await getPrice(page, xpaths, currency);

            // Check Price Is Finite
            if (isFinite(amount)) {
                data['price'] = amount;
                data['xpath'] = xpath;
            } else {
                data['xpath'] = mainXpath;
            }
        }

        // price_2
        // const offPercent = $('notFound').get()
        // if (offPercent.length) {
        //      data["price"] = $('notFound').text().replace(/[^\u06F0-\u06F90-9]/g, "")
        //      data["xpath"] = "";
        // }
        // else {
        //      data["price"] = $('notFound').first().text().replace(/[^\u06F0-\u06F90-9]/g, "");
        //      data["xpath"] = '';
        // }

        // specification, specificationString



        // Download Images
        const image_xpaths = [];
        let imageUrls = await Promise.all(
            image_xpaths.map(async (_xpath) => {
                try {
                    await page.waitForXPath(_xpath, { timeout: 5000 });
                } catch (error) {}

                const imageElements = await page.$x(_xpath);

                // Get the src attribute of each image element found by the XPath
                const srcUrls = await Promise.all(
                    imageElements.map(async (element) => {
                        let src = await page.evaluate(
                            (el) => el.getAttribute('src')?.replace(/(-[0-9]+x[0-9]+)/g, ''),
                            element
                        );
                        return src;
                    })
                );

                return srcUrls;
            })
        );

        imageUrls = imageUrls.flat();
        imageUrls = [...new Set(imageUrls)];
        await downloadImages(imageUrls, imagesDIR, uuid);


        // download pdfs
        let pdfUrls = $('NotFound')
            .map((i, e) => $(e).attr('href'))
            .get()
            .filter((href) => href.includes('pdf'));
        pdfUrls = Array.from(new Set(pdfUrls));
        for (let i = 0; i < pdfUrls.length; i++) {
            try {
                const pdfUrl = pdfUrls[i];
                const response = await fetch(pdfUrl);
                if (response.ok) {
                    const buffer = await response.buffer();
                    const localFileName = `${uuid}-${i + 1}.pdf`;
                    const documentDir = path.normalize(documentsDir + '/' + localFileName);
                    fs.writeFileSync(documentDir, buffer);
                }
            } catch (error) {
                console.log('Error In Download Documents', error);
            }
        }

        // Returning The Required Data For Excel
        const courseDataObject = {
            url: data['url'],
            title: data['title'],
            sku: data['sku'] ,
            description: data['description'],
            headlines: data['headlines'],
            price: data['price'],
            discount: data['discount'],
            number_of_students: data['number_of_students'],
            duration: data['duration'],
            teacher_name: data['teacher_name'],
            course_type: data['course_type'],
            course_level: data['course_level'],
            certificate_type: data['certificate_type'],
            education_place: data['education_place']
        };

        return courseDataObject;
        
    } catch (error) {
        console.log('Error In scrapeCourse in page.goto', error);
        await insertUrlToProblem(courseURL);
        return null;
    }
}

// ============================================ Main
async function main() {
    let urlRow;
    let browser;
    let page;
    try {
        const DATA_DIR = path.normalize(__dirname + `/${process.env.DIRECTORY_NAME}`);
        const IMAGES_DIR = path.normalize(DATA_DIR + '/images');
        const DOCUMENTS_DIR = path.normalize(DATA_DIR + '/documents');

        // Create Directory If Not Exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR);
        }
        if (!fs.existsSync(DOCUMENTS_DIR)) {
            fs.mkdirSync(DOCUMENTS_DIR);
        }
        if (!fs.existsSync(IMAGES_DIR)) {
            fs.mkdirSync(IMAGES_DIR);
        }

        // get course url from db
        urlRow = await removeUrl();

        if (urlRow?.url) {
            // get random proxy
            const proxyList = [''];
            const randomProxy = getRandomElement(proxyList);

            // Lunch Browser
            await delay(Math.random() * 4000);
            browser = await getBrowser(randomProxy, true, false);
            page = await browser.newPage();
            await page.setViewport({
                width: 1920,
                height: 1080,
            });

            const courseInfo = await scrapeCourse(
                page,
                urlRow.url,
                IMAGES_DIR,
                DOCUMENTS_DIR
            );

            const insertQueryInput = [
                courseInfo.url,
                courseInfo.title,
                courseInfo.sku,
                courseInfo.description,
                courseInfo.headlines,
                courseInfo.price,
                courseInfo.discount,
                courseInfo.number_of_students,
                courseInfo.duration,
                courseInfo.teacher_name,
                courseInfo.course_type,
                courseInfo.course_level,
                courseInfo.certificate_type,
                courseInfo.education_place
            ];

            // if exists courseInfo insert it to courses
            if (courseInfo) {
                await insertCourse(insertQueryInput);
                await insertUrlToVisited(urlRow?.url);
            }
        }
    } catch (error) {
        console.log('Error In main Function', error);
        await insertUrlToProblem(urlRow?.url);
    } finally {
        // Close page and browser
        console.log('End');
        if (page) await page.close();
        if (browser) await browser.close();
    }
}

// ============================================ run_1
async function run_1(memoryUsagePercentage, cpuUsagePercentage, usageMemory) {
    if (checkMemoryCpu(memoryUsagePercentage, cpuUsagePercentage, usageMemory)) {
        await main();
    } else {
        const status = `status:
          memory usage = ${usageMemory}
          percentage of memory usage = ${memoryUsagePercentage}
          percentage of cpu usage = ${cpuUsagePercentage}\n`;

        console.log('main function does not run.\n');
        console.log(status);
    }
}

// ============================================ run_2
async function run_2(memoryUsagePercentage, cpuUsagePercentage, usageMemory) {
    let urlExists;

    do {
        urlExists = await existsUrl();
        if (urlExists) {
            await run_1(memoryUsagePercentage, cpuUsagePercentage, usageMemory);
        }
    } while (urlExists);
}

// ============================================ Job

// stopTime = 8000
// let job = new CronJob('*/3 * * * * *', async () => {

//      console.log("cron");
//      let usageMemory = (os.totalmem() - os.freemem()) / (1024 * 1024 * 1024);
//      let memoryUsagePercentage = checkMemoryUsage();
//      let cpuUsagePercentage = await getCpuUsagePercentage();

//      if (usageMemory >= 13 || cpuUsagePercentage >= 90) {
//           console.log("=========================================");
//           console.log(`job stopped for ${stopTime} ms`);
//           job.stop();

//           setInterval(() => {
//                console.log(`Restarting cron job after ${stopTime} ms...`)
//                job.start();
//           }, stopTime)
//      }

//      if (memoryUsagePercentage <= 80 && cpuUsagePercentage <= 85) {
//           main();
//           console.log("main");
//      }
// })
// job.start()


run_1(80, 80, 20);
// run_2(80, 80, 20);
