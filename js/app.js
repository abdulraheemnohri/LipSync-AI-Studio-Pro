// Main Application
import webllmEngine from './webllm-engine.js';
import audioEngine from './audio-engine.js';
import lipSyncEngine from './lipsync-engine.js';
import avatarEngine from './avatar-engine.js';
import db from './database.js';
import settings from './settings.js';

async function init() {
  console.log('Initializing LipSync AI Studio Pro...');
  
  await db.init();
  await webllmEngine.init();
  
  setupUI();
  
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => loadingScreen.style.display = 'none', 500);
  }
  
  const avatarCanvas = document.getElementById('avatar-canvas');
  if (avatarCanvas) {
    avatarEngine.setCanvas(avatarCanvas);
    avatarEngine.startAnimation();
  }
  
  console.log('LipSync AI Studio Pro initialized!');
}

function setupUI() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      const pageId = item.dataset.page;
      document.getElementById(pageId)?.classList.add('active');
    });
  });
  
  // Update status
  setInterval(() => {
    const statusEl = document.getElementById('webllm-status');
    if (statusEl) {
      statusEl.textContent = webllmEngine.getStatus().isLoading ? 'Loading...' : 'Ready';
    }
    
    const modelEl = document.getElementById('current-model');
    if (modelEl) {
      const modelInfo = webllmEngine.getCurrentModelInfo();
      modelEl.textContent = modelInfo ? modelInfo.name : 'Not Loaded';
    }
  }, 1000);
}

document.addEventListener('DOMContentLoaded', init);