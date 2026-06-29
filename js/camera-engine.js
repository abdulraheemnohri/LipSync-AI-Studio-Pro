/**
 * LipSync AI Studio Pro - Camera Engine
 * Real-time camera access with face detection and tracking
 * Uses MediaDevices API and TensorFlow.js for face detection
 */

class CameraEngine {
  constructor() {
    this.videoElement = null;
    this.canvasElement = null;
    this.context = null;
    this.stream = null;
    this.isRunning = false;
    this.isDetecting = false;
    this.faceDetector = null;
    this.faceDetectionModel = null;
    this.detectedFaces = [];
    this.primaryFace = null;
    this.detectionInterval = 100; // ms
    this.detectionTimer = null;
    this.callbacks = {
      onFaceDetected: null,
      onNoFaceDetected: null,
      onStart: null,
      onStop: null,
      onError: null,
      onFrame: null
    };
    
    // Face tracking data
    this.faceData = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      expressions: {},
      landmarks: []
    };
    
    // Camera settings
    this.cameraSettings = {
      facingMode: 'user', // 'user' or 'environment'
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    };
    
    this.init();
  }
  
  init() {
    console.log('[Camera Engine] Initializing...');
    
    // Load face detection model
    this.loadFaceDetectionModel();
    
    console.log('[Camera Engine] Initialization complete');
  }
  
  // Register callbacks
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = callback;
    }
  }
  
  // Trigger callbacks
  triggerError(error) {
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }
  
  // Load face detection model using TensorFlow.js
  async loadFaceDetectionModel() {
    try {
      console.log('[Camera Engine] Loading face detection model...');
      
      // Check if TensorFlow.js is loaded
      if (typeof tf === 'undefined') {
        console.warn('[Camera Engine] TensorFlow.js not loaded, face detection disabled');
        return;
      }
      
      // Load COCO-SSD or BlazeFace model
      try {
        // Try loading BlazeFace (more accurate but larger)
        this.faceDetectionModel = await tf.loadGraphModel(
          'https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1'
        );
        console.log('[Camera Engine] BlazeFace model loaded');
      } catch (error) {
        console.warn('[Camera Engine] BlazeFace failed, trying COCO-SSD:', error);
        
        try {
          // Fallback to COCO-SSD
          this.faceDetectionModel = await tf.loadGraphModel(
            'https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1'
          );
          console.log('[Camera Engine] COCO-SSD model loaded');
        } catch (error) {
          console.warn('[Camera Engine] COCO-SSD failed, face detection disabled:', error);
        }
      }
      
      if (this.faceDetectionModel) {
        this.isDetecting = true;
        console.log('[Camera Engine] Face detection ready');
      }
    } catch (error) {
      console.error('[Camera Engine] Error loading face detection model:', error);
      this.triggerError('Failed to load face detection model: ' + error.message);
    }
  }
  
  // Initialize with video element
  initWithVideo(videoId) {
    const videoElement = document.getElementById(videoId);
    if (!videoElement) {
      console.error(`[Camera Engine] Video element with id '${videoId}' not found`);
      return false;
    }
    
    this.videoElement = videoElement;
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
    
    console.log(`[Camera Engine] Initialized with video: ${videoId}`);
    return true;
  }
  
  // Initialize with canvas for processing
  initWithCanvas(canvasId) {
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) {
      console.error(`[Camera Engine] Canvas element with id '${canvasId}' not found`);
      return false;
    }
    
    this.canvasElement = canvasElement;
    this.context = canvasElement.getContext('2d');
    
    console.log(`[Camera Engine] Initialized with canvas: ${canvasId}`);
    return true;
  }
  
  // Start camera
  async start() {
    if (this.isRunning) {
      console.log('[Camera Engine] Already running');
      return true;
    }
    
    try {
      console.log('[Camera Engine] Starting camera...');
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: this.cameraSettings,
        audio: false
      });
      
      this.stream = stream;
      
      // Set video source
      if (this.videoElement) {
        this.videoElement.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          this.videoElement.onloadedmetadata = resolve;
          // Timeout after 5 seconds
          setTimeout(resolve, 5000);
        });
        
        // Set canvas size to match video
        if (this.canvasElement && this.videoElement.videoWidth > 0) {
          this.canvasElement.width = this.videoElement.videoWidth;
          this.canvasElement.height = this.videoElement.videoHeight;
        }
      }
      
      this.isRunning = true;
      console.log('[Camera Engine] Camera started');
      
      // Start face detection if model is loaded
      if (this.isDetecting) {
        this.startFaceDetection();
      }
      
      if (this.callbacks.onStart) {
        this.callbacks.onStart();
      }
      
      return true;
    } catch (error) {
      console.error('[Camera Engine] Error starting camera:', error);
      this.triggerError('Camera access denied: ' + error.message);
      return false;
    }
  }
  
  // Stop camera
  stop() {
    if (!this.isRunning) {
      console.log('[Camera Engine] Not running');
      return;
    }
    
    console.log('[Camera Engine] Stopping camera...');
    
    // Stop face detection
    this.stopFaceDetection();
    
    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // Clear video source
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    
    this.isRunning = false;
    this.detectedFaces = [];
    this.primaryFace = null;
    
    console.log('[Camera Engine] Camera stopped');
    
    if (this.callbacks.onStop) {
      this.callbacks.onStop();
    }
  }
  
  // Start face detection
  startFaceDetection() {
    if (!this.isRunning || !this.isDetecting) return;
    
    console.log('[Camera Engine] Starting face detection...');
    
    // Clear existing timer
    this.stopFaceDetection();
    
    // Start detection loop
    this.detectFaces();
  }
  
  // Stop face detection
  stopFaceDetection() {
    if (this.detectionTimer) {
      clearTimeout(this.detectionTimer);
      this.detectionTimer = null;
    }
  }
  
  // Detect faces in video frame
  async detectFaces() {
    if (!this.isRunning || !this.isDetecting || !this.videoElement) {
      return;
    }
    
    try {
      // Check if video is ready
      if (this.videoElement.videoWidth === 0 || this.videoElement.videoHeight === 0) {
        this.detectionTimer = setTimeout(() => this.detectFaces(), this.detectionInterval);
        return;
      }
      
      // Create temporary canvas for detection
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.videoElement.videoWidth;
      tempCanvas.height = this.videoElement.videoHeight;
      const tempContext = tempCanvas.getContext('2d');
      
      // Draw video frame to canvas
      tempContext.drawImage(
        this.videoElement,
        0, 0,
        tempCanvas.width,
        tempCanvas.height
      );
      
      // Get image data
      const imageData = tempContext.getImageData(
        0, 0,
        tempCanvas.width,
        tempCanvas.height
      );
      
      // Convert to tensor
      const tensor = tf.browser.fromPixels(imageData, 3);
      
      // Expand dimensions to [1, height, width, 3]
      const expandedTensor = tensor.expandDims(0);
      
      // Run face detection
      let predictions;
      if (this.faceDetectionModel) {
        predictions = await this.faceDetectionModel.executeAsync(expandedTensor);
        
        // Process predictions based on model type
        if (predictions.length === 2) {
          // BlazeFace format: [boxes, scores]
          const boxes = predictions[0].arraySync();
          const scores = predictions[1].arraySync();
          
          this.detectedFaces = [];
          
          for (let i = 0; i < scores[0].length; i++) {
            if (scores[0][i] > 0.5) {
              const [ymin, xmin, ymax, xmax] = boxes[0][i];
              
              this.detectedFaces.push({
                x: xmin * tempCanvas.width,
                y: ymin * tempCanvas.height,
                width: (xmax - xmin) * tempCanvas.width,
                height: (ymax - ymin) * tempCanvas.height,
                confidence: scores[0][i]
              });
            }
          }
        } else if (predictions.length === 1) {
          // COCO-SSD format
          predictions = predictions[0].arraySync();
          this.detectedFaces = this.processCOCOSDOutput(predictions, tempCanvas);
        }
      } else {
        // Fallback: simple face detection using color/edge
        this.detectedFaces = this.simpleFaceDetection(tempCanvas);
      }
      
      // Set primary face (largest or first)
      if (this.detectedFaces.length > 0) {
        this.primaryFace = this.detectedFaces.reduce((prev, current) =>
          (current.width * current.height > prev.width * prev.height) ? current : prev
        );
        
        // Update face data
        this.updateFaceData();
        
        if (this.callbacks.onFaceDetected) {
          this.callbacks.onFaceDetected(this.primaryFace);
        }
      } else {
        this.primaryFace = null;
        
        if (this.callbacks.onNoFaceDetected) {
          this.callbacks.onNoFaceDetected();
        }
      }
      
      // Trigger frame callback
      if (this.callbacks.onFrame) {
        this.callbacks.onFrame({
          faces: this.detectedFaces,
          primaryFace: this.primaryFace,
          faceData: this.faceData
        });
      }
      
      // Clean up
      tensor.dispose();
      expandedTensor.dispose();
      
    } catch (error) {
      console.error('[Camera Engine] Error detecting faces:', error);
    } finally {
      // Schedule next detection
      this.detectionTimer = setTimeout(() => this.detectFaces(), this.detectionInterval);
    }
  }
  
  // Process COCO-SSD output
  processCOCOSDOutput(predictions, canvas) {
    const faces = [];
    
    // COCO-SSD outputs: [batch, num_detections, 6]
    // Each detection: [ymin, xmin, ymax, xmax, class_id, score]
    for (let i = 0; i < predictions.length; i++) {
      const detection = predictions[i];
      const classId = detection[4];
      const score = detection[5];
      
      // Class 0 is person, but we want face specifically
      // In COCO, face is class 0
      if (classId === 0 && score > 0.5) {
        const [ymin, xmin, ymax, xmax] = detection;
        
        faces.push({
          x: xmin * canvas.width,
          y: ymin * canvas.height,
          width: (xmax - xmin) * canvas.width,
          height: (ymax - ymin) * canvas.height,
          confidence: score
        });
      }
    }
    
    return faces;
  }
  
  // Simple face detection fallback
  simpleFaceDetection(canvas) {
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple skin color detection (light to medium skin tones)
    const skinMin = [130, 100, 80];  // RGB min
    const skinMax = [255, 200, 160]; // RGB max
    
    // Find regions with skin color
    const skinRegions = [];
    const visited = new Set();
    
    for (let y = 0; y < canvas.height; y += 10) {
      for (let x = 0; x < canvas.width; x += 10) {
        const index = (y * canvas.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Check if pixel is skin color
        if (r >= skinMin[0] && r <= skinMax[0] &&
            g >= skinMin[1] && g <= skinMax[1] &&
            b >= skinMin[2] && b <= skinMax[2]) {
          
          // Check if this area has enough skin pixels
          let skinCount = 0;
          for (let dy = -5; dy <= 5; dy++) {
            for (let dx = -5; dx <= 5; dx++) {
              const checkIndex = ((y + dy) * canvas.width + (x + dx)) * 4;
              if (checkIndex >= 0 && checkIndex < data.length) {
                const cr = data[checkIndex];
                const cg = data[checkIndex + 1];
                const cb = data[checkIndex + 2];
                
                if (cr >= skinMin[0] && cr <= skinMax[0] &&
                    cg >= skinMin[1] && cg <= skinMax[1] &&
                    cb >= skinMin[2] && cb <= skinMax[2]) {
                  skinCount++;
                }
              }
            }
          }
          
          if (skinCount > 20) {
            skinRegions.push({ x, y, count: skinCount });
          }
        }
      }
    }
    
    // Cluster regions into faces
    if (skinRegions.length > 0) {
      // Find the largest cluster
      const centerX = skinRegions.reduce((sum, r) => sum + r.x, 0) / skinRegions.length;
      const centerY = skinRegions.reduce((sum, r) => sum + r.y, 0) / skinRegions.length;
      
      // Estimate face size
      const minX = Math.min(...skinRegions.map(r => r.x));
      const maxX = Math.max(...skinRegions.map(r => r.x));
      const minY = Math.min(...skinRegions.map(r => r.y));
      const maxY = Math.max(...skinRegions.map(r => r.y));
      
      const width = maxX - minX;
      const height = maxY - minY;
      
      if (width > 50 && height > 50) {
        return [{
          x: centerX - width / 2,
          y: centerY - height / 2,
          width: width * 1.5,
          height: height * 1.5,
          confidence: 0.6
        }];
      }
    }
    
    return [];
  }
  
  // Update face data from primary face
  updateFaceData() {
    if (!this.primaryFace) {
      this.faceData = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
        expressions: {},
        landmarks: []
      };
      return;
    }
    
    const videoWidth = this.videoElement.videoWidth;
    const videoHeight = this.videoElement.videoHeight;
    
    // Calculate center position
    const centerX = this.primaryFace.x + this.primaryFace.width / 2;
    const centerY = this.primaryFace.y + this.primaryFace.height / 2;
    
    // Normalize to -1 to 1 range
    this.faceData = {
      x: (centerX / videoWidth) * 2 - 1,
      y: (centerY / videoHeight) * 2 - 1,
      width: this.primaryFace.width / videoWidth,
      height: this.primaryFace.height / videoHeight,
      rotation: 0, // Would be calculated from landmarks
      expressions: this.estimateExpressions(),
      landmarks: [] // Would be populated with actual landmarks
    };
  }
  
  // Estimate facial expressions (simplified)
  estimateExpressions() {
    if (!this.primaryFace) return {};
    
    // This is a simplified estimation
    // In a real implementation, you would use facial landmark detection
    
    const aspectRatio = this.primaryFace.width / this.primaryFace.height;
    
    return {
      happy: aspectRatio > 1.2 ? 0.3 : 0.1,
      sad: aspectRatio < 0.8 ? 0.3 : 0.1,
      surprised: this.primaryFace.height > this.videoElement.videoHeight * 0.4 ? 0.5 : 0.1,
      angry: 0.1,
      neutral: 0.8
    };
  }
  
  // Get face landmarks (would be populated by face landmark detection)
  async getFaceLandmarks() {
    if (!this.primaryFace || !this.isDetecting) return [];
    
    // This would use a face landmark detection model
    // For now, return estimated landmarks based on face position
    
    const videoWidth = this.videoElement.videoWidth;
    const videoHeight = this.videoElement.videoHeight;
    
    const face = this.primaryFace;
    
    return [
      // Eyes
      { type: 'leftEye', x: face.x + face.width * 0.3, y: face.y + face.height * 0.3 },
      { type: 'rightEye', x: face.x + face.width * 0.7, y: face.y + face.height * 0.3 },
      
      // Nose
      { type: 'nose', x: face.x + face.width * 0.5, y: face.y + face.height * 0.5 },
      
      // Mouth
      { type: 'mouthLeft', x: face.x + face.width * 0.3, y: face.y + face.height * 0.7 },
      { type: 'mouthRight', x: face.x + face.width * 0.7, y: face.y + face.height * 0.7 },
      { type: 'mouthCenter', x: face.x + face.width * 0.5, y: face.y + face.height * 0.7 },
      
      // Chin
      { type: 'chin', x: face.x + face.width * 0.5, y: face.y + face.height * 0.9 }
    ];
  }
  
  // Draw face detection overlay on canvas
  drawDetectionOverlay() {
    if (!this.canvasElement || !this.context || !this.videoElement) return;
    
    // Clear canvas
    this.context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
    // Draw video frame
    if (this.videoElement.videoWidth > 0) {
      this.context.drawImage(
        this.videoElement,
        0, 0,
        this.canvasElement.width,
        this.canvasElement.height
      );
    }
    
    // Draw face rectangles
    this.context.strokeStyle = '#00ff00';
    this.context.lineWidth = 3;
    
    for (const face of this.detectedFaces) {
      // Scale to canvas size
      const scaleX = this.canvasElement.width / this.videoElement.videoWidth;
      const scaleY = this.canvasElement.height / this.videoElement.videoHeight;
      
      this.context.strokeRect(
        face.x * scaleX,
        face.y * scaleY,
        face.width * scaleX,
        face.height * scaleY
      );
    }
    
    // Draw primary face with different color
    if (this.primaryFace) {
      const scaleX = this.canvasElement.width / this.videoElement.videoWidth;
      const scaleY = this.canvasElement.height / this.videoElement.videoHeight;
      
      this.context.strokeStyle = '#ff0000';
      this.context.lineWidth = 4;
      
      this.context.strokeRect(
        this.primaryFace.x * scaleX,
        this.primaryFace.y * scaleY,
        this.primaryFace.width * scaleX,
        this.primaryFace.height * scaleY
      );
    }
  }
  
  // Take snapshot
  async takeSnapshot() {
    if (!this.videoElement || this.videoElement.videoWidth === 0) {
      return null;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const context = canvas.getContext('2d');
    
    context.drawImage(
      this.videoElement,
      0, 0,
      canvas.width,
      canvas.height
    );
    
    return canvas.toDataURL('image/png');
  }
  
  // Switch camera
  async switchCamera() {
    this.stop();
    
    // Toggle facing mode
    this.cameraSettings.facingMode = 
      this.cameraSettings.facingMode === 'user' ? 'environment' : 'user';
    
    return this.start();
  }
  
  // Set camera settings
  setCameraSettings(settings) {
    this.cameraSettings = { ...this.cameraSettings, ...settings };
  }
  
  // Set detection interval
  setDetectionInterval(interval) {
    this.detectionInterval = Math.max(10, Math.min(1000, interval));
  }
  
  // Get engine status
  getStatus() {
    return {
      isRunning: this.isRunning,
      isDetecting: this.isDetecting,
      hasVideoElement: !!this.videoElement,
      hasCanvasElement: !!this.canvasElement,
      hasFaceDetectionModel: !!this.faceDetectionModel,
      detectedFaces: this.detectedFaces.length,
      hasPrimaryFace: !!this.primaryFace,
      cameraSettings: { ...this.cameraSettings }
    };
  }
  
  // Clean up
  destroy() {
    console.log('[Camera Engine] Cleaning up...');
    
    this.stop();
    this.stopFaceDetection();
    
    if (this.faceDetectionModel) {
      this.faceDetectionModel.dispose();
      this.faceDetectionModel = null;
    }
    
    this.videoElement = null;
    this.canvasElement = null;
    this.context = null;
    this.isDetecting = false;
    
    console.log('[Camera Engine] Cleanup complete');
  }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CameraEngine;
}

// Export for browser
window.CameraEngine = CameraEngine;
