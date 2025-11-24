import { Router } from 'express';
import {
  startSession,
  saveDrawing,
  submitGuess,
  getRandomWordController,
  endSession,
  getSessionInfo,
} from '../controllers/sessionController.js';

const router = Router();

router.post('/sessions/start', startSession);
router.get('/sessions/:id', getSessionInfo);
router.post('/sessions/:id/drawing', saveDrawing);
router.post('/sessions/:id/guess', submitGuess);
router.post('/sessions/:id/end', endSession);
router.get('/words/random', getRandomWordController);

export default router;


