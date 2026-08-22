import React from 'react';
import '../../styles/components/chat.css';

const ChatBubble = ({ message, isOwnMessage }) => {
  // Handle System/Verification Messages
  if (message.text && message.text.includes("SYSTEM:")) {
    return (
      <div className="chat-system-message">
        <div className="chat-system-message__label">
          {message.text.replace("SYSTEM:", "").trim()}
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-message ${isOwnMessage ? 'chat-message--own' : 'chat-message--other'}`}>
      <div className={`chat-message__bubble ${isOwnMessage ? 'chat-message__bubble--own' : 'chat-message__bubble--other'}`}
      >
        <p>{message.text}</p>
        <span className={`chat-message__time ${isOwnMessage ? '' : 'chat-message__time--other'}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatBubble;
