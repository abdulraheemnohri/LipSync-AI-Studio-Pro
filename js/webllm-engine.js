/**
 * LipSync AI Studio Pro - WebLLM Engine
 * Handles WebLLM model loading, chat, and inference
 * with support for multiple models and streaming
 */

import settings from './settings.js';
import db from './database.js';

// Available models with their configurations
const AVAILABLE_MODELS = {
    'gemma-2-2b-it-q4f16_1': {
        name: 'Gemma 2B',
        id: 'gemma-2-2b-it-q4f16_1',
        size: '2.4 GB',
        ramRequired: '4 GB',
        category: 'google',
        description: 'Google\'s efficient model, great for general chat and assistance. Fast and lightweight.',
        recommended: true,
        mobileFriendly: true
    },
    'qwen2.5-3b-instruct-q4f16_1': {
        name: 'Qwen 3B',
        id: 'qwen2.5-3b-instruct-q4f16_1',
        size: '3.8 GB',
        ramRequired: '4-6 GB',
        category: 'balanced',
        description: 'Balanced model with good performance and quality. Suitable for most use cases.',
        recommended: true
    },
    'llama-3.2-1b-instruct-q4f16_1': {
        name: 'Llama 3.2 1B',
        id: 'llama-3.2-1b-instruct-q4f16_1',
        size: '1.2 GB',
        ramRequired: '2-4 GB',
        category: 'lightweight',
        description: 'Lightweight model for mobile and low-RAM devices. Best for testing.',
        recommended: false,
        mobileFriendly: true
    },
    'llama-3.1-8b-instruct-q4f16_1': {
        name: 'Llama 3.1 8B',
        id: 'llama-3.1-8b-instruct-q4f16_1',
        size: '7.2 GB',
        ramRequired: '8-12 GB',
        category: 'high-quality',
        description: 'High-quality model for best results. Requires more RAM and processing power.',
        recommended: false
    }
};

// Model categories
const MODEL_CATEGORIES = {
    lightweight: {
        name: 'Lightweight Mobile',
        description: 'Models suitable for mobile devices and low-RAM environments'
    },
    google: {
        name: 'Google Models',
        description: 'Google\'s Gemma models, optimized for efficiency'
    },
    balanced: {
        name: 'Balanced',
        description: 'Good balance of performance and quality'
    },
    high-quality: {
        name: 'High Quality',
        description: 'Highest quality models for best results'
    }
};

/**
 * WebLLM Engine Class
 * Manages WebLLM model loading, chat, and inference
 */
class WebLLMEngine {
    constructor() {
        this.engine = null;
        this.currentModel = null;
        this.isInitialized = false;
        this.isLoading = false;
        this.loadProgress = 0;
        this.error = null;
        this.chatHistory = [];
        this.sessionId = this.generateSessionId();
        this.modelCache = new Map();
        this.isCheckingGPU = false;
        this.gpuSupported = false;
        
        // Bind methods
        this.onProgress = this.onProgress.bind(this);
        this.onError = this.onError.bind(this);
    }
    
    /**
     * Initialize the WebLLM engine
     * @returns {Promise<boolean>}
     */
    async init() {
        if (this.isInitialized) return true;
        
        try {
            // Load WebLLM from CDN
            await this.loadWebLLMLibrary();
            
            // Check GPU support
            this.gpuSupported = await this.checkGPUSupport();
            
            this.isInitialized = true;
            console.log('WebLLM Engine initialized successfully');
            return true;
        } catch (error) {
            this.error = error;
            console.error('Failed to initialize WebLLM:', error);
            this.isInitialized = false;
            return false;
        }
    }
    
    /**
     * Load WebLLM library dynamically
     * @returns {Promise<void>}
     */
    async loadWebLLMLibrary() {
        return new Promise((resolve, reject) => {
            if (window.webllm) {
                resolve();
                return;
            }
            
            // Check if script is already loading
            const existingScript = document.querySelector('script[src="https://esm.run/@mlc-ai/web-llm"]');
            if (existingScript) {
                if (existingScript.onload) {
                    // Already loading, wait for it
                    const checkInterval = setInterval(() => {
                        if (window.webllm) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                    return;
                }
            }
            
            const script = document.createElement('script');
            script.src = 'https://esm.run/@mlc-ai/web-llm';
            script.type = 'module';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Check GPU support
     * @returns {Promise<boolean>}
     */
    async checkGPUSupport() {
        if (this.isCheckingGPU) {
            // Wait for existing check to complete
            while (this.isCheckingGPU) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.gpuSupported;
        }
        
        this.isCheckingGPU = true;
        
        try {
            if (window.webllm && typeof webllm.checkGPUSupport === 'function') {
                const gpuAvailable = await webllm.checkGPUSupport();
                console.log('GPU Support:', gpuAvailable);
                this.isCheckingGPU = false;
                return gpuAvailable;
            }
            
            // Fallback: check for WebGPU support
            if (navigator.gpu) {
                try {
                    const adapter = await navigator.gpu.requestAdapter();
                    this.isCheckingGPU = false;
                    return !!adapter;
                } catch (error) {
                    console.log('WebGPU check failed:', error);
                }
            }
            
            this.isCheckingGPU = false;
            return false;
        } catch (error) {
            console.log('GPU check failed, falling back to CPU:', error);
            this.isCheckingGPU = false;
            return false;
        }
    }
    
    /**
     * Load a specific model
     * @param {string} modelId - Model ID to load
     * @param {Function} onProgress - Progress callback (0-100)
     * @param {Function} onError - Error callback
     * @returns {Promise<boolean>}
     */
    async loadModel(modelId, onProgress = null, onError = null) {
        if (this.isLoading) {
            console.log('Model loading already in progress');
            return false;
        }
        
        if (!AVAILABLE_MODELS[modelId]) {
            this.error = new Error(`Model ${modelId} not available`);
            if (onError) onError(this.error);
            return false;
        }
        
        this.isLoading = true;
        this.loadProgress = 0;
        this.error = null;
        
        try {
            // Check if model is already loaded
            if (this.currentModel === modelId && this.engine) {
                console.log(`Model ${modelId} already loaded`);
                this.isLoading = false;
                return true;
            }
            
            // Update model status in database
            await this.updateModelStatus(modelId, {
                downloaded: true,
                downloadProgress: 0
            });
            
            // Load the model
            console.log(`Loading model: ${modelId}`);
            
            if (!window.webllm || !webllm.CreateMLCEngine) {
                throw new Error('WebLLM library not loaded');
            }
            
            // Check GPU support for this model
            const useGPU = settings.get('ai.gpuEnabled', true) && this.gpuSupported;
            
            this.engine = await webllm.CreateMLCEngine(
                modelId,
                {
                    initProgressCallback: (progress) => {
                        this.loadProgress = progress * 100;
                        if (onProgress) onProgress(progress * 100);
                        this.updateModelStatus(modelId, { downloadProgress: progress * 100 });
                    },
                    gpu: useGPU
                }
            );
            
            this.currentModel = modelId;
            this.isLoading = false;
            this.loadProgress = 100;
            
            // Update model as loaded
            await this.updateModelStatus(modelId, { loaded: true, downloadProgress: 100 });
            
            console.log(`Model ${modelId} loaded successfully`);
            this.notifyListeners('modelLoaded', modelId);
            return true;
        } catch (error) {
            this.error = error;
            this.isLoading = false;
            console.error(`Failed to load model ${modelId}:`, error);
            if (onError) onError(error);
            
            // Update model status
            await this.updateModelStatus(modelId, { loaded: false });
            return false;
        }
    }
    
    /**
     * Unload current model
     * @returns {Promise<boolean>}
     */
    async unloadModel() {
        if (!this.engine) return false;
        
        try {
            // Note: WebLLM doesn't have an explicit unload method
            // We'll just nullify the engine reference
            this.engine = null;
            this.currentModel = null;
            console.log('Model unloaded');
            
            // Update model status
            if (this.currentModel) {
                await this.updateModelStatus(this.currentModel, { loaded: false });
            }
            
            this.notifyListeners('modelUnloaded');
            return true;
        } catch (error) {
            console.error('Failed to unload model:', error);
            return false;
        }
    }
    
    /**
     * Update model status in database
     * @param {string} modelId - Model ID
     * @param {Object} status - Status updates
     */
    async updateModelStatus(modelId, status) {
        try {
            const model = await db.getModel(modelId);
            if (model) {
                await db.updateModel(modelId, status);
            } else {
                // Create model entry if it doesn't exist
                await db.addModel({
                    modelId: modelId,
                    ...status
                });
            }
        } catch (error) {
            console.error('Failed to update model status:', error);
        }
    }
    
    /**
     * Send a chat message
     * @param {string} message - User message
     * @param {Object} options - Chat options
     * @returns {Promise<string>}
     */
    async chat(message, options = {}) {
        if (!this.engine) {
            throw new Error('Model not loaded. Please load a model first.');
        }
        
        try {
            const {
                temperature = settings.get('ai.temperature', 0.7),
                maxTokens = settings.get('ai.maxTokens', 1024),
                stream = settings.get('ai.streamResponse', true)
            } = options;
            
            // Add user message to history
            this.chatHistory.push({
                role: 'user',
                content: message
            });
            
            // Prepare messages for WebLLM
            const messages = this.chatHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            }));
            
            // Get model response
            const response = await this.engine.chat.completions.create({
                messages: messages,
                temperature: temperature,
                max_gen_len: maxTokens,
                stream: false
            });
            
            const reply = response.choices[0].message.content;
            
            // Add assistant response to history
            this.chatHistory.push({
                role: 'assistant',
                content: reply
            });
            
            // Save to database
            try {
                await db.addChatMessage(this.sessionId, {
                    role: 'user',
                    content: message
                });
                await db.addChatMessage(this.sessionId, {
                    role: 'assistant',
                    content: reply
                });
            } catch (dbError) {
                console.warn('Failed to save chat to database:', dbError);
            }
            
            this.notifyListeners('chatResponse', { message, reply });
            return reply;
        } catch (error) {
            console.error('Chat error:', error);
            throw error;
        }
    }
    
    /**
     * Stream chat response
     * @param {string} message - User message
     * @param {Object} options - Chat options
     * @param {Function} onChunk - Callback for each chunk
     * @returns {Promise<string>}
     */
    async chatStream(message, options = {}, onChunk = null) {
        if (!this.engine) {
            throw new Error('Model not loaded. Please load a model first.');
        }
        
        try {
            const {
                temperature = settings.get('ai.temperature', 0.7),
                maxTokens = settings.get('ai.maxTokens', 1024)
            } = options;
            
            // Add user message to history
            this.chatHistory.push({
                role: 'user',
                content: message
            });
            
            const messages = this.chatHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            }));
            
            let fullResponse = '';
            
            const response = await this.engine.chat.completions.create({
                messages: messages,
                temperature: temperature,
                max_gen_len: maxTokens,
                stream: true
            });
            
            for await (const chunk of response) {
                if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta) {
                    const delta = chunk.choices[0].delta.content || '';
                    fullResponse += delta;
                    
                    if (onChunk) {
                        onChunk(delta, fullResponse);
                    }
                }
            }
            
            // Add assistant response to history
            this.chatHistory.push({
                role: 'assistant',
                content: fullResponse
            });
            
            // Save to database
            try {
                await db.addChatMessage(this.sessionId, {
                    role: 'user',
                    content: message
                });
                await db.addChatMessage(this.sessionId, {
                    role: 'assistant',
                    content: fullResponse
                });
            } catch (dbError) {
                console.warn('Failed to save chat to database:', dbError);
            }
            
            this.notifyListeners('chatResponse', { message, reply: fullResponse });
            return fullResponse;
        } catch (error) {
            console.error('Stream chat error:', error);
            throw error;
        }
    }
    
    /**
     * Clear chat history
     */
    clearChatHistory() {
        this.chatHistory = [];
        this.sessionId = this.generateSessionId();
        this.notifyListeners('chatCleared');
    }
    
    /**
     * Start a new chat session
     */
    newChatSession() {
        this.chatHistory = [];
        this.sessionId = this.generateSessionId();
        this.notifyListeners('newSession', this.sessionId);
    }
    
    /**
     * Generate session ID
     * @returns {string}
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get available models
     * @returns {Object}
     */
    getAvailableModels() {
        return AVAILABLE_MODELS;
    }
    
    /**
     * Get models by category
     * @param {string} category - Category name
     * @returns {Object}
     */
    getModelsByCategory(category) {
        const models = {};
        for (const [modelId, modelInfo] of Object.entries(AVAILABLE_MODELS)) {
            if (modelInfo.category === category) {
                models[modelId] = modelInfo;
            }
        }
        return models;
    }
    
    /**
     * Get current model info
     * @returns {Object|null}
     */
    getCurrentModelInfo() {
        if (!this.currentModel) return null;
        return AVAILABLE_MODELS[this.currentModel];
    }
    
    /**
     * Get engine status
     * @returns {Object}
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isLoading: this.isLoading,
            currentModel: this.currentModel,
            loadProgress: this.loadProgress,
            error: this.error,
            chatHistoryLength: this.chatHistory.length,
            gpuSupported: this.gpuSupported,
            sessionId: this.sessionId
        };
    }
    
    /**
     * Check if model is loaded
     * @param {string} modelId - Model ID to check
     * @returns {boolean}
     */
    isModelLoaded(modelId = null) {
        if (modelId) {
            return this.currentModel === modelId && this.engine !== null;
        }
        return this.engine !== null;
    }
    
    /**
     * Get memory usage (approximate)
     * @returns {Promise<number>}
     */
    async getMemoryUsage() {
        if (!this.engine) return 0;
        
        try {
            // This is a placeholder - WebLLM doesn't expose memory usage directly
            // We'll estimate based on model size
            const modelInfo = this.getCurrentModelInfo();
            if (modelInfo) {
                // Parse size string (e.g., "2.4 GB" -> 2.4 * 1024)
                const sizeMatch = modelInfo.size.match(/([\d.]+)\s*(GB|MB)/);
                if (sizeMatch) {
                    const size = parseFloat(sizeMatch[1]);
                    const unit = sizeMatch[2];
                    return unit === 'GB' ? size * 1024 : size;
                }
            }
            return 0;
        } catch (error) {
            console.error('Failed to get memory usage:', error);
            return 0;
        }
    }
    
    /**
     * Get estimated VRAM usage
     * @returns {Promise<number>}
     */
    async getVRAMUsage() {
        const memoryUsage = await this.getMemoryUsage();
        // VRAM is typically 1.5-2x the model size
        return memoryUsage * (this.gpuSupported ? 1.5 : 2);
    }
    
    /**
     * Check if device can run a specific model
     * @param {string} modelId - Model ID
     * @returns {Promise<Object>}
     */
    async canRunModel(modelId) {
        const modelInfo = AVAILABLE_MODELS[modelId];
        if (!modelInfo) {
            return { canRun: false, reason: 'Model not found' };
        }
        
        // Check RAM requirements
        const ramMatch = modelInfo.ramRequired.match(/([\d.]+)\s*GB/);
        if (!ramMatch) {
            return { canRun: true, reason: 'Unknown RAM requirement' };
        }
        
        const requiredRAM = parseFloat(ramMatch[1]);
        
        // Get available RAM (approximate)
        const availableRAM = this.getAvailableRAM();
        
        if (availableRAM < requiredRAM) {
            return {
                canRun: false,
                reason: `Requires ${requiredRAM}GB RAM, device has ~${availableRAM}GB`
            };
        }
        
        return { canRun: true, reason: 'Device meets requirements' };
    }
    
    /**
     * Get available RAM (approximate)
     * @returns {number}
     */
    getAvailableRAM() {
        // This is an approximation based on device type
        if (navigator.deviceMemory) {
            return navigator.deviceMemory;
        }
        
        // Default estimates based on device type
        if (/Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            return 4; // Mobile devices typically have 4-6GB
        }
        
        return 8; // Desktop default
    }
    
    /**
     * Preload all models (for demo purposes)
     */
    async preloadAllModels() {
        const modelIds = Object.keys(AVAILABLE_MODELS);
        
        for (const modelId of modelIds) {
            try {
                const canRun = await this.canRunModel(modelId);
                if (canRun.canRun) {
                    await this.loadModel(modelId, this.onProgress);
                } else {
                    console.log(`Skipping model ${modelId}: ${canRun.reason}`);
                }
            } catch (error) {
                console.error(`Failed to preload model ${modelId}:`, error);
            }
        }
    }
    
    /**
     * Subscribe to engine events
     * @param {string} event - Event type
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(event, callback) {
        if (!this.listeners) {
            this.listeners = new Map();
        }
        
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        
        this.listeners.get(event).add(callback);
        
        return () => {
            const listeners = this.listeners.get(event);
            if (listeners) {
                listeners.delete(callback);
                if (listeners.size === 0) {
                    this.listeners.delete(event);
                }
            }
        };
    }
    
    /**
     * Notify all subscribers
     * @param {string} event - Event type
     * @param {*} data - Event data
     */
    notifyListeners(event, data) {
        if (!this.listeners) return;
        
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in WebLLM listener:', error);
                }
            });
        }
    }
    
    /**
     * Clean up
     */
    cleanup() {
        this.isLoading = false;
        this.error = null;
        this.chatHistory = [];
        
        if (this.listeners) {
            this.listeners.clear();
        }
        
        // Note: We don't unload the engine here as it might be in use
    }
}

// Create singleton instance
const webllmEngine = new WebLLMEngine();

// Export for use in other modules
export default webllmEngine;
export { AVAILABLE_MODELS, MODEL_CATEGORIES };
