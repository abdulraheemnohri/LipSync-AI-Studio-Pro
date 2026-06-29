/**
 * LipSync AI Studio Pro - Audio Engine
 * Handles audio recording, playback, and processing
 */

function AudioEngine() {
    this.audioContext = null;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.currentRecording = null;
    this.callbacks = {
        onRecordingStart: null,
        onRecordingStop: null,
        onPlaybackStart: null,
        onPlaybackStop: null,
        onError: null
    };
    
    // Try to create audio context
    try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('[Audio Engine] Audio context created');
    } catch (error) {
        console.error('[Audio Engine] Error creating audio context:', error);
        this.audioContext = null;
    }
}

// Register callback
AudioEngine.prototype.on = function(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
        this.callbacks[event] = callback;
    }
};

// Trigger callback
AudioEngine.prototype.trigger = function(event, data) {
    if (this.callbacks[event]) {
        this.callbacks[event](data);
    }
};

// Start recording
AudioEngine.prototype.startRecording = async function() {
    try {
        if (this.isRecording) {
            console.log('[Audio Engine] Already recording');
            return false;
        }
        
        console.log('[Audio Engine] Starting recording...');
        
        // Request microphone access
        var stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        // Create media recorder
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];
        this.isRecording = true;
        
        // Set up data handler
        var self = this;
        this.mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                self.audioChunks.push(event.data);
            }
        };
        
        // Start recording
        this.mediaRecorder.start();
        
        // Set up stop handler
        this.mediaRecorder.onstop = function() {
            self.isRecording = false;
            self.trigger('onRecordingStop');
        };
        
        this.trigger('onRecordingStart');
        console.log('[Audio Engine] Recording started');
        return true;
    } catch (error) {
        console.error('[Audio Engine] Error starting recording:', error);
        this.trigger('onError', error);
        return false;
    }
};

// Stop recording
AudioEngine.prototype.stopRecording = function() {
    if (!this.isRecording || !this.mediaRecorder) {
        console.log('[Audio Engine] Not recording');
        return null;
    }
    
    console.log('[Audio Engine] Stopping recording...');
    
    this.mediaRecorder.stop();
    
    // Get all tracks and stop them
    if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(function(track) {
            track.stop();
        });
    }
    
    // Create recording object
    this.currentRecording = {
        audioChunks: this.audioChunks,
        timestamp: new Date().toISOString()
    };
    
    console.log('[Audio Engine] Recording stopped');
    return this.currentRecording;
};

// Get current recording
AudioEngine.prototype.getCurrentRecording = function() {
    return this.currentRecording;
};

// Is currently recording
AudioEngine.prototype.isRecording = function() {
    return this.isRecording;
};

// Play audio from URL
AudioEngine.prototype.playAudio = function(audioUrl) {
    try {
        var audio = new Audio(audioUrl);
        audio.play();
        console.log('[Audio Engine] Playing audio');
        return audio;
    } catch (error) {
        console.error('[Audio Engine] Error playing audio:', error);
        this.trigger('onError', error);
        return null;
    }
};

// Play recording
AudioEngine.prototype.playRecording = function() {
    if (!this.currentRecording || this.currentRecording.audioChunks.length === 0) {
        console.log('[Audio Engine] No recording to play');
        return null;
    }
    
    try {
        // Create blob from chunks
        var blob = new Blob(this.currentRecording.audioChunks, { type: 'audio/webm' });
        var audioUrl = URL.createObjectURL(blob);
        
        var audio = new Audio(audioUrl);
        audio.play();
        
        // Clean up URL when done
        audio.onended = function() {
            URL.revokeObjectURL(audioUrl);
        };
        
        console.log('[Audio Engine] Playing recording');
        this.trigger('onPlaybackStart');
        
        return audio;
    } catch (error) {
        console.error('[Audio Engine] Error playing recording:', error);
        this.trigger('onError', error);
        return null;
    }
};

// Apply audio effect
AudioEngine.prototype.applyEffect = function(effect) {
    console.log('[Audio Engine] Applying effect:', effect);
    // For now, just log the effect
    // In production, this would apply actual audio effects
    return true;
};

// Get audio context
AudioEngine.prototype.getAudioContext = function() {
    return this.audioContext;
};

// Create oscillator
AudioEngine.prototype.createOscillator = function(frequency, type) {
    if (!this.audioContext) {
        console.error('[Audio Engine] No audio context');
        return null;
    }
    
    try {
        var oscillator = this.audioContext.createOscillator();
        oscillator.type = type || 'sine';
        oscillator.frequency.value = frequency || 440;
        
        var gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.1;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        return oscillator;
    } catch (error) {
        console.error('[Audio Engine] Error creating oscillator:', error);
        return null;
    }
};

// Analyze audio
AudioEngine.prototype.analyzeAudio = function(audioBlob) {
    try {
        // For now, return simulated analysis
        return {
            duration: 5.0,
            volume: 0.8,
            frequency: 200,
            peaks: [0.5, 0.8, 0.6, 0.9, 0.7]
        };
    } catch (error) {
        console.error('[Audio Engine] Error analyzing audio:', error);
        return null;
    }
};

// Export for browser
window.AudioEngine = AudioEngine;