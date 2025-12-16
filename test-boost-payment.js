
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

    try {
        console.log('Starting Boost Payment Test...');
        const timestamp = Date.now();
        const providerEmail = `pay_boost_${timestamp}@test.com`;

        // 1. PROVIDER SETUP
        console.log('--- Registering Provider ---');
        await page.goto(`${BASE_URL}/register`);

        await page.waitForSelector('input[type="email"]');
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Work')) await btn.click();
        }
        await new Promise(r => setTimeout(r, 500));

        await page.type('input[type="email"]', providerEmail);
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForSelector('h1'); // Dashboard

        console.log('--- Creating Service ---');
        await page.goto(`${BASE_URL}/create-service`);
        await page.waitForSelector('input');
        const inputs = await page.$$('input');
        await inputs[0].type(`Boost Pay Service ${timestamp}`);
        await page.type('input[type="number"]', '200');
        await page.type('input[placeholder="e.g., New York, NY"]', 'Test City');
        await page.type('textarea', 'A service to test payments on.');
        await page.click('button[type="submit"]');
        await new Promise(r => setTimeout(r, 2000));

        // 2. INITIATE BOOST
        console.log('--- Initiating Boost ---');
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForSelector('.card');
        await new Promise(r => setTimeout(r, 1500)); // wait for services fetch

        // Find Boost Button
        const boostBtns = await page.$$('button');
        let boostBtn;
        for (const btn of boostBtns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Boost')) {
                boostBtn = btn;
                break;
            }
        }

        if (!boostBtn) throw new Error('Boost button not found on dashboard. Is service created?');
        await boostBtn.click();

        // Wait for Boost Modal
        await page.waitForSelector('button');
        await new Promise(r => setTimeout(r, 1000));

        // Find "Pay & Boost" button
        const modalBtns = await page.$$('button');
        let payBtn;
        for (const btn of modalBtns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Pay')) {
                payBtn = btn;
                break;
            }
        }
        if (!payBtn) throw new Error('Pay button not found in modal');

        console.log('Clicking Pay button...');
        await payBtn.click();

        // 3. VERIFY RAZORPAY OPENED
        // Razorpay opens an iframe with class `razorpay-checkout-frame`
        console.log('Waiting for Razorpay Iframe...');
        try {
            await page.waitForSelector('iframe', { timeout: 10000 });
            // More specific check? usually class="razorpay-checkout-frame"
            const frames = await page.$$('iframe');
            console.log(`Found ${frames.length} iframes.`);

            // Just finding an iframe is good evidence here since we don't use iframes elsewhere usually
            if (frames.length > 0) {
                console.log('PASS: Razorpay Modal Opened successfully!');
            } else {
                throw new Error('No iframes found after clicking Pay');
            }
        } catch (e) {
            console.error('FAST FAIL: Razorpay iframe did not appear.');
            throw e;
        }

        await new Promise(r => setTimeout(r, 3000)); // Let visual confirmation happen
        await page.screenshot({ path: 'boost_payment_modal_success.png' });

    } catch (error) {
        console.error('Test Failed:', error);
        await page.screenshot({ path: 'boost_payment_fail.png' });
    } finally {
        await browser.close();
    }
}

runTest();
