import React from 'react';

const ChatBubble = ({ message, isOwnMessage }) => {
  // Handle System/Verification Messages
  if (message.text && message.text.includes("SYSTEM:")) {
    return (
      <div className="flex justify-center my-6">
        <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">
          {message.text.replace("SYSTEM:", "").trim()}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[75%] px-5 py-3 rounded-[1.5rem] shadow-sm text-sm font-medium leading-relaxed
        ${isOwnMessage 
          ? 'bg-[#c4a456] text-white rounded-tr-none shadow-amber-100' 
          : 'bg-white text-[#0f2a29] border border-slate-100 rounded-tl-none'
        }`}
      >
        <p>{message.text}</p>
        <span className={`text-[9px] block mt-1 opacity-70 uppercase font-black tracking-tighter
          ${isOwnMessage ? 'text-white' : 'text-slate-400'}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatBubble;