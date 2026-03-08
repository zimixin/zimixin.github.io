/**
 * Unit Tests for Energy Calculator
 * Tests for calculator.js functionality
 */

// Mock DOM environment for Node.js
const { JSDOM } = require('jsdom');

const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <div id="resultsSection" style="display: none;"></div>
    <div id="historySection" style="display: none;"></div>
    <div id="infoModal" style="display: none;"></div>
    <form id="calculatorForm">
        <select id="route">
            <option value="">-- Выберите маршрут --</option>
            <option value="abdulino-kinel">Абдулино - Кинель (233 км)</option>
        </select>
        <input type="number" id="trainWeight" value="5000" min="100" max="10000">
        <input type="number" id="trainAxles" value="100" min="10" max="500">
        <input type="number" id="actualWagons" value="50" min="0" max="1000">
        <input type="number" id="conditionalWagons" value="50" min="0" max="1000">
    </form>
    <div id="consumptionResult">0 кВт⋅ч</div>
    <div id="axleLoadResult">0 т/ось</div>
    <div id="trainLengthCard" style="display: none;">
        <div id="trainLengthResult">0 м</div>
    </div>
    <div id="historyList"></div>
    <button id="exportBtn"></button>
    <button id="saveToHistoryBtn"></button>
    <button id="showInfoBtn"></button>
    <button id="clearHistoryBtn"></button>
    <button id="closeModalBtn"></button>
</body>
</html>
`, {
    url: 'http://localhost:8000',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.localStorage = {
    store: {},
    getItem: function(key) { return this.store[key] || null; },
    setItem: function(key, value) { this.store[key] = value.toString(); },
    removeItem: function(key) { delete this.store[key]; },
    clear: function() { this.store = {}; }
};

// Mock CustomEvent for Node.js
if (typeof window.CustomEvent !== 'function') {
    window.CustomEvent = function(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    };
}

// Import data module first (provides global functions)
const dataModule = require('../scripts/data.js');
global.ROUTE_DATA = dataModule.ROUTE_DATA;
global.getRouteData = dataModule.getRouteData;
global.getEnergyCoefficient = dataModule.getEnergyCoefficient;
global.WAGON_LENGTH = dataModule.WAGON_LENGTH;

// Setup mock route data
global.ROUTE_DATA = {
    'abdulino-kinel': {
        name: 'Абдулино - Кинель',
        distance: 233,
        travelTime: 4.36,
        description: 'Маршрут из файла abdulino-kinel.md',
        coefficients: {
            vl10u: { 6: 89.2, 7: 83.96, 8: 80.03, 9: 76.98, 10: 74.53, 11: 72.53, 12: 70.87, 13: 69.46, 14: 68.25 },
            vl10k: { 6: 87.5, 7: 81.32, 8: 76.68, 9: 73.07, 10: 70.18, 11: 67.82, 12: 65.85, 13: 64.19, 14: 62.76 },
            vl10uk: { 6: 90.5, 7: 84.12, 8: 79.34, 9: 75.62, 10: 72.64, 11: 70.21, 12: 68.18, 13: 66.46, 14: 64.99 },
            '2es6': { 6: 96.5, 7: 89.04, 8: 83.44, 9: 79.09, 10: 75.61, 11: 72.76, 12: 70.39, 13: 68.38, 14: 66.66 }
        }
    }
};

// Import calculator module
const EnergyCalculator = require('../scripts/calculator.js');

describe('EnergyCalculator', () => {
    let calculator;

    beforeEach(() => {
        // Clear localStorage before each test
        global.localStorage.clear();
        calculator = new EnergyCalculator();
    });

    afterEach(() => {
        if (calculator) {
            calculator = null;
        }
    });

    describe('Constructor', () => {
        test('should create calculator instance', () => {
            expect(calculator).toBeDefined();
            expect(calculator.form).toBeDefined();
            expect(calculator.resultsSection).toBeDefined();
        });

        test('should initialize with empty currentResult', () => {
            expect(calculator.currentResult).toBeNull();
        });
    });

    describe('getFormData', () => {
        test('should collect form data correctly', () => {
            const formData = calculator.getFormData();
            
            expect(formData.trainWeight).toBe(5000);
            expect(formData.axleCount).toBe(100);
            expect(formData.actualWagons).toBe(50);
            expect(formData.conditionalWagons).toBe(50);
            expect(formData.route).toBe('abdulino-kinel');
        });

        test('should return default values for missing fields', () => {
            document.getElementById('trainWeight').value = '';
            const formData = calculator.getFormData();
            
            expect(formData.trainWeight).toBe(0);
        });
    });

    describe('calculateEnergyConsumption', () => {
        test('should calculate energy consumption correctly', () => {
            const testData = {
                locomotives: [{ type: 'vl10u', name: 'ВЛ10У', length: 32 }],
                locomotiveCount: 1,
                coldLocomotiveCount: 0,
                trainWeight: 5000,
                axleCount: 100,
                actualWagons: 50,
                conditionalWagons: 50,
                route: 'abdulino-kinel',
                wagonCount: null
            };

            const result = calculator.calculateEnergyConsumption(testData);

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.energyConsumption).toBeGreaterThan(0);
            expect(result.data.axleLoad).toBe(50); // 5000 / 100
        });

        test('should return error for no active locomotives', () => {
            const testData = {
                locomotives: [{ type: 'cold', name: 'Х', length: 32 }],
                locomotiveCount: 0,
                coldLocomotiveCount: 1,
                trainWeight: 5000,
                axleCount: 100,
                actualWagons: 50,
                conditionalWagons: 50,
                route: 'abdulino-kinel',
                wagonCount: null
            };

            const result = calculator.calculateEnergyConsumption(testData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Нет активных локомотивов');
        });

        test('should return error for invalid route', () => {
            const testData = {
                locomotives: [{ type: 'vl10u', name: 'ВЛ10У', length: 32 }],
                locomotiveCount: 1,
                coldLocomotiveCount: 0,
                trainWeight: 5000,
                axleCount: 100,
                actualWagons: 50,
                conditionalWagons: 50,
                route: 'non-existent-route',
                wagonCount: null
            };

            const result = calculator.calculateEnergyConsumption(testData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Неверные данные маршрута');
        });

        test('should return error for zero axle count', () => {
            const testData = {
                locomotives: [{ type: 'vl10u', name: 'ВЛ10У', length: 32 }],
                locomotiveCount: 1,
                coldLocomotiveCount: 0,
                trainWeight: 5000,
                axleCount: 0,
                actualWagons: 50,
                conditionalWagons: 50,
                route: 'abdulino-kinel',
                wagonCount: null
            };

            const result = calculator.calculateEnergyConsumption(testData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Количество осей не может быть 0');
        });

        test('should calculate train length when conditional wagons > 0', () => {
            const testData = {
                locomotives: [{ type: 'vl10u', name: 'ВЛ10У', length: 32 }],
                locomotiveCount: 1,
                coldLocomotiveCount: 0,
                trainWeight: 5000,
                axleCount: 100,
                actualWagons: 50,
                conditionalWagons: 50,
                route: 'abdulino-kinel',
                wagonCount: null
            };

            const result = calculator.calculateEnergyConsumption(testData);

            expect(result.success).toBe(true);
            expect(result.data.trainLength).toBeGreaterThan(0);
            // 32m (locomotive) + 50 * 14m (wagons) = 32 + 700 = 732m
            expect(result.data.trainLength).toBe(732);
        });

        test('should use correct formula: (Weight * Coefficient * Distance) / 10000 / 100', () => {
            const testData = {
                locomotives: [{ type: 'vl10u', name: 'ВЛ10У', length: 32 }],
                locomotiveCount: 1,
                coldLocomotiveCount: 0,
                trainWeight: 5000,
                axleCount: 100,
                actualWagons: 50,
                conditionalWagons: 50,
                route: 'abdulino-kinel',
                wagonCount: null
            };

            const result = calculator.calculateEnergyConsumption(testData);
            
            // Axle load = 5000 / 100 = 50, closest coefficient for vl10u at axle 14 = 68.25
            const expectedConsumption = (5000 * 68.25 * 233) / 10000 / 100;
            
            expect(result.data.energyConsumption).toBeCloseTo(expectedConsumption, 2);
        });
    });

    describe('validateField', () => {
        test('should validate required field as empty', () => {
            const trainWeight = document.getElementById('trainWeight');
            trainWeight.value = '';
            
            const isValid = calculator.validateField(trainWeight);
            
            expect(isValid).toBe(false);
        });

        test('should validate number within range', () => {
            const trainWeight = document.getElementById('trainWeight');
            trainWeight.value = '5000';
            
            const isValid = calculator.validateField(trainWeight);
            
            expect(isValid).toBe(true);
        });

        test('should validate number below minimum', () => {
            const trainWeight = document.getElementById('trainWeight');
            trainWeight.value = '50'; // Below min of 100
            
            const isValid = calculator.validateField(trainWeight);
            
            // Should still be valid as HTML5 validation handles min/max
            // Our custom validation only checks for NaN
            expect(isValid).toBe(true);
        });

        test('should validate axle load ratio', () => {
            const trainAxles = document.getElementById('trainAxles');
            const trainWeight = document.getElementById('trainWeight');
            trainWeight.value = '50000'; // 50000 tons
            trainAxles.value = '100'; // 100 axles = 500 t/axis (too high)
            
            const isValid = calculator.validateField(trainAxles);
            
            expect(isValid).toBe(false);
        });
    });

    describe('History Management', () => {
        test('should save to history', () => {
            calculator.currentResult = {
                energyConsumption: 795.31,
                axleLoad: 50,
                trainLength: 732,
                coefficient: 68.25,
                locomotive: { type: 'vl10u', name: 'ВЛ10У', length: 32 },
                route: { name: 'Абдулино - Кинель', distance: 233 },
                formData: { trainWeight: 5000, axleCount: 100 }
            };

            calculator.saveToHistory();
            
            const history = calculator.getHistory();
            expect(history.length).toBe(1);
            expect(history[0].energyConsumption).toBe(795.31);
        });

        test('should keep only last 10 items in history', () => {
            // Add 11 items
            for (let i = 0; i < 11; i++) {
                calculator.currentResult = {
                    energyConsumption: i,
                    axleLoad: 50,
                    trainLength: 732,
                    coefficient: 68.25,
                    locomotive: { type: 'vl10u', name: 'ВЛ10У', length: 32 },
                    route: { name: 'Абдулино - Кинель', distance: 233 },
                    formData: { trainWeight: 5000, axleCount: 100 }
                };
                calculator.saveToHistory();
            }

            const history = calculator.getHistory();
            expect(history.length).toBe(10);
            expect(history[0].energyConsumption).toBe(10); // Last item
        });

        test('should clear history', () => {
            calculator.saveToHistory();
            calculator.clearHistory();
            
            const history = calculator.getHistory();
            expect(history.length).toBe(0);
        });
    });

    describe('displayResults', () => {
        test('should display results correctly', () => {
            const data = {
                energyConsumption: 795.31,
                axleLoad: 50.25,
                trainLength: 732,
                coefficient: 68.25,
                locomotive: { type: 'vl10u', name: 'ВЛ10У', length: 32 },
                route: { name: 'Абдулино - Кинель', distance: 233 },
                formData: { trainWeight: 5000, axleCount: 100 }
            };

            calculator.displayResults(data);

            expect(document.getElementById('consumptionResult').textContent).toBe('795.31 кВт⋅ч');
            expect(document.getElementById('axleLoadResult').textContent).toBe('50.25 т/ось');
            expect(document.getElementById('trainLengthCard').style.display).not.toBe('none');
        });
    });
});

describe('Data Module', () => {
    describe('getEnergyCoefficient', () => {
        const mockRouteData = {
            coefficients: {
                vl10u: { 6: 89.2, 7: 83.96, 8: 80.03, 9: 76.98, 10: 74.53 },
                '2es6': { 6: 96.5, 7: 89.04, 8: 83.44, 9: 79.09, 10: 75.61 }
            }
        };

        test('should return coefficient for exact axle load match', () => {
            const coeff = getEnergyCoefficient('vl10u', 8, mockRouteData);
            expect(coeff).toBe(80.03);
        });

        test('should return coefficient for closest axle load when no exact match', () => {
            const coeff = getEnergyCoefficient('vl10u', 8.3, mockRouteData);
            expect(coeff).toBe(80.03); // Closest to 8
        });

        test('should return null for unknown locomotive type', () => {
            const coeff = getEnergyCoefficient('unknown', 8, mockRouteData);
            expect(coeff).toBeNull();
        });

        test('should return null when route data is null', () => {
            const coeff = getEnergyCoefficient('vl10u', 8, null);
            expect(coeff).toBeNull();
        });
    });

    describe('getLocomotiveData', () => {
        test('should return locomotive data for valid type', () => {
            const loco = dataModule.getLocomotiveData('vl10u');
            expect(loco).toBeDefined();
            expect(loco.name).toBe('ВЛ10У');
            expect(loco.length).toBe(32);
        });

        test('should return null for invalid locomotive type', () => {
            const loco = dataModule.getLocomotiveData('unknown');
            expect(loco).toBeNull();
        });
    });
});
