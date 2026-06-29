/**
 * LipSync AI Studio Pro - Simplified Main Application
 * This version ensures the loading screen hides and basic functionality works
 */

// Global app variable
var app = null;

// Main Application Class
function LipSyncAIStudioPro() {
    this.isLoading = true;
    this.loadingProgress = 0;
    
    // DOM Elements
    this.loadingScreen = null;
    this.loadingStatus = null;
    this.loadingProgressBar = null;
    this.appContainer = null;
}

// Initialize the application
LipSyncAIStudioPro.prototype.init = async function() {
    try {
        console.log('[App] Starting initialization...');
        
        // Get DOM elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingStatus = document.getElementById('loading-status');
        this.loadingProgressBar = document.getElementById('loading-progress');
        this.appContainer = document.getElementById('app');
        
        // Update status
        this.updateStatus(5, 'Getting DOM elements...');
        
        if (!this.loadingScreen || !this.appContainer) {
            throw new Error('Required DOM elements not found');
        }
        
        // Initialize components step by step
        this.updateStatus(10, 'Initializing Settings...');
        window.settings = new SettingsManager();
        
        this.updateStatus(20, 'Initializing Database...');
        window.database = new DatabaseManager();
        await window.database.init();
        
        this.updateStatus(30, 'Initializing WebLLM Engine...');
        window.webllmEngine = new WebLLMEngine();
        
        this.updateStatus(40, 'Initializing Audio Engine...');
        window.audioEngine = new AudioEngine();
        
        this.updateStatus(50, 'Initializing LipSync Engine...');
        window.lipsyncEngine = new LipSyncEngine();
        
        this.updateStatus(60, 'Initializing Avatar Engine...');
        window.avatarEngine = new AvatarEngine();
        
        this.updateStatus(70, 'Initializing Camera Engine...');
        window.cameraEngine = new CameraEngine();
        
        this.updateStatus(80, 'Initializing Exporter...');
        window.exporter = new Exporter();
        
        this.updateStatus(90, 'Connecting components...');
        this.connectComponents();
        
        this.updateStatus(95, 'Finalizing...');
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Initialize UI
        this.initUI();
        
        console.log('[App] Initialization complete!');
        return true;
        
    } catch (error) {
        console.error('[App] Initialization error:', error);
        this.updateStatus(100, 'Error: ' + error.message);
        
        // Hide loading screen even on error
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 2000);
        
        throw error;
    }
};

// Update loading status
LipSyncAIStudioPro.prototype.updateStatus = function(progress, message) {
    this.loadingProgress = progress;
    if (this.loadingProgressBar) {
        this.loadingProgressBar.style.width = progress + '%';
    }
    if (this.loadingStatus) {
        this.loadingStatus.textContent = message;
    }
};

// Hide loading screen
LipSyncAIStudioPro.prototype.hideLoadingScreen = function() {
    this.isLoading = false;
    if (this.loadingScreen) {
        this.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
        }, 500);
    }
    if (this.appContainer) {
        this.appContainer.style.opacity = '1';
    }
};

// Connect all components
LipSyncAIStudioPro.prototype.connectComponents = function() {
    try {
        // Connect LipSync to Avatar
        if (window.avatarEngine && window.lipsyncEngine) {
            window.avatarEngine.setLipSyncEngine(window.lipsyncEngine);
        }
        
        // Initialize canvas elements
        if (window.avatarEngine) {
            window.avatarEngine.initWithCanvas('avatar-canvas');
            window.avatarEngine.startRendering();
        }
        
        if (window.cameraEngine) {
            window.cameraEngine.initWithVideo('camera-video');
            window.cameraEngine.initWithCanvas('camera-canvas');
        }
        
        console.log('[App] Components connected');
    } catch (error) {
        console.error('[App] Error connecting components:', error);
    }
};

// Initialize UI
LipSyncAIStudioPro.prototype.initUI = function() {
    try {
        // Initialize navigation
        this.initNavigation();
        
        // Initialize pages
        this.initPages();
        
        console.log('[App] UI initialized');
    } catch (error) {
        console.error('[App] Error initializing UI:', error);
    }
};

// Initialize navigation
LipSyncAIStudioPro.prototype.initNavigation = function() {
    try {
        const navItems = document.querySelectorAll('.nav-item');
        const self = this;
        
        navItems.forEach(function(item) {
            const page = item.dataset.page;
            item.addEventListener('click', function() {
                self.navigateTo(page);
            });
        });
        
        console.log('[App] Navigation initialized');
    } catch (error) {
        console.error('[App] Error initializing navigation:', error);
    }
};

// Navigate to page
LipSyncAIStudioPro.prototype.navigateTo = function(page) {
    try {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(function(p) {
            p.classList.remove('active');
        });
        
        // Show selected page
        const targetPage = document.getElementById(page);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update nav items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(function(item) {
            if (item.dataset.page === page) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        console.log('[App] Navigated to: ' + page);
    } catch (error) {
        console.error('[App] Error navigating to page:', error);
    }
};

// Initialize all pages
LipSyncAIStudioPro.prototype.initPages = function() {
    try {
        // Dashboard
        this.initDashboard();
        
        // Avatar Studio
        this.initAvatarStudio();
        
        // LipSync Control
        this.initLipSyncControl();
        
        // Voice Studio
        this.initVoiceStudio();
        
        // AI Chat
        this.initAIChat();
        
        // Model Manager
        this.initModelManager();
        
        // Settings
        this.initSettings();
        
        console.log('[App] All pages initialized');
    } catch (error) {
        console.error('[App] Error initializing pages:', error);
    }
};

// Initialize Dashboard
LipSyncAIStudioPro.prototype.initDashboard = function() {
    try {
        if (window.avatarEngine) {
            window.avatarEngine.initWithCanvas('avatar-canvas');
            window.avatarEngine.startRendering();
            window.avatarEngine.startBlinking();
        }
        
        // Add button handlers
        const btnBlink = document.getElementById('btn-blink');
        if (btnBlink && window.avatarEngine) {
            btnBlink.addEventListener('click', function() {
                window.avatarEngine.blink();
            });
        }
        
        const btnSmile = document.getElementById('btn-smile');
        if (btnSmile && window.avatarEngine) {
            btnSmile.addEventListener('click', function() {
                window.avatarEngine.setExpression('happy');
            });
        }
        
        const btnTalk = document.getElementById('btn-talk');
        if (btnTalk && window.avatarEngine) {
            btnTalk.addEventListener('click', function() {
                window.avatarEngine.setExpression('talking');
            });
        }
        
        console.log('[App] Dashboard initialized');
    } catch (error) {
        console.error('[App] Error initializing dashboard:', error);
    }
};

// Initialize Avatar Studio
LipSyncAIStudioPro.prototype.initAvatarStudio = function() {
    try {
        if (window.avatarEngine) {
            window.avatarEngine.initWithCanvas('avatar-editor-canvas');
        }
        
        // Avatar controls
        const faceScale = document.getElementById('face-scale');
        if (faceScale && window.avatarEngine) {
            faceScale.addEventListener('input', function(e) {
                window.avatarEngine.setScale(e.target.value / 100);
                document.getElementById('face-scale-value').textContent = e.target.value + '%';
            });
        }
        
        console.log('[App] Avatar Studio initialized');
    } catch (error) {
        console.error('[App] Error initializing avatar studio:', error);
    }
};

// Initialize LipSync Control
LipSyncAIStudioPro.prototype.initLipSyncControl = function() {
    try {
        if (window.avatarEngine) {
            window.avatarEngine.initWithCanvas('lipsync-canvas');
        }
        
        const btnStart = document.getElementById('btn-start-lipsync');
        if (btnStart) {
            btnStart.addEventListener('click', function() {
                if (window.lipsyncEngine) {
                    window.lipsyncEngine.start();
                }
                if (window.cameraEngine) {
                    window.cameraEngine.start();
                }
            });
        }
        
        const btnStop = document.getElementById('btn-stop-lipsync');
        if (btnStop) {
            btnStop.addEventListener('click', function() {
                if (window.lipsyncEngine) {
                    window.lipsyncEngine.stop();
                }
                if (window.cameraEngine) {
                    window.cameraEngine.stop();
                }
            });
        }
        
        console.log('[App] LipSync Control initialized');
    } catch (error) {
        console.error('[App] Error initializing LipSync control:', error);
    }
};

// Initialize Voice Studio
LipSyncAIStudioPro.prototype.initVoiceStudio = function() {
    try {
        const btnRecord = document.getElementById('btn-record-voice');
        if (btnRecord && window.audioEngine) {
            btnRecord.addEventListener('click', function() {
                if (window.audioEngine.isRecording()) {
                    window.audioEngine.stopRecording();
                } else {
                    window.audioEngine.startRecording();
                }
            });
        }
        
        console.log('[App] Voice Studio initialized');
    } catch (error) {
        console.error('[App] Error initializing voice studio:', error);
    }
};

// Initialize AI Chat
LipSyncAIStudioPro.prototype.initAIChat = function() {
    try {
        this.chatContainer = document.getElementById('chat-messages');
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('btn-send-message');
        const self = this;
        
        if (chatInput) {
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    self.sendChatMessage();
                }
            });
        }
        
        if (sendButton) {
            sendButton.addEventListener('click', function() {
                self.sendChatMessage();
            });
        }
        
        console.log('[App] AI Chat initialized');
    } catch (error) {
        console.error('[App] Error initializing AI chat:', error);
    }
};

// Send chat message
LipSyncAIStudioPro.prototype.sendChatMessage = function() {
    try {
        const input = document.getElementById('chat-input');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        input.value = '';
        
        // Add user message
        this.addChatMessage('user', message);
        
        // Simulate AI response
        setTimeout(() => {
            this.addChatMessage('ai', 'Hello! How can I help you today?');
        }, 1000);
        
    } catch (error) {
        console.error('[App] Error sending chat message:', error);
    }
};

// Add chat message to UI
LipSyncAIStudioPro.prototype.addChatMessage = function(role, content) {
    try {
        if (!this.chatContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message ' + role;
        
        const avatarElement = document.createElement('div');
        avatarElement.className = 'message-avatar';
        avatarElement.innerHTML = role === 'user' ? '<span class="material-icons">person</span>' : '<span class="material-icons">android</span>';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.textContent = content;
        
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = new Date().toLocaleTimeString();
        
        messageElement.appendChild(avatarElement);
        messageElement.appendChild(contentElement);
        messageElement.appendChild(timeElement);
        
        this.chatContainer.appendChild(messageElement);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        
    } catch (error) {
        console.error('[App] Error adding chat message:', error);
    }
};

// Initialize Model Manager
LipSyncAIStudioPro.prototype.initModelManager = function() {
    try {
        this.modelListContainer = document.getElementById('model-list');
        if (this.modelListContainer) {
            this.populateModelList();
        }
        console.log('[App] Model Manager initialized');
    } catch (error) {
        console.error('[App] Error initializing model manager:', error);
    }
};

// Populate model list
LipSyncAIStudioPro.prototype.populateModelList = function() {
    try {
        if (!this.modelListContainer) return;
        
        const models = [
            { id: 'gemma-2b', name: 'Gemma 2B', size: '1.5 GB', ram: '4 GB' },
            { id: 'qwen-3b', name: 'Qwen 3B', size: '2 GB', ram: '6 GB' },
            { id: 'llama-3.2-1b', name: 'Llama 3.2 1B', size: '0.8 GB', ram: '3 GB' },
            { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', size: '5 GB', ram: '12 GB' }
        ];
        
        this.modelListContainer.innerHTML = '';
        
        models.forEach(function(model) {
            const modelElement = document.createElement('div');
            modelElement.className = 'model-card';
            modelElement.innerHTML = '
                <div class="model-info">
                    <h4>' + model.name + '</h4>
                    <p>Size: ' + model.size + '</p>
                    <p>RAM: ' + model.ram + '</p>
                </div>
                <button class="btn btn-primary btn-load-model" data-model-id="' + model.id + '">Load</button>
            ';
            
            modelElement.querySelector('.btn-load-model').addEventListener('click', function() {
                alert('Loading model: ' + model.name);
            });
            
            this.modelListContainer.appendChild(modelElement);
        }.bind(this));
        
    } catch (error) {
        console.error('[App] Error populating model list:', error);
    }
};

// Initialize Settings
LipSyncAIStudioPro.prototype.initSettings = function() {
    try {
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', function(e) {
                e.preventDefault();
                alert('Settings saved!');
            });
        }
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', function(e) {
                if (e.target.checked) {
                    document.body.classList.add('dark-theme');
                } else {
                    document.body.classList.remove('dark-theme');
                }
            });
        }
        
        console.log('[App] Settings initialized');
    } catch (error) {
        console.error('[App] Error initializing settings:', error);
    }
};

// Show notification
LipSyncAIStudioPro.prototype.showNotification = function(message, duration) {
    try {
        duration = duration || 3000;
        
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(function() {
            notification.style.opacity = '1';
        }, 10);
        
        setTimeout(function() {
            notification.style.opacity = '0';
            setTimeout(function() {
                notification.remove();
            }, 300);
        }, duration);
        
    } catch (error) {
        console.error('[App] Error showing notification:', error);
    }
};

// Make available globally
window.LipSyncAIStudioPro = LipSyncAIStudioPro;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        window.app = new LipSyncAIStudioPro();
        window.app.init().catch(function(error) {
            console.error('Failed to initialize app:', error);
        });
    });
} else {
    window.app = new LipSyncAIStudioPro();
    window.app.init().catch(function(error) {
        console.error('Failed to initialize app:', error);
    });
}