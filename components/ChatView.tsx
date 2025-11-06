import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../types';
import Message from './Message';
import { SendIcon } from './icons';
import { createChatSession } from '../services/geminiService';
import type { Chat } from '@google/genai';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isThinkingMode, setIsThinkingMode] = useState<boolean>(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    // Reset chat session when thinking mode changes
    chatSessionRef.current = null;
    setMessages([]);
  }, [isThinkingMode]);


  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession(isThinkingMode);
      }
      
      // Fix: The sendMessage method expects an object with a `message` property.
      const result = await chatSessionRef.current.sendMessage({ message: input });
      const modelMessage: ChatMessage = { role: 'model', text: result.text };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error('Gemini API error:', error);
      const errorMessage: ChatMessage = { role: 'model', text: 'Error: Connection to the Matrix failed. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isThinkingMode]);
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-end p-2 border-b-2 border-[#008F11] mb-4">
            <label className="flex items-center cursor-pointer">
                <span className="mr-3 text-sm font-medium">Thinking Mode</span>
                <div className="relative">
                    <input type="checkbox" checked={isThinkingMode} onChange={() => setIsThinkingMode(!isThinkingMode)} className="sr-only" />
                    <div className="block bg-[#0D0D0D] border-2 border-[#008F11] w-14 h-8 rounded-full"></div>
                    <div className={`dot absolute left-1 top-1 bg-[#008F11] w-6 h-6 rounded-full transition-transform ${isThinkingMode ? 'translate-x-6 bg-[#00FF41]' : ''}`}></div>
                </div>
            </label>
        </div>
      <div className="flex-grow overflow-y-auto pr-2 matrix-scrollbar">
        {messages.map((msg, index) => (
          <Message key={index} message={msg} />
        ))}
        {isLoading && (
            <div className="flex justify-start w-full max-w-2xl mx-auto mb-4">
                <div className="p-4 rounded-lg bg-[#0D0D0D] max-w-[90%]">
                    <p className="text-xs font-bold mb-2 text-[#00FF41]">ORACLE</p>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#00FF41] rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-[#00FF41] rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-[#00FF41] rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4 pt-4 border-t-2 border-[#008F11]">
        <div className="relative flex items-center bg-[#0D0D0D] border-2 border-[#008F11] rounded-lg">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Follow the white rabbit..."
            className="w-full bg-transparent p-3 pr-12 text-[#00FF41] focus:outline-none resize-none"
            rows={1}
            style={{ maxHeight: '100px' }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-[#008F11]"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;