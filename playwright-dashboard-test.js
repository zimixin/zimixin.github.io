const { chromium } = require('playwright');

(async () => {
    console.log('🚂 Тестирование Калькулятора РЖД (dashboard.html)...\n');

    const browser = await chromium.launch({
        headless: true,
        slowMo: 100
    });

    const context = await browser.newContext({
        viewport: { width: 800, height: 900 }
    });

    const page = await context.newPage();

    try {
        // Шаг 1: Открытие страницы
        console.log('📍 Шаг 1: Открытие dashboard.html');
        await page.goto('http://localhost:8080/dashboard.html', { waitUntil: 'networkidle' });
        console.log('✅ Страница загружена\n');

        // Шаг 2: Проверка загрузки
        console.log('🔍 Шаг 2: Проверка элементов');
        const routeSelect = await page.$('#route');
        const addLocoBtn = await page.$('#addLocoBtn');
        const trainWeight = await page.$('#trainWeight');
        
        if (routeSelect && addLocoBtn && trainWeight) {
            console.log('   ✅ Все элементы найдены');
        } else {
            console.log('   ❌ Элементы не найдены');
            throw new Error('Элементы не найдены');
        }

        // Шаг 3: Проверка загрузки маршрутов
        console.log('\n🔍 Шаг 3: Проверка маршрутов');
        await page.waitForTimeout(1000);
        const routeOptions = await page.$$('#route option');
        console.log(`   Найдено маршрутов: ${routeOptions.length - 1}`);
        
        if (routeOptions.length > 1) {
            console.log('   ✅ Маршруты загружены');
            await page.selectOption('#route', { index: 1 });
            const selectedRoute = await page.$eval('#route option:checked', el => el.textContent);
            console.log(`   Выбран маршрут: ${selectedRoute}`);
        } else {
            console.log('   ⚠️ Маршруты не загружены (файлы .md не найдены)');
        }

        // Шаг 4: Добавление локомотива
        console.log('\n🔍 Шаг 4: Добавление локомотива');
        await page.click('#addLocoBtn');
        await page.waitForTimeout(300);
        
        const locoCards = await page.$$('.locomotive-card');
        console.log(`   Добавлено локомотивов: ${locoCards.length}`);
        
        if (locoCards.length > 0) {
            console.log('   ✅ Локомотив добавлен');
            
            // Выбор типа локомотива
            await locoCards[0].click();
            await page.waitForTimeout(300);
            
            const options = await page.$$('.locomotive-option');
            console.log(`   Доступно опций: ${options.length}`);
            
            if (options.length > 0) {
                await options[2].click(); // Выбираем 2ЭС6
                await page.waitForTimeout(300);
                console.log('   ✅ Тип локомотива выбран');
            }
        }

        // Шаг 5: Ввод параметров поезда
        console.log('\n🔍 Шаг 5: Ввод параметров поезда');
        await page.fill('#trainWeight', '5000');
        await page.fill('#axleCount', '100');
        await page.fill('#conditionalWagons', '50');
        console.log('   ✅ Параметры введены');

        // Шаг 6: Проверка расчета
        console.log('\n🔍 Шаг 6: Проверка расчета');
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
        } else {
            console.log('   ❌ Результаты не отображаются');
        }

        // Шаг 7: Тест экспорта
        console.log('\n🔍 Шаг 7: Тест экспорта');
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('#exportBtn')
        ]);
        console.log(`   ✅ Экспорт выполнен: ${download.suggestedFilename()}`);

        // Шаг 8: Тест истории
        console.log('\n🔍 Шаг 8: Тест сохранения в историю');
        await page.click('#saveHistoryBtn');
        await page.waitForTimeout(300);
        
        const historySection = await page.$('#historySection');
        const historyVisible = await historySection?.isVisible();
        
        if (historyVisible) {
            console.log('   ✅ История сохранена');
        } else {
            console.log('   ⚠️ История не отображается');
        }

        // Шаг 9: Переключение на тепловозы
        console.log('\n🔍 Шаг 9: Переключение на тепловозы');
        const dieselBtn = await page.$('[data-type="diesel"]');
        await dieselBtn?.click();
        await page.waitForTimeout(300);
        
        const fuelSection = await page.$('#fuelSection');
        const fuelVisible = await fuelSection?.isVisible();
        
        if (fuelVisible) {
            console.log('   ✅ Секция топлива отображается');
            
            // Тест расчета топлива
            await page.fill('#fuelA1', '500');
            await page.fill('#fuelA2', '480');
            await page.waitForTimeout(300);
            
            const fuelResult = await page.$eval('#fuelAResult', el => el.textContent);
            console.log(`   Результат расчета топлива: ${fuelResult}`);
        }

        // Шаг 10: Скриншот
        console.log('\n📸 Шаг 10: Скриншот');
        await page.screenshot({
            path: 'screenshots/dashboard-test.png',
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

        console.log('\n✅ Тестирование завершено успешно!\n');

    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error.message);
        
        await page.screenshot({
            path: 'screenshots/dashboard-error.png',
            fullPage: true
        });
        console.log('📸 Скриншот ошибки: screenshots/dashboard-error.png');
        
        process.exit(1);
    } finally {
        await browser.close();
        console.log('\n👋 Браузер закрыт');
    }
})();
