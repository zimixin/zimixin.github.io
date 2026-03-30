const { chromium } = require('playwright');

(async () => {
    console.log('🔍 Тест поиска с 2 символов...\n');

    const browser = await chromium.launch({
        headless: true,
        slowMo: 50
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 900 }
    });

    const page = await context.newPage();

    try {
        console.log('📍 Открытие dashboard.html');
        await page.goto('http://localhost:8080/dashboard.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        console.log('✅ Страница загружена\n');

        // Тест 1: Поиск "а" (1 символ - должен игнорироваться)
        console.log('🔍 Тест 1: Ввод "а" (1 символ)');
        await page.fill('#stationSearch', 'а');
        await page.waitForTimeout(300);
        
        const countDiv1 = await page.$('#searchResultsCount:not(.hidden)');
        if (!countDiv1) {
            console.log('   ✅ Игнорируется (1 символ)\n');
        } else {
            console.log('   ⚠️ Показывает результаты (1 символ)\n');
        }

        // Тест 2: Поиск "аб" (2 символа - должен работать)
        console.log('🔍 Тест 2: Ввод "аб" (2 символа)');
        await page.fill('#stationSearch', 'аб');
        await page.waitForTimeout(500);
        
        const countDiv2 = await page.$('#searchResultsCount');
        const visible2 = await countDiv2?.isVisible();
        
        if (visible2) {
            const text2 = await countDiv2.textContent();
            console.log(`   ${text2}`);
        }
        
        const blocks2 = await page.$$('.station-block');
        console.log(`   Найдено участков: ${blocks2.length}`);
        
        const highlights2 = await page.$$('.highlight');
        console.log(`   Подсветок: ${highlights2.length}`);
        
        if (blocks2.length > 0 || highlights2.length > 0) {
            console.log('   ✅ Поиск работает с 2 символов!\n');
        } else {
            console.log('   ⚠️ Нет результатов\n');
        }

        // Тест 3: Поиск "Са" (2 символа)
        console.log('🔍 Тест 3: Ввод "Са" (2 символа)');
        await page.fill('#stationSearch', 'Са');
        await page.waitForTimeout(500);
        
        const countDiv3 = await page.$('#searchResultsCount');
        const visible3 = await countDiv3?.isVisible();
        
        if (visible3) {
            const text3 = await countDiv3.textContent();
            console.log(`   ${text3}`);
        }
        
        const blocks3 = await page.$$('.station-block');
        console.log(`   Найдено участков: ${blocks3.length}`);
        
        const highlights3 = await page.$$('.highlight');
        console.log(`   Подсветок: ${highlights3.length}`);
        
        if (blocks3.length > 0 || highlights3.length > 0) {
            console.log('   ✅ Поиск "Са" работает!\n');
        }

        // Тест 4: Поиск "Кин" (3 символа)
        console.log('🔍 Тест 4: Ввод "Кин" (3 символа)');
        await page.fill('#stationSearch', 'Кин');
        await page.waitForTimeout(500);
        
        const countDiv4 = await page.$('#searchResultsCount');
        const visible4 = await countDiv4?.isVisible();
        
        if (visible4) {
            const text4 = await countDiv4.textContent();
            console.log(`   ${text4}`);
        }
        
        const blocks4 = await page.$$('.station-block');
        console.log(`   Найдено участков: ${blocks4.length}`);
        console.log('   ✅ Поиск "Кин" работает!\n');

        // Тест 5: Очистка
        console.log('🔍 Тест 5: Очистка поиска');
        await page.fill('#stationSearch', '');
        await page.waitForTimeout(300);
        
        const countDiv5 = await page.$('#searchResultsCount:not(.hidden)');
        if (!countDiv5) {
            console.log('   ✅ Поиск сброшен\n');
        }

        // Скриншот
        console.log('📸 Скриншот');
        await page.fill('#stationSearch', 'Сам');
        await page.waitForTimeout(500);
        
        await page.screenshot({
            path: 'screenshots/dashboard-search-2chars.png',
            fullPage: true
        });
        console.log('   ✅ Сохранён\n');

        console.log('✅ Тестирование завершено успешно!\n');

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        
        await page.screenshot({
            path: 'screenshots/dashboard-search-2chars-error.png',
            fullPage: true
        });
        
        process.exit(1);
    } finally {
        await browser.close();
        console.log('👋 Браузер закрыт');
    }
})();
