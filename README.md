# LipSync AI Studio Pro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/abdulraheemnohri/LipSync-AI-Studio-Pro.svg)](https://github.com/abdulraheemnohri/LipSync-AI-Studio-Pro/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/abdulraheemnohri/LipSync-AI-Studio-Pro.svg)](https://github.com/abdulraheemnohri/LipSync-AI-Studio-Pro/issues)

---

## ���� اردو میں

### LipSync AI Studio Pro کیا ہے؟

LipSync AI Studio Pro ایک **offline-first** براؤزر بیسڈ AI ایپلی کیشن ہے جو آپ کو **AI avatars** بنانے، **lip-sync** کرنے، اور **voice recordings** کو سنبھالنے کی سہولت فراہم کرتی ہے۔ یہ ایپلی کیشن **WebLLM** (MLC AI) کو سپورٹ کرتی ہے، جس سے آپ براہ راست براؤزر میں **Gemma 2B**, **Qwen 3B**, **Llama 3.2 1B**, اور **Llama 3.1 8B** جیسے AI ماڈلز چلا سکتے ہیں۔

### خاصبات (Features)

✅ **Complete Offline Support** - PWA (Progressive Web App) کی شکل میں کام کرتی ہے، کوئی انٹرنیٹ کنکشن ضروری نہیں
✅ **AI Avatar Studio** - اپنے کسٹم avatars بنائیں اور انہیں پرسنلائز کریں
✅ **LipSync Engine** - آواز کو سن کر ہونٹوں کو حرکت دیں (Real-time lip-sync)
✅ **Voice Studio** - آواز ریکارڈ کریں، ایڈٹ کریں، اور پروسیس کریں
✅ **AI Chat Studio** - AI سے بات چیت کریں اور avatars کے ساتھ بات چیت کریں
✅ **Model Manager** - مختلف AI ماڈلز کو لوڈ اور مینیج کریں
✅ **Camera Integration** - کیمرے سے چہرے کو ٹریک کریں
✅ **Export Functionality** - اپنے پراجیکٹس کو ویڈیو یا GIF کی شکل میں ایکسپورٹ کریں
✅ **Settings & Customization** - ہر چیز کو اپنے مطابق سیٹ کریں

### سپورٹڈ AI ماڈلز

| ماڈل | سائز | RAM ضرورت | GPU سپورٹ |
|------|------|-----------|-----------|
| Gemma 2B | ~1.5 GB | 4 GB | ✅ |
| Qwen 3B | ~2 GB | 6 GB | ✅ |
| Llama 3.2 1B | ~0.8 GB | 3 GB | ✅ |
| Llama 3.1 8B | ~5 GB | 12 GB | ✅ |

### انسٹالیشن

1. **براہ راست استعمال**
   - اس ریپوزٹری کو کلون کریں:
     ```bash
     git clone https://github.com/abdulraheemnohri/LipSync-AI-Studio-Pro.git
     ```
   - `index.html` فائل کو براؤزر میں کھولیں

2. **PWA کے طور پر انسٹال**
   - براؤزر میں `index.html` کھولنے کے بعد، ایڈریس بار میں **Install** بٹن پر کلک کریں
   - یا **Settings > Install App** پر جائیں

3. **لوکل سرور پر چلانے کے لیے**
   ```bash
   cd LipSync-AI-Studio-Pro
   python -m http.server 8000
   # یا
   npx serve
   ```

### فائلز کی ساخت

```
LipSync-AI-Studio-Pro/
├── index.html              # مین HTML فائل
├── manifest.json           # PWA manifest
├── service-worker.js      # Service worker (offline support)
├── README.md               # ڈاکومنٹیشن
├── .gitignore              # Git ignore rules
├── css/
│   ├── style.css          # مین CSS
│   └── animations.css     # اینیمیشنز
├── js/
│   ├── app.js             # مین ایپلی کیشن لاجک
│   ├── audio-engine.js    # آواز انجن
│   ├── avatar-engine.js   # ایواتار انجن
│   ├── camera-engine.js   # کیمرہ انجن
│   ├── database.js        # IndexedDB مینیجر
│   ├── exporter.js        # ایکسپورٹ فنکشنز
│   ├── lipsync-engine.js  # لپ سنک انجن
│   ├── settings.js        # سیٹنگز مینیجر
│   └── webllm-engine.js   # WebLLM انٹیگریشن
├── assets/
│   ├── avatars/           # ایواتارز
│   │   ├── default.svg
│   │   └── robot.svg
│   ├── icons/             # ایپ آئیکونز
│   └── models/
│       └── webllm/        # WebLLM ماڈلز (لوکل کیش)
└── .github/               # GitHub کنفیگریشن
```

### ٹیکنالوجی اسٹیک

- **Frontend**: HTML5, CSS3, JavaScript (ES Modules)
- **AI/ML**: WebLLM (MLC AI), TensorFlow.js
- **Audio**: Web Audio API, MediaRecorder API
- **Storage**: IndexedDB, LocalStorage
- **Offline**: Service Worker, Cache API
- **Camera**: MediaDevices API, Face Detection
- **Export**: Canvas API, FFmpeg.js (for video export)

### براؤزر سپورٹ

| براؤزر | سپورٹ | نوٹس |
|--------|-------|------|
| Chrome | ✅ | کامل سپورٹ |
| Firefox | ✅ | کام کرے گا |
| Edge | ✅ | کام کرے گا |
| Safari | ⚠️ | محدود سپورٹ |
| Mobile Browsers | ❌ | ابھی سپورٹ نہیں |

---

## 🇬🇧 English

### What is LipSync AI Studio Pro?

LipSync AI Studio Pro is a **offline-first** browser-based AI application that allows you to create **AI avatars**, perform **lip-sync**, and manage **voice recordings**. It supports **WebLLM** (MLC AI), enabling you to run AI models like **Gemma 2B**, **Qwen 3B**, **Llama 3.2 1B**, and **Llama 3.1 8B** directly in your browser.

### Features

✅ **Complete Offline Support** - Works as a PWA, no internet connection required
✅ **AI Avatar Studio** - Create and customize your own avatars
✅ **LipSync Engine** - Real-time lip-sync with voice input
✅ **Voice Studio** - Record, edit, and process voice
✅ **AI Chat Studio** - Chat with AI and interact with avatars
✅ **Model Manager** - Load and manage different AI models
✅ **Camera Integration** - Track faces using your camera
✅ **Export Functionality** - Export projects as video or GIF
✅ **Settings & Customization** - Customize everything to your liking

### Supported AI Models

| Model | Size | RAM Required | GPU Support |
|-------|------|--------------|-------------|
| Gemma 2B | ~1.5 GB | 4 GB | ✅ |
| Qwen 3B | ~2 GB | 6 GB | ✅ |
| Llama 3.2 1B | ~0.8 GB | 3 GB | ✅ |
| Llama 3.1 8B | ~5 GB | 12 GB | ✅ |

### Installation

1. **Direct Use**
   - Clone this repository:
     ```bash
     git clone https://github.com/abdulraheemnohri/LipSync-AI-Studio-Pro.git
     ```
   - Open `index.html` in your browser

2. **Install as PWA**
   - After opening `index.html` in browser, click **Install** button in address bar
   - Or go to **Settings > Install App**

3. **Run on Local Server**
   ```bash
   cd LipSync-AI-Studio-Pro
   python -m http.server 8000
   # or
   npx serve
   ```

### File Structure

```
LipSync-AI-Studio-Pro/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── service-worker.js      # Service worker (offline support)
├── README.md               # Documentation
├── .gitignore              # Git ignore rules
├── css/
│   ├── style.css          # Main CSS
│   └── animations.css     # Animations
├── js/
│   ├── app.js             # Main application logic
│   ├── audio-engine.js    # Audio engine
│   ├── avatar-engine.js   # Avatar engine
│   ├── camera-engine.js   # Camera engine
│   ├── database.js        # IndexedDB manager
│   ├── exporter.js        # Export functions
│   ├── lipsync-engine.js  # LipSync engine
│   ├── settings.js        # Settings manager
│   └── webllm-engine.js   # WebLLM integration
├── assets/
│   ├── avatars/           # Avatars
│   │   ├── default.svg
│   │   └── robot.svg
│   ├── icons/             # App icons
│   └── models/
│       └── webllm/        # WebLLM models (local cache)
└── .github/               # GitHub configuration
```

### Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES Modules)
- **AI/ML**: WebLLM (MLC AI), TensorFlow.js
- **Audio**: Web Audio API, MediaRecorder API
- **Storage**: IndexedDB, LocalStorage
- **Offline**: Service Worker, Cache API
- **Camera**: MediaDevices API, Face Detection
- **Export**: Canvas API, FFmpeg.js (for video export)

### Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ | Full support |
| Firefox | ✅ | Should work |
| Edge | ✅ | Should work |
| Safari | ⚠️ | Limited support |
| Mobile Browsers | ❌ | Not supported yet |

---

## 📜 Usage Guide

### Getting Started

1. Open `index.html` in a supported browser (Chrome recommended)
2. Wait for the application to load
3. Navigate through different sections using the sidebar

### Main Sections

1. **Dashboard** - Overview of all features and quick actions
2. **Avatar Studio** - Create and customize avatars
3. **LipSync Control** - Control lip-sync with voice input
4. **Voice Studio** - Record and edit voice
5. **AI Chat Studio** - Chat with AI models
6. **Model Manager** - Download and manage AI models
7. **Settings** - Configure application settings

### Tips

- For best performance, use Chrome with GPU acceleration enabled
- Close other tabs to free up memory for larger models
- Use headphones for better voice recording quality
- Clear cache in settings if you encounter issues

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [MLC AI](https://github.com/mlc-ai) for WebLLM
- [TensorFlow.js](https://www.tensorflow.org/js) for ML in browser
- [Material Icons](https://fonts.google.com/icons) for UI icons
- All contributors and users of this project

---

## 📞 Contact

For questions or support, please open an issue on GitHub:
[https://github.com/abdulraheemnohri/LipSync-AI-Studio-Pro/issues](https://github.com/abdulraheemnohri/LipSync-AI-Studio-Pro/issues)

---

**Made with ❤️ by Abdulraheem Nohari**

[![GitHub Profile](https://img.shields.io/badge/GitHub-AbdulraheemNohari-blue?style=flat&logo=github)](https://github.com/abdulraheemnohri)
