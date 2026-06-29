// Settings Manager
const DEFAULT_SETTINGS = {
  ai: { model: 'gemma-2-2b-it-q4f16_1', temperature: 0.7, gpuEnabled: true },
  lipsync: { detectionMode: 'balanced', fps: 30 }
};

class SettingsManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.loadSettings();
  }
  
  loadSettings() {
    try {
      const saved = localStorage.getItem('lipsync-settings');
      if (saved) this.settings = { ...this.settings, ...JSON.parse(saved) };
    } catch (e) {}
  }
  
  saveSettings() {
    try {
      localStorage.setItem('lipsync-settings', JSON.stringify(this.settings));
    } catch (e) {}
  }
  
  get(path, defaultValue) {
    const keys = path.split('.');
    let value = this.settings;
    for (const key of keys) {
      if (value && value.hasOwnProperty(key)) value = value[key];
      else return defaultValue;
    }
    return value !== undefined ? value : defaultValue;
  }
  
  set(path, value) {
    const keys = path.split('.');
    let current = this.settings;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
    this.saveSettings();
  }
}

const settings = new SettingsManager();
export default settings;