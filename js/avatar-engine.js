/**
 * LipSync AI Studio Pro - Avatar Engine
 * 2D and 3D avatar rendering with SVG and Canvas
 * Supports customizable avatars with facial expressions
 */

class AvatarEngine {
  constructor() {
    this.canvas = null;
    this.context = null;
    this.avatarCanvas = null;
    this.avatarContext = null;
    this.avatars = new Map();
    this.currentAvatar = null;
    this.defaultAvatar = null;
    this.expressions = {
      neutral: this.createNeutralExpression(),
      happy: this.createHappyExpression(),
      sad: this.createSadExpression(),
      angry: this.createAngryExpression(),
      surprised: this.createSurprisedExpression(),
      blinking: this.createBlinkingExpression(),
      talking: this.createTalkingExpression()
    };
    this.currentExpression = 'neutral';
    this.customExpression = null;
    this.lipSyncEnabled = false;
    this.lipSyncEngine = null;
    this.blinkTimer = null;
    this.blinkInterval = 4000; // 4 seconds
    this.isBlinking = false;
    this.blinkDuration = 200; // 200ms
    this.animationFrameId = null;
    this.lastUpdateTime = 0;
    this.fps = 60;
    this.scale = 1;
    this.rotation = 0;
    this.position = { x: 0, y: 0 };
    this.callbacks = {
      onExpressionChange: null,
      onBlink: null,
      onRender: null
    };
    
    this.init();
  }
  
  init() {
    console.log('[Avatar Engine] Initializing...');
    
    // Create default avatar
    this.defaultAvatar = this.createDefaultAvatar();
    this.currentAvatar = this.defaultAvatar;
    this.avatars.set('default', this.defaultAvatar);
    
    // Create robot avatar
    const robotAvatar = this.createRobotAvatar();
    this.avatars.set('robot', robotAvatar);
    
    console.log('[Avatar Engine] Initialization complete');
  }
  
  // Register callbacks
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = callback;
    }
  }
  
  // Initialize with canvas
  initWithCanvas(canvasId) {
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) {
      console.error(`[Avatar Engine] Canvas element with id '${canvasId}' not found`);
      return false;
    }
    
    this.canvas = canvasElement;
    this.context = canvasElement.getContext('2d');
    
    // Set canvas size
    this.resizeCanvas();
    
    // Add resize listener
    window.addEventListener('resize', () => this.resizeCanvas());
    
    console.log(`[Avatar Engine] Initialized with canvas: ${canvasId}`);
    return true;
  }
  
  // Resize canvas to match container
  resizeCanvas() {
    if (!this.canvas) return;
    
    const container = this.canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      
      // Calculate scale to fit avatar
      this.scale = Math.min(
        this.canvas.width / 500,
        this.canvas.height / 500
      );
    }
  }
  
  // Set lip-sync engine
  setLipSyncEngine(engine) {
    this.lipSyncEngine = engine;
    this.lipSyncEnabled = !!engine;
    
    if (engine) {
      engine.on('onLipChange', (state, level) => {
        this.updateMouthForLipSync(state, level);
      });
    }
    
    console.log('[Avatar Engine] LipSync engine set');
  }
  
  // Update mouth based on lip-sync
  updateMouthForLipSync(state, level) {
    if (!this.lipSyncEnabled) return;
    
    // Create custom expression based on lip-sync state
    this.customExpression = this.createExpressionFromLipState(state, level);
    this.currentExpression = 'custom';
    
    if (this.callbacks.onExpressionChange) {
      this.callbacks.onExpressionChange('custom', state);
    }
  }
  
  // Create expression from lip state
  createExpressionFromLipState(state, level) {
    const expression = { ...this.expressions.neutral };
    
    // Modify mouth based on state
    switch (state) {
      case 'closed':
        expression.mouth = { ...expression.mouth, open: 0, shape: 'line' };
        break;
      case 'slightlyOpen':
        expression.mouth = { ...expression.mouth, open: 0.25, shape: 'smile' };
        break;
      case 'halfOpen':
        expression.mouth = { ...expression.mouth, open: 0.5, shape: 'smile' };
        break;
      case 'open':
        expression.mouth = { ...expression.mouth, open: 0.75, shape: 'smile' };
        break;
      case 'wideOpen':
        expression.mouth = { ...expression.mouth, open: 1, shape: 'circle' };
        break;
    }
    
    return expression;
  }
  
  // Create default avatar
  createDefaultAvatar() {
    return {
      id: 'default',
      name: 'Default Avatar',
      type: 'human',
      style: 'cartoon',
      colors: {
        skin: '#ffdbac',
        hair: '#2c1810',
        eyes: '#000000',
        eyebrows: '#2c1810',
        mouth: '#e07b7b',
        outline: '#000000'
      },
      features: {
        face: { width: 400, height: 500, shape: 'oval' },
        head: { width: 450, height: 600 },
        eyes: { size: 80, spacing: 160, position: 180 },
        eyebrows: { thickness: 8, spacing: 160, position: 160 },
        nose: { size: 60, position: 320 },
        mouth: { size: 100, position: 380 }
      }
    };
  }
  
  // Create robot avatar
  createRobotAvatar() {
    return {
      id: 'robot',
      name: 'Robot Avatar',
      type: 'robot',
      style: 'mechanical',
      colors: {
        body: '#4a6baf',
        eyes: '#ffffff',
        mouth: '#ff6b6b',
        outline: '#2a3a5f',
        details: '#8a9bc2'
      },
      features: {
        face: { width: 400, height: 500, shape: 'rectangle' },
        head: { width: 450, height: 600 },
        eyes: { size: 60, spacing: 180, position: 200, shape: 'rectangle' },
        mouth: { size: 80, position: 350, shape: 'rectangle' },
        antenna: { length: 60, position: 50 }
      }
    };
  }
  
  // Create new custom avatar
  createAvatar(config) {
    const avatar = {
      id: config.id || 'custom-' + Date.now(),
      name: config.name || 'Custom Avatar',
      type: config.type || 'human',
      style: config.style || 'cartoon',
      colors: {
        skin: config.colors?.skin || '#ffdbac',
        hair: config.colors?.hair || '#2c1810',
        eyes: config.colors?.eyes || '#000000',
        eyebrows: config.colors?.eyebrows || '#2c1810',
        mouth: config.colors?.mouth || '#e07b7b',
        outline: config.colors?.outline || '#000000'
      },
      features: {
        face: { 
          width: config.features?.face?.width || 400, 
          height: config.features?.face?.height || 500, 
          shape: config.features?.face?.shape || 'oval' 
        },
        head: { 
          width: config.features?.head?.width || 450, 
          height: config.features?.head?.height || 600 
        },
        eyes: { 
          size: config.features?.eyes?.size || 80, 
          spacing: config.features?.eyes?.spacing || 160, 
          position: config.features?.eyes?.position || 180 
        },
        eyebrows: { 
          thickness: config.features?.eyebrows?.thickness || 8, 
          spacing: config.features?.eyebrows?.spacing || 160, 
          position: config.features?.eyebrows?.position || 160 
        },
        nose: { 
          size: config.features?.nose?.size || 60, 
          position: config.features?.nose?.position || 320 
        },
        mouth: { 
          size: config.features?.mouth?.size || 100, 
          position: config.features?.mouth?.position || 380 
        }
      }
    };
    
    this.avatars.set(avatar.id, avatar);
    console.log(`[Avatar Engine] Created avatar: ${avatar.id}`);
    return avatar;
  }
  
  // Set current avatar
  setAvatar(avatarId) {
    if (this.avatars.has(avatarId)) {
      this.currentAvatar = this.avatars.get(avatarId);
      this.customExpression = null;
      this.currentExpression = 'neutral';
      console.log(`[Avatar Engine] Set avatar: ${avatarId}`);
      return true;
    }
    console.error(`[Avatar Engine] Avatar not found: ${avatarId}`);
    return false;
  }
  
  // Get current avatar
  getCurrentAvatar() {
    return this.currentAvatar;
  }
  
  // Get all avatars
  getAllAvatars() {
    return Array.from(this.avatars.values());
  }
  
  // Set expression
  setExpression(expression) {
    if (this.expressions.hasOwnProperty(expression)) {
      this.currentExpression = expression;
      this.customExpression = null;
      console.log(`[Avatar Engine] Set expression: ${expression}`);
      
      if (this.callbacks.onExpressionChange) {
        this.callbacks.onExpressionChange(expression);
      }
      return true;
    }
    console.error(`[Avatar Engine] Expression not found: ${expression}`);
    return false;
  }
  
  // Get current expression
  getCurrentExpression() {
    return this.customExpression || this.expressions[this.currentExpression];
  }
  
  // Create neutral expression
  createNeutralExpression() {
    return {
      eyes: { open: 1, shape: 'circle', look: 'forward' },
      eyebrows: { raised: 0, shape: 'curved' },
      mouth: { open: 0, shape: 'line', smile: 0 },
      blush: 0
    };
  }
  
  // Create happy expression
  createHappyExpression() {
    return {
      eyes: { open: 0.9, shape: 'circle', look: 'forward' },
      eyebrows: { raised: -0.2, shape: 'curved' },
      mouth: { open: 0.5, shape: 'smile', smile: 1 },
      blush: 0.3
    };
  }
  
  // Create sad expression
  createSadExpression() {
    return {
      eyes: { open: 0.8, shape: 'circle', look: 'down' },
      eyebrows: { raised: 0.3, shape: 'angled' },
      mouth: { open: 0.2, shape: 'frown', smile: -0.5 },
      blush: 0
    };
  }
  
  // Create angry expression
  createAngryExpression() {
    return {
      eyes: { open: 0.7, shape: 'circle', look: 'forward' },
      eyebrows: { raised: -0.4, shape: 'angled' },
      mouth: { open: 0.3, shape: 'line', smile: -0.8 },
      blush: 0.5
    };
  }
  
  // Create surprised expression
  createSurprisedExpression() {
    return {
      eyes: { open: 1, shape: 'circle', look: 'forward' },
      eyebrows: { raised: 0.5, shape: 'curved' },
      mouth: { open: 0.8, shape: 'circle', smile: 0 },
      blush: 0.2
    };
  }
  
  // Create blinking expression
  createBlinkingExpression() {
    return {
      eyes: { open: 0, shape: 'line', look: 'forward' },
      eyebrows: { raised: 0, shape: 'curved' },
      mouth: { open: 0, shape: 'line', smile: 0 },
      blush: 0
    };
  }
  
  // Create talking expression
  createTalkingExpression() {
    return {
      eyes: { open: 0.9, shape: 'circle', look: 'forward' },
      eyebrows: { raised: 0, shape: 'curved' },
      mouth: { open: 0.7, shape: 'smile', smile: 0.3 },
      blush: 0.1
    };
  }
  
  // Blink eyes
  blink() {
    if (this.isBlinking) return;
    
    this.isBlinking = true;
    this.setExpression('blinking');
    
    if (this.callbacks.onBlink) {
      this.callbacks.onBlink();
    }
    
    setTimeout(() => {
      this.isBlinking = false;
      this.setExpression('neutral');
    }, this.blinkDuration);
  }
  
  // Start automatic blinking
  startBlinking() {
    if (this.blinkTimer) return;
    
    this.blinkTimer = setInterval(() => {
      // Random blink interval
      const randomInterval = this.blinkInterval + 
        (Math.random() * 2000 - 1000); // +/- 1 second
      
      setTimeout(() => {
        if (this.currentExpression !== 'blinking' && 
            this.currentExpression !== 'custom') {
          this.blink();
        }
      }, randomInterval);
    }, this.blinkInterval);
    
    console.log('[Avatar Engine] Automatic blinking started');
  }
  
  // Stop automatic blinking
  stopBlinking() {
    if (this.blinkTimer) {
      clearInterval(this.blinkTimer);
      this.blinkTimer = null;
      console.log('[Avatar Engine] Automatic blinking stopped');
    }
  }
  
  // Start rendering loop
  startRendering() {
    if (this.animationFrameId) {
      this.stopRendering();
    }
    
    const render = (timestamp) => {
      if (!this.lastUpdateTime) {
        this.lastUpdateTime = timestamp;
      }
      
      const elapsed = timestamp - this.lastUpdateTime;
      const targetFps = 1000 / this.fps;
      
      if (elapsed >= targetFps) {
        this.lastUpdateTime = timestamp - (elapsed % targetFps);
        this.render();
        
        if (this.callbacks.onRender) {
          this.callbacks.onRender();
        }
      }
      
      this.animationFrameId = requestAnimationFrame(render);
    };
    
    this.animationFrameId = requestAnimationFrame(render);
    console.log('[Avatar Engine] Rendering started');
  }
  
  // Stop rendering loop
  stopRendering() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      console.log('[Avatar Engine] Rendering stopped');
    }
  }
  
  // Main render function
  render() {
    if (!this.canvas || !this.context || !this.currentAvatar) return;
    
    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Save context state
    this.context.save();
    
    // Apply transformations
    this.context.translate(
      this.canvas.width / 2 + this.position.x,
      this.canvas.height / 2 + this.position.y
    );
    this.context.scale(this.scale, this.scale);
    this.context.rotate(this.rotation * Math.PI / 180);
    
    // Draw avatar based on type
    if (this.currentAvatar.type === 'robot') {
      this.drawRobotAvatar();
    } else {
      this.drawHumanAvatar();
    }
    
    // Restore context state
    this.context.restore();
  }
  
  // Draw human avatar
  drawHumanAvatar() {
    const avatar = this.currentAvatar;
    const expression = this.getCurrentExpression();
    const colors = avatar.colors;
    const features = avatar.features;
    
    // Draw head/face
    this.drawFace(features.face, colors);
    
    // Draw hair
    this.drawHair(features, colors);
    
    // Draw eyebrows
    this.drawEyebrows(features.eyebrows, expression.eyebrows, colors);
    
    // Draw eyes
    this.drawEyes(features.eyes, expression.eyes, colors);
    
    // Draw nose
    this.drawNose(features.nose, colors);
    
    // Draw mouth
    this.drawMouth(features.mouth, expression.mouth, colors);
    
    // Draw blush
    if (expression.blush > 0) {
      this.drawBlush(expression.blush, colors);
    }
    
    // Draw outline
    this.drawOutline(features.face, colors);
  }
  
  // Draw robot avatar
  drawRobotAvatar() {
    const avatar = this.currentAvatar;
    const expression = this.getCurrentExpression();
    const colors = avatar.colors;
    const features = avatar.features;
    
    // Draw head
    this.context.fillStyle = colors.body;
    this.context.strokeStyle = colors.outline;
    this.context.lineWidth = 4;
    
    const headWidth = features.head.width;
    const headHeight = features.head.height;
    
    // Draw main head
    this.context.beginPath();
    this.context.rect(
      -headWidth / 2, 
      -headHeight / 2 + 20,
      headWidth, 
      headHeight - 40
    );
    this.context.fill();
    this.context.stroke();
    
    // Draw top part
    this.context.beginPath();
    this.context.moveTo(-headWidth / 2, -headHeight / 2);
    this.context.lineTo(headWidth / 2, -headHeight / 2);
    this.context.lineTo(headWidth / 2 - 20, -headHeight / 2 + 20);
    this.context.lineTo(-headWidth / 2 + 20, -headHeight / 2 + 20);
    this.context.closePath();
    this.context.fill();
    this.context.stroke();
    
    // Draw antenna
    if (features.antenna) {
      this.context.strokeStyle = colors.details;
      this.context.lineWidth = 3;
      this.context.beginPath();
      this.context.moveTo(0, -headHeight / 2);
      this.context.lineTo(0, -headHeight / 2 - features.antenna.length);
      this.context.stroke();
      
      // Antenna ball
      this.context.beginPath();
      this.context.arc(0, -headHeight / 2 - features.antenna.length, 8, 0, Math.PI * 2);
      this.context.fillStyle = colors.details;
      this.context.fill();
    }
    
    // Draw eyes
    const eyeSize = features.eyes.size;
    const eyeSpacing = features.eyes.spacing;
    const eyeY = features.eyes.position;
    
    this.context.fillStyle = colors.eyes;
    this.context.strokeStyle = colors.outline;
    this.context.lineWidth = 2;
    
    // Left eye
    this.context.beginPath();
    if (features.eyes.shape === 'rectangle') {
      this.context.rect(
        -eyeSpacing / 2 - eyeSize / 2,
        eyeY - eyeSize / 2,
        eyeSize,
        eyeSize
      );
    } else {
      this.context.arc(
        -eyeSpacing / 2,
        eyeY,
        eyeSize / 2,
        0,
        Math.PI * 2
      );
    }
    this.context.fill();
    this.context.stroke();
    
    // Right eye
    this.context.beginPath();
    if (features.eyes.shape === 'rectangle') {
      this.context.rect(
        eyeSpacing / 2 - eyeSize / 2,
        eyeY - eyeSize / 2,
        eyeSize,
        eyeSize
      );
    } else {
      this.context.arc(
        eyeSpacing / 2,
        eyeY,
        eyeSize / 2,
        0,
        Math.PI * 2
      );
    }
    this.context.fill();
    this.context.stroke();
    
    // Draw mouth
    const mouthSize = features.mouth.size;
    const mouthY = features.mouth.position;
    const mouthExpression = expression.mouth;
    
    this.context.fillStyle = colors.mouth;
    this.context.strokeStyle = colors.outline;
    this.context.lineWidth = 2;
    
    if (mouthExpression.shape === 'rectangle') {
      const mouthWidth = mouthSize;
      const mouthHeight = mouthSize * 0.3 * mouthExpression.open;
      
      this.context.beginPath();
      this.context.rect(
        -mouthWidth / 2,
        mouthY - mouthHeight / 2,
        mouthWidth,
        mouthHeight
      );
      this.context.fill();
      this.context.stroke();
    } else {
      // Circular mouth
      const mouthRadius = mouthSize * 0.3 * mouthExpression.open;
      
      this.context.beginPath();
      this.context.arc(
        0,
        mouthY,
        mouthRadius,
        0,
        Math.PI * 2
      );
      this.context.fill();
      this.context.stroke();
    }
    
    // Draw details
    this.context.strokeStyle = colors.details;
    this.context.lineWidth = 1;
    
    // Horizontal lines
    for (let i = 0; i < 3; i++) {
      const y = -headHeight / 2 + 40 + i * 60;
      this.context.beginPath();
      this.context.moveTo(-headWidth / 2 + 10, y);
      this.context.lineTo(headWidth / 2 - 10, y);
      this.context.stroke();
    }
  }
  
  // Draw face
  drawFace(face, colors) {
    this.context.fillStyle = colors.skin;
    this.context.strokeStyle = colors.outline;
    this.context.lineWidth = 2;
    
    const width = face.width;
    const height = face.height;
    
    if (face.shape === 'oval') {
      this.context.beginPath();
      this.context.ellipse(
        0, 
        0, 
        width / 2, 
        height / 2,
        0, 
        0, 
        Math.PI * 2
      );
      this.context.fill();
      this.context.stroke();
    } else {
      // Rectangle face
      this.context.beginPath();
      this.context.rect(
        -width / 2,
        -height / 2,
        width,
        height
      );
      this.context.fill();
      this.context.stroke();
    }
  }
  
  // Draw hair
  drawHair(features, colors) {
    const headWidth = features.head.width;
    const headHeight = features.head.height;
    const faceHeight = features.face.height;
    
    this.context.fillStyle = colors.hair;
    this.context.strokeStyle = colors.outline;
    this.context.lineWidth = 2;
    
    // Hair shape
    this.context.beginPath();
    this.context.moveTo(-headWidth / 2, -headHeight / 2);
    this.context.quadraticCurveTo(
      -headWidth / 2 - 20,
      -headHeight / 2 + 40,
      -headWidth / 2,
      -headHeight / 2 + 80
    );
    this.context.lineTo(headWidth / 2, -headHeight / 2 + 80);
    this.context.quadraticCurveTo(
      headWidth / 2 + 20,
      -headHeight / 2 + 40,
      headWidth / 2,
      -headHeight / 2
    );
    this.context.closePath();
    this.context.fill();
    this.context.stroke();
    
    // Bangs
    this.context.beginPath();
    this.context.moveTo(-headWidth / 2 + 10, -headHeight / 2 + 60);
    this.context.quadraticCurveTo(
      0,
      -headHeight / 2 + 40,
      headWidth / 2 - 10,
      -headHeight / 2 + 60
    );
    this.context.lineTo(headWidth / 2 - 10, -headHeight / 2 + 80);
    this.context.lineTo(-headWidth / 2 + 10, -headHeight / 2 + 80);
    this.context.closePath();
    this.context.fill();
    this.context.stroke();
  }
  
  // Draw eyebrows
  drawEyebrows(eyebrowConfig, expression, colors) {
    const size = eyebrowConfig.size || 8;
    const spacing = eyebrowConfig.spacing || 160;
    const y = eyebrowConfig.position || 160;
    const raised = expression.raised || 0;
    const shape = expression.shape || 'curved';
    
    this.context.strokeStyle = colors.eyebrows;
    this.context.lineWidth = size;
    this.context.lineCap = 'round';
    
    // Left eyebrow
    this.drawEyebrow(-spacing / 2, y + raised * 20, shape, size);
    
    // Right eyebrow
    this.drawEyebrow(spacing / 2, y + raised * 20, shape, size);
  }
  
  // Draw single eyebrow
  drawEyebrow(x, y, shape, thickness) {
    this.context.beginPath();
    
    if (shape === 'curved') {
      this.context.moveTo(x - 40, y);
      this.context.quadraticCurveTo(x, y - 20, x + 40, y);
    } else if (shape === 'angled') {
      this.context.moveTo(x - 40, y - 20);
      this.context.lineTo(x, y);
      this.context.lineTo(x + 40, y - 20);
    } else {
      this.context.moveTo(x - 40, y);
      this.context.lineTo(x + 40, y);
    }
    
    this.context.stroke();
  }
  
  // Draw eyes
  drawEyes(eyeConfig, expression, colors) {
    const size = eyeConfig.size || 80;
    const spacing = eyeConfig.spacing || 160;
    const y = eyeConfig.position || 180;
    const open = expression.open !== undefined ? expression.open : 1;
    const shape = expression.shape || 'circle';
    const look = expression.look || 'forward';
    
    // Calculate eye positions based on look direction
    const lookOffsetX = look === 'left' ? -10 : look === 'right' ? 10 : 0;
    const lookOffsetY = look === 'up' ? -5 : look === 'down' ? 5 : 0;
    
    // Left eye
    this.drawEye(
      -spacing / 2 + lookOffsetX,
      y + lookOffsetY,
      size,
      open,
      shape,
      colors
    );
    
    // Right eye
    this.drawEye(
      spacing / 2 + lookOffsetX,
      y + lookOffsetY,
      size,
      open,
      shape,
      colors
    );
  }
  
  // Draw single eye
  drawEye(x, y, size, open, shape, colors) {
    const radius = size / 2;
    const eyeOpenHeight = radius * 2 * open;
    
    // White of the eye
    this.context.fillStyle = '#ffffff';
    this.context.strokeStyle = colors.outline;
    this.context.lineWidth = 2;
    
    if (shape === 'circle') {
      // Full circle when fully open
      if (open >= 1) {
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, Math.PI * 2);
        this.context.fill();
        this.context.stroke();
      } else if (open > 0) {
        // Ellipse when partially open
        this.context.beginPath();
        this.context.ellipse(
          x,
          y,
          radius,
          radius * open,
          0,
          0,
          Math.PI * 2
        );
        this.context.fill();
        this.context.stroke();
      }
      // When closed (open = 0), draw nothing
    } else {
      // Rectangle eye
      this.context.beginPath();
      this.context.rect(
        x - radius,
        y - radius * open,
        radius * 2,
        radius * 2 * open
      );
      this.context.fill();
      this.context.stroke();
    }
    
    // Iris/pupil
    if (open > 0) {
      const pupilRadius = radius * 0.4;
      this.context.fillStyle = colors.eyes;
      
      this.context.beginPath();
      this.context.arc(x, y, pupilRadius, 0, Math.PI * 2);
      this.context.fill();
      
      // Pupil highlight
      this.context.fillStyle = '#ffffff';
      this.context.beginPath();
      this.context.arc(x + pupilRadius * 0.3, y - pupilRadius * 0.3, pupilRadius * 0.2, 0, Math.PI * 2);
      this.context.fill();
    }
  }
  
  // Draw nose
  drawNose(noseConfig, colors) {
    const size = noseConfig.size || 60;
    const y = noseConfig.position || 320;
    
    this.context.fillStyle = colors.skin;
    this.context.strokeStyle = colors.outline;
    this.context.lineWidth = 2;
    
    this.context.beginPath();
    this.context.moveTo(0, y - size / 2);
    this.context.quadraticCurveTo(
      -size / 4, y + size / 4,
      0, y + size / 2
    );
    this.context.quadraticCurveTo(
      size / 4, y + size / 4,
      0, y - size / 2
    );
    this.context.fill();
    this.context.stroke();
    
    // Nostrils
    this.context.fillStyle = colors.outline;
    this.context.beginPath();
    this.context.ellipse(-size / 6, y, size / 6, size / 8, 0, 0, Math.PI * 2);
    this.context.fill();
    
    this.context.beginPath();
    this.context.ellipse(size / 6, y, size / 6, size / 8, 0, 0, Math.PI * 2);
    this.context.fill();
  }
  
  // Draw mouth
  drawMouth(mouthConfig, expression, colors) {
    const size = mouthConfig.size || 100;
    const y = mouthConfig.position || 380;
    const open = expression.open !== undefined ? expression.open : 0;
    const shape = expression.shape || 'line';
    const smile = expression.smile !== undefined ? expression.smile : 0;
    
    this.context.strokeStyle = colors.mouth;
    this.context.lineWidth = 3;
    this.context.lineCap = 'round';
    
    const width = size;
    const height = size * 0.4 * open;
    const smileOffset = smile * 20;
    
    this.context.beginPath();
    
    if (shape === 'line') {
      // Straight line mouth
      if (open === 0) {
        this.context.moveTo(-width / 2, y);
        this.context.lineTo(width / 2, y);
      } else {
        // Slightly open
        this.context.moveTo(-width / 2, y);
        this.context.quadraticCurveTo(0, y + smileOffset, width / 2, y);
      }
    } else if (shape === 'smile') {
      // Smile curve
      this.context.moveTo(-width / 2, y);
      this.context.quadraticCurveTo(
        0,
        y + smileOffset * (1 + open * 2),
        width / 2,
        y
      );
    } else if (shape === 'frown') {
      // Frown curve
      this.context.moveTo(-width / 2, y);
      this.context.quadraticCurveTo(
        0,
        y - smileOffset * (1 + open * 2),
        width / 2,
        y
      );
    } else if (shape === 'circle') {
      // Circular mouth (for wide open)
      const radius = width * 0.3 * open;
      this.context.arc(0, y, radius, 0, Math.PI);
    }
    
    this.context.stroke();
    
    // Draw mouth interior when open
    if (open > 0.1) {
      this.context.fillStyle = colors.mouth;
      this.context.globalAlpha = 0.3 * open;
      
      this.context.beginPath();
      if (shape === 'circle') {
        const radius = width * 0.3 * open;
        this.context.arc(0, y, radius, 0, Math.PI);
        this.context.lineTo(0, y);
      } else {
        this.context.moveTo(-width / 2, y);
        this.context.quadraticCurveTo(
          0,
          y + smileOffset * (1 + open * 2) * (shape === 'smile' ? 1 : -1),
          width / 2,
          y
        );
        this.context.lineTo(width / 2, y + height);
        this.context.lineTo(-width / 2, y + height);
        this.context.closePath();
      }
      
      this.context.fill();
      this.context.globalAlpha = 1;
    }
    
    // Tongue when mouth is very open
    if (open > 0.8) {
      this.context.fillStyle = '#ff8a8a';
      this.context.beginPath();
      this.context.ellipse(0, y + height / 2, width * 0.3, height * 0.3, 0, 0, Math.PI * 2);
      this.context.fill();
    }
  }
  
  // Draw blush
  drawBlush(intensity, colors) {
    this.context.fillStyle = 'rgba(255, 100, 100, ' + (intensity * 0.5) + ')';
    this.context.beginPath();
    this.context.ellipse(-120, 220, 40, 30, 0, 0, Math.PI * 2);
    this.context.fill();
    
    this.context.beginPath();
    this.context.ellipse(120, 220, 40, 30, 0, 0, Math.PI * 2);
    this.context.fill();
  }
  
  // Draw outline
  drawOutline(face, colors) {
    this.context.strokeStyle = colors.outline;
    this.context.lineWidth = 3;
    
    const width = face.width;
    const height = face.height;
    
    if (face.shape === 'oval') {
      this.context.beginPath();
      this.context.ellipse(
        0, 
        0, 
        width / 2 + 5, 
        height / 2 + 5,
        0, 
        0, 
        Math.PI * 2
      );
      this.context.stroke();
    } else {
      this.context.beginPath();
      this.context.rect(
        -width / 2 - 5,
        -height / 2 - 5,
        width + 10,
        height + 10
      );
      this.context.stroke();
    }
  }
  
  // Set scale
  setScale(scale) {
    this.scale = Math.max(0.1, Math.min(3, scale));
  }
  
  // Set rotation
  setRotation(degrees) {
    this.rotation = degrees % 360;
  }
  
  // Set position
  setPosition(x, y) {
    this.position = { x, y };
  }
  
  // Set FPS
  setFPS(fps) {
    this.fps = Math.max(1, Math.min(120, fps));
  }
  
  // Get engine status
  getStatus() {
    return {
      hasCanvas: !!this.canvas,
      hasContext: !!this.context,
      currentAvatar: this.currentAvatar?.id,
      currentExpression: this.currentExpression,
      isBlinking: this.isBlinking,
      lipSyncEnabled: this.lipSyncEnabled,
      isRendering: !!this.animationFrameId
    };
  }
  
  // Clean up
  destroy() {
    console.log('[Avatar Engine] Cleaning up...');
    
    this.stopRendering();
    this.stopBlinking();
    
    if (this.canvas) {
      this.canvas = null;
      this.context = null;
    }
    
    this.avatars.clear();
    this.currentAvatar = null;
    this.defaultAvatar = null;
    
    console.log('[Avatar Engine] Cleanup complete');
  }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AvatarEngine;
}

// Export for browser
window.AvatarEngine = AvatarEngine;
