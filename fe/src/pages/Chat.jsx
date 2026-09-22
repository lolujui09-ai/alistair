import { useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';

export default function Chat() {
  const { currentSession, sendMessage, user, isAiResponding } = useApp();
  const messagesEndRef = useRef(null);

  const messages = currentSession?.messages ?? [];
  const latestMessageText = messages[messages.length - 1]?.text;

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (user?.isLoggedIn) {
      scrollToBottom('smooth');
    }
  }, [messages.length, latestMessageText, user?.isLoggedIn]);

  if (!user?.isLoggedIn) {
    return <Navigate to="/explore" replace />;
  }

  const handleSendMessage = (text) => {
    sendMessage(text);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative justify-between">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary mb-4 shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-base-content mb-2">Alistair Siap Membantu</h2>
          <p className="text-sm text-base-content/60 leading-relaxed">
            Tanyakan rekomendasi manga, manhwa, novel, atau diskusikan alur dan cerita favoritmu. Jawaban akan langsung dikurasi secara interaktif!
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      )}

      {/* Persistent Bottom Chat Input */}
      <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-base-100 via-base-100/90 to-transparent pt-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isAiResponding}
        />
      </div>
    </div>
  );
}

