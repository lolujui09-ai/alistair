import { Router } from 'express';
import {
  getBooks,
  getBookFilters,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from '../controllers/books.controller.mjs';

const router = Router();

// Endpoint daftar buku dengan pagination, search, dan filter
router.get('/', getBooks);

// Endpoint meta filter (tipe dan genre populer)
router.get('/filters', getBookFilters);

// Endpoint buku spesifik berdasarkan ID
router.get('/:id', getBookById);

// Endpoint manipulasi data
router.post('/', createBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

export default router;
