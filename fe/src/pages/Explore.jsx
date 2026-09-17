import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, RotateCcw, AlertCircle } from 'lucide-react';
import BookGrid from '../components/BookGrid';
import { fetchBooks, fetchBookFilters } from '../services/books';

const DEFAULT_GENRES = [
  'All',
  'Romance',
  'Drama',
  'Fantasy',
  'Comedy',
  'Action',
  'School Life',
  'Slice of Life',
  'Shounen',
  'Shoujo',
  'Seinen',
  'Supernatural',
  'Adventure',
  'Mystery',
  'Sci Fi',
  'Isekai',
];

const DEFAULT_TYPES = [
  'All',
  'Manga',
  'Manhwa',
  'Manhua',
  'Comic',
  'Webtoon',
  'Graphic Novel',
  'Doujinshi',
];

export default function Explore() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Dynamic filter options
  const [availableTypes, setAvailableTypes] = useState(DEFAULT_TYPES);
  const [availableGenres, setAvailableGenres] = useState(DEFAULT_GENRES);

  // Load available filter options on mount
  useEffect(() => {
    async function loadFilters() {
      try {
        const res = await fetchBookFilters();
        if (res.success && res.data) {
          if (res.data.types?.length) {
            setAvailableTypes(['All', ...res.data.types]);
          }
          if (res.data.genres?.length) {
            setAvailableGenres(['All', ...res.data.genres]);
          }
        }
      } catch (err) {
        console.warn('Failed to load dynamic filters, using default:', err);
      }
    }
    loadFilters();
  }, []);

  // Debounce search input (350ms) to avoid spamming the backend
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset ke halaman 1 saat pencarian berubah
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset ke halaman 1 saat genre atau tipe berubah
  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
    setPage(1);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setPage(1);
  };

  const [reloadKey, setReloadKey] = useState(0);

  // Fetch data dari backend
  useEffect(() => {
    let isSubscribed = true;

    async function loadCatalog() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchBooks({
          page,
          limit: 24,
          search: debouncedSearch,
          genre: selectedGenre,
          type: selectedType,
        });

        if (isSubscribed && res.success) {
          setBooks(res.data);
          setPagination(res.pagination);
        }
      } catch (err) {
        if (isSubscribed) {
          console.error('Error loading books:', err);
          setError(err.message || 'Gagal memuat katalog buku');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      isSubscribed = false;
    };
  }, [page, debouncedSearch, selectedGenre, selectedType, reloadKey]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedGenre('All');
    setSelectedType('All');
    setPage(1);
  };

  // Hitung range tampilan saat ini
  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.total, pagination.page * pagination.limit);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
          Explore Catalog
        </h1>
        <p className="text-sm text-base-content/60 mt-1">
          Jelajahi lebih dari {pagination.total > 0 ? pagination.total.toLocaleString('id-ID') : '80.000'} judul manga, manhwa, komik, dan novel pilihan.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-base-200/60 p-3 rounded-2xl border border-base-300">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul buku, manga, manhwa, penulis..."
            className="input input-sm input-bordered w-full pl-9 bg-base-100 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Genre select */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-base-content/60 font-medium">Genre:</span>
            <select
              value={selectedGenre}
              onChange={(e) => handleGenreChange(e.target.value)}
              className="select select-sm select-bordered bg-base-100 text-xs font-normal"
            >
              {availableGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Type select */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-base-content/60 font-medium">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="select select-sm select-bordered bg-base-100 text-xs font-normal capitalize"
            >
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Stats */}
      <div className="flex items-center justify-between text-xs text-base-content/60 px-1">
        <span>
          {loading ? (
            'Memuat katalog...'
          ) : pagination.total > 0 ? (
            <>
              Menampilkan <span className="font-semibold text-base-content">{startItem} - {endItem}</span> dari{' '}
              <span className="font-semibold text-base-content">{pagination.total.toLocaleString('id-ID')}</span> judul
            </>
          ) : (
            'Tidak ada buku yang ditemukan'
          )}
        </span>

        {(searchQuery || selectedGenre !== 'All' || selectedType !== 'All') && (
          <button
            onClick={handleResetFilters}
            className="btn btn-ghost btn-xs text-primary gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-error shadow-sm text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <span>{error}</span>
          </div>
          <button onClick={() => setReloadKey((k) => k + 1)} className="btn btn-xs btn-outline">
            Coba Lagi
          </button>
        </div>
      )}

      {/* Catalog Grid or Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="card bg-base-100 border border-base-300 overflow-hidden shadow-sm"
            >
              <div className="skeleton aspect-[3/4] w-full rounded-none"></div>
              <div className="p-3 space-y-2">
                <div className="skeleton h-3 w-1/2"></div>
                <div className="skeleton h-4 w-4/5"></div>
                <div className="skeleton h-3 w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <BookGrid
          books={books}
          emptyMessage="Tidak ada buku yang cocok"
          emptyAction={
            <button onClick={handleResetFilters} className="btn btn-sm btn-primary">
              Clear Filters
            </button>
          }
        />
      )}

      {/* Pagination using DaisyUI */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-base-300/60">
          <span className="text-xs text-base-content/60">
            Halaman {pagination.page} dari {pagination.totalPages.toLocaleString('id-ID')}
          </span>

          <div className="join shadow-sm">
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={!pagination.hasPrevPage}
              className="join-item btn btn-sm btn-outline"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span>Sebelumnya</span>
            </button>

            {/* Quick Page Jump / Indicator */}
            <button className="join-item btn btn-sm btn-outline no-animation pointer-events-none font-medium">
              {pagination.page}
            </button>

            <button
              onClick={() => {
                setPage((p) => Math.min(pagination.totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={!pagination.hasNextPage}
              className="join-item btn btn-sm btn-outline"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
