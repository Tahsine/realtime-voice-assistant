# IRIS - Visual Intelligence Voice Assistant

<div align="center">
  <h3>Multimodal AI Assistant running on Gemini 3 Flash</h3>
  <p>Real-time Voice & Vision • LiveKit • Deepgram • Cartesia</p>
</div>

IRIS (Interactive Realtime Intelligence System) is an advanced AI assistant that brings professional-grade multimodal interaction to your desktop.

## 🌟 Overview

**IRIS** is a next-generation voice assistant capable of **seeing** and **understanding** your screen in real-time. Built for visual-first workflows, it combines ultra-low latency voice interaction with powerful multimodal capabilities.

Powered by **Gemini 3 Flash Preview**, IRIS can:
- 🗣️ **Conversate naturally** with sub-second latency
- 👁️ **See your screen** when shared and provide context-aware assistance
- 💻 **Analyze code**, summarize documents, or help debug UI in real-time
- 🎨 **Interact via a polished, glassmorphic UI** built with LiveKit Components

## 🚀 Tech Stack

- **Brain**: [Google Gemini 3 Flash Preview](https://ai.google.dev/)
- **Transport**: [LiveKit](https://livekit.io/) (Self-hosted WebRTC & Agents Framework)
- **Ears (STT)**: [Deepgram Nova-3](https://deepgram.com/)
- **Voice (TTS)**: [Cartesia Sonic-3](https://cartesia.ai/)
- **Frontend**: React, Vite, Lucide Icons, LiveKit Components
- **Backend**: Python 3.10+, FastAPI, LiveKit Agents

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Self-hosted LiveKit Server (or LiveKit Cloud)
- API Keys for: Google Gemini, Deepgram, Cartesia

### 1. Clone the Repository
```bash
git clone https://github.com/Tahsine/realtime-voice-assistant.git
cd realtime-voice-assistant
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Download Dependencies
Before running the agent, you must download the necessary model files:
```bash
python agent.py download-files
```

#### Environment Configuration
Create a `.env.local` file in the `backend/` directory:
```env
LIVEKIT_URL=ws://localhost:7880  # Your self-hosted URL
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
GOOGLE_API_KEY=your_gemini_key
DEEPGRAM_API_KEY=your_deepgram_key
CARTESIA_API_KEY=your_cartesia_key
```

#### Running the Backend
You need to run **both** the Token Server and the Agent:
1. **Start the Token Server (for frontend connection):**
   ```bash
   python server.py
   ```
2. **Start the Agent (in a new terminal):**
   ```bash
   python agent.py dev
   ```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

#### Environment Configuration
Create a `.env.local` file in the `frontend/` directory:
```env
VITE_BACKEND_URL=http://localhost:8000
```

#### Running the Client
```bash
npm run dev
```

## 🎮 Usage

1. Open the frontend at `http://localhost:5173`.
2. Click **Start Experience**.
3. Allow microphone access.
4. Talk to IRIS!
5. Use the **Screen Share** button (Upload icon) in the control bar to share your screen.
6. Ask: *"What's on my screen right now?"* or *"Help me explain this code."*

## 📄 License
MIT
