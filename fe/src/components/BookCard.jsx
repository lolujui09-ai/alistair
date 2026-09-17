import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80';

export default function BookCard({ book, compact = false }) {
  const { isBookmarked, toggleBookmark, user } = useApp();
  const bookmarked = isBookmarked(book.id);

  const coverSrc = book.cover_url || book.cover || DEFAULT_COVER;

  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = DEFAULT_COVER;
  };

  if (compact) {
    return (
      <div className="card card-side bg-base-200/80 border border-base-300 shadow-sm hover:border-primary/40 transition-all rounded-box max-w-sm overflow-hidden">
        <figure className="w-24 shrink-0 bg-base-300">
          <img
            src={coverSrc}
            alt={book.title}
            onError={handleImageError}
            className="w-full h-full object-cover aspect-[3/4]"
            loading="lazy"
          />
        </figure>
        <div className="card-body p-3 justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="badge badge-xs badge-neutral text-[10px]">{book.type || book.format || 'Book'}</span>
              <span className="text-[11px] text-base-content/70 truncate">{book.author}</span>
            </div>
            <h4 className="font-semibold text-sm line-clamp-1 text-base-content" title={book.title}>
              {book.title}
            </h4>
            <p className="text-xs text-base-content/60 line-clamp-1 mt-0.5">{book.genre}</p>
          </div>
          <div className="card-actions justify-between items-center mt-2">
            <Link
              to={`/books/${book.id}`}
              className="btn btn-xs btn-primary gap-1 font-medium"
            >
              <span>View Book</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            {/* Tombol bookmark hanya muncul jika pengguna sudah login */}
            {user?.isLoggedIn && (
              <button
                type="button"
                onClick={() => toggleBookmark(book.id)}
                className={`btn btn-circle btn-xs btn-ghost ${bookmarked ? 'text-primary' : 'text-base-content/50'}`}
                title={bookmarked ? 'Remove from library' : 'Save to library'}
              >
                {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group overflow-hidden">
      <figure className="relative bg-base-300 aspect-[3/4] overflow-hidden">
        <img
          src={coverSrc}
          alt={book.title}
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Tombol bookmark hanya muncul jika pengguna sudah login */}
        {user?.isLoggedIn && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleBookmark(book.id);
            }}
            className={`btn btn-circle btn-sm absolute top-2 right-2 backdrop-blur-md transition-colors ${
              bookmarked
                ? 'btn-primary text-primary-content'
                : 'bg-base-100/70 text-base-content hover:bg-base-100'
            }`}
            title={bookmarked ? 'Saved to library' : 'Add to library'}
          >
            {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        )}

        <span className="badge badge-sm badge-neutral absolute bottom-2 left-2 backdrop-blur-md bg-neutral/80">
          {book.type || book.format || 'Book'}
        </span>
      </figure>

      <div className="card-body p-4 flex flex-col justify-between">
        <div>
          <p className="text-xs font-medium text-base-content/60 truncate mb-1">{book.author}</p>
          <h3 className="card-title text-base font-bold line-clamp-1 group-hover:text-primary transition-colors">
            <Link to={`/books/${book.id}`}>{book.title}</Link>
          </h3>
          <p className="text-xs text-base-content/70 mt-1 line-clamp-1">{book.genre}</p>
        </div>

        <div className="card-actions mt-3 pt-2 border-t border-base-200 flex items-center justify-end">
          <Link
            to={`/books/${book.id}`}
            className="btn btn-sm btn-ghost gap-1 text-primary hover:bg-primary/10 font-medium px-2"
          >
            <span>View Book</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
