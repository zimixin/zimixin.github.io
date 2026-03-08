// Railway Energy Calculator Data
// Locomotive and route data for energy consumption calculations

// Dynamic route data loaded from files
let ROUTE_DATA = {};

// No default routes - all routes are loaded from /data folder

const LOCOMOTIVE_DATA = {
    vl10: {
        name: 'ВЛ10',
        length: 32, // meters
        type: 'electric'
    },
    vl10u: {
        name: 'ВЛ10У',
        length: 32, // meters
        type: 'electric'
    },
    vl10k: {
        name: 'ВЛ10К',
        length: 30, // meters
        type: 'electric'
    },
    vl10uk: {
        name: 'ВЛ10УК',
        length: 32, // meters
        type: 'electric'
    },
    '2es6': {
        name: '2ЭС6',
        length: 34, // meters
        type: 'electric'
    },
    '2te10m': {
        name: '2ТЭ10М',
        length: 34, // meters (per section)
        type: 'diesel'
    },
    '2te25km': {
        name: '2ТЭ25КМ',
        length: 34, // meters (per section)
        type: 'diesel'
    },
    'tep70bs': {
        name: 'ТЭП70БС',
        length: 21, // meters (single section)
        type: 'diesel'
    },
    '3te10m': {
        name: '3ТЭ10М',
        length: 51, // meters (3 sections: 34м + 17м)
        type: 'diesel'
    }
};



const WAGON_LENGTH = 14; // meters per wagon

// Function to discover and load all .md files from data directory
async function loadRoutesFromFiles() {
    const loadingStartTime = Date.now();
    try {
        console.log('[Route Loader] Starting route loading...');

        // Define the list of known route files by scanning the data directory
        // Since we can't dynamically scan the server directory with JavaScript,
        // we'll define the list of all possible route files
        const routeFiles = [
            'abdulino-dema.md',
            'abdulino-kinel.md',
            'abdulino-oktyabrsk-south.md',
            'abdulino-oktyabrsk.md',
            'abdulino-syzran-south.md',
            'abdulino-syzran.md',
            'kinel-abdulino.md',
            'oktyabrsk-abdulino-south.md',
            'oktyabrsk-abdulino.md',
            'syzran-abdulino-south.md',
            'syzran-abdulino.md'
        ];

        console.log(`[Route Loader] Total route files defined: ${routeFiles.length}`);

        // Track loading statistics
        const stats = {
            total: routeFiles.length,
            existing: 0,
            loaded: 0,
            failed: 0,
            parseErrors: 0
        };

        // Filter out files that don't exist
        const existingFiles = [];
        for (const filename of routeFiles) {
            try {
                const response = await fetch(`./data/${filename}`, { method: 'HEAD' });

                if (response.ok) {
                    existingFiles.push(filename);
                    stats.existing++;
                    console.log(`[Route Loader] ✓ File exists: ./data/${filename}`);
                } else {
                    console.log(`[Route Loader] ✗ File does not exist, skipping: ./data/${filename}`);
                }
            } catch (error) {
                console.log(`[Route Loader] ✗ Error checking file existence, skipping: ./data/${filename}`, error.message);
            }
        }

        console.log(`[Route Loader] Found ${existingFiles.length} existing route files`);

        // Load each .md file that exists
        for (const filename of existingFiles) {
            try {
                const response = await fetch(`./data/${filename}`);

                if (response.ok) {
                    const content = await response.text();
                    const route = parseRouteFromMarkdown(content, filename);
                    
                    if (route) {
                        // Validate route data
                        const validation = validateRouteData(route, filename);
                        if (!validation.valid) {
                            console.warn(`[Route Loader] ⚠️ Route validation warning for ${filename}:`, validation.errors);
                            stats.failed++;
                            continue;
                        }
                        
                        const routeId = generateRouteId(route.name);
                        ROUTE_DATA[routeId] = route;
                        stats.loaded++;
                        console.log(`[Route Loader] ✓ Successfully loaded route: ${route.name} (${route.distance} км)`);
                    } else {
                        console.warn(`[Route Loader] ✗ Failed to parse route from ${filename}`);
                        stats.parseErrors++;
                    }
                } else {
                    console.warn(`[Route Loader] ✗ Could not load route file: ${filename} (HTTP ${response.status})`);
                    stats.failed++;
                }
            } catch (error) {
                console.error(`[Route Loader] ✗ Error loading route file ${filename}:`, error.message);
                stats.failed++;
            }
        }

        const routeCount = Object.keys(ROUTE_DATA).length;
        const loadingTime = Date.now() - loadingStartTime;
        
        console.log(`[Route Loader] ========================================`);
        console.log(`[Route Loader] Route loading completed in ${loadingTime}ms`);
        console.log(`[Route Loader] Total routes loaded: ${routeCount}`);
        console.log(`[Route Loader] Statistics:`, stats);
        console.log(`[Route Loader] Available routes:`, Object.keys(ROUTE_DATA).map(id => `${ROUTE_DATA[id].name} (${ROUTE_DATA[id].distance} км)`));
        console.log(`[Route Loader] ========================================`);

        // Dispatch a custom event to notify that routes have been loaded
        const event = new CustomEvent('routesLoaded', { 
            detail: { 
                routeCount: routeCount,
                stats: stats,
                loadingTime: loadingTime
            } 
        });
        document.dispatchEvent(event);

        // If calculator is already initialized, update routes immediately
        if (typeof window !== 'undefined' && window.calculator && window.calculator.updateRouteSelectWithFileRoutes) {
            window.calculator.updateRouteSelectWithFileRoutes();
        }

    } catch (error) {
        console.error('[Route Loader] Critical error loading route files:', error);
    }
}

// Validate route data for correctness
function validateRouteData(route, filename) {
    const errors = [];
    
    // Check required fields
    if (!route.name || route.name.trim() === '') {
        errors.push('Route name is missing or empty');
    }
    
    if (!route.distance || route.distance <= 0) {
        errors.push('Route distance must be a positive number');
    }
    
    if (route.distance > 10000) {
        errors.push('Route distance seems too large (>10000 km)');
    }
    
    // Check coefficients if they exist
    if (route.coefficients) {
        const locomotiveTypes = ['vl10u', 'vl10k', 'vl10uk', '2es6'];
        for (const type of locomotiveTypes) {
            if (route.coefficients[type]) {
                const coeffs = route.coefficients[type];
                for (const [axleLoad, coeff] of Object.entries(coeffs)) {
                    if (coeff < 0 || coeff > 200) {
                        errors.push(`Invalid coefficient for ${type} at axle load ${axleLoad}: ${coeff}`);
                    }
                }
            }
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Parse route data from markdown content
function parseRouteFromMarkdown(content, filename) {
    try {
        console.log(`Parsing route from file: ${filename}`);
        const lines = content.split('\n');
        console.log(`File contains ${lines.length} lines`);
        
        let route = {
            name: '',
            distance: 0,
            travelTime: 0, // Время в пути
            description: `Маршрут из файла ${filename}`,
            coefficients: {
                vl10u: {},
                '2es6': {},
                vl10k: {},
                vl10uk: {}
            }
        };
        
        let parsingTable = false;
        let headerParsed = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Parse route name (# Title)
            if (line.startsWith('#') && !line.startsWith('##')) {
                route.name = line.substring(1).trim();
                console.log(`Found route name: ${route.name}`);
            }
            
            // Parse distance and travel time (using bullet points)
            else if (line.startsWith('-')) {
                // Looking for distance pattern: "- XXX км"
                const distanceMatch = line.match(/\-\s*(\d+)\s*км/);
                if (distanceMatch) {
                    route.distance = parseInt(distanceMatch[1]);
                    console.log(`Found distance: ${route.distance} km`);
                }
                
                // Looking for travel time pattern: "- XX,XX часа" or "- XX,XX часов"
                const timeMatch = line.match(/\-\s*(\d+[,.]\d+)\s*час[ао]/);
                if (timeMatch) {
                    route.travelTime = parseFloat(timeMatch[1].replace(',', '.'));
                    console.log(`Found travel time: ${route.travelTime} hours`);
                }
            }
            
            // Alternative: Parse distance (## Distance)
            else if (line.startsWith('##')) {
                const distanceMatch = line.match(/##\s*(\d+)\s*км/);
                if (distanceMatch) {
                    route.distance = parseInt(distanceMatch[1]);
                    console.log(`Found distance: ${route.distance} km`);
                }
            }
            
            // Parse coefficient table
            else if (line.startsWith('|')) {
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);

                if (!headerParsed && cells[0].toLowerCase().includes('нагрузка')) {
                    headerParsed = true;
                    parsingTable = true;
                    console.log('Found coefficient table header, starting to parse coefficients');
                } else if (parsingTable && cells.length > 1) {
                    const locomotiveType = cells[0].toUpperCase();

                    if (locomotiveType.toUpperCase().includes('ВЛ10У') && !locomotiveType.toUpperCase().includes('ВЛ10УК')) {
                        console.log(`Parsing ВЛ10У coefficients from line: ${line}`);
                        // Parse ВЛ10У coefficients
                        for (let j = 1; j < cells.length; j++) {
                            const coeff = parseFloat(cells[j]);
                            if (!isNaN(coeff)) {
                                // Determine axle load from header row - assuming sequential from 6
                                // The first data cell corresponds to axle load 6, second to 7, etc.
                                const axleLoad = j + 5; // j starts from 1, so j+5 gives us 6, 7, 8...
                                route.coefficients.vl10u[axleLoad] = coeff;
                                console.log(`Set ВЛ10У coefficient for ${axleLoad} tons/axle: ${coeff}`);
                            }
                        }
                    } else if (locomotiveType.toUpperCase().includes('ВЛ10К') && !locomotiveType.toUpperCase().includes('ВЛ10УК')) {
                        console.log(`Parsing ВЛ10К coefficients from line: ${line}`);
                        // Parse ВЛ10К coefficients
                        for (let j = 1; j < cells.length; j++) {
                            const coeff = parseFloat(cells[j]);
                            if (!isNaN(coeff)) {
                                // Determine axle load from header row - assuming sequential from 6
                                // The first data cell corresponds to axle load 6, second to 7, etc.
                                const axleLoad = j + 5; // j starts from 1, so j+5 gives us 6, 7, 8...
                                route.coefficients.vl10k[axleLoad] = coeff;
                                console.log(`Set ВЛ10К coefficient for ${axleLoad} tons/axle: ${coeff}`);
                            }
                        }
                    } else if (locomotiveType.toUpperCase().includes('ВЛ10УК')) {
                        console.log(`Parsing ВЛ10УК coefficients from line: ${line}`);
                        // Parse ВЛ10УК coefficients
                        for (let j = 1; j < cells.length; j++) {
                            const coeff = parseFloat(cells[j]);
                            if (!isNaN(coeff)) {
                                // Determine axle load from header row - assuming sequential from 6
                                // The first data cell corresponds to axle load 6, second to 7, etc.
                                const axleLoad = j + 5; // j starts from 1, so j+5 gives us 6, 7, 8...
                                route.coefficients.vl10uk[axleLoad] = coeff;
                                console.log(`Set ВЛ10УК coefficient for ${axleLoad} tons/axle: ${coeff}`);
                            }
                        }
                    } else if (locomotiveType.toUpperCase().includes('2ЭС6')) {
                        console.log(`Parsing 2ЭС6 coefficients from line: ${line}`);
                        // Parse 2ЭС6 coefficients
                        for (let j = 1; j < cells.length; j++) {
                            const coeff = parseFloat(cells[j]);
                            if (!isNaN(coeff)) {
                                // Determine axle load from header row - assuming sequential from 6
                                // The first data cell corresponds to axle load 6, second to 7, etc.
                                const axleLoad = j + 5; // j starts from 1, so j+5 gives us 6, 7, 8...
                                route.coefficients['2es6'][axleLoad] = coeff;
                                console.log(`Set 2ЭС6 coefficient for ${axleLoad} tons/axle: ${coeff}`);
                            }
                        }
                    }
                }
            }
        }
        
        console.log(`Completed parsing for ${filename}. Name: "${route.name}", Distance: ${route.distance} km, Travel Time: ${route.travelTime} hours`);
        console.log(`Coefficients found - ВЛ10У: ${Object.keys(route.coefficients.vl10u).length}, 2ЭС6: ${Object.keys(route.coefficients['2es6']).length}, ВЛ10К: ${Object.keys(route.coefficients.vl10k).length}, ВЛ10УК: ${Object.keys(route.coefficients.vl10uk).length}`);
        
        if (route.name && route.distance > 0) {
            console.log(`Route successfully parsed: ${route.name} (${route.distance} km, ${route.travelTime} hours)`);
            return route;
        }
        
        console.log(`Failed to parse route from ${filename}: missing name or distance`);
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
    return (window.ROUTE_DATA && window.ROUTE_DATA[routeCode]) || ROUTE_DATA[routeCode] || null;
}

function getEnergyCoefficient(locomotiveType, axleLoad, routeData = null) {
    // Only use route-specific coefficients, no fallback to standard coefficients
    if (routeData && routeData.coefficients) {
        // Map locomotive types to their corresponding coefficient arrays
        let coefficientArray = null;
        
        // Check for exact locomotive type match
        if (routeData.coefficients[locomotiveType]) {
            coefficientArray = routeData.coefficients[locomotiveType];
        }
        // Special handling for ВЛ10 (which might be represented differently)
        else if (locomotiveType === 'vl10' && routeData.coefficients['vl10']) {
            coefficientArray = routeData.coefficients['vl10'];
        }
        // Fallback to other similar types if needed
        else if (locomotiveType === 'vl10u' && routeData.coefficients['vl10']) {
            coefficientArray = routeData.coefficients['vl10'];
        }
        
        if (coefficientArray) {
            const roundedAxleLoad = Math.round(axleLoad);
            const customCoefficients = coefficientArray;

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
