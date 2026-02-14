// PWA Features for RZD Calculator
// Handles Progressive Web App functionality

class PWAManager {
    constructor() {
        this.initializeNetworkStatus();
        this.initializeCacheStatus();
        this.initializeBackgroundSync();
        this.detectPWAMode();
        this.initializeOfflineHandling();
    }
    
    initializeNetworkStatus() {
        const updateNetworkStatus = () => {
            const isOnline = navigator.onLine;
            let statusElement = document.querySelector('.network-status');
            
            if (!statusElement) {
                statusElement = document.createElement('div');
                statusElement.className = 'network-status';
                document.body.appendChild(statusElement);
            }
            
            if (isOnline) {
                statusElement.className = 'network-status online';
                statusElement.textContent = '🌐 В сети';
                setTimeout(() => {
                    if (statusElement) {
                        statusElement.style.opacity = '0';
                        setTimeout(() => statusElement.remove(), 300);
                    }
                }, 2000);
                
                // Notify service worker to update cache
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'UPDATE_CACHE' });
                }
            } else {
                statusElement.className = 'network-status offline';
                statusElement.textContent = '📴 Офлайн режим';
            }
        };
        
        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        
        // Initial check
        if (!navigator.onLine) {
            updateNetworkStatus();
        }
    }
    
    initializeCacheStatus() {
        if ('serviceWorker' in navigator && 'caches' in window) {
            const showCacheStatus = (message) => {
                let statusElement = document.querySelector('.cache-status');
                if (!statusElement) {
                    statusElement = document.createElement('div');
                    statusElement.className = 'cache-status';
                    document.body.appendChild(statusElement);
                }
                
                statusElement.textContent = message;
                statusElement.classList.add('show');
                
                setTimeout(() => {
                    statusElement.classList.remove('show');
                }, 3000);
            };
            
            // Listen for cache updates
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'CACHE_UPDATED') {
                    showCacheStatus('📦 Кеш обновлен');
                }
            });
        }
    }
    
    initializeBackgroundSync() {
        // Queue offline actions for background sync
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            // Store offline actions in localStorage
            window.addEventListener('offline', () => {
                // Mark that we're offline
                localStorage.setItem('rzdOfflineMode', 'true');
            });
            
            window.addEventListener('online', () => {
                // Clear offline mode
                localStorage.removeItem('rzdOfflineMode');
                
                // Register for background sync to update data
                navigator.serviceWorker.ready.then((registration) => {
                    return registration.sync.register('update-routes');
                }).catch((error) => {
                    console.log('Background sync registration failed:', error);
                });
            });
        }
    }
    
    detectPWAMode() {
        // Detect if running as PWA
        const isPWA = window.navigator.standalone || 
                     window.matchMedia('(display-mode: standalone)').matches ||
                     window.matchMedia('(display-mode: fullscreen)').matches;
        
        if (isPWA) {
            document.body.classList.add('pwa-mode');
            console.log('Running in PWA mode');
            
            // Add PWA status indicator
            const pwaStatus = document.createElement('div');
            pwaStatus.className = 'pwa-status';
            pwaStatus.textContent = '📱 PWA';
            document.body.appendChild(pwaStatus);
            
            // Hide after 3 seconds
            setTimeout(() => {
                pwaStatus.style.opacity = '0';
                setTimeout(() => pwaStatus.remove(), 300);
            }, 3000);
            
            // Add fullscreen toggle for capable devices
            this.addFullscreenToggle();
        }
    }
    
    initializeOfflineHandling() {
        // Handle form submissions when offline
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!navigator.onLine) {
                    // Show offline notification
                    this.showOfflineNotification('Расчет выполнен в офлайн режиме');
                }
            });
        });
        
        // Add offline indicator to body when offline
        window.addEventListener('offline', () => {
            document.body.classList.add('offline');
        });
        
        window.addEventListener('online', () => {
            document.body.classList.remove('offline');
        });
    }
    
    addFullscreenToggle() {
        if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
            const fullscreenBtn = document.createElement('button');
            fullscreenBtn.className = 'pwa-fullscreen';
            fullscreenBtn.innerHTML = '⛶';
            fullscreenBtn.title = 'Полноэкранный режим';
            
            fullscreenBtn.addEventListener('click', () => {
                if (document.fullscreenElement || document.webkitFullscreenElement) {
                    // Exit fullscreen
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                    fullscreenBtn.innerHTML = '⛶';
                } else {
                    // Enter fullscreen
                    const element = document.documentElement;
                    if (element.requestFullscreen) {
                        element.requestFullscreen();
                    } else if (element.webkitRequestFullscreen) {
                        element.webkitRequestFullscreen();
                    }
                    fullscreenBtn.innerHTML = '⛷';
                }
            });
            
            document.body.appendChild(fullscreenBtn);
        }
    }
    
    showOfflineNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'offline-status';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Method to check if app can work offline
    isOfflineCapable() {
        return 'serviceWorker' in navigator && 'caches' in window;
    }
    
    // Method to get cache status
    async getCacheStatus() {
        if (!this.isOfflineCapable()) {
            return { available: false, reason: 'Service workers not supported' };
        }
        
        try {
            const cacheNames = await caches.keys();
            const hasCache = cacheNames.length > 0;
            return { 
                available: hasCache, 
                caches: cacheNames.length,
                reason: hasCache ? 'Ready for offline use' : 'No cache available'
            };
        } catch (error) {
            return { available: false, reason: 'Cache check failed' };
        }
    }
    
    // Method to manually trigger cache update
    async updateCache() {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'UPDATE_CACHE' });
            this.showOfflineNotification('🔄 Обновление кеша...');
        }
    }
}

// Initialize PWA features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
    console.log('PWA Manager initialized');
});

// Enhanced install prompt handling
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    
    // Show enhanced install button
    const installButton = document.createElement('button');
    installButton.className = 'btn btn-secondary pwa-install-button';
    installButton.innerHTML = '<span class="btn-icon">📱</span> Установить приложение';
    
    installButton.addEventListener('click', async () => {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            const { outcome } = await window.deferredPrompt.userChoice;
            console.log(`Install prompt result: ${outcome}`);
            window.deferredPrompt = null;
            installButton.remove();
            
            // Show success message if installed
            if (outcome === 'accepted') {
                const successMsg = document.createElement('div');
                successMsg.className = 'pwa-update-notification';
                successMsg.innerHTML = '✅ Приложение установлено!';
                document.body.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 3000);
            }
        }
    });
    
    document.body.appendChild(installButton);
});

// Handle app installation
window.addEventListener('appinstalled', (evt) => {
    console.log('PWA was installed');
    window.pwaManager.showOfflineNotification('✅ Приложение установлено!');
    
    // Remove install button if still visible
    const installButton = document.querySelector('.pwa-install-button');
    if (installButton) {
        installButton.remove();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAManager;
}