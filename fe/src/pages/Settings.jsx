import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette, User, MessageSquare, Trash2, Check, LogOut, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { theme, setTheme, user, logout, clearChatHistory } = useApp();
  const [clearedNotice, setClearedNotice] = useState(false);

  const availableThemes = [
    { id: 'dark', name: 'Dark (Default)' },
    { id: 'light', name: 'Light' },
    { id: 'dim', name: 'Dim' },
    { id: 'night', name: 'Night' },
    { id: 'synthwave', name: 'Synthwave' },
    { id: 'cupcake', name: 'Cupcake' },
    { id: 'forest', name: 'Forest' },
    { id: 'corporate', name: 'Corporate' }
  ];

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear all chat history?')) {
      clearChatHistory();
      setClearedNotice(true);
      setTimeout(() => setClearedNotice(false), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
          Settings
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          Manage your app preferences, account, and chat data.
        </p>
      </div>

      {clearedNotice && (
        <div className="alert alert-success text-sm py-2 shadow-sm">
          <Check className="w-4 h-4" />
          <span>Chat history has been successfully cleared.</span>
        </div>
      )}

      {/* 1. Appearance Section */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="card-title text-lg font-bold">Appearance</h2>
          </div>
          <p className="text-xs text-base-content/60">
            Customize the look and feel of Alistair with DaisyUI themes.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            {availableThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  theme === t.id
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-base-300 hover:border-base-content/30 bg-base-200/50'
                }`}
              >
                <span className="text-xs font-semibold text-base-content">{t.name}</span>
                <span className="text-[10px] text-base-content/50 capitalize mt-1">
                  {theme === t.id ? '✓ Active' : t.id}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Account Section */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <h2 className="card-title text-lg font-bold">Account</h2>
          </div>
          <p className="text-xs text-base-content/60">
            Your personal profile and credentials.
          </p>

          {user?.isLoggedIn ? (
            <div className="space-y-4 max-w-md pt-2">
              <div>
                <label className="text-xs font-medium text-base-content/70 block mb-1">
                  Name
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.name || ''}
                  className="input input-sm input-bordered w-full bg-base-200/60 text-xs text-base-content"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-base-content/70 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="input input-sm input-bordered w-full bg-base-200/60 text-xs text-base-content"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-outline btn-sm btn-error gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-base-200/50 rounded-xl border border-base-300 text-center space-y-3">
              <p className="text-sm text-base-content/70">
                You are currently not logged in.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Link to="/login" className="btn btn-sm btn-primary gap-1.5 font-medium">
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link to="/register" className="btn btn-sm btn-outline font-medium">
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Chat Section */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="card-title text-lg font-bold">Chat</h2>
          </div>
          <p className="text-xs text-base-content/60">
            Manage your AI conversations and local history data.
          </p>

          <div className="pt-2 flex items-center justify-between border-t border-base-200 mt-2">
            <div>
              <h4 className="text-sm font-semibold text-base-content">Clear Chat History</h4>
              <p className="text-xs text-base-content/50">
                Permanently delete all stored chats and messages from this device.
              </p>
            </div>
            <button
              onClick={handleClearChat}
              className="btn btn-sm btn-outline btn-error gap-1.5 font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
