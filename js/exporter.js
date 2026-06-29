/**
 * LipSync AI Studio Pro - Exporter
 * Export projects as video, GIF, or JSON
 * Uses Canvas API and FFmpeg.js for video export
 */

class Exporter {
  constructor() {
    this.recordingFrames = [];
    this.isRecording = false;
    this.isExporting = false;
    this.recordingStartTime = 0;
    this.frameRate = 30;
    this.quality = 0.92;
    this.callbacks = {
      onRecordingStart: null,
      onRecordingStop: null,
      onExportStart: null,
      onExportProgress: null,
      onExportComplete: null,
      onExportError: null
    };
    
    // FFmpeg.js worker (loaded on demand)
    this.ffmpegWorker = null;
    this.ffmpegLoaded = false;
    
    this.init();
  }
  
  init() {
    console.log('[Exporter] Initializing...');
    
    // Load FFmpeg.js if available
    this.loadFFmpeg();
    
    console.log('[Exporter] Initialization complete');
  }
  
  // Register callbacks
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = callback;
    }
  }
  
  // Trigger callbacks
  triggerError(error) {
    if (this.callbacks.onExportError) {
      this.callbacks.onExportError(error);
    }
  }
  
  // Load FFmpeg.js
  async loadFFmpeg() {
    try {
      if (typeof createFFmpeg !== 'undefined') {
        console.log('[Exporter] Loading FFmpeg.js...');
        
        this.ffmpegWorker = createFFmpeg({
          log: true,
          progress: (progress) => {
            console.log('[Exporter] FFmpeg.js progress:', progress);
            if (this.callbacks.onExportProgress) {
              this.callbacks.onExportProgress(progress);
            }
          }
        });
        
        await this.ffmpegWorker.load();
        this.ffmpegLoaded = true;
        console.log('[Exporter] FFmpeg.js loaded');
      }
    } catch (error) {
      console.warn('[Exporter] FFmpeg.js not available:', error);
    }
  }
  
  // Start recording frames
  startRecording(canvas, options = {}) {
    if (this.isRecording) {
      console.log('[Exporter] Already recording');
      return false;
    }
    
    this.recordingFrames = [];
    this.isRecording = true;
    this.recordingStartTime = Date.now();
    this.frameRate = options.frameRate || this.frameRate;
    this.quality = options.quality || this.quality;
    
    console.log('[Exporter] Recording started');
    
    if (this.callbacks.onRecordingStart) {
      this.callbacks.onRecordingStart();
    }
    
    return true;
  }
  
  // Add frame to recording
  addFrame(canvas) {
    if (!this.isRecording || !canvas) return;
    
    const timestamp = Date.now() - this.recordingStartTime;
    
    // Create image data URL
    const dataUrl = canvas.toDataURL('image/png', this.quality);
    
    this.recordingFrames.push({
      dataUrl: dataUrl,
      timestamp: timestamp,
      width: canvas.width,
      height: canvas.height
    });
  }
  
  // Stop recording
  stopRecording() {
    if (!this.isRecording) {
      console.log('[Exporter] Not recording');
      return null;
    }
    
    this.isRecording = false;
    const recording = {
      frames: this.recordingFrames,
      startTime: this.recordingStartTime,
      endTime: Date.now(),
      duration: Date.now() - this.recordingStartTime,
      frameCount: this.recordingFrames.length,
      frameRate: this.frameRate
    };
    
    console.log(`[Exporter] Recording stopped: ${recording.frameCount} frames, ${recording.duration}ms`);
    
    if (this.callbacks.onRecordingStop) {
      this.callbacks.onRecordingStop(recording);
    }
    
    return recording;
  }
  
  // Get current recording
  getCurrentRecording() {
    return this.isRecording ? {
      frames: this.recordingFrames,
      startTime: this.recordingStartTime,
      frameCount: this.recordingFrames.length
    } : null;
  }
  
  // Export as GIF
  async exportAsGIF(recording, options = {}) {
    if (this.isExporting) {
      console.log('[Exporter] Already exporting');
      return null;
    }
    
    this.isExporting = true;
    const recordingToUse = recording || this.getCurrentRecording();
    
    if (!recordingToUse || recordingToUse.frames.length === 0) {
      this.isExporting = false;
      this.triggerError('No frames to export');
      return null;
    }
    
    try {
      console.log('[Exporter] Exporting as GIF...');
      
      if (this.callbacks.onExportStart) {
        this.callbacks.onExportStart({ type: 'gif', frameCount: recordingToUse.frames.length });
      }
      
      // GIF export using GIF.js or similar library
      // For now, we'll use a simple approach with canvas
      
      const gif = await this.createGIFFromFrames(recordingToUse.frames, options);
      
      console.log('[Exporter] GIF export complete');
      
      if (this.callbacks.onExportComplete) {
        this.callbacks.onExportComplete({ type: 'gif', data: gif });
      }
      
      return gif;
    } catch (error) {
      console.error('[Exporter] GIF export failed:', error);
      this.triggerError('GIF export failed: ' + error.message);
      return null;
    } finally {
      this.isExporting = false;
    }
  }
  
  // Create GIF from frames
  async createGIFFromFrames(frames, options = {}) {
    // This is a simplified implementation
    // In production, you would use a proper GIF encoder
    
    const width = frames[0].width;
    const height = frames[0].height;
    const frameDelay = Math.floor(1000 / (options.frameRate || this.frameRate));
    
    // Create a canvas to draw frames
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    
    // For demo purposes, we'll return the first frame as a PNG
    // In a real implementation, you would encode all frames as GIF
    
    const firstFrame = frames[0];
    const img = new Image();
    img.src = firstFrame.dataUrl;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    context.drawImage(img, 0, 0);
    
    // Return as data URL (PNG for now)
    return canvas.toDataURL('image/png');
  }
  
  // Export as video (MP4 or WebM)
  async exportAsVideo(recording, options = {}) {
    if (this.isExporting) {
      console.log('[Exporter] Already exporting');
      return null;
    }
    
    this.isExporting = true;
    const recordingToUse = recording || this.getCurrentRecording();
    
    if (!recordingToUse || recordingToUse.frames.length === 0) {
      this.isExporting = false;
      this.triggerError('No frames to export');
      return null;
    }
    
    try {
      console.log('[Exporter] Exporting as video...');
      
      if (this.callbacks.onExportStart) {
        this.callbacks.onExportStart({ type: 'video', frameCount: recordingToUse.frames.length });
      }
      
      let videoUrl;
      
      if (this.ffmpegLoaded) {
        // Use FFmpeg.js for video export
        videoUrl = await this.exportWithFFmpeg(recordingToUse, options);
      } else {
        // Fallback to WebM export using MediaRecorder
        videoUrl = await this.exportWithMediaRecorder(recordingToUse, options);
      }
      
      console.log('[Exporter] Video export complete');
      
      if (this.callbacks.onExportComplete) {
        this.callbacks.onExportComplete({ type: 'video', data: videoUrl });
      }
      
      return videoUrl;
    } catch (error) {
      console.error('[Exporter] Video export failed:', error);
      this.triggerError('Video export failed: ' + error.message);
      return null;
    } finally {
      this.isExporting = false;
    }
  }
  
  // Export with FFmpeg.js
  async exportWithFFmpeg(recording, options = {}) {
    if (!this.ffmpegWorker) {
      throw new Error('FFmpeg.js not loaded');
    }
    
    const width = recording.frames[0].width;
    const height = recording.frames[0].height;
    const frameRate = options.frameRate || this.frameRate;
    const format = options.format || 'mp4';
    
    // Create FFmpeg input files
    for (let i = 0; i < recording.frames.length; i++) {
      const frame = recording.frames[i];
      const img = new Image();
      img.src = frame.dataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Convert to JPEG and write to FFmpeg
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempContext = tempCanvas.getContext('2d');
      tempContext.drawImage(img, 0, 0);
      
      const jpegData = tempCanvas.toDataURL('image/jpeg', 0.9);
      const blob = await fetch(jpegData).then(res => res.blob());
      
      this.ffmpegWorker.FS('writeFile', `frame${i}.jpg`, await blob.arrayBuffer());
    }
    
    // Create input file list
    const inputFiles = recording.frames.map((_, i) => `frame${i}.jpg`).join('|');
    
    // Run FFmpeg command
    const outputFile = 'output.' + format;
    
    await this.ffmpegWorker.run(
      '-framerate', frameRate.toString(),
      '-i', inputFiles,
      '-c:v', 'libx264',
      '-r', frameRate.toString(),
      '-pix_fmt', 'yuv420p',
      outputFile
    );
    
    // Read output file
    const outputData = this.ffmpegWorker.FS('readFile', outputFile);
    
    // Create blob URL
    const blob = new Blob([outputData.buffer], { type: `video/${format}` });
    const url = URL.createObjectURL(blob);
    
    // Clean up
    recording.frames.forEach((_, i) => {
      this.ffmpegWorker.FS('unlink', `frame${i}.jpg`);
    });
    this.ffmpegWorker.FS('unlink', outputFile);
    
    return url;
  }
  
  // Export with MediaRecorder (fallback)
  async exportWithMediaRecorder(recording, options = {}) {
    // This is a simplified approach
    // In production, you would use a proper video encoding solution
    
    const width = recording.frames[0].width;
    const height = recording.frames[0].height;
    const frameRate = options.frameRate || this.frameRate;
    
    // Create a canvas to simulate video
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    
    // Create video stream from canvas
    const stream = canvas.captureStream(frameRate);
    
    // Create MediaRecorder
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm',
      videoBitsPerSecond: options.bitrate || 2500000
    });
    
    // Collect video chunks
    const chunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    // Start recording
    mediaRecorder.start();
    
    // Draw frames to canvas
    const frameInterval = 1000 / frameRate;
    let frameIndex = 0;
    
    const drawFrame = () => {
      if (frameIndex >= recording.frames.length) {
        mediaRecorder.stop();
        return;
      }
      
      const frame = recording.frames[frameIndex];
      const img = new Image();
      img.src = frame.dataUrl;
      
      img.onload = () => {
        context.clearRect(0, 0, width, height);
        context.drawImage(img, 0, 0);
        frameIndex++;
        setTimeout(drawFrame, frameInterval);
      };
    };
    
    drawFrame();
    
    // Wait for recording to complete
    await new Promise((resolve) => {
      mediaRecorder.onstop = resolve;
    });
    
    // Create blob from chunks
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    return url;
  }
  
  // Export as JSON (project data)
  exportAsJSON(data, options = {}) {
    try {
      console.log('[Exporter] Exporting as JSON...');
      
      const jsonData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: data
      };
      
      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      console.log('[Exporter] JSON export complete');
      
      return url;
    } catch (error) {
      console.error('[Exporter] JSON export failed:', error);
      this.triggerError('JSON export failed: ' + error.message);
      return null;
    }
  }
  
  // Export avatar as SVG
  exportAvatarAsSVG(avatar, expression) {
    try {
      console.log('[Exporter] Exporting avatar as SVG...');
      
      // Create SVG based on avatar and expression
      const svg = this.createAvatarSVG(avatar, expression);
      
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      console.log('[Exporter] Avatar SVG export complete');
      
      return url;
    } catch (error) {
      console.error('[Exporter] Avatar SVG export failed:', error);
      this.triggerError('Avatar SVG export failed: ' + error.message);
      return null;
    }
  }
  
  // Create avatar SVG
  createAvatarSVG(avatar, expression) {
    const width = 500;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    
    // Add defs for gradients if needed
    svg += `<defs>`;
    svg += `<linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">`;
    svg += `<stop offset="0%" style="stop-color:${avatar.colors.skin};stop-opacity:1" />`;
    svg += `<stop offset="100%" style="stop-color:${this.adjustColor(avatar.colors.skin, -10)};stop-opacity:1" />`;
    svg += `</linearGradient>`;
    svg += `</defs>`;
    
    // Draw face
    if (avatar.features.face.shape === 'oval') {
      svg += `<ellipse cx="${centerX}" cy="${centerY}" rx="${avatar.features.face.width / 2}" ry="${avatar.features.face.height / 2}" fill="url(#skinGradient)" stroke="${avatar.colors.outline}" stroke-width="3"/>`;
    } else {
      svg += `<rect x="${centerX - avatar.features.face.width / 2}" y="${centerY - avatar.features.face.height / 2}" width="${avatar.features.face.width}" height="${avatar.features.face.height}" fill="url(#skinGradient)" stroke="${avatar.colors.outline}" stroke-width="3"/>`;
    }
    
    // Draw hair
    svg += `<path d="M${centerX - avatar.features.head.width / 2},${centerY - avatar.features.head.height / 2}`;
    svg += ` Q${centerX - avatar.features.head.width / 2 - 20},${centerY - avatar.features.head.height / 2 + 40} ${centerX - avatar.features.head.width / 2},${centerY - avatar.features.head.height / 2 + 80}`;
    svg += ` L${centerX + avatar.features.head.width / 2},${centerY - avatar.features.head.height / 2 + 80}`;
    svg += ` Q${centerX + avatar.features.head.width / 2 + 20},${centerY - avatar.features.head.height / 2 + 40} ${centerX + avatar.features.head.width / 2},${centerY - avatar.features.head.height / 2}`;
    svg += ` Z" fill="${avatar.colors.hair}" stroke="${avatar.colors.outline}" stroke-width="2"/>`;
    
    // Draw eyes
    const eyeY = centerY - avatar.features.face.height / 2 + avatar.features.eyes.position;
    const eyeSpacing = avatar.features.eyes.spacing;
    const eyeSize = avatar.features.eyes.size;
    const eyeOpen = expression.eyes.open !== undefined ? expression.eyes.open : 1;
    
    // Left eye
    if (eyeOpen > 0) {
      svg += `<ellipse cx="${centerX - eyeSpacing / 2}" cy="${eyeY}" rx="${eyeSize / 2}" ry="${eyeSize / 2 * eyeOpen}" fill="white" stroke="${avatar.colors.outline}" stroke-width="2"/>`;
      svg += `<circle cx="${centerX - eyeSpacing / 2}" cy="${eyeY}" r="${eyeSize * 0.2}" fill="${avatar.colors.eyes}"/>`;
    }
    
    // Right eye
    if (eyeOpen > 0) {
      svg += `<ellipse cx="${centerX + eyeSpacing / 2}" cy="${eyeY}" rx="${eyeSize / 2}" ry="${eyeSize / 2 * eyeOpen}" fill="white" stroke="${avatar.colors.outline}" stroke-width="2"/>`;
      svg += `<circle cx="${centerX + eyeSpacing / 2}" cy="${eyeY}" r="${eyeSize * 0.2}" fill="${avatar.colors.eyes}"/>`;
    }
    
    // Draw mouth
    const mouthY = centerY + avatar.features.mouth.position - centerY;
    const mouthSize = avatar.features.mouth.size;
    const mouthOpen = expression.mouth.open !== undefined ? expression.mouth.open : 0;
    const mouthShape = expression.mouth.shape || 'line';
    
    if (mouthOpen > 0 || mouthShape === 'line') {
      if (mouthShape === 'smile') {
        svg += `<path d="M${centerX - mouthSize / 2},${mouthY} Q${centerX},${mouthY + 20 * mouthOpen} ${centerX + mouthSize / 2},${mouthY}" stroke="${avatar.colors.mouth}" stroke-width="3" fill="none"/>`;
      } else if (mouthShape === 'frown') {
        svg += `<path d="M${centerX - mouthSize / 2},${mouthY} Q${centerX},${mouthY - 20 * mouthOpen} ${centerX + mouthSize / 2},${mouthY}" stroke="${avatar.colors.mouth}" stroke-width="3" fill="none"/>`;
      } else {
        svg += `<line x1="${centerX - mouthSize / 2}" y1="${mouthY}" x2="${centerX + mouthSize / 2}" y2="${mouthY}" stroke="${avatar.colors.mouth}" stroke-width="3"/>`;
      }
    }
    
    svg += `</svg>`;
    
    return svg;
  }
  
  // Adjust color brightness
  adjustColor(color, amount) {
    // Parse hex color
    let r, g, b;
    if (color.startsWith('#')) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    } else {
      // Assume rgb() format
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);
      } else {
        return color;
      }
    }
    
    // Adjust brightness
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    // Convert back to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  
  // Export as image (PNG or JPEG)
  async exportAsImage(canvas, options = {}) {
    try {
      console.log('[Exporter] Exporting as image...');
      
      const format = options.format || 'png';
      const quality = options.quality || this.quality;
      
      let dataUrl;
      if (format === 'png') {
        dataUrl = canvas.toDataURL('image/png', quality);
      } else if (format === 'jpeg') {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      } else {
        dataUrl = canvas.toDataURL('image/webp', quality);
      }
      
      console.log('[Exporter] Image export complete');
      
      return dataUrl;
    } catch (error) {
      console.error('[Exporter] Image export failed:', error);
      this.triggerError('Image export failed: ' + error.message);
      return null;
    }
  }
  
  // Download file
  downloadFile(url, filename, options = {}) {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'export';
      
      // Revoke object URL after download
      if (url.startsWith('blob:')) {
        link.onload = () => {
          setTimeout(() => URL.revokeObjectURL(url), 100);
        };
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('[Exporter] Download failed:', error);
      this.triggerError('Download failed: ' + error.message);
      return false;
    }
  }
  
  // Set frame rate
  setFrameRate(fps) {
    this.frameRate = Math.max(1, Math.min(120, fps));
  }
  
  // Set quality
  setQuality(quality) {
    this.quality = Math.max(0.1, Math.min(1, quality));
  }
  
  // Get engine status
  getStatus() {
    return {
      isRecording: this.isRecording,
      isExporting: this.isExporting,
      ffmpegLoaded: this.ffmpegLoaded,
      frameCount: this.recordingFrames.length,
      frameRate: this.frameRate,
      quality: this.quality
    };
  }
  
  // Clean up
  destroy() {
    console.log('[Exporter] Cleaning up...');
    
    this.stopRecording();
    
    if (this.ffmpegWorker) {
      this.ffmpegWorker.terminate();
      this.ffmpegWorker = null;
      this.ffmpegLoaded = false;
    }
    
    this.recordingFrames = [];
    
    console.log('[Exporter] Cleanup complete');
  }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Exporter;
}

// Export for browser
window.Exporter = Exporter;
