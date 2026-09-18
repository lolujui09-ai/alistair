import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.mjs';
import {
  getSessions,
  createSession,
  getSessionDetail,
  togglePinSession,
  toggleArchiveSession,
  renameSession,
  deleteSession,
  handleChat,
} from '../controllers/chat.controller.mjs';

const router = Router();

// Seluruh rute chat diproteksi oleh authMiddleware (khusus user yang login)
router.use(authMiddleware);

// Endpoint manajemen sesi chat
router.get('/sessions', getSessions);
router.post('/sessions', createSession);
router.get('/sessions/:id', getSessionDetail);
router.patch('/sessions/:id/pin', togglePinSession);
router.patch('/sessions/:id/archive', toggleArchiveSession);
router.patch('/sessions/:id/rename', renameSession);
router.patch('/sessions/:id', renameSession);
router.delete('/sessions/:id', deleteSession);

// Endpoint kirim pesan chat
router.post('/', handleChat);

export default router;
