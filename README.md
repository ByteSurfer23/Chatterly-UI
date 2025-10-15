# 🎙️ Audio Meeting Manager 🗓️

Welcome to **Audio Meeting Manager**, the ultimate app to organize your meetings effortlessly! 🚀  

Upload your audio recordings, get **automatic transcriptions**, **summaries**, and **deadlines**, and even **sync them with Google Calendar**! 📝✨

---

## 🌟 Features

- 🎧 **Upload WAV audio files** of your meetings
- 📝 **Automatic transcription** with **Whisper**
- 💡 **Summarization & Deadline extraction** using GPT models
- 📅 **Sync deadlines directly to Google Calendar** via **Google Cloud API**
- 🔐 **Secure authentication** using **Google OAuth 2.0**
- 🔥 **Database backend** powered by **Firebase** for real-time storage
- ⚡ **Fast API server** for audio processing and AI computations

---

## 🏗️ Tech Stack

- **Frontend:** Next.js + Firebase Auth (Google OAuth 2.0)
- **Styling:** Tailwind CSS + ShadCN
- **Backend / API:** FastAPI  
- **Database:** Firebase (BaaS)  
- **ML Models:**  
  - Whisper → Speech-to-text transcription  
  - GPT small → Summarization & deadline extraction  
- **Calendar Integration:** Google Cloud API  

---

## 🚀 How It Works

1. 🎤 Upload your meeting audio (WAV format) in the dashboard.  
2. 🤖 FastAPI server uses **Whisper** to transcribe the audio with timestamps.  
3. 🧠 GPT model analyzes the transcript to generate a **concise summary** and **extract deadlines**.  
4. 📆 Deadlines are added to your **Google Calendar** automatically.  
5. 💾 All data (transcripts, summaries, deadlines) is stored in **Firebase** for easy access anytime.  

---

## ⚡ Getting Started

1. Clone this repo:  
   ```bash
   git clone https://github.com/yourusername/audio-meeting-manager.git
   cd audio-meeting-manager
