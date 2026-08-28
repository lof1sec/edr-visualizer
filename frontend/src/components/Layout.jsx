import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

export default function Layout({ sidebar, main, rightPanel, forceRightOpen }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);

  // Auto-open right panel if new data is selected
  useEffect(() => {
    if (forceRightOpen) {
      setRightOpen(true);
    }
  }, [forceRightOpen]);

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <div className="absolute top-0 w-full h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLeftOpen(!leftOpen)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
            title={leftOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {leftOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">EDR Visualizer</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setRightOpen(!rightOpen)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
            title={rightOpen ? "Collapse Details" : "Expand Details"}
          >
            {rightOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Toggle Night Mode"
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>
        </div>
      </div>

      {/* Main Content Area (below navbar) */}
      <div className="flex w-full h-full pt-12 relative">
        {/* Sidebar (File Management & Search) */}
        <div
          className={`h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-40 overflow-y-auto transition-all duration-300 ease-in-out whitespace-nowrap
            ${leftOpen ? 'w-1/5 min-w-[250px] max-w-[350px] p-4 opacity-100' : 'w-0 min-w-0 p-0 opacity-0 overflow-hidden'}`}
        >
          {sidebar}
        </div>

        {/* Center: Graph View */}
        <div className="flex-grow h-full bg-gray-50 dark:bg-gray-900 relative transition-all duration-300">
          {main}
        </div>

        {/* Right Panel (Node Details) */}
        <div
          className={`h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col z-40 overflow-y-auto shadow-lg transition-all duration-300 ease-in-out
            ${rightOpen ? 'w-1/4 min-w-[300px] max-w-[400px] p-4 opacity-100' : 'w-0 min-w-0 p-0 opacity-0 overflow-hidden'}`}
        >
          {rightPanel}
        </div>
      </div>
    </div>
  );
}
