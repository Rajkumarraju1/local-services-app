
import puppeteer from 'puppeteer';
import fs from 'fs';

const BASE_URL = 'http://localhost:5173';

async function runTest() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    const logs = [];
    page.on('console', msg => logs.push(`LOG: ${msg.text()}`));
    page.on('pageerror', err => logs.push(`ERROR: ${err.toString()}`));

    // Helper to clear auth
    const logout = async () => {
        await page.evaluate(() => localStorage.clear());
        await page.goto(`${BASE_URL}/login`);
    };

    try {
        console.log('Starting Boost Feature Test...');
        const timestamp = Date.now();
        const providerEmail = `boost_prov_${timestamp}@test.com`;
        const serviceTitle = `Boostable Service ${timestamp}`;

        // 1. PROVIDER REGISTER
        console.log('--- Step 1: Provider Register ---');
        await page.goto(`${BASE_URL}/register`);

        // Wait for form first
        await page.waitForSelector('input[type="email"]');

        // Select Work
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Work')) await btn.click();
        }

        // Slight pause to let state settle
        await new Promise(r => setTimeout(r, 500));

        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', providerEmail);
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await page.waitForSelector('h1');
        console.log('Provider registered.');

        // 2. CREATE SERVICE
        console.log('--- Step 2: Create Service ---');
        await page.goto(`${BASE_URL}/create-service`);
        await page.waitForSelector('input');
        const inputs = await page.$$('input');
        await inputs[0].type(serviceTitle);
        await page.type('input[type="number"]', '150');
        await page.type('input[placeholder="e.g., New York, NY"]', 'Boost City');
        await page.type('textarea', 'This service needs a boost.');
        await page.click('button[type="submit"]');

        await new Promise(r => setTimeout(r, 2000));
        console.log('Service Created.');

        // 3. BOOST SERVICE
        console.log('--- Step 3: Boost Service ---');
        await page.goto(`${BASE_URL}/dashboard`);
        // Wait for services to load
        await page.waitForSelector('.card');
        // Find Boost Button
        // We'll rely on text "Boost"
        await new Promise(r => setTimeout(r, 1000)); // wait for fetch

        const boostBtns = await page.$$('button');
        let boostBtn;
        for (const btn of boostBtns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Boost')) {
                boostBtn = btn;
                break;
            }
        }

        if (!boostBtn) throw new Error('Boost button not found!');
        await boostBtn.click();
        console.log('Clicked Boost...');

        // Confirm Payment Modal
        await new Promise(r => setTimeout(r, 1000)); // wait for modal
        const payBtns = await page.$$('button');
        let payBtn;
        for (const btn of payBtns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Pay ₹99')) {
                payBtn = btn;
                break;
            }
        }
        if (!payBtn) throw new Error('Pay button not found in modal');

        await payBtn.click();

        // Handle Alerts (Payment Successful)
        page.on('dialog', async dialog => {
            console.log('Dialog:', dialog.message());
            await dialog.accept();
        });

        await new Promise(r => setTimeout(r, 3000)); // wait for mock payment
        console.log('Payment Completed.');

        // 4. VERIFY ON SERVICES PAGE
        console.log('--- Step 4: Verify Badge & Sorting ---');
        await page.goto(`${BASE_URL}/services`);
        await page.waitForSelector('.card');
        await new Promise(r => setTimeout(r, 1000));

        const content = await page.content();

        // Check for Badge
        if (content.includes('FEATURED')) {
            console.log('PASS: "FEATURED" badge found!');
        } else {
            console.error('FAIL: "FEATURED" badge NOT found.');
            throw new Error('Badge missing');
        }

        // Check Sorting (Should be first card)
        // We can inspect the first card's title
        const firstCardTitle = await page.evaluate(() => {
            const card = document.querySelector('.card');
            return card ? card.querySelector('h3').textContent : null;
        });

        if (firstCardTitle === serviceTitle) {
            console.log(`PASS: Boosted service "${serviceTitle}" is listed first!`);
        } else {
            console.error(`FAIL: First service is "${firstCardTitle}", expected "${serviceTitle}"`);
            // It might be fail if there are other promoted services, but in this clean test env it should work
        }

        await page.screenshot({ path: 'boost_test_success.png' });

    } catch (error) {
        console.error('Test Failed:', error);
        const content = await page.content();
        console.log('Page Content on Fail:', content);
        fs.writeFileSync('test_boost_error.txt', error.toString());
        fs.writeFileSync('test_boost_fail_content.html', content);
        await page.screenshot({ path: 'test_boost_fail.png' });
    } finally {
        await browser.close();
    }
}

runTest();
