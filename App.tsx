
import React, { useState, useEffect } from 'react';
import ChatView from './components/ChatView';
import LiveView from './components/LiveView';
import { Header } from './components/Header';
import { BrainCircuitIcon, MicIcon } from './components/icons';
import MatrixBackground from './components/MatrixBackground';

// Add this for typescript to recognize the aistudio object on the window
// Fix: Defined and used a named `AIStudio` interface to resolve TypeScript declaration errors.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}
declare global {
  interface Window {
    aistudio?: AIStudio;
  }
}

type ViewMode = 'chat' | 'live';
type ApiKeyState = 'checking' | 'ready' | 'needs_selection';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [apiKeyState, setApiKeyState] = useState<ApiKeyState>('checking');

  useEffect(() => {
    const checkApiKey = async () => {
      // First, check for the environment variable.
      if (process.env.API_KEY) {
        setApiKeyState('ready');
        return;
      }
      // If not found, check if a key has been selected via the aistudio dialog.
      if (window.aistudio && (await window.aistudio.hasSelectedApiKey())) {
        setApiKeyState('ready');
      } else {
        // If no key is available, prompt the user to select one.
        setApiKeyState('needs_selection');
      }
    };
    checkApiKey();
  }, []);
  
  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Optimistically set to ready to re-render the app. The new key will be
      // picked up by new GoogleGenAI instances.
      setApiKeyState('ready');
    }
  };

  const handleApiKeyError = () => {
    // This is called by child components if an API call fails due to an invalid key.
    // It forces the user to re-select a key.
    setApiKeyState('needs_selection');
  };

  const getButtonClass = (mode: ViewMode) =>
    `flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
      viewMode === mode
        ? 'bg-[#00FF41] text-black border-[#00FF41]'
        : 'bg-transparent text-[#00FF41] border-[#008F11] hover:bg-[#008F11] hover:text-black'
    }`;

  const renderContent = () => {
    switch (apiKeyState) {
      case 'checking':
        return (
          <div className="min-h-screen w-full flex flex-col z-10 bg-black/90 backdrop-blur-sm items-center justify-center p-4">
             <h1 className="text-2xl md:text-4xl font-bold text-[#00FF41] tracking-widest animate-pulse">
               INITIALIZING CONNECTION...
             </h1>
          </div>
        );
      case 'needs_selection':
        return (
           <div className="min-h-screen w-full flex flex-col z-10 bg-black/90 backdrop-blur-sm items-center justify-center p-4">
            <div className="w-full max-w-2xl text-center border-2 border-[#00FF41]/50 p-6 md:p-8 rounded-lg shadow-[0_0_20px_rgba(0,255,65,0.4)] bg-black/50">
              <h1 className="text-2xl md:text-4xl font-bold text-[#00FF41] mb-4 tracking-widest">
                MAINFRAME ACCESS REQUIRED
              </h1>
              <p className="text-lg mb-4">
                This portal requires a secure API key to connect to the Gemini mainframe.
              </p>
              <p className="text-base text-gray-400 mb-6">
                Please select a valid Google AI Studio API key to proceed. Ensure billing is enabled for the associated Google Cloud project.
              </p>
              <button
                onClick={handleSelectKey}
                className="w-full max-w-xs mx-auto bg-[#00FF41] text-black font-bold py-3 px-6 rounded-lg text-lg tracking-wider border-2 border-[#00FF41] hover:bg-transparent hover:text-[#00FF41] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/50"
              >
                SELECT API KEY
              </button>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block mt-4 text-sm text-[#008F11] hover:text-[#00FF41] underline"
              >
                Learn more about billing requirements
              </a>
            </div>
          </div>
        );
      case 'ready':
        return (
          <div className="min-h-screen w-full flex flex-col z-10 bg-black/80 backdrop-blur-[1px]">
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
              {viewMode === 'chat' ? <ChatView onApiKeyError={handleApiKeyError} /> : <LiveView onApiKeyError={handleApiKeyError} />}
            </main>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-full text-[#00FF41] flex flex-col relative">
      <MatrixBackground />
      {renderContent()}
    </div>
  );
};

export default App;
