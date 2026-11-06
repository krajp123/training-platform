import app from './app.js';
import { connectDatabase } from './modules/auth/service.js';

const port = Number(process.env.PORT) || 3001;

async function startServer() {
  try {
    await connectDatabase();
    console.log('MongoDB connected successfully.');
    app.listen(port, '127.0.0.1', () => {
      console.log(`Skillpath API listening on http://127.0.0.1:${port}`);
    });
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exitCode = 1;
  }
}

startServer();
