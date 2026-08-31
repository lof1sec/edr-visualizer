import fs from 'fs';
import { parseEDRLogs } from './frontend/src/utils/graphUtils.js';

const data = fs.readFileSync('test_crowdstrike.jsonl', 'utf-8');
const lines = data.split('\n').filter(line => line.trim());
const logs = lines.map(line => JSON.parse(line));

try {
  const result = parseEDRLogs(logs);
  console.log(`Elements: ${result.elements.length}`);

  if (result.elements.length > 0) {
    console.log('Sample element:', JSON.stringify(result.elements[0], null, 2));

    // Log nodes vs edges
    const nodesCount = result.elements.filter(e => !e.data.source).length;
    const edgesCount = result.elements.filter(e => e.data.source).length;
    console.log(`Nodes: ${nodesCount}`);
    console.log(`Edges: ${edgesCount}`);
  }
} catch (e) {
  console.error('Parsing failed:', e);
}
