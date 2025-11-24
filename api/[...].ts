import express from 'express';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from 'dotenv';
import sessionRoutes from '../backend/src/routes/sessionRoutes.js';
import { getAllSessions, updateSession } from '../backend/src/storage/sessions.js';

config();

const app = express();
const logger = pino({ level: 'info' });

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// API routes
app.use('/api', sessionRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Session cleanup - Vercel serverless'da setInterval çalışmaz, 
// bunun yerine her request'te kontrol ediyoruz
const cleanupExpiredSessions = () => {
  const now = new Date();
  const sessions = getAllSessions();
  
  sessions.forEach(session => {
    if (session.isActive && now > session.endsAt) {
      updateSession(session.id, { isActive: false });
      logger.info(`⏰ Session ${session.id} vaxt bitdiyi üçün avtomatik bitirildi`);
    }
  });
};

// Her request'te expired session'ları temizle
app.use((req, res, next) => {
  cleanupExpiredSessions();
  next();
});

// Vercel serverless function export
export default app;

