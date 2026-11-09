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
      live-classes/       Live-class routes and request handlers
    data/                 Demo seed data and in-memory store
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
- `GET /api/courses`, `POST /api/courses`
- `PATCH /api/courses/:id`, `DELETE /api/courses/:id`
- `GET /api/live-classes`, `POST /api/live-classes`, `DELETE /api/live-classes/:id`
- `POST /api/enrollments`
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/password-login`
- `GET /api/auth/profile` (authenticated)
- `PATCH /api/auth/profile` (authenticated; saves a profile section)
- `PATCH /api/auth/profile/security/password` (authenticated; creates or changes a password)
- `POST /api/auth/profile/phone/request-otp`, `POST /api/auth/profile/phone/verify-otp` (authenticated; verifies an additional phone number)
- `POST /api/auth/profile/security/two-factor/request-otp`, `POST /api/auth/profile/security/two-factor/verify-otp` (authenticated; verifies and changes 2FA setting)
- `GET /api/auth/profile/resume` (authenticated file download)
- `DELETE /api/auth/profile/resume` (authenticated; removes the resume)
- `GET /api/auth/profile/avatar` (authenticated image response)
- `POST /api/auth/profile/avatar` (authenticated multipart upload, field `avatar`; JPEG/PNG/WebP, 2 MB max)
- `DELETE /api/auth/profile/avatar` (authenticated; removes the profile photo)
- `POST /api/auth/profile/resume` (authenticated multipart upload, field `resume`)

## Demo limitations

The admin app at http://127.0.0.1:5174 requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` to be set in the backend environment. Set a unique, strong password and never commit real credentials. Admin sessions expire after eight hours; course and live-class write routes require a valid admin session. The API currently stores catalog, class, and enrollment changes in memory; users, profiles, resumes, OTP challenges, and sessions are stored in MongoDB. Checkout is a demo and does not process payments. Before production, add authorization checks for other protected routes, stronger login rate limiting, and real classroom/lesson integrations.
