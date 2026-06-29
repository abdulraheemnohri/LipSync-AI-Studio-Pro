/**
 * LipSync AI Studio Pro - Exporter
 * Export projects as video, GIF, or JSON
 */

function Exporter() {
    this.recordingFrames = [];
    this.isRecording = false;
    this.isExporting = false;
    this.callbacks = {
        onRecordingStart: null,
        onRecordingStop: null,
        onExportStart: null,
        onExportProgress: null,
        onExportComplete: null,
        onExportError: null
    };
    
    console.log('[Exporter] Initialized');
}

// Register callback
Exporter.prototype.on = function(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
        this.callbacks[event] = callback;
    }
};

// Trigger callback
Exporter.prototype.triggerError = function(error) {
    if (this.callbacks.onExportError) {
        this.callbacks.onExportError(error);
    }
};

// Start recording frames
Exporter.prototype.startRecording = function(canvas) {
    if (this.isRecording) {
        return false;
    }
    
    this.recordingFrames = [];
    this.isRecording = true;
    
    console.log('[Exporter] Recording started');
    
    if (this.callbacks.onRecordingStart) {
        this.callbacks.onRecordingStart();
    }
    
    return true;
};

// Add frame to recording
Exporter.prototype.addFrame = function(canvas) {
    if (!this.isRecording || !canvas) return;
    
    var dataUrl = canvas.toDataURL('image/png');
    
    this.recordingFrames.push({
        dataUrl: dataUrl,
        timestamp: Date.now(),
        width: canvas.width,
        height: canvas.height
    });
};

// Stop recording
Exporter.prototype.stopRecording = function() {
    if (!this.isRecording) {
        return null;
    }
    
    this.isRecording = false;
    var recording = {
        frames: this.recordingFrames,
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        frameCount: this.recordingFrames.length
    };
    
    console.log('[Exporter] Recording stopped:', recording.frameCount, 'frames');
    
    if (this.callbacks.onRecordingStop) {
        this.callbacks.onRecordingStop(recording);
    }
    
    return recording;
};

// Export as JSON
Exporter.prototype.exportAsJSON = function(data) {
    try {
        var jsonData = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            data: data
        };
        
        var jsonString = JSON.stringify(jsonData, null, 2);
        var blob = new Blob([jsonString], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        
        console.log('[Exporter] JSON export complete');
        return url;
    } catch (error) {
        console.error('[Exporter] JSON export failed:', error);
        this.triggerError(error.message);
        return null;
    }
};

// Export as image
Exporter.prototype.exportAsImage = function(canvas, options) {
    try {
        options = options || {};
        var format = options.format || 'png';
        var quality = options.quality || 0.92;
        
        var dataUrl = canvas.toDataURL('image/' + format, quality);
        console.log('[Exporter] Image export complete');
        return dataUrl;
    } catch (error) {
        console.error('[Exporter] Image export failed:', error);
        this.triggerError(error.message);
        return null;
    }
};

// Download file
Exporter.prototype.downloadFile = function(url, filename) {
    try {
        var link = document.createElement('a');
        link.href = url;
        link.download = filename || 'export';
        
        if (url.startsWith('blob:')) {
            link.onload = function() {
                setTimeout(function() {
                    URL.revokeObjectURL(url);
                }, 100);
            };
        }
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
    } catch (error) {
        console.error('[Exporter] Download failed:', error);
        this.triggerError(error.message);
        return false;
    }
};

// Get status
Exporter.prototype.getStatus = function() {
    return {
        isRecording: this.isRecording,
        isExporting: this.isExporting,
        frameCount: this.recordingFrames.length
    };
};

// Export for browser
window.Exporter = Exporter;