import express from 'express';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sessionRoutes from './routes/sessionRoutes.js';
import { getAllSessions, updateSession } from './storage/sessions.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const logger = pino({ level: 'info' });
const PORT = process.env.PORT || 3009;

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use(express.static(path.join(__dirname, '../../frontend')));

app.use('/api', sessionRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

setInterval(() => {
  const now = new Date();
  const sessions = getAllSessions();
  
  sessions.forEach(session => {
    if (session.isActive && now > session.endsAt) {
      updateSession(session.id, { isActive: false });
      logger.info(`⏰ Session ${session.id} vaxt bitdiyi üçün avtomatik bitirildi`);
    }
  });
}, 30000);

app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`⏰ Session cleanup başladı (hər 30 saniyədə bir)`);
});
