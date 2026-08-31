import fs from 'fs';
import { parseEDRLogs } from './frontend/src/utils/graphUtils.js';

const data = fs.readFileSync('test_crowdstrike.jsonl', 'utf-8');
const lines = data.split('\n').filter(line => line.trim());
const logs = lines.map(line => JSON.parse(line));

try {
  const result = parseEDRLogs(logs);
  console.log('Parsing successful!');
  console.log(`Nodes: ${result.nodes.length}`);
  console.log(`Edges: ${result.edges.length}`);

  if (result.nodes.length > 0) {
    console.log('Sample node:', JSON.stringify(result.nodes[0], null, 2));
  }
} catch (e) {
  console.error('Parsing failed:', e);
}
