// Audio Engine
class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioBlob = null;
    this.audioUrl = null;
    this.isRecording = false;
    this.volume = 0;
    this.startTime = 0;
    this.elapsedTime = 0;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.audioElement = new Audio();
    } catch (error) {
      console.error('Audio init error:', error);
    }
  }
  
  async startRecording() {
    if (this.isRecording) return false;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      
      this.mediaRecorder.onstop = () => {
        this.processRecording();
        stream.getTracks().forEach(track => track.stop());
      };
      
      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.startTime = Date.now();
      return true;
    } catch (error) {
      console.error('Recording error:', error);
      return false;
    }
  }
  
  stopRecording() {
    if (!this.isRecording) return false;
    this.mediaRecorder.stop();
    this.isRecording = false;
    this.elapsedTime = (Date.now() - this.startTime) / 1000;
    return true;
  }
  
  processRecording() {
    if (this.audioChunks.length === 0) return;
    this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
    this.audioUrl = URL.createObjectURL(this.audioBlob);
    this.audioElement.src = this.audioUrl;
  }
  
  playAudio() {
    if (!this.audioUrl) return false;
    this.audioElement.play();
    return true;
  }
  
  getFormattedTime() {
    const hours = Math.floor(this.elapsedTime / 3600);
    const minutes = Math.floor((this.elapsedTime % 3600) / 60);
    const seconds = Math.floor(this.elapsedTime % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

const audioEngine = new AudioEngine();
export default audioEngine;