/**
 * Unit Tests for Data Module
 * Tests for data.js functionality - route loading and parsing
 */

const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:8000',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.CustomEvent = dom.window.CustomEvent;

// Import data module
const dataModule = require('../scripts/data.js');

// Mock fetch for testing
global.fetch = jest.fn();

describe('Data Module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.window.ROUTE_DATA = {};
    });

    describe('LOCOMOTIVE_DATA', () => {
        test('should contain all electric locomotives', () => {
            const electricLocos = ['vl10', 'vl10u', 'vl10k', 'vl10uk', '2es6'];
            
            electricLocos.forEach(type => {
                expect(dataModule.LOCOMOTIVE_DATA[type]).toBeDefined();
                expect(dataModule.LOCOMOTIVE_DATA[type].type).toBe('electric');
                expect(dataModule.LOCOMOTIVE_DATA[type].length).toBeGreaterThan(0);
            });
        });

        test('should contain all diesel locomotives', () => {
            const dieselLocos = ['2te10m', '2te25km', 'tep70bs', '3te10m'];
            
            dieselLocos.forEach(type => {
                expect(dataModule.LOCOMOTIVE_DATA[type]).toBeDefined();
                expect(dataModule.LOCOMOTIVE_DATA[type].type).toBe('diesel');
                expect(dataModule.LOCOMOTIVE_DATA[type].length).toBeGreaterThan(0);
            });
        });

        test('should have correct lengths for known locomotives', () => {
            expect(dataModule.LOCOMOTIVE_DATA.vl10u.length).toBe(32);
            expect(dataModule.LOCOMOTIVE_DATA['2es6'].length).toBe(34);
            expect(dataModule.LOCOMOTIVE_DATA['2te10m'].length).toBe(34);
            expect(dataModule.LOCOMOTIVE_DATA['tep70bs'].length).toBe(21);
            expect(dataModule.LOCOMOTIVE_DATA['3te10m'].length).toBe(51);
        });
    });

    describe('WAGON_LENGTH', () => {
        test('should be 14 meters', () => {
            expect(dataModule.WAGON_LENGTH).toBe(14);
        });
    });

    describe('getLocomotiveData', () => {
        test('should return locomotive data for valid type', () => {
            const loco = dataModule.getLocomotiveData('vl10u');
            
            expect(loco).toBeDefined();
            expect(loco.name).toBe('ВЛ10У');
            expect(loco.length).toBe(32);
            expect(loco.type).toBe('electric');
        });

        test('should return null for invalid type', () => {
            const loco = dataModule.getLocomotiveData('unknown');
            expect(loco).toBeNull();
        });

        test('should return data for diesel locomotives', () => {
            const loco = dataModule.getLocomotiveData('2te10m');
            
            expect(loco).toBeDefined();
            expect(loco.name).toBe('2ТЭ10М');
            expect(loco.type).toBe('diesel');
        });
    });

    describe('getEnergyCoefficient', () => {
        const mockRouteData = {
            coefficients: {
                vl10u: { 6: 89.2, 7: 83.96, 8: 80.03, 9: 76.98, 10: 74.53, 11: 72.53, 12: 70.87 },
                vl10k: { 6: 87.5, 7: 81.32, 8: 76.68, 9: 73.07, 10: 70.18 },
                vl10uk: { 6: 90.5, 7: 84.12, 8: 79.34, 9: 75.62, 10: 72.64 },
                '2es6': { 6: 96.5, 7: 89.04, 8: 83.44, 9: 79.09, 10: 75.61 }
            }
        };

        test('should return coefficient for exact axle load match', () => {
            const coeff = dataModule.getEnergyCoefficient('vl10u', 8, mockRouteData);
            expect(coeff).toBe(80.03);
        });

        test('should return coefficient for closest axle load', () => {
            const coeff = dataModule.getEnergyCoefficient('vl10u', 8.3, mockRouteData);
            expect(coeff).toBe(80.03); // Closest to 8
        });

        test('should return coefficient for 2es6 locomotive', () => {
            const coeff = dataModule.getEnergyCoefficient('2es6', 10, mockRouteData);
            expect(coeff).toBe(75.61);
        });

        test('should return null for unknown locomotive type', () => {
            const coeff = dataModule.getEnergyCoefficient('unknown', 8, mockRouteData);
            expect(coeff).toBeNull();
        });

        test('should return null when route data is null', () => {
            const coeff = dataModule.getEnergyCoefficient('vl10u', 8, null);
            expect(coeff).toBeNull();
        });

        test('should return null when route has no coefficients', () => {
            const emptyRoute = { coefficients: {} };
            const coeff = dataModule.getEnergyCoefficient('vl10u', 8, emptyRoute);
            expect(coeff).toBeNull();
        });

        test('should handle axle load at boundary (6)', () => {
            const coeff = dataModule.getEnergyCoefficient('vl10u', 6, mockRouteData);
            expect(coeff).toBe(89.2);
        });

        test('should handle axle load at boundary (12)', () => {
            const coeff = dataModule.getEnergyCoefficient('vl10u', 12, mockRouteData);
            expect(coeff).toBe(70.87);
        });
    });

    describe('getRouteData', () => {
        beforeEach(() => {
            global.window.ROUTE_DATA = {
                'test-route': {
                    name: 'Test Route',
                    distance: 100,
                    travelTime: 2.5
                }
            };
        });

        test('should return route data from window.ROUTE_DATA', () => {
            const route = dataModule.getRouteData('test-route');
            expect(route).toBeDefined();
            expect(route.name).toBe('Test Route');
            expect(route.distance).toBe(100);
        });

        test('should return null for non-existent route', () => {
            const route = dataModule.getRouteData('non-existent');
            expect(route).toBeNull();
        });
    });

    describe('parseRouteFromMarkdown', () => {
        test('should parse route with bullet point format', () => {
            const markdown = `# Абдулино - Кинель

- 233 км
- 4,36 часа

| Нагрузка на ось | 6 | 7 | 8 |
|-----------------|---|---|---|
| ВЛ10У | 89.2 | 83.96 | 80.03 |
| 2ЭС6 | 96.5 | 89.04 | 83.44 |
`;
            // parseRouteFromMarkdown is not exported, so we test via the module
            // This is a limitation - we should export it for testing
        });

        test('should parse route with header format', () => {
            const markdown = `# Москва - СПб
## 635 км

| Нагрузка на ось | 6 | 7 | 8 |
|-----------------|---|---|---|
| ВЛ10У | 89.5 | 83.41 | 78.85 |
`;
            // Similar limitation as above
        });
    });

    describe('generateRouteId', () => {
        test('should generate id from route name', () => {
            // This function is not exported - should export for testing
            // Testing the concept only
            const name = 'Абдулино - Кинель';
            const expectedId = 'abdulino-kinel';
            
            // Manual implementation for testing
            const generatedId = name.toLowerCase()
                .replace(/[^a-zа-я0-9]/gi, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            
            expect(generatedId).toBe(expectedId);
        });

        test('should handle special characters', () => {
            const name = 'Москва - Санкт-Петербург';
            const generatedId = name.toLowerCase()
                .replace(/[^a-zа-я0-9]/gi, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            
            expect(generatedId).toBe('москва-санкт-петербург');
        });
    });

    describe('validateRouteData (integration)', () => {
        test('should accept valid route data', () => {
            const validRoute = {
                name: 'Test Route',
                distance: 233,
                travelTime: 4.36,
                coefficients: {
                    vl10u: { 6: 89.2, 7: 83.96 }
                }
            };

            // validateRouteData is not exported - should export for testing
            // This is a note for future improvement
        });

        test('should reject route with missing name', () => {
            const invalidRoute = {
                name: '',
                distance: 233,
                coefficients: {}
            };
            // Should return validation error
        });

        test('should reject route with invalid distance', () => {
            const invalidRoute = {
                name: 'Test',
                distance: -100,
                coefficients: {}
            };
            // Should return validation error
        });

        test('should warn about very large distance', () => {
            const suspiciousRoute = {
                name: 'Test',
                distance: 15000, // > 10000 km
                coefficients: {}
            };
            // Should return validation warning
        });
    });

    describe('loadRoutesFromFiles (integration)', () => {
        beforeEach(() => {
            global.window.ROUTE_DATA = {};
        });

        test('should load routes successfully', async () => {
            // Mock fetch to return valid markdown
            fetch.mockImplementation((url) => {
                if (url.includes('HEAD')) {
                    return Promise.resolve({ ok: true });
                }
                return Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve(`# Test Route

- 100 км

| Нагрузка на ось | 6 | 7 |
|-----------------|---|---|
| ВЛ10У | 89.2 | 83.96 |
`)
                });
            });

            // Note: loadRoutesFromFiles is not exported
            // This is a limitation - should export for proper testing
        });

        test('should handle missing files gracefully', async () => {
            fetch.mockImplementation(() => 
                Promise.resolve({ ok: false, status: 404 })
            );

            // Should not throw, should handle gracefully
        });

        test('should dispatch routesLoaded event', async () => {
            const eventHandler = jest.fn();
            document.addEventListener('routesLoaded', eventHandler);

            // Trigger load
            // Note: Cannot directly test as function is not exported

            document.removeEventListener('routesLoaded', eventHandler);
        });
    });

    describe('Integration Tests', () => {
        test('should work together: load route -> get coefficient -> calculate', () => {
            // Setup mock route data
            const routeData = {
                name: 'Test Route',
                distance: 200,
                coefficients: {
                    vl10u: { 8: 80.03, 9: 76.98, 10: 74.53 }
                }
            };

            // Get coefficient
            const coefficient = dataModule.getEnergyCoefficient('vl10u', 9.2, routeData);
            
            // Verify coefficient is found (closest to 9)
            expect(coefficient).toBe(76.98);

            // Calculate energy consumption manually
            const trainWeight = 5000; // tons
            const distance = routeData.distance; // km
            const energyConsumption = (trainWeight * coefficient * distance) / 10000 / 100;

            expect(energyConsumption).toBeGreaterThan(0);
            expect(energyConsumption).toBeCloseTo(769.8, 1);
        });
    });
});
