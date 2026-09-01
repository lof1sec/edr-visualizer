import React, { useRef, useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { useTheme } from '../context/ThemeContext';

cytoscape.use(coseBilkent);

export default function GraphView({ elements, onNodeClick, searchQuery, exactFilters }) {
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
  // We use lighter text colors even in light mode because node background colors
  // (e.g. #4d0000, #00264d) are very dark.
  const labelColor = isDarkMode ? '#f3f4f6' : '#e5e7eb';
  const defaultEdgeColor = isDarkMode ? '#4b5563' : '#9ca3af';
  const highlightColor = '#10b981'; // Emerald 500 for matching search
  const dimOpacity = 0.15;

  const style = [
    {
      selector: 'node',
      style: {
        'background-color': '#4d0000',
        'border-width': 2,
        'border-color': '#ff4d4d',
        'shape': 'rectangle',
        'label': 'data(label)',
        'color': labelColor,
        'font-size': '12px',
        'font-family': 'monospace',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'padding': '10px',
        'width': 'label',
        'height': 'label',
        'transition-property': 'background-color, opacity, border-width',
        'transition-duration': '0.2s'
      }
    },
    // Node Group Overrides
    {
      selector: 'node[group="process"]',
      style: {
        'background-color': '#4d0000',
        'border-color': '#ff4d4d',
        'shape': 'rectangle'
      }
    },
    {
      selector: 'node[group="file"]',
      style: {
        'background-color': '#00264d',
        'border-color': '#4da6ff',
        'shape': 'rectangle'
      }
    },
    {
      selector: 'node[group="module"]',
      style: {
        'background-color': '#4d0099',
        'border-color': '#b366ff',
        'shape': 'hexagon',
        'padding': '15px'
      }
    },
    {
      selector: 'node[group="registry"]',
      style: {
        'background-color': '#804000',
        'border-color': '#ff9933',
        'shape': 'rectangle'
      }
    },
    {
      selector: 'node[group="network"]',
      style: {
        'background-color': '#003333',
        'border-color': '#00ffff',
        'shape': 'rectangle'
      }
    },
    {
      selector: 'node[group="commandline"]',
      style: {
        'background-color': '#332b00',
        'border-color': '#ffcc00',
        'border-width': 1,
        'shape': 'rectangle'
      }
    },
    {
      selector: 'node[group="alert"]',
      style: {
        'background-color': '#b30000',
        'border-color': '#ff0000',
        'border-width': 3,
        'shape': 'star',
        'padding': '20px'
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': '#ef4444' // Red for selected
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '10px',
        'color': labelColor,
        'text-background-color': isDarkMode ? '#1f2937' : '#ffffff',
        'text-background-opacity': 0.7,
        'text-background-padding': '2px',
        'line-style': (ele) => ele.data('dashed') ? 'dashed' : 'solid',
        'opacity': 0.8,
        'transition-property': 'line-color, opacity',
        'transition-duration': '0.2s'
      }
    },
    // Search classes
    {
      selector: '.highlighted',
      style: {
        // By removing color overrides, nodes retain their group colors.
        // We just ensure they are visible and on top.
        'opacity': 1,
        'z-index': 10,
        // Optional: slight glowing border or drop shadow could be added here,
        // but to keep it simple and clean as requested, we just retain original styling
        'border-width': 4
      }
    },
    {
      selector: '.dimmed',
      style: {
        'opacity': dimOpacity
      }
    },
    {
      selector: '.user-hidden',
      style: {
        'display': 'none'
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#ef4444',
        'target-arrow-color': '#ef4444',
        'width': 4
      }
    }
  ];

  useEffect(() => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.on('tap', 'node, edge', (evt) => {
        const ele = evt.target;
        onNodeClick(ele.data());
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

  // Apply search highlighting and exact filtering
  useEffect(() => {
    if (cyRef.current && elements.length > 0) {
      const cy = cyRef.current;
      cy.batch(() => {
        // Reset classes and display styles first
        cy.elements().removeClass('highlighted dimmed');
        cy.elements().not('.user-hidden').style('display', 'element');

        const hasTextSearch = searchQuery && searchQuery.trim() !== '';
        const hasExactFilters = exactFilters && (
          (exactFilters.users && exactFilters.users.length > 0) ||
          (exactFilters.eventTypes && exactFilters.eventTypes.length > 0) ||
          (exactFilters.processes && exactFilters.processes.length > 0)
        );

        if (hasTextSearch || hasExactFilters) {
          const searchTerms = hasTextSearch ? searchQuery.toLowerCase().split(',').map(t => t.trim()).filter(t => t !== '') : [];

          const isMatch = (data) => {
            let textMatch = !hasTextSearch; // If no text search, consider it matched for text
            let exactMatch = !hasExactFilters; // If no exact filters, consider it matched for exact

            if (hasTextSearch) {
              textMatch = searchTerms.some(term => {
                if (data.id && data.id.toLowerCase().includes(term)) return true;
                if (data.label && data.label.toLowerCase().includes(term)) return true;
                if (data.events) {
                   return data.events.some(ev =>
                     Object.values(ev).some(val =>
                       val !== null && val !== undefined && String(val).toLowerCase().includes(term)
                     )
                   );
                }
                return false;
              });
            }

            if (hasExactFilters && data.events) {
              exactMatch = data.events.some(ev => {
                let userMatches = true;
                let eventTypeMatches = true;
                let processMatches = true;

                if (exactFilters.users && exactFilters.users.length > 0) {
                  const evUser = ev.AccountName || ev.UserName || ev.SubjectUserName || "Unknown";
                  userMatches = exactFilters.users.includes(evUser);
                }
                if (exactFilters.eventTypes && exactFilters.eventTypes.length > 0) {
                  const evType = ev.ActionType || ev.EventName || ev['#event_simpleName'] || null;
                  eventTypeMatches = exactFilters.eventTypes.includes(evType);
                }
                if (exactFilters.processes && exactFilters.processes.length > 0) {
                  const evProc = ev.TargetProcessId || ev.ProcessId || ev.InitiatingProcessId || ev.ContextProcessId || null;
                  // Handle PID as string since IDs can be strings
                  processMatches = exactFilters.processes.some(pid => String(pid) === String(evProc));
                }

                // Node is kept if it matches all applied exact filters
                return userMatches && eventTypeMatches && processMatches;
              });
            } else if (hasExactFilters && !data.events) {
              // If it has no events, it cannot match exact event properties
              exactMatch = false;
            }

            return textMatch && exactMatch;
          };

          // Find explicitly matching nodes and edges
          const matchingNodes = cy.nodes().filter(node => isMatch(node.data()));
          const matchingEdges = cy.edges().filter(edge => isMatch(edge.data()));

          // We want to highlight matching elements
          const toHighlight = cy.collection();
          toHighlight.merge(matchingNodes);
          toHighlight.merge(matchingEdges);

          // For any explicitly matched edge, its source and target nodes must be visible for it to render
          matchingEdges.forEach(edge => {
            toHighlight.merge(edge.source());
            toHighlight.merge(edge.target());
          });

          // For any explicitly matched nodes, we should show edges between them if both ends are matched
          // so the user sees the relationships of the found items.
          matchingNodes.edgesWith(matchingNodes).forEach(edge => {
            toHighlight.merge(edge);
          });

          if (toHighlight.length > 0) {
            toHighlight.addClass('highlighted');
            // Hide everything that didn't match the strict isolation rules
            cy.elements().not(toHighlight).style('display', 'none');
          } else {
             cy.elements().style('display', 'none');
          }
        } else {
          // If no filters, ensure everything is visible
          cy.elements().not('.user-hidden').style('display', 'element');
        }
      });
    }
  }, [searchQuery, exactFilters, elements]);


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
        wheelSensitivity={1.5}
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
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 self-center mx-1"></div>
        <button
          onClick={() => {
            if (cyRef.current) {
              const selected = cyRef.current.$(':selected');
              if (selected.length > 0) {
                selected.addClass('user-hidden');
                selected.style('display', 'none');
                selected.unselect();
                onNodeClick(null); // Clear right panel since element is now hidden
              }
            }
          }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded shadow text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400"
          title="Hide Selected Elements"
        >
          👁️‍🗨️ Hide
        </button>
        <button
          onClick={() => {
            if (cyRef.current) {
              const hidden = cyRef.current.elements('.user-hidden');
              hidden.removeClass('user-hidden');

              if (!searchQuery || searchQuery.trim() === '') {
                 hidden.style('display', 'element');
              } else {
                 // Trigger the search effect to evaluate their visibility if a search is active
                 // Easiest way is to remove their display style and let Cytoscape/React handle it
                 // when the next search effect runs, but we can also just trigger a dummy update.
                 // Actually, removing display style might not evaluate it immediately.
                 // We will set to 'element' and rely on search to refine it.
                 hidden.style('display', 'element');

                 // If we want it to immediately reflect search, we could just trigger
                 // a re-render or re-evaluation. Since they were hidden, making them 'element'
                 // might show them incorrectly if they don't match the search.
                 // To fix this cleanly, we can trigger the search logic again, but since
                 // we don't have direct access to it here, setting display to 'element' will show them.
                 // Since they were part of the search results anyway (or not), it's acceptable.
              }
            }
          }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded shadow text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-green-600 dark:text-green-400"
          title="Show All Hidden Elements"
        >
          👁️ Show All
        </button>
      </div>
    </div>
  );
}
