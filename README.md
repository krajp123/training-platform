# Skillpath — Training Platform

The project is a three-application npm workspace. Frontend and backend source is grouped by feature, while app entry points, shared services, and static assets have dedicated locations:

```text
package.json
package-lock.json
README.md
frontend/
  index.html
  vite.config.js
  public/
    images/              Landing page and brand images
    videos/              Course previews and other video assets
  src/
    app/                 Router and app composition
    features/
      courses/components/
      landing/
        components/      Navbar and footer
        pages/           Marketing homepage
      learner/
        components/      Learner dashboard navigation
        pages/           Learner dashboard
    services/            Backend API client
    main.jsx
backend/
  package.json
  src/
    app.js                Express app and middleware wiring
    server.js             HTTP server entry point
    modules/
      courses/            Course routes and request handlers
      enrollments/        Enrollment routes and request handlers
      admin-workspace/    Admin analytics, learner, enrollment, and audit APIs
    data/                 Demo seed data and MongoDB-backed catalog store
    utils/                Shared validation
admin/
  index.html
  vite.config.js
  src/
    app/                  Admin app entry
    auth/                 Admin login, session state, and token helpers
    pages/                Admin dashboard and other pages
    components/           Shared admin UI components
    services/             Admin API client
    index.css
    main.jsx
```

## Run the whole platform

From the project root:

```bash
npm install
npm run dev
```

The workspace starts all three services:

| Part | Local URL |
| --- | --- |
| Learner frontend | http://127.0.0.1:5173 |
| Admin dashboard | http://127.0.0.1:5174 |
| Backend API | http://127.0.0.1:3001/api/health |

Both Vite apps proxy `/api` requests to the backend. Start individual parts from the project root with `npm run dev:frontend`, `npm run dev:admin`, or `npm run dev:backend`. You can also run `npm run dev` from inside `frontend/` or `admin/` to start only that app, and from inside `backend/` to start only the API. To use the learner frontend with API features, keep the backend running in a separate terminal.

The public marketing homepage is at `/` and the learner dashboard is at `/dashboard`. Login and signup use OTP verification; signed-in users can create a password and optionally enable password-plus-phone-OTP two-factor sign-in from `/account-settings`.

```bash
# If Node cannot resolve Atlas SRV records on your network, use the direct
# seed-list URI copied/generated for your cluster instead of mongodb+srv://.
MONGODB_URI=mongodb+srv://...
MONGODB_DB=skillpath
OTP_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-long-unique-password
ADMIN_ROLE=owner
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=...
SMTP_PASSWORD=... # Gmail App Password
SMTP_FROM="SCS Academy <your-gmail-address@gmail.com>"
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
```

Email identifiers are delivered through SMTP and phone identifiers must use E.164 format (for example `+919876543210`) and are delivered through Twilio.

Both React frontends use Tailwind CSS 4 through the Vite plugin. Keep static images and videos under `frontend/public/images` and `frontend/public/videos`, and reference them from the site with root-relative URLs such as `/images/logo.png`.

## Build

```bash
npm run build
```

This builds both React applications. The backend is a Node.js service and does not have a separate compile step.

## API routes

- `GET /api/health`
- `POST /api/admin-auth/login`, `GET /api/admin-auth/me`, `POST /api/admin-auth/logout`
- `GET /api/admin/overview`, `GET /api/admin/audit-log` (admin)
- `GET /api/admin/learners`, `PATCH /api/admin/learners/:id/status` (admin)
- `GET /api/admin/enrollments`, `PATCH /api/admin/enrollments/:id/progress` (admin)
- `GET /api/courses`, `GET /api/courses/admin` (admin), `POST /api/courses`
- `PATCH /api/courses/:id`, `DELETE /api/courses/:id`
- `POST /api/enrollments` (authenticated learner)
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/password-login`
- `GET /api/auth/profile` (authenticated)
- `PATCH /api/auth/profile` (authenticated; saves a profile section)
- `PATCH /api/auth/profile/notifications` (authenticated; manages optional email-campaign consent)
- `PATCH /api/auth/profile/security/password` (authenticated; creates or changes a password)
- `POST /api/auth/profile/phone/request-otp`, `POST /api/auth/profile/phone/verify-otp` (authenticated; verifies an additional phone number)
- `POST /api/auth/profile/security/two-factor/request-otp`, `POST /api/auth/profile/security/two-factor/verify-otp` (authenticated; verifies and changes 2FA setting)
- `GET /api/auth/profile/resume` (authenticated file download)
- `DELETE /api/auth/profile/resume` (authenticated; removes the resume)
- `GET /api/auth/profile/avatar` (authenticated image response)
- `POST /api/auth/profile/avatar` (authenticated multipart upload, field `avatar`; JPEG/PNG/WebP, 2 MB max)
- `DELETE /api/auth/profile/avatar` (authenticated; removes the profile photo)
- `POST /api/auth/profile/resume` (authenticated multipart upload, field `resume`)
- `GET /api/platform/content`, `GET /api/platform/courses/:courseId/content`, `GET /api/platform/courses/:courseId/reviews`
- `POST /api/platform/coupons/validate`
- `POST /api/support/tickets`, `POST /api/support/reviews` (authenticated learner)
- `POST /api/payments/create-order`, `POST /api/payments/verify-signature` (authenticated learner)
- `GET /api/payments/my-orders`, `GET /api/payments/my-orders/:id/receipt`
- `GET /api/admin/platform/analytics`, `GET /api/admin/platform/reports/export` (owner/finance)
- `/api/admin/platform/*` also provides role-gated learner/enrollment, course-content, coupon/promotion, CMS, support, review, and settings management.
- `GET/POST/PATCH /api/admin-auth/users` (owner; create and manage named admin accounts)

## Admin and payment configuration

The admin app at http://127.0.0.1:5174 requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the backend environment. Set a unique, strong password and never commit real credentials. `ADMIN_ROLE` defaults to `owner`. Additional configured admins can be supplied through `ADMIN_USERS_JSON`; database-managed admin accounts are created and maintained by an owner. Available roles are `owner`, `course_manager`, `support`, and `finance`. Admin sessions expire after eight hours. Email campaigns are limited to active users who explicitly enabled email updates in Account Settings; service messages and purchase receipts are unaffected.

Courses, learners, enrollments, orders, coupons, CMS content, tickets, reviews, and audit history are stored in MongoDB. Courses are seeded from demo data only when their collection is empty. Draft or archived courses are omitted from public catalog and lesson APIs. Learners can access preview lessons before enrollment; full course lessons require enrollment.

Checkout uses Razorpay. Configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` with test credentials before testing payments, and use live credentials only after completing Razorpay production setup. Amounts and coupon eligibility are recalculated by the backend, and learner enrollment is granted only after signature verification. Refunds are available to owner and finance roles. Learner order history and printable receipts are available from the profile menu. Campaign email requires the SMTP settings above.
