
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
    // page.on('pageerror', err => logs.push(`ERROR: ${err.toString()}`));

    try {
        console.log('Starting Keyword Search Test...');

        // 1. Visit Services Page
        await page.goto(`${BASE_URL}/services`);
        await page.waitForSelector('.card'); // wait for initial services

        // 2. Search for a term that should exist (e.g., from our test data)
        // We know we created services in previous tests. Let's try searching for "Plumber" or generic words.
        // Or better, let's create a specific one if we want robustness, but let's try existing first.

        // Let's create a unique service first to be sure
        await page.goto(`${BASE_URL}/login`);
        // Assuming we have a provider account or can register one quickly. 
        // Let's just create one to be safe and clean.

        const timestamp = Date.now();
        const providerEmail = `search_prov_${timestamp}@test.com`;
        const uniqueWord = `UniqueGadget${timestamp}`; // Search term

        console.log('--- Registering Provider ---');
        await page.goto(`${BASE_URL}/register`);
        await page.waitForSelector('input[type="email"]');

        // Select Work
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

        console.log('--- Creating Service with Unique Keyword ---');
        await page.goto(`${BASE_URL}/create-service`);
        await page.waitForSelector('input');
        const inputs = await page.$$('input');
        await inputs[0].type(`Service for ${uniqueWord}`);
        await page.type('input[type="number"]', '100');
        await page.type('input[placeholder="e.g., New York, NY"]', 'Search City');
        await page.type('textarea', `Description containing ${uniqueWord}`);
        await page.click('button[type="submit"]');
        await new Promise(r => setTimeout(r, 2000));

        console.log('--- Testing Search ---');
        await page.goto(`${BASE_URL}/services`);
        await page.waitForSelector('input[placeholder="Search keywords..."]');

        // Search for the unique word
        await page.type('input[placeholder="Search keywords..."]', uniqueWord);

        // Wait for debounce (300ms) + fetch
        await new Promise(r => setTimeout(r, 1500));

        // Check results
        const cards = await page.$$('.card');
        console.log(`Found ${cards.length} cards.`);

        if (cards.length !== 1) {
            throw new Error(`Expected 1 result for unique keyword, found ${cards.length}`);
        }

        const cardText = await page.evaluate(el => el.textContent, cards[0]);
        if (!cardText.includes(uniqueWord)) {
            throw new Error(`Card text does not contain keyword: ${uniqueWord}`);
        }

        console.log('PASS: Unique service found.');

        // Clear search
        await page.evaluate(() => document.querySelector('input[placeholder="Search keywords..."]').value = '');
        await page.type('input[placeholder="Search keywords..."]', 'NONEXISTENTJUNKWORD12345');
        await new Promise(r => setTimeout(r, 1500));

        const cardsEmpty = await page.$$('.card');
        if (cardsEmpty.length !== 0) {
            throw new Error('Expected 0 results for junk word');
        }
        console.log('PASS: Junk word returns no results.');

        await page.screenshot({ path: 'search_test_success.png' });

    } catch (error) {
        console.error('Test Failed:', error);
        fs.writeFileSync('test_search_error.txt', error.toString());
        await page.screenshot({ path: 'test_search_fail.png' });
    } finally {
        await browser.close();
    }
}

runTest();
