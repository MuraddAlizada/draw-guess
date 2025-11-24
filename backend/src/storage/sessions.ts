import { DrawingSession } from '../types/index.js';

const sessions: Map<string, DrawingSession> = new Map();

export function createSession(session: DrawingSession): DrawingSession {
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): DrawingSession | undefined {
  return sessions.get(id);
}

export function updateSession(id: string, updates: Partial<DrawingSession>): DrawingSession | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  
  const updated = { ...session, ...updates };
  sessions.set(id, updated);
  return updated;
}

export function getAllSessions(): DrawingSession[] {
  return Array.from(sessions.values());
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

