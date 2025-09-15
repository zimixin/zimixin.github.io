// Theme Management
// Handles light/dark theme switching with localStorage persistence

class ThemeManager {
    constructor() {
        this.body = document.body;
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = this.themeToggle?.querySelector('.theme-icon');
        this.currentTheme = this.getStoredTheme() || 'light';
        
        this.initializeTheme();
        this.initializeEventListeners();
    }

    initializeTheme() {
        this.applyTheme(this.currentTheme);
    }

    initializeEventListeners() {
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!this.getStoredTheme()) {
                    // Only auto-switch if user hasn't manually set a preference
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.storeTheme(newTheme);
    }

    applyTheme(theme) {
        // Remove existing theme classes
        this.body.classList.remove('theme-light', 'theme-dark');
        
        // Apply new theme
        this.body.classList.add(`theme-${theme}`);
        
        // Update current theme
        this.currentTheme = theme;
        
        // Update theme icon
        this.updateThemeIcon(theme);
        
        // Dispatch custom event for other components
        this.dispatchThemeChangeEvent(theme);
    }

    updateThemeIcon(theme) {
        if (this.themeIcon) {
            // The CSS handles the icon content based on theme class
            this.themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    getStoredTheme() {
        try {
            return localStorage.getItem('rzdTheme');
        } catch (e) {
            console.warn('localStorage not available');
            return null;
        }
    }

    storeTheme(theme) {
        try {
            localStorage.setItem('rzdTheme', theme);
        } catch (e) {
            console.warn('localStorage not available');
        }
    }

    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themeChange', {
            detail: { theme: theme }
        });
        document.dispatchEvent(event);
    }

    // Public method to get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Public method to set theme programmatically
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
            this.storeTheme(theme);
        }
    }
}

// Auto-detect system theme preference if no stored preference
function getInitialTheme() {
    const stored = localStorage.getItem('rzdTheme');
    if (stored) {
        return stored;
    }
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    
    return 'light';
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const themeManager = new ThemeManager();
    
    // Make theme manager globally accessible
    window.themeManager = themeManager;
    
    console.log('Theme Manager initialized with theme:', themeManager.getCurrentTheme());
});

// Handle theme changes for accessibility
document.addEventListener('themeChange', (event) => {
    console.log('Theme changed to:', event.detail.theme);
    
    // Update meta theme-color for mobile browsers
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        document.head.appendChild(themeColorMeta);
    }
    
    const themeColor = event.detail.theme === 'dark' ? '#1a1a1a' : '#ffffff';
    themeColorMeta.content = themeColor;
});