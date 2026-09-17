import { Sparkles, User } from 'lucide-react';
import BookCard from './BookCard';

export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';

  return (
    <div className={`chat ${isUser ? 'chat-end' : 'chat-start'} my-3 max-w-4xl mx-auto w-full px-2 sm:px-4`}>
      <div className="chat-image avatar">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
          isUser ? 'bg-primary text-primary-content' : 'bg-secondary text-secondary-content'
        }`}>
          {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>
      </div>

      <div className="chat-header text-xs opacity-70 mb-1 flex items-center gap-1.5 font-medium">
        <span>{isUser ? 'You' : 'Alistair'}</span>
        <time className="text-[10px] opacity-50">{message.timestamp}</time>
      </div>

      <div
        className={`chat-bubble text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'chat-bubble-primary'
            : 'bg-base-200 text-base-content border border-base-300'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>

        {/* Attached Book Cards */}
        {message.books && message.books.length > 0 && (
          <div className="mt-3 pt-3 border-t border-base-300/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {message.books.map((book) => (
              <BookCard key={book.id} book={book} compact={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

