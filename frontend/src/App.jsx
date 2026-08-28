import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import GraphView from './components/GraphView';
import RightPanel from './components/RightPanel';
import { fetchFileContent, saveSessionState, loadSessionState } from './services/api';
import { parseEDRLogs } from './utils/graphUtils';
import { Search, Save } from 'lucide-react';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Expose cy instance state via ref to save positions
  const cyRef = React.useRef(null);

  useEffect(() => {
    if (selectedFile) {
      loadGraphData(selectedFile);
    } else {
      setElements([]);
      setSelectedNodeData(null);
    }
  }, [selectedFile]);

  const loadGraphData = async (filename) => {
    setIsLoading(true);
    setSelectedNodeData(null);
    try {
      const logs = await fetchFileContent(filename);
      const graphData = parseEDRLogs(logs);

      // Attempt to load saved state
      try {
        const savedState = await loadSessionState(filename);
        if (savedState) {
          setGlobalSearch(savedState.searchQuery || '');
          // If positions are saved, we can merge them into elements
          if (savedState.positions) {
            graphData.elements.forEach(el => {
              if (el.data && savedState.positions[el.data.id]) {
                el.position = savedState.positions[el.data.id];
              }
            });
          }
        } else {
          setGlobalSearch('');
        }
      } catch (err) {
        console.warn("No saved session state found", err);
        setGlobalSearch('');
      }

      setElements(graphData.elements);
    } catch (error) {
      console.error("Failed to load graph data", error);
      alert("Error loading graph data");
    } finally {
      setIsLoading(false);
    }
  };

  const saveWorkspace = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      const cy = window.cyInstance;
      const positions = {};
      if (cy) {
        cy.nodes().forEach(node => {
          positions[node.id()] = node.position();
        });
      }

      const stateToSave = {
        searchQuery: globalSearch,
        positions: positions
      };

      await saveSessionState(selectedFile, stateToSave);
      alert('Workspace saved successfully!');
    } catch (error) {
      console.error('Failed to save workspace', error);
      alert('Failed to save workspace');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNodeClick = (nodeData) => {
    setSelectedNodeData(nodeData);
  };

  return (
    <ThemeProvider>
      <Layout
        sidebar={
          <Sidebar
            onSelectFile={setSelectedFile}
            selectedFile={selectedFile}
          />
        }
        main={
          <div className="relative w-full h-full flex flex-col">
            {/* Global Actions (Save) */}
            {selectedFile && (
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={saveWorkspace}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition-colors disabled:opacity-50"
                  title="Save node positions and search filter"
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save Workspace'}
                </button>
              </div>
            )}

            {/* Global Search Bar Overlay */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 w-96 max-w-[90%] shadow-lg rounded-full">
               <div className="relative">
                 <input
                   type="text"
                   placeholder="Search strings, numerical values, IPs in graph..."
                   value={globalSearch}
                   onChange={e => setGlobalSearch(e.target.value)}
                   className="w-full pl-10 pr-4 py-3 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                 />
                 <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
                 {globalSearch && (
                   <button
                     onClick={() => setGlobalSearch('')}
                     className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                   >
                     ✕
                   </button>
                 )}
               </div>
            </div>

            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <GraphView
                elements={elements}
                onNodeClick={handleNodeClick}
                searchQuery={globalSearch}
              />
            )}
          </div>
        }
        rightPanel={
          <RightPanel
            nodeData={selectedNodeData}
            onClose={() => setSelectedNodeData(null)}
          />
        }
      />
    </ThemeProvider>
  );
}

export default App;
