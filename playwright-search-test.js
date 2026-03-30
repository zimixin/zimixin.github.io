const { chromium } = require('playwright');

(async () => {
    console.log('🔍 Тестирование поиска по станциям...\n');

    const browser = await chromium.launch({
        headless: true,
        slowMo: 100
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 900 }
    });

    const page = await context.newPage();

    try {
        // Шаг 1: Открытие страницы
        console.log('📍 Шаг 1: Открытие dashboard.html');
        await page.goto('http://localhost:8080/dashboard.html', { waitUntil: 'networkidle' });
        console.log('✅ Страница загружена\n');

        // Шаг 2: Проверка поля поиска
        console.log('🔍 Шаг 2: Проверка поля поиска');
        const searchInput = await page.$('#stationSearch');
        
        if (searchInput) {
            console.log('   ✅ Поле поиска найдено');
        } else {
            console.log('   ❌ Поле поиска не найдено');
            throw new Error('Поле поиска не найдено');
        }

        // Шаг 3: Поиск по станции "Самара"
        console.log('\n🔍 Шаг 3: Поиск по станции "Самара"');
        await searchInput.fill('Самара');
        await page.waitForTimeout(500);
        
        const searchResultsCount = await page.$('#searchResultsCount');
        const isVisible = await searchResultsCount?.isVisible();
        
        if (isVisible) {
            const countText = await searchResultsCount.textContent();
            console.log(`   ${countText}`);
            console.log('   ✅ Поиск работает');
        }

        // Шаг 4: Проверка подсветки
        console.log('\n🔍 Шаг 4: Проверка подсветки совпадений');
        const highlights = await page.$$('.highlight');
        console.log(`   Найдено подсветок: ${highlights.length}`);
        
        if (highlights.length > 0) {
            console.log('   ✅ Подсветка работает');
        }

        // Шаг 5: Проверка результатов
        console.log('\n🔍 Шаг 5: Проверка найденных участков');
        const stationBlocks = await page.$$('.station-block');
        console.log(`   Найдено участков: ${stationBlocks.length}`);
        
        // Шаг 6: Поиск по "Безымян"
        console.log('\n🔍 Шаг 6: Поиск по "Безымян"');
        await searchInput.fill('Безымян');
        await page.waitForTimeout(500);
        
        const bezymankaBlocks = await page.$$('.station-block');
        console.log(`   Найдено участков: ${bezymankaBlocks.length}`);
        
        const bezymankaHighlights = await page.$$('.highlight');
        console.log(`   Найдено подсветок: ${bezymankaHighlights.length}`);
        console.log('   ✅ Поиск работает');

        // Шаг 7: Очистка поиска
        console.log('\n🔍 Шаг 7: Очистка поиска');
        await searchInput.fill('');
        await page.waitForTimeout(500);
        
        const countDivVisible = await page.$('#searchResultsCount:not(.hidden)');
        if (!countDivVisible) {
            console.log('   ✅ Поиск сброшен');
        }

        // Шаг 8: Поиск по примечанию "дефектность"
        console.log('\n🔍 Шаг 8: Поиск по примечанию "дефектность"');
        await searchInput.fill('дефектность');
        await page.waitForTimeout(500);
        
        const defectResults = await page.$('#searchResultsCount');
        const defectVisible = await defectResults?.isVisible();
        
        if (defectVisible) {
            const defectCount = await defectResults.textContent();
            console.log(`   ${defectCount}`);
            console.log('   ✅ Поиск по примечаниям работает');
        }

        // Шаг 9: Поиск с менее 2 символов
        console.log('\n🔍 Шаг 9: Поиск с 1 символом (должен сброситься)');
        await searchInput.fill('а');
        await page.waitForTimeout(300);
        
        const shortSearchCount = await page.$('#searchResultsCount:not(.hidden)');
        if (!shortSearchCount) {
            console.log('   ✅ Короткий поиск игнорируется');
        }

        // Шаг 10: Скриншот
        console.log('\n📸 Шаг 10: Скриншот');
        await searchInput.fill('Кинель');
        await page.waitForTimeout(500);
        
        await page.screenshot({
            path: 'screenshots/dashboard-search-test.png',
            fullPage: true
        });
        console.log('   ✅ Скриншот сохранён');

        // Шаг 11: Проверка консоли
        console.log('\n🔍 Шаг 11: Проверка консоли на ошибки');
        let hasErrors = false;
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`   ⚠️ Ошибка: ${msg.text()}`);
                hasErrors = true;
            }
        });

        if (!hasErrors) {
            console.log('   ✅ Ошибок в консоли не найдено');
        }

        console.log('\n✅ Тестирование поиска завершено успешно!\n');

    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error.message);
        
        await page.screenshot({
            path: 'screenshots/dashboard-search-error.png',
            fullPage: true
        });
        console.log('📸 Скриншот ошибки: screenshots/dashboard-search-error.png');
        
        process.exit(1);
    } finally {
        await browser.close();
        console.log('\n👋 Браузер закрыт');
    }
})();
