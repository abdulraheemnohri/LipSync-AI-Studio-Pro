/**
 * LipSync AI Studio Pro - LipSync Engine
 * Real-time lip synchronization with audio input
 */

function LipSyncEngine() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.source = null;
    this.processor = null;
    this.isListening = false;
    this.isProcessing = false;
    this.volumeThreshold = 0.01;
    this.smoothingFactor = 0.8;
    this.currentVolume = 0;
    this.currentFrequency = 0;
    this.callbacks = {
        onLipChange: null,
        onVolumeChange: null,
        onStart: null,
        onStop: null,
        onError: null
    };
    
    // Try to create audio context
    try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = this.smoothingFactor;
        this.isProcessing = true;
        console.log('[LipSync Engine] Initialized');
    } catch (error) {
        console.error('[LipSync Engine] Error initializing:', error);
        this.triggerError(error.message);
    }
}

// Register callback
LipSyncEngine.prototype.on = function(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
        this.callbacks[event] = callback;
    }
};

// Trigger callback
LipSyncEngine.prototype.triggerError = function(error) {
    if (this.callbacks.onError) {
        this.callbacks.onError(error);
    }
};

// Start listening
LipSyncEngine.prototype.start = async function() {
    if (this.isListening) {
        return true;
    }
    
    try {
        var stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.microphone = stream;
        
        this.source = this.audioContext.createMediaStreamSource(stream);
        this.source.connect(this.analyser);
        
        this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
        var self = this;
        this.processor.onaudioprocess = function(e) {
            self.processAudio(e);
        };
        this.analyser.connect(this.processor);
        this.processor.connect(this.audioContext.destination);
        
        this.isListening = true;
        console.log('[LipSync Engine] Listening started');
        
        if (this.callbacks.onStart) {
            this.callbacks.onStart();
        }
        
        return true;
    } catch (error) {
        console.error('[LipSync Engine] Error starting:', error);
        this.triggerError(error.message);
        return false;
    }
};

// Stop listening
LipSyncEngine.prototype.stop = function() {
    if (!this.isListening) return;
    
    if (this.processor) {
        this.processor.onaudioprocess = null;
        this.processor.disconnect();
        this.processor = null;
    }
    
    if (this.source) {
        this.source.disconnect();
        this.source = null;
    }
    
    if (this.microphone) {
        this.microphone.getTracks().forEach(function(track) {
            track.stop();
        });
        this.microphone = null;
    }
    
    this.isListening = false;
    this.currentVolume = 0;
    console.log('[LipSync Engine] Listening stopped');
    
    if (this.callbacks.onStop) {
        this.callbacks.onStop();
    }
};

// Process audio
LipSyncEngine.prototype.processAudio = function(audioProcessingEvent) {
    if (!this.analyser || !this.isListening) return;
    
    var inputBuffer = audioProcessingEvent.inputBuffer;
    var outputBuffer = audioProcessingEvent.outputBuffer;
    
    var frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(frequencyData);
    
    var timeDomainData = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(timeDomainData);
    
    // Calculate volume
    var sum = 0;
    for (var i = 0; i < timeDomainData.length; i++) {
        sum += Math.abs(timeDomainData[i] - 128);
    }
    var averageVolume = sum / timeDomainData.length / 128;
    this.currentVolume = this.smoothingFactor * this.currentVolume + (1 - this.smoothingFactor) * averageVolume;
    
    // Calculate frequency
    var maxFrequency = 0;
    var maxIndex = 0;
    for (var i = 0; i < frequencyData.length; i++) {
        if (frequencyData[i] > maxFrequency) {
            maxFrequency = frequencyData[i];
            maxIndex = i;
        }
    }
    this.currentFrequency = (maxIndex * this.audioContext.sampleRate) / this.analyser.fftSize;
    
    // Trigger callbacks
    if (this.callbacks.onVolumeChange) {
        this.callbacks.onVolumeChange(this.currentVolume);
    }
    
    // Determine lip state
    var lipState = this.determineLipState();
    if (this.callbacks.onLipChange) {
        this.callbacks.onLipChange(lipState, this.currentVolume);
    }
    
    // Copy input to output
    var inputChannel = inputBuffer.getChannelData(0);
    var outputChannel = outputBuffer.getChannelData(0);
    for (var i = 0; i < inputChannel.length; i++) {
        outputChannel[i] = inputChannel[i];
    }
};

// Determine lip state
LipSyncEngine.prototype.determineLipState = function() {
    if (this.currentVolume < this.volumeThreshold) {
        return 'closed';
    } else if (this.currentVolume < 0.1) {
        return 'slightlyOpen';
    } else if (this.currentVolume < 0.3) {
        return 'halfOpen';
    } else if (this.currentVolume < 0.6) {
        return 'open';
    } else {
        return 'wideOpen';
    }
};

// Set volume threshold
LipSyncEngine.prototype.setVolumeThreshold = function(threshold) {
    this.volumeThreshold = Math.max(0, Math.min(1, threshold));
};

// Set smoothing factor
LipSyncEngine.prototype.setSmoothingFactor = function(factor) {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
    if (this.analyser) {
        this.analyser.smoothingTimeConstant = this.smoothingFactor;
    }
};

// Get status
LipSyncEngine.prototype.getStatus = function() {
    return {
        isListening: this.isListening,
        isProcessing: this.isProcessing,
        hasAudioContext: !!this.audioContext,
        hasMicrophoneAccess: !!this.microphone
    };
};

// Export for browser
window.LipSyncEngine = LipSyncEngine;