# Skillpath — Training Platform

The project is a three-application npm workspace. Each app groups its code by responsibility:

```text
frontend/
  index.html
  vite.config.js
  src/
    app/                 App entry and page selection
    pages/               Public homepage and learner dashboard
    components/
      courses/           Reusable course UI
      layout/            Shared site navigation
    services/            Backend API client
    styles/              Page-specific stylesheets
shared/styles/           Typography tokens shared by frontend and admin
    main.jsx
backend/
  src/
    app.js               Express app and middleware
    server.js            HTTP server entry point
    routes/              REST endpoint definitions
    controllers/         Request handlers
    data/                Demo seed data and in-memory store
    utils/               Shared validation
admin/
  index.html
  vite.config.js
  src/
    app/                 Admin app entry
    pages/               Admin dashboard
    services/            Backend API client
    styles/              Admin stylesheet
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

The public marketing homepage is at `/` and the learner dashboard is at `/dashboard`. Login and Join forms are visual demos until an authentication service is added.

The learner frontend uses Tailwind CSS 4 through the Vite plugin. Shared utility styling (including the public navbar) uses Tailwind classes; existing dashboard and landing-page visual treatments remain in their stylesheets while those views are migrated.

## Build

```bash
npm run build
```

This builds both React applications. The backend is a Node.js service and does not have a separate compile step.

## API routes

- `GET /api/health`
- `GET /api/courses`, `POST /api/courses`
- `PATCH /api/courses/:id`, `DELETE /api/courses/:id`
- `GET /api/live-classes`, `POST /api/live-classes`, `DELETE /api/live-classes/:id`
- `POST /api/enrollments`

## Demo limitations

The API currently stores catalog, class, and enrollment changes in memory; they reset when the backend restarts. Checkout is a demo and does not process payments. Before production, add persistent storage, user authentication/authorization (especially for admin routes), a payment provider, and real classroom/lesson integrations.
