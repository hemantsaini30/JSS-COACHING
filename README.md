# Instora

Instora is a digital operating platform for offline coaching institutes. It replaces registers, attendance notebooks, fee receipts, and scattered WhatsApp messages with a single web platform — covering student records, attendance, fee management, AI-powered testing, and performance analytics, all wrapped in a clean, role-based interface for admins, teachers, and students.

**Live demo:** [instora-base.vercel.app](https://instora-base.vercel.app)

## Features

### Public site
- Landing page with institute branding, faculty showcase, and a walk-in inquiry form
- Secure login with role-based redirect — no public self-registration

### Admin
- Full student, teacher, and batch management
- Date-wise attendance tracking with lock-after-save and re-mark support
- Student-centric fee system — monthly billing cycles tied to each student's join date, partial payments, permanent payment receipts, and a per-student fee ledger
- Inquiry management with status tracking (pending / contacted / resolved)
- Institute-wide test analytics — batch performance comparison, top performers, score distributions

### Teacher
- Batch-wise attendance marking with daily summaries and historical charts
- Full test builder: manual question entry or AI-generated MCQs (via Groq) with a select-and-add workflow
- Test scheduling with live date, time window, and countdown duration
- Per-test analytics — score distribution, hardest questions, full student result table

### Student
- Personal dashboard with attendance percentage, fee status, and batch info
- Take live tests in a distraction-free exam UI with a server-synced countdown timer (refresh-proof, auto-submits on expiry)
- Detailed post-test review with correct/incorrect highlighting and AI-generated explanations — unlocked only after the teacher closes the test
- Anonymized leaderboard per test, ranked by score then time, with the student's own result highlighted

## Tech stack

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT authentication, bcrypt, Helmet, rate limiting, Groq SDK for AI question generation

**Frontend:** React (Vite), React Router, Tailwind CSS v4, Axios

**Deployment:** Backend on Railway, frontend on Vercel

## Project structure

```
instora-base/
├── backend/
│   ├── src/
│   │   ├── config/         # Database connection
│   │   ├── middlewares/    # Auth, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API route definitions
│   │   └── app.js
│   ├── seed.js              # Seeds initial admin/teacher/student accounts
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/      # Reusable UI components
    │   ├── layouts/         # Role-specific shell layouts
    │   ├── pages/            # Admin / Teacher / Student / Public pages
    │   ├── services/        # Axios API call modules
    │   ├── context/         # Auth context
    │   └── routes/           # Route definitions and guards
    └── vercel.json
```

## Getting started locally

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_string
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key
```

Seed initial accounts and start the server:

```bash
node seed.js
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Default seeded accounts

| Role    | Username   | Password    |
|---------|------------|-------------|
| Admin   | admin      | admin123    |
| Teacher | teacher1   | teacher123  |
| Student | student1   | student123  |

## Roles and access control

Instora has no public sign-up. All accounts are provisioned by an admin (teachers and students) or seeded directly. Every API route is protected by JWT and scoped by role — students can only ever access their own attendance, fees, and test data; teachers can only manage tests and attendance for their own batches; admin has full visibility.

## Deployment notes

- Backend deploys from the `backend/` directory on Railway; environment variables must be set there independently of local `.env` files
- Frontend deploys from the `frontend/` directory on Vercel; `vercel.json` includes a rewrite rule so client-side routes resolve correctly on direct visits and refreshes
- `CLIENT_URL` on the backend must exactly match the deployed frontend origin (no trailing slash) for CORS to permit requests
