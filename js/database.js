/**
 * LipSync AI Studio Pro - Database Manager
 * IndexedDB wrapper for offline storage
 */

function DatabaseManager() {
    this.dbName = 'LipSyncAIStudioProDB';
    this.dbVersion = 1;
    this.db = null;
    this.isInitialized = false;
    this.stores = ['avatars', 'recordings', 'chatMessages', 'projects', 'settings'];
}

// Initialize database
DatabaseManager.prototype.init = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        if (self.isInitialized) {
            resolve(self.db);
            return;
        }
        
        var request = indexedDB.open(self.dbName, self.dbVersion);
        
        request.onerror = function(event) {
            console.error('[Database] Error opening database:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = function(event) {
            self.db = event.target.result;
            self.isInitialized = true;
            console.log('[Database] Database opened successfully');
            resolve(self.db);
        };
        
        request.onupgradeneeded = function(event) {
            var db = event.target.result;
            self.stores.forEach(function(storeName) {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            });
            console.log('[Database] Database upgraded');
        };
    });
};

// Save item to store
DatabaseManager.prototype.save = function(storeName, item) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.init().then(function() {
            var transaction = self.db.transaction([storeName], 'readwrite');
            var store = transaction.objectStore(storeName);
            
            var data = { id: item.id || Date.now().toString(), ...item, timestamp: new Date().toISOString() };
            
            var request = store.put(data);
            
            request.onsuccess = function() {
                console.log('[Database] Saved to', storeName, ':', data.id);
                resolve(data);
            };
            
            request.onerror = function(event) {
                console.error('[Database] Error saving to', storeName, ':', event.target.error);
                reject(event.target.error);
            };
        }).catch(reject);
    });
};

// Get item by ID
DatabaseManager.prototype.get = function(storeName, id) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.init().then(function() {
            var transaction = self.db.transaction([storeName], 'readonly');
            var store = transaction.objectStore(storeName);
            
            var request = store.get(id);
            
            request.onsuccess = function() {
                resolve(request.result);
            };
            
            request.onerror = function(event) {
                console.error('[Database] Error getting from', storeName, ':', event.target.error);
                reject(event.target.error);
            };
        }).catch(reject);
    });
};

// Get all items from store
DatabaseManager.prototype.getAll = function(storeName) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.init().then(function() {
            var transaction = self.db.transaction([storeName], 'readonly');
            var store = transaction.objectStore(storeName);
            
            var request = store.getAll();
            
            request.onsuccess = function() {
                // Sort by timestamp (newest first)
                var results = request.result.sort(function(a, b) {
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });
                resolve(results);
            };
            
            request.onerror = function(event) {
                console.error('[Database] Error getting all from', storeName, ':', event.target.error);
                reject(event.target.error);
            };
        }).catch(reject);
    });
};

// Delete item
DatabaseManager.prototype.delete = function(storeName, id) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.init().then(function() {
            var transaction = self.db.transaction([storeName], 'readwrite');
            var store = transaction.objectStore(storeName);
            
            var request = store.delete(id);
            
            request.onsuccess = function() {
                console.log('[Database] Deleted from', storeName, ':', id);
                resolve(true);
            };
            
            request.onerror = function(event) {
                console.error('[Database] Error deleting from', storeName, ':', event.target.error);
                reject(event.target.error);
            };
        }).catch(reject);
    });
};

// Clear all items from store
DatabaseManager.prototype.clear = function(storeName) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.init().then(function() {
            var transaction = self.db.transaction([storeName], 'readwrite');
            var store = transaction.objectStore(storeName);
            
            var request = store.clear();
            
            request.onsuccess = function() {
                console.log('[Database] Cleared', storeName);
                resolve(true);
            };
            
            request.onerror = function(event) {
                console.error('[Database] Error clearing', storeName, ':', event.target.error);
                reject(event.target.error);
            };
        }).catch(reject);
    });
};

// Convenience methods for each store
DatabaseManager.prototype.saveAvatar = function(avatar) {
    return this.save('avatars', avatar);
};

DatabaseManager.prototype.getAvatar = function(id) {
    return this.get('avatars', id);
};

DatabaseManager.prototype.getAvatars = function() {
    return this.getAll('avatars');
};

DatabaseManager.prototype.deleteAvatar = function(id) {
    return this.delete('avatars', id);
};

DatabaseManager.prototype.saveRecording = function(recording) {
    return this.save('recordings', recording);
};

DatabaseManager.prototype.getRecording = function(id) {
    return this.get('recordings', id);
};

DatabaseManager.prototype.getRecordings = function() {
    return this.getAll('recordings');
};

DatabaseManager.prototype.saveChatMessage = function(message) {
    return this.save('chatMessages', message);
};

DatabaseManager.prototype.getChatMessages = function() {
    return this.getAll('chatMessages');
};

DatabaseManager.prototype.saveProject = function(project) {
    return this.save('projects', project);
};

DatabaseManager.prototype.getProjects = function() {
    return this.getAll('projects');
};

DatabaseManager.prototype.saveSetting = function(key, value) {
    return this.save('settings', { key: key, value: value });
};

DatabaseManager.prototype.getSetting = function(key) {
    return this.get('settings', key).then(function(result) {
        return result ? result.value : null;
    });
};

DatabaseManager.prototype.getAllSettings = function() {
    return this.getAll('settings').then(function(results) {
        var settings = {};
        results.forEach(function(setting) {
            settings[setting.key] = setting.value;
        });
        return settings;
    });
};

// Export for browser
window.DatabaseManager = DatabaseManager;