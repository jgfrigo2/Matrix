
import React, { useState, useEffect } from 'react';
import ChatView from './components/ChatView';
import LiveView from './components/LiveView';
import { Header } from './components/Header';
import { BrainCircuitIcon, MicIcon } from './components/icons';
import MatrixBackground from './components/MatrixBackground';

type ViewMode = 'chat' | 'live';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  useEffect(() => {
    // This check runs once on component mount to verify the API key exists.
    // In a production environment like Netlify, `process.env.API_KEY` must be set.
    if (!process.env.API_KEY) {
      console.error("CRITICAL: API_KEY environment variable is not set.");
      setIsApiKeyMissing(true);
    }
  }, []);

  const getButtonClass = (mode: ViewMode) =>
    `flex items-center justify-center gap-2 px-4 py-2 border-2 rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${
      viewMode === mode
        ? 'bg-[#00FF41] text-black border-[#00FF41]'
        : 'bg-transparent text-[#00FF41] border-[#008F11] hover:bg-[#008F11] hover:text-black'
    }`;

  if (isApiKeyMissing) {
    return (
      <div className="min-h-screen w-full text-[#00FF41] flex flex-col relative">
        <MatrixBackground />
        <div className="min-h-screen w-full flex flex-col z-10 bg-black/90 backdrop-blur-sm items-center justify-center p-4">
          <div className="w-full max-w-4xl text-left border-2 border-red-500/50 p-6 md:p-8 rounded-lg shadow-[0_0_20px_rgba(255,80,80,0.4)] bg-black/50">
            <h1 className="text-2xl md:text-4xl font-bold text-red-500 mb-4 tracking-widest text-center">
              CONNECTION FAILED
            </h1>
            <p className="text-lg mb-3 text-center">
              The Oracle cannot be reached. The{' '}
              <code className="bg-[#0D0D0D] text-red-400 px-2 py-1 rounded border border-red-500/30">
                API_KEY
              </code>{' '}
              is not accessible to the application.
            </p>
            <p className="text-base text-gray-400 mb-6 text-center">
              This portal requires a secure connection to the Gemini mainframe. Even if you've set the API key in your hosting provider's settings, it may not be correctly exposed to the client-side code.
            </p>
            <div className="text-left bg-[#0D0D0D]/70 p-4 rounded border border-[#008F11]/50">
              <h2 className="text-xl font-bold mb-3 text-center">Troubleshooting Steps</h2>
              <ol className="list-decimal list-inside space-y-3 text-gray-300">
                <li>
                  <strong>Verify Environment Variable:</strong> In your hosting provider's settings (e.g., Netlify), ensure you have an environment variable named{' '}
                  <code className="bg-black p-1 rounded font-bold text-[#00FF41]">API_KEY</code> with your correct Google Gemini API key as the value.
                </li>
                <li>
                  <strong>Client-Side Access (Crucial Step):</strong> Frontend applications running in a browser cannot directly access server environment variables. Your build process must be configured to embed the key.
                  <ul className="list-disc list-inside mt-2 pl-4 text-gray-400 space-y-1">
                    <li>If you are using a tool like <strong>Vite</strong>, you typically need to prefix your variable with <code className="bg-black p-1 rounded">VITE_</code> (e.g., <code className="bg-black p-1 rounded">VITE_API_KEY</code>) in your Netlify settings and then access it via <code className="bg-black p-1 rounded">import.meta.env.VITE_API_KEY</code> in your code.</li>
                    <li>If you are using <strong>Create React App</strong>, the prefix is <code className="bg-black p-1 rounded">REACT_APP_</code>.</li>
                  </ul>
                  <div className="mt-3 p-3 rounded border border-yellow-400/30 bg-yellow-900/20">
                    <p className="text-yellow-300/90">
                      <span className="font-bold">Important Note:</span> This application is coded to specifically look for <code className="bg-black p-1 rounded font-bold text-[#00FF41]">process.env.API_KEY</code>. You will likely need to adjust your build configuration to make your environment variable available under this specific name. For example, with Vite, you could add a `define` property to your `vite.config.js` to replace `process.env.API_KEY` with your `import.meta.env.VITE_API_KEY`.
                    </p>
                  </div>
                </li>
                <li>
                  <strong>Redeploy:</strong> After confirming your environment variables and build configuration, you must <strong>redeploy</strong> your application for the changes to take effect.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full text-[#00FF41] flex flex-col relative"
    >
      <MatrixBackground />
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
          {viewMode === 'chat' ? <ChatView /> : <LiveView />}
        </main>
      </div>
    </div>
  );
};

export default App;
