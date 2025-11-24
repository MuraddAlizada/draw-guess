import { z } from 'zod';

export const startSessionSchema = z.object({
  artistId: z.string().min(1, 'artistId tələb olunur'),
});

export const submitGuessSchema = z.object({
  userId: z.string().min(1, 'userId tələb olunur'),
  guess: z.string().min(1, 'guess tələb olunur'),
});

export const saveDrawingSchema = z.object({
  drawingData: z.string().min(1, 'drawingData tələb olunur'),
});


