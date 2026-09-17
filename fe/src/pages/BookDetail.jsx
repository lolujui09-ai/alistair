import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchBookById } from '../services/books';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark, sendMessage, user } = useApp();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBook() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchBookById(id);
        if (res.success && res.data) {
          setBook(res.data);
        } else {
          setError('Buku tidak ditemukan.');
        }
      } catch (err) {
        console.error('Error fetching book detail:', err);
        setError(err.message || 'Gagal memuat detail buku');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadBook();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="skeleton h-8 w-24"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="skeleton aspect-[3/4] w-full rounded-2xl"></div>
            <div className="skeleton h-10 w-full rounded-lg"></div>
            <div className="skeleton h-10 w-full rounded-lg"></div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="skeleton h-6 w-1/3"></div>
            <div className="skeleton h-10 w-3/4"></div>
            <div className="skeleton h-4 w-1/2"></div>
            <div className="divider my-4"></div>
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-2">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-base-content">Buku tidak ditemukan</h2>
        <p className="text-sm text-base-content/60">
          {error || 'Buku yang kamu cari tidak ditemukan atau telah dihapus dari katalog.'}
        </p>
        <button onClick={() => navigate('/explore')} className="btn btn-sm btn-primary">
          Kembali ke Explore
        </button>
      </div>
    );
  }

  const bookmarked = isBookmarked(book.id);
  const coverSrc = book.cover_url || book.cover || DEFAULT_COVER;

  const handleAskAlistair = () => {
    sendMessage(`Bisa berikan analisis dan review mendalam mengenai ${book.title} karya ${book.author}?`, book);
    navigate('/');
  };

  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = DEFAULT_COVER;
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-sm btn-ghost gap-2 text-base-content/70 hover:text-base-content -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
      </div>

      {/* Main Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Cover & Primary Actions */}
        <div className="space-y-4">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-base-300 bg-base-200">
            <img
              src={coverSrc}
              alt={book.title}
              onError={handleImageError}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Tombol Bookmark / Add to Library hanya muncul jika user sudah login */}
            {user?.isLoggedIn && (
              <button
                type="button"
                onClick={() => toggleBookmark(book.id)}
                className={`btn btn-sm w-full gap-2 transition-all ${
                  bookmarked
                    ? 'btn-primary'
                    : 'btn-outline border-base-300 hover:border-primary'
                }`}
              >
                {bookmarked ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    <span>Tersimpan di Library</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Simpan ke Library</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleAskAlistair}
              className="btn btn-sm btn-secondary w-full gap-2 font-medium"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tanya Alistair tentang ini</span>
            </button>
          </div>
        </div>

        {/* Right Column: Information & Description */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="badge badge-neutral text-xs font-semibold uppercase tracking-wider">
                {book.type || book.format || 'Book'}
              </span>
              {book.genre && (
                <span className="badge badge-outline text-xs">
                  {book.genre}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-base-content">{book.title}</h1>
            <p className="text-base font-medium text-base-content/70 mt-1">
              Oleh <span className="text-base-content">{book.author}</span>
            </p>
          </div>

          <div className="divider my-2"></div>

          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-base-content">Sinopsis / Deskripsi</h2>
            <p className="text-sm sm:text-base leading-relaxed text-base-content/80 whitespace-pre-line">
              {book.description || 'Tidak ada deskripsi yang tersedia untuk buku ini.'}
            </p>
          </div>

          {/* Metadata quick stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-base-200/50 rounded-xl border border-base-300">
            <div>
              <span className="text-xs text-base-content/50 block">ID Buku</span>
              <span className="text-sm font-semibold text-base-content">#{book.id}</span>
            </div>
            <div>
              <span className="text-xs text-base-content/50 block">Kategori</span>
              <span className="text-sm font-semibold text-base-content capitalize">{book.type || 'Manga'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
