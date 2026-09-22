import { Link } from 'react-router-dom';
import { Palette, User, Sparkles, LogOut, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { theme, setTheme, user, logout } = useApp();

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

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
          Settings
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          Kelola preferensi tema, akun, dan informasi aplikasi Alistair.
        </p>
      </div>

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

      {/* 3. About Alistair Section */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="card-title text-lg font-bold">Tentang Alistair</h2>
          </div>
          <p className="text-xs text-base-content/60">
            Asisten AI kurasi dan katalog bacaan literatur Anda.
          </p>

          <div className="p-4 rounded-xl bg-base-200/50 border border-base-300 space-y-3">
            <p className="text-xs sm:text-sm text-base-content/80 leading-relaxed">
              <strong className="text-base-content font-semibold">Alistair</strong> adalah asisten pintar dan kurator bacaan yang dirancang untuk membantu Anda menemukan, menjelajahi, dan mendapatkan rekomendasi mendalam seputar <span className="text-primary font-medium">Manga, Manhwa, Manhua, Novel, dan Komik</span> favorit.
            </p>
            <p className="text-xs sm:text-sm text-base-content/80 leading-relaxed">
              Didukung oleh teknologi <span className="text-primary font-medium">Retrieval-Augmented Generation (RAG)</span> dan katalog puluhan ribu buku, Alistair mampu memahami preferensi alur cerita, tema, karakter, serta memberikan saran bacaan terbaik secara instan dan personal.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-base-300/60">
              <div className="flex items-center justify-between p-2 rounded-lg bg-base-100 border border-base-300/50 text-xs">
                <span className="text-base-content/60">Versi Aplikasi</span>
                <span className="badge badge-sm badge-primary font-mono">v1.0.0</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-base-100 border border-base-300/50 text-xs">
                <span className="text-base-content/60">AI Engine</span>
                <span className="badge badge-sm badge-neutral font-medium">Hybrid RAG</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

