import express from 'express';
import cors from 'cors';

import booksRoutes from './routes/books.routes.mjs';
import usersRoutes from './routes/users.routes.mjs';
import chatRoutes from './routes/chat.routes.mjs';
import bookmarksRoutes from './routes/bookmarks.routes.mjs';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Alistair API is running',
  });
});

app.use('/api/books', booksRoutes);
app.use('/api/auth', usersRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/chat', chatRoutes);

export default app;