
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
        console.log('Starting Provider Profile Test...');
        const timestamp = Date.now();
        const providerEmail = `prov_prof_${timestamp}@test.com`;
        const displayName = `Master Craftsman ${timestamp}`;
        const bio = `We provide the best services in town since ${timestamp}.`;

        // 1. PROVIDER REGISTER
        console.log('--- Step 1: Provider Register ---');
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
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await page.waitForSelector('h1');
        console.log('Provider registered.');

        // 2. EDIT PROFILE
        console.log('--- Step 2: Edit Profile ---');
        // Click "Edit Profile"
        // It might be text inside a button
        await page.waitForSelector('button');
        const btns = await page.$$('button');
        let editBtn;
        for (const btn of btns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Edit Profile')) {
                editBtn = btn;
                break;
            }
        }
        if (!editBtn) throw new Error('Edit Profile button not found');
        await editBtn.click();

        // Fill Form
        await page.waitForSelector('input[placeholder="e.g. John\'s Plumbing"]');
        await page.type('input[placeholder="e.g. John\'s Plumbing"]', displayName);
        await page.type('textarea', bio);

        // Save
        const saveBtns = await page.$$('button');
        for (const btn of saveBtns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Save Profile')) {
                await btn.click();
                break;
            }
        }

        // Wait for simple alert (accept it)
        page.on('dialog', async dialog => {
            console.log('Dialog:', dialog.message());
            await dialog.accept();
        });

        await new Promise(r => setTimeout(r, 2000));
        console.log('Profile saved.');

        // 3. CREATE SERVICE
        console.log('--- Step 3: Create Service ---');
        await page.goto(`${BASE_URL}/create-service`);
        await page.waitForSelector('input');
        const inputs = await page.$$('input');
        await inputs[0].type(`Service by ${displayName}`); // Title
        await page.type('input[type="number"]', '50');
        await page.type('input[placeholder="e.g., New York, NY"]', 'Profile City');
        await page.type('textarea', 'Best service ever.');
        await page.click('button[type="submit"]');
        await new Promise(r => setTimeout(r, 2000));
        console.log('Service Created.');

        // 4. VERIFY PUBLIC PROFILE
        console.log('--- Step 4: Verify Public Profile ---');
        // We can click "View Public Page" from dashboard
        await page.goto(`${BASE_URL}/dashboard`);
        // wait for reload
        await new Promise(r => setTimeout(r, 1000));

        // Find the link
        const links = await page.$$('a');
        let profileLink;
        for (const link of links) {
            const text = await page.evaluate(el => el.textContent, link);
            if (text.includes('View Public Page')) {
                profileLink = link;
                break;
            }
        }
        if (!profileLink) throw new Error('Profile link not found on dashboard');

        await Promise.all([
            page.waitForNavigation(),
            profileLink.click()
        ]);

        console.log('Navigated to profile:', page.url());

        // Wait for loading to finish
        // The profile header is inside a .card
        await page.waitForSelector('.card', { timeout: 10000 });
        // Give it a tiny bit more for text to paint if needed, though selector usually enough for React
        await new Promise(r => setTimeout(r, 1000));

        // Check Content
        const content = await page.content();
        if (content.includes(displayName) && content.includes(bio)) {
            console.log('PASS: Display Name and Bio found!');
        } else {
            console.error('FAIL: Display Name or Bio NOT found.');
            throw new Error('Profile content mismatch');
        }

        if (content.includes(`Service by ${displayName}`)) {
            console.log('PASS: Service listed on profile!');
        } else {
            console.error('FAIL: Service NOT found on profile.');
            throw new Error('Service listing mismatch');
        }

        await page.screenshot({ path: 'profile_test_success.png' });

    } catch (error) {
        console.error('Test Failed:', error);
        fs.writeFileSync('test_profile_error.txt', error.toString());
        await page.screenshot({ path: 'test_profile_fail.png' });
    } finally {
        await browser.close();
    }
}

runTest();
