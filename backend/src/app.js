import 'dotenv/config';
import express from 'express';
import courseRoutes from './modules/courses/routes.js';
import enrollmentRoutes from './modules/enrollments/routes.js';
import authRoutes from './modules/auth/routes.js';
import paymentRoutes from './modules/payments/routes.js';
import adminAuthRoutes from './modules/admin-auth/routes.js';
import adminWorkspaceRoutes from './modules/admin-workspace/routes.js';
import { adminRouter as adminPlatformRoutes, publicRouter as platformContentRoutes, supportRouter } from './modules/admin-platform/routes.js';
import { handleRazorpayWebhook } from './modules/payments/controller.js';

const app = express();

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'skillpath-backend' });
});
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/admin', adminWorkspaceRoutes);
app.use('/api/admin/platform', adminPlatformRoutes);
app.use('/api/platform', platformContentRoutes);
app.use('/api/support', supportRouter);
app.use('/api/payments', paymentRoutes);

app.use((error, _request, response, _next) => {
  if (error.name === 'MulterError') {
    const isAvatar = error.field === 'avatar';
    const item = isAvatar ? 'Profile photo' : 'Resume';
    const size = isAvatar ? '2 MB' : '5 MB';
    return response.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? `${item} must be smaller than ${size}.` : `${item} upload was rejected.` });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(error);
  return response.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'An unexpected server error occurred.' });
});

export default app;
