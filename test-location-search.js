
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

    try {
        console.log('Starting Location Search Test...');

        await page.goto(`${BASE_URL}/services`);

        // Wait for services to load
        await page.waitForSelector('.card', { timeout: 10000 }).catch(() => console.log('No initial cards found (might need to create one first if DB empty)'));

        const initialCards = await page.$$('.card');
        console.log(`Initial services found: ${initialCards.length}`);

        if (initialCards.length === 0) {
            console.warn('WARNING: No services provided to test against. Creating one temporarily...');
            // Quick create service flow if needed, OR just assume previous test left one.
            // For now, let's assume "Test City" service exists from previous flow
        }

        // Test 1: Search for existing location "Test City"
        console.log('Testing Match: "Test City"');
        const inputSelector = 'input[placeholder="Filter by city..."]';
        await page.waitForSelector(inputSelector);

        // Clear input first just in case
        await page.evaluate(sel => document.querySelector(sel).value = '', inputSelector);

        await page.type(inputSelector, 'Test City');
        // React filter is instant, give it a split second to render
        await new Promise(r => setTimeout(r, 1000));

        const matchedCards = await page.$$('.card');
        console.log(`Services found for "Test City": ${matchedCards.length}`);

        if (matchedCards.length === 0) {
            console.error('FAIL: Expected services for "Test City", found none.');
            // Maybe the previous test service is gone? 
        } else {
            console.log('PASS: Found services for valid location.');
        }

        await page.screenshot({ path: 'search_match.png' });

        // Test 2: Search for non-existing location "Mars"
        console.log('Testing Mismatch: "Mars"');

        // Select all text and delete
        await page.click(inputSelector, { clickCount: 3 });
        await page.keyboard.press('Backspace');

        await page.type(inputSelector, 'Mars');
        await new Promise(r => setTimeout(r, 1000));

        const marsCards = await page.$$('.card');
        console.log(`Services found for "Mars": ${marsCards.length}`);

        if (marsCards.length === 0) {
            console.log('PASS: Correctly hid services for invalid location.');
            // Check for "No services found" message
            const noDataMsg = await page.evaluate(() => document.body.textContent.includes('No services found'));
            if (noDataMsg) console.log('PASS: "No services found" message visible.');
        } else {
            console.error('FAIL: Services still visible for "Mars". Filtering broken?');
        }

        await page.screenshot({ path: 'search_mismatch.png' });

        console.log('Location Search Test Completed.');

    } catch (error) {
        console.error('Test Failed:', error);
        fs.writeFileSync('test_location_error.txt', error.toString());
        await page.screenshot({ path: 'test_location_failure.png' });
    } finally {
        await browser.close();
    }
}

runTest();
