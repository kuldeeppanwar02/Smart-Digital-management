<div align="center">

# 🏫 SchoolStack ERP

### Full-Stack School Management System — Built for the Real World

[![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel&logoColor=white)](https://smart-digital-management.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[**Live Demo →**](https://smart-digital-management.vercel.app)

</div>

---

## 🎯 Overview

**SchoolStack ERP** is a production-deployed, full-stack school management platform covering the complete operational lifecycle of a school — from student onboarding through fee collection and exam analytics.

Built with a clean **MVC architecture** on the backend and a **React/Vite** SPA on the frontend, deployed across separate Vercel environments.

---

## ⚡ Feature Modules

| Module | API Route | Description |
|--------|-----------|-------------|
| 🔐 **Authentication** | `/api/auth` | JWT-based login for Admin, Teacher, Parent roles |
| 🏫 **Schools** | `/api/schools` | Multi-school management |
| 📋 **Attendance** | `/api/attendance` | Daily attendance tracking per class |
| 📝 **Exams** | `/api/exams` | Exam scheduling and management |
| 📊 **Marks** | `/api/marks` | Grade entry and report generation |
| 💰 **Fees** | `/api/fees` | Fee structure, payment tracking |
| 👨‍👩‍👧 **Parent Portal** | `/api/parent` | Parent-facing dashboards |
| 🕐 **Timetable** | `/api/timetable` | Class schedule management |
| 💬 **Queries** | `/api/queries` | Parent-school communication |
| 📈 **Analytics** | `/api/analytics` | Attendance/marks trend analysis |
| 👤 **Admin** | `/api/admin` | System administration |

---

## 🏗️ Architecture

```
smart-digital-management/
├── backend/                    # Node.js + Express REST API
│   ├── controllers/            # Business logic per module
│   ├── middleware/             # JWT auth, error handling, validation
│   ├── models/                 # Mongoose schemas (Student, Staff, Fee…)
│   ├── routes/                 # API route definitions
│   └── server.js               # Entry point, CORS, DB connection
│
└── frontend/                   # React + Vite SPA
    ├── src/
    │   ├── components/         # Reusable UI components
    │   ├── pages/              # Role-based dashboard views
    │   ├── hooks/              # Custom React hooks
    │   └── services/           # Axios API layer
    └── vite.config.js
```

### Backend Design Pattern — MVC

```
HTTP Request
     │
     ▼
  Router          ← Route definitions
     │
     ▼
  Middleware       ← JWT verify, input validation
     │
     ▼
  Controller       ← Business logic, response shaping
     │
     ▼
  Model (Mongoose) ← Data access, schema enforcement
     │
     ▼
  MongoDB Atlas    ← Cloud database
```

---

## 🔐 Role-Based Access Control

Three distinct user roles with scoped API access:

| Role | Access |
|------|--------|
| **Admin** | Full CRUD on all modules, system configuration |
| **Teacher** | Attendance marking, marks entry, timetable view |
| **Parent** | Child's attendance, marks, fees, query submission |

JWT tokens encode the role → middleware enforces access per route.

---

## 🚀 Local Setup

### Backend

```bash
cd backend
npm install

# Create .env
echo "MONGO_URI=your-mongodb-atlas-uri
JWT_SECRET=your-jwt-secret
PORT=5000" > .env

npm run dev
```

### Frontend

```bash
cd frontend
npm install

# Create .env
echo "VITE_API_URL=http://localhost:5000" > .env

npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🌐 CORS Configuration

The backend is configured to accept requests only from trusted origins:

```javascript
// Whitelist: Vercel production + local dev
origin: [
  'https://smart-digital-management.vercel.app',
  'http://localhost:5173'
]
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18 |
| Framework | Express.js 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) |
| Frontend | React + Vite |
| Deployment | Vercel (frontend) |
| HTTP Client | Axios |

---

<div align="center">

[Live Demo](https://smart-digital-management.vercel.app) · [Report Bug](https://github.com/kuldeeppanwar02/Smart-Digital-management/issues)

</div>
[README_smart_digital.md](https://github.com/user-attachments/files/31609142/README_smart_digital.md)
