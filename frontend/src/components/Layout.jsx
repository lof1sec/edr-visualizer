import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function Layout({ sidebar, main, rightPanel, forceRightOpen }) {
  const { isDarkMode, toggleTheme } = useTheme();

  // Use refs for the panels to control collapse programmatically
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);

  // Auto-open right panel if new data is selected
  useEffect(() => {
    if (forceRightOpen) {
      setRightOpen(true);
      if (rightPanelRef.current) {
        rightPanelRef.current.expand();
      }
    }
  }, [forceRightOpen]);

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <div className="absolute top-0 w-full h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">EDR Visualizer</h1>
        </div>

        <div className="flex items-center gap-4">
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
      <div className="w-full h-full pt-12 relative">
        <PanelGroup direction="horizontal">
          {/* Sidebar */}
          <Panel
            ref={leftPanelRef}
            collapsible={false}
            defaultSize={20}
            minSize={10}
            maxSize={60}
            className="h-full bg-white dark:bg-gray-800 z-40 overflow-y-auto"
          >
            <div className="p-4 h-full">
              {sidebar}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors cursor-col-resize z-50" />

          {/* Center: Graph View */}
          <Panel className="flex-grow h-full bg-gray-50 dark:bg-gray-900 relative">
            {main}
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors cursor-col-resize z-50" />

          {/* Right Panel */}
          <Panel
            ref={rightPanelRef}
            collapsible={false}
            defaultSize={25}
            minSize={10}
            maxSize={60}
            className="h-full bg-white dark:bg-gray-800 z-40 overflow-y-auto shadow-lg"
          >
            <div className="p-4 h-full">
              {rightPanel}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
