# InterviAI — AI Resume-to-Interview Agent

> **Practice. Improve. Get Hired.**

A complete frontend-only AI Resume-to-Interview platform built as a college project demo. Designed to look and feel like a real production SaaS/HR-tech application.

---

## 🚀 Live Demo

Open `index.html` in any modern browser — no server required.

**Demo Login:**
- Email: `student@interviai.ai`
- Password: `123456`

---

## ✨ Features

- 📄 **Resume Upload & AI Analysis** — Simulated AI role detection with confidence scores
- 🎯 **Interview Configuration** — Type, difficulty, duration, language settings
- 🖥️ **Device Check** — Camera, microphone, and browser readiness
- 🎤 **Live Mock Interview** — AI interviewer with voice interaction simulation
- 📊 **Performance Reports** — Detailed scoring with charts and improvement plans
- 🏋️ **Practice Mode** — Quick practice without full interview setup
- 📁 **Interview History** — Track all past sessions
- 👤 **Profile Management** — User profile with stats
- 🌙 **Agent-style Dark UI** — Clean, professional interface
- 📱 **Fully Mobile Responsive** — Works on all screen sizes

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| HTML5 | Structure |
| CSS3 | Styling (custom design system) |
| Bootstrap 5 | Layout utilities |
| Bootstrap Icons | Icon library |
| Vanilla JavaScript ES6+ | Logic & interactivity |
| Chart.js | Performance charts |
| localStorage | Data persistence |

---

## 📁 Project Structure

```
hirementor/
├── index.html              # Entry point (redirects to login)
├── assets/
│   └── images/
│       └── logo.png        # App logo
├── auth/
│   ├── login.html          # Login page
│   ├── signup.html         # Sign up page
│   └── forgot-password.html
├── pages/
│   ├── dashboard.html      # Main dashboard
│   ├── upload.html         # Resume upload
│   ├── analysis.html       # AI analysis results
│   ├── configure.html      # Interview configuration
│   ├── device-check.html   # Device readiness check
│   ├── interview.html      # Live interview session
│   ├── report.html         # Performance report
│   ├── history.html        # Interview history
│   ├── practice.html       # Practice mode
│   └── profile.html        # User profile
├── css/
│   └── style.css           # Complete design system
└── js/
    ├── app.js              # App bootstrap & navigation
    ├── auth.js             # Authentication logic
    ├── storage.js          # localStorage abstraction
    ├── utils.js            # Shared utilities
    ├── dashboard.js        # Dashboard logic & charts
    ├── resume.js           # Resume upload & analysis
    ├── analysis.js         # Analysis page logic
    ├── configure.js        # Interview configuration
    ├── device-check.js     # Device testing
    ├── interview.js        # Interview session engine
    ├── report.js           # Report generation
    ├── history.js          # History management
    ├── practice.js         # Practice mode logic
    └── profile.js          # Profile management
```

---

## 🏃 How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/mohansaini79/interviai.git
   cd interviai
   ```

2. Open `index.html` in Chrome/Edge — it auto-redirects to login.

3. Login with demo credentials:
   - **Email:** `student@interviai.ai`
   - **Password:** `123456`

---

## 🎨 Design System

- **Primary Color:** Deep Slate (`#0d1117`)
- **Accent:** Electric Indigo (`#6366f1`)
- **Font:** Inter (Google Fonts)
- **Style:** Agent-inspired dark UI (Cursor/Linear aesthetic)

---

## 👨‍💻 Developer

**Mohan Saini**

Developed by **[The Rising Tribe](https://in.linkedin.com/company/the-rising-tribe-company-tech)** — Tech Company

---

## 📄 License

This project is for educational/demo purposes only.
