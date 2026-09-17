import { createContext, useContext, useState, useEffect } from 'react';
import { mockBooks } from '../data/mockBooks';
import { loginUser, registerUser, fetchUserProfile, logoutUser } from '../services/auth';
import { fetchBooks } from '../services/books';

const AppContext = createContext();

const INITIAL_SESSIONS = [
  {
    id: 'session-1',
    title: 'Manhwa santai',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Aku ingin manhwa fantasy yang santai dengan setting pedesaan.',
        timestamp: '14:20'
      },
      {
        id: 'm2',
        sender: 'alistair',
        text: 'Tentu! Kalau kamu mencari suasana yang lebih tenang dan santai dengan perjalanan atau nuansa pedesaan yang menyejukkan hati, berikut beberapa pilihan yang sangat aku rekomendasikan:',
        timestamp: '14:20',
        books: [mockBooks[0], mockBooks[4]]
      }
    ]
  },
  {
    id: 'session-2',
    title: 'Fantasy recommendation',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    messages: [
      {
        id: 'm3',
        sender: 'user',
        text: 'Rekomendasi manhwa aksi fantasi terbaik saat ini?',
        timestamp: 'Kemarin'
      },
      {
        id: 'm4',
        sender: 'alistair',
        text: 'Dua judul aksi fantasi paling populer dengan dungeon, sistem quest, dan skenario survival tingkat tinggi:',
        timestamp: 'Kemarin',
        books: [mockBooks[1], mockBooks[2]]
      }
    ]
  },
  {
    id: 'session-3',
    title: 'Buku untuk weekend',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    messages: [
      {
        id: 'm5',
        sender: 'user',
        text: 'Ada novel menarik dan reflektif untuk dibaca akhir pekan?',
        timestamp: '2 hari lalu'
      },
      {
        id: 'm6',
        sender: 'alistair',
        text: 'Coba baca The Midnight Library atau A Man Called Ove. Keduanya membawa kisah hangat tentang pilihan hidup dan harapan.',
        timestamp: '2 hari lalu',
        books: [mockBooks[7], mockBooks[4]]
      }
    ]
  }
];

export function AppProvider({ children }) {
  // Theme state
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('alistair-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('alistair-theme', theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  // Books (dimuat dari backend, fallback ke mockBooks)
  const [books, setBooks] = useState(mockBooks);

  useEffect(() => {
    async function loadInitialBooks() {
      try {
        const res = await fetchBooks({ limit: 12 });
        if (res.success && res.data && res.data.length > 0) {
          setBooks(res.data);
        }
      } catch (err) {
        console.warn('Backend books load fallback to mock:', err);
      }
    }
    loadInitialBooks();
  }, []);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('alistair-bookmarks');
    return saved ? JSON.parse(saved) : [1, 2];
  });

  useEffect(() => {
    localStorage.setItem('alistair-bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = (bookId) => {
    setBookmarks((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const isBookmarked = (bookId) => bookmarks.includes(bookId);

  // Chat sessions
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('alistair-sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return sessions[0]?.id || null;
  });

  useEffect(() => {
    localStorage.setItem('alistair-sessions', JSON.stringify(sessions));
  }, [sessions]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || null;

  const startNewChat = () => {
    setCurrentSessionId(null);
  };

  const selectSession = (id) => {
    setCurrentSessionId(id);
  };

  const sendMessage = (text, attachedBook = null) => {
    if (!text.trim()) return;

    const userMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Find smart book matches
    const lower = text.toLowerCase();
    let matchedBooks;
    if (attachedBook) {
      matchedBooks = [attachedBook];
    } else {
      const filtered = books.filter((b) => {
        return (
          (b.title && lower.includes(b.title.toLowerCase())) ||
          (b.author && lower.includes(b.author.toLowerCase())) ||
          (b.type && lower.includes(b.type.toLowerCase())) ||
          (b.genre && lower.includes(b.genre.toLowerCase())) ||
          (b.format && lower.includes(b.format.toLowerCase())) ||
          (b.tags && b.tags.some((t) => lower.includes(t.toLowerCase())))
        );
      });
      matchedBooks = filtered.length > 0 ? filtered : books.slice(0, 2);
    }

    let aiReplyText;
    if (attachedBook) {
      aiReplyText = `Buku **${attachedBook.title}** karya ${attachedBook.author} adalah pilihan yang luar biasa! Ceritanya menggabungkan nuansa ${attachedBook.genre}. Apakah kamu ingin tahu lebih lanjut mengenai ringkasan cerita atau karakternya?`;
    } else if (lower.includes('santai') || lower.includes('pedesaan') || lower.includes('relax')) {
      aiReplyText = `Untuk bacaan yang santai dan menenangkan jiwa, ini buku/komik yang paling pas untuk dinikmati dengan secangkir teh atau kopi:`;
    } else if (lower.includes('fantasi') || lower.includes('fantasy') || lower.includes('magic')) {
      aiReplyText = `Dunia fantasi yang kaya dengan sihir dan petualangan epik! Ini beberapa judul terbaik di koleksi Alistair:`;
    } else if (lower.includes('aksi') || lower.includes('action') || lower.includes('level')) {
      aiReplyText = `Kalau kamu suka ketegangan, leveling system, dan aksi bertarung tanpa henti, kamu wajib membaca ini:`;
    } else {
      aiReplyText = `Menarik sekali! Berdasarkan apa yang kamu cari, aku menemukan beberapa rekomendasi bacaan yang sangat cocok untukmu:`;
    }

    const aiMessage = {
      id: `msg-${Date.now()}-ai`,
      sender: 'alistair',
      text: aiReplyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      books: matchedBooks.slice(0, 3)
    };

    if (currentSessionId && currentSession) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: [...s.messages, userMessage, aiMessage]
            };
          }
          return s;
        })
      );
    } else {
      // Create new session
      const newSessionTitle = text.slice(0, 26) + (text.length > 26 ? '...' : '');
      const newSession = {
        id: `session-${Date.now()}`,
        title: newSessionTitle,
        createdAt: new Date().toISOString(),
        messages: [userMessage, aiMessage]
      };
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
    }
  };

  const clearChatHistory = () => {
    setSessions([]);
    setCurrentSessionId(null);
    localStorage.removeItem('alistair-sessions');
  };

  // Auth state with Backend Integration
  const [token, setToken] = useState(() => localStorage.getItem('alistair-token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('alistair-user');
    return saved ? JSON.parse(saved) : null;
  });

  // Verify token on mount if token exists
  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const profile = await fetchUserProfile(token);
          const userData = { ...profile, isLoggedIn: true };
          setUser(userData);
          localStorage.setItem('alistair-user', JSON.stringify(userData));
        } catch {
          // Token is invalid or expired
          setUser(null);
          setToken(null);
          localStorage.removeItem('alistair-token');
          localStorage.removeItem('alistair-user');
        }
      }
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    const userData = { ...data.user, isLoggedIn: true };
    setUser(userData);
    setToken(data.token);
    localStorage.setItem('alistair-token', data.token);
    localStorage.setItem('alistair-user', JSON.stringify(userData));
    return userData;
  };

  const register = async (name, email, password) => {
    const data = await registerUser(name, email, password);
    const userData = { ...data.user, isLoggedIn: true };
    setUser(userData);
    setToken(data.token);
    localStorage.setItem('alistair-token', data.token);
    localStorage.setItem('alistair-user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    if (token) {
      await logoutUser(token);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('alistair-token');
    localStorage.removeItem('alistair-user');
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        books,
        bookmarks,
        toggleBookmark,
        isBookmarked,
        sessions,
        currentSessionId,
        currentSession,
        startNewChat,
        selectSession,
        sendMessage,
        clearChatHistory,
        user,
        token,
        login,
        register,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
