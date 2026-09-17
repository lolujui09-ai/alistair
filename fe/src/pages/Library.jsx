import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Compass, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BookGrid from '../components/BookGrid';
import { fetchBooks } from '../services/books';

export default function Library() {
  const { bookmarks, user } = useApp();
  const [bookmarkedBooks, setBookmarkedBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadBookmarkedBooks() {
      if (!user?.isLoggedIn || !bookmarks || bookmarks.length === 0) {
        setBookmarkedBooks([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetchBooks({
          ids: bookmarks,
          limit: 100,
        });

        if (res.success && res.data) {
          setBookmarkedBooks(res.data);
        }
      } catch (err) {
        console.error('Failed to load bookmarked books:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBookmarkedBooks();
  }, [bookmarks, user?.isLoggedIn]);

  // If not logged in
  if (!user?.isLoggedIn) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto space-y-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
          <Bookmark className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-base-content">Sign in to view your Library</h2>
        <p className="text-sm text-base-content/60">
          Simpan komik, novel, dan bacaan favoritmu untuk diakses kapan saja dengan masuk ke akun Alistair.
        </p>
        <Link to="/login" className="btn btn-sm btn-primary gap-2">
          <LogIn className="w-4 h-4" />
          <span>Login to Alistair</span>
        </Link>
      </div>
    );
  }

  // Filter bookmarked books that are still in bookmarks state
  const displayedBooks = bookmarkedBooks.filter((b) => bookmarks.includes(b.id));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Bookmark className="w-5 h-5 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
            My Library
          </h1>
        </div>
        <p className="text-sm text-base-content/60">
          Koleksi buku dan manhwa yang telah kamu simpan ({displayedBooks.length} judul).
        </p>
      </div>

      <div className="divider my-1 opacity-50"></div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="card bg-base-100 border border-base-300 overflow-hidden shadow-sm"
            >
              <div className="skeleton aspect-[3/4] w-full rounded-none"></div>
              <div className="p-3 space-y-2">
                <div className="skeleton h-3 w-1/2"></div>
                <div className="skeleton h-4 w-4/5"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <BookGrid
          books={displayedBooks}
          emptyMessage="Perpustakaanmu masih kosong"
          emptyAction={
            <Link to="/explore" className="btn btn-sm btn-primary gap-2">
              <Compass className="w-4 h-4" />
              <span>Jelajahi Katalog</span>
            </Link>
          }
        />
      )}
    </div>
  );
}
