/**
 * LipSync AI Studio Pro - Database Manager
 * Handles IndexedDB storage for all application data
 * including projects, avatars, audio, models, and chat history
 */

const DB_NAME = 'LipSyncAIStudioDB';
const DB_VERSION = 2; // Updated version for new features

// Database stores
const STORES = {
    PROJECTS: 'projects',
    AVATARS: 'avatars',
    AUDIO: 'audio',
    MODELS: 'models',
    CHAT_HISTORY: 'chatHistory',
    SETTINGS: 'settings',
    SESSIONS: 'sessions'
};

// Model metadata
const MODEL_METADATA = {
    'gemma-2-2b-it-q4f16_1': {
        name: 'Gemma 2B',
        id: 'gemma-2-2b-it-q4f16_1',
        size: '2.4 GB',
        ramRequired: '4 GB',
        category: 'google',
        description: 'Google\'s efficient model, great for general chat and assistance'
    },
    'qwen2.5-3b-instruct-q4f16_1': {
        name: 'Qwen 3B',
        id: 'qwen2.5-3b-instruct-q4f16_1',
        size: '3.8 GB',
        ramRequired: '4-6 GB',
        category: 'balanced',
        description: 'Balanced model with good performance and quality'
    },
    'llama-3.2-1b-instruct-q4f16_1': {
        name: 'Llama 3.2 1B',
        id: 'llama-3.2-1b-instruct-q4f16_1',
        size: '1.2 GB',
        ramRequired: '2-4 GB',
        category: 'lightweight',
        description: 'Lightweight model for mobile and low-RAM devices'
    },
    'llama-3.1-8b-instruct-q4f16_1': {
        name: 'Llama 3.1 8B',
        id: 'llama-3.1-8b-instruct-q4f16_1',
        size: '7.2 GB',
        ramRequired: '8-12 GB',
        category: 'high-quality',
        description: 'High-quality model for best results'
    }
};

/**
 * LipSync Database Class
 * Manages all IndexedDB operations for the application
 */
class LipSyncDatabase {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.request = null;
        this.listeners = new Set();
    }
    
    /**
     * Initialize the database
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        if (this.initialized) return this.db;
        
        return new Promise((resolve, reject) => {
            this.request = indexedDB.open(DB_NAME, DB_VERSION);
            
            this.request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };
            
            this.request.onsuccess = (event) => {
                this.db = event.target.result;
                this.initialized = true;
                this.notifyListeners('initialized');
                resolve(this.db);
            };
            
            this.request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create all stores if they don't exist
                Object.values(STORES).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'id' });
                        
                        // Create indexes based on store type
                        this.createIndexes(store, storeName);
                    }
                });
            };
        });
    }
    
    /**
     * Create indexes for a store
     * @param {IDBObjectStore} store - The store to create indexes for
     * @param {string} storeName - The name of the store
     */
    createIndexes(store, storeName) {
        switch (storeName) {
            case STORES.PROJECTS:
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                store.createIndex('updatedAt', 'updatedAt', { unique: false });
                store.createIndex('avatarId', 'avatarId', { unique: false });
                break;
            case STORES.AVATARS:
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('style', 'style', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                break;
            case STORES.AUDIO:
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('duration', 'duration', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                break;
            case STORES.MODELS:
                store.createIndex('modelId', 'modelId', { unique: true });
                store.createIndex('downloaded', 'downloaded', { unique: false });
                store.createIndex('loaded', 'loaded', { unique: false });
                store.createIndex('size', 'size', { unique: false });
                break;
            case STORES.CHAT_HISTORY:
                store.createIndex('sessionId', 'sessionId', { unique: false });
                store.createIndex('role', 'role', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                break;
            case STORES.SESSIONS:
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                break;
            case STORES.SETTINGS:
                store.createIndex('key', 'key', { unique: true });
                break;
        }
    }
    
    /**
     * Close the database
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.initialized = false;
        }
    }
    
    /**
     * Delete the database
     * @returns {Promise<void>}
     */
    async deleteDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(DB_NAME);
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
            
            request.onsuccess = () => {
                this.db = null;
                this.initialized = false;
                this.notifyListeners('deleted');
                resolve();
            };
        });
    }
    
    /**
     * Wait for database initialization
     * @returns {Promise<void>}
     */
    async waitForInit() {
        if (this.initialized) return;
        return this.init();
    }
    
    // ===== CRUD Operations =====
    
    /**
     * Add a record to a store
     * @param {string} storeName - Name of the store
     * @param {Object} data - Data to add
     * @returns {Promise<IDBValidKey>}
     */
    async add(storeName, data) {
        await this.waitForInit();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.add(data);
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.notifyListeners(`${storeName}:add`, data);
                resolve(event.target.result);
            };
        });
    }
    
    /**
     * Get a record by ID
     * @param {string} storeName - Name of the store
     * @param {IDBValidKey} id - ID of the record
     * @returns {Promise<Object|null>}
     */
    async get(storeName, id) {
        await this.waitForInit();
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.get(id);
            
            request.onerror = () => {
                resolve(null);
            };
            
            request.onsuccess = () => {
                resolve(request.result || null);
            };
        });
    }
    
    /**
     * Get all records from a store
     * @param {string} storeName - Name of the store
     * @returns {Promise<Array>}
     */
    async getAll(storeName) {
        await this.waitForInit();
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.getAll();
            
            request.onerror = () => {
                resolve([]);
            };
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
        });
    }
    
    /**
     * Update a record
     * @param {string} storeName - Name of the store
     * @param {Object} data - Data to update (must include id)
     * @returns {Promise<IDBValidKey>}
     */
    async update(storeName, data) {
        await this.waitForInit();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.put(data);
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.notifyListeners(`${storeName}:update`, data);
                resolve(event.target.result);
            };
        });
    }
    
    /**
     * Delete a record
     * @param {string} storeName - Name of the store
     * @param {IDBValidKey} id - ID of the record to delete
     * @returns {Promise<boolean>}
     */
    async delete(storeName, id) {
        await this.waitForInit();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.delete(id);
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
            
            request.onsuccess = () => {
                this.notifyListeners(`${storeName}:delete`, { id, storeName });
                resolve(true);
            };
        });
    }
    
    /**
     * Get records by index
     * @param {string} storeName - Name of the store
     * @param {string} indexName - Name of the index
     * @param {IDBValidKey} value - Value to query
     * @returns {Promise<Array>}
     */
    async getByIndex(storeName, indexName, value) {
        await this.waitForInit();
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            
            const request = index.getAll(value);
            
            request.onerror = () => {
                resolve([]);
            };
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
        });
    }
    
    /**
     * Clear all records from a store
     * @param {string} storeName - Name of the store
     * @returns {Promise<boolean>}
     */
    async clearStore(storeName) {
        await this.waitForInit();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.clear();
            
            request.onerror = (event) => {
                reject(event.target.error);
            };
            
            request.onsuccess = () => {
                this.notifyListeners(`${storeName}:clear`);
                resolve(true);
            };
        });
    }
    
    // ===== Project Operations =====
    
    /**
     * Create a new project
     * @param {Object} projectData - Project data
     * @returns {Promise<Object>}
     */
    async createProject(projectData) {
        const project = {
            id: this.generateId(),
            name: projectData.name || 'Untitled Project',
            description: projectData.description || '',
            avatarId: projectData.avatarId || null,
            audioId: projectData.audioId || null,
            script: projectData.script || '',
            settings: projectData.settings || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await this.add(STORES.PROJECTS, project);
        return project;
    }
    
    /**
     * Update a project
     * @param {string} id - Project ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object|null>}
     */
    async updateProject(id, updates) {
        const project = await this.get(STORES.PROJECTS, id);
        if (!project) return null;
        
        const updatedProject = {
            ...project,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        await this.update(STORES.PROJECTS, updatedProject);
        return updatedProject;
    }
    
    /**
     * Get a project by ID
     * @param {string} id - Project ID
     * @returns {Promise<Object|null>}
     */
    async getProject(id) {
        return this.get(STORES.PROJECTS, id);
    }
    
    /**
     * Get all projects
     * @returns {Promise<Array>}
     */
    async getAllProjects() {
        return this.getAll(STORES.PROJECTS);
    }
    
    /**
     * Delete a project
     * @param {string} id - Project ID
     * @returns {Promise<boolean>}
     */
    async deleteProject(id) {
        return this.delete(STORES.PROJECTS, id);
    }
    
    // ===== Avatar Operations =====
    
    /**
     * Create a new avatar
     * @param {Object} avatarData - Avatar data
     * @returns {Promise<Object>}
     */
    async createAvatar(avatarData) {
        const avatar = {
            id: this.generateId(),
            name: avatarData.name || 'New Avatar',
            type: avatarData.type || '2d',
            style: avatarData.style || 'realistic',
            imageData: avatarData.imageData || null,
            config: avatarData.config || {
                faceScale: 100,
                headRotation: 0,
                eyeSize: 100,
                eyePosition: 50,
                eyeSpacing: 100,
                mouthSize: 100,
                mouthPosition: 50,
                skinColor: '#ffdbac',
                eyeColor: '#000000',
                mouthColor: '#ff6b6b'
            },
            createdAt: new Date().toISOString()
        };
        
        await this.add(STORES.AVATARS, avatar);
        return avatar;
    }
    
    /**
     * Update an avatar
     * @param {string} id - Avatar ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object|null>}
     */
    async updateAvatar(id, updates) {
        const avatar = await this.get(STORES.AVATARS, id);
        if (!avatar) return null;
        
        const updatedAvatar = {
            ...avatar,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        await this.update(STORES.AVATARS, updatedAvatar);
        return updatedAvatar;
    }
    
    /**
     * Get an avatar by ID
     * @param {string} id - Avatar ID
     * @returns {Promise<Object|null>}
     */
    async getAvatar(id) {
        return this.get(STORES.AVATARS, id);
    }
    
    /**
     * Get all avatars
     * @returns {Promise<Array>}
     */
    async getAllAvatars() {
        return this.getAll(STORES.AVATARS);
    }
    
    /**
     * Delete an avatar
     * @param {string} id - Avatar ID
     * @returns {Promise<boolean>}
     */
    async deleteAvatar(id) {
        return this.delete(STORES.AVATARS, id);
    }
    
    // ===== Audio Operations =====
    
    /**
     * Create a new audio recording
     * @param {Object} audioData - Audio data
     * @returns {Promise<Object>}
     */
    async createAudio(audioData) {
        const audio = {
            id: this.generateId(),
            name: audioData.name || `Recording ${Date.now()}`,
            type: audioData.type || 'recording',
            blob: audioData.blob || null,
            url: audioData.url || '',
            duration: audioData.duration || 0,
            createdAt: new Date().toISOString()
        };
        
        await this.add(STORES.AUDIO, audio);
        return audio;
    }
    
    /**
     * Update an audio recording
     * @param {string} id - Audio ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object|null>}
     */
    async updateAudio(id, updates) {
        const audio = await this.get(STORES.AUDIO, id);
        if (!audio) return null;
        
        const updatedAudio = {
            ...audio,
            ...updates
        };
        
        await this.update(STORES.AUDIO, updatedAudio);
        return updatedAudio;
    }
    
    /**
     * Get an audio recording by ID
     * @param {string} id - Audio ID
     * @returns {Promise<Object|null>}
     */
    async getAudio(id) {
        return this.get(STORES.AUDIO, id);
    }
    
    /**
     * Get all audio recordings
     * @returns {Promise<Array>}
     */
    async getAllAudio() {
        return this.getAll(STORES.AUDIO);
    }
    
    /**
     * Delete an audio recording
     * @param {string} id - Audio ID
     * @returns {Promise<boolean>}
     */
    async deleteAudio(id) {
        return this.delete(STORES.AUDIO, id);
    }
    
    // ===== Model Operations =====
    
    /**
     * Add a model to the database
     * @param {Object} modelData - Model data
     * @returns {Promise<Object>}
     */
    async addModel(modelData) {
        const modelId = modelData.modelId || modelData.id;
        const metadata = MODEL_METADATA[modelId] || {};
        
        const model = {
            id: this.generateId(),
            modelId: modelId,
            name: modelData.name || metadata.name || modelId,
            size: modelData.size || metadata.size || '0 MB',
            ramRequired: modelData.ramRequired || metadata.ramRequired || '0 GB',
            category: modelData.category || metadata.category || 'unknown',
            description: modelData.description || metadata.description || '',
            downloaded: modelData.downloaded || false,
            downloadProgress: modelData.downloadProgress || 0,
            loaded: modelData.loaded || false,
            createdAt: new Date().toISOString()
        };
        
        await this.add(STORES.MODELS, model);
        return model;
    }
    
    /**
     * Update a model
     * @param {string} modelId - Model ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object|null>}
     */
    async updateModel(modelId, updates) {
        const models = await this.getByIndex(STORES.MODELS, 'modelId', modelId);
        if (!models || models.length === 0) return null;
        
        const model = models[0];
        const updatedModel = {
            ...model,
            ...updates
        };
        
        await this.update(STORES.MODELS, updatedModel);
        return updatedModel;
    }
    
    /**
     * Get a model by modelId
     * @param {string} modelId - Model ID
     * @returns {Promise<Object|null>}
     */
    async getModel(modelId) {
        const models = await this.getByIndex(STORES.MODELS, 'modelId', modelId);
        return models && models.length > 0 ? models[0] : null;
    }
    
    /**
     * Get all models
     * @returns {Promise<Array>}
     */
    async getAllModels() {
        return this.getAll(STORES.MODELS);
    }
    
    /**
     * Delete a model
     * @param {string} modelId - Model ID
     * @returns {Promise<boolean>}
     */
    async deleteModel(modelId) {
        const models = await this.getByIndex(STORES.MODELS, 'modelId', modelId);
        if (!models || models.length === 0) return false;
        
        return this.delete(STORES.MODELS, models[0].id);
    }
    
    /**
     * Get downloaded models
     * @returns {Promise<Array>}
     */
    async getDownloadedModels() {
        const allModels = await this.getAllModels();
        return allModels.filter(model => model.downloaded);
    }
    
    /**
     * Get loaded models
     * @returns {Promise<Array>}
     */
    async getLoadedModels() {
        const allModels = await this.getAllModels();
        return allModels.filter(model => model.loaded);
    }
    
    // ===== Chat History Operations =====
    
    /**
     * Add a chat message
     * @param {string} sessionId - Session ID
     * @param {Object} message - Message data
     * @returns {Promise<Object>}
     */
    async addChatMessage(sessionId, message) {
        const chatMessage = {
            id: this.generateId(),
            sessionId: sessionId,
            role: message.role,
            content: message.content,
            timestamp: new Date().toISOString()
        };
        
        await this.add(STORES.CHAT_HISTORY, chatMessage);
        return chatMessage;
    }
    
    /**
     * Get chat history for a session
     * @param {string} sessionId - Session ID
     * @returns {Promise<Array>}
     */
    async getChatHistory(sessionId) {
        return this.getByIndex(STORES.CHAT_HISTORY, 'sessionId', sessionId);
    }
    
    /**
     * Get all chat history
     * @returns {Promise<Array>}
     */
    async getAllChatHistory() {
        return this.getAll(STORES.CHAT_HISTORY);
    }
    
    /**
     * Clear chat history for a session
     * @param {string} sessionId - Session ID
     * @returns {Promise<boolean>}
     */
    async clearChatHistory(sessionId) {
        const messages = await this.getByIndex(STORES.CHAT_HISTORY, 'sessionId', sessionId);
        
        for (const message of messages) {
            await this.delete(STORES.CHAT_HISTORY, message.id);
        }
        
        return true;
    }
    
    /**
     * Create a new chat session
     * @param {Object} sessionData - Session data
     * @returns {Promise<Object>}
     */
    async createSession(sessionData) {
        const session = {
            id: this.generateId(),
            type: sessionData.type || 'chat',
            modelId: sessionData.modelId || null,
            createdAt: new Date().toISOString()
        };
        
        await this.add(STORES.SESSIONS, session);
        return session;
    }
    
    /**
     * Get a session by ID
     * @param {string} id - Session ID
     * @returns {Promise<Object|null>}
     */
    async getSession(id) {
        return this.get(STORES.SESSIONS, id);
    }
    
    // ===== Utility Methods =====
    
    /**
     * Generate a unique ID
     * @returns {string}
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get storage usage information
     * @returns {Promise<Object>}
     */
    async getStorageUsage() {
        await this.waitForInit();
        
        const stores = Object.values(STORES);
        let totalSize = 0;
        let itemCount = 0;
        
        for (const storeName of stores) {
            try {
                const items = await this.getAll(storeName);
                for (const item of items) {
                    try {
                        const itemSize = JSON.stringify(item).length;
                        totalSize += itemSize;
                        itemCount++;
                    } catch (e) {
                        // Skip items that can't be serialized
                    }
                }
            } catch (e) {
                console.warn(`Failed to get size for store ${storeName}:`, e);
            }
        }
        
        return {
            totalSize: totalSize,
            itemCount: itemCount,
            // Convert bytes to MB
            totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
        };
    }
    
    /**
     * Get statistics for a store
     * @param {string} storeName - Store name
     * @returns {Promise<Object>}
     */
    async getStoreStats(storeName) {
        const items = await this.getAll(storeName);
        return {
            count: items.length,
            storeName: storeName
        };
    }
    
    /**
     * Get all statistics
     * @returns {Promise<Object>}
     */
    async getAllStats() {
        const stats = {};
        
        for (const storeName of Object.values(STORES)) {
            const storeStats = await this.getStoreStats(storeName);
            stats[storeName] = storeStats.count;
        }
        
        return stats;
    }
    
    /**
     * Clear all data from all stores
     * @returns {Promise<boolean>}
     */
    async clearAllData() {
        for (const storeName of Object.values(STORES)) {
            await this.clearStore(storeName);
        }
        
        this.notifyListeners('all:clear');
        return true;
    }
    
    /**
     * Subscribe to database events
     * @param {string} event - Event type to subscribe to
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(event, callback) {
        this.listeners.add(callback);
        
        return () => {
            this.listeners.delete(callback);
        };
    }
    
    /**
     * Notify all subscribers
     * @param {string} event - Event type
     * @param {*} data - Event data
     */
    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error in database listener:', error);
            }
        });
    }
}

// Create singleton instance
const db = new LipSyncDatabase();

// Export for use in other modules
export default db;
export { STORES, MODEL_METADATA, LipSyncDatabase };
