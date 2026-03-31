// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Profile Viewer - Speed Display', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        // Ждём загрузки данных
        await page.waitForTimeout(3000);
    });

    test('should load page successfully', async ({ page }) => {
        await expect(page).toHaveTitle(/Профиль Пути - КМБУ/);
        
        // Check if canvas is loaded
        const canvas = page.locator('#profileCanvas');
        await expect(canvas).toBeVisible();
        
        // Check if station name is loaded (not "Загрузка...")
        const stationDisplay = page.locator('#station-display');
        const text = await stationDisplay.textContent();
        expect(text).not.toContain('Загрузка');
    });

    test('should display speed type selector', async ({ page }) => {
        // Check if all radio buttons are present
        const passengerRadio = page.locator('input[value="пассажирские"]');
        await expect(passengerRadio).toBeVisible();
        
        const cargoExpressRadio = page.locator('input[value="грузовые_ускоренные"]');
        await expect(cargoExpressRadio).toBeVisible();
        
        const cargoRadio = page.locator('input[value="грузовые"]');
        await expect(cargoRadio).toBeVisible();
        
        const cargoEmptyRadio = page.locator('input[value="грузовые_порожние"]');
        await expect(cargoEmptyRadio).toBeVisible();
    });

    test('should change speed type when selecting different radio button', async ({ page }) => {
        // Click on cargo express radio
        const cargoExpressRadio = page.locator('input[value="грузовые_ускоренные"]');
        await cargoExpressRadio.click();
        await expect(cargoExpressRadio).toBeChecked();
        await page.waitForTimeout(500);
        
        // Click on cargo radio
        const cargoRadio = page.locator('input[value="грузовые"]');
        await cargoRadio.click();
        await expect(cargoRadio).toBeChecked();
    });

    test('should display info panel with position data', async ({ page }) => {
        const posValue = page.locator('#pos-value');
        const text = await posValue.textContent();
        expect(text).not.toContain('--');
        
        const zoomValue = page.locator('#zoom-value');
        const zoomText = await zoomValue.textContent();
        expect(zoomText).not.toContain('--');
    });

    test('should zoom in when clicking + button', async ({ page }) => {
        const zoomValue = page.locator('#zoom-value');
        const initialZoom = await zoomValue.textContent();
        const initialZoomNum = parseInt(initialZoom) || 100;
        
        const zoomInButton = page.locator('button:has-text("+")');
        await zoomInButton.click();
        await page.waitForTimeout(500);
        
        const newZoom = await zoomValue.textContent();
        const newZoomNum = parseInt(newZoom) || 0;
        expect(newZoomNum).toBeGreaterThan(initialZoomNum);
    });

    test('should zoom out when clicking - button', async ({ page }) => {
        const zoomOutButton = page.locator('button:has-text("−")');
        await zoomOutButton.click();
        await page.waitForTimeout(500);
        
        const zoomValue = page.locator('#zoom-value');
        const zoomText = await zoomValue.textContent();
        const zoomNum = parseInt(zoomText) || 100;
        expect(zoomNum).toBeLessThan(100);
    });

    test('should reset view when clicking reset button', async ({ page }) => {
        // First zoom in
        const zoomInButton = page.locator('button:has-text("+")');
        await zoomInButton.click();
        await page.waitForTimeout(500);
        
        // Then reset
        const resetButton = page.locator('button:has-text("Сброс")');
        await resetButton.click();
        await page.waitForTimeout(500);
        
        const zoomValue = page.locator('#zoom-value');
        const zoomText = await zoomValue.textContent();
        expect(zoomText).toBe('100%');
    });

    test('should display section selector with options', async ({ page }) => {
        const sectionSelect = page.locator('#section-select');
        await expect(sectionSelect).toBeVisible();
        
        // Check if there are options
        const options = await sectionSelect.locator('option').count();
        expect(options).toBeGreaterThan(1);
    });

    test('should display status bar with train info', async ({ page }) => {
        const statusBar = page.locator('.status-bar');
        await expect(statusBar).toBeVisible();
        
        await expect(page.locator('text=ПОЕЗД № 9707')).toBeVisible();
        await expect(page.locator('text=1197 м')).toBeVisible();
        await expect(page.locator('text=8085 т')).toBeVisible();
    });

    test('should display legend', async ({ page }) => {
        const legend = page.locator('.legend');
        await expect(legend).toBeVisible();
        
        await expect(page.locator('text=Станция')).toBeVisible();
        await expect(page.locator('text=Перегон')).toBeVisible();
        await expect(page.locator('text=Профиль пути')).toBeVisible();
    });
});

test.describe('Speed Data Validation', () => {
    test('should have valid speed segments', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Ждём загрузки данных
        await page.waitForFunction(() => {
            return window.appState && window.appState.speedSegments && window.appState.speedSegments.length > 0;
        }, { timeout: 10000 });
        
        const segments = await page.evaluate(() => {
            return window.appState.speedSegments;
        });
        
        expect(Array.isArray(segments)).toBe(true);
        expect(segments.length).toBeGreaterThan(0);
        
        const firstSegment = segments[0];
        expect(firstSegment.start).toBeDefined();
        expect(firstSegment.end).toBeDefined();
        expect(firstSegment.speed).toBeDefined();
        expect(typeof firstSegment.speed).toBe('number');
        expect(firstSegment.speed).toBeGreaterThan(0);
    });

    test('should have valid config', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Ждём загрузки данных
        await page.waitForFunction(() => {
            return window.appState && window.appState.config;
        }, { timeout: 10000 });
        
        const config = await page.evaluate(() => {
            return window.appState.config;
        });
        
        expect(config.startKm).toBeDefined();
        expect(config.endKm).toBeDefined();
        expect(config.speedMax).toBeDefined();
        expect(config.endKm).toBeGreaterThan(config.startKm);
        expect(config.speedMax).toBeGreaterThan(0);
    });
});
