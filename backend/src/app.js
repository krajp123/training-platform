import express from 'express';
import courseRoutes from './modules/courses/routes.js';
import enrollmentRoutes from './modules/enrollments/routes.js';
import liveClassRoutes from './modules/live-classes/routes.js';

const app = express();

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'skillpath-backend' });
});
app.use('/api/courses', courseRoutes);
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/enrollments', enrollmentRoutes);

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(error);
  return response.status(500).json({ error: 'An unexpected server error occurred.' });
});

export default app;
