// Camera Engine (for future face tracking)
class CameraEngine {
  constructor() {
    this.videoElement = null;
    this.canvas = null;
    this.ctx = null;
    this.stream = null;
    this.isActive = false;
  }
  
  async init() {
    try {
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      return true;
    } catch (error) {
      console.error('Camera init error:', error);
      return false;
    }
  }
  
  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      this.videoElement.srcObject = stream;
      this.videoElement.play();
      this.isActive = true;
      return true;
    } catch (error) {
      console.error('Camera start error:', error);
      return false;
    }
  }
  
  stopCamera() {
    if (!this.isActive) return false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isActive = false;
    return true;
  }
  
  takeSnapshot() {
    if (!this.ctx || !this.videoElement) return null;
    this.canvas.width = this.videoElement.videoWidth;
    this.canvas.height = this.videoElement.videoHeight;
    this.ctx.drawImage(this.videoElement, 0, 0);
    return this.canvas.toDataURL('image/png');
  }
  
  static isSupported() {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  }
}

const cameraEngine = new CameraEngine();
export default cameraEngine;