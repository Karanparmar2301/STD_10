# 🎓 Student Dashboard - Modern School ERP

A modern, full-stack student dashboard built with **React + Redux** frontend and **FastAPI + Supabase** backend. Designed for Class 1 students and parents to track academic progress, attendance, homework, rewards, and learning games.

---

## ✨ Key Features

### 🔐 Authentication & Security
- ✅ Supabase Email/Password Authentication
- ✅ Email Verification Required
- ✅ JWT Token-based Sessions
- ✅ Protected Dashboard Routes
- ✅ Row Level Security (RLS) at Database Level

### 📊 Dashboard Sections
- 🏠 **Student Profile** - View and update student details
- 📊 **Attendance** - Track attendance records and percentages
- 📚 **Homework** - Manage assignments with status tracking
- 📢 **Announcements** - View school notices and updates
- 🏆 **Rewards** - Track points and achievements
- 🎮 **Learning Games** - Interactive educational mini-games
- 🤖 **AI Assistant** - Chat interface for learning support

### 🎨 UI/UX Highlights
- 📱 Mobile-First Responsive Design
- 🎨 Modern Sidebar Navigation
- ✨ Smooth Animations with Framer Motion
- 🌈 Professional Color Scheme
- 💫 Enhanced User Feedback
- 🌗 Dark / Light Mode with smooth CSS variable transitions
- 🎉 Celebration Screen on level-up/badge events

---

## 🛠️ Technology Stack

### Backend (Python)
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.109.0 | Web framework for REST API |
| **Uvicorn** | 0.27.0 | ASGI application server |
| **Python-dotenv** | 1.0.0 | Environment variable management |
| **Httpx** | 0.27.2 | Async HTTP client for Supabase |
| **Jinja2** | 3.1.3 | Template engine |
| **Python-multipart** | 0.0.6 | Multipart form data parsing |

### Frontend (React)
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI component library |
| **React DOM** | 18.2.0 | React renderer for web |
| **React Router** | 6.21.0 | Client-side routing |
| **Redux Toolkit** | 2.0.1 | State management |
| **React Redux** | 9.0.4 | React bindings for Redux |
| **Axios** | 1.6.2 | HTTP client |
| **Framer Motion** | 10.16.16 | Animation library |
| **Vite** | 5.0.8 | Build tool & dev server |

### Database & Backend Services
| Service | Type | Purpose |
|---------|------|---------|
| **Supabase** | Backend-as-a-Service | PostgreSQL, Auth, REST API, RLS |
| **PostgreSQL** | Database | Relational data storage |
| **Supabase Auth** | Authentication | JWT tokens, email verification |
| **Row Level Security** | Security | Database-level access control |

---

## 📁 Project Structure

```
c:\student dashboard\
├── 🐍 Backend (Python)
│   ├── main.py                    # FastAPI application (2100+ lines)
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Environment variables
│   ├── *_setup.sql               # Database initialization scripts
│   └── backend/
│       ├── gamification_engine.py # XP, level, badge calculation logic
│       └── ai_insights.py         # AI insights & analytics generator
│
├── ⚛️ Frontend (React)
│   └── frontend/
│       ├── package.json           # npm dependencies
│       ├── vite.config.js         # Vite configuration
│       ├── index.html             # Entry HTML
│       └── src/
│           ├── main.jsx           # React entry point
│           ├── App.jsx            # Root component
│           ├── index.css          # Global styles + CSS theme variables
│           ├── pages/             # Route components (5 pages)
│           ├── components/        # Reusable UI components (30+)
│           ├── store/             # Redux state management (10 slices + ThemeContext)
│           └── services/          # API client services
│
└── 📚 Documentation
    └── README.md                  # This file
```

---

## 📦 Installation & Setup

### Prerequisites
- **Python 3.8+**
- **Node.js 16+** & **npm**
- **Supabase Account** (Free tier available)

### 1. Backend Setup

```powershell
# Navigate to project root
cd "c:\student dashboard"

# Create virtual environment (optional)
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate  # Windows

# Install Python dependencies
pip install -r requirements.txt
```

**Dependencies (from requirements.txt):**
- fastapi==0.109.0
- uvicorn==0.27.0
- python-dotenv==1.0.0
- httpx==0.27.2
- jinja2==3.1.3
- python-multipart==0.0.6

### 2. Frontend Setup

```powershell
# Navigate to frontend folder
cd frontend

# Install npm packages
npm install
```

**Core Dependencies (from package.json):**
- react@^18.2.0
- react-dom@^18.2.0
- react-router-dom@^6.21.0
- @reduxjs/toolkit@^2.0.1
- react-redux@^9.0.4
- axios@^1.6.2
- @supabase/supabase-js@^2.39.3
- framer-motion@^10.16.16
- vite@^5.0.8

### 3. Environment Configuration

Create `.env` file in project root:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_public_key
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🚀 Running the Application

### Option 1: Automated (Recommended)

```powershell
cd "c:\student dashboard"
.\start-servers.bat
```

This runs both backend and frontend automatically.

### Option 2: Manual Start

**Terminal 1 - Backend (FastAPI):**
```powershell
cd "c:\student dashboard"
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 - Frontend (React with Vite):**
```powershell
cd "c:\student dashboard\frontend"
npm run dev
```

### Access the Application

- 🌐 **Frontend:** http://localhost:3000
- 📚 **API Documentation:** http://localhost:8000/docs
- 📡 **Backend Health Check:** http://localhost:8000/

---

## 📊 Database Tables

The application uses 6 main tables in Supabase PostgreSQL:

1. **parents** - Student/parent profiles with KPIs
2. **game_sessions** - Game play history and scores
3. **alphabet_analytics** - Letter learning analytics
4. **homework** - Assignment tracking
5. **announcements** - School notifications
6. **attendance** - Daily attendance records

All tables have Row Level Security (RLS) enabled for data isolation.

---

## 🔌 API Endpoints

### Authentication
> Auth (signup, login, email verification) is handled entirely by the **Supabase JS client** on the frontend — no backend routes needed.

### Dashboard & Profile
```
GET    /                              → Health check
GET    /api/dashboard/{uid}           → Student profile + full KPIs
GET    /api/profile/check/{uid}       → Check if profile exists
POST   /api/profile/create            → Create new student profile
PATCH  /api/profile/{uid}             → Update student profile fields
```

### Homework
```
GET  /api/homework/{uid}             → Get homework list with submission status
POST /api/homework/submit            → Submit homework answer (awards XP)
```

### Attendance
```
GET  /api/attendance/{uid}           → Get attendance records
POST /api/attendance                 → Mark today's attendance
```

### Games
```
POST /api/game/complete              → Save game session + award XP
GET  /api/games/stats/{uid}          → Get game history & stats
```

### Announcements
```
GET  /api/announcements/{uid}        → Get school announcements
POST /api/announcement/read          → Mark announcement as read
```

### Gamification
```
POST /api/action/complete            → Trigger a gamification event
POST /api/gamification/process       → Process XP/badge logic via engine
GET  /api/gamification/status/{uid}  → Get current XP, level, badges, streak
```

### Analytics & Insights
```
GET  /api/analytics/student/{uid}    → Student performance analytics
GET  /api/analytics/performance/{uid} → Detailed performance breakdown
GET  /api/insights/{uid}             → AI-generated learning insights
```

### AI Assistant
```
POST /api/assistant/chat             → Send message, get AI reply
GET  /api/assistant/history/{uid}    → Retrieve last 40 chat messages
```

---

## 🏗️ Architecture Overview

### Frontend Architecture
- **React 18** with functional components and hooks
- **Redux Toolkit** for global state management with 8 slices
- **React Router** v6 for client-side routing
- **Framer Motion** for smooth animations
- **Axios** for HTTP requests to backend
- **Component-scoped CSS** for styling

### Backend Architecture
- **FastAPI** with async/await for high performance
- **Pydantic** for request/response validation
- **CORS Middleware** for frontend communication
- **Supabase REST API** integration for database access
- **JWT Token** verification for protection
- **Httpx AsyncClient** for async Supabase calls

### State Management (Redux Slices)
```
├── authSlice         → User authentication & session
├── studentSlice      → Student profile & KPIs
├── uiSlice           → UI state (sidebar, active section)
├── gamificationSlice → XP, levels, badges, streaks, celebrations
├── attendanceSlice   → Attendance data
├── homeworkSlice     → Homework assignments & submissions
├── announcementsSlice → School announcements
├── aiSlice           → AI assistant chat history
├── gamesSlice        → Game sessions, scores, completion state
└── insightsSlice     → AI insights, analytics, gamification events
```

### Theme System
```
├── ThemeContext.jsx  → React context for dark/light mode
│                      useTheme() hook, localStorage persistence,
│                      data-theme attribute on <html>
└── index.css         → CSS variables: --theme-bg, --theme-card,
                        --theme-topbar-*, --theme-sidebar-*,
                        --theme-bubble-ai-*, etc.
```

---

## 🔒 Security Features

- ✅ **JWT Token Authentication** - Secure user sessions
- ✅ **Row Level Security (RLS)** - Database-level access control
- ✅ **Email Verification** - Required before access
- ✅ **CORS Protection** - Restricted cross-origin requests
- ✅ **Environment Variables** - Sensitive credentials in .env
- ✅ **Supabase Auth** - Industry-standard authentication

---

## 📱 Component Overview

### Page Components (5)
- **Login.jsx** - User authentication
- **Signup.jsx** - New user registration
- **VerifyEmail.jsx** - Email verification workflow
- **Dashboard.jsx** - Main dashboard with all sections
- **ProfilePage.jsx** - Full dedicated profile page (`/profile` route)

### Dashboard Section Components (8)
- **DashboardOverview.jsx** - Home overview with stats
- **Attendance.jsx** - Attendance tracking
- **Homework.jsx** - Assignment management
- **Announcements.jsx** - School announcements
- **Games.jsx** - Mini-game collection
- **Rewards.jsx** - Points, badges, AI insights display
- **AIAssistant.jsx** - ChatGPT-style learning chat interface
- **CelebrationScreen.jsx** - Full-screen level-up / badge celebration

### Reusable Components (20+)
- Layout: Sidebar, Topbar, DashboardHeader
- Cards: InfoCard, StatCard, HomeworkCard, GameCard
- UI: NotificationBadge, XPProgressBar, SubjectFilter
- Animations: XPAnimation, SkeletonLoader
- Modals: BadgeModal, ProfileCompletionModal, ProfileEditDrawer
- AI: AIInsightCard, AnalyticsDashboard
- Attendance: AttendanceCalendar, AttendanceHeatmap, AttendanceProgress, AttendanceStatsCard, WeeklyGoalTracker
- Notifications: AttendanceReminder
- Games: GameResultModal (XP/badge result overlay)

---

## 🎮 Games Included

The Games component contains mini-games for learning:
- Alphabet Race Game
- Color Match Game
- Counting Stars Game
- Math Quest Game
- Memory Flip Game
- Number Match Game
- Shape Finder Game
- Spelling Bee Game
- Word Builder Game

---

## ⚙️ Development Commands

```powershell
# Frontend
cd frontend
npm run dev              # Start dev server
npm run build           # Production build
npm run preview         # Preview production build

# Backend
python -m uvicorn main:app --reload --port 8000

# Full Stack
.\start-servers.bat     # Automated startup (Windows)
```

---

## 🚀 Deployment

### Backend Deployment
```bash
# Install production dependencies
pip install -r requirements.txt

# Run with ASGI server
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend Deployment
```bash
# Build optimized production bundle
cd frontend
npm run build
# Deploy 'dist' folder to static hosting or CDN
```

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "ModuleNotFoundError: No module named 'fastapi'"**
```powershell
pip install -r requirements.txt
```

**Port 8000 already in use:**
```powershell
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

**CORS errors:**
- Verify `CORS_ORIGINS` in `.env` includes your frontend URL
- Restart backend server

### Frontend Issues

**Port 3000 already in use:**
- Vite automatically tries 3001, 3002, etc.
- Or manually specify: `npm run dev -- --port 3001`

**Module not found errors:**
```powershell
cd frontend
npm install
npm run dev
```

**Build fails:**
```powershell
cd frontend
rm -r node_modules dist
npm install
npm run build
```

---

## 📊 Project Statistics

- **Backend:** 2100+ lines of FastAPI code
- **Frontend Components:** 30+ reusable components
- **Redux Slices:** 10 state management modules
- **Database Tables:** 6+ with RLS policies
- **Mini-Games:** 9 educational games
- **API Endpoints:** 20+ documented endpoints
- **Routes:** 5 frontend pages (Login, Signup, VerifyEmail, Dashboard, Profile)
- **Backend Engines:** 2 helper modules (gamification_engine, ai_insights)

---

## 🔧 Best Practices

### Development
- Always run both servers (backend + frontend) during development
- Use Redux DevTools for state debugging
- Check browser console for frontend errors
- Monitor backend logs in terminal

### Code Organization
- Keep components under 500 lines
- Use Redux for global state only
- Component-scoped CSS for styling
- Meaningful, descriptive variable names

### Performance
- Use lazy loading for heavy components
- Redux selectors prevent unnecessary re-renders
- Minimize API calls with proper caching
- Use Vite's production build for bundling

### Security
- Keep `.env` files out of version control
- Validate all user inputs
- Test RLS policies thoroughly
- Use HTTPS in production
- Enable rate limiting on backend

---

## 📞 Resources

- **Supabase Docs:** https://supabase.com/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **React Docs:** https://react.dev
- **Redux Toolkit:** https://redux-toolkit.js.org
- **Vite Docs:** https://vitejs.dev
- **Framer Motion:** https://www.framer.com/motion

---

## 📋 Quick Reference

| Command | Purpose |
|---------|---------|
| `.\start-servers.bat` | Start both backend and frontend |
| `.\restart-servers.bat` | Restart both servers (stop + start) |
| `pip install -r requirements.txt` | Install backend dependencies |
| `npm install` | Install frontend dependencies |
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build frontend for production |
| `python -m uvicorn main:app --reload` | Start backend dev server |

---

## 🎯 Quick Start

### 1-Minute Setup
```powershell
cd "c:\student dashboard"
.\start-servers.bat
```
Then open http://localhost:3000 in your browser.

### Manual 3-Step Setup
```powershell
# Step 1: Backend
python -m uvicorn main:app --reload

# Step 2: Frontend (in new terminal)
cd frontend
npm run dev

# Step 3: Browser
# Open http://localhost:3000
```

---

## 🌐 Live URLs During Development

| Service | URL |
|---------|-----|
| **Student Dashboard** | http://localhost:3000 |
| **FastAPI Backend** | http://127.0.0.1:8000 |
| **API Documentation** | http://127.0.0.1:8000/docs |

---

## ❓ FAQ

**Q: How do I reset my password?**  
A: Use the "Forgot password?" link on the login page (Supabase handles this).

**Q: Can I deploy this to production?**  
A: Yes! Follow the Deployment section above. Backend can go to Railway/Render, frontend to Vercel/Netlify.

**Q: How do I add more mini-games?**  
A: Create new game component in `frontend/src/components/games/` and import in Games.jsx.

**Q: Can I change the school name?**  
A: Yes, edit `frontend/src/pages/Dashboard.jsx` around line 1.

**Q: How do I track custom metrics?**  
A: Add new Redux slice in `frontend/src/store/` and update the database schema.

---

**Version:** 1.1.0  
**Last Updated:** February 24, 2026  
**Status:** ✅ Production Ready

---

*Built with ❤️ for Class 1 students and their parents*
