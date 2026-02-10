// Railway Energy Calculator Data
// Locomotive and route data for energy consumption calculations

// Dynamic route data loaded from files
let ROUTE_DATA = {};

// No default routes - all routes are loaded from /data folder

const LOCOMOTIVE_DATA = {
    vl10: {
        name: 'ВЛ10',
        length: 32 // meters
    },
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

// Function to discover and load all .md files from data directory
async function loadRoutesFromFiles() {
    try {
        console.log('Starting route loading...');

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

        console.log(`Total route files defined: ${routeFiles.length}`);

        // Filter out files that don't exist
        const existingFiles = [];
        for (const filename of routeFiles) {
            try {
                console.log(`Checking existence of file: ./data/${filename}`);
                const response = await fetch(`./data/${filename}`);
                console.log(`Response for ${filename}: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    existingFiles.push(filename);
                    console.log(`✓ File exists: ./data/${filename}`);
                } else {
                    console.log(`✗ File does not exist, skipping: ./data/${filename}`);
                }
            } catch (error) {
                console.log(`✗ Error checking file existence, skipping: ./data/${filename}`, error);
            }
        }

        console.log(`Found ${existingFiles.length} existing route files:`, existingFiles);

        // Load each .md file that exists
        for (const filename of existingFiles) {
            try {
                console.log(`Loading route file: ${filename}`);
                const response = await fetch(`./data/${filename}`);
                console.log(`Fetched ${filename}: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    const content = await response.text();
                    console.log(`Successfully retrieved content from ${filename}, length: ${content.length}`);

                    const route = parseRouteFromMarkdown(content, filename);
                    if (route) {
                        const routeId = generateRouteId(route.name);
                        ROUTE_DATA[routeId] = route;
                        console.log(`✓ Successfully parsed and loaded route: ${route.name} (${route.distance} км)`);
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

        // Dispatch a custom event to notify that routes have been loaded
        const event = new CustomEvent('routesLoaded', { detail: { routeCount: Object.keys(ROUTE_DATA).length } });
        console.log(`Dispatching routesLoaded event with route count: ${routeCount}`);
        document.dispatchEvent(event);

        // If calculator is already initialized, update routes immediately
        if (typeof window !== 'undefined' && window.calculator && window.calculator.updateRouteSelectWithFileRoutes) {
            console.log('Calling calculator.updateRouteSelectWithFileRoutes()');
            window.calculator.updateRouteSelectWithFileRoutes();
        } else {
            console.log('Calculator not initialized yet, waiting for routesLoaded event');
        }

    } catch (error) {
        console.error('Error loading route files:', error);
    }
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
                vl10: {},
                vl10u: {},
                '2es6': {},
                vl10k: {},
                vl10uk: {}
            }
        };

        let parsingTable = false;
        let headerParsed = false;
        let headerCells = [];

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
                
                // Looking for max weight pattern: "- Допустимый вес: XXX т"
                const weightMatch = line.match(/\-\s*Допустимый вес:\s*(\d+)\s*т/);
                if (weightMatch) {
                    route.maxWeight = parseInt(weightMatch[1]);
                    console.log(`Found max weight: ${route.maxWeight} tons`);
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

                if (!headerParsed && (cells[0].toLowerCase().includes('нагрузка') || cells[0].toLowerCase().includes('max вес'))) {
                    headerParsed = true;
                    parsingTable = true;
                    console.log('Found coefficient table header, starting to parse coefficients');
                    console.log('Header cells:', cells);
                } else if (parsingTable && cells.length > 1) {
                    // Check if this is the row with "Один" and "СМЕТ" labels followed by numbers
                    const hasOne = cells.some(cell => cell.toLowerCase().includes('один'));
                    const hasSmet = cells.some(cell => cell.toLowerCase().includes('смет'));
                    const hasNumbers = cells.some(cell => !isNaN(parseInt(cell.trim())) && parseInt(cell.trim()) >= 6 && parseInt(cell.trim()) <= 23);
                    
                    if (hasOne && hasSmet && hasNumbers) {
                        // This is the header row with axle loads (6-23), store it as headerCells
                        headerCells = cells;
                        console.log('Found axle load header row:', headerCells);
                    } else if (cells[2]?.toUpperCase() && (cells[2].toUpperCase().includes('ВЛ10') || cells[2].toUpperCase().includes('2ЭС6'))) {
                        // This is a data row, check if it contains locomotive data
                        const locomotiveType = cells[2]?.toUpperCase(); // Locomotive type is in 3rd column (index 2)

                        if (locomotiveType && locomotiveType.includes('ВЛ10') && !locomotiveType.includes('ВЛ10У') && !locomotiveType.includes('ВЛ10К') && !locomotiveType.includes('ВЛ10УК')) {
                            console.log(`Parsing ВЛ10 coefficients from line: ${line}`);
                            // First two columns are max weights for 'one' and 'smet'
                            const oneWeight = parseFloat(cells[0]);
                            const smetWeight = parseFloat(cells[1]);
                            
                            if (!isNaN(oneWeight)) {
                                route.coefficients.vl10['one'] = oneWeight;
                                console.log(`Set ВЛ10 max weight for 'one': ${oneWeight}`);
                            }
                            if (!isNaN(smetWeight)) {
                                route.coefficients.vl10['smet'] = smetWeight;
                                console.log(`Set ВЛ10 max weight for 'smet': ${smetWeight}`);
                            }
                            
                            // Parse coefficients starting from 4th column (index 3)
                            for (let j = 3; j < cells.length && j < headerCells.length; j++) {
                                const coeff = parseFloat(cells[j]);
                                if (!isNaN(coeff)) {
                                    const headerValue = headerCells[j]?.toLowerCase();

                                    // Check if header is a number (axle load)
                                    if (!isNaN(parseInt(headerValue))) {
                                        // It's an axle load
                                        const axleLoad = parseInt(headerValue);
                                        route.coefficients.vl10[axleLoad] = coeff;
                                        console.log(`Set ВЛ10 coefficient for ${axleLoad} tons/axle: ${coeff}`);
                                    }
                                }
                            }
                        } else if (locomotiveType && locomotiveType.includes('ВЛ10У') && !locomotiveType.includes('ВЛ10УК')) {
                            console.log(`Parsing ВЛ10У coefficients from line: ${line}`);
                            // First two columns are max weights for 'one' and 'smet'
                            const oneWeight = parseFloat(cells[0]);
                            const smetWeight = parseFloat(cells[1]);
                            
                            if (!isNaN(oneWeight)) {
                                route.coefficients.vl10u['one'] = oneWeight;
                                console.log(`Set ВЛ10У max weight for 'one': ${oneWeight}`);
                            }
                            if (!isNaN(smetWeight)) {
                                route.coefficients.vl10u['smet'] = smetWeight;
                                console.log(`Set ВЛ10У max weight for 'smet': ${smetWeight}`);
                            }
                            
                            // Parse coefficients starting from 4th column (index 3)
                            for (let j = 3; j < cells.length && j < headerCells.length; j++) {
                                const coeff = parseFloat(cells[j]);
                                if (!isNaN(coeff)) {
                                    const headerValue = headerCells[j]?.toLowerCase();

                                    // Check if header is a number (axle load)
                                    if (!isNaN(parseInt(headerValue))) {
                                        // It's an axle load
                                        const axleLoad = parseInt(headerValue);
                                        route.coefficients.vl10u[axleLoad] = coeff;
                                        console.log(`Set ВЛ10У coefficient for ${axleLoad} tons/axle: ${coeff}`);
                                    }
                                }
                            }
                        } else if (locomotiveType && locomotiveType.includes('ВЛ10К') && !locomotiveType.includes('ВЛ10УК')) {
                            console.log(`Parsing ВЛ10К coefficients from line: ${line}`);
                            // First two columns are max weights for 'one' and 'smet'
                            const oneWeight = parseFloat(cells[0]);
                            const smetWeight = parseFloat(cells[1]);
                            
                            if (!isNaN(oneWeight)) {
                                route.coefficients.vl10k['one'] = oneWeight;
                                console.log(`Set ВЛ10К max weight for 'one': ${oneWeight}`);
                            }
                            if (!isNaN(smetWeight)) {
                                route.coefficients.vl10k['smet'] = smetWeight;
                                console.log(`Set ВЛ10К max weight for 'smet': ${smetWeight}`);
                            }
                            
                            // Parse coefficients starting from 4th column (index 3)
                            for (let j = 3; j < cells.length && j < headerCells.length; j++) {
                                const coeff = parseFloat(cells[j]);
                                if (!isNaN(coeff)) {
                                    const headerValue = headerCells[j]?.toLowerCase();

                                    // Check if header is a number (axle load)
                                    if (!isNaN(parseInt(headerValue))) {
                                        // It's an axle load
                                        const axleLoad = parseInt(headerValue);
                                        route.coefficients.vl10k[axleLoad] = coeff;
                                        console.log(`Set ВЛ10К coefficient for ${axleLoad} tons/axle: ${coeff}`);
                                    }
                                }
                            }
                        } else if (locomotiveType && locomotiveType.includes('ВЛ10УК')) {
                            console.log(`Parsing ВЛ10УК coefficients from line: ${line}`);
                            // First two columns are max weights for 'one' and 'smet'
                            const oneWeight = parseFloat(cells[0]);
                            const smetWeight = parseFloat(cells[1]);
                            
                            if (!isNaN(oneWeight)) {
                                route.coefficients.vl10uk['one'] = oneWeight;
                                console.log(`Set ВЛ10УК max weight for 'one': ${oneWeight}`);
                            }
                            if (!isNaN(smetWeight)) {
                                route.coefficients.vl10uk['smet'] = smetWeight;
                                console.log(`Set ВЛ10УК max weight for 'smet': ${smetWeight}`);
                            }
                            
                            // Parse coefficients starting from 4th column (index 3)
                            for (let j = 3; j < cells.length && j < headerCells.length; j++) {
                                const coeff = parseFloat(cells[j]);
                                if (!isNaN(coeff)) {
                                    const headerValue = headerCells[j]?.toLowerCase();

                                    // Check if header is a number (axle load)
                                    if (!isNaN(parseInt(headerValue))) {
                                        // It's an axle load
                                        const axleLoad = parseInt(headerValue);
                                        route.coefficients.vl10uk[axleLoad] = coeff;
                                        console.log(`Set ВЛ10УК coefficient for ${axleLoad} tons/axle: ${coeff}`);
                                    }
                                }
                            }
                        } else if (locomotiveType && locomotiveType.includes('2ЭС6')) {
                            console.log(`Parsing 2ЭС6 coefficients from line: ${line}`);
                            // First two columns are max weights for 'one' and 'smet'
                            const oneWeight = parseFloat(cells[0]);
                            const smetWeight = parseFloat(cells[1]);
                            
                            if (!isNaN(oneWeight)) {
                                route.coefficients['2es6']['one'] = oneWeight;
                                console.log(`Set 2ЭС6 max weight for 'one': ${oneWeight}`);
                            }
                            if (!isNaN(smetWeight)) {
                                route.coefficients['2es6']['smet'] = smetWeight;
                                console.log(`Set 2ЭС6 max weight for 'smet': ${smetWeight}`);
                            }
                            
                            // Parse coefficients starting from 4th column (index 3)
                            for (let j = 3; j < cells.length && j < headerCells.length; j++) {
                                const coeff = parseFloat(cells[j]);
                                if (!isNaN(coeff)) {
                                    const headerValue = headerCells[j]?.toLowerCase();

                                    // Check if header is a number (axle load)
                                    if (!isNaN(parseInt(headerValue))) {
                                        // It's an axle load
                                        const axleLoad = parseInt(headerValue);
                                        route.coefficients['2es6'][axleLoad] = coeff;
                                        console.log(`Set 2ЭС6 coefficient for ${axleLoad} tons/axle: ${coeff}`);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        console.log(`Completed parsing for ${filename}. Name: "${route.name}", Distance: ${route.distance} km, Travel Time: ${route.travelTime} hours`);
        console.log(`Coefficients found - ВЛ10: ${Object.keys(route.coefficients.vl10).length}, ВЛ10У: ${Object.keys(route.coefficients.vl10u).length}, 2ЭС6: ${Object.keys(route.coefficients['2es6']).length}, ВЛ10К: ${Object.keys(route.coefficients.vl10k).length}, ВЛ10УК: ${Object.keys(route.coefficients.vl10uk).length}`);

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

function getEnergyCoefficient(locomotiveType, axleLoad, routeData = null, locomotiveCount = 1) {
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

            // Try exact match for regular axle loads
            if (customCoefficients[roundedAxleLoad] !== undefined) {
                // Make sure it's a numeric key (not 'one' or 'smet')
                if (!isNaN(roundedAxleLoad)) {
                    return customCoefficients[roundedAxleLoad];
                }
            }

            // Find closest match in custom coefficients for regular axle loads
            const availableLoads = Object.keys(customCoefficients)
                .filter(key => !isNaN(key) && key !== 'one' && key !== 'smet') // Exclude special values
                .map(Number)
                .sort((a, b) => a - b);
                
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
