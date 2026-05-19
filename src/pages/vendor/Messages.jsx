import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Search, User, ShieldCheck, Star, AlertTriangle, Fingerprint, Lock } from 'lucide-react';
import ChatBubble from '../../components/chat/ChatBubble';
import ChatInput from '../../components/chat/ChatInput';

// Note: In production, move this to an environment variable
const socket = io('http://localhost:5000');

const Messages = ({ currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState({
    id: 'customer_789', // Mock ID - Replace with real user ID from your inbox list
    name: 'Abebe Bikila',
    trustScore: 45, // Trigger for the Alert Bar
    rank: 'Starter'
  }); 
  const scrollRef = useRef();

  useEffect(() => {
    if (currentUser?.id) {
      // Join the private socket room
      socket.emit('join_chat', currentUser.id);

      // Listen for incoming messages
      socket.on('receive_message', (msg) => {
        setMessages(prev => [...prev, msg]);
      });
    }

    return () => {
      socket.off('receive_message');
    };
  }, [currentUser]);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text) => {
    const data = { 
        senderId: currentUser.id, 
        receiverId: activeChat?.id, 
        text,
        createdAt: new Date()
    };

    // Emit to backend
    socket.emit('send_message', data);

    // Optimistic UI update (shows message immediately)
    setMessages(prev => [...prev, { ...data, sender: currentUser.id }]);
  };

  const handleRequestVerification = () => {
    const systemMsg = {
        senderId: currentUser.id,
        receiverId: activeChat.id,
        text: "SYSTEM: 🛡️ The vendor has requested an Identity Verification to proceed.",
        createdAt: new Date()
    };
    socket.emit('send_message', systemMsg);
    setMessages(prev => [...prev, { ...systemMsg, sender: currentUser.id }]);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      
      {/* Sidebar: Conversation List */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-6">
          <h2 className="text-xl font-black text-[#0f2a29] mb-4">Inbox</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-[#c4a456]" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {/* Active Contact Item */}
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-[#c4a456]/20 flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center text-[#c4a456] border-2 border-white shadow-sm">
                <User size={22} />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="font-black text-sm text-[#0f2a29] truncate">{activeChat.name}</p>
                <span className="text-[10px] font-black text-[#c4a456] bg-[#c4a456]/10 px-2 py-0.5 rounded-full">
                  {activeChat.trustScore}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold truncate">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        
        {/* Professional Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#0f2a29] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#0f2a29]/20">
              <Fingerprint size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-[#0f2a29]">{activeChat.name}</h3>
                {activeChat.trustScore >= 60 && (
                    <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-md border border-green-100">
                        <Star size={10} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase">Trusted</span>
                    </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Identity Check • Trust Score: {activeChat.trustScore}%</p>
            </div>
          </div>
          <Lock size={18} className="text-slate-200" />
        </div>

        {/* TRUST ALERT BAR (Appears for low-score users) */}
        {activeChat.trustScore < 60 && (
          <div className="mx-8 mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-amber-900">Low Trust Score Detected</p>
                <p className="text-[10px] text-amber-700 font-bold">Recommended: Request ID verification before trading.</p>
              </div>
            </div>
            <button 
              onClick={handleRequestVerification}
              className="flex items-center gap-2 px-4 py-2 bg-[#0f2a29] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#c4a456] transition-all shadow-md active:scale-95"
            >
              <ShieldCheck size={14} />
              Request Verification
            </button>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-8 space-y-2 bg-[#fcfcfc]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
              <ShieldCheck size={48} className="mb-2 text-[#0f2a29]" />
              <p className="font-black text-sm text-[#0f2a29]">Verified Peer-to-Peer Session</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <ChatBubble 
                key={i} 
                message={msg} 
                isOwnMessage={msg.sender === currentUser?.id || msg.senderId === currentUser?.id} 
              />
            ))
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Bar */}
        <ChatInput onSendMessage={handleSend} />
      </div>
    </div>
  );
};

export default Messages;