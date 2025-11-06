
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center p-4 border-b-2 border-[#008F11] shadow-[0_0_15px_rgba(0,255,65,0.5)]">
      <h1 className="text-2xl md:text-4xl font-bold tracking-widest text-shadow-[0_0_10px_#00FF41]">
        M A T R I X : AI PORTAL
      </h1>
      <p className="text-sm text-[#008F11] mt-1">Accessing Nebuchadnezzar Mainframe...</p>
    </header>
  );
};
