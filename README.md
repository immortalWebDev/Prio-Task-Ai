# Task Master - Next.js + TypeScript + Firebase + AI Prioritization

Task Master is a powerful task management app built using **Next.js**, **TypeScript**, and **Tailwind CSS**, integrated with **Firebase Realtime Database** for storage and authentication. It also features smart AI-driven task prioritization to help users focus on what truly matters.

## 🚀 Features

- ✅ Add, delete, and mark tasks as complete
- 🔐 User authentication (Firebase Auth)
- ☁️ Realtime data storage with Firebase RTDB
- 🤖 AI-powered task prioritization logic
- 🎨 Beautiful UI with Tailwind CSS
- 🧠 Smart, responsive UX with modern web standards

## 📦 Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Firebase Auth + Realtime DB**
- **Custom AI Integration**

## 🔧 Installation

```bash
git clone https://github.com/immortalWebDev/Prio-Task-Ai.git
cd task-master
npm install
```

## 🌐 Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:xxxx) to view it in your browser.

## 🔐 Environment Setup

Create a `.env.local` file in the root and add your Firebase config:

```env
GOOGLE_API=your_api
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

## 🤖 AI Prioritization

We use a lightweight AI layer that analyzes task urgency, deadlines, and user patterns to suggest a task priority order in real-time.

---

Built with ❤️ by [Piyush](https://web-portfolio-piyush.vercel.app/)

