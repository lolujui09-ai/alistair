import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, fetchUserProfile, logoutUser } from '../services/auth';
import { fetchBooks } from '../services/books';
import { fetchUserBookmarks, toggleUserBookmark } from '../services/bookmarks';
import {
  fetchChatSessions,
  fetchSessionDetail,
  togglePinSessionApi,
  toggleArchiveSessionApi,
  renameChatSessionApi,
  deleteChatSessionApi,
  sendChatMessageApi,
  sendChatMessageStreamApi,
} from '../services/chat';

const AppContext = createContext();

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

  // Books catalog
  const [books, setBooks] = useState([]);

  useEffect(() => {
    async function loadInitialBooks() {
      try {
        const res = await fetchBooks({ limit: 24 });
        if (res.success && res.data && res.data.length > 0) {
          setBooks(res.data);
        }
      } catch (err) {
        console.warn('Backend books load error:', err);
      }
    }
    loadInitialBooks();
  }, []);

  // Login Prompt Modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);

  // Auth state with Backend Integration
  const [token, setToken] = useState(() => localStorage.getItem('alistair-token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('alistair-user');
    return saved ? JSON.parse(saved) : null;
  });

  // Verify token on mount or token change
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
      } else {
        setUser(null);
      }
    }
    verifyAuth();
  }, [token]);

  // Bookmarks state (User-isolated from MySQL)
  const [bookmarks, setBookmarks] = useState([]);

  // Chat sessions state (User-isolated from MySQL)
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Synchronize Bookmarks & Chat Sessions from MySQL when user is logged in
  useEffect(() => {
    async function syncUserData() {
      if (token && user?.isLoggedIn) {
        try {
          const [userBookmarks, userSessions] = await Promise.all([
            fetchUserBookmarks(token).catch((err) => {
              console.warn('Fetch bookmarks failed:', err);
              return [];
            }),
            fetchChatSessions(token).catch((err) => {
              console.warn('Fetch chat sessions failed:', err);
              return [];
            }),
          ]);

          setBookmarks(userBookmarks);
          setSessions(userSessions);

          if (userSessions.length > 0) {
            // Select active non-archived session if available
            const activeSession = userSessions.find((s) => !s.isArchived) || userSessions[0];
            setCurrentSessionId(activeSession.id);
          } else {
            setCurrentSessionId(null);
          }
        } catch (err) {
          console.error('Failed to sync user data from MySQL:', err);
        }
      } else {
        // Guest or logged out: clear memory so no data leaks
        setBookmarks([]);
        setSessions([]);
        setCurrentSessionId(null);
      }
    }

    syncUserData();
  }, [token, user?.isLoggedIn]);

  // Load messages for the currently selected session if not yet loaded
  useEffect(() => {
    async function loadCurrentSessionMessages() {
      if (!currentSessionId || !token || !user?.isLoggedIn) return;

      const target = sessions.find((s) => s.id === currentSessionId);
      if (target && target.messages && target.messages.length > 0) {
        return; // Already loaded
      }

      try {
        const detail = await fetchSessionDetail(currentSessionId, token);
        if (detail && detail.messages) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSessionId ? { ...s, messages: detail.messages } : s
            )
          );
        }
      } catch (err) {
        console.warn('Failed to load session messages:', err);
      }
    }

    loadCurrentSessionMessages();
  }, [currentSessionId, token, user?.isLoggedIn, sessions]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || null;

  // Bookmarks handlers
  const toggleBookmark = async (bookId) => {
    if (!user?.isLoggedIn || !token) {
      openLoginModal();
      return;
    }

    const numId = Number(bookId);
    const wasBookmarked = bookmarks.includes(numId);

    // Optimistic UI update
    setBookmarks((prev) =>
      wasBookmarked ? prev.filter((id) => id !== numId) : [...prev, numId]
    );

    try {
      const res = await toggleUserBookmark(numId, token);
      if (res.bookmarked) {
        setBookmarks((prev) => (prev.includes(numId) ? prev : [...prev, numId]));
      } else {
        setBookmarks((prev) => prev.filter((id) => id !== numId));
      }
    } catch (err) {
      // Revert on error
      setBookmarks((prev) =>
        wasBookmarked ? [...prev, numId] : prev.filter((id) => id !== numId)
      );
      console.error('Toggle bookmark error:', err);
    }
  };

  const isBookmarked = (bookId) => bookmarks.includes(Number(bookId));

  // Chat handlers
  const startNewChat = () => {
    setCurrentSessionId(null);
  };

  const selectSession = (id) => {
    setCurrentSessionId(id);
  };

  const sendMessage = async (text, attachedBook = null) => {
    if (!text || !text.trim()) return;
    if (!user?.isLoggedIn || !token) {
      openLoginModal();
      return;
    }

    const trimmedText = text.trim();
    const tempUserMsgId = `temp-user-${Date.now()}`;
    const tempAiMsgId = `temp-ai-${Date.now()}`;
    const timestampNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage = {
      id: tempUserMsgId,
      sender: 'user',
      text: trimmedText,
      timestamp: timestampNow,
    };

    const initialAiMessage = {
      id: tempAiMsgId,
      sender: 'alistair',
      text: '',
      isStreaming: true,
      books: [],
      timestamp: timestampNow,
    };

    setIsAiResponding(true);

    const isNewSession = !currentSessionId;
    const initialSessionId = currentSessionId || `temp-session-${Date.now()}`;
    let targetSessionId = initialSessionId;

    if (isNewSession) {
      const newTempSession = {
        id: initialSessionId,
        title: trimmedText.slice(0, 30),
        isPinned: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [userMessage, initialAiMessage],
      };
      setSessions((prev) => [newTempSession, ...prev]);
      setCurrentSessionId(initialSessionId);
    } else {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === initialSessionId
            ? { ...s, messages: [...(s.messages || []), userMessage, initialAiMessage] }
            : s
        )
      );
    }

    try {
      await sendChatMessageStreamApi({
        message: trimmedText,
        sessionId: isNewSession ? null : initialSessionId,
        attachedBook,
        token,
        onInit: (data) => {
          const realSessionId = String(data.sessionId);
          targetSessionId = realSessionId;
          if (isNewSession) {
            setCurrentSessionId(realSessionId);
          }

          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === initialSessionId || s.id === realSessionId) {
                const updatedMessages = (s.messages || []).map((m) => {
                  if (m.id === tempUserMsgId && data.userMessage) {
                    return { ...m, id: String(data.userMessage.id) };
                  }
                  if (m.id === tempAiMsgId) {
                    return { ...m, books: data.books || [] };
                  }
                  return m;
                });

                return {
                  ...s,
                  id: realSessionId,
                  title: data.sessionTitle || s.title,
                  messages: updatedMessages,
                };
              }
              return s;
            })
          );
        },
        onToken: (chunkText) => {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === targetSessionId || s.id === initialSessionId) {
                const updatedMessages = (s.messages || []).map((m) => {
                  if (m.id === tempAiMsgId) {
                    return { ...m, text: (m.text || '') + chunkText };
                  }
                  return m;
                });
                return { ...s, messages: updatedMessages };
              }
              return s;
            })
          );
        },
        onDone: (data) => {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === targetSessionId || s.id === initialSessionId) {
                const updatedMessages = (s.messages || []).map((m) => {
                  if (m.id === tempAiMsgId) {
                    return {
                      ...m,
                      id: data.assistantMessageId ? String(data.assistantMessageId) : m.id,
                      isStreaming: false,
                      timestamp: data.timestamp || m.timestamp,
                    };
                  }
                  return m;
                });
                return { ...s, updatedAt: new Date().toISOString(), messages: updatedMessages };
              }
              return s;
            })
          );
          setIsAiResponding(false);
        },
        onError: (err) => {
          console.error('[Stream Error]:', err);
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === targetSessionId || s.id === initialSessionId) {
                const updatedMessages = (s.messages || []).map((m) => {
                  if (m.id === tempAiMsgId) {
                    return {
                      ...m,
                      isStreaming: false,
                      text: m.text || 'Maaf, terjadi kendala saat memproses jawaban. Silakan coba kirim kembali pesanmu.',
                    };
                  }
                  return m;
                });
                return { ...s, messages: updatedMessages };
              }
              return s;
            })
          );
          setIsAiResponding(false);
        },
      });
    } catch (err) {
      console.error('Failed to send chat message stream:', err);
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === targetSessionId || s.id === initialSessionId) {
            const updatedMessages = (s.messages || []).map((m) => {
              if (m.id === tempAiMsgId) {
                return {
                  ...m,
                  isStreaming: false,
                  text: m.text || 'Maaf, terjadi kendala saat memproses pesanmu.',
                };
              }
              return m;
            });
            return { ...s, messages: updatedMessages };
          }
          return s;
        })
      );
      setIsAiResponding(false);
    }
  };

  const togglePinSession = async (sessionId) => {
    if (!token) return;

    // Optimistic UI update
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s))
    );

    try {
      await togglePinSessionApi(sessionId, token);
    } catch (err) {
      console.error('Toggle pin session error:', err);
    }
  };

  const toggleArchiveSession = async (sessionId) => {
    if (!token) return;

    // Optimistic UI update
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, isArchived: !s.isArchived } : s))
    );

    if (currentSessionId === sessionId) {
      const remaining = sessions.filter((s) => s.id !== sessionId && !s.isArchived);
      setCurrentSessionId(remaining[0]?.id || null);
    }

    try {
      await toggleArchiveSessionApi(sessionId, token);
    } catch (err) {
      console.error('Toggle archive session error:', err);
    }
  };

  const renameSession = async (sessionId, newTitle) => {
    if (!token || !newTitle || !newTitle.trim()) return;

    const trimmed = newTitle.trim();
    // Optimistic UI update
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: trimmed } : s))
    );

    try {
      await renameChatSessionApi(sessionId, trimmed, token);
    } catch (err) {
      console.error('Rename chat session error:', err);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!token) return;

    // Optimistic UI update
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setCurrentSessionId(remaining[0]?.id || null);
    }

    try {
      await deleteChatSessionApi(sessionId, token);
    } catch (err) {
      console.error('Delete chat session error:', err);
    }
  };

  // Auth actions
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
    setBookmarks([]);
    setSessions([]);
    setCurrentSessionId(null);
    localStorage.removeItem('alistair-token');
    localStorage.removeItem('alistair-user');
    localStorage.removeItem('alistair-bookmarks');
    localStorage.removeItem('alistair-sessions');
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
        togglePinSession,
        toggleArchiveSession,
        renameSession,
        deleteSession,
        isAiResponding,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        user,
        token,
        login,
        register,
        logout,
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
