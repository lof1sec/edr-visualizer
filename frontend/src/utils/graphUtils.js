// Utility functions for converting EDR logs into Cytoscape elements

export const parseEDRLogs = (logs) => {
  const nodes = {};
  const edges = [];
  const edgeSet = new Set();

  logs.forEach((log, index) => {
    // Determine type by checking for characteristic fields
    const isCrowdStrike = log.hasOwnProperty('TargetProcessId');
    const isDefender = log.hasOwnProperty('ProcessId');

    let nodeId, parentId, timestamp, processName, commandLine;

    if (isCrowdStrike) {
      nodeId = log.TargetProcessId;
      parentId = log.ParentProcessId;
      timestamp = log.ProcessStartTime; // Might need to convert epoch to readable
      processName = log.ImageFileName ? log.ImageFileName.split('\\').pop() : 'Unknown';
      commandLine = log.CommandLine;
    } else if (isDefender) {
      nodeId = log.ProcessId;
      parentId = log.InitiatingProcessId;
      timestamp = log.ProcessCreationTime || log.Timestamp;
      processName = log.FileName || log.InitiatingProcessFileName || 'Unknown';
      commandLine = log.ProcessCommandLine || log.InitiatingProcessCommandLine;
    } else {
      // Fallback
      nodeId = log.ProcessId || `unknown-${index}`;
      parentId = null;
      processName = 'Unknown Log Format';
    }

    if (!nodeId) return; // Skip if no valid node ID can be found

    // If node doesn't exist yet, create it
    if (!nodes[nodeId]) {
      nodes[nodeId] = {
        data: {
          id: String(nodeId),
          label: processName,
          timestamp,
          commandLine,
          events: [] // Store all raw log events associated with this process
        }
      };
    } else {
       // If node exists, we might want to update some fields if they are better in this event
       if(processName !== 'Unknown' && nodes[nodeId].data.label === 'Unknown') {
          nodes[nodeId].data.label = processName;
       }
    }

    // Append this specific log to the node's events
    nodes[nodeId].data.events.push(log);

    // Create edge if parentId exists and is not the same as nodeId (avoid self loops)
    if (parentId && String(parentId) !== String(nodeId)) {
      const edgeId = `${parentId}-${nodeId}`;
      // Instead of an O(N^2) array lookup via some(), we'll use a Set for O(1) deduplication
      if (!edgeSet.has(edgeId)) {
        edgeSet.add(edgeId);
        edges.push({
          data: {
            id: edgeId,
            source: String(parentId),
            target: String(nodeId)
          }
        });

        // Also ensure the parent node exists (it might not have appeared in the logs yet, or never will)
        if (!nodes[parentId]) {
          nodes[parentId] = {
            data: {
              id: String(parentId),
              label: 'Unknown Parent',
              events: []
            }
          };
        }
      }
    }
  });

  return {
    elements: [
      ...Object.values(nodes),
      ...edges
    ]
  };
};
