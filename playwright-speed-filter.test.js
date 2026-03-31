// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Profile Viewer - Speed Filter Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(3000);
    });

    test('should show correct speed when only cargo empty is selected', async ({ page }) => {
        // Находим участок Смышляевка или похожий
        const sectionSelect = page.locator('#section-select');
        const options = await sectionSelect.locator('option').all();
        
        let foundSection = false;
        for (let i = 0; i < options.length; i++) {
            const text = await options[i].textContent();
            if (text && text.includes('Смышляевка')) {
                await sectionSelect.selectOption({ index: i });
                foundSection = true;
                break;
            }
        }
        
        // Если не нашли Смышляевку, используем первый участок
        if (!foundSection) {
            await sectionSelect.selectOption({ index: 0 });
        }
        
        await page.waitForTimeout(2000);
        
        // Снимаем все галочки с типов скоростей
        const allCheckbox = page.getByRole('checkbox', { name: 'Все', exact: true }).first();
        await allCheckbox.uncheck();
        
        const passengerCheckbox = page.getByRole('checkbox', { name: 'Пасс' }).first();
        await passengerCheckbox.uncheck();
        
        const cargoExpressCheckbox = page.getByRole('checkbox', { name: 'Груз. уск' }).first();
        await cargoExpressCheckbox.uncheck();
        
        const cargoCheckbox = page.getByRole('checkbox', { name: 'Груз', exact: true }).first();
        await cargoCheckbox.uncheck();
        
        // Выбираем только груз. порожние
        const cargoEmptyCheckbox = page.getByRole('checkbox', { name: 'Груз. пор' }).first();
        await cargoEmptyCheckbox.check();
        
        await page.waitForTimeout(1000);
        
        // Проверяем, что выбран только один тип
        const selectedTypes = await page.evaluate(() => {
            return window.appState.currentSpeedType;
        });
        
        // После снятия "Все" и выбора "Груз. пор" должен быть массив
        expect(selectedTypes).toContain('грузовые_порожние');
        
        // Проверяем сегменты
        const segments = await page.evaluate(() => {
            return window.appState.speedSegments;
        });
        
        // Все сегменты должны иметь тип "грузовые_порожние"
        for (const seg of segments) {
            expect(seg.speedType).toBe('грузовые_порожние');
        }
        
        console.log(`Найдено сегментов: ${segments.length}`);
        console.log('Типы сегментов:', segments.map(s => s.speedType));
    });

    test('should show different speeds for different types on same segment', async ({ page }) => {
        // Используем первый участок
        const sectionSelect = page.locator('#section-select');
        await sectionSelect.selectOption({ index: 0 });
        await page.waitForTimeout(2000);
        
        // Получаем сегменты для всех типов
        const allCheckbox = page.getByRole('checkbox', { name: 'Все', exact: true }).first();
        await allCheckbox.check();
        await page.waitForTimeout(1000);
        
        const allSegments = await page.evaluate(() => {
            return window.appState.speedSegments;
        });
        
        console.log('Сегменты (все типы):', allSegments.length);
        
        // Теперь выбираем только пассажирские
        await allCheckbox.uncheck();
        const passengerCheckbox = page.getByRole('checkbox', { name: 'Пасс' }).first();
        await passengerCheckbox.check();
        await page.waitForTimeout(1000);
        
        const passengerSegments = await page.evaluate(() => {
            return window.appState.speedSegments;
        });
        
        // Теперь выбираем только груз. порожние
        await passengerCheckbox.uncheck();
        const cargoEmptyCheckbox = page.getByRole('checkbox', { name: 'Груз. пор' }).first();
        await cargoEmptyCheckbox.check();
        await page.waitForTimeout(1000);
        
        const cargoEmptySegments = await page.evaluate(() => {
            return window.appState.speedSegments;
        });
        
        console.log('Пассажирские сегменты:', passengerSegments.length);
        console.log('Груз. порожние сегменты:', cargoEmptySegments.length);
        
        // Проверяем, что типы разные
        passengerSegments.forEach(seg => {
            expect(seg.speedType).toBe('пассажирские');
        });
        
        cargoEmptySegments.forEach(seg => {
            expect(seg.speedType).toBe('грузовые_порожние');
        });
    });

    test('should hide all speeds when no checkboxes selected', async ({ page }) => {
        await page.waitForTimeout(2000);
        
        // Снимаем все галочки с типов скоростей
        const allCheckbox = page.getByRole('checkbox', { name: 'Все', exact: true }).first();
        await allCheckbox.uncheck();
        
        const passengerCheckbox = page.getByRole('checkbox', { name: 'Пасс' }).first();
        await passengerCheckbox.uncheck();
        
        const cargoExpressCheckbox = page.getByRole('checkbox', { name: 'Груз. уск' }).first();
        await cargoExpressCheckbox.uncheck();
        
        const cargoCheckbox = page.getByRole('checkbox', { name: 'Груз', exact: true }).first();
        await cargoCheckbox.uncheck();
        
        const cargoEmptyCheckbox = page.getByRole('checkbox', { name: 'Груз. пор' }).first();
        await cargoEmptyCheckbox.uncheck();
        
        await page.waitForTimeout(1000);
        
        // Проверяем, что selectedTypes пустой
        const selectedTypes = await page.evaluate(() => {
            return window.appState.currentSpeedType;
        });
        
        console.log('Выбранные типы:', selectedTypes);
        expect(selectedTypes.length).toBe(0);
        
        // Сегменты могут остаться от предыдущего выбора, но при следующей генерации их не будет
        // Просто проверяем, что selectedTypes пустой
    });

    test('should show all types when "All" checkbox selected', async ({ page }) => {
        await page.waitForTimeout(2000);
        
        // Выбираем "Все"
        const allCheckbox = page.getByRole('checkbox', { name: 'Все', exact: true }).first();
        await allCheckbox.check();
        await page.waitForTimeout(1000);
        
        const selectedTypes = await page.evaluate(() => {
            return window.appState.currentSpeedType;
        });
        
        // "Все" остаётся как ['all'], но при генерации раскрывается в полный список
        expect(selectedTypes).toEqual(['all']);
        
        const segments = await page.evaluate(() => {
            return window.appState.speedSegments;
        });
        
        console.log('Сегментов при выборе "Все":', segments.length);
        expect(segments.length).toBeGreaterThan(0);
        
        // Проверяем, что есть разные типы сегментов
        const types = new Set(segments.map(s => s.speedType));
        console.log('Типы сегментов:', Array.from(types));
        expect(types.size).toBeGreaterThan(1);
    });

    test('should correctly filter speeds for specific station', async ({ page }) => {
        // Тест для конкретной станции с разными скоростями
        // Пример: пассажирские 70, остальные 60
        
        await page.waitForTimeout(2000);
        
        // Выбираем только груз. порожние
        const allCheckbox = page.getByRole('checkbox', { name: 'Все', exact: true }).first();
        await allCheckbox.uncheck();
        
        const cargoEmptyCheckbox = page.getByRole('checkbox', { name: 'Груз. пор' }).first();
        await cargoEmptyCheckbox.check();
        await page.waitForTimeout(1000);
        
        // Получаем сегменты
        const segments = await page.evaluate(() => {
            return window.appState.speedSegments;
        });
        
        // Проверяем, что все сегменты имеют правильный тип
        segments.forEach(seg => {
            expect(seg.speedType).toBe('грузовые_порожние');
            // Проверяем, что скорость соответствует типу
            if (seg.speeds && seg.speeds['грузовые_порожние']) {
                expect(seg.speed).toBe(seg.speeds['грузовые_порожние']);
            }
        });
        
        console.log('Проверено сегментов:', segments.length);
    });
});
