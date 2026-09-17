import BookCard from './BookCard';
import { BookOpen } from 'lucide-react';

export default function BookGrid({ books, emptyMessage = 'No books found', emptyAction }) {
  if (!books || books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-base-200/50 rounded-box border border-dashed border-base-300">
        <div className="w-14 h-14 rounded-full bg-base-300 flex items-center justify-center text-base-content/50 mb-3">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-base-content">{emptyMessage}</h3>
        <p className="text-sm text-base-content/60 max-w-sm mt-1 mb-4">
          Try adjusting your search criteria or explore other genres in the catalog.
        </p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}

