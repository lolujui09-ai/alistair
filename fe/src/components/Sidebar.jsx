import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  Compass,
  Bookmark,
  Settings,
  LogIn,
  LogOut,
  Sparkles,
  MoreVertical,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar({ isCollapsed = false, onToggleCollapse, onCloseMobile }) {
  const [showArchived, setShowArchived] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Menutup dropdown saat pengguna mengklik di luar dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openDropdownId && !e.target.closest('[data-dropdown-container]')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);
  const {
    sessions,
    currentSessionId,
    selectSession,
    startNewChat,
    bookmarks,
    user,
    logout,
    togglePinSession,
    toggleArchiveSession,
    renameSession,
    deleteSession,
    openLoginModal
  } = useApp();

  const handleNewChat = () => {
    if (!user?.isLoggedIn) {
      openLoginModal();
      return;
    }
    startNewChat();
    navigate('/chat');
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectSession = (sessionId) => {
    selectSession(sessionId);
    navigate('/chat');
    if (onCloseMobile) onCloseMobile();
  };

  const isRouteActive = (path) => location.pathname === path;

  // Filter & sorting chat sessions
  const activeSessions = sessions.filter((s) => !s.isArchived);
  const archivedSessions = sessions.filter((s) => s.isArchived);
  const sortedActiveSessions = [...activeSessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  // ==========================================
  // 1. COLLAPSED VIEW (Icon-only sidebar / Rail)
  // ==========================================
  if (isCollapsed) {
    return (
      <aside className="w-16 h-full flex flex-col justify-between items-center bg-base-200 border-r border-base-300 py-3 select-none transition-all duration-300">
        {/* Top Section */}
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Brand Logo Icon */}
          <div className="tooltip tooltip-right" data-tip="Alistair">
            <Link
              to="/explore"
              className="w-10 h-10 rounded-xl bg-primary text-primary-content flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
            >
              <Sparkles className="w-5 h-5" />
            </Link>
          </div>

          {/* New Chat Icon Button */}
          <div className="tooltip tooltip-right" data-tip="New Chat">
            <button
              type="button"
              onClick={handleNewChat}
              className="btn btn-square btn-sm btn-ghost hover:btn-primary text-base-content hover:text-primary-content transition-colors"
              aria-label="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="divider my-0 w-8 opacity-40"></div>

          {/* Core Navigation Icons */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <div className="tooltip tooltip-right" data-tip="Explore">
              <Link
                to="/explore"
                className={`btn btn-square btn-sm ${
                  isRouteActive('/explore')
                    ? 'btn-neutral text-base-content'
                    : 'btn-ghost text-base-content/70 hover:text-base-content'
                }`}
                aria-label="Explore"
              >
                <Compass className="w-5 h-5" />
              </Link>
            </div>

            <div className="tooltip tooltip-right" data-tip="My Library">
              <Link
                to="/library"
                className={`btn btn-square btn-sm relative ${
                  isRouteActive('/library')
                    ? 'btn-neutral text-base-content'
                    : 'btn-ghost text-base-content/70 hover:text-base-content'
                }`}
                aria-label="My Library"
              >
                <Bookmark className="w-5 h-5" />
                {user?.isLoggedIn && bookmarks.length > 0 && (
                  <span className="badge badge-xs badge-primary absolute top-1 right-1 p-0.5 w-2 h-2 rounded-full"></span>
                )}
              </Link>
            </div>

            <div className="tooltip tooltip-right" data-tip="Settings">
              <Link
                to="/settings"
                className={`btn btn-square btn-sm ${
                  isRouteActive('/settings')
                    ? 'btn-neutral text-base-content'
                    : 'btn-ghost text-base-content/70 hover:text-base-content'
                }`}
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section: User & Tombol Buka / Expand Sidebar */}
        <div className="flex flex-col items-center gap-3 w-full pt-3 border-t border-base-300">
          {/* User Avatar */}
          {user?.isLoggedIn ? (
            <div className="tooltip tooltip-right" data-tip={user.name || 'Account'}>
              <Link
                to="/settings"
                className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs hover:ring-2 hover:ring-primary/40 transition-all"
              >
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </Link>
            </div>
          ) : (
            <div className="tooltip tooltip-right" data-tip="Login">
              <Link
                to="/login"
                className="btn btn-ghost btn-square btn-sm text-primary"
                aria-label="Login"
              >
                <LogIn className="w-5 h-5" />
              </Link>
            </div>
          )}

          {/* Tombol Buka / Expand Sidebar di BAWAH Sidebar */}
          <div className="tooltip tooltip-right" data-tip="Buka Sidebar">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content hover:bg-base-300 transition-colors"
              title="Buka Sidebar"
              aria-label="Buka Sidebar"
            >
              {/* Sidebar expand icon (panel-left-open) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <path d="M9 3v18" />
                <path d="m14 9 3 3-3 3" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // ==========================================
  // 2. EXPANDED VIEW (Full sidebar)
  // ==========================================
  return (
    <aside className="w-64 h-full flex flex-col justify-between bg-base-200 border-r border-base-300 select-none transition-all duration-300">
      {/* Top Header & Brand */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/explore"
            onClick={onCloseMobile}
            className="flex items-center gap-2 font-bold text-lg text-base-content hover:text-primary transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-content flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <span>Alistair</span>
          </Link>

          {/* Collapse icon button (replacing 'X') */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content hover:bg-base-300 transition-colors"
            title="Tutup Sidebar"
            aria-label="Tutup Sidebar"
          >
            {/* Sidebar collapse icon (panel-left-close) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <path d="M9 3v18" />
              <path d="m16 15-3-3 3-3" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="btn btn-outline btn-sm w-full gap-2 justify-start font-medium border-base-300 hover:border-primary hover:bg-primary hover:text-primary-content transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Middle Scrollable Section: Chats & Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
        {/* Chat History - Hanya muncul jika user sudah login */}
        {user?.isLoggedIn && (
          <>
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-base-content/50 uppercase flex items-center justify-between">
                <span>Recent Chats</span>
                {activeSessions.some((s) => s.isPinned) && (
                  <span className="text-[10px] text-primary flex items-center gap-1 font-normal lowercase">
                    <Pin className="w-2.5 h-2.5 fill-current" /> pinned
                  </span>
                )}
              </div>
              <ul className="menu menu-sm p-0 w-full space-y-0.5">
                {sortedActiveSessions.length === 0 ? (
                  <li className="text-xs text-base-content/40 px-3 py-2 italic">
                    {archivedSessions.length > 0 ? 'Semua chat diarsipkan' : 'No recent chats'}
                  </li>
                ) : (
                  sortedActiveSessions.map((session) => {
                    const isActive = isRouteActive('/chat') && currentSessionId === session.id;
                    const isMenuOpen = openDropdownId === session.id;
                    const isEditing = editingSessionId === session.id;
                    return (
                      <li key={session.id} className="group relative">
                        {isEditing ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (editingTitle.trim()) {
                                renameSession(session.id, editingTitle.trim());
                              }
                              setEditingSessionId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 w-full py-1 px-1.5 bg-base-200 rounded-lg"
                          >
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setEditingSessionId(null);
                                }
                              }}
                              autoFocus
                              className="input input-xs input-bordered flex-1 min-w-0 text-xs px-2 py-1 h-7 bg-base-100"
                              placeholder="Nama sesi chat..."
                            />
                            <button
                              type="submit"
                              className="btn btn-xs btn-primary btn-square h-7 w-7 shrink-0 cursor-pointer"
                              title="Simpan nama"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSessionId(null)}
                              className="btn btn-xs btn-ghost btn-square h-7 w-7 shrink-0 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <div
                            onClick={() => {
                              setOpenDropdownId(null);
                              handleSelectSession(session.id);
                            }}
                            className={`flex items-center justify-between py-1.5 px-2.5 text-xs rounded-lg transition-colors cursor-pointer w-full ${
                              isActive
                                ? 'active font-medium bg-base-300 text-base-content'
                                : 'text-base-content/70 hover:bg-base-300/50'
                            }`}
                            title={session.title}
                          >
                            <div className="flex items-center gap-1.5 w-0 flex-1 min-w-0 overflow-hidden mr-1">
                              {session.isPinned && (
                                <Pin className="w-3 h-3 text-primary shrink-0 rotate-45 fill-current" />
                              )}
                              <span className="truncate block">{session.title}</span>
                            </div>

                            {/* Dropdown 3 Titik Terkontrol */}
                            <div
                              data-dropdown-container
                              className="relative shrink-0 z-10 w-6"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(isMenuOpen ? null : session.id);
                                }}
                                className={`btn btn-ghost btn-xs btn-circle p-0 h-6 w-6 min-h-0 flex items-center justify-center cursor-pointer text-base-content opacity-100 transition-all hover:bg-base-200 ${
                                  isMenuOpen || isActive ? 'bg-base-200' : ''
                                }`}
                                title="Opsi chat"
                                aria-label="Opsi chat"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {isMenuOpen && (
                                <ul className="absolute right-0 top-full z-50 menu p-1 shadow-xl bg-base-100 rounded-box border border-base-300 w-36 text-xs mt-1">
                                  <li>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        setEditingSessionId(session.id);
                                        setEditingTitle(session.title);
                                      }}
                                      className="gap-2 py-1.5"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                      <span>Edit Nama</span>
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        togglePinSession(session.id);
                                      }}
                                      className="gap-2 py-1.5"
                                    >
                                      {session.isPinned ? (
                                        <>
                                          <PinOff className="w-3.5 h-3.5" />
                                          <span>Lepas Pin</span>
                                        </>
                                      ) : (
                                        <>
                                          <Pin className="w-3.5 h-3.5" />
                                          <span>Pin chat</span>
                                        </>
                                      )}
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        toggleArchiveSession(session.id);
                                      }}
                                      className="gap-2 py-1.5"
                                    >
                                      <Archive className="w-3.5 h-3.5" />
                                      <span>Arsipkan</span>
                                    </button>
                                  </li>
                                  <li className="border-t border-base-300 my-1"></li>
                                  <li>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenDropdownId(null);
                                        deleteSession(session.id);
                                      }}
                                      className="gap-2 py-1.5 text-error hover:bg-error/10"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Hapus</span>
                                    </button>
                                  </li>
                                </ul>
                              )}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>

              {/* Bagian Chat yang Diarsipkan */}
              {archivedSessions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-base-300/50">
                  <button
                    type="button"
                    onClick={() => setShowArchived((prev) => !prev)}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 text-[11px] font-medium text-base-content/60 hover:text-base-content hover:bg-base-200/60 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Archive className="w-3.5 h-3.5 text-base-content/60" />
                      <span>Archived ({archivedSessions.length})</span>
                    </div>
                    {showArchived ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>

                  {showArchived && (
                    <ul className="menu menu-sm p-0 w-full space-y-0.5 mt-1 pl-1 border-l-2 border-base-300">
                      {archivedSessions.map((session) => {
                        const isActive = isRouteActive('/chat') && currentSessionId === session.id;
                        const isMenuOpen = openDropdownId === session.id;
                        const isEditing = editingSessionId === session.id;
                        return (
                          <li key={session.id} className="group relative">
                            {isEditing ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (editingTitle.trim()) {
                                    renameSession(session.id, editingTitle.trim());
                                  }
                                  setEditingSessionId(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 w-full py-1 px-1.5 bg-base-200 rounded-lg"
                              >
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      setEditingSessionId(null);
                                    }
                                  }}
                                  autoFocus
                                  className="input input-xs input-bordered flex-1 min-w-0 text-xs px-2 py-1 h-7 bg-base-100"
                                  placeholder="Nama sesi chat..."
                                />
                                <button
                                  type="submit"
                                  className="btn btn-xs btn-primary btn-square h-7 w-7 shrink-0 cursor-pointer"
                                  title="Simpan nama"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSessionId(null)}
                                  className="btn btn-xs btn-ghost btn-square h-7 w-7 shrink-0 cursor-pointer"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </form>
                            ) : (
                              <div
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  handleSelectSession(session.id);
                                }}
                                className={`flex items-center justify-between py-1.5 px-2 text-xs rounded-lg transition-colors cursor-pointer w-full ${
                                  isActive
                                    ? 'active font-medium bg-base-300 text-base-content'
                                    : 'text-base-content/60 hover:bg-base-300/50'
                                }`}
                                title={session.title}
                              >
                                <span className="truncate block w-0 flex-1 min-w-0">{session.title}</span>

                                <div
                                  data-dropdown-container
                                  className="relative shrink-0 z-10 w-6"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownId(isMenuOpen ? null : session.id);
                                    }}
                                    className={`btn btn-ghost btn-xs btn-circle p-0 h-6 w-6 min-h-0 flex items-center justify-center cursor-pointer text-base-content opacity-100 transition-all hover:bg-base-200 ${
                                      isMenuOpen || isActive ? 'bg-base-200' : ''
                                    }`}
                                    title="Opsi arsip"
                                    aria-label="Opsi arsip"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>

                                  {isMenuOpen && (
                                    <ul className="absolute right-0 top-full z-50 menu p-1 shadow-lg bg-base-100 rounded-box border border-base-300 w-36 text-xs mt-1">
                                      <li>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            setEditingSessionId(session.id);
                                            setEditingTitle(session.title);
                                          }}
                                          className="gap-2 py-1.5"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                          <span>Edit Nama</span>
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            toggleArchiveSession(session.id);
                                          }}
                                          className="gap-2 py-1.5"
                                        >
                                          <ArchiveRestore className="w-3.5 h-3.5" />
                                          <span>Batal Arsip</span>
                                        </button>
                                      </li>
                                      <li className="border-t border-base-300 my-1"></li>
                                      <li>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            deleteSession(session.id);
                                          }}
                                          className="gap-2 py-1.5 text-error hover:bg-error/10"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Hapus</span>
                                        </button>
                                      </li>
                                    </ul>
                                  )}
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="divider my-1 opacity-40"></div>
          </>
        )}

        {/* Core Navigation */}
        <div>
          <div className="px-3 py-1 text-[11px] font-semibold tracking-wider text-base-content/50 uppercase">
            Discover
          </div>
          <ul className="menu menu-sm p-0 w-full space-y-1">
            <li>
              <Link
                to="/explore"
                onClick={onCloseMobile}
                className={`gap-2.5 py-2 text-xs font-medium rounded-lg ${
                  isRouteActive('/explore') ? 'active bg-base-300 text-base-content' : 'text-base-content/80'
                }`}
              >
                <Compass className="w-4 h-4 opacity-80" />
                <span>Explore</span>
              </Link>
            </li>
            <li>
              <Link
                to="/library"
                onClick={onCloseMobile}
                className={`gap-2.5 py-2 text-xs font-medium rounded-lg justify-between ${
                  isRouteActive('/library') ? 'active bg-base-300 text-base-content' : 'text-base-content/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 opacity-80" />
                  <span>My Library</span>
                </div>
                {user?.isLoggedIn && bookmarks.length > 0 && (
                  <span className="badge badge-xs badge-neutral px-1.5">{bookmarks.length}</span>
                )}
              </Link>
            </li>
          </ul>
        </div>

        <div className="divider my-1 opacity-40"></div>

        {/* Settings */}
        <div>
          <ul className="menu menu-sm p-0 w-full">
            <li>
              <Link
                to="/settings"
                onClick={onCloseMobile}
                className={`gap-2.5 py-2 text-xs font-medium rounded-lg ${
                  isRouteActive('/settings') ? 'active bg-base-300 text-base-content' : 'text-base-content/80'
                }`}
              >
                <Settings className="w-4 h-4 opacity-80" />
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Auth Section */}
      <div className="p-3 border-t border-base-300 bg-base-200/60 flex flex-col gap-2">
        {user?.isLoggedIn ? (
          <div className="flex items-center justify-between p-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-base-content truncate">{user.name}</p>
                <p className="text-[10px] text-base-content/50 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-error"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <Link
              to="/login"
              onClick={onCloseMobile}
              className="btn btn-sm btn-outline btn-primary w-full gap-2 font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
