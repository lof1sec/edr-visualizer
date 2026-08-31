import fs from 'fs';
import { parseEDRLogs } from './frontend/src/utils/graphUtils.js';

const data = fs.readFileSync('test_crowdstrike.jsonl', 'utf-8');
const lines = data.split('\n').filter(line => line.trim());
const logs = lines.map(line => JSON.parse(line));

try {
  const result = parseEDRLogs(logs);
  console.log('Parsing successful!');
  console.log(`Nodes: ${result.elements.filter(e => !e.data.source).length}`);
  console.log(`Edges: ${result.elements.filter(e => e.data.source).length}`);
} catch (e) {
  console.error('Parsing failed:', e);
}
