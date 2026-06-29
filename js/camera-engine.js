/**
 * LipSync AI Studio Pro - Camera Engine
 * Handles camera access and face detection
 */

function CameraEngine() {
    this.videoElement = null;
    this.canvasElement = null;
    this.context = null;
    this.stream = null;
    this.isRunning = false;
    this.detectedFaces = [];
    this.primaryFace = null;
    this.callbacks = {
        onFaceDetected: null,
        onNoFaceDetected: null,
        onStart: null,
        onStop: null,
        onError: null,
        onFrame: null
    };
    
    console.log('[Camera Engine] Initialized');
}

// Register callback
CameraEngine.prototype.on = function(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
        this.callbacks[event] = callback;
    }
};

// Trigger callback
CameraEngine.prototype.triggerError = function(error) {
    if (this.callbacks.onError) {
        this.callbacks.onError(error);
    }
};

// Initialize with video element
CameraEngine.prototype.initWithVideo = function(videoId) {
    var videoElement = document.getElementById(videoId);
    if (!videoElement) {
        console.error('[Camera Engine] Video element not found:', videoId);
        return false;
    }
    
    this.videoElement = videoElement;
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
    
    console.log('[Camera Engine] Initialized with video:', videoId);
    return true;
};

// Initialize with canvas
CameraEngine.prototype.initWithCanvas = function(canvasId) {
    var canvasElement = document.getElementById(canvasId);
    if (!canvasElement) {
        console.error('[Camera Engine] Canvas element not found:', canvasId);
        return false;
    }
    
    this.canvasElement = canvasElement;
    this.context = canvasElement.getContext('2d');
    
    console.log('[Camera Engine] Initialized with canvas:', canvasId);
    return true;
};

// Start camera
CameraEngine.prototype.start = async function() {
    if (this.isRunning) {
        return true;
    }
    
    try {
        var stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
        });
        
        this.stream = stream;
        
        if (this.videoElement) {
            this.videoElement.srcObject = stream;
            
            // Wait for video to be ready
            await new Promise(function(resolve) {
                this.videoElement.onloadedmetadata = resolve;
                setTimeout(resolve, 5000); // Timeout after 5 seconds
            }.bind(this));
            
            // Set canvas size
            if (this.canvasElement && this.videoElement.videoWidth > 0) {
                this.canvasElement.width = this.videoElement.videoWidth;
                this.canvasElement.height = this.videoElement.videoHeight;
            }
        }
        
        this.isRunning = true;
        console.log('[Camera Engine] Camera started');
        
        if (this.callbacks.onStart) {
            this.callbacks.onStart();
        }
        
        return true;
    } catch (error) {
        console.error('[Camera Engine] Error starting camera:', error);
        this.triggerError(error.message);
        return false;
    }
};

// Stop camera
CameraEngine.prototype.stop = function() {
    if (!this.isRunning) {
        return;
    }
    
    if (this.stream) {
        this.stream.getTracks().forEach(function(track) {
            track.stop();
        });
        this.stream = null;
    }
    
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
};

// Draw detection overlay
CameraEngine.prototype.drawDetectionOverlay = function() {
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
    
    for (var i = 0; i < this.detectedFaces.length; i++) {
        var face = this.detectedFaces[i];
        var scaleX = this.canvasElement.width / this.videoElement.videoWidth;
        var scaleY = this.canvasElement.height / this.videoElement.videoHeight;
        
        this.context.strokeRect(
            face.x * scaleX,
            face.y * scaleY,
            face.width * scaleX,
            face.height * scaleY
        );
    }
};

// Take snapshot
CameraEngine.prototype.takeSnapshot = async function() {
    if (!this.videoElement || this.videoElement.videoWidth === 0) {
        return null;
    }
    
    var canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    var context = canvas.getContext('2d');
    
    context.drawImage(
        this.videoElement,
        0, 0,
        canvas.width,
        canvas.height
    );
    
    return canvas.toDataURL('image/png');
};

// Switch camera
CameraEngine.prototype.switchCamera = async function() {
    this.stop();
    return this.start();
};

// Get status
CameraEngine.prototype.getStatus = function() {
    return {
        isRunning: this.isRunning,
        hasVideoElement: !!this.videoElement,
        hasCanvasElement: !!this.canvasElement,
        detectedFaces: this.detectedFaces.length,
        hasPrimaryFace: !!this.primaryFace
    };
};

// Export for browser
window.CameraEngine = CameraEngine;