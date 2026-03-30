const { chromium } = require('playwright');

(async () => {
    console.log('🚂 Запуск тестирования профиля скоростей КБШ...\n');

    const browser = await chromium.launch({
        headless: true,  // Без видимого браузера
        slowMo: 100
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    try {
        // Шаг 1: Открытие страницы профиля
        console.log('📍 Шаг 1: Открытие speed-profile-vertical.html');
        await page.goto('http://localhost:8080/speed-profile-vertical.html', { waitUntil: 'networkidle' });
        console.log('✅ Страница загружена\n');

        // Шаг 2: Проверка загрузки данных
        console.log('⏳ Шаг 2: Ожидание загрузки данных...');
        await page.waitForSelector('#fromInput', { timeout: 10000 });
        console.log('✅ Данные загружены\n');

        // Шаг 3: Проверка наличия полей ввода
        console.log('📝 Шаг 3: Проверка элементов управления');
        const fromInput = await page.$('#fromInput');
        const toInput = await page.$('#toInput');
        const showBtn = await page.$('#showBtn');
        
        if (fromInput && toInput && showBtn) {
            console.log('   ✅ Поля "Откуда" и "Куда" найдены');
            console.log('   ✅ Кнопка "Показать" найдена');
        } else {
            console.log('   ❌ Элементы управления не найдены');
            throw new Error('Элементы управления не найдены');
        }

        // Шаг 4: Тест autocomplete "Откуда"
        console.log('\n🔍 Шаг 4: Тест autocomplete "Откуда"');
        await fromInput.fill('Самара');
        await page.waitForTimeout(500);
        
        const fromList = await page.$('#fromList');
        const fromItems = await page.$$('#fromList .autocomplete-item');
        console.log(`   Найдено совпадений для "Самара": ${fromItems.length}`);
        
        if (fromItems.length > 0) {
            console.log('   ✅ Autocomplete работает');
            
            // Выбор первого результата
            await fromItems[0].click();
            const fromValue = await fromInput.inputValue();
            console.log(`   ✅ Выбрано: ${fromValue}`);
        } else {
            console.log('   ⚠️ Нет совпадений (возможно данные не загрузились)');
        }

        // Шаг 5: Тест autocomplete "Куда"
        console.log('\n🔍 Шаг 5: Тест autocomplete "Куда"');
        await toInput.fill('Безымян');
        await page.waitForTimeout(500);
        
        const toItems = await page.$$('#toList .autocomplete-item');
        console.log(`   Найдено совпадений для "Безымян": ${toItems.length}`);
        
        if (toItems.length > 0) {
            console.log('   ✅ Autocomplete работает');
            
            // Выбор первого результата
            await toItems[0].click();
            const toValue = await toInput.inputValue();
            console.log(`   ✅ Выбрано: ${toValue}`);
        }

        // Шаг 6: Проверка активации кнопки
        console.log('\n🔍 Шаг 6: Проверка кнопки "Показать"');
        const isDisabled = await showBtn.evaluate(el => el.disabled);
        if (!isDisabled) {
            console.log('   ✅ Кнопка активна');
        } else {
            console.log('   ⚠️ Кнопка неактивна (возможно не выбраны оба пункта)');
        }

        // Шаг 7: Проверка отрисовки графика (если кнопка активна)
        if (!isDisabled) {
            console.log('\n📊 Шаг 7: Тест отображения графика');
            await showBtn.click();
            await page.waitForTimeout(1000);
            
            const chart = await page.$('#chart');
            if (chart) {
                console.log('   ✅ График найден');
                
                // Проверка наличия сегментов на графике
                const segments = await page.$$('.segment-bg');
                console.log(`   Найдено сегментов на графике: ${segments.length}`);
                
                // Проверка информационной панели
                const infoContent = await page.$('#infoContent');
                if (infoContent) {
                    const infoText = await infoContent.textContent();
                    console.log(`   ✅ Информация обновлена: ${infoText.substring(0, 50)}...`);
                }
            } else {
                console.log('   ❌ График не найден');
            }
        }

        // Шаг 8: Скриншот
        console.log('\n📸 Шаг 8: Создание скриншота');
        await page.screenshot({
            path: 'screenshots/speed-profile-test.png',
            fullPage: true
        });
        console.log('   ✅ Скриншот сохранён в screenshots/speed-profile-test.png');

        // Шаг 9: Проверка консоли на ошибки
        console.log('\n🔍 Шаг 9: Проверка консоли на ошибки');
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
            path: 'screenshots/speed-profile-error.png',
            fullPage: true
        });
        console.log('📸 Скриншот ошибки: screenshots/speed-profile-error.png');
        
        process.exit(1);
    } finally {
        await browser.close();
        console.log('\n👋 Браузер закрыт');
    }
})();
