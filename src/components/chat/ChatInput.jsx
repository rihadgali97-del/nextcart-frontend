import React, { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';

const ChatInput = ({ onSendMessage }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
      <button type="button" className="p-3 text-slate-400 hover:text-[#c4a456] transition-colors">
        <Paperclip size={20} />
      </button>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 bg-slate-50 border border-transparent focus:border-[#c4a456] rounded-2xl px-5 py-3 outline-none font-bold text-sm transition-all"
      />
      <button 
        type="submit" 
        className="bg-[#0f2a29] hover:bg-[#c4a456] text-white p-3.5 rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-95"
      >
        <Send size={18} fill="currentColor" />
      </button>
    </form>
  );
};

export default ChatInput;