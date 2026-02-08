// Railway Energy Calculator Data
// Locomotive and route data for energy consumption calculations

// Dynamic route data loaded from files
let ROUTE_DATA = {};

// No default routes - all routes are loaded from /data folder

const LOCOMOTIVE_DATA = {
    vl10u: {
        name: 'ВЛ10У',
        length: 32 // meters
    },
    vl10k: {
        name: 'ВЛ10К',
        length: 30 // meters
    },
    vl10uk: {
        name: 'ВЛ10УК',
        length: 32 // meters
    },
    '2es6': {
        name: '2ЭС6',
        length: 34 // meters
    }
};



const WAGON_LENGTH = 14; // meters per wagon

// Function to load all routes from a single JSON file
async function loadRoutesFromFiles() {
    try {
        console.log('Starting route loading from JSON file...');

        // Load routes from the combined JSON file
        const response = await fetch('data/routes.json');
        if (response.ok) {
            const routesData = await response.json();
            
            // Process each route in the JSON file
            for (const [routeId, route] of Object.entries(routesData)) {
                ROUTE_DATA[routeId] = route;
                console.log(`✓ Loaded route: ${route.name} (${route.distance} км)`);
            }
        } else {
            console.error(`✗ Could not load routes JSON file (HTTP ${response.status})`);
            return;
        }

        const routeCount = Object.keys(ROUTE_DATA).length;
        console.log(`Route loading completed. Total routes loaded: ${routeCount}`);
        console.log('Available routes:', Object.keys(ROUTE_DATA).map(id => ROUTE_DATA[id].name));

        // Dispatch a custom event to notify that routes have been loaded
        const event = new CustomEvent('routesLoaded', { detail: { routeCount: Object.keys(ROUTE_DATA).length } });
        document.dispatchEvent(event);
        
        // If calculator is already initialized, update routes immediately
        if (typeof window !== 'undefined' && window.calculator && window.calculator.updateRouteSelectWithFileRoutes) {
            window.calculator.updateRouteSelectWithFileRoutes();
        }

    } catch (error) {
        console.error('Error loading route files:', error);
    }
}
    }
}

// Parse route data from markdown content
function parseRouteFromMarkdown(content, filename) {
    try {
        const lines = content.split('\n');
        let route = {
            name: '',
            distance: 0,
            description: `Маршрут из файла ${filename}`,
            coefficients: {
                vl10u: {},
                '2es6': {}
            }
        };
        
        let parsingTable = false;
        let headerParsed = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Parse route name (# Title)
            if (line.startsWith('#') && !line.startsWith('##')) {
                route.name = line.substring(1).trim();
            }
            
            // Parse distance (## Distance)
            else if (line.startsWith('##')) {
                const distanceMatch = line.match(/##\s*(\d+)\s*км/);
                if (distanceMatch) {
                    route.distance = parseInt(distanceMatch[1]);
                }
            }
            
            // Parse coefficient table
            else if (line.startsWith('|')) {
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);

                if (!headerParsed && cells[0].toLowerCase().includes('нагрузка')) {
                    headerParsed = true;
                    parsingTable = true;
                } else if (parsingTable && cells.length > 1) {
                    const locomotiveType = cells[0].toUpperCase();

                    if (locomotiveType.toUpperCase().includes('ВЛ10У') && !locomotiveType.toUpperCase().includes('ВЛ10УК')) {
                        // Parse ВЛ10У coefficients
                        for (let j = 1; j < cells.length; j++) {
                            const coeff = parseFloat(cells[j]);
                            if (!isNaN(coeff)) {
                                // Determine axle load from header row - assuming sequential from 6
                                // The first data cell corresponds to axle load 6, second to 7, etc.
                                const axleLoad = j + 5; // j starts from 1, so j+5 gives us 6, 7, 8...
                                route.coefficients.vl10u[axleLoad] = coeff;
                            }
                        }
                    } else if (locomotiveType.toUpperCase().includes('ВЛ10К') && !locomotiveType.toUpperCase().includes('ВЛ10УК')) {
                        // Parse ВЛ10К coefficients
                        for (let j = 1; j < cells.length; j++) {
                            const coeff = parseFloat(cells[j]);
                            if (!isNaN(coeff)) {
                                // Determine axle load from header row - assuming sequential from 6
                                // The first data cell corresponds to axle load 6, second to 7, etc.
                                const axleLoad = j + 5; // j starts from 1, so j+5 gives us 6, 7, 8...
                                route.coefficients.vl10k[axleLoad] = coeff;
                            }
                        }
                    } else if (locomotiveType.toUpperCase().includes('ВЛ10УК')) {
                        // Parse ВЛ10УК coefficients
                        for (let j = 1; j < cells.length; j++) {
                            const coeff = parseFloat(cells[j]);
                            if (!isNaN(coeff)) {
                                // Determine axle load from header row - assuming sequential from 6
                                // The first data cell corresponds to axle load 6, second to 7, etc.
                                const axleLoad = j + 5; // j starts from 1, so j+5 gives us 6, 7, 8...
                                route.coefficients.vl10uk[axleLoad] = coeff;
                            }
                        }
                    } else if (locomotiveType.toUpperCase().includes('2ЭС6')) {
                        // Parse 2ЭС6 coefficients
                        for (let j = 1; j < cells.length; j++) {
                            const coeff = parseFloat(cells[j]);
                            if (!isNaN(coeff)) {
                                // Determine axle load from header row - assuming sequential from 6
                                // The first data cell corresponds to axle load 6, second to 7, etc.
                                const axleLoad = j + 5; // j starts from 1, so j+5 gives us 6, 7, 8...
                                route.coefficients['2es6'][axleLoad] = coeff;
                            }
                        }
                    }
                }
            }
        }
        
        if (route.name && route.distance > 0) {
            return route;
        }
        
        return null;
    } catch (error) {
        console.error('Error parsing route markdown:', error);
        return null;
    }
}

// Generate route ID from name
function generateRouteId(name) {
    return name.toLowerCase()
               .replace(/[^a-zа-я0-9]/gi, '-')
               .replace(/-+/g, '-')
               .replace(/^-|-$/g, '');
}

// Initialize routes on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', loadRoutesFromFiles);
}

// Helper functions for data access
function getLocomotiveData(locomotiveType) {
    return LOCOMOTIVE_DATA[locomotiveType] || null;
}

function getRouteData(routeCode) {
    return ROUTE_DATA[routeCode] || null;
}

function getEnergyCoefficient(locomotiveType, axleLoad, routeData = null) {
    // Only use route-specific coefficients, no fallback to standard coefficients
    if (routeData && routeData.coefficients && routeData.coefficients[locomotiveType]) {
        const roundedAxleLoad = Math.round(axleLoad);
        const customCoefficients = routeData.coefficients[locomotiveType];

        // Try exact match first
        if (customCoefficients[roundedAxleLoad] !== undefined) {
            return customCoefficients[roundedAxleLoad];
        }

        // Find closest match in custom coefficients
        const availableLoads = Object.keys(customCoefficients).map(Number).sort((a, b) => a - b);
        if (availableLoads.length > 0) {
            let closestLoad = availableLoads[0];
            let minDiff = Math.abs(roundedAxleLoad - closestLoad);

            for (const load of availableLoads) {
                const diff = Math.abs(roundedAxleLoad - load);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestLoad = load;
                }
            }

            return customCoefficients[closestLoad];
        }
    }

    // No coefficients available from route file
    return null;
}

// Make ROUTE_DATA available globally
if (typeof window !== 'undefined') {
    window.ROUTE_DATA = ROUTE_DATA;
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
