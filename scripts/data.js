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
    '2es6': {
        name: '2ЭС6',
        length: 34 // meters
    }
};



const WAGON_LENGTH = 14; // meters per wagon

// Function to discover and load all .md files from data directory
async function loadRoutesFromFiles() {
    try {
        console.log('Starting route loading...');
        
        // Simple list of known route files - no dynamic discovery needed
        const routeFiles = [
            'abdulino-kinel.md',
            'abdulino-oktyabrsk.md',
            'abdulino-syzran.md',
            'syzran-abdulino.md',
            'kinel-abdulino.md',
            'moscow-spb.md'
        ];
        
        console.log(`Attempting to load ${routeFiles.length} route files...`);
        
        // Load each .md file
        for (const filename of routeFiles) {
            try {
                console.log(`Loading route file: ${filename}`);
                const response = await fetch(`data/${filename}`);
                if (response.ok) {
                    const content = await response.text();
                    const route = parseRouteFromMarkdown(content, filename);
                    if (route) {
                        const routeId = generateRouteId(route.name);
                        ROUTE_DATA[routeId] = route;
                        console.log(`✓ Loaded route: ${route.name} (${route.distance} км)`);
                    } else {
                        console.warn(`✗ Failed to parse route from ${filename}`);
                    }
                } else {
                    console.warn(`✗ Could not load route file: ${filename} (HTTP ${response.status})`);
                }
            } catch (error) {
                console.error(`✗ Error loading route file ${filename}:`, error);
            }
        }
        
        const routeCount = Object.keys(ROUTE_DATA).length;
        console.log(`Route loading completed. Total routes loaded: ${routeCount}`);
        console.log('Available routes:', Object.keys(ROUTE_DATA).map(id => ROUTE_DATA[id].name));
        
        // Trigger UI update if calculator is ready
        if (typeof window !== 'undefined' && window.calculator && window.calculator.updateRouteSelectWithFileRoutes) {
            window.calculator.updateRouteSelectWithFileRoutes();
        }
        
    } catch (error) {
        console.error('Error loading route files:', error);
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
                
                if (!headerParsed && cells[0].includes('нагрузка')) {
                    headerParsed = true;
                    parsingTable = true;
                } else if (parsingTable && cells.length > 1) {
                    const locomotiveType = cells[0].toUpperCase();
                    
                    if (locomotiveType.includes('ВЛ10У')) {
                        // Parse ВЛ10У coefficients
                        for (let j = 1; j < cells.length; j++) {
                            const coeff = parseFloat(cells[j]);
                            if (!isNaN(coeff)) {
                                const axleLoad = j + 5; // Start from 6 t/axle
                                route.coefficients.vl10u[axleLoad] = coeff;
                            }
                        }
                    } else if (locomotiveType.includes('2ЭС6')) {
                        // Parse 2ЭС6 coefficients
                        for (let j = 1; j < cells.length; j++) {
                            const coeff = parseFloat(cells[j]);
                            if (!isNaN(coeff)) {
                                const axleLoad = j + 5; // Start from 6 t/axle
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
    // Check if route has custom coefficients
    if (routeData && routeData.coefficients && routeData.coefficients[locomotiveType]) {
        const roundedAxleLoad = Math.round(axleLoad);
        const customCoefficients = routeData.coefficients[locomotiveType];
        
        // Try exact match first
        if (customCoefficients[roundedAxleLoad]) {
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
    
    // Fallback - no standard coefficients available
    return null;
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