/**
 * LipSync AI Studio Pro - Settings Manager
 * Manages application settings with localStorage
 */

function SettingsManager() {
    this.defaults = {
        // General
        language: 'en',
        theme: 'light',
        enableNotifications: true,
        enableSounds: true,
        
        // Audio
        masterVolume: 80,
        enableNoiseSuppression: true,
        enableEchoCancellation: true,
        
        // LipSync
        enableLipSync: true,
        lipSyncSensitivity: 50,
        lipSyncSmoothing: 80,
        lipSyncResponse: 70,
        
        // Avatar
        defaultAvatar: 'default',
        avatarScale: 100,
        
        // Advanced
        fpsLimit: 60,
        memoryLimit: 4096,
        enableGPUAcceleration: true,
        enableDebugMode: false
    };
    
    this.settings = {};
    this.load();
}

// Load settings from localStorage
SettingsManager.prototype.load = function() {
    try {
        const saved = localStorage.getItem('lipsync-settings');
        if (saved) {
            this.settings = JSON.parse(saved);
        } else {
            this.settings = {};
        }
        
        // Apply defaults for missing settings
        for (const key in this.defaults) {
            if (!this.settings.hasOwnProperty(key)) {
                this.settings[key] = this.defaults[key];
            }
        }
        
        // Save defaults
        this.save();
        
        // Apply theme
        this.applyTheme();
        
        console.log('[Settings] Loaded', Object.keys(this.settings).length, 'settings');
    } catch (error) {
        console.error('[Settings] Error loading settings:', error);
        this.settings = { ...this.defaults };
    }
};

// Save settings to localStorage
SettingsManager.prototype.save = function() {
    try {
        localStorage.setItem('lipsync-settings', JSON.stringify(this.settings));
        console.log('[Settings] Saved');
    } catch (error) {
        console.error('[Settings] Error saving settings:', error);
    }
};

// Get setting value
SettingsManager.prototype.get = function(key) {
    return this.settings.hasOwnProperty(key) ? this.settings[key] : this.defaults[key];
};

// Set setting value
SettingsManager.prototype.set = function(key, value) {
    if (this.defaults.hasOwnProperty(key)) {
        this.settings[key] = value;
        this.save();
        
        // Apply theme if changed
        if (key === 'theme') {
            this.applyTheme();
        }
        
        return true;
    }
    return false;
};

// Get all settings
SettingsManager.prototype.getAll = function() {
    return { ...this.settings };
};

// Set multiple settings
SettingsManager.prototype.setAll = function(newSettings) {
    for (const key in newSettings) {
        if (this.defaults.hasOwnProperty(key)) {
            this.settings[key] = newSettings[key];
        }
    }
    this.save();
};

// Reset to defaults
SettingsManager.prototype.reset = function() {
    this.settings = { ...this.defaults };
    this.save();
};

// Apply theme
SettingsManager.prototype.applyTheme = function() {
    const theme = this.get('theme');
    document.body.classList.remove('dark-theme', 'light-theme');
    
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
        document.body.classList.add('light-theme');
    }
};

// Toggle theme
SettingsManager.prototype.toggleTheme = function() {
    const current = this.get('theme');
    const next = current === 'dark' ? 'light' : 'dark';
    this.set('theme', next);
    return next;
};

// Export for browser
window.SettingsManager = SettingsManager;