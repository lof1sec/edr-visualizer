import fs from 'fs';
import { parseEDRLogs } from './frontend/src/utils/graphUtils.js';

const data = fs.readFileSync('test_crowdstrike.jsonl', 'utf-8');
const lines = data.split('\n').filter(line => line.trim());
const logs = lines.map(line => JSON.parse(line));

try {
  const result = parseEDRLogs(logs);
  console.log('Parsing result keys:', Object.keys(result || {}));
  console.log(`Result:`, result);
} catch (e) {
  console.error('Parsing failed:', e);
}
