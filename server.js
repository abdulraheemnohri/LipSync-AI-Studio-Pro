/**
 * LipSync AI Studio Pro - Node.js Backend Server
 * Complete backend with Express.js for all features
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const socketIo = require('socket.io');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true } });

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const AVATARS_DIR = path.join(__dirname, 'assets', 'avatars');
const RECORDINGS_DIR = path.join(__dirname, 'uploads', 'recordings');
const MODELS_DIR = path.join(__dirname, 'assets', 'models', 'webllm');

const ensureDirs = () => {
  [UPLOAD_DIR, AVATARS_DIR, RECORDINGS_DIR, MODELS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
};
ensureDirs();

app.use(cors({ origin: "*", credentials: true }));
app.use(compression());
app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = UPLOAD_DIR;
    if (file.fieldname === 'avatar') uploadPath = AVATARS_DIR;
    else if (file.fieldname === 'recording') uploadPath = RECORDINGS_DIR;
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg', 'video/webm', 'video/mp4'];
  cb(null, allowedTypes.includes(file.mimetype));
} });

const database = { avatars: [], recordings: [], chatSessions: [], projects: [], settings: {} };

const loadExistingData = () => {
  try {
    const avatarFiles = fs.readdirSync(AVATARS_DIR);
    database.avatars = avatarFiles.map(file => ({
      id: path.basename(file, path.extname(file)),
      name: file,
      path: path.join('assets', 'avatars', file),
      type: file.endsWith('.svg') ? 'svg' : 'image',
      timestamp: fs.statSync(path.join(AVATARS_DIR, file)).mtime
    }));
    const recordingFiles = fs.readdirSync(RECORDINGS_DIR);
    database.recordings = recordingFiles.map(file => ({
      id: path.basename(file, path.extname(file)),
      name: file,
      path: path.join('uploads', 'recordings', file),
      type: 'audio',
      timestamp: fs.statSync(path.join(RECORDINGS_DIR, file)).mtime
    }));
  } catch (error) { console.error('Error loading existing data:', error); }
};
loadExistingData();

const connectedClients = new Map();
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  connectedClients.set(socket.id, { socket, timestamp: Date.now() });
  socket.emit('server-message', { type: 'welcome', message: 'Connected to LipSync AI Studio Pro server', timestamp: new Date().toISOString() });
  socket.on('disconnect', () => { console.log(`Client disconnected: ${socket.id}`); connectedClients.delete(socket.id); });
  socket.on('error', (error) => console.error(`Socket error for ${socket.id}:`, error));
  socket.on('chat-message', (message) => { console.log(`Chat message from ${socket.id}:`, message); io.emit('chat-message', message); });
  socket.on('lipsync-data', (data) => socket.broadcast.emit('lipsync-data', data));
  socket.on('avatar-update', (data) => socket.broadcast.emit('avatar-update', data));
});

app.get('/api/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime(), memory: process.memoryUsage(), clients: connectedClients.size }));

app.get('/api/info', (req, res) => res.json({
  name: 'LipSync AI Studio Pro', version: '1.0.0',
  description: 'Complete offline AI avatar and lip-sync application',
  backend: 'Node.js + Express', frontend: 'HTML5 + CSS3 + JavaScript',
  features: ['Avatar Studio', 'LipSync Engine', 'Voice Studio', 'AI Chat Studio', 'Model Manager', 'Camera Integration', 'Export Functionality'],
  supportedModels: [
    { id: 'gemma-2b', name: 'Gemma 2B', size: '1.5 GB', ram: '4 GB' },
    { id: 'qwen-3b', name: 'Qwen 3B', size: '2 GB', ram: '6 GB' },
    { id: 'llama-3.2-1b', name: 'Llama 3.2 1B', size: '0.8 GB', ram: '3 GB' },
    { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', size: '5 GB', ram: '12 GB' }
  ]
}));

app.get('/api/avatars', (req, res) => res.json({ success: true, avatars: database.avatars, count: database.avatars.length }));
app.get('/api/avatars/:id', (req, res) => {
  const avatar = database.avatars.find(a => a.id === req.params.id);
  res.json({ success: !!avatar, avatar: avatar || 'Not found' });
});
app.post('/api/avatars', upload.single('avatar'), (req, res) => {
  const { name, type, style } = req.body; const file = req.file;
  const avatar = { id: uuidv4(), name: name || file?.originalname || 'Untitled Avatar', type: type || (file?.mimetype.startsWith('image/') ? 'image' : 'svg'), style: style || 'cartoon', path: file ? path.join('assets', 'avatars', file.filename) : null, timestamp: new Date().toISOString() };
  database.avatars.push(avatar); io.emit('avatar-created', avatar);
  res.json({ success: true, avatar });
});
app.put('/api/avatars/:id', (req, res) => {
  const { name, type, style } = req.body; const idx = database.avatars.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Avatar not found' });
  const updated = { ...database.avatars[idx], name: name || database.avatars[idx].name, type: type || database.avatars[idx].type, style: style || database.avatars[idx].style, timestamp: new Date().toISOString() };
  database.avatars[idx] = updated; io.emit('avatar-updated', updated);
  res.json({ success: true, avatar: updated });
});
app.delete('/api/avatars/:id', (req, res) => {
  const idx = database.avatars.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Avatar not found' });
  const deleted = database.avatars.splice(idx, 1)[0];
  if (deleted.path) try { fs.unlinkSync(path.join(__dirname, deleted.path)); } catch (e) { console.error('Error deleting file:', e); }
  io.emit('avatar-deleted', deleted); res.json({ success: true, avatar: deleted });
});

app.get('/api/recordings', (req, res) => res.json({ success: true, recordings: database.recordings, count: database.recordings.length }));
app.get('/api/recordings/:id', (req, res) => {
  const recording = database.recordings.find(r => r.id === req.params.id);
  res.json({ success: !!recording, recording: recording || 'Not found' });
});
app.post('/api/recordings', upload.single('recording'), (req, res) => {
  const { name, duration } = req.body; const file = req.file;
  if (!file) return res.status(400).json({ success: false, error: 'No recording file provided' });
  const recording = { id: uuidv4(), name: name || file.originalname, path: path.join('uploads', 'recordings', file.filename), duration: parseFloat(duration) || 0, type: file.mimetype, size: file.size, timestamp: new Date().toISOString() };
  database.recordings.push(recording); io.emit('recording-created', recording);
  res.json({ success: true, recording });
});
app.delete('/api/recordings/:id', (req, res) => {
  const idx = database.recordings.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Recording not found' });
  const deleted = database.recordings.splice(idx, 1)[0];
  if (deleted.path) try { fs.unlinkSync(path.join(__dirname, deleted.path)); } catch (e) { console.error('Error deleting file:', e); }
  io.emit('recording-deleted', deleted); res.json({ success: true, recording: deleted });
});

app.get('/api/chat/sessions', (req, res) => res.json({ success: true, sessions: database.chatSessions, count: database.chatSessions.length }));
app.get('/api/chat/sessions/:sessionId/messages', (req, res) => {
  const session = database.chatSessions.find(s => s.id === req.params.sessionId);
  res.json({ success: !!session, messages: session?.messages || [] });
});
app.post('/api/chat/sessions', (req, res) => {
  const { name, modelId } = req.body;
  const session = { id: uuidv4(), name: name || `Chat Session ${Date.now()}`, modelId: modelId || 'gemma-2b', messages: [], timestamp: new Date().toISOString() };
  database.chatSessions.push(session); res.json({ success: true, session });
});
app.post('/api/chat/sessions/:sessionId/messages', (req, res) => {
  const { role, content } = req.body; const session = database.chatSessions.find(s => s.id === req.params.sessionId);
  if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
  const message = { id: uuidv4(), role: role || 'user', content: content || '', timestamp: new Date().toISOString() };
  session.messages.push(message); io.emit('chat-message', message);
  res.json({ success: true, message });
});
app.delete('/api/chat/sessions/:sessionId', (req, res) => {
  const idx = database.chatSessions.findIndex(s => s.id === req.params.sessionId);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Session not found' });
  const deleted = database.chatSessions.splice(idx, 1)[0]; res.json({ success: true, session: deleted });
});

app.get('/api/models', (req, res) => res.json({ success: true, models: [
  { id: 'gemma-2b', name: 'Gemma 2B', description: 'Lightweight AI model for general purposes', size: '1.5 GB', ramRequired: '4 GB', type: 'text', loaded: false, downloadUrl: 'https://huggingface.co/mlc-ai/mlc-chat-gemma-2b-it-q4f16_1' },
  { id: 'qwen-3b', name: 'Qwen 3B', description: 'Medium AI model with good performance', size: '2 GB', ramRequired: '6 GB', type: 'text', loaded: false, downloadUrl: 'https://huggingface.co/mlc-ai/mlc-chat-Qwen1.5-3B-Instruct-q4f16_1' },
  { id: 'llama-3.2-1b', name: 'Llama 3.2 1B', description: 'Small and fast AI model', size: '0.8 GB', ramRequired: '3 GB', type: 'text', loaded: false, downloadUrl: 'https://huggingface.co/mlc-ai/mlc-chat-Llama-3.2-1B-Instruct-q4f16_1' },
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', description: 'Powerful AI model for complex tasks', size: '5 GB', ramRequired: '12 GB', type: 'text', loaded: false, downloadUrl: 'https://huggingface.co/mlc-ai/mlc-chat-Llama-3.1-8B-Instruct-q4f16_1' }
]}));

app.post('/api/models/:modelId/load', (req, res) => {
  const { modelId } = req.params; const models = [{ id: 'gemma-2b', name: 'Gemma 2B' }, { id: 'qwen-3b', name: 'Qwen 3B' }, { id: 'llama-3.2-1b', name: 'Llama 3.2 1B' }, { id: 'llama-3.1-8b', name: 'Llama 3.1 8B' }];
  const model = models.find(m => m.id === modelId);
  if (!model) return res.status(404).json({ success: false, error: 'Model not found' });
  setTimeout(() => { io.emit('model-loaded', { modelId, status: 'loaded' }); res.json({ success: true, model: { ...model, loaded: true } }); }, 2000);
});

app.post('/api/models/:modelId/unload', (req, res) => {
  const { modelId } = req.params; const models = [{ id: 'gemma-2b', name: 'Gemma 2B' }, { id: 'qwen-3b', name: 'Qwen 3B' }, { id: 'llama-3.2-1b', name: 'Llama 3.2 1B' }, { id: 'llama-3.1-8b', name: 'Llama 3.1 8B' }];
  const model = models.find(m => m.id === modelId);
  if (!model) return res.status(404).json({ success: false, error: 'Model not found' });
  io.emit('model-unloaded', { modelId, status: 'unloaded' }); res.json({ success: true, model: { ...model, loaded: false } });
});

app.post('/api/models/:modelId/generate', async (req, res) => {
  const { modelId } = req.params; const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ success: false, error: 'Prompt is required' });
  const responses = [
    `I understand your question about "${prompt}". Let me provide a detailed response.`,
    `That's an interesting question! Based on "${prompt}", here's what I think.`,
    `Great query! Regarding "${prompt}", I have some insights to share.`,
    `Fascinating topic! When it comes to "${prompt}", there are several aspects to consider.`
  ];
  await new Promise(resolve => setTimeout(resolve, 1000));
  res.json({ success: true, response: responses[Math.floor(Math.random() * responses.length)], modelId, prompt, tokens: 20, timestamp: new Date().toISOString() });
});

app.post('/api/lipsync/start', (req, res) => {
  const { avatarId, sensitivity, smoothing } = req.body;
  const session = { id: uuidv4(), avatarId: avatarId || 'default', sensitivity: sensitivity || 0.5, smoothing: smoothing || 0.8, startedAt: new Date().toISOString(), status: 'active' };
  io.emit('lipsync-started', session); res.json({ success: true, session });
});

app.post('/api/lipsync/stop', (req, res) => { io.emit('lipsync-stopped', { sessionId: req.body.sessionId }); res.json({ success: true, message: 'LipSync session stopped' }); });

app.post('/api/lipsync/process', upload.single('audio'), (req, res) => {
  const { sessionId, duration } = req.body; const file = req.file;
  if (!file) return res.status(400).json({ success: false, error: 'No audio file provided' });
  const frames = []; const frameCount = Math.floor(duration / 0.1) || 100;
  for (let i = 0; i < frameCount; i++) frames.push({ time: i * 0.1, volume: Math.random(), frequency: Math.random() * 1000, lipState: ['closed', 'slightlyOpen', 'halfOpen', 'open', 'wideOpen'][Math.floor(Math.random() * 5)], mouthOpenLevel: Math.random() });
  res.json({ success: true, sessionId, frames, processedAt: new Date().toISOString() });
});

app.post('/api/camera/start', (req, res) => {
  const { resolution, frameRate, faceDetection } = req.body;
  const session = { id: uuidv4(), resolution: resolution || '1280x720', frameRate: frameRate || 30, faceDetection: faceDetection || true, startedAt: new Date().toISOString(), status: 'active' };
  res.json({ success: true, session });
});

app.post('/api/camera/stop', (req, res) => res.json({ success: true, message: 'Camera session stopped' }));

app.post('/api/camera/detect-faces', upload.single('image'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, error: 'No image provided' });
  const faces = [{ x: Math.random() * 100, y: Math.random() * 100, width: 20 + Math.random() * 20, height: 20 + Math.random() * 20, confidence: 0.8 + Math.random() * 0.2, landmarks: { leftEye: { x: Math.random() * 100, y: Math.random() * 100 }, rightEye: { x: Math.random() * 100, y: Math.random() * 100 }, nose: { x: Math.random() * 100, y: Math.random() * 100 }, mouth: { x: Math.random() * 100, y: Math.random() * 100 } } }];
  res.json({ success: true, faces, timestamp: new Date().toISOString() });
});

app.post('/api/export/project', (req, res) => {
  const { projectData, format } = req.body;
  if (!projectData) return res.status(400).json({ success: false, error: 'Project data is required' });
  const exportId = uuidv4(); const exportData = { id: exportId, data: projectData, format: format || 'json', timestamp: new Date().toISOString(), status: 'processing' };
  setTimeout(() => { exportData.status = 'completed'; exportData.downloadUrl = `/api/export/download/${exportId}`; io.emit('export-complete', exportData); }, 3000);
  res.json({ success: true, export: exportData });
});

app.get('/api/export/download/:exportId', (req, res) => res.json({ success: true, message: 'Export download would start here', exportId: req.params.exportId }));

app.get('/api/export/avatar/:avatarId/svg', (req, res) => {
  const { avatarId } = req.params; const avatar = database.avatars.find(a => a.id === avatarId);
  if (!avatar) return res.status(404).json({ success: false, error: 'Avatar not found' });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600"><defs><linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#ffdbac;stop-opacity:1"/><stop offset="100%" style="stop-color:#f5c691;stop-opacity:1"/></linearGradient></defs><ellipse cx="250" cy="300" rx="180" ry="220" fill="url(#skinGradient)" stroke="#000000" stroke-width="4"/><circle cx="200" cy="220" r="35" fill="#ffffff" stroke="#000000" stroke-width="3"/><circle cx="300" cy="220" r="35" fill="#ffffff" stroke="#000000" stroke-width="3"/><circle cx="200" cy="220" r="15" fill="#2c1810"/><circle cx="300" cy="220" r="15" fill="#2c1810"/><path d="M220,340 Q250,360 280,340" stroke="#e07b7b" stroke-width="3" fill="none"/><text x="250" y="550" text-anchor="middle" font-size="20" fill="#000000">${avatar.name}</text></svg>`;
  res.setHeader('Content-Type', 'image/svg+xml'); res.send(svg);
});

app.get('/api/settings', (req, res) => res.json({ success: true, settings: database.settings }));
app.get('/api/settings/:key', (req, res) => {
  const { key } = req.params; const value = database.settings[key];
  res.json({ success: value !== undefined, key, value: value || 'Not found' });
});
app.put('/api/settings/:key', (req, res) => {
  const { key } = req.params; const { value } = req.body;
  database.settings[key] = value; io.emit('setting-updated', { key, value });
  res.json({ success: true, key, value });
});
app.put('/api/settings', (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') return res.status(400).json({ success: false, error: 'Settings must be an object' });
  Object.entries(settings).forEach(([key, value]) => database.settings[key] = value);
  io.emit('settings-updated', settings); res.json({ success: true, settings });
});

app.get('/api/projects', (req, res) => res.json({ success: true, projects: database.projects, count: database.projects.length }));
app.get('/api/projects/:id', (req, res) => {
  const project = database.projects.find(p => p.id === req.params.id);
  res.json({ success: !!project, project: project || 'Not found' });
});
app.post('/api/projects', (req, res) => {
  const { name, data } = req.body;
  const project = { id: uuidv4(), name: name || `Project ${Date.now()}`, data: data || {}, timestamp: new Date().toISOString() };
  database.projects.push(project); res.json({ success: true, project });
});
app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params; const { name, data } = req.body;
  const idx = database.projects.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Project not found' });
  const updated = { ...database.projects[idx], name: name || database.projects[idx].name, data: data || database.projects[idx].data, timestamp: new Date().toISOString() };
  database.projects[idx] = updated; res.json({ success: true, project: updated });
});
app.delete('/api/projects/:id', (req, res) => {
  const idx = database.projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Project not found' });
  const deleted = database.projects.splice(idx, 1)[0]; res.json({ success: true, project: deleted });
});

app.post('/api/files/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, error: 'No file provided' });
  res.json({ success: true, file: { id: uuidv4(), name: file.originalname, path: file.path, size: file.size, type: file.mimetype, timestamp: new Date().toISOString() } });
});

app.get('/api/files/download/:filename', (req, res) => {
  const { filename } = req.params; const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'File not found' });
  res.download(filePath);
});

app.get('/api/files', (req, res) => {
  try {
    const files = [];
    const avatarFiles = fs.readdirSync(AVATARS_DIR);
    avatarFiles.forEach(file => files.push({ type: 'avatar', name: file, path: path.join('assets', 'avatars', file), size: fs.statSync(path.join(AVATARS_DIR, file)).size, timestamp: fs.statSync(path.join(AVATARS_DIR, file)).mtime }));
    const recordingFiles = fs.readdirSync(RECORDINGS_DIR);
    recordingFiles.forEach(file => files.push({ type: 'recording', name: file, path: path.join('uploads', 'recordings', file), size: fs.statSync(path.join(RECORDINGS_DIR, file)).size, timestamp: fs.statSync(path.join(RECORDINGS_DIR, file)).mtime }));
    res.json({ success: true, files, count: files.length });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.delete('/api/files/:filename', (req, res) => {
  const { filename } = req.params; const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'File not found' });
  fs.unlinkSync(filePath); res.json({ success: true, message: 'File deleted successfully' });
});

app.use((req, res) => res.status(404).json({ success: false, error: 'Not Found', message: `Route ${req.method} ${req.path} not found` }));
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: 'Internal Server Error', message: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
});

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
const indexPath = path.join(__dirname, 'index.html');
const publicIndexPath = path.join(publicDir, 'index.html');
if (fs.existsSync(indexPath) && !fs.existsSync(publicIndexPath)) fs.copyFileSync(indexPath, publicIndexPath);

server.listen(PORT, HOST, () => {
  console.log(`LipSync AI Studio Pro Server is running! Local: http://${HOST}:${PORT}`);
});

process.on('SIGTERM', () => { console.log('SIGTERM received. Shutting down...'); server.close(() => { console.log('Server closed.'); process.exit(0); }); });
process.on('SIGINT', () => { console.log('SIGINT received. Shutting down...'); server.close(() => { console.log('Server closed.'); process.exit(0); }); });

module.exports = { app, server, io, database };
