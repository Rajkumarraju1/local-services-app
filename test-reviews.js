
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
        console.log('Starting Ratings System Test...');
        const timestamp = Date.now();
        const providerEmail = `prov_review_${timestamp}@test.com`;
        const hirerEmail = `hire_review_${timestamp}@test.com`;
        const serviceTitle = `Reviewable Service ${timestamp}`;

        // 1. PROVIDER REGISTER & CREATE SERVICE
        console.log('--- Step 1: Provider Setup ---');
        await page.goto(`${BASE_URL}/register`);

        // Select Work
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Work')) await btn.click();
        }

        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', providerEmail);
        await page.type('input[type="password"]', 'password123');

        const submitBtn = 'button[type="submit"]';
        await page.waitForSelector(submitBtn);
        await page.click(submitBtn);

        // Wait for dashboard
        await page.waitForSelector('h1');

        // Create Service
        await page.goto(`${BASE_URL}/create-service`);
        await page.waitForSelector('input');

        // Title
        const inputs = await page.$$('input');
        await inputs[0].type(serviceTitle);

        // Price
        await page.type('input[type="number"]', '100');

        // Location
        await page.type('input[placeholder="e.g., New York, NY"]', 'Review City');

        // Description
        await page.type('textarea', 'Review me!');

        // Submit
        await page.click('button[type="submit"]');
        await new Promise(r => setTimeout(r, 2000)); // wait for nav
        console.log('Service Created');

        await logout();

        // 2. HIRER REGISTER & BOOK
        console.log('--- Step 2: Hirer Booking ---');
        await page.goto(`${BASE_URL}/register`);
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', hirerEmail);
        await page.type('input[type="password"]', 'password123');
        await page.click(submitBtn);
        await page.waitForSelector('h1'); // Dashboard

        // Book Service
        await page.goto(`${BASE_URL}/services`);
        await new Promise(r => setTimeout(r, 2000)); // wait for load
        const cards = await page.$$('.card');
        let targetCard;
        for (const card of cards) {
            const text = await page.evaluate(el => el.textContent, card);
            if (text.includes(serviceTitle)) targetCard = card;
        }

        if (!targetCard) throw new Error('Service not found for booking');

        const bookBtn = await targetCard.$('button');
        if (!bookBtn) throw new Error('Book button not found on card');

        try {
            await Promise.all([
                page.waitForNavigation({ timeout: 5000 }),
                bookBtn.click()
            ]);
        } catch (e) {
            console.log('Navigation click timed out, trying manual URL navigation...');
            // Fallback: get ID from card or just assume it's the first one if we created it
            // Better: just click and wait for selector, but since that failed, hard reload or re-query
            await page.reload();
            await page.waitForSelector('.card');
            const cards = await page.$$('.card');
            const targetCard = cards[0]; // Assume first for this test
            const btn = await targetCard.$('button');
            await btn.click();
        }

        console.log('Clicked Book button, waiting for form...');

        console.log('Current URL after book click:', page.url());
        try {
            await page.waitForSelector('textarea', { timeout: 10000 });
            console.log('Found textarea');
        } catch (e) {
            console.log('Timeout waiting for textarea.');
            const body = await page.content();
            fs.writeFileSync('debug_page_content.html', body);
            fs.writeFileSync('debug_console.txt', logs.join('\n'));
            throw e;
        }
        await page.type('input[type="datetime-local"]', '2025-12-25T10:00');
        await page.type('textarea', 'Can I review you?');
        await page.click('button[type="submit"]');
        await new Promise(r => setTimeout(r, 2000));
        console.log('Service Booked');

        await logout();

        // 3. PROVIDER MARK COMPLETE
        console.log('--- Step 3: Provider Completes Job ---');
        // Ensure we are at login
        if (!page.url().includes('/login')) {
            await page.goto(`${BASE_URL}/login`);
        }
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', providerEmail);
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForSelector('table');

        // Accept (Pass)
        // Find the "Pass" button. It's the first button in the actions usually for pending
        // We'll rely on text content
        const passBtns = await page.$$('button');
        for (const btn of passBtns) {
            const t = await page.evaluate(el => el.textContent, btn);
            if (t.includes('Pass')) {
                await btn.click();
                break;
            }
        }
        await new Promise(r => setTimeout(r, 1000));

        // Mark Complete
        // Now find "Mark Complete"
        const completeBtns = await page.$$('button');
        for (const btn of completeBtns) {
            const t = await page.evaluate(el => el.textContent, btn);
            if (t.includes('Mark Complete')) {
                await btn.click();
                break;
            }
        }
        await new Promise(r => setTimeout(r, 1000));
        console.log('Job Marked Complete');

        await logout();

        // 4. HIRER RATES
        console.log('--- Step 4: Hirer Rates ---');
        if (!page.url().includes('/login')) {
            await page.goto(`${BASE_URL}/login`);
        }
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', hirerEmail);
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForSelector('table');

        // Find "Rate" button
        const rateBtns = await page.$$('button');
        let rateBtn;
        for (const btn of rateBtns) {
            const t = await page.evaluate(el => el.textContent, btn);
            if (t.includes('Rate')) {
                rateBtn = btn;
                break;
            }
        }

        if (!rateBtn) throw new Error('Rate button not found');
        await rateBtn.click();

        // Modal interaction
        await page.waitForSelector('textarea[placeholder="How was your experience?"]');
        await page.type('textarea', 'Amazing service! 5 stars.');
        // Default is 5 stars, just submit
        // Find Submit Review button in modal
        const modalBtns = await page.$$('button');
        for (const btn of modalBtns) {
            const t = await page.evaluate(el => el.textContent, btn);
            if (t.includes('Submit Review')) {
                await btn.click();
                break;
            }
        }

        // Wait for alert logic (we mocked alert, but here it might block. 
        // Puppeteer handles alerts automatically by accepting, or we might need listener if using window.alert)
        page.on('dialog', async dialog => {
            console.log('Dialog:', dialog.message());
            await dialog.accept();
        });

        await new Promise(r => setTimeout(r, 2000));
        console.log('Review Submitted');

        // 5. VERIFY ON SERVICE CARD
        console.log('--- Step 5: Verification ---');
        await page.goto(`${BASE_URL}/services`);
        await page.waitForSelector('.card');

        // Reload to ensure fresh data
        await page.reload();
        await page.waitForSelector('.card');

        // Check for rating text
        const content = await page.content();
        if (content.includes('★ 5')) {
            console.log('PASS: Rating "★ 5" found on service card!');
            await page.screenshot({ path: 'ratings_success.png' });
        } else {
            console.error('FAIL: Rating not found.');
            await page.screenshot({ path: 'ratings_fail.png' });
        }

    } catch (error) {
        console.error('Test Failed:', error);
        fs.writeFileSync('test_reviews_error.txt', error.toString());
        await page.screenshot({ path: 'test_reviews_fail.png' });
    } finally {
        await browser.close();
    }
}

runTest();
