import { useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';

export default function Chat() {
  const { currentSession, sendMessage } = useApp();
  const messagesEndRef = useRef(null);

  const messages = currentSession?.messages ?? [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = (text) => {
    sendMessage(text);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative justify-between">
      {messages.length > 0 && (
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
        />
      </div>
    </div>
  );
}

