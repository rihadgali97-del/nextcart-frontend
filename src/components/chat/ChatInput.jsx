import React, { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import '../../styles/components/chat.css';

const ChatInput = ({ onSendMessage }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input">
      <button type="button" className="chat-input__attachment">
        <Paperclip size={20} />
      </button>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="chat-input__field"
      />
      <button 
        type="submit" 
        className="chat-input__send"
      >
        <Send size={18} fill="currentColor" />
      </button>
    </form>
  );
};

export default ChatInput;
