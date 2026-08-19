# 🎵 Mehfil App

> A modern, interactive media player application built with React, TypeScript, and Vite. Experience your favorite audio and video content with a beautiful, responsive interface.

[![React](https://img.shields.io/badge/React-18.x-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple?logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## ✨ Features

- 🎧 **Rich Media Playback** - Play audio and video content seamlessly
- 🎨 **Beautiful UI** - Modern, responsive design with scene backgrounds
- 🎼 **Vibe Switching** - Multiple playback modes and themes
- 🎬 **YouTube Integration** - Support for YouTube audio extraction (experimental)
- ⚡ **Lightning Fast** - Built with Vite for instant development feedback
- 📱 **Responsive Design** - Works beautifully on desktop and mobile devices
- 🎯 **Type Safe** - Full TypeScript support for robust code

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn installed

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mehfil-app.git
   cd mehfil-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
# or
yarn build
```

The optimized build will be generated in the `dist/` directory.

---

## 📁 Project Structure

```
mehfil-app/
├── src/
│   ├── components/          # React components
│   │   ├── PlayerBar.tsx    # Main media player controls
│   │   ├── TopBar.tsx       # Header navigation
│   │   ├── VibeSwitcher.tsx # Theme/mode switcher
│   │   └── SceneBackground.tsx
│   ├── utils/
│   │   └── youtubeConverter.ts  # YouTube URL utilities
│   ├── App.tsx              # Main application component
│   ├── vibes.ts             # Playback tracks configuration
│   ├── main.tsx             # Application entry point
│   └── styles/
│       ├── App.css
│       └── index.css
├── public/
│   ├── audio/               # Audio files
│   ├── videos/              # Video files
│   └── images/              # Image assets
├── package.json
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── README.md
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool & dev server |
| **CSS3** | Styling & animations |
| **HTML5 Audio/Video** | Media playback |

---

## 📖 Usage

### Adding Your Own Media

1. **Audio Files**: Place MP3 files in `public/audio/`
2. **Video Files**: Place video files in `public/videos/`
3. **Images**: Add images to `public/images/`
4. **Configure Tracks**: Update `src/vibes.ts` with your media paths

### Example Track Configuration

```typescript
export const tracks = [
  {
    id: 1,
    title: "Track Name",
    artist: "Artist Name",
    source: "/audio/track.mp3"  // Local file
  }
];
```

---

## 🎬 YouTube Integration (Experimental)

Mehfil App includes experimental support for YouTube audio extraction. 

**Current Status**: ⚠️ Limited functionality due to YouTube's anti-scraping measures

**Recommended Workaround**:
1. Add local MP3 files to `public/audio/`
2. Reference them in your tracks configuration
3. Use external YouTube-to-MP3 services for conversion

For production YouTube integration, consider:
- **RapidAPI YouTube to MP3** - Easy API integration
- **yt-dlp** - Reliable command-line tool
- **Streaming APIs** - Spotify, Apple Music, YouTube Music (with authentication)

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Code follows the existing style
- TypeScript types are properly defined
- No console errors in the browser
- Changes are tested

---

## 📝 Available Scripts

```bash
# Development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run type checking
npm run type-check

# Lint code (if configured)
npm run lint
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
npm run dev -- --port 3000
```

### YouTube Audio Not Loading
- Ensure `youtubeConverter.ts` is properly configured
- Check browser console for error messages
- Use local audio files as fallback

### TypeScript Errors
```bash
npm run type-check
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👤 Author

Created with ❤️ for music lovers and developers

---

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev)
- Powered by [React](https://react.dev)
- Enhanced with [TypeScript](https://www.typescriptlang.org)

---

<div align="center">

**⭐ If you found this project helpful, please consider giving it a star!**

[Report Issue](https://github.com/yourusername/mehfil-app/issues) · [Request Feature](https://github.com/yourusername/mehfil-app/issues) · [View Demo](#)

</div>
