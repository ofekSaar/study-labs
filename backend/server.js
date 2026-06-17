import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';

import connectDB from './config/db.js';
import { recoverStuckGenerations } from './services/aiService.js';
import configurePassport from './config/passport.js';
import swaggerSpec from './config/swagger.js';
import errorHandler from './middleware/errorHandler.js';
import { createServer } from 'http';
import { initSocket } from './config/socket.js';

// Routes
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import progressRoutes from './routes/progress.js';
import quizRoutes from './routes/quizzes.js';
import aiRoutes from './routes/ai.js';

// ── Setup ────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Passport
app.use(passport.initialize());
configurePassport();

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Swagger Docs ─────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'StudyLabs API Docs',
}));

// ── Health Check ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ───────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/ai', aiRoutes);

// ── 404 Handler ──────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Error Handler ────────────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────
const startServer = async () => {
  await connectDB();
  await recoverStuckGenerations(); // flip courses stuck in 'generating' (e.g. from a restart) to 'failed' so they can be retried

  const server = createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`\n🚀 StudyLabs API running on http://localhost:${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(console.error);
}

export default app;
