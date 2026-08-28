import React, { useRef, useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { useTheme } from '../context/ThemeContext';

cytoscape.use(coseBilkent);

export default function GraphView({ elements, onNodeClick, searchQuery }) {
  const { isDarkMode } = useTheme();
  const cyRef = useRef(null);

  // Physics-based physics layout config
  const coseLayoutConfig = {
    name: 'cose-bilkent',
    animate: 'end',
    animationEasing: 'ease-out',
    animationDuration: 1000,
    randomize: true,
    nodeRepulsion: 4500,
    idealEdgeLength: 100,
    edgeElasticity: 0.45,
    nestingFactor: 0.1,
    gravity: 0.25,
    numIter: 2500,
    tile: true,
    tilingPaddingVertical: 10,
    tilingPaddingHorizontal: 10,
    gravityRangeCompound: 1.5,
    gravityCompound: 1.0,
    gravityRange: 3.8
  };

  // If elements have pre-saved positions (from App.jsx), we should use 'preset' layout
  // otherwise, default to 'cose-bilkent' for physics
  const hasPositions = elements.some(el => el.position);
  const defaultLayout = hasPositions ? { name: 'preset' } : coseLayoutConfig;

  const [layout, setLayout] = useState(defaultLayout);

  // Update layout if elements change and have positions
  useEffect(() => {
    const newHasPositions = elements.some(el => el.position);
    if (newHasPositions) {
       setLayout({ name: 'preset' });
    } else {
       setLayout(coseLayoutConfig);
    }
  }, [elements]);

  // Styles based on theme
  const nodeColor = isDarkMode ? '#c084fc' : '#aa3bff';
  const nodeBorderColor = isDarkMode ? '#e9d5ff' : '#6b21a8';
  const labelColor = isDarkMode ? '#f3f4f6' : '#1f2937';
  const edgeColor = isDarkMode ? '#4b5563' : '#9ca3af';
  const highlightColor = '#10b981'; // Emerald 500 for matching search
  const dimOpacity = 0.15;

  const style = [
    {
      selector: 'node',
      style: {
        'background-color': nodeColor,
        'border-width': 2,
        'border-color': nodeBorderColor,
        'label': 'data(label)',
        'color': labelColor,
        'font-size': '12px',
        'text-valign': 'bottom',
        'text-margin-y': 5,
        'width': 30,
        'height': 30,
        'transition-property': 'background-color, opacity, border-width',
        'transition-duration': '0.2s'
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': '#ef4444', // Red for selected
        'background-color': '#f87171'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': edgeColor,
        'target-arrow-color': edgeColor,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'opacity': 0.6,
        'transition-property': 'line-color, opacity',
        'transition-duration': '0.2s'
      }
    },
    // Search classes
    {
      selector: '.highlighted',
      style: {
        'background-color': highlightColor,
        'border-color': '#059669',
        'line-color': highlightColor,
        'target-arrow-color': highlightColor,
        'opacity': 1,
        'z-index': 10
      }
    },
    {
      selector: '.dimmed',
      style: {
        'opacity': dimOpacity
      }
    }
  ];

  useEffect(() => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        onNodeClick(node.data());
      });

      // Free movement is enabled by default in react-cytoscapejs
      // Highlight on hover
      cy.on('mouseover', 'node', (e) => {
         // Create a simple tooltip effect or handle internally
         document.body.style.cursor = 'pointer';
      });
      cy.on('mouseout', 'node', (e) => {
         document.body.style.cursor = 'default';
      });
    }
  }, [cyRef, onNodeClick]);

  // Apply search highlighting
  useEffect(() => {
    if (cyRef.current && elements.length > 0) {
      const cy = cyRef.current;
      cy.batch(() => {
        // Reset classes
        cy.elements().removeClass('highlighted dimmed');

        if (searchQuery && searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();

          // Find matching nodes based on their events data, label, or id
          const matchingNodes = cy.nodes().filter(node => {
            const data = node.data();
            // Check basic properties
            if (data.id.toLowerCase().includes(query) ||
                (data.label && data.label.toLowerCase().includes(query))) {
              return true;
            }

            // Check deep inside events
            if (data.events) {
               return data.events.some(ev =>
                 Object.values(ev).some(val =>
                   val !== null && val !== undefined && String(val).toLowerCase().includes(query)
                 )
               );
            }
            return false;
          });

          if (matchingNodes.length > 0) {
            // Highlighting nodes and connected edges as per requirement
            matchingNodes.addClass('highlighted');
            matchingNodes.connectedEdges().addClass('highlighted');

            // For strings, user asked to "only show the node and edges related"
            // So instead of just dimming, we hide the unrelated ones
            cy.elements().not('.highlighted').style('display', 'none');
          } else {
             cy.elements().style('display', 'none');
          }
        } else {
          // If no search query, ensure everything is visible
          cy.elements().style('display', 'element');
        }
      });
    }
  }, [searchQuery, elements]);


  if (!elements || elements.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
        <p className="text-lg">No graph data to display</p>
        <p className="text-sm mt-2">Upload or select a file from the sidebar</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={style}
        layout={layout}
        cy={(cy) => {
          cyRef.current = cy;
          // Assign to a global or window ref so App can read positions if it wasn't passed via props
          window.cyInstance = cy;
        }}
        wheelSensitivity={0.5}
        minZoom={0.1}
        maxZoom={5}
      />

      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-4 flex gap-2 z-10">
        <button
          onClick={() => cyRef.current && cyRef.current.fit()}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded shadow text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Fit to Screen"
        >
          ⛶ Fit
        </button>
        <button
          onClick={() => {
             const newLayout = layout.name === 'cose-bilkent' ? { name: 'breadthfirst', directed: true, spacingFactor: 1.5 } : coseLayoutConfig;
             setLayout(newLayout);
             if (cyRef.current) cyRef.current.layout(newLayout).run();
          }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded shadow text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Toggle Layout"
        >
          🔄 Layout
        </button>
      </div>
    </div>
  );
}
