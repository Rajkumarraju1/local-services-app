
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
        console.log('Starting Chat Test...');
        const timestamp = Date.now();
        const providerEmail = `chat_prov_${timestamp}@test.com`;
        const customerEmail = `chat_cust_${timestamp}@test.com`;
        const serviceTitle = `Chat Service ${timestamp}`;
        const chatMessage = `Hello from customer ${timestamp}`;

        // 1. PROVIDER REGISTER & CREATE SERVICE
        console.log('--- Step 1: Provider Setup ---');
        await page.goto(`${BASE_URL}/register`);
        await page.waitForSelector('input[type="email"]'); // Initial load

        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Work')) await btn.click();
        }
        await new Promise(r => setTimeout(r, 500));

        await page.type('input[type="email"]', providerEmail);
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForSelector('h1');

        await page.goto(`${BASE_URL}/create-service`);
        await page.waitForSelector('input');
        const inputs = await page.$$('input');
        await inputs[0].type(serviceTitle);
        await page.type('input[type="number"]', '50');
        await page.type('input[placeholder="e.g., New York, NY"]', 'Chat City');
        await page.type('textarea', 'Chat ready.');
        await page.click('button[type="submit"]');
        await new Promise(r => setTimeout(r, 2000));
        console.log('Provider readiness complete.');

        // Logout
        await page.evaluate(() => localStorage.clear());
        await page.goto(`${BASE_URL}/login`);

        // 2. CUSTOMER REGISTER & BOOK
        console.log('--- Step 2: Customer Booking ---');
        await page.goto(`${BASE_URL}/register`);
        await page.waitForSelector('input[type="email"]');
        // Default is Hire
        await page.type('input[type="email"]', customerEmail);
        await page.type('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForSelector('h1');

        await page.goto(`${BASE_URL}/services`);
        await page.waitForSelector('.card');

        // Find our service (it should be first or we filter)
        // Let's filter to be safe
        await page.type('input[placeholder="Search keywords..."]', serviceTitle);
        await new Promise(r => setTimeout(r, 1000));

        const bookBtns = await page.$$('button');
        let bookBtn;
        for (const btn of bookBtns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Book')) {
                bookBtn = btn;
                break; // Just click the first one found which should be ours due to search
            }
        }
        if (!bookBtn) throw new Error('Book button not found');
        await bookBtn.click();

        // Confirm Booking
        await page.waitForSelector('textarea'); // Notes
        await page.type('textarea', 'Test booking notes for chat');

        // Date input type="datetime-local"
        // Puppeteer typing into date inputs can be tricky, easier to set value via eval if simple type fails
        // But let's try type first with a formatted string or just tab key.
        // A safe bet for datetime-local in puppeteer is string format "mmddyyyy""tab""hhmm" etc
        // Or setting value directly.
        await page.evaluate(() => {
            const now = new Date();
            now.setDate(now.getDate() + 1); // Tomorrow
            const localIso = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
            document.querySelector('input[type="datetime-local"]').value = localIso;
            // React state update might need event dispatch
            document.querySelector('input[type="datetime-local"]').dispatchEvent(new Event('input', { bubbles: true }));
        });

        await new Promise(r => setTimeout(r, 500));
        const confirmBtns = await page.$$('button');
        for (const btn of confirmBtns) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Confirm')) await btn.click();
        }

        // Wait for URL change or Success Alert
        // Our app currently shows alert('Booking successful!'); which Puppeteer handles via dialog event?
        // Or redirects? Let's check ServiceCard.jsx or Book service.
        // Actually, verify dashboard has the booking is the best check.

        await new Promise(r => setTimeout(r, 2000));
        console.log('Booking step done.');

        // 3. CHAT FLOW
        console.log('--- Step 3: Chatting ---');
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForSelector('table');

        // Find Chat Button (💬)
        // It might be 💬 or text, we used emoji in code
        await new Promise(r => setTimeout(r, 1000));

        // Look for buttons with title="Chat"
        const chatBtn = await page.$('button[title="Chat"]');
        if (!chatBtn) throw new Error('Chat button not found on dashboard');

        await chatBtn.click();
        await page.waitForSelector('input[placeholder="Type a message..."]');

        // Send Message
        await page.type('input[placeholder="Type a message..."]', chatMessage);
        await page.click('button[type="submit"]'); // arrow button

        // Wait for message to appear in the DOM
        try {
            // XPath to find text content? Or just wait for selector if we had a specific class?
            // Since we know the text, let's wait for it.
            await page.waitForFunction(
                (text) => document.body.innerText.includes(text),
                { timeout: 5000 },
                chatMessage
            );
            console.log('PASS: Message sent and displayed.');
        } catch (e) {
            console.error('FAIL: Message not found in chat window.');
            const content = await page.content();
            console.log('Current Page Content Length:', content.length);
            throw new Error('Message sending failed or timed out');
        }

        await page.screenshot({ path: 'chat_test_success.png' });

    } catch (error) {
        console.error('Test Failed:', error);
        console.log('\n--- HEADLESS BROWSER LOGS ---');
        logs.forEach(l => console.log(l));
        console.log('-----------------------------\n');

        fs.writeFileSync('test_chat_error.txt', error.toString());
        await page.screenshot({ path: 'test_chat_fail.png' });
    } finally {
        await browser.close();
    }
}

runTest();
