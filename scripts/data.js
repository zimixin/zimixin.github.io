// Railway Energy Calculator Data
// Locomotive and route data for energy consumption calculations

const LOCOMOTIVE_DATA = {
    vl10u: {
        name: 'ВЛ10У',
        length: 32, // meters
        coefficients: {
            // Axle load (tons/axle) -> Energy coefficient
            6: 89.5,
            7: 83.41,
            8: 78.85,
            9: 75.29,
            10: 72.45,
            11: 70.13,
            12: 68.19,
            13: 66.55,
            14: 65.15
        }
    },
    es6: {
        name: '2ЭС6',
        length: 34, // meters
        coefficients: {
            // Axle load (tons/axle) -> Energy coefficient
            6: 82.0,
            7: 76.43,
            8: 72.26,
            9: 69.01,
            10: 66.41,
            11: 64.29,
            12: 62.52,
            13: 61.02,
            14: 59.73
        }
    }
};

const ROUTE_DATA = {
    'abdulino-kinel': {
        name: 'Абдулино - Кинель',
        distance: 233, // kilometers
        description: 'Основной маршрут грузового движения'
    }
};

const WAGON_LENGTH = 14; // meters per wagon

// Helper functions for data access
function getLocomotiveData(locomotiveType) {
    return LOCOMOTIVE_DATA[locomotiveType] || null;
}

function getRouteData(routeCode) {
    return ROUTE_DATA[routeCode] || null;
}

function getEnergyCoefficient(locomotiveType, axleLoad) {
    const locomotive = getLocomotiveData(locomotiveType);
    if (!locomotive) return null;
    
    // Round axle load to nearest integer for coefficient lookup
    const roundedAxleLoad = Math.round(axleLoad);
    
    // Find the closest coefficient
    const coefficients = locomotive.coefficients;
    const availableLoads = Object.keys(coefficients).map(Number).sort((a, b) => a - b);
    
    // If exact match exists
    if (coefficients[roundedAxleLoad]) {
        return coefficients[roundedAxleLoad];
    }
    
    // Find closest match
    let closestLoad = availableLoads[0];
    let minDiff = Math.abs(roundedAxleLoad - closestLoad);
    
    for (const load of availableLoads) {
        const diff = Math.abs(roundedAxleLoad - load);
        if (diff < minDiff) {
            minDiff = diff;
            closestLoad = load;
        }
    }
    
    return coefficients[closestLoad];
}

// Export for use in other scripts (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LOCOMOTIVE_DATA,
        ROUTE_DATA,
        WAGON_LENGTH,
        getLocomotiveData,
        getRouteData,
        getEnergyCoefficient
    };
}