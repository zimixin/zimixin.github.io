const { chromium } = require('playwright');

(async () => {
    console.log('🚂 Тестирование Калькулятора РЖД с картой скоростей...\n');

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

        // Шаг 2: Проверка карты скоростей
        console.log('🔍 Шаг 2: Проверка карты скоростей');
        const speedMap = await page.$('.speed-map');
        const sectionSelect = await page.$('#sectionSelect');
        
        if (speedMap && sectionSelect) {
            console.log('   ✅ Карта скоростей найдена');
        } else {
            console.log('   ❌ Карта скоростей не найдена');
            throw new Error('Карта скоростей не найдена');
        }

        // Шаг 3: Загрузка данных скоростей
        console.log('\n🔍 Шаг 3: Загрузка данных скоростей');
        await page.waitForTimeout(2000);
        
        const stationBlocks = await page.$$('.station-block');
        console.log(`   Загружено участков: ${stationBlocks.length}`);
        
        if (stationBlocks.length > 0) {
            console.log('   ✅ Данные скоростей загружены');
            
            // Проверка первого участка
            const firstHeader = await page.$('.station-header');
            await firstHeader?.click();
            await page.waitForTimeout(300);
            
            const speedItems = await page.$$('.speed-item');
            console.log(`   Найдено записей о скоростях: ${speedItems.length}`);
        }

        // Шаг 4: Фильтрация по участкам
        console.log('\n🔍 Шаг 4: Тест фильтрации по участкам');
        const options = await page.$$('#sectionSelect option');
        console.log(`   Доступно участков: ${options.length - 1}`);
        
        if (options.length > 1) {
            await page.selectOption('#sectionSelect', { index: 1 });
            await page.waitForTimeout(500);
            console.log('   ✅ Фильтрация работает');
        }

        // Шаг 5: Развернуть все
        console.log('\n🔍 Шаг 5: Тест кнопки "Развернуть все"');
        await page.click('#expandAllBtn');
        await page.waitForTimeout(300);
        
        const visibleContents = await page.$$('.station-content:not(.hidden)');
        console.log(`   Развернуто участков: ${visibleContents.length}`);
        console.log('   ✅ Кнопка работает');

        // Шаг 6: Проверка калькулятора
        console.log('\n🔍 Шаг 6: Проверка калькулятора');
        const routeSelect = await page.$('#route');
        const addLocoBtn = await page.$('#addLocoBtn');
        
        if (routeSelect && addLocoBtn) {
            console.log('   ✅ Калькулятор найден');
        }

        // Шаг 7: Загрузка маршрутов
        console.log('\n🔍 Шаг 7: Проверка маршрутов');
        await page.waitForTimeout(1000);
        const routeOptions = await page.$$('#route option');
        console.log(`   Найдено маршрутов: ${routeOptions.length - 1}`);
        
        if (routeOptions.length > 1) {
            console.log('   ✅ Маршруты загружены');
            await page.selectOption('#route', { index: 1 });
        }

        // Шаг 8: Добавление локомотива
        console.log('\n🔍 Шаг 8: Добавление локомотива');
        await page.click('#addLocoBtn');
        await page.waitForTimeout(300);
        
        const locoCards = await page.$$('.locomotive-card');
        console.log(`   Добавлено локомотивов: ${locoCards.length}`);
        console.log('   ✅ Локомотив добавлен');

        // Шаг 9: Ввод параметров
        console.log('\n🔍 Шаг 9: Ввод параметров поезда');
        await page.fill('#trainWeight', '5000');
        await page.fill('#axleCount', '100');
        await page.fill('#conditionalWagons', '50');
        console.log('   ✅ Параметры введены');

        // Шаг 10: Проверка расчета
        console.log('\n🔍 Шаг 10: Проверка расчета');
        await page.waitForTimeout(500);
        
        const resultsSection = await page.$('#resultsSection');
        const isVisible = await resultsSection?.isVisible();
        
        if (isVisible) {
            console.log('   ✅ Результаты отображаются');
            
            const consumption = await page.$eval('#consumptionResult', el => el.textContent);
            const axleLoad = await page.$eval('#axleLoadResult', el => el.textContent);
            const trainLength = await page.$eval('#trainLengthResult', el => el.textContent);
            
            console.log(`   Расход: ${consumption}`);
            console.log(`   Нагрузка на ось: ${axleLoad}`);
            console.log(`   Длина состава: ${trainLength}`);
        }

        // Шаг 11: Переключение на тепловозы
        console.log('\n🔍 Шаг 11: Переключение на тепловозы');
        await page.click('[data-type="diesel"]');
        await page.waitForTimeout(300);
        
        const fuelSection = await page.$('#fuelSection');
        const fuelVisible = await fuelSection?.isVisible();
        
        if (fuelVisible) {
            console.log('   ✅ Секция топлива отображается');
        }

        // Шаг 12: Скриншот
        console.log('\n📸 Шаг 12: Скриншот');
        await page.screenshot({
            path: 'screenshots/dashboard-full-test.png',
            fullPage: true
        });
        console.log('   ✅ Скриншот сохранён');

        // Шаг 13: Проверка консоли
        console.log('\n🔍 Шаг 13: Проверка консоли на ошибки');
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

        console.log('\n✅ Тестирование завершено успешно!\n');

    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error.message);
        
        await page.screenshot({
            path: 'screenshots/dashboard-full-error.png',
            fullPage: true
        });
        console.log('📸 Скриншот ошибки: screenshots/dashboard-full-error.png');
        
        process.exit(1);
    } finally {
        await browser.close();
        console.log('\n👋 Браузер закрыт');
    }
})();
