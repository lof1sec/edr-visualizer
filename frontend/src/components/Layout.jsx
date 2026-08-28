import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ sidebar, main, rightPanel }) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <div className="absolute top-0 w-full h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-50 shadow-sm">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">EDR Visualizer</h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Toggle Night Mode"
        >
          {isDarkMode ? '🌞' : '🌙'}
        </button>
      </div>

      {/* Main Content Area (below navbar) */}
      <div className="flex w-full h-full pt-12">
        {/* Sidebar (File Management & Search) */}
        <div className="w-1/5 min-w-[250px] max-w-[350px] h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col z-40 overflow-y-auto">
          {sidebar}
        </div>

        {/* Center: Graph View */}
        <div className="flex-grow h-full bg-gray-50 dark:bg-gray-900 relative">
          {main}
        </div>

        {/* Right Panel (Node Details) */}
        <div className="w-1/4 min-w-[300px] max-w-[400px] h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 flex flex-col z-40 overflow-y-auto shadow-lg">
          {rightPanel}
        </div>
      </div>
    </div>
  );
}
