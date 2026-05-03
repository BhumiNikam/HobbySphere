<div align="center">

# 🌐 HobbySphere

**A full-stack, real-time social platform where hobbyists discover communities, share content, and connect — built for scale and deployed to production.**

[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)

🔗 **Live Demo:** [https://hobbysphere.in/](https://hobbysphere.in/)

</div>

---

## 📌 Overview

HobbySphere is a production-deployed social networking platform built around shared interests. Users can join hobby-based communities, create and share image posts, engage with others through likes and comments, send real-time messages, and stay notified — all in one seamless experience.

> Built with the **MERN stack** + Socket.IO + Cloudinary — fully deployed and live.

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based stateless authentication (Access + Refresh Tokens)
- Secure password hashing with bcryptjs
- Protected routes on both frontend and backend

### 📝 Posts & Community Feed
- Create posts with **image uploads** (stored on Cloudinary)
- Community-specific feeds — see content relevant to your hobbies
- Post detail pages with full engagement context

### ❤️ Real-Time Engagement
- **Like / Unlike** system with live count updates via Socket.IO
- **Comment system** with real-time additions
- **Real-time notifications** — get alerted instantly when someone interacts with your content

### 💬 Real-Time Messaging
- Direct messaging between users powered by Socket.IO
- Instant message delivery with conversation history

### 🔍 Discovery
- **Clickable hashtags** — explore posts by topic
- **Search** users, communities, and posts
- Community-based browsing and filtering

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│          Frontend (React + Vite)        │
│  Vercel CDN — Global Edge Deployment    │
└──────────────────┬──────────────────────┘
                   │  REST API + Socket.IO
┌──────────────────▼──────────────────────┐
│       Backend (Node.js + Express)       │
│       Render — Auto-scaling Server      │
│  Socket.IO  ─► Real-time events         │
│  JWT Auth   ─► Secure endpoints         │
│  Cloudinary ─► Image upload & CDN       │
└──────────────────┬──────────────────────┘
                   │  Mongoose ODM
┌──────────────────▼──────────────────────┐
│           MongoDB Atlas (Cloud)         │
│  Collections: Users · Posts · Messages  │
│              Notifications · Communities│
└─────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite), Tailwind CSS, Axios, Socket.IO Client |
| **Backend** | Node.js, Express, Socket.IO |
| **Database** | MongoDB, Mongoose |
| **Auth** | JWT (Access + Refresh), bcryptjs |
| **Media Storage** | Cloudinary |
| **Hosting** | Vercel (Frontend), Render (Backend), MongoDB Atlas |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account for image uploads

---

### 1. Clone the Repository

```bash
git clone https://github.com/AniketKasav/hobbysphere.git
cd hobbysphere
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 📂 Project Structure

```
hobbysphere/
├── backend/
│   ├── config/           # DB connection
│   ├── controllers/      # Route logic (auth, posts, messages, notifications)
│   ├── middleware/        # Auth guards
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routers
│   ├── services/          # Cloudinary, Socket.IO events
│   ├── utils/             # Helpers
│   └── server.js          # Entry point
│
└── frontend/
    └── src/
        ├── components/   # Feed, PostCard, Notifications, Chat, etc.
        ├── pages/         # Home, Profile, Community, Explore, Messages
        ├── context/       # AuthContext, SocketContext
        └── hooks/         # useAuth, usePosts, useSocket
```

---

## 🌍 Deployment

| Service | Platform |
|---|---|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) |
| Database | [MongoDB Atlas](https://mongodb.com/atlas) |
| Media CDN | [Cloudinary](https://cloudinary.com) |

🔗 Live at: **[https://hobbysphere.in/](https://hobbysphere.in/)**

---

## 👨‍💻 Author

**Aniket Kasav**  
BE — Artificial Intelligence & Data Science  
[![GitHub](https://img.shields.io/badge/GitHub-AniketKasav-181717?style=flat&logo=github)](https://github.com/AniketKasav)

---

## 📜 License

© 2026 Aniket Kasav — All rights reserved.
