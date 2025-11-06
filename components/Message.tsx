
import React from 'react';
import type { ChatMessage } from '../types';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUserModel = message.role === 'user';
  const messageClass = isUserModel
    ? 'bg-transparent border-2 border-[#008F11] self-end'
    : 'bg-[#0D0D0D] self-start';
    
  const roleLabel = isUserModel ? 'YOU' : 'ORACLE';

  return (
    <div className={`w-full max-w-2xl mx-auto flex ${isUserModel ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`p-4 rounded-lg w-fit max-w-[90%] md:max-w-[80%] ${messageClass}`}
      >
        <p className={`text-xs font-bold mb-2 ${isUserModel ? 'text-[#008F11]' : 'text-[#00FF41]'}`}>{roleLabel}</p>
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
      </div>
    </div>
  );
};

export default Message;
