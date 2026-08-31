const fs = require('fs');

// We will mock the necessary graphUtils logic and test it against the dummy jsonl data.

const data = fs.readFileSync('test_crowdstrike.jsonl', 'utf-8');
const lines = data.split('\n').filter(line => line.trim());
const logs = lines.map(line => JSON.parse(line));

// Now let's try to run a mock parsing based on graphUtils.js logic to see if it throws an error.
// We can just import and call it using esbuild or standard import if we convert it.
