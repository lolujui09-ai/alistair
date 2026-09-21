import pool from '../config/db.mjs';
import { askAlistair, askAlistairStream } from '../services/rag.service.mjs';

/**
 * Mengambil seluruh sesi chat milik user yang sedang login
 * Endpoint: GET /api/chat/sessions
 */
export async function getSessions(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT id, title, is_pinned, is_archived, created_at, updated_at
       FROM chat_sessions
       WHERE user_id = ?
       ORDER BY is_pinned DESC, updated_at DESC`,
      [userId]
    );

    const sessions = rows.map((s) => ({
      id: String(s.id),
      title: s.title,
      isPinned: Boolean(s.is_pinned),
      isArchived: Boolean(s.is_archived),
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Error getting chat sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat sessions',
    });
  }
}

/**
 * Membuat sesi chat baru
 * Endpoint: POST /api/chat/sessions
 */
export async function createSession(req, res) {
  try {
    const userId = req.user.id;
    const title = (req.body.title && req.body.title.trim()) || 'Percakapan Baru';

    const [result] = await pool.query(
      'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)',
      [userId, title]
    );

    const newSession = {
      id: String(result.insertId),
      title,
      isPinned: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    res.status(201).json({
      success: true,
      data: newSession,
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat session',
    });
  }
}

/**
 * Mengambil detail 1 sesi chat beserta pesan-pesannya
 * Endpoint: GET /api/chat/sessions/:id
 */
export async function getSessionDetail(req, res) {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id, 10);

    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID',
      });
    }

    // Pastikan sesi ada dan milik user yang sedang login
    const [sessionRows] = await pool.query(
      'SELECT id, title, is_pinned, is_archived, created_at, updated_at FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (sessionRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found or unauthorized',
      });
    }

    const s = sessionRows[0];

    // Ambil seluruh pesan dalam sesi ini
    const [msgRows] = await pool.query(
      'SELECT id, role, content, metadata, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC, id ASC',
      [sessionId]
    );

    const messages = msgRows.map((m) => {
      let books = [];
      if (m.metadata) {
        try {
          const meta = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
          books = meta.books || [];
        } catch {
          books = [];
        }
      }

      return {
        id: String(m.id),
        sender: m.role === 'user' ? 'user' : 'alistair',
        text: m.content,
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        books,
      };
    });

    res.json({
      success: true,
      data: {
        id: String(s.id),
        title: s.title,
        isPinned: Boolean(s.is_pinned),
        isArchived: Boolean(s.is_archived),
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        messages,
      },
    });
  } catch (error) {
    console.error('Error getting session detail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve session detail',
    });
  }
}

/**
 * Toggle Pin pada sesi chat
 * Endpoint: PATCH /api/chat/sessions/:id/pin
 */
export async function togglePinSession(req, res) {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id, 10);

    const [rows] = await pool.query(
      'SELECT is_pinned FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or unauthorized',
      });
    }

    const newPinned = rows[0].is_pinned ? 0 : 1;

    await pool.query(
      'UPDATE chat_sessions SET is_pinned = ? WHERE id = ? AND user_id = ?',
      [newPinned, sessionId, userId]
    );

    res.json({
      success: true,
      isPinned: Boolean(newPinned),
      message: newPinned ? 'Session pinned' : 'Session unpinned',
    });
  } catch (error) {
    console.error('Error toggling pin session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle pin',
    });
  }
}

/**
 * Toggle Archive pada sesi chat
 * Endpoint: PATCH /api/chat/sessions/:id/archive
 */
export async function toggleArchiveSession(req, res) {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id, 10);

    const [rows] = await pool.query(
      'SELECT is_archived FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or unauthorized',
      });
    }

    const newArchived = rows[0].is_archived ? 0 : 1;

    await pool.query(
      'UPDATE chat_sessions SET is_archived = ? WHERE id = ? AND user_id = ?',
      [newArchived, sessionId, userId]
    );

    res.json({
      success: true,
      isArchived: Boolean(newArchived),
      message: newArchived ? 'Session archived' : 'Session unarchived',
    });
  } catch (error) {
    console.error('Error toggling archive session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle archive',
    });
  }
}

/**
 * Mengubah nama/judul sesi chat
 * Endpoint: PATCH /api/chat/sessions/:id/rename
 */
export async function renameSession(req, res) {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id, 10);
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    const trimmedTitle = title.trim();

    const [result] = await pool.query(
      'UPDATE chat_sessions SET title = ? WHERE id = ? AND user_id = ?',
      [trimmedTitle, sessionId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or unauthorized',
      });
    }

    res.json({
      success: true,
      data: {
        id: String(sessionId),
        title: trimmedTitle,
      },
      message: 'Session renamed successfully',
    });
  } catch (error) {
    console.error('Error renaming session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rename session',
    });
  }
}

/**
 * Menghapus sesi chat beserta seluruh pesannya
 * Endpoint: DELETE /api/chat/sessions/:id
 */
export async function deleteSession(req, res) {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id, 10);

    const [result] = await pool.query(
      'DELETE FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or unauthorized',
      });
    }

    res.json({
      success: true,
      message: 'Session and its messages successfully deleted',
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
    });
  }
}

/**
 * Mengirim pesan chat, memanggil AI RAG, dan menyimpan pesan ke MySQL
 * Endpoint: POST /api/chat
 */
export async function handleChat(req, res) {
  try {
    const userId = req.user.id;
    const { message, sessionId = null, attachedBook = null } = req.body;
    const isStream = req.body.stream === true || req.query.stream === 'true';

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Field "message" wajib diisi dengan teks pertanyaan.',
      });
    }

    let activeSessionId = sessionId ? parseInt(sessionId, 10) : null;
    let sessionTitle = '';

    // 1. Tentukan atau buat sesi di database
    if (activeSessionId) {
      const [sessRows] = await pool.query(
        'SELECT id, title FROM chat_sessions WHERE id = ? AND user_id = ?',
        [activeSessionId, userId]
      );

      if (sessRows.length === 0) {
        activeSessionId = null; // Buat sesi baru jika id tidak valid/bukan miliknya
      } else {
        sessionTitle = sessRows[0].title;
      }
    }

    if (!activeSessionId) {
      // Buat judul otomatis dari pesan pertama (maks 35 karakter)
      sessionTitle = message.trim().slice(0, 35) + (message.trim().length > 35 ? '...' : '');
      const [newSess] = await pool.query(
        'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)',
        [userId, sessionTitle]
      );
      activeSessionId = newSess.insertId;
    }

    // 2. Simpan pesan pengguna ke chat_messages
    const [userMsgResult] = await pool.query(
      'INSERT INTO chat_messages (session_id, role, content) VALUES (?, "user", ?)',
      [activeSessionId, message.trim()]
    );

    // Ambil riwayat percakapan terbaru untuk konteks percakapan (termasuk metadata rekomendasi)
    const [historyRows] = await pool.query(
      `SELECT id, role, content, metadata
       FROM chat_messages
       WHERE session_id = ?
       ORDER BY id DESC
       LIMIT 8`,
      [activeSessionId]
    );

    const history = historyRows.reverse().map((h) => ({
      role: h.role,
      content: h.content,
      metadata: h.metadata,
    }));

    const userMessageData = {
      id: String(userMsgResult.insertId),
      sender: 'user',
      text: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // JIKA STREAMING:
    if (isStream) {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      let streamGen;
      let finalBooks = [];

      try {
        const streamResult = await askAlistairStream({
          message: message.trim(),
          history,
          attachedBook,
        });
        streamGen = streamResult.streamGenerator;
        finalBooks = streamResult.books || [];
      } catch (ragError) {
        console.warn('[Chat Stream] RAG fallback due to error:', ragError.message);
        finalBooks = attachedBook ? [attachedBook] : [];
        async function* fallbackGen() {
          const fallbackText = `Halo! Aku Alistair. Pertanyaanmu mengenai "${message.trim()}" telah kuterima. Saat ini aku sedang menyiapkan katalog rekomendasi terbaik untukmu.`;
          for (const word of fallbackText.split(' ')) {
            yield word + ' ';
            await new Promise((r) => setTimeout(r, 40));
          }
        }
        streamGen = fallbackGen();
      }

      // Kirim event 'init' pertama berisi info sesi, pesan user, dan kartu buku
      res.write(`data: ${JSON.stringify({
        type: 'init',
        sessionId: String(activeSessionId),
        sessionTitle,
        userMessage: userMessageData,
        books: finalBooks,
      })}\n\n`);

      let fullReply = '';
      try {
        for await (const chunk of streamGen) {
          fullReply += chunk;
          res.write(`data: ${JSON.stringify({
            type: 'token',
            text: chunk,
          })}\n\n`);
        }
      } catch (streamError) {
        console.error('[Chat Stream] Error during streaming tokens:', streamError.message);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: streamError.message,
        })}\n\n`);
      }

      // Simpan balasan utuh AI ke chat_messages
      const metadata = JSON.stringify({ books: finalBooks });
      const [assistantMsgResult] = await pool.query(
        'INSERT INTO chat_messages (session_id, role, content, metadata) VALUES (?, "assistant", ?, ?)',
        [activeSessionId, fullReply, metadata]
      );

      // Perbarui updated_at pada chat_sessions
      await pool.query(
        'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [activeSessionId]
      );

      // Kirim event 'done'
      res.write(`data: ${JSON.stringify({
        type: 'done',
        assistantMessageId: String(assistantMsgResult.insertId),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })}\n\n`);

      return res.end();
    }

    // JIKA NON-STREAMING (Graceful fallback):
    let aiResult;
    try {
      aiResult = await askAlistair({
        message: message.trim(),
        history,
        attachedBook,
      });
    } catch (ragError) {
      console.warn('[Chat] RAG processing fallback:', ragError.message);
      aiResult = {
        reply: `Halo! Aku Alistair. Pertanyaanmu mengenai "${message.trim()}" telah kuterima. Saat ini aku sedang menyiapkan katalog rekomendasi terbaik untukmu.`,
        books: attachedBook ? [attachedBook] : [],
      };
    }

    const metadata = JSON.stringify({ books: aiResult.books || [] });
    const [assistantMsgResult] = await pool.query(
      'INSERT INTO chat_messages (session_id, role, content, metadata) VALUES (?, "assistant", ?, ?)',
      [activeSessionId, aiResult.reply, metadata]
    );

    await pool.query(
      'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [activeSessionId]
    );

    res.json({
      success: true,
      data: {
        sessionId: String(activeSessionId),
        sessionTitle,
        userMessage: userMessageData,
        assistantMessage: {
          id: String(assistantMsgResult.insertId),
          sender: 'alistair',
          text: aiResult.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          books: aiResult.books || [],
        },
      },
    });
  } catch (error) {
    console.error('Chat controller error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Gagal memproses pesan chat',
        error: error.message,
      });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  }
}
