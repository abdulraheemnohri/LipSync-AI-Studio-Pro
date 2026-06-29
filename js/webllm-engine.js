// WebLLM Engine
import settings from './settings.js';

const AVAILABLE_MODELS = {
  'gemma-2-2b-it-q4f16_1': { name: 'Gemma 2B', size: '2.4 GB', ram: '4 GB' },
  'qwen2.5-3b-instruct-q4f16_1': { name: 'Qwen 3B', size: '3.8 GB', ram: '4-6 GB' },
  'llama-3.2-1b-instruct-q4f16_1': { name: 'Llama 3.2 1B', size: '1.2 GB', ram: '2-4 GB' },
  'llama-3.1-8b-instruct-q4f16_1': { name: 'Llama 3.1 8B', size: '7.2 GB', ram: '8-12 GB' }
};

class WebLLMEngine {
  constructor() {
    this.engine = null;
    this.currentModel = null;
    this.isLoading = false;
    this.loadProgress = 0;
    this.chatHistory = [];
  }
  
  async init() {
    try {
      if (!window.webllm) {
        const script = document.createElement('script');
        script.src = 'https://esm.run/@mlc-ai/web-llm';
        script.type = 'module';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      return true;
    } catch (error) {
      console.error('WebLLM init error:', error);
      return false;
    }
  }
  
  async loadModel(modelId) {
    if (this.isLoading) return false;
    if (!AVAILABLE_MODELS[modelId]) return false;
    
    this.isLoading = true;
    this.loadProgress = 0;
    
    try {
      if (window.webllm && webllm.CreateMLCEngine) {
        this.engine = await webllm.CreateMLCEngine(modelId, {
          initProgressCallback: (progress) => {
            this.loadProgress = progress * 100;
          }
        });
        this.currentModel = modelId;
        this.isLoading = false;
        return true;
      }
      return false;
    } catch (error) {
      this.isLoading = false;
      console.error('Load model error:', error);
      return false;
    }
  }
  
  async chat(message, options = {}) {
    if (!this.engine) throw new Error('Model not loaded');
    
    const { temperature = 0.7, maxTokens = 1024 } = options;
    this.chatHistory.push({ role: 'user', content: message });
    
    const messages = this.chatHistory.map(m => ({ role: m.role, content: m.content }));
    const response = await this.engine.chat.completions.create({
      messages,
      temperature,
      max_gen_len: maxTokens
    });
    
    const reply = response.choices[0].message.content;
    this.chatHistory.push({ role: 'assistant', content: reply });
    return reply;
  }
  
  getAvailableModels() {
    return AVAILABLE_MODELS;
  }
  
  getCurrentModelInfo() {
    return this.currentModel ? AVAILABLE_MODELS[this.currentModel] : null;
  }
  
  getStatus() {
    return {
      isLoading: this.isLoading,
      currentModel: this.currentModel,
      loadProgress: this.loadProgress
    };
  }
}

const webllmEngine = new WebLLMEngine();
export default webllmEngine;
export { AVAILABLE_MODELS };