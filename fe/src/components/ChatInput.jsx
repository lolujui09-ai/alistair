import { useState, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ChatInput({ onSendMessage, disabled = false }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || disabled) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-4">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end bg-base-200 border border-base-300 rounded-2xl shadow-sm focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all p-1.5"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Alistair sedang menyiapkan jawaban..." : "Tanyakan rekomendasi atau apapun ke Alistair..."}
          disabled={disabled}
          className="w-full resize-none bg-transparent px-3 py-2 text-sm text-base-content placeholder:text-base-content/40 focus:outline-none max-h-40 min-h-[42px]"
        />

        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className={`btn btn-circle btn-sm shrink-0 mb-1 mr-1 transition-all ${
            input.trim() && !disabled
              ? 'btn-primary shadow-sm'
              : 'btn-disabled opacity-40 bg-base-300 text-base-content/40 border-none'
          }`}
          aria-label="Send message"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

