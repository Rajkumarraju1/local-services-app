
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

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    try {
        console.log('Starting Service Provider Flow...');

        // 1. Register as Service Provider
        const providerEmail = `provider_${Date.now()}@test.com`;
        await page.goto(`${BASE_URL}/register`);

        console.log('Navigation to register complete.');

        // Verify we are on the right page
        // Wait for ANY input to appear
        await page.waitForSelector('input', { timeout: 60000 });

        // Select "Work" (Provider role)
        const buttons = await page.$$('button');
        let workBtn;
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Work')) {
                workBtn = btn;
                break;
            }
        }
        if (workBtn) {
            await workBtn.click();
            console.log('Clicked "Work" button');
        } else {
            console.warn('Work button not found, checking if inputs are visible...');
        }

        // Wait specifically for email input
        await page.waitForSelector('input[type="email"]', { visible: true });
        await page.type('input[type="email"]', providerEmail);

        await page.waitForSelector('input[type="password"]', { visible: true });
        await page.type('input[type="password"]', 'password123');

        // Debug screenshot before click
        await page.screenshot({ path: 'before_provider_submit.png' });

        const submitBtnSelector = 'button[type="submit"]';
        await page.waitForSelector(submitBtnSelector, { visible: true });
        const submitBtn = await page.$(submitBtnSelector);

        // Ensure enabled
        await page.waitForFunction(
            selector => !document.querySelector(selector).disabled,
            {},
            submitBtnSelector
        );

        await submitBtn.click();

        // Wait for Dashboard header 'Dashboard'
        await page.waitForSelector('h1', { timeout: 60000 });
        const dashboardTitle = await page.evaluate(() => document.querySelector('h1').textContent);
        if (!dashboardTitle.includes('Dashboard')) throw new Error('Failed to reach Dashboard');

        console.log(`Registered Provider: ${providerEmail}`);

        // 2. Create Service
        await page.goto(`${BASE_URL}/create-service`);

        // Wait for inputs
        await page.waitForSelector('input');

        const inputs = await page.$$('input');
        // inputs[0] is often title
        if (inputs.length > 0) {
            await inputs[0].type('Puppeteer Test Service');
        } else {
            throw new Error('No inputs found on create-service page');
        }

        // Category is select
        const select = await page.$('select');
        if (select) {
            await page.select('select', 'Plumber');
        }

        // Price is type="number"
        await page.waitForSelector('input[type="number"]');
        await page.type('input[type="number"]', '150');

        // Location
        const locationSelector = 'input[placeholder="e.g., New York, NY"]';
        await page.waitForSelector(locationSelector);
        await page.type(locationSelector, 'Test City');

        // Description
        await page.waitForSelector('textarea');
        await page.type('textarea', 'This service was created automatically by Puppeteer.');

        // Submit
        await page.waitForSelector('button[type="submit"]');
        const publishBtn = await page.$('button[type="submit"]');
        await publishBtn.click();

        // Create service redirects to /services usually
        // Wait for navigation or just timeout
        await new Promise(r => setTimeout(r, 2000));
        console.log('Service Created!');

        // 3. Logout
        await page.evaluate(() => localStorage.clear());
        // Force reload to clear state
        await page.goto(`${BASE_URL}/login`);
        console.log('Logged out Provider.');

        // 4. Register Hirer
        console.log('Starting Hirer Flow...');
        const hirerEmail = `hirer_${Date.now()}@test.com`;
        await page.goto(`${BASE_URL}/register`);

        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', hirerEmail);
        await page.type('input[type="password"]', 'password123');

        await page.waitForSelector('button[type="submit"]');
        const hirerSubmitBtn = await page.$('button[type="submit"]');
        await hirerSubmitBtn.click();

        // Wait for Dashboard
        await page.waitForSelector('h1', { timeout: 10000 });
        console.log(`Registered Hirer: ${hirerEmail}`);

        // 5. Book Service
        await page.goto(`${BASE_URL}/services`);

        await page.waitForSelector('.card', { timeout: 10000 }).catch(() => console.log('No cards found yet'));

        // Find our service card
        let serviceCard = await page.evaluateHandle(() => {
            const cards = Array.from(document.querySelectorAll('.card'));
            return cards.find(card => card.textContent.includes('Puppeteer Test Service'));
        });

        if (!serviceCard.asElement()) {
            console.log('Service not found, reloading page...');
            await page.reload();
            await page.waitForSelector('.card', { timeout: 10000 });
            serviceCard = await page.evaluateHandle(() => {
                const cards = Array.from(document.querySelectorAll('.card'));
                return cards.find(card => card.textContent.includes('Puppeteer Test Service'));
            });
        }

        if (serviceCard.asElement()) {
            const bookBtn = await serviceCard.$('button');
            if (bookBtn) {
                await bookBtn.click();
                // Wait for form input
                await page.waitForSelector('textarea', { timeout: 5000 });
                console.log('Navigated to Booking Page.');

                // Fill Booking Form
                await page.waitForSelector('input[type="datetime-local"]');
                await page.type('input[type="datetime-local"]', '2025-12-25T10:00');
                await page.type('textarea', 'I need this done urgently.');

                await page.waitForSelector('button[type="submit"]');
                const confirmBtn = await page.$('button[type="submit"]');
                await confirmBtn.click();

                // wait for alert or redirect
                await new Promise(r => setTimeout(r, 2000));
                console.log('Booking Confirmed!');

                // Screenshot Success
                await page.screenshot({ path: 'booking_success.png' });
            } else {
                console.error('Book button not found on card.');
            }
        } else {
            console.error('Service card not found via Puppeteer.');
            await page.screenshot({ path: 'service_not_found.png' });
        }

        console.log('Test Completed Successfully!');



        // Keep browser open for a few seconds
        await new Promise(r => setTimeout(r, 5000));

    } catch (error) {
        console.error('Test Failed:', error);
        fs.writeFileSync('test_error.txt', error.toString());
        const html = await page.content();
        console.log('Page Content at failure:', html);
        await page.screenshot({ path: 'test_failure.png' });
    } finally {
        await browser.close();
    }
}

runTest();
