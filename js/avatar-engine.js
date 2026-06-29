/**
 * LipSync AI Studio Pro - Avatar Engine
 * 2D avatar rendering with canvas
 */

function AvatarEngine() {
    this.canvas = null;
    this.context = null;
    this.avatars = {};
    this.currentAvatarId = 'default';
    this.currentExpression = 'neutral';
    this.lipSyncEngine = null;
    this.lipSyncEnabled = false;
    this.animationFrameId = null;
    this.scale = 1;
    this.rotation = 0;
    this.position = { x: 0, y: 0 };
    
    // Create default avatar
    this.avatars.default = this.createDefaultAvatar();
    this.avatars.robot = this.createRobotAvatar();
    
    console.log('[Avatar Engine] Initialized');
}

// Create default avatar
AvatarEngine.prototype.createDefaultAvatar = function() {
    return {
        id: 'default',
        name: 'Default Avatar',
        type: 'human',
        colors: {
            skin: '#ffdbac',
            hair: '#2c1810',
            eyes: '#2c1810',
            mouth: '#e07b7b',
            outline: '#000000'
        },
        features: {
            face: { width: 400, height: 500 },
            eyes: { size: 80, spacing: 160, position: 180 },
            mouth: { size: 100, position: 380 }
        }
    };
};

// Create robot avatar
AvatarEngine.prototype.createRobotAvatar = function() {
    return {
        id: 'robot',
        name: 'Robot Avatar',
        type: 'robot',
        colors: {
            body: '#4a6baf',
            eyes: '#ffffff',
            mouth: '#ff6b6b',
            outline: '#2a3a5f'
        },
        features: {
            head: { width: 450, height: 600 },
            eyes: { size: 60, spacing: 180, position: 200 },
            mouth: { size: 80, position: 350 }
        }
    };
};

// Initialize with canvas
AvatarEngine.prototype.initWithCanvas = function(canvasId) {
    var canvasElement = document.getElementById(canvasId);
    if (!canvasElement) {
        console.error('[Avatar Engine] Canvas not found:', canvasId);
        return false;
    }
    
    this.canvas = canvasElement;
    this.context = canvasElement.getContext('2d');
    this.resizeCanvas();
    
    // Add resize listener
    var self = this;
    window.addEventListener('resize', function() {
        self.resizeCanvas();
    });
    
    console.log('[Avatar Engine] Initialized with canvas:', canvasId);
    return true;
};

// Resize canvas
AvatarEngine.prototype.resizeCanvas = function() {
    if (!this.canvas) return;
    
    var container = this.canvas.parentElement;
    if (container) {
        var rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.scale = Math.min(this.canvas.width / 500, this.canvas.height / 500);
    }
};

// Set lip sync engine
AvatarEngine.prototype.setLipSyncEngine = function(engine) {
    this.lipSyncEngine = engine;
    this.lipSyncEnabled = !!engine;
    
    if (engine) {
        var self = this;
        engine.on('onLipChange', function(state, level) {
            self.updateMouthForLipSync(state, level);
        });
    }
    
    console.log('[Avatar Engine] LipSync engine set');
};

// Update mouth based on lip sync
AvatarEngine.prototype.updateMouthForLipSync = function(state, level) {
    if (!this.lipSyncEnabled) return;
    this.currentExpression = state;
};

// Set current avatar
AvatarEngine.prototype.setAvatar = function(avatarId) {
    if (this.avatars[avatarId]) {
        this.currentAvatarId = avatarId;
        return true;
    }
    console.error('[Avatar Engine] Avatar not found:', avatarId);
    return false;
};

// Set expression
AvatarEngine.prototype.setExpression = function(expression) {
    this.currentExpression = expression;
    console.log('[Avatar Engine] Expression set:', expression);
};

// Blink eyes
AvatarEngine.prototype.blink = function() {
    this.setExpression('blinking');
    var self = this;
    setTimeout(function() {
        self.setExpression('neutral');
    }, 200);
};

// Start blinking automatically
AvatarEngine.prototype.startBlinking = function() {
    var self = this;
    this.blinkInterval = setInterval(function() {
        if (self.currentExpression !== 'blinking') {
            self.blink();
        }
    }, 4000 + Math.random() * 2000);
};

// Stop blinking
AvatarEngine.prototype.stopBlinking = function() {
    if (this.blinkInterval) {
        clearInterval(this.blinkInterval);
        this.blinkInterval = null;
    }
};

// Start rendering
AvatarEngine.prototype.startRendering = function() {
    if (this.animationFrameId) {
        this.stopRendering();
    }
    
    var self = this;
    var render = function() {
        self.render();
        self.animationFrameId = requestAnimationFrame(render);
    };
    
    this.animationFrameId = requestAnimationFrame(render);
};

// Stop rendering
AvatarEngine.prototype.stopRendering = function() {
    if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
    }
};

// Render avatar
AvatarEngine.prototype.render = function() {
    if (!this.canvas || !this.context) return;
    
    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Save context
    this.context.save();
    
    // Apply transformations
    this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.context.scale(this.scale, this.scale);
    this.context.rotate(this.rotation * Math.PI / 180);
    
    // Draw avatar
    var avatar = this.avatars[this.currentAvatarId];
    if (avatar) {
        if (avatar.type === 'robot') {
            this.drawRobotAvatar(avatar);
        } else {
            this.drawHumanAvatar(avatar);
        }
    }
    
    // Restore context
    this.context.restore();
};

// Draw human avatar
AvatarEngine.prototype.drawHumanAvatar = function(avatar) {
    var ctx = this.context;
    var colors = avatar.colors;
    var features = avatar.features;
    
    // Draw face
    ctx.fillStyle = colors.skin;
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.ellipse(0, 0, features.face.width / 2, features.face.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw eyes
    var eyeY = features.eyes.position - features.face.height / 2;
    var eyeSpacing = features.eyes.spacing;
    var eyeSize = features.eyes.size;
    
    // Left eye
    if (this.currentExpression !== 'blinking') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-eyeSpacing / 2, eyeY, eyeSize / 2, eyeSize / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.outline;
        ctx.stroke();
        
        // Pupil
        ctx.fillStyle = colors.eyes;
        ctx.beginPath();
        ctx.arc(-eyeSpacing / 2, eyeY, eyeSize / 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Right eye
    if (this.currentExpression !== 'blinking') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(eyeSpacing / 2, eyeY, eyeSize / 2, eyeSize / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.outline;
        ctx.stroke();
        
        // Pupil
        ctx.fillStyle = colors.eyes;
        ctx.beginPath();
        ctx.arc(eyeSpacing / 2, eyeY, eyeSize / 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw mouth
    var mouthY = features.mouth.position - features.face.height / 2;
    var mouthSize = features.mouth.size;
    var mouthOpen = 0;
    
    // Adjust mouth based on expression
    if (this.currentExpression === 'happy' || this.currentExpression === 'talking') {
        mouthOpen = 0.5;
    } else if (this.currentExpression === 'sad') {
        mouthOpen = 0.2;
    } else if (this.currentExpression === 'angry') {
        mouthOpen = 0.3;
    } else if (this.currentExpression === 'slightlyOpen') {
        mouthOpen = 0.25;
    } else if (this.currentExpression === 'halfOpen') {
        mouthOpen = 0.5;
    } else if (this.currentExpression === 'open') {
        mouthOpen = 0.75;
    } else if (this.currentExpression === 'wideOpen') {
        mouthOpen = 1;
    }
    
    ctx.strokeStyle = colors.mouth;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    if (mouthOpen > 0) {
        ctx.quadraticCurveTo(0, mouthY + 20 * mouthOpen, mouthSize / 2, mouthY);
    } else {
        ctx.moveTo(-mouthSize / 2, mouthY);
        ctx.lineTo(mouthSize / 2, mouthY);
    }
    ctx.stroke();
};

// Draw robot avatar
AvatarEngine.prototype.drawRobotAvatar = function(avatar) {
    var ctx = this.context;
    var colors = avatar.colors;
    var features = avatar.features;
    
    var headWidth = features.head.width;
    var headHeight = features.head.height;
    
    // Draw head
    ctx.fillStyle = colors.body;
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    ctx.rect(-headWidth / 2, -headHeight / 2 + 20, headWidth, headHeight - 40);
    ctx.fill();
    ctx.stroke();
    
    // Draw eyes
    var eyeSize = features.eyes.size;
    var eyeSpacing = features.eyes.spacing;
    var eyeY = features.eyes.position - headHeight / 2;
    
    ctx.fillStyle = colors.eyes;
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth = 2;
    
    // Left eye
    ctx.beginPath();
    ctx.rect(-eyeSpacing / 2 - eyeSize / 2, eyeY - eyeSize / 2, eyeSize, eyeSize);
    ctx.fill();
    ctx.stroke();
    
    // Right eye
    ctx.beginPath();
    ctx.rect(eyeSpacing / 2 - eyeSize / 2, eyeY - eyeSize / 2, eyeSize, eyeSize);
    ctx.fill();
    ctx.stroke();
    
    // Draw mouth
    var mouthY = features.mouth.position - headHeight / 2;
    var mouthSize = features.mouth.size;
    
    ctx.fillStyle = colors.mouth;
    ctx.strokeStyle = colors.outline;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.rect(-mouthSize / 2, mouthY - 10, mouthSize, 20);
    ctx.fill();
    ctx.stroke();
};

// Set scale
AvatarEngine.prototype.setScale = function(scale) {
    this.scale = Math.max(0.1, Math.min(3, scale));
};

// Set rotation
AvatarEngine.prototype.setRotation = function(degrees) {
    this.rotation = degrees % 360;
};

// Set position
AvatarEngine.prototype.setPosition = function(x, y) {
    this.position = { x: x, y: y };
};

// Export for browser
window.AvatarEngine = AvatarEngine;