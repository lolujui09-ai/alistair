import { Link } from 'react-router-dom';
import { LogIn, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoginPromptModal() {
  const { isLoginModalOpen, closeLoginModal } = useApp();

  if (!isLoginModalOpen) return null;

  return (
    <dialog className="modal modal-open select-none z-50">
      <div className="modal-box max-w-sm p-6 text-center shadow-2xl border border-base-300 relative bg-base-100">
        <button
          type="button"
          onClick={closeLoginModal}
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 text-base-content/60 hover:text-base-content"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3 shadow-inner">
          <Sparkles className="w-7 h-7" />
        </div>

        <h3 className="font-bold text-lg text-base-content">
          Silakan Login Dahulu
        </h3>
        <p className="text-xs text-base-content/60 mt-1.5 leading-relaxed">
          Fitur chat dan rekomendasi AI membutuhkan akun agar riwayat percakapan Anda dapat tersimpan dengan aman.
        </p>

        <div className="flex flex-col gap-2 pt-4">
          <Link
            to="/login"
            state={{ from: '/chat' }}
            onClick={closeLoginModal}
            className="btn btn-primary btn-sm w-full gap-2 font-medium shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Login ke Akun</span>
          </Link>
          <Link
            to="/register"
            onClick={closeLoginModal}
            className="btn btn-ghost btn-sm w-full text-xs text-base-content/70 hover:text-base-content"
          >
            Belum punya akun? Buat akun baru
          </Link>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={closeLoginModal}>
        <button type="button">close</button>
      </form>
    </dialog>
  );
}

