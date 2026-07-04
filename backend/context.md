```markdown
# Instora — Project Handoff Summary

---

## 1. Project Overview

**Instora** is a full-stack digital operations platform for offline coaching institutes (JEE/NEET/Board prep centers). It replaces physical registers, attendance notebooks, fee receipts, and WhatsApp communication with a single role-based web application.

- **Target users:** Institute admin (owner), teachers (faculty), students (enrolled)
- **Goal:** Allow a coaching center to manage students, attendance, fees, tests, and analytics from one platform
- **Interview context:** Built by a final-year B.Tech student (Mathematics & Computing, DTU) as a flagship SDE-1 portfolio project — emphasis on clean architecture, real-world features, and technical depth
- **Live URLs:**
  - Frontend: https://instora-base.vercel.app
  - Backend: https://instorabase-production.up.railway.app

---

## 2. Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB via Mongoose
- **Auth:** JWT (`jsonwebtoken`) + `bcryptjs`
- **Security:** `helmet`, custom NoSQL injection middleware, `express-rate-limit` (10 login attempts / 15 min)
- **AI:** Groq SDK (`groq-sdk`) — `llama-3.3-70b-versatile` model for MCQ generation
- **Payments:** Razorpay (test mode) — HMAC SHA256 signature verification
- **Scheduling:** `node-cron` — daily fee auto-generation at 00:05
- **Other:** `cors`, `dotenv`

### Frontend
- **Framework:** React 18 (Vite)
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` plugin — no config file needed)
- **HTTP:** Axios (centralized instance with JWT interceptor + auto-logout on 401)
- **Payments:** Razorpay Checkout.js (loaded dynamically via custom `useRazorpay` hook)

### Deployment
- **Backend:** Railway (root directory: `backend/`, env vars set in Railway dashboard)
- **Frontend:** Vercel (root directory: `frontend/`, `vercel.json` with SPA rewrite rule)

---

## 3. Current Folder & File Structure

```
instora-base/
├── README.md
├── backend/
│   ├── .env                          # PORT, MONGO_URI, JWT_SECRET, CLIENT_URL, GROQ_API_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
│   ├── package.json
│   ├── server.js                     # Entry point — connects DB, starts server, starts cron jobs
│   ├── seed.js                       # Seeds admin/teacher/student accounts
│   └── src/
│       ├── app.js                    # Express setup, middleware, all route registration
│       ├── config/
│       │   └── db.js
│       ├── jobs/
│       │   ├── index.js              # startJobs() — registers all cron jobs
│       │   └── feeAutoGenerate.js    # Daily job: auto-creates next billing cycle per student
│       ├── middlewares/
│       │   ├── authMiddleware.js     # protect (JWT verify), authorize(...roles)
│       │   └── errorHandler.js      # Global error handler
│       ├── models/
│       │   ├── User.js               # username, password, role, fullName, subject, phone
│       │   ├── Student.js            # userId, fullName, parentPhone, batchId, monthlyFee, feeStatus, joiningDate
│       │   ├── Batch.js              # name, course, description, isActive
│       │   ├── Attendance.js         # studentId, batchId, date(String), status, markedBy | unique: [studentId, date]
│       │   ├── Fee.js                # studentId, batchId, amount, paidAmount, startDate, endDate, status
│       │   ├── Payment.js            # studentId, feeId, amount, receiptNumber, paymentMethod, note, recordedBy
│       │   ├── RazorpayOrder.js      # orderId, feeId, studentId, amountInPaise, amountInRupees, status, razorpayPaymentId, razorpaySignature
│       │   ├── Inquiry.js            # name, phone, targetCourse, status
│       │   ├── Test.js               # title, subject, instructions, createdBy, assignedBatches, assignedStudents, liveDate, startTime, endTime, duration, status, totalMarks
│       │   ├── Question.js           # testId, questionText, options{A,B,C,D}, correctOption, explanation, difficulty, marks, order
│       │   ├── TestSubmission.js     # testId, studentId, startedAt, submittedAt, status, score, totalMarks, percentage, timeTaken | unique: [studentId, testId]
│       │   └── TestAnswer.js         # submissionId, testId, studentId, questionId, selectedOption, isCorrect
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── adminController.js    # getDashboardStats, getDashboard
│       │   ├── publicController.js   # submitInquiry
│       │   ├── inquiryController.js  # getAllInquiries, updateInquiryStatus, deleteInquiry
│       │   ├── studentController.js  # createStudent (auto-creates first Fee + Payment if paid), getAllStudents, getStudentById, deleteStudent, getMyProfile
│       │   ├── teacherController.js  # createTeacher, getAllTeachers, deleteTeacher, resetTeacherPassword
│       │   ├── batchController.js
│       │   ├── attendanceController.js # markAttendance, getAttendanceByBatchAndDate, getAttendanceByStudent (ownership check for students), getBatchAttendanceSummary, getDatewiseAttendance
│       │   ├── feeController.js      # getStudentFeeProfile, addNextMonthFee, updateFeePayment (creates Payment record), getFeeSummary, getMyFees, deleteFeeRecord
│       │   ├── paymentController.js  # recordPayment, getAllPayments, getMyPayments, getPaymentsByFee, getStudentLedger
│       │   ├── razorpayController.js # createOrder, verifyPayment (HMAC verify + idempotency), getOnlinePayments
│       │   ├── testController.js     # Full test lifecycle — createTest, getMyTests, getTestById, updateTest, addQuestion, addBulkQuestions, deleteQuestion, publishTest, closeTest, deleteTest, getAvailableTests, startTest (server-side timer), submitTest (auto-submit logic), getTestResult (only when closed), getTestAnalytics, getAllTestsAdmin, getAnalyticsOverview, getTestLeaderboard (anonymized)
│       │   └── aiController.js       # generateQuestions via Groq — returns validated MCQ array
│       └── routes/
│           ├── authRoutes.js         # POST /login
│           ├── adminRoutes.js        # GET /stats, GET|PATCH|DELETE /inquiries, POST /run-fee-job
│           ├── publicRoutes.js       # POST /inquiry
│           ├── batchRoutes.js        # GET (admin+teacher), POST|DELETE (admin only)
│           ├── studentRoutes.js      # GET /me (any auth), GET|GET/:id (admin+teacher), POST|DELETE (admin)
│           ├── teacherRoutes.js      # All admin only
│           ├── attendanceRoutes.js
│           ├── feeRoutes.js          # GET /my, GET /summary, GET|POST /student/:id, POST /student/:id/next-month, PATCH /:id/payment, DELETE /:id
│           ├── paymentRoutes.js      # GET /my, GET|POST /, GET /fee/:feeId, GET /ledger/:studentId
│           ├── razorpayRoutes.js     # POST /create-order (student), POST /verify-payment (student), GET /online-payments (admin)
│           └── testRoutes.js         # Full routing for all test controller functions
└── frontend/
    ├── .env                          # VITE_API_URL, VITE_RAZORPAY_KEY_ID
    ├── vercel.json                   # SPA rewrite: all routes → index.html
    ├── index.html                    # <title>Instora</title>
    ├── vite.config.js                # @tailwindcss/vite plugin
    └── src/
        ├── index.css                 # @import "tailwindcss"
        ├── main.jsx
        ├── App.jsx                   # Wraps AppRoutes in AuthProvider
        ├── assets/
        ├── context/
        │   └── AuthContext.jsx       # user, token, isAuthenticated, loading, login(), logout()
        ├── hooks/
        │   └── useRazorpay.js        # Dynamically loads checkout.js, opens Razorpay modal
        ├── components/
        │   ├── Button.jsx
        │   ├── InputField.jsx
        │   ├── Sidebar.jsx
        │   └── AttendanceChart.jsx   # Custom SVG bar chart (no external chart library)
        ├── layouts/
        │   ├── PublicLayout.jsx      # Header with Login button, footer
        │   ├── AdminLayout.jsx       # Collapsible sidebar (hamburger on mobile), active link highlighting via useLocation
        │   └── TeacherLayout.jsx     # Same pattern, purple theme
        ├── routes/
        │   ├── AppRoutes.jsx         # All routes with guard() helper
        │   └── ProtectedRoute.jsx    # Redirects unauthenticated or wrong-role users
        ├── services/
        │   ├── authApi.js            # Axios instance, JWT interceptor, auto-logout on 401
        │   ├── publicApi.js
        │   ├── studentApi.js
        │   ├── teacherApi.js
        │   ├── batchApi.js
        │   ├── attendanceApi.js
        │   ├── feeApi.js
        │   ├── paymentApi.js
        │   ├── adminApi.js
        │   ├── testApi.js
        │   └── razorpayApi.js
        └── pages/
            ├── Public/
            │   ├── LandingPage.jsx
            │   └── LoginPage.jsx
            ├── Admin/
            │   ├── AdminDashboard.jsx       # Live stats from /api/admin/stats
            │   ├── StudentsPage.jsx         # Add student with monthlyFee + paid/unpaid toggle
            │   ├── TeachersPage.jsx         # Create, delete, reset password
            │   ├── BatchesPage.jsx
            │   ├── AttendancePage.jsx       # Mark, Summary, Date-wise chart tabs
            │   ├── FeesPage.jsx             # Students tab, All transactions tab, Online payments tab
            │   ├── InquiriesPage.jsx
            │   └── TestsOverviewPage.jsx    # Analytics overview + all tests table
            ├── Teacher/
            │   ├── TeacherDashboard.jsx     # Attendance marking (uses TeacherLayout)
            │   ├── TestsPage.jsx            # List tests, create, publish, close
            │   ├── TestBuilderPage.jsx      # Manual entry + AI generate tabs, question list
            │   └── TestAnalyticsPage.jsx    # Score dist, hardest questions, student results
            └── Student/
                ├── StudentDashboard.jsx     # Overview tab + Fees tab with Pay online button
                ├── StudentTestsPage.jsx     # Filter by live/upcoming/submitted/results
                ├── ExamPage.jsx             # Server-synced timer, question navigator, auto-submit
                ├── TestResultPage.jsx       # Score summary, green/red review, AI explanations
                └── TestLeaderboardPage.jsx  # Anonymized ranking (first name + last initial)
```

---

## 4. Data Models & Schema

### User
```js
{ username: String (unique), password: String (bcrypt), role: enum['admin','teacher','student'], fullName: String, subject: String, phone: String }
```

### Student
```js
{ userId: ObjectId→User, fullName: String, parentPhone: String, batchId: ObjectId→Batch, monthlyFee: Number, feeStatus: enum['paid','pending','partial'], joiningDate: Date }
```

### Batch
```js
{ name: String (unique), course: String, description: String, isActive: Boolean }
```

### Attendance
```js
{ studentId: ObjectId→Student, batchId: ObjectId→Batch, date: String (YYYY-MM-DD), status: enum['present','absent'], markedBy: ObjectId→User }
// Unique index: [studentId, date]
```

### Fee
```js
{ studentId: ObjectId→Student, batchId: ObjectId→Batch, amount: Number, paidAmount: Number, startDate: Date, endDate: Date, status: enum['paid','pending','partial'], note: String }
// Billing cycles are rolling — startDate matches previous fee's endDate
```

### Payment (permanent — never deleted)
```js
{ studentId: ObjectId→Student, feeId: ObjectId→Fee, amount: Number, receiptNumber: String (unique, format: RCP-YYYYMMDD-XXXX), paymentMethod: enum['cash','online','cheque'], note: String, recordedBy: ObjectId→User, paymentDate: Date }
```

### RazorpayOrder
```js
{ orderId: String (unique), feeId: ObjectId→Fee, studentId: ObjectId→Student, amountInPaise: Number, amountInRupees: Number, status: enum['created','paid','failed'], razorpayPaymentId: String, razorpaySignature: String }
```

### Inquiry
```js
{ name: String, phone: String, targetCourse: String, status: enum['pending','contacted','resolved'] }
```

### Test
```js
{ title: String, subject: String, instructions: String, createdBy: ObjectId→User, assignedBatches: [ObjectId→Batch], assignedStudents: [ObjectId→Student], liveDate: String, startTime: String, endTime: String, duration: Number (minutes), status: enum['draft','published','closed'], totalMarks: Number }
```

### Question
```js
{ testId: ObjectId→Test, questionText: String, options: {A,B,C,D: String}, correctOption: enum['A','B','C','D'], explanation: String, difficulty: enum['easy','medium','hard'], marks: Number, order: Number }
```

### TestSubmission
```js
{ testId: ObjectId→Test, studentId: ObjectId→Student, startedAt: Date (server timestamp), submittedAt: Date, status: enum['in_progress','submitted','auto_submitted'], score: Number, totalMarks: Number, percentage: Number, timeTaken: Number (seconds) }
// Unique index: [studentId, testId] — prevents retakes
```

### TestAnswer
```js
{ submissionId: ObjectId→TestSubmission, testId: ObjectId→Test, studentId: ObjectId→Student, questionId: ObjectId→Question, selectedOption: enum['A','B','C','D',null], isCorrect: Boolean }
```

---

## 5. Implemented Features

### Public
- Landing page with hero, stats, faculty showcase, inquiry form
- Walk-in inquiry saved to DB, admin notified via inquiries page

### Authentication
- JWT login with role-based redirect (admin/teacher/student)
- Rate limiting: 10 login attempts per 15 min per IP
- Auto-logout on 401 via Axios response interceptor
- No public sign-up — all accounts created by admin

### Admin Panel
- **Dashboard:** Live stats (students, today's attendance %, fees collected, pending inquiries, recent inquiries)
- **Students:** Add with monthly fee + initial paid/unpaid toggle (auto-creates first Fee + Payment record if paid); search; delete (cascades to User + Fees)
- **Teachers:** Create account, reset password, delete
- **Batches:** Create, delete
- **Attendance:** Mark per batch per date, lock after save, re-mark with confirmation, Summary report, Date-wise bar chart
- **Fee Management:**
  - Student cards grouped by batch
  - Click student → Fee Profile modal with month-wise records
  - "Add next month" button creates next rolling cycle
  - Record manual payments (cash/online/cheque) with auto-receipt
  - All transactions tab (permanent, no delete)
  - Online payments tab (Razorpay-verified payments with order IDs)
- **Inquiries:** Status management (pending/contacted/resolved), delete
- **Test Analytics:** Institute-wide overview, batch performance comparison, top performers, all tests table

### Teacher Dashboard
- Attendance marking (same as admin attendance page, uses TeacherLayout)
- **Tests:** Create, build (manual + AI), publish, view analytics, close
- **Test Builder:**
  - Manual: question text, 4 options, click-to-select correct answer, explanation, difficulty, marks
  - AI: topic + grade + difficulty + optional context → Groq generates 10 MCQs → checkbox-select → Add selected → "Generate More" appends without losing prior generated questions
- **Test Analytics:** Score distribution, hardest questions by correct rate, full student ranking table

### Student Dashboard
- **Overview tab:** Attendance % with bar chart, outstanding fee amount with "Pay now" shortcut, batch info, attendance history grid (P/A boxes)
- **Fees tab:**
  - Month-wise fee cards with colored left border (red=pending, amber=partial, green=paid)
  - "Pay ₹X online" button on pending fees → opens Razorpay checkout
  - Payment verified server-side via HMAC SHA256
  - Idempotency guard (double-webhook won't double-credit)
  - View receipts per month, all receipts list
- **Tests:** Filter by live/upcoming/submitted/results
- **Exam environment:** Server-synced countdown (refresh-proof), question navigator grid, auto-submit on timer expiry
- **Test result:** Score summary, question-by-question review with green/red highlighting, AI explanations (unlocked only after teacher closes test)
- **Leaderboard:** Anonymized (first name + last initial), rank badges for top 3, own row highlighted in purple, class average shown

### Automated Systems
- **Fee auto-generation:** `node-cron` runs daily at 00:05, finds students whose billing cycle ended, creates next month's Fee record as `pending`, updates student `feeStatus` — no human action required
- Manual trigger endpoint: `POST /api/admin/run-fee-job` (admin only, for testing)

### Security
- `helmet` for HTTP security headers
- Custom NoSQL injection guard (blocks `$` operators in request body)
- Rate limiting on `/api/auth/login`
- Student attendance ownership check (can't view other students' data)
- Payments are permanent (no delete route on Payment model)
- Razorpay signature verified with HMAC before recording any payment
- JWT secret: 64-char random hex string

---

## 6. In-Progress & Next Steps

### Just completed
- Razorpay online payment integration (test mode)
  - Student pays from dashboard Fees tab
  - Backend verifies via HMAC SHA256
  - Payment record created with `paymentMethod: 'online'`
  - Admin sees online payments in dedicated tab with Razorpay order IDs
  - Initial "Paid" student admission also creates a Payment record

### Immediate next features (in suggested order)
1. **Socket.io — Live test monitoring + Student-teacher chat**
   - Teacher sees real-time feed during active test (who started, current question, tab-switch count)
   - Student-teacher messaging per batch (scoped rooms)
2. **WhatsApp/SMS alerts via Twilio**
   - Fee due reminder 3 days before cycle end
   - Low attendance alert below 75%
   - Test result notification on teacher close
3. **PDF receipts** — generate downloadable PDF on payment with QR verification code
4. **Weak-topic detection** — MongoDB aggregation across TestAnswers to surface per-student weak subjects on dashboard

---

## 7. Key Constraints & Rules

### Architecture rules
- **New features = new files only.** Never modify existing model schemas unless absolutely required. Add new lines to `app.js` to register routes — don't change existing lines.
- Every new feature follows the same shape: Model → Controller → Routes → Service file → Page(s)
- Backend first, test with Thunder Client, then build frontend

### Code standards
- All API responses: `{ success: Boolean, message: String, data: Any }`
- Passwords: always bcrypt hashed, never stored plain
- Receipt numbers: format `RCP-YYYYMMDD-XXXX`, guaranteed unique via while-loop check
- Fee status (`paid/pending/partial`) is always recalculated from actual Payment records — never trusted from frontend
- Timer for tests: `startedAt` stored server-side; frontend calculates `Date.now() - startedAt` on load to reconstruct remaining time — browser clock manipulation is impossible

### Frontend rules
- Tailwind v4: no `tailwind.config.js`, use `@import "tailwindcss"` in `index.css`, plugin via `vite.config.js`
- No `<form>` tags in React — use `onSubmit` on the form element with `e.preventDefault()`
- All tables wrapped in `overflow-x-auto` for mobile
- Responsive grids: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` pattern
- All admin pages use `p-4 md:p-8` for mobile padding

### Deployment rules
- `CLIENT_URL` on Railway must exactly match Vercel URL with **no trailing slash** (CORS will break otherwise)
- `vercel.json` must include SPA rewrite rule or direct URL visits will 404
- Never push `.env` files — all secrets set manually in Railway/Vercel dashboards
- After changing `JWT_SECRET` in production, all users are logged out (intentional)
- `VITE_` prefix required for all frontend environment variables

### Business logic rules
- No public self-registration — admin creates all accounts
- Payments are permanent — no delete route exists on the Payment model
- Tests can only be retaken 0 times — unique index on `[studentId, testId]` in TestSubmission enforces this at DB level
- Test results are locked until teacher explicitly closes the test (`status: 'closed'`)
- Questions are sent to students without `correctOption` or `explanation` fields during exam — these are added only in the result endpoint after the test is closed
- Fee billing cycles are rolling per-student, not calendar-month-based

### Seeded accounts (test mode)
| Role | Username | Password |
|---|---|---|
| Admin | admin | admin123 |
| Teacher | teacher1 | teacher123 |
| Student | student1 | student123 |

### Razorpay test card
- Number: `4111 1111 1111 1111`
- Expiry: any future date
- CVV: any 3 digits
- OTP: `1234`
```