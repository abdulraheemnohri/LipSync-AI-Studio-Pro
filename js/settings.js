/**
 * LipSync AI Studio Pro - Settings Manager
 * Handles all application settings with localStorage persistence
 * and default values for all modules
 */

const DEFAULT_SETTINGS = {
    // AI Settings
    ai: {
        defaultModel: 'gemma-2-2b-it-q4f16_1',
        temperature: 0.7,
        maxTokens: 1024,
        contextLength: 4096,
        gpuEnabled: true,
        cpuThreads: 4,
        streamResponse: true,
        voicePersonality: 'neutral'
    },
    
    // LipSync Settings
    lipsync: {
        detectionMode: 'balanced',
        targetFPS: 30,
        animationSmoothing: true,
        mouthOpening: 75,
        mouthSpeed: 50,
        mouthSmoothing: 80,
        autoStart: true,
        sensitivity: 70
    },
    
    // Performance Settings
    performance: {
        webgpuEnabled: true,
        memoryLimit: '8GB',
        cacheEnabled: true,
        preloadModels: false
    },
    
    // Privacy Settings
    privacy: {
        offlineMode: true,
        noUpload: true,
        localStorage: true
    },
    
    // UI Settings
    ui: {
        theme: 'dark',
        language: 'en',
        sidebarCollapsed: false,
        notificationsEnabled: true,
        soundEnabled: true
    },
    
    // Export Settings
    export: {
        quality: 'medium',
        resolution: '720p',
        includeAudio: true,
        format: 'video-webm'
    },
    
    // Avatar Settings
    avatar: {
        style: 'realistic',
        faceScale: 100,
        eyeSize: 100,
        mouthSize: 100,
        skinColor: '#ffdbac',
        eyeColor: '#000000',
        mouthColor: '#ff6b6b'
    }
};

/**
 * Settings Manager Class
 * Manages all application settings with get/set methods
 * and automatic persistence to localStorage
 */
class SettingsManager {
    constructor() {
        this.settings = this.deepClone(DEFAULT_SETTINGS);
        this.loadSettings();
        this.saveSettings(); // Ensure all settings exist
        this.listeners = new Map();
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('lipsync-ai-settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                this.settings = this.deepMerge(DEFAULT_SETTINGS, parsed);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('lipsync-ai-settings', JSON.stringify(this.settings));
            this.notifyListeners();
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
    
    /**
     * Get a setting value by path
     * @param {string} path - Dot notation path (e.g., 'ai.temperature')
     * @param {*} defaultValue - Default value if not found
     * @returns {*} The setting value
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.settings;
        
        for (const key of keys) {
            if (value && value.hasOwnProperty(key)) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value !== undefined ? value : defaultValue;
    }
    
    /**
     * Set a setting value by path
     * @param {string} path - Dot notation path (e.g., 'ai.temperature')
     * @param {*} value - Value to set
     */
    set(path, value) {
        const keys = path.split('.');
        let current = this.settings;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        const lastKey = keys[keys.length - 1];
        current[lastKey] = value;
        this.saveSettings();
    }
    
    /**
     * Update multiple settings at once
     * @param {Object} settings - Object with settings to update
     */
    update(settings) {
        this.settings = this.deepMerge(this.settings, settings);
        this.saveSettings();
    }
    
    /**
     * Get all settings
     * @returns {Object} Complete settings object
     */
    getAll() {
        return this.deepClone(this.settings);
    }
    
    /**
     * Get settings for a specific category
     * @param {string} category - Category name (e.g., 'ai', 'lipsync')
     * @returns {Object} Settings for the category
     */
    getCategory(category) {
        return this.settings[category] ? this.deepClone(this.settings[category]) : {};
    }
    
    /**
     * Reset settings to defaults
     */
    resetToDefaults() {
        this.settings = this.deepClone(DEFAULT_SETTINGS);
        this.saveSettings();
    }
    
    /**
     * Clear all settings
     */
    clear() {
        localStorage.removeItem('lipsync-ai-settings');
        this.settings = this.deepClone(DEFAULT_SETTINGS);
    }
    
    /**
     * Check if a setting exists
     * @param {string} path - Dot notation path
     * @returns {boolean}
     */
    has(path) {
        const keys = path.split('.');
        let value = this.settings;
        
        for (const key of keys) {
            if (value && value.hasOwnProperty(key)) {
                value = value[key];
            } else {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Subscribe to settings changes
     * @param {string} path - Path to watch (optional, watches all if not provided)
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(path, callback) {
        const key = path || 'all';
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        
        return () => {
            const listeners = this.listeners.get(key);
            if (listeners) {
                listeners.delete(callback);
                if (listeners.size === 0) {
                    this.listeners.delete(key);
                }
            }
        };
    }
    
    /**
     * Notify all subscribers about settings changes
     */
    notifyListeners() {
        // Notify 'all' listeners
        const allListeners = this.listeners.get('all');
        if (allListeners) {
            allListeners.forEach(callback => callback(this.settings));
        }
        
        // Notify specific path listeners
        for (const [path, listeners] of this.listeners) {
            if (path !== 'all') {
                const value = this.get(path);
                listeners.forEach(callback => callback(value, path));
            }
        }
    }
    
    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    deepMerge(target, source) {
        const output = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    output[key] = this.deepMerge(target[key] || {}, source[key]);
                } else {
                    output[key] = source[key];
                }
            }
        }
        
        return output;
    }
    
    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }
    
    /**
     * Get default value for a path
     * @param {string} path - Dot notation path
     * @returns {*} Default value
     */
    getDefault(path) {
        const keys = path.split('.');
        let value = DEFAULT_SETTINGS;
        
        for (const key of keys) {
            if (value && value.hasOwnProperty(key)) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }
    
    /**
     * Check if settings have been modified from defaults
     * @returns {boolean}
     */
    isModified() {
        const current = JSON.stringify(this.settings);
        const defaults = JSON.stringify(DEFAULT_SETTINGS);
        return current !== defaults;
    }
    
    /**
     * Export settings as JSON
     * @returns {string} JSON string
     */
    export() {
        return JSON.stringify(this.settings, null, 2);
    }
    
    /**
     * Import settings from JSON
     * @param {string} json - JSON string
     */
    import(json) {
        try {
            const imported = JSON.parse(json);
            this.settings = this.deepMerge(DEFAULT_SETTINGS, imported);
            this.saveSettings();
        } catch (error) {
            console.error('Failed to import settings:', error);
        }
    }
}

// Create singleton instance
const settings = new SettingsManager();

// Export for use in other modules
export default settings;
export { DEFAULT_SETTINGS, SettingsManager };
