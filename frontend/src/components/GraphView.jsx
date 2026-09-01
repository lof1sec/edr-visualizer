import React, { useRef, useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import fcose from 'cytoscape-fcose';
import { useTheme } from '../context/ThemeContext';

cytoscape.use(coseBilkent);
cytoscape.use(fcose);

export default function GraphView({ elements, onNodeClick, searchQuery, exactFilters }) {
  const { isDarkMode } = useTheme();
  const cyRef = useRef(null);

  // High-performance, organic physics-based layout ideal for graphs with hubs (like EDR logs)
  const fcoseLayoutConfig = {
    name: 'fcose',
    animate: true,
    animationDuration: 1000,
    animationEasing: 'ease-out',
    randomize: true,
    quality: 'default',
    nodeSeparation: 75,
    idealEdgeLength: edge => 50,
    edgeElasticity: edge => 0.45,
    nestingFactor: 0.1,
    gravity: 0.25,
    numIter: 2500,
    tile: true,
    tilingPaddingVertical: 10,
    tilingPaddingHorizontal: 10,
    gravityRange: 3.8
  };

  // Concentric layout config (Sphere style)
  const concentricLayoutConfig = {
    name: 'concentric',
    avoidOverlap: true,
    minNodeSpacing: 50,
    concentric: function(node) {
      return node.degree(); // Higher degree nodes in center
    },
    levelWidth: function(nodes) {
      return 2;
    },
    animate: true,
    animationDuration: 500,
    padding: 30
  };

  // If elements have pre-saved positions (from App.jsx), we should use 'preset' layout
  // otherwise, default to 'fcose' for an organic, non-overlapping cluster style
  const hasPositions = elements.some(el => el.position);
  const defaultLayout = hasPositions ? { name: 'preset' } : fcoseLayoutConfig;

  const [layout, setLayout] = useState(defaultLayout);

  // Update layout if elements change and have positions
  useEffect(() => {
    const newHasPositions = elements.some(el => el.position);
    if (newHasPositions) {
       setLayout({ name: 'preset' });
    } else {
       setLayout(fcoseLayoutConfig);
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
        'background-color': '#00264d',
        'border-color': '#66b3ff',
      }
    },
    {
      selector: 'node[group="file"]',
      style: {
        'background-color': '#4d4d00',
        'border-color': '#ffff66',
        'shape': 'ellipse',
      }
    },
    {
      selector: 'node[group="network"]',
      style: {
        'background-color': '#004d00',
        'border-color': '#66ff66',
        'shape': 'hexagon',
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': defaultEdgeColor,
        'target-arrow-color': defaultEdgeColor,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'opacity': 0.6,
        'label': 'data(label)',
        'font-size': '10px',
        'color': labelColor,
        'text-background-color': isDarkMode ? '#1f2937' : '#ffffff',
        'text-background-opacity': 0.7,
        'text-background-padding': '2px',
        'transition-property': 'line-color, target-arrow-color, opacity, width',
        'transition-duration': '0.2s'
      }
    },
    // Interaction States
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': '#ffffff',
        'background-color': '#737373',
      }
    },
    {
      selector: '.highlighted',
      style: {
        'background-color': highlightColor,
        'line-color': highlightColor,
        'target-arrow-color': highlightColor,
        'border-color': highlightColor,
        'color': '#ffffff',
        'border-width': 4,
        'z-index': 100,
        'opacity': 1,
        'text-background-opacity': 1
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
    }
  ];

  // Handle selection events for clicking
  useEffect(() => {
    if (cyRef.current) {
      const cy = cyRef.current;
      cy.on('tap', 'node', (evt) => {
        const node = evt.target;
        if (onNodeClick) {
          onNodeClick(node.data());
        }
      });

      cy.on('tap', 'edge', (evt) => {
         const edge = evt.target;
         if (onNodeClick) {
            onNodeClick(edge.data());
         }
      });

      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          // Clicked on background
          if (onNodeClick) {
            onNodeClick(null);
          }
        }
      });

      // Hover cursors
      cy.on('mouseover', 'node', (e) => {
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
                  const evUser = ev.AccountName || ev.InitiatingProcessAccountName || ev.UserName || ev.SubjectUserName || "Unknown";
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
             let newLayout;
             if (layout.name === 'fcose') {
               newLayout = concentricLayoutConfig;
             } else if (layout.name === 'concentric') {
               newLayout = { name: 'breadthfirst', directed: true, spacingFactor: 1.5 };
             } else {
               newLayout = fcoseLayoutConfig;
             }
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
                 hidden.style('display', 'element');
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
