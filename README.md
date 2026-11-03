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
    features/dashboard/   Admin dashboard feature
    services/            Backend API client
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

The public marketing homepage is at `/` and the learner dashboard is at `/dashboard`. Login and Join forms are visual demos until an authentication service is added.

Both React frontends use Tailwind CSS 4 through the Vite plugin. Keep static images and videos under `frontend/public/images` and `frontend/public/videos`, and reference them from the site with root-relative URLs such as `/images/logo.png`.

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
