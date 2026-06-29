/**
 * LipSync AI Studio Pro - Main Application
 * Core application logic and orchestration
 * Manages all components and user interactions
 */

class LipSyncAIStudioPro {
  constructor() {
    // Application state
    this.state = {
      currentPage: 'dashboard',
      isLoading: true,
      loadingProgress: 0,
      loadingMessage: 'Initializing...',
      isWebLLMReady: false,
      isGPUAvailable: false,
      memoryUsage: 0,
      fps: 0,
      lastFpsUpdate: 0,
      frameCount: 0
    };
    
    // Components
    this.components = {
      settings: null,
      database: null,
      webllmEngine: null,
      audioEngine: null,
      lipsyncEngine: null,
      avatarEngine: null,
      cameraEngine: null,
      exporter: null
    };
    
    // DOM elements
    this.elements = {
      app: null,
      loadingScreen: null,
      loadingStatus: null,
      loadingProgress: null,
      sidebar: null,
      mainContent: null,
      pages: {},
      navItems: []
    };
    
    // Models
    this.models = {
      available: [
        { id: 'gemma-2b', name: 'Gemma 2B', size: '1.5 GB', ramRequired: '4 GB', type: 'text' },
        { id: 'qwen-3b', name: 'Qwen 3B', size: '2 GB', ramRequired: '6 GB', type: 'text' },
        { id: 'llama-3.2-1b', name: 'Llama 3.2 1B', size: '0.8 GB', ramRequired: '3 GB', type: 'text' },
        { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', size: '5 GB', ramRequired: '12 GB', type: 'text' }
      ],
      loaded: null,
      loading: null
    };
    
    // Avatars
    this.avatars = {
      list: [],
      current: null
    };
    
    // Chat
    this.chat = {
      messages: [],
      currentSession: null,
      isTyping: false
    };
    
    // Animations
    this.animations = {
      active: null,
      queue: [],
      isPlaying: false
    };
    
    // Callbacks
    this.callbacks = {
      onStateChange: null,
      onModelLoaded: null,
      onModelLoadError: null,
      onChatMessage: null,
      onAnimationStart: null,
      onAnimationEnd: null
    };
    
    this.init();
  }
  
  async init() {
    console.log('[App] Initializing LipSync AI Studio Pro...');
    
    // Initialize components
    await this.initComponents();
    
    // Initialize DOM
    this.initDOM();
    
    // Initialize event listeners
    this.initEventListeners();
    
    // Load settings
    await this.loadSettings();
    
    // Load avatars
    await this.loadAvatars();
    
    // Check GPU support
    this.checkGPUSupport();
    
    // Initialize WebLLM
    await this.initWebLLM();
    
    // Hide loading screen
    this.hideLoadingScreen();
    
    // Start rendering loop
    this.startRenderingLoop();
    
    console.log('[App] Initialization complete');
  }
  
  // Initialize all components
  async initComponents() {
    console.log('[App] Initializing components...');
    
    try {
      // Settings Manager
      this.components.settings = new SettingsManager();
      this.updateLoadingProgress(10, 'Initializing Settings Manager...');
      
      // Database Manager
      this.components.database = new DatabaseManager();
      await this.components.database.init();
      this.updateLoadingProgress(20, 'Initializing Database Manager...');
      
      // WebLLM Engine
      this.components.webllmEngine = new WebLLMEngine();
      this.updateLoadingProgress(30, 'Initializing WebLLM Engine...');
      
      // Audio Engine
      this.components.audioEngine = new AudioEngine();
      this.updateLoadingProgress(40, 'Initializing Audio Engine...');
      
      // LipSync Engine
      this.components.lipsyncEngine = new LipSyncEngine();
      this.updateLoadingProgress(50, 'Initializing LipSync Engine...');
      
      // Avatar Engine
      this.components.avatarEngine = new AvatarEngine();
      this.updateLoadingProgress(60, 'Initializing Avatar Engine...');
      
      // Camera Engine
      this.components.cameraEngine = new CameraEngine();
      this.updateLoadingProgress(70, 'Initializing Camera Engine...');
      
      // Exporter
      this.components.exporter = new Exporter();
      this.updateLoadingProgress(80, 'Initializing Exporter...');
      
      // Connect components
      this.connectComponents();
      
      console.log('[App] All components initialized');
    } catch (error) {
      console.error('[App] Error initializing components:', error);
      this.updateLoadingProgress(100, 'Error: ' + error.message);
    }
  }
  
  // Connect components together
  connectComponents() {
    console.log('[App] Connecting components...');
    
    // Connect LipSync Engine to Avatar Engine
    this.components.avatarEngine.setLipSyncEngine(this.components.lipsyncEngine);
    
    // Set up camera with video element
    this.components.cameraEngine.initWithVideo('camera-video');
    this.components.cameraEngine.initWithCanvas('camera-canvas');
    
    // Set up avatar with canvas
    this.components.avatarEngine.initWithCanvas('avatar-canvas');
    this.components.avatarEngine.initWithCanvas('avatar-editor-canvas');
    
    // Set up exporter callbacks
    this.components.exporter.on('onExportStart', (info) => {
      this.showNotification(`Exporting ${info.type}...`);
    });
    
    this.components.exporter.on('onExportComplete', (result) => {
      this.showNotification(`${result.type.toUpperCase()} export complete!`);
    });
    
    this.components.exporter.on('onExportError', (error) => {
      this.showNotification(`Export error: ${error}`);
    });
    
    // Set up camera callbacks
    this.components.cameraEngine.on('onFaceDetected', (face) => {
      this.updateFaceTrackingStatus(face);
    });
    
    this.components.cameraEngine.on('onNoFaceDetected', () => {
      this.updateFaceTrackingStatus(null);
    });
    
    // Set up audio engine callbacks
    this.components.audioEngine.on('onRecordingStart', () => {
      this.updateAudioStatus('recording');
    });
    
    this.components.audioEngine.on('onRecordingStop', () => {
      this.updateAudioStatus('idle');
    });
    
    console.log('[App] Components connected');
  }
  
  // Update loading progress
  updateLoadingProgress(progress, message) {
    this.state.loadingProgress = progress;
    this.state.loadingMessage = message;
    
    if (this.elements.loadingProgress) {
      this.elements.loadingProgress.style.width = `${progress}%`;
    }
    
    if (this.elements.loadingStatus) {
      this.elements.loadingStatus.textContent = message;
    }
  }
  
  // Initialize DOM elements
  initDOM() {
    console.log('[App] Initializing DOM...');
    
    this.elements.app = document.getElementById('app');
    this.elements.loadingScreen = document.getElementById('loading-screen');
    this.elements.loadingStatus = document.getElementById('loading-status');
    this.elements.loadingProgress = document.getElementById('loading-progress');
    this.elements.sidebar = document.querySelector('.sidebar');
    this.elements.mainContent = document.querySelector('.main-content');
    
    // Initialize pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      const id = page.id;
      this.elements.pages[id] = page;
    });
    
    // Initialize nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const page = item.dataset.page;
      this.elements.navItems.push({
        element: item,
        page: page
      });
      
      // Add click event
      item.addEventListener('click', () => this.navigateTo(page));
    });
    
    // Initialize quick action buttons
    this.initQuickActions();
    
    // Initialize all page-specific elements
    this.initDashboard();
    this.initAvatarStudio();
    this.initLipSyncControl();
    this.initVoiceStudio();
    this.initAIChat();
    this.initModelManager();
    this.initSettings();
    
    console.log('[App] DOM initialized');
  }
  
  // Initialize quick action buttons
  initQuickActions() {
    const quickActionButtons = document.querySelectorAll('.quick-action-btn');
    quickActionButtons.forEach(btn => {
      const action = btn.dataset.action;
      btn.addEventListener('click', () => this.handleQuickAction(action));
    });
  }
  
  // Handle quick actions
  handleQuickAction(action) {
    console.log(`[App] Quick action: ${action}`);
    
    switch (action) {
      case 'new-avatar':
        this.navigateTo('avatar-studio');
        this.createNewAvatar();
        break;
      case 'record-voice':
        this.navigateTo('voice-studio');
        this.startVoiceRecording();
        break;
      case 'ai-chat':
        this.navigateTo('ai-chat');
        break;
      case 'export':
        this.exportCurrentProject();
        break;
      case 'load-model':
        this.navigateTo('model-manager');
        break;
      case 'test-lipsync':
        this.navigateTo('lipsync-control');
        this.testLipSync();
        break;
    }
  }
  
  // Initialize Dashboard
  initDashboard() {
    // Avatar preview canvas
    this.components.avatarEngine.initWithCanvas('avatar-canvas');
    
    // Avatar control buttons
    const avatarButtons = {
      blink: document.getElementById('btn-blink'),
      smile: document.getElementById('btn-smile'),
      talk: document.getElementById('btn-talk'),
      sad: document.getElementById('btn-sad'),
      angry: document.getElementById('btn-angry'),
      neutral: document.getElementById('btn-neutral')
    };
    
    avatarButtons.blink?.addEventListener('click', () => {
      this.components.avatarEngine.blink();
    });
    
    avatarButtons.smile?.addEventListener('click', () => {
      this.components.avatarEngine.setExpression('happy');
    });
    
    avatarButtons.talk?.addEventListener('click', () => {
      this.components.avatarEngine.setExpression('talking');
    });
    
    avatarButtons.sad?.addEventListener('click', () => {
      this.components.avatarEngine.setExpression('sad');
    });
    
    avatarButtons.angry?.addEventListener('click', () => {
      this.components.avatarEngine.setExpression('angry');
    });
    
    avatarButtons.neutral?.addEventListener('click', () => {
      this.components.avatarEngine.setExpression('neutral');
    });
    
    // Dashboard action buttons
    document.getElementById('btn-create-script')?.addEventListener('click', () => {
      this.createNewScript();
    });
    
    document.getElementById('btn-upload-voice')?.addEventListener('click', () => {
      this.uploadVoice();
    });
    
    document.getElementById('btn-start-animation')?.addEventListener('click', () => {
      this.startAnimation();
    });
    
    // System status updates
    this.updateSystemStatus();
    
    // Start avatar rendering
    this.components.avatarEngine.startRendering();
    this.components.avatarEngine.startBlinking();
  }
  
  // Initialize Avatar Studio
  initAvatarStudio() {
    // Avatar editor
    this.components.avatarEngine.initWithCanvas('avatar-editor-canvas');
    
    // Avatar style select
    const styleSelect = document.getElementById('avatar-style-select');
    styleSelect?.addEventListener('change', (e) => {
      this.changeAvatarStyle(e.target.value);
    });
    
    // Avatar controls
    const controls = {
      faceScale: document.getElementById('face-scale'),
      headRotation: document.getElementById('head-rotation'),
      eyeSize: document.getElementById('eye-size'),
      skinColor: document.getElementById('skin-color'),
      eyeColor: document.getElementById('eye-color'),
      hairColor: document.getElementById('hair-color'),
      mouthColor: document.getElementById('mouth-color')
    };
    
    controls.faceScale?.addEventListener('input', (e) => {
      const value = e.target.value;
      this.components.avatarEngine.setScale(value / 100);
      document.getElementById('face-scale-value').textContent = `${value}%`;
    });
    
    controls.headRotation?.addEventListener('input', (e) => {
      const value = e.target.value;
      this.components.avatarEngine.setRotation(value);
      document.getElementById('head-rotation-value').textContent = `${value}°`;
    });
    
    controls.eyeSize?.addEventListener('input', (e) => {
      const value = e.target.value;
      document.getElementById('eye-size-value').textContent = `${value}%`;
    });
    
    controls.skinColor?.addEventListener('input', (e) => {
      this.updateAvatarColor('skin', e.target.value);
    });
    
    controls.eyeColor?.addEventListener('input', (e) => {
      this.updateAvatarColor('eyes', e.target.value);
    });
    
    controls.hairColor?.addEventListener('input', (e) => {
      this.updateAvatarColor('hair', e.target.value);
    });
    
    controls.mouthColor?.addEventListener('input', (e) => {
      this.updateAvatarColor('mouth', e.target.value);
    });
    
    // Avatar buttons
    document.getElementById('btn-import-avatar')?.addEventListener('click', () => {
      this.importAvatar();
    });
    
    document.getElementById('avatar-upload-input')?.addEventListener('change', (e) => {
      this.handleAvatarUpload(e.target);
    });
    
    document.getElementById('btn-save-avatar')?.addEventListener('click', () => {
      this.saveAvatar();
    });
    
    document.getElementById('btn-new-avatar')?.addEventListener('click', () => {
      this.createNewAvatar();
    });
    
    // Avatar name input
    const nameInput = document.getElementById('avatar-name-input');
    nameInput?.addEventListener('change', (e) => {
      this.updateCurrentAvatarName(e.target.value);
    });
  }
  
  // Initialize LipSync Control
  initLipSyncControl() {
    // LipSync canvas
    this.components.avatarEngine.initWithCanvas('lipsync-canvas');
    
    // LipSync controls
    document.getElementById('btn-start-lipsync')?.addEventListener('click', () => {
      this.startLipSync();
    });
    
    document.getElementById('btn-stop-lipsync')?.addEventListener('click', () => {
      this.stopLipSync();
    });
    
    document.getElementById('btn-test-microphone')?.addEventListener('click', () => {
      this.testMicrophone();
    });
    
    document.getElementById('btn-calibrate-lipsync')?.addEventListener('click', () => {
      this.calibrateLipSync();
    });
    
    // LipSync settings
    const sensitivitySlider = document.getElementById('lipsync-sensitivity');
    sensitivitySlider?.addEventListener('input', (e) => {
      const value = e.target.value / 100;
      this.components.lipsyncEngine.setVolumeThreshold(value);
      document.getElementById('lipsync-sensitivity-value').textContent = `${e.target.value}%`;
    });
    
    const smoothingSlider = document.getElementById('lipsync-smoothing');
    smoothingSlider?.addEventListener('input', (e) => {
      const value = e.target.value / 100;
      this.components.lipsyncEngine.setSmoothingFactor(value);
      document.getElementById('lipsync-smoothing-value').textContent = `${e.target.value}%`;
    });
  }
  
  // Initialize Voice Studio
  initVoiceStudio() {
    // Voice recording
    document.getElementById('btn-record-voice')?.addEventListener('click', () => {
      this.toggleVoiceRecording();
    });
    
    document.getElementById('btn-stop-recording')?.addEventListener('click', () => {
      this.stopVoiceRecording();
    });
    
    document.getElementById('btn-play-recording')?.addEventListener('click', () => {
      this.playVoiceRecording();
    });
    
    document.getElementById('btn-save-recording')?.addEventListener('click', () => {
      this.saveVoiceRecording();
    });
    
    document.getElementById('btn-analyze-voice')?.addEventListener('click', () => {
      this.analyzeVoice();
    });
    
    // Voice effects
    const effectButtons = {
      normal: document.getElementById('btn-effect-normal'),
      robot: document.getElementById('btn-effect-robot'),
      echo: document.getElementById('btn-effect-echo'),
      highPitch: document.getElementById('btn-effect-high-pitch'),
      lowPitch: document.getElementById('btn-effect-low-pitch')
    };
    
    Object.entries(effectButtons).forEach(([effect, btn]) => {
      btn?.addEventListener('click', () => {
        this.applyVoiceEffect(effect);
      });
    });
  }
  
  // Initialize AI Chat
  initAIChat() {
    // Chat container
    this.chatContainer = document.getElementById('chat-messages');
    
    // Chat input
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('btn-send-message');
    
    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendChatMessage();
      }
    });
    
    sendButton?.addEventListener('click', () => {
      this.sendChatMessage();
    });
    
    // Chat settings
    document.getElementById('btn-new-chat')?.addEventListener('click', () => {
      this.startNewChat();
    });
    
    document.getElementById('btn-clear-chat')?.addEventListener('click', () => {
      this.clearChat();
    });
    
    // Model select
    const modelSelect = document.getElementById('chat-model-select');
    modelSelect?.addEventListener('change', (e) => {
      this.changeChatModel(e.target.value);
    });
    
    // Load chat history
    this.loadChatHistory();
  }
  
  // Initialize Model Manager
  initModelManager() {
    // Model list
    this.modelListContainer = document.getElementById('model-list');
    
    // Model actions
    document.getElementById('btn-refresh-models')?.addEventListener('click', () => {
      this.refreshModelList();
    });
    
    document.getElementById('btn-download-model')?.addEventListener('click', () => {
      this.downloadModel();
    });
    
    document.getElementById('btn-delete-model')?.addEventListener('click', () => {
      this.deleteModel();
    });
    
    // Model info
    this.updateModelInfo();
    
    // Populate model list
    this.populateModelList();
  }
  
  // Initialize Settings
  initSettings() {
    // Settings form
    const settingsForm = document.getElementById('settings-form');
    settingsForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettings();
    });
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle?.addEventListener('change', (e) => {
      this.toggleTheme(e.target.checked);
    });
    
    // Load current settings
    this.loadCurrentSettings();
  }
  
  // Initialize event listeners
  initEventListeners() {
    console.log('[App] Initializing event listeners...');
    
    // Window events
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('beforeunload', () => this.handleBeforeUnload());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Visibility change
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    
    // Service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('[App] Service Worker registered');
        })
        .catch(error => {
          console.error('[App] Service Worker registration failed:', error);
        });
    }
  }
  
  // Handle window resize
  handleResize() {
    if (this.components.avatarEngine) {
      this.components.avatarEngine.resizeCanvas();
    }
    if (this.components.cameraEngine) {
      this.components.cameraEngine.drawDetectionOverlay();
    }
  }
  
  // Handle before unload
  handleBeforeUnload() {
    // Save current state
    this.saveCurrentState();
  }
  
  // Handle key down
  handleKeyDown(e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      this.saveCurrentProject();
    }
    
    // Escape to go back to dashboard
    if (e.key === 'Escape') {
      this.navigateTo('dashboard');
    }
  }
  
  // Handle visibility change
  handleVisibilityChange() {
    if (document.hidden) {
      // Pause animations when tab is not visible
      if (this.components.avatarEngine) {
        this.components.avatarEngine.stopRendering();
      }
      if (this.components.cameraEngine) {
        this.components.cameraEngine.stop();
      }
    } else {
      // Resume when tab becomes visible
      if (this.components.avatarEngine) {
        this.components.avatarEngine.startRendering();
      }
    }
  }
  
  // Navigate to page
  navigateTo(page) {
    if (this.state.currentPage === page) return;
    
    // Hide current page
    if (this.elements.pages[this.state.currentPage]) {
      this.elements.pages[this.state.currentPage].classList.remove('active');
    }
    
    // Update nav items
    this.elements.navItems.forEach(item => {
      if (item.page === page) {
        item.element.classList.add('active');
      } else {
        item.element.classList.remove('active');
      }
    });
    
    // Show new page
    if (this.elements.pages[page]) {
      this.elements.pages[page].classList.add('active');
      this.state.currentPage = page;
      
      // Page-specific initialization
      this.onPageChange(page);
    }
    
    console.log(`[App] Navigated to: ${page}`);
  }
  
  // Handle page change
  onPageChange(page) {
    switch (page) {
      case 'dashboard':
        this.updateDashboard();
        break;
      case 'avatar-studio':
        this.updateAvatarStudio();
        break;
      case 'lipsync-control':
        this.updateLipSyncControl();
        break;
      case 'voice-studio':
        this.updateVoiceStudio();
        break;
      case 'ai-chat':
        this.updateAIChat();
        break;
      case 'model-manager':
        this.updateModelManager();
        break;
      case 'settings':
        this.updateSettings();
        break;
    }
  }
  
  // Update Dashboard
  updateDashboard() {
    this.updateSystemStatus();
    this.updateStatistics();
  }
  
  // Update System Status
  updateSystemStatus() {
    // WebLLM status
    const webllmStatus = this.components.webllmEngine ? 
      (this.components.webllmEngine.isReady() ? 'Ready' : 'Initializing...') : 'Not Loaded';
    const webllmStatusDot = document.getElementById('webllm-status-dot');
    const webllmStatusText = document.getElementById('webllm-status');
    
    if (webllmStatusDot) {
      webllmStatusDot.style.backgroundColor = this.components.webllmEngine?.isReady() ? '#4caf50' : '#ffc107';
    }
    if (webllmStatusText) {
      webllmStatusText.textContent = webllmStatus;
    }
    
    // GPU status
    const gpuStatus = this.state.isGPUAvailable ? 'Available' : 'Not Available';
    const gpuStatusDot = document.getElementById('gpu-status-dot');
    const gpuStatusText = document.getElementById('gpu-status');
    
    if (gpuStatusDot) {
      gpuStatusDot.style.backgroundColor = this.state.isGPUAvailable ? '#4caf50' : '#f44336';
    }
    if (gpuStatusText) {
      gpuStatusText.textContent = gpuStatus;
    }
    
    // Memory usage
    const memoryUsageElement = document.getElementById('memory-usage');
    if (memoryUsageElement) {
      memoryUsageElement.textContent = `${Math.round(this.state.memoryUsage)}%`;
    }
    
    // Model info (small)
    if (this.models.loaded) {
      const modelNameSmall = document.getElementById('model-name-small');
      const modelSizeSmall = document.getElementById('model-size-small');
      const modelRamSmall = document.getElementById('model-ram-small');
      
      const model = this.models.available.find(m => m.id === this.models.loaded);
      if (model && modelNameSmall) {
        modelNameSmall.textContent = model.name;
        modelSizeSmall.textContent = model.size;
        modelRamSmall.textContent = model.ramRequired;
      }
    }
  }
  
  // Update Statistics
  updateStatistics() {
    // These would be loaded from database
    const totalAvatarsElement = document.getElementById('total-avatars');
    const totalAudioElement = document.getElementById('total-audio');
    const totalChatsElement = document.getElementById('total-chats');
    const totalModelsElement = document.getElementById('total-models');
    
    if (totalAvatarsElement) {
      totalAvatarsElement.textContent = this.avatars.list.length;
    }
    if (totalAudioElement) {
      totalAudioElement.textContent = 0; // Would be from database
    }
    if (totalChatsElement) {
      totalChatsElement.textContent = this.chat.messages.length;
    }
    if (totalModelsElement) {
      totalModelsElement.textContent = this.models.available.filter(m => m.loaded).length;
    }
  }
  
  // Check GPU support
  async checkGPUSupport() {
    try {
      // Check WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          this.state.isGPUAvailable = renderer && renderer.includes('Intel') === false;
        } else {
          this.state.isGPUAvailable = true;
        }
      }
      
      // Check WebGPU support
      if (navigator.gpu) {
        try {
          await navigator.gpu.requestAdapter();
          this.state.isGPUAvailable = true;
        } catch (e) {
          // WebGPU not available, but WebGL might be
        }
      }
      
      console.log(`[App] GPU Support: ${this.state.isGPUAvailable}`);
    } catch (error) {
      console.error('[App] Error checking GPU support:', error);
      this.state.isGPUAvailable = false;
    }
  }
  
  // Initialize WebLLM
  async initWebLLM() {
    try {
      console.log('[App] Initializing WebLLM...');
      this.updateLoadingProgress(85, 'Loading AI models...');
      
      // Initialize WebLLM engine
      await this.components.webllmEngine.init();
      
      // Check if models are already loaded
      const loadedModels = await this.components.webllmEngine.getLoadedModels();
      
      if (loadedModels.length > 0) {
        this.models.loaded = loadedModels[0].id;
      }
      
      this.state.isWebLLMReady = true;
      this.updateLoadingProgress(90, 'AI models ready!');
      
      console.log('[App] WebLLM initialized');
    } catch (error) {
      console.error('[App] Error initializing WebLLM:', error);
      this.updateLoadingProgress(90, 'AI models: Error loading');
    }
  }
  
  // Load settings
  async loadSettings() {
    try {
      console.log('[App] Loading settings...');
      
      const settings = await this.components.settings.loadAll();
      
      // Apply loaded settings
      if (settings.theme === 'dark') {
        document.body.classList.add('dark-theme');
      }
      
      if (settings.lipSyncEnabled !== undefined) {
        this.components.lipsyncEngine.setVolumeThreshold(settings.lipSyncSensitivity || 0.01);
        this.components.lipsyncEngine.setSmoothingFactor(settings.lipSyncSmoothing || 0.8);
      }
      
      console.log('[App] Settings loaded');
    } catch (error) {
      console.error('[App] Error loading settings:', error);
    }
  }
  
  // Load avatars
  async loadAvatars() {
    try {
      console.log('[App] Loading avatars...');
      
      // Load from database
      this.avatars.list = await this.components.database.getAvatars();
      
      // If no avatars, create default ones
      if (this.avatars.list.length === 0) {
        const defaultAvatar = this.components.avatarEngine.createAvatar({
          id: 'default',
          name: 'Default Avatar',
          type: 'human',
          style: 'cartoon'
        });
        
        const robotAvatar = this.components.avatarEngine.createAvatar({
          id: 'robot',
          name: 'Robot Avatar',
          type: 'robot',
          style: 'mechanical'
        });
        
        this.avatars.list = [defaultAvatar, robotAvatar];
        
        // Save to database
        await this.components.database.saveAvatar(defaultAvatar);
        await this.components.database.saveAvatar(robotAvatar);
      }
      
      // Set current avatar
      this.avatars.current = this.avatars.list[0];
      this.components.avatarEngine.setAvatar(this.avatars.current.id);
      
      console.log(`[App] Loaded ${this.avatars.list.length} avatars`);
    } catch (error) {
      console.error('[App] Error loading avatars:', error);
    }
  }
  
  // Hide loading screen
  hideLoadingScreen() {
    this.state.isLoading = false;
    
    if (this.elements.loadingScreen) {
      this.elements.loadingScreen.style.opacity = '0';
      setTimeout(() => {
        this.elements.loadingScreen.style.display = 'none';
      }, 500);
    }
    
    if (this.elements.app) {
      this.elements.app.style.opacity = '1';
    }
  }
  
  // Start rendering loop
  startRenderingLoop() {
    let lastTime = 0;
    
    const render = (timestamp) => {
      if (!lastTime) {
        lastTime = timestamp;
      }
      
      const elapsed = timestamp - lastTime;
      
      // Update FPS
      this.frameCount++;
      if (timestamp - this.state.lastFpsUpdate >= 1000) {
        this.state.fps = Math.round((this.frameCount * 1000) / (timestamp - this.state.lastFpsUpdate));
        this.frameCount = 0;
        this.state.lastFpsUpdate = timestamp;
        
        // Update FPS display
        const fpsCounter = document.getElementById('fps-counter');
        if (fpsCounter) {
          fpsCounter.textContent = this.state.fps;
        }
      }
      
      // Render all active components
      if (this.components.avatarEngine) {
        this.components.avatarEngine.render();
      }
      
      if (this.components.cameraEngine && this.state.currentPage === 'lipsync-control') {
        this.components.cameraEngine.drawDetectionOverlay();
      }
      
      lastTime = timestamp;
      requestAnimationFrame(render);
    };
    
    requestAnimationFrame(render);
  }
  
  // Show notification
  showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    // Hide notification
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  }
  
  // Update face tracking status
  updateFaceTrackingStatus(face) {
    const faceTrackingStatus = document.getElementById('face-tracking-status');
    if (faceTrackingStatus) {
      if (face) {
        faceTrackingStatus.textContent = `Face detected (${Math.round(face.confidence * 100)}%)`;
        faceTrackingStatus.style.color = '#4caf50';
      } else {
        faceTrackingStatus.textContent = 'No face detected';
        faceTrackingStatus.style.color = '#f44336';
      }
    }
  }
  
  // Update audio status
  updateAudioStatus(status) {
    const audioStatus = document.getElementById('audio-status');
    if (audioStatus) {
      audioStatus.textContent = status;
      audioStatus.style.color = status === 'recording' ? '#f44336' : '#4caf50';
    }
  }
  
  // Update model info
  updateModelInfo() {
    const currentModelElement = document.getElementById('current-model');
    const gpuAccelerationElement = document.getElementById('gpu-acceleration');
    const memoryUsageElement = document.getElementById('memory-usage');
    const modelInfoElement = document.getElementById('model-info-small');
    
    if (currentModelElement) {
      const modelName = this.models.loaded ? 
        this.models.available.find(m => m.id === this.models.loaded)?.name : 
        'Not Loaded';
      currentModelElement.textContent = modelName;
    }
    
    if (gpuAccelerationElement) {
      gpuAccelerationElement.textContent = this.state.isGPUAvailable ? 'Enabled' : 'Disabled';
    }
    
    if (memoryUsageElement) {
      memoryUsageElement.textContent = `${Math.round(this.state.memoryUsage)}%`;
    }
    
    if (modelInfoElement) {
      modelInfoElement.style.display = this.models.loaded ? 'block' : 'none';
    }
  }
  
  // Create new avatar
  createNewAvatar() {
    const avatarId = 'avatar-' + Date.now();
    const newAvatar = this.components.avatarEngine.createAvatar({
      id: avatarId,
      name: 'New Avatar',
      type: 'human',
      style: 'cartoon'
    });
    
    this.avatars.list.push(newAvatar);
    this.avatars.current = newAvatar;
    this.components.avatarEngine.setAvatar(avatarId);
    
    // Update UI
    if (this.state.currentPage === 'avatar-studio') {
      this.updateAvatarStudio();
    }
    
    this.showNotification('New avatar created!');
  }
  
  // Change avatar style
  changeAvatarStyle(style) {
    if (!this.avatars.current) return;
    
    this.avatars.current.style = style;
    this.components.avatarEngine.setAvatar(this.avatars.current.id);
    
    this.showNotification(`Avatar style changed to ${style}`);
  }
  
  // Update avatar color
  updateAvatarColor(part, color) {
    if (!this.avatars.current) return;
    
    this.avatars.current.colors[part] = color;
    this.components.avatarEngine.setAvatar(this.avatars.current.id);
  }
  
  // Update current avatar name
  updateCurrentAvatarName(name) {
    if (!this.avatars.current) return;
    
    this.avatars.current.name = name;
  }
  
  // Import avatar
  importAvatar() {
    const input = document.getElementById('avatar-upload-input');
    if (input) {
      input.click();
    }
  }
  
  // Handle avatar upload
  handleAvatarUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      
      // Create new avatar from image
      const avatarId = 'imported-' + Date.now();
      const newAvatar = this.components.avatarEngine.createAvatar({
        id: avatarId,
        name: file.name.replace('.\w+$', ''),
        type: 'custom',
        style: 'photo'
      });
      
      // Save image data
      newAvatar.imageData = dataUrl;
      
      this.avatars.list.push(newAvatar);
      this.avatars.current = newAvatar;
      this.components.avatarEngine.setAvatar(avatarId);
      
      // Save to database
      this.components.database.saveAvatar(newAvatar);
      
      this.showNotification('Avatar imported!');
    };
    
    reader.readAsDataURL(file);
    input.value = '';
  }
  
  // Save avatar
  saveAvatar() {
    if (!this.avatars.current) {
      this.showNotification('No avatar to save!');
      return;
    }
    
    // Update avatar in database
    this.components.database.saveAvatar(this.avatars.current);
    
    this.showNotification('Avatar saved!');
  }
  
  // Start LipSync
  async startLipSync() {
    try {
      // Start camera
      await this.components.cameraEngine.start();
      
      // Start LipSync engine
      await this.components.lipsyncEngine.start();
      
      // Start avatar rendering
      this.components.avatarEngine.startRendering();
      
      this.showNotification('LipSync started!');
    } catch (error) {
      this.showNotification('Error starting LipSync: ' + error.message);
    }
  }
  
  // Stop LipSync
  stopLipSync() {
    this.components.lipsyncEngine.stop();
    this.components.cameraEngine.stop();
    
    this.showNotification('LipSync stopped');
  }
  
  // Test LipSync
  testLipSync() {
    this.startLipSync();
    
    // Auto-stop after 10 seconds
    setTimeout(() => {
      this.stopLipSync();
    }, 10000);
  }
  
  // Test microphone
  async testMicrophone() {
    try {
      const hasAccess = await this.components.lipsyncEngine.start();
      if (hasAccess) {
        this.showNotification('Microphone test: Success!');
        
        // Stop after 3 seconds
        setTimeout(() => {
          this.components.lipsyncEngine.stop();
        }, 3000);
      } else {
        this.showNotification('Microphone test: Failed - Access denied');
      }
    } catch (error) {
      this.showNotification('Microphone test: Error - ' + error.message);
    }
  }
  
  // Calibrate LipSync
  calibrateLipSync() {
    this.showNotification('LipSync calibration: Adjust sliders and speak normally');
  }
  
  // Start voice recording
  startVoiceRecording() {
    this.components.audioEngine.startRecording();
    this.updateAudioStatus('recording');
    this.showNotification('Recording started...');
  }
  
  // Stop voice recording
  stopVoiceRecording() {
    const recording = this.components.audioEngine.stopRecording();
    this.updateAudioStatus('idle');
    this.showNotification('Recording stopped');
    
    return recording;
  }
  
  // Toggle voice recording
  toggleVoiceRecording() {
    if (this.components.audioEngine.isRecording()) {
      this.stopVoiceRecording();
    } else {
      this.startVoiceRecording();
    }
  }
  
  // Play voice recording
  playVoiceRecording() {
    this.components.audioEngine.playRecording();
    this.showNotification('Playing recording...');
  }
  
  // Save voice recording
  saveVoiceRecording() {
    const recording = this.components.audioEngine.getCurrentRecording();
    if (!recording) {
      this.showNotification('No recording to save!');
      return;
    }
    
    // Save to database
    const recordingData = {
      id: 'recording-' + Date.now(),
      data: recording.audioData,
      duration: recording.duration,
      timestamp: new Date().toISOString()
    };
    
    this.components.database.saveRecording(recordingData);
    this.showNotification('Recording saved!');
  }
  
  // Analyze voice
  async analyzeVoice() {
    const recording = this.components.audioEngine.getCurrentRecording();
    if (!recording) {
      this.showNotification('No recording to analyze!');
      return;
    }
    
    try {
      const analysis = await this.components.lipsyncEngine.analyzeAudioFile(
        new File([recording.audioBlob], 'recording.webm', { type: 'audio/webm' })
      );
      
      this.showNotification(`Voice analysis complete: ${analysis.length} frames analyzed`);
    } catch (error) {
      this.showNotification('Voice analysis failed: ' + error.message);
    }
  }
  
  // Apply voice effect
  applyVoiceEffect(effect) {
    this.components.audioEngine.applyEffect(effect);
    this.showNotification(`Voice effect: ${effect}`);
  }
  
  // Send chat message
  async sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Clear input
    input.value = '';
    
    // Add user message to chat
    this.addChatMessage('user', message);
    
    // Show typing indicator
    this.setTypingIndicator(true);
    
    try {
      // Get response from AI
      const response = await this.components.webllmEngine.generateText(message);
      
      // Add AI response
      this.addChatMessage('ai', response);
      
      // Trigger callback
      if (this.callbacks.onChatMessage) {
        this.callbacks.onChatMessage({ role: 'ai', content: response });
      }
    } catch (error) {
      this.addChatMessage('ai', `Error: ${error.message}`);
    } finally {
      this.setTypingIndicator(false);
    }
  }
  
  // Add chat message
  addChatMessage(role, content) {
    const message = {
      id: 'msg-' + Date.now(),
      role: role,
      content: content,
      timestamp: new Date().toISOString()
    };
    
    this.chat.messages.push(message);
    
    // Update UI
    this.renderChatMessage(message);
    
    // Save to database
    this.components.database.saveChatMessage(message);
    
    // Update notification dot
    this.updateChatNotification();
  }
  
  // Render chat message
  renderChatMessage(message) {
    if (!this.chatContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${message.role}`;
    
    const avatarElement = document.createElement('div');
    avatarElement.className = 'message-avatar';
    avatarElement.innerHTML = message.role === 'user' ? 
      '<span class="material-icons">person</span>' : 
      '<span class="material-icons">android</span>';
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.textContent = message.content;
    
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = new Date(message.timestamp).toLocaleTimeString();
    
    messageElement.appendChild(avatarElement);
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timeElement);
    
    this.chatContainer.appendChild(messageElement);
    
    // Scroll to bottom
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }
  
  // Set typing indicator
  setTypingIndicator(show) {
    this.chat.isTyping = show;
    
    const typingIndicator = document.getElementById('chat-typing-indicator');
    if (typingIndicator) {
      typingIndicator.style.display = show ? 'block' : 'none';
    }
  }
  
  // Start new chat
  startNewChat() {
    this.chat.messages = [];
    this.chat.currentSession = 'session-' + Date.now();
    
    // Clear chat container
    if (this.chatContainer) {
      this.chatContainer.innerHTML = '';
    }
    
    this.showNotification('New chat started');
  }
  
  // Clear chat
  clearChat() {
    this.chat.messages = [];
    
    if (this.chatContainer) {
      this.chatContainer.innerHTML = '';
    }
    
    // Clear from database
    this.components.database.clearChatMessages();
    
    this.showNotification('Chat cleared');
  }
  
  // Change chat model
  changeChatModel(modelId) {
    this.models.loaded = modelId;
    this.updateModelInfo();
    this.showNotification(`Model changed to: ${modelId}`);
  }
  
  // Load chat history
  async loadChatHistory() {
    try {
      this.chat.messages = await this.components.database.getChatMessages();
      
      // Render all messages
      this.chat.messages.forEach(message => this.renderChatMessage(message));
      
      // Scroll to bottom
      if (this.chatContainer) {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
      }
    } catch (error) {
      console.error('[App] Error loading chat history:', error);
    }
  }
  
  // Update chat notification
  updateChatNotification() {
    const notificationDot = document.getElementById('new-message-notification');
    if (notificationDot) {
      notificationDot.style.display = this.chat.messages.length > 0 ? 'inline' : 'none';
    }
  }
  
  // Populate model list
  populateModelList() {
    if (!this.modelListContainer) return;
    
    this.modelListContainer.innerHTML = '';
    
    this.models.available.forEach(model => {
      const modelElement = document.createElement('div');
      modelElement.className = 'model-card';
      
      const isLoaded = this.models.loaded === model.id;
      
      modelElement.innerHTML = `
        <div class="model-info">
          <h4>${model.name}</h4>
          <p>Size: ${model.size}</p>
          <p>RAM: ${model.ramRequired}</p>
          <p>Type: ${model.type}</p>
        </div>
        <div class="model-actions">
          <button class="btn ${isLoaded ? 'btn-secondary' : 'btn-primary'} btn-load-model" data-model-id="${model.id}">
            ${isLoaded ? 'Loaded' : 'Load'}
          </button>
          ${isLoaded ? '<button class="btn btn-danger btn-unload-model" data-model-id="' + model.id + '">Unload</button>' : ''}
        </div>
        <div class="model-status">
          <span class="status-dot ${isLoaded ? 'loaded' : 'not-loaded'}"></span>
          <span>${isLoaded ? 'Ready' : 'Available'}</span>
        </div>
      `;
      
      // Add event listeners
      const loadButton = modelElement.querySelector('.btn-load-model');
      loadButton?.addEventListener('click', () => {
        if (isLoaded) {
          this.showNotification(`${model.name} is already loaded`);
        } else {
          this.loadModel(model.id);
        }
      });
      
      const unloadButton = modelElement.querySelector('.btn-unload-model');
      unloadButton?.addEventListener('click', () => {
        this.unloadModel(model.id);
      });
      
      this.modelListContainer.appendChild(modelElement);
    });
  }
  
  // Load model
  async loadModel(modelId) {
    try {
      this.models.loading = modelId;
      this.updateModelList();
      
      // Load model via WebLLM engine
      await this.components.webllmEngine.loadModel(modelId);
      
      this.models.loaded = modelId;
      this.models.loading = null;
      
      this.updateModelList();
      this.updateModelInfo();
      this.showNotification(`Model loaded: ${modelId}`);
    } catch (error) {
      this.models.loading = null;
      this.updateModelList();
      this.showNotification(`Error loading model: ${error.message}`);
    }
  }
  
  // Unload model
  async unloadModel(modelId) {
    try {
      await this.components.webllmEngine.unloadModel(modelId);
      
      if (this.models.loaded === modelId) {
        this.models.loaded = null;
      }
      
      this.updateModelList();
      this.updateModelInfo();
      this.showNotification(`Model unloaded: ${modelId}`);
    } catch (error) {
      this.showNotification(`Error unloading model: ${error.message}`);
    }
  }
  
  // Refresh model list
  refreshModelList() {
    this.populateModelList();
    this.showNotification('Model list refreshed');
  }
  
  // Download model
  downloadModel() {
    this.showNotification('Model download feature coming soon!');
  }
  
  // Delete model
  deleteModel() {
    this.showNotification('Model deletion feature coming soon!');
  }
  
  // Update model list
  updateModelList() {
    this.populateModelList();
  }
  
  // Update Model Manager
  updateModelManager() {
    this.updateModelInfo();
    this.populateModelList();
  }
  
  // Load current settings
  loadCurrentSettings() {
    const settings = this.components.settings.getAll();
    
    // Update form fields
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.checked = settings.theme === 'dark';
    }
    
    const volumeSlider = document.getElementById('master-volume');
    if (volumeSlider) {
      volumeSlider.value = settings.volume || 100;
    }
    
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
      languageSelect.value = settings.language || 'en';
    }
  }
  
  // Toggle theme
  toggleTheme(isDark) {
    if (isDark) {
      document.body.classList.add('dark-theme');
      this.components.settings.set('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      this.components.settings.set('theme', 'light');
    }
    
    this.components.settings.save();
    this.showNotification(`Theme: ${isDark ? 'Dark' : 'Light'}`);
  }
  
  // Save settings
  saveSettings() {
    const form = document.getElementById('settings-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const settings = {};
    
    for (const [key, value] of formData.entries()) {
      settings[key] = value;
    }
    
    // Save settings
    this.components.settings.setAll(settings);
    this.components.settings.save();
    
    this.showNotification('Settings saved!');
  }
  
  // Update Settings
  updateSettings() {
    this.loadCurrentSettings();
  }
  
  // Save current project
  async saveCurrentProject() {
    try {
      const projectData = {
        id: 'project-' + Date.now(),
        timestamp: new Date().toISOString(),
        avatar: this.avatars.current,
        chat: this.chat.messages,
        settings: this.components.settings.getAll()
      };
      
      await this.components.database.saveProject(projectData);
      this.showNotification('Project saved!');
    } catch (error) {
      this.showNotification('Error saving project: ' + error.message);
    }
  }
  
  // Save current state
  saveCurrentState() {
    const state = {
      currentPage: this.state.currentPage,
      currentAvatar: this.avatars.current?.id,
      loadedModel: this.models.loaded,
      timestamp: new Date().toISOString()
    };
    
    this.components.settings.set('lastState', state);
    this.components.settings.save();
  }
  
  // Export current project
  async exportCurrentProject() {
    try {
      const projectData = {
        avatar: this.avatars.current,
        chat: this.chat.messages,
        settings: this.components.settings.getAll(),
        timestamp: new Date().toISOString()
      };
      
      const jsonUrl = this.components.exporter.exportAsJSON(projectData);
      
      // Download the file
      const filename = `lipsync-project-${new Date().toISOString().slice(0, 10)}.json`;
      this.components.exporter.downloadFile(jsonUrl, filename);
      
      this.showNotification('Project exported as JSON!');
    } catch (error) {
      this.showNotification('Error exporting project: ' + error.message);
    }
  }
  
  // Create new script
  createNewScript() {
    this.showNotification('Script creation feature coming soon!');
  }
  
  // Upload voice
  uploadVoice() {
    this.showNotification('Voice upload feature coming soon!');
  }
  
  // Start animation
  startAnimation() {
    this.showNotification('Animation feature coming soon!');
  }
  
  // Update Avatar Studio
  updateAvatarStudio() {
    // Update avatar editor with current avatar
    if (this.avatars.current) {
      document.getElementById('avatar-name-input').value = this.avatars.current.name;
    }
  }
  
  // Update LipSync Control
  updateLipSyncControl() {
    // Update LipSync status
    const lipsyncStatus = this.components.lipsyncEngine.getStatus();
    const lipsyncStatusElement = document.getElementById('lipsync-status');
    
    if (lipsyncStatusElement) {
      lipsyncStatusElement.textContent = lipsyncStatus.isListening ? 'Active' : 'Inactive';
      lipsyncStatusElement.style.color = lipsyncStatus.isListening ? '#4caf50' : '#f44336';
    }
  }
  
  // Update Voice Studio
  updateVoiceStudio() {
    // Update recording status
    const recordingStatus = this.components.audioEngine.isRecording();
    const recordButton = document.getElementById('btn-record-voice');
    
    if (recordButton) {
      recordButton.textContent = recordingStatus ? 'Stop Recording' : 'Start Recording';
      recordButton.className = recordingStatus ? 'btn btn-danger' : 'btn btn-primary';
    }
  }
  
  // Update AI Chat
  updateAIChat() {
    // Update model select
    const modelSelect = document.getElementById('chat-model-select');
    if (modelSelect) {
      modelSelect.innerHTML = this.models.available.map(model => 
        `<option value="${model.id}" ${this.models.loaded === model.id ? 'selected' : ''}>${model.name}</option>`
      ).join('');
    }
    
    // Update chat notification
    this.updateChatNotification();
  }
  
  // Register callback
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = callback;
    }
  }
  
  // Get application state
  getState() {
    return { ...this.state };
  }
  
  // Get all components
  getComponents() {
    return { ...this.components };
  }
  
  // Clean up
  destroy() {
    console.log('[App] Cleaning up...');
    
    // Save current state
    this.saveCurrentState();
    
    // Stop all components
    Object.values(this.components).forEach(component => {
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    });
    
    console.log('[App] Cleanup complete');
  }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LipSyncAIStudioPro;
}

// Export for browser
window.LipSyncAIStudioPro = LipSyncAIStudioPro;

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new LipSyncAIStudioPro();
});
