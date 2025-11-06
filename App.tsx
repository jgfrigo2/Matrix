
import React, { useState } from 'react';
import ChatView from './components/ChatView';
import LiveView from './components/LiveView';
import { Header } from './components/Header';
import { BrainCircuitIcon, MicIcon } from './components/icons';

type ViewMode = 'chat' | 'live';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('chat');

  const getButtonClass = (mode: ViewMode) =>
    `flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
      viewMode === mode
        ? 'bg-[#00FF41] text-black border-[#00FF41]'
        : 'bg-transparent text-[#00FF41] border-[#008F11] hover:bg-[#008F11] hover:text-black'
    }`;

  return (
    <div 
      className="min-h-screen w-full bg-black text-[#00FF41] font-mono flex flex-col"
      style={{
        backgroundImage: 'radial-gradient(rgba(0, 143, 17, 0.15) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      <Header />
      <div className="flex justify-center p-4 border-b-2 border-[#008F11]">
        <div className="flex space-x-4">
          <button onClick={() => setViewMode('chat')} className={getButtonClass('chat')}>
            <BrainCircuitIcon className="h-5 w-5" />
            <span>Text Query</span>
          </button>
          <button onClick={() => setViewMode('live')} className={getButtonClass('live')}>
            <MicIcon className="h-5 w-5" />
            <span>Live Conversation</span>
          </button>
        </div>
      </div>
      <main className="flex-grow flex flex-col p-4 md:p-6 overflow-hidden">
        {viewMode === 'chat' ? <ChatView /> : <LiveView />}
      </main>
    </div>
  );
};

export default App;
