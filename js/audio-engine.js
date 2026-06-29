/**
 * LipSync AI Studio Pro - Audio Engine
 * Handles audio recording, playback, analysis, and processing
 * with Web Audio API
 */

import db from './database.js';
import settings from './settings.js';

/**
 * Audio Engine Class
 * Manages all audio operations including recording, playback,
 * analysis, and effects processing
 */
class AudioEngine {
    constructor() {
        // Audio context and nodes
        this.audioContext = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.audioUrl = null;
        this.audioElement = null;
        this.analyser = null;
        this.dataArray = null;
        this.sourceNode = null;
        this.processorNode = null;
        
        // Audio analysis data
        this.volume = 0;
        this.pitch = 0;
        this.rhythm = 0;
        this.phonemes = [];
        this.frequencyData = null;
        this.timeDomainData = null;
        
        // Recording state
        this.isRecording = false;
        this.isPlaying = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timerInterval = null;
        
        // Audio effects
        this.echoNode = null;
        this.reverbNode = null;
        this.pitchShift = 0;
        this.playbackRate = 1;
        
        // Callbacks
        this.onVolumeChange = null;
        this.onPitchChange = null;
        this.onPhonemeDetected = null;
        this.onRecordingStart = null;
        this.onRecordingStop = null;
        this.onPlaybackStart = null;
        this.onPlaybackStop = null;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize audio context and components
     */
    init() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.minDecibels = -90;
            this.analyser.maxDecibels = -10;
            this.analyser.smoothingTimeConstant = 0.85;
            
            // Create frequency and time domain arrays
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
            
            // Create audio element for playback
            this.audioElement = new Audio();
            this.audioElement.preload = 'auto';
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('Audio Engine initialized');
        } catch (error) {
            console.error('Failed to initialize Audio Engine:', error);
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (!this.audioElement) return;
        
        this.audioElement.onplay = () => {
            this.isPlaying = true;
            if (this.onPlaybackStart) this.onPlaybackStart();
        };
        
        this.audioElement.onpause = () => {
            this.isPlaying = false;
            if (this.onPlaybackStop) this.onPlaybackStop();
        };
        
        this.audioElement.onended = () => {
            this.isPlaying = false;
            if (this.onPlaybackStop) this.onPlaybackStop();
        };
        
        this.audioElement.onerror = (error) => {
            console.error('Audio playback error:', error);
            this.isPlaying = false;
        };
    }
    
    /**
     * Start recording audio
     * @returns {Promise<boolean>}
     */
    async startRecording() {
        if (this.isRecording) {
            console.log('Already recording');
            return false;
        }
        
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });
            
            // Create media recorder
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/wav'
            });
            this.audioChunks = [];
            
            // Set up event handlers
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
                stream.getTracks().forEach(track => track.stop());
                if (this.onRecordingStop) this.onRecordingStop();
            };
            
            this.mediaRecorder.onerror = (error) => {
                console.error('MediaRecorder error:', error);
                this.isRecording = false;
            };
            
            // Start recording
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;
            
            // Setup audio analysis
            this.setupAudioAnalysis(stream);
            
            // Start timer
            this.startTimer();
            
            if (this.onRecordingStart) this.onRecordingStart();
            
            console.log('Recording started');
            return true;
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.isRecording = false;
            return false;
        }
    }
    
    /**
     * Stop recording
     * @returns {boolean}
     */
    stopRecording() {
        if (!this.isRecording) {
            console.log('Not recording');
            return false;
        }
        
        try {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Stop timer
            this.stopTimer();
            
            // Disconnect analyser
            this.disconnectAnalyser();
            
            console.log('Recording stopped');
            return true;
        } catch (error) {
            console.error('Failed to stop recording:', error);
            return false;
        }
    }
    
    /**
     * Process recorded audio
     */
    processRecording() {
        if (this.audioChunks.length === 0) return;
        
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        this.audioElement.src = this.audioUrl;
        
        // Save to database
        this.saveRecordingToDatabase();
        
        console.log('Recording processed:', this.audioBlob.size, 'bytes');
    }
    
    /**
     * Save recording to database
     */
    async saveRecordingToDatabase() {
        if (!this.audioBlob || !this.audioUrl) return;
        
        try {
            const duration = this.elapsedTime;
            const audioData = {
                name: `Recording ${new Date().toLocaleTimeString()}`,
                type: 'recording',
                blob: this.audioBlob,
                url: this.audioUrl,
                duration: duration
            };
            
            await db.createAudio(audioData);
            console.log('Recording saved to database');
        } catch (error) {
            console.error('Failed to save recording to database:', error);
        }
    }
    
    /**
     * Setup audio analysis
     * @param {MediaStream} stream - Audio stream
     */
    setupAudioAnalysis(stream) {
        try {
            // Disconnect previous nodes
            this.disconnectAnalyser();
            
            // Create source node from stream
            this.sourceNode = this.audioContext.createMediaStreamSource(stream);
            
            // Connect to analyser
            this.sourceNode.connect(this.analyser);
            
            // Create script processor for phoneme detection
            this.processorNode = this.audioContext.createScriptProcessor(2048, 1, 1);
            this.processorNode.onaudioprocess = () => {
                this.analyseAudio();
            };
            
            this.analyser.connect(this.processorNode);
            this.processorNode.connect(this.audioContext.destination);
            
            // Start analysis loop
            this.startAnalysisLoop();
            
        } catch (error) {
            console.error('Failed to setup audio analysis:', error);
        }
    }
    
    /**
     * Disconnect analyser nodes
     */
    disconnectAnalyser() {
        if (this.sourceNode) {
            try {
                this.sourceNode.disconnect();
            } catch (e) {}
            this.sourceNode = null;
        }
        
        if (this.processorNode) {
            try {
                this.processorNode.disconnect();
            } catch (e) {}
            this.processorNode = null;
        }
    }
    
    /**
     * Analyse audio data
     */
    analyseAudio() {
        try {
            if (!this.analyser || !this.frequencyData) return;
            
            // Get frequency data
            this.analyser.getByteFrequencyData(this.frequencyData);
            
            // Get time domain data
            this.analyser.getByteTimeDomainData(this.timeDomainData);
            
            // Calculate volume (RMS)
            this.calculateVolume();
            
            // Calculate pitch
            this.calculatePitch();
            
            // Calculate rhythm
            this.calculateRhythm();
            
            // Detect phonemes
            this.detectPhonemes();
            
        } catch (error) {
            console.error('Audio analysis error:', error);
        }
    }
    
    /**
     * Calculate volume from time domain data
     */
    calculateVolume() {
        if (!this.timeDomainData) return;
        
        let sum = 0;
        for (let i = 0; i < this.timeDomainData.length; i++) {
            // Convert to signed value (-1 to 1)
            const value = (this.timeDomainData[i] - 128) / 128;
            sum += value * value;
        }
        const rms = Math.sqrt(sum / this.timeDomainData.length);
        this.volume = Math.min(100, rms * 100 * 2);
        
        if (this.onVolumeChange) {
            this.onVolumeChange(this.volume);
        }
    }
    
    /**
     * Calculate pitch from frequency data
     */
    calculatePitch() {
        if (!this.frequencyData) return;
        
        // Simple pitch detection using autocorrelation
        // This is a simplified version
        const bufferSize = this.frequencyData.length;
        const sampleRate = this.audioContext.sampleRate;
        
        // Find the peak frequency
        let maxIndex = 0;
        let maxValue = 0;
        
        for (let i = 0; i < bufferSize; i++) {
            if (this.frequencyData[i] > maxValue) {
                maxValue = this.frequencyData[i];
                maxIndex = i;
            }
        }
        
        const nyquist = sampleRate / 2;
        this.pitch = (maxIndex / bufferSize) * nyquist;
        
        if (this.onPitchChange) {
            this.onPitchChange(this.pitch);
        }
    }
    
    /**
     * Calculate rhythm (BPM estimation)
     */
    calculateRhythm() {
        // This is a placeholder for rhythm detection
        // A real implementation would use onset detection
        if (this.volume > 50) {
            this.rhythm = Math.random() * 60 + 60; // 60-120 BPM
        } else {
            this.rhythm = 0;
        }
    }
    
    /**
     * Detect phonemes from audio data
     */
    detectPhonemes() {
        if (this.volume < 5) {
            // No sound, clear phonemes
            this.phonemes = [];
            return 'silence';
        }
        
        // Get frequency bands
        const bands = this.getFrequencyBands();
        
        // Simple vowel/consonant detection based on frequency bands
        let phoneme = 'vowel';
        
        if (bands.high > bands.low * 1.5) {
            phoneme = 'fricative'; // s, sh, f
        } else if (bands.low > bands.mid * 1.2) {
            phoneme = 'vowel'; // a, e, i, o, u
        } else if (bands.mid > bands.low * 1.2) {
            phoneme = 'nasal'; // m, n
        } else {
            phoneme = 'plosive'; // p, b, t, d
        }
        
        // Add to phoneme history
        this.phonemes.push({
            type: phoneme,
            volume: this.volume,
            pitch: this.pitch,
            timestamp: Date.now()
        });
        
        // Keep only recent phonemes
        if (this.phonemes.length > 100) {
            this.phonemes.shift();
        }
        
        if (this.onPhonemeDetected) {
            this.onPhonemeDetected(phoneme, this.phonemes);
        }
        
        return phoneme;
    }
    
    /**
     * Get frequency bands
     * @returns {Object}
     */
    getFrequencyBands() {
        if (!this.frequencyData) {
            return { low: 0, mid: 0, high: 0 };
        }
        
        const bufferLength = this.frequencyData.length;
        
        let lowSum = 0;
        let midSum = 0;
        let highSum = 0;
        
        const lowEnd = Math.floor(bufferLength / 3);
        const midEnd = Math.floor(bufferLength * 2 / 3);
        
        for (let i = 0; i < lowEnd; i++) {
            lowSum += this.frequencyData[i];
        }
        
        for (let i = lowEnd; i < midEnd; i++) {
            midSum += this.frequencyData[i];
        }
        
        for (let i = midEnd; i < bufferLength; i++) {
            highSum += this.frequencyData[i];
        }
        
        return {
            low: lowSum / lowEnd,
            mid: midSum / (midEnd - lowEnd),
            high: highSum / (bufferLength - midEnd)
        };
    }
    
    /**
     * Start analysis loop
     */
    startAnalysisLoop() {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
        }
        
        this.analysisInterval = setInterval(() => {
            if (this.isRecording) {
                this.analyseAudio();
            }
        }, 50);
    }
    
    /**
     * Stop analysis loop
     */
    stopAnalysisLoop() {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
    }
    
    /**
     * Start timer
     */
    startTimer() {
        this.stopTimer();
        this.startTime = Date.now();
        this.elapsedTime = 0;
        
        this.timerInterval = setInterval(() => {
            this.elapsedTime = (Date.now() - this.startTime) / 1000;
        }, 100);
    }
    
    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    /**
     * Get formatted time
     * @returns {string}
     */
    getFormattedTime() {
        const hours = Math.floor(this.elapsedTime / 3600);
        const minutes = Math.floor((this.elapsedTime % 3600) / 60);
        const seconds = Math.floor(this.elapsedTime % 60);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Play audio
     * @param {string} url - Audio URL to play
     * @returns {boolean}
     */
    playAudio(url = null) {
        if (this.isPlaying) {
            this.stopPlayback();
        }
        
        try {
            const audioUrl = url || this.audioUrl;
            if (!audioUrl) {
                console.log('No audio to play');
                return false;
            }
            
            this.audioElement.src = audioUrl;
            this.audioElement.currentTime = 0;
            
            this.audioElement.play();
            this.isPlaying = true;
            
            // Setup audio analysis for playback
            this.setupPlaybackAnalysis();
            
            if (this.onPlaybackStart) this.onPlaybackStart();
            
            console.log('Audio playback started');
            return true;
        } catch (error) {
            console.error('Failed to play audio:', error);
            this.isPlaying = false;
            return false;
        }
    }
    
    /**
     * Stop playback
     * @returns {boolean}
     */
    stopPlayback() {
        if (!this.isPlaying) return false;
        
        try {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            this.isPlaying = false;
            
            // Disconnect analyser
            this.disconnectAnalyser();
            
            // Stop analysis loop
            this.stopAnalysisLoop();
            
            if (this.onPlaybackStop) this.onPlaybackStop();
            
            console.log('Audio playback stopped');
            return true;
        } catch (error) {
            console.error('Failed to stop playback:', error);
            return false;
        }
    }
    
    /**
     * Setup playback analysis
     */
    setupPlaybackAnalysis() {
        try {
            // Disconnect previous nodes
            this.disconnectAnalyser();
            
            // Create source node from audio element
            this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
            
            // Connect to analyser
            this.sourceNode.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // Start analysis loop
            this.startAnalysisLoop();
            
        } catch (error) {
            console.error('Failed to setup playback analysis:', error);
        }
    }
    
    /**
     * Load audio from file
     * @param {File} file - Audio file
     * @returns {Promise<Object>}
     */
    async loadAudioFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    this.audioBlob = new Blob([event.target.result], { type: file.type });
                    this.audioUrl = URL.createObjectURL(this.audioBlob);
                    this.audioElement.src = this.audioUrl;
                    
                    // Get duration
                    const duration = await this.getAudioDuration(file);
                    
                    // Save to database
                    const audioData = {
                        name: file.name.replace(/\.[^/.]+$/, ""),
                        type: 'upload',
                        blob: this.audioBlob,
                        url: this.audioUrl,
                        duration: duration
                    };
                    
                    await db.createAudio(audioData);
                    
                    resolve({
                        blob: this.audioBlob,
                        url: this.audioUrl,
                        duration: duration,
                        name: file.name
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    /**
     * Get audio duration
     * @param {File} file - Audio file
     * @returns {Promise<number>}
     */
    async getAudioDuration(file) {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(file);
            const audio = new Audio();
            
            audio.onloadedmetadata = () => {
                resolve(audio.duration);
                URL.revokeObjectURL(url);
            };
            
            audio.onerror = () => {
                // Fallback estimation
                const sizeInMB = file.size / (1024 * 1024);
                // Assume 1MB = ~1 minute for WAV
                resolve(sizeInMB * 60);
                URL.revokeObjectURL(url);
            };
            
            audio.src = url;
        });
    }
    
    /**
     * Get audio analysis data
     * @returns {Object}
     */
    getAnalysisData() {
        return {
            volume: this.volume,
            pitch: this.pitch,
            rhythm: this.rhythm,
            phonemes: this.phonemes,
            isRecording: this.isRecording,
            isPlaying: this.isPlaying,
            elapsedTime: this.elapsedTime,
            formattedTime: this.getFormattedTime()
        };
    }
    
    /**
     * Get waveform data
     * @returns {Array}
     */
    getWaveformData() {
        if (!this.timeDomainData) return [];
        
        const waveform = [];
        for (let i = 0; i < this.timeDomainData.length; i += 10) {
            waveform.push(this.timeDomainData[i]);
        }
        return waveform;
    }
    
    /**
     * Get frequency data
     * @returns {Array}
     */
    getFrequencyData() {
        if (!this.frequencyData) return [];
        return Array.from(this.frequencyData);
    }
    
    /**
     * Apply audio effects
     * @param {Object} effects - Effects to apply
     */
    applyEffects(effects = {}) {
        const {
            echo = 0,
            reverb = 0,
            pitchShift = 0,
            playbackSpeed = 1
        } = effects;
        
        this.echo = echo;
        this.reverb = reverb;
        this.pitchShift = pitchShift;
        this.playbackRate = playbackSpeed;
        
        // Apply effects to audio element
        if (this.audioElement) {
            this.audioElement.playbackRate = playbackSpeed;
        }
    }
    
    /**
     * Export audio
     * @param {string} format - Export format
     * @returns {Promise<string>}
     */
    async exportAudio(format = 'wav') {
        if (!this.audioBlob) {
            throw new Error('No audio to export');
        }
        
        const audioUrl = URL.createObjectURL(this.audioBlob);
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = `recording.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up URL after download
        setTimeout(() => {
            URL.revokeObjectURL(audioUrl);
        }, 100);
        
        return audioUrl;
    }
    
    /**
     * Register callbacks
     */
    onVolumeChange(callback) {
        this.onVolumeChange = callback;
    }
    
    onPitchChange(callback) {
        this.onPitchChange = callback;
    }
    
    onPhonemeDetected(callback) {
        this.onPhonemeDetected = callback;
    }
    
    onRecordingStart(callback) {
        this.onRecordingStart = callback;
    }
    
    onRecordingStop(callback) {
        this.onRecordingStop = callback;
    }
    
    onPlaybackStart(callback) {
        this.onPlaybackStart = callback;
    }
    
    onPlaybackStop(callback) {
        this.onPlaybackStop = callback;
    }
    
    /**
     * Check if audio engine is supported
     * @returns {boolean}
     */
    static isSupported() {
        return window.AudioContext || window.webkitAudioContext;
    }
    
    /**
     * Check if microphone is available
     * @returns {Promise<boolean>}
     */
    static async isMicrophoneAvailable() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Clean up
     */
    cleanup() {
        this.stopRecording();
        this.stopPlayback();
        this.stopTimer();
        this.stopAnalysisLoop();
        this.disconnectAnalyser();
        
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
            this.audioUrl = null;
        }
        
        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch (e) {}
            this.audioContext = null;
        }
        
        this.onVolumeChange = null;
        this.onPitchChange = null;
        this.onPhonemeDetected = null;
        this.onRecordingStart = null;
        this.onRecordingStop = null;
        this.onPlaybackStart = null;
        this.onPlaybackStop = null;
    }
}

// Create singleton instance
const audioEngine = new AudioEngine();

// Export for use in other modules
export default audioEngine;
