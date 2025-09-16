// Railway Energy Calculator Data
// Locomotive and route data for energy consumption calculations

// Dynamic route data loaded from files
let ROUTE_DATA = {};

// No default routes - all routes are loaded from /data folder

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



const WAGON_LENGTH = 14; // meters per wagon

// Function to discover and load all .md files from data directory
async function loadRoutesFromFiles() {
    try {
        // Get list of files in data directory
        const files = await discoverDataFiles();
        
        // Load each .md file
        for (const filename of files) {
            if (filename.endsWith('.md') && filename !== 'README.md') {
                try {
                    const response = await fetch(`data/${filename}`);
                    if (response.ok) {
                        const content = await response.text();
                        const route = parseRouteFromMarkdown(content, filename);
                        if (route) {
                            const routeId = generateRouteId(route.name);
                            ROUTE_DATA[routeId] = route;
                            console.log(`Loaded route: ${route.name} from ${filename}`);
                        }
                    } else {
                        console.warn(`Could not load route file: ${filename}`);
                    }
                } catch (error) {
                    console.error(`Error loading route file ${filename}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error discovering route files:', error);
    }
}

// Discover .md files in data directory
async function discoverDataFiles() {
    try {
        // Try to get directory listing via GitHub API if hosted on GitHub Pages
        if (window.location.hostname.includes('github.io')) {
            return await discoverFilesViaGitHubAPI();
        }
        
        // For local development, try to discover files by attempting to fetch known files
        const commonFiles = [
            'Абдулино - Кинель.md',
            'Абдулино - Октябрьск.md',
            'Абдулино - Сызрань.md',
            'Кинель - Абдулино.md',
            'Москва - Санкт-Петербург.md'
        ];
        
        // Check which files actually exist
        const existingFiles = [];
        for (const filename of commonFiles) {
            try {
                const response = await fetch(`data/${filename}`, { method: 'HEAD' });
                if (response.ok) {
                    existingFiles.push(filename);
                }
            } catch (error) {
                // File doesn't exist, continue
            }
        }
        
        return existingFiles;
    } catch (error) {
        console.error('Error in file discovery:', error);
        return [];
    }
}

// Get files via GitHub API for GitHub Pages
async function discoverFilesViaGitHubAPI() {
    try {
        // Extract repo info from hostname
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        
        if (hostname.includes('github.io')) {
            const parts = hostname.split('.');
            const username = parts[0];
            const repoName = pathname.split('/')[1] || hostname.split('.')[0];
            
            const apiUrl = `https://api.github.com/repos/${username}/${repoName}/contents/data`;
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const files = await response.json();
                return files
                    .filter(file => file.type === 'file' && file.name.endsWith('.md'))
                    .map(file => file.name);
            }
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching files via GitHub API:', error);
        return [];
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
                es6: {}
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
                                route.coefficients.es6[axleLoad] = coeff;
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
    
    // Fallback to standard coefficients
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