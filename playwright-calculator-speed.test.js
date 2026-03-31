/**
 * Playwright тест для калькулятора РЖД + карта скоростей
 * Проверяет работу обеих функций на одной странице index.html
 */

const { test, expect } = require('@playwright/test');

test.describe('Калькулятор РЖД + Карта скоростей', () => {
    test('загрузка страницы и проверка основных элементов', async ({ page }) => {
        await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle' });
        await expect(page.locator('h1')).toContainText('КМБУ-ИД');
        await expect(page.locator('#profileCanvas')).toBeVisible();
        await expect(page.locator('.calculator-panel')).toBeVisible();
    });

    test('выбор участка карты скоростей', async ({ page }) => {
        await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        const sectionSelect = page.locator('#section-select');
        await expect(sectionSelect).toBeVisible();
        const options = await sectionSelect.locator('option').count();
        console.log(`Найдено участков: ${options - 1}`);
        expect(options).toBeGreaterThan(1);
    });

    test('калькулятор - выбор маршрута', async ({ page }) => {
        await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        const routeSelect = page.locator('#route');
        await expect(routeSelect).toBeVisible();
        const options = await routeSelect.locator('option').count();
        console.log(`Найдено маршрутов: ${options - 1}`);
        expect(options).toBeGreaterThan(1);
        await routeSelect.selectOption({ index: 1 });
        const routeInfo = page.locator('#routeInfo');
        await expect(routeInfo).toBeVisible();
    });

    test('калькулятор - выбор локомотива', async ({ page }) => {
        await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        const electricBtn = page.locator('.traction-btn[data-type="electric"]');
        await expect(electricBtn).toBeVisible();
        const dieselBtn = page.locator('.traction-btn[data-type="diesel"]');
        await expect(dieselBtn).toBeVisible();
        const locoContainer = page.locator('#locomotiveContainer');
        await expect(locoContainer).toBeVisible();
    });

    test('калькулятор - ввод параметров и расчет', async ({ page }) => {
        await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await page.selectOption('#route', { index: 1 });
        await page.waitForTimeout(500);
        await page.fill('#trainWeight', '5000');
        await page.fill('#axleCount', '100');
        await page.fill('#actualWagons', '50');
        await page.fill('#conditionalWagons', '50');
        await page.waitForTimeout(1000);
        const consumptionResult = page.locator('#consumptionResult');
        await expect(consumptionResult).toBeVisible();
        const consumptionValue = await consumptionResult.textContent();
        console.log(`Норма расхода: ${consumptionValue}`);
        expect(consumptionValue).not.toBe('0');
        expect(consumptionValue).toContain('кВт');
    });

    test('калькулятор - переключение на тепловозы', async ({ page }) => {
        await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        const dieselBtn = page.locator('.traction-btn[data-type="diesel"]');
        await dieselBtn.click();
        await page.waitForTimeout(500);
        const fuelSection = page.locator('#fuelSection');
        await expect(fuelSection).toBeVisible();
    });

    test('карта скоростей - переключение типов скоростей', async ({ page }) => {
        await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        const passengerCheckbox = page.locator('input[name="speed-type"][value="пассажирские"]');
        await expect(passengerCheckbox).toBeChecked();
        const cargoCheckbox = page.locator('input[name="speed-type"][value="грузовые"]');
        await expect(cargoCheckbox).toBeChecked();
    });

    test('карта скоростей - проверка отображения всех путей', async ({ page }) => {
        await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        await page.selectOption('#section-select', { index: 1 });
        await page.waitForTimeout(2000);
        const pathCheckboxes = page.locator('input[name="path-type"]');
        const count = await pathCheckboxes.count();
        console.log(`Найдено путей: ${count}`);
        expect(count).toBeGreaterThan(0);
        const checkedCount = await page.locator('input[name="path-type"]:checked').count();
        console.log(`Выбрано путей: ${checkedCount}`);
        expect(checkedCount).toBe(count);
    });

    test('карта скоростей - проверка переключения путей', async ({ page }) => {
        await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        await page.selectOption('#section-select', { index: 1 });
        await page.waitForTimeout(2000);
        const pathCheckboxes = page.locator('input[name="path-type"]');
        const count = await pathCheckboxes.count();
        if (count > 1) {
            const lastCheckbox = pathCheckboxes.nth(count - 1);
            await lastCheckbox.click();
            await page.waitForTimeout(500);
            expect(await lastCheckbox.isChecked()).toBeFalsy();
            await lastCheckbox.click();
            await page.waitForTimeout(500);
            expect(await lastCheckbox.isChecked()).toBeTruthy();
        }
    });

    test('отсутствие ошибок в консоли', async ({ page }) => {
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        expect(consoleErrors).toHaveLength(0);
    });
});
