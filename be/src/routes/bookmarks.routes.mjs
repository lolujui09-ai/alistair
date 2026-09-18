import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.mjs';
import { getBookmarks, toggleBookmark } from '../controllers/bookmarks.controller.mjs';

const router = Router();

// Seluruh rute bookmark membutuhkan otentikasi user
router.use(authMiddleware);

router.get('/', getBookmarks);
router.post('/toggle/:bookId', toggleBookmark);

export default router;

