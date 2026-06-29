/**
 * LipSync AI Studio Pro - LipSync Engine
 * Real-time lip synchronization with audio input
 * Uses Web Audio API and TensorFlow.js for audio analysis
 */

class LipSyncEngine {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.source = null;
    this.processor = null;
    this.isListening = false;
    this.isProcessing = false;
    this.volumeThreshold = 0.01;
    this.frequencyThreshold = 100;
    this.smoothingFactor = 0.8;
    this.currentVolume = 0;
    this.currentFrequency = 0;
    this.lipStates = {
      closed: { value: 0, name: 'closed' },
      slightlyOpen: { value: 0.25, name: 'slightlyOpen' },
      halfOpen: { value: 0.5, name: 'halfOpen' },
      open: { value: 0.75, name: 'open' },
      wideOpen: { value: 1, name: 'wideOpen' }
    };
    this.currentLipState = this.lipStates.closed;
    this.lipStateHistory = [];
    this.maxHistory = 10;
    this.callbacks = {
      onLipChange: null,
      onVolumeChange: null,
      onStart: null,
      onStop: null,
      onError: null
    };
    
    // Audio features
    this.audioFeatures = {
      volume: 0,
      frequency: 0,
      isSpeaking: false,
      mouthOpenLevel: 0,
      lastUpdateTime: 0
    };
    
    // Model for audio analysis (optional)
    this.audioModel = null;
    this.isModelLoaded = false;
    
    this.init();
  }
  
  init() {
    console.log('[LipSync Engine] Initializing...');
    
    // Create audio context
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('[LipSync Engine] Audio context created');
    } catch (error) {
      console.error('[LipSync Engine] Error creating audio context:', error);
      this.triggerError('Audio context creation failed: ' + error.message);
    }
    
    // Create analyser node
    if (this.audioContext) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = this.smoothingFactor;
      console.log('[LipSync Engine] Analyser created');
    }
    
    this.isProcessing = true;
    console.log('[LipSync Engine] Initialization complete');
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
  
  triggerLipChange(state, level) {
    if (this.callbacks.onLipChange) {
      this.callbacks.onLipChange(state, level);
    }
  }
  
  triggerVolumeChange(volume) {
    if (this.callbacks.onVolumeChange) {
      this.callbacks.onVolumeChange(volume);
    }
  }
  
  // Start listening to microphone
  async start() {
    if (this.isListening) {
      console.log('[LipSync Engine] Already listening');
      return true;
    }
    
    try {
      console.log('[LipSync Engine] Starting microphone access...');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      
      this.microphone = stream;
      console.log('[LipSync Engine] Microphone access granted');
      
      // Create media stream source
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
      
      // Create script processor for real-time analysis
      this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);
      this.processor.onaudioprocess = (e) => this.processAudio(e);
      this.analyser.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      this.isListening = true;
      console.log('[LipSync Engine] Listening started');
      
      if (this.callbacks.onStart) {
        this.callbacks.onStart();
      }
      
      return true;
    } catch (error) {
      console.error('[LipSync Engine] Error starting microphone:', error);
      this.triggerError('Microphone access denied: ' + error.message);
      return false;
    }
  }
  
  // Stop listening to microphone
  stop() {
    if (!this.isListening) {
      console.log('[LipSync Engine] Not listening');
      return;
    }
    
    console.log('[LipSync Engine] Stopping microphone...');
    
    // Disconnect processor
    if (this.processor) {
      this.processor.onaudioprocess = null;
      this.processor.disconnect();
      this.processor = null;
    }
    
    // Disconnect source
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    // Stop all tracks
    if (this.microphone) {
      this.microphone.getTracks().forEach(track => track.stop());
      this.microphone = null;
    }
    
    this.isListening = false;
    this.currentVolume = 0;
    this.currentFrequency = 0;
    this.audioFeatures.isSpeaking = false;
    this.audioFeatures.mouthOpenLevel = 0;
    this.currentLipState = this.lipStates.closed;
    
    console.log('[LipSync Engine] Listening stopped');
    
    if (this.callbacks.onStop) {
      this.callbacks.onStop();
    }
  }
  
  // Process audio data in real-time
  processAudio(audioProcessingEvent) {
    if (!this.analyser || !this.isListening) return;
    
    const inputBuffer = audioProcessingEvent.inputBuffer;
    const outputBuffer = audioProcessingEvent.outputBuffer;
    
    // Get frequency data
    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(frequencyData);
    
    // Get time domain data
    const timeDomainData = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(timeDomainData);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      sum += Math.abs(timeDomainData[i] - 128);
    }
    const averageVolume = sum / timeDomainData.length / 128;
    
    // Smooth the volume
    this.currentVolume = this.smoothingFactor * this.currentVolume + 
                         (1 - this.smoothingFactor) * averageVolume;
    
    // Calculate dominant frequency
    let maxFrequency = 0;
    let maxIndex = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxFrequency) {
        maxFrequency = frequencyData[i];
        maxIndex = i;
      }
    }
    
    const sampleRate = this.audioContext.sampleRate;
    this.currentFrequency = (maxIndex * sampleRate) / this.analyser.fftSize;
    
    // Update audio features
    this.audioFeatures.volume = this.currentVolume;
    this.audioFeatures.frequency = this.currentFrequency;
    this.audioFeatures.isSpeaking = this.currentVolume > this.volumeThreshold;
    this.audioFeatures.lastUpdateTime = Date.now();
    
    // Trigger volume change callback
    this.triggerVolumeChange(this.currentVolume);
    
    // Determine lip state based on volume and frequency
    const lipState = this.determineLipState();
    
    // Update lip state history
    this.lipStateHistory.push({
      state: lipState,
      volume: this.currentVolume,
      frequency: this.currentFrequency,
      time: Date.now()
    });
    
    if (this.lipStateHistory.length > this.maxHistory) {
      this.lipStateHistory.shift();
    }
    
    // Trigger lip change callback if state changed
    if (this.currentLipState !== lipState) {
      this.currentLipState = lipState;
      this.audioFeatures.mouthOpenLevel = lipState.value;
      this.triggerLipChange(lipState.name, lipState.value);
    }
    
    // Copy input to output (pass-through)
    const inputChannel = inputBuffer.getChannelData(0);
    const outputChannel = outputBuffer.getChannelData(0);
    for (let i = 0; i < inputChannel.length; i++) {
      outputChannel[i] = inputChannel[i];
    }
  }
  
  // Determine lip state based on audio analysis
  determineLipState() {
    const volume = this.currentVolume;
    const frequency = this.currentFrequency;
    
    // Check if speaking
    if (volume < this.volumeThreshold) {
      return this.lipStates.closed;
    }
    
    // Low frequency, low volume - slightly open
    if (volume < 0.1 && frequency < 500) {
      return this.lipStates.slightlyOpen;
    }
    
    // Medium frequency, medium volume - half open
    if (volume < 0.3 && frequency < 2000) {
      return this.lipStates.halfOpen;
    }
    
    // High frequency, high volume - open or wide open
    if (volume < 0.6) {
      return this.lipStates.open;
    }
    
    // Very high volume - wide open
    return this.lipStates.wideOpen;
  }
  
  // Get current lip state
  getCurrentLipState() {
    return {
      state: this.currentLipState.name,
      value: this.currentLipState.value,
      volume: this.currentVolume,
      frequency: this.currentFrequency,
      isSpeaking: this.audioFeatures.isSpeaking,
      mouthOpenLevel: this.audioFeatures.mouthOpenLevel
    };
  }
  
  // Get audio features
  getAudioFeatures() {
    return { ...this.audioFeatures };
  }
  
  // Get lip state history
  getLipStateHistory() {
    return [...this.lipStateHistory];
  }
  
  // Set volume threshold
  setVolumeThreshold(threshold) {
    this.volumeThreshold = Math.max(0, Math.min(1, threshold));
  }
  
  // Set smoothing factor
  setSmoothingFactor(factor) {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = this.smoothingFactor;
    }
  }
  
  // Analyze audio file for lip-sync
  async analyzeAudioFile(file) {
    console.log('[LipSync Engine] Analyzing audio file...');
    
    try {
      // Create object URL
      const audioUrl = URL.createObjectURL(file);
      
      // Create audio element
      const audio = new Audio(audioUrl);
      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = resolve;
        audio.onerror = reject;
      });
      
      // Create audio context for analysis
      const tempContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = tempContext.createMediaElementSource(audio);
      const analyser = tempContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = this.smoothingFactor;
      
      source.connect(analyser);
      
      // Create buffer for results
      const results = [];
      const sampleRate = audio.duration / 100; // 100 samples per second
      let lastTime = 0;
      
      // Process audio
      audio.addEventListener('play', () => {
        const processFrame = () => {
          if (audio.paused || audio.ended) return;
          
          const currentTime = audio.currentTime * 1000; // in ms
          if (currentTime - lastTime >= 10) { // 10ms interval
            lastTime = currentTime;
            
            const frequencyData = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(frequencyData);
            
            const timeDomainData = new Uint8Array(analyser.fftSize);
            analyser.getByteTimeDomainData(timeDomainData);
            
            let sum = 0;
            for (let i = 0; i < timeDomainData.length; i++) {
              sum += Math.abs(timeDomainData[i] - 128);
            }
            const averageVolume = sum / timeDomainData.length / 128;
            
            let maxFrequency = 0;
            let maxIndex = 0;
            for (let i = 0; i < frequencyData.length; i++) {
              if (frequencyData[i] > maxFrequency) {
                maxFrequency = frequencyData[i];
                maxIndex = i;
              }
            }
            
            const frequency = (maxIndex * tempContext.sampleRate) / analyser.fftSize;
            const lipState = this.determineLipStateFromVolume(averageVolume);
            
            results.push({
              time: currentTime,
              volume: averageVolume,
              frequency: frequency,
              lipState: lipState.name,
              mouthOpenLevel: lipState.value
            });
          }
          
          requestAnimationFrame(processFrame);
        };
        
        processFrame();
      });
      
      // Start playback
      audio.play();
      
      // Wait for audio to finish
      await new Promise((resolve) => {
        audio.onended = resolve;
      });
      
      // Clean up
      URL.revokeObjectURL(audioUrl);
      tempContext.close();
      
      console.log('[LipSync Engine] Audio analysis complete');
      return results;
    } catch (error) {
      console.error('[LipSync Engine] Error analyzing audio file:', error);
      this.triggerError('Audio file analysis failed: ' + error.message);
      return [];
    }
  }
  
  // Determine lip state from volume only
  determineLipStateFromVolume(volume) {
    if (volume < this.volumeThreshold) {
      return this.lipStates.closed;
    }
    
    if (volume < 0.1) {
      return this.lipStates.slightlyOpen;
    }
    
    if (volume < 0.3) {
      return this.lipStates.halfOpen;
    }
    
    if (volume < 0.6) {
      return this.lipStates.open;
    }
    
    return this.lipStates.wideOpen;
  }
  
  // Generate lip-sync data for text-to-speech
  generateLipSyncForTTS(text, duration) {
    console.log('[LipSync Engine] Generating lip-sync for TTS...');
    
    const words = text.split(/\s+/);
    const totalDuration = duration || 5000; // 5 seconds default
    const wordDuration = totalDuration / words.length;
    
    const lipSyncData = [];
    const now = Date.now();
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const startTime = now + (i * wordDuration);
      const endTime = startTime + wordDuration;
      
      // Estimate mouth open level based on word
      const mouthOpenLevel = this.estimateMouthOpenLevel(word);
      const lipState = this.getLipStateFromValue(mouthOpenLevel);
      
      lipSyncData.push({
        word: word,
        startTime: startTime,
        endTime: endTime,
        duration: wordDuration,
        lipState: lipState.name,
        mouthOpenLevel: mouthOpenLevel,
        volume: mouthOpenLevel * 0.8 + 0.2
      });
    }
    
    console.log('[LipSync Engine] TTS lip-sync data generated');
    return lipSyncData;
  }
  
  // Estimate mouth open level for a word
  estimateMouthOpenLevel(word) {
    const lowerWord = word.toLowerCase();
    
    // Vowels require more mouth opening
    const vowelCount = (lowerWord.match(/[aeiou]/g) || []).length;
    const consonantCount = word.length - vowelCount;
    
    // Longer words might have more variation
    const lengthFactor = Math.min(1, word.length / 8);
    
    // Calculate base level
    let level = (vowelCount / word.length) * 0.7 + 0.3;
    
    // Adjust based on specific letters
    if (/[mbp]/.test(lowerWord)) {
      level = Math.min(1, level + 0.1); // Bilabial sounds
    }
    
    if (/[fdv]/.test(lowerWord)) {
      level = Math.max(0.3, level - 0.1); // Labiodental sounds
    }
    
    if (/[aeiou]/.test(lowerWord)) {
      level = Math.min(1, level + 0.2); // Vowels
    }
    
    return Math.max(0, Math.min(1, level));
  }
  
  // Get lip state from value
  getLipStateFromValue(value) {
    if (value < 0.1) return this.lipStates.closed;
    if (value < 0.3) return this.lipStates.slightlyOpen;
    if (value < 0.6) return this.lipStates.halfOpen;
    if (value < 0.8) return this.lipStates.open;
    return this.lipStates.wideOpen;
  }
  
  // Start recording with lip-sync
  async startRecording() {
    if (!this.isListening) {
      await this.start();
    }
    
    this.recordingData = {
      startTime: Date.now(),
      frames: []
    };
    
    console.log('[LipSync Engine] Recording started');
    return true;
  }
  
  // Stop recording
  stopRecording() {
    if (this.recordingData) {
      this.recordingData.endTime = Date.now();
      console.log('[LipSync Engine] Recording stopped');
      
      const recording = this.recordingData;
      this.recordingData = null;
      return recording;
    }
    return null;
  }
  
  // Get current recording
  getCurrentRecording() {
    return this.recordingData || null;
  }
  
  // Clean up resources
  destroy() {
    console.log('[LipSync Engine] Cleaning up...');
    
    this.stop();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isProcessing = false;
    this.isListening = false;
    
    console.log('[LipSync Engine] Cleanup complete');
  }
  
  // Get engine status
  getStatus() {
    return {
      isListening: this.isListening,
      isProcessing: this.isProcessing,
      isModelLoaded: this.isModelLoaded,
      hasAudioContext: !!this.audioContext,
      hasMicrophoneAccess: !!this.microphone
    };
  }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LipSyncEngine;
}

// Export for browser
window.LipSyncEngine = LipSyncEngine;
