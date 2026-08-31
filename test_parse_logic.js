const fs = require('fs');

const data = fs.readFileSync('test_crowdstrike.jsonl', 'utf-8');
const lines = data.split('\n').filter(line => line.trim());
const rawLogs = lines.map(line => JSON.parse(line));

const users = new Set();
const processes = new Map();
const eventTypes = new Set();

rawLogs.forEach(log => {
  const evt = log.ActionType || log['#event_simpleName'] || log.EventName;
  if (evt) eventTypes.add(evt);

  const user = log.AccountName || log.UserName || log.SubjectUserName;
  if (user && user.toLowerCase() !== 'system' && !user.endsWith('$')) {
    users.add(user);
  }

  const isCrowdStrike = log.hasOwnProperty('TargetProcessId');

  let pid, procName;
  if (isCrowdStrike) {
    pid = log.TargetProcessId;
    procName = log.FileName || log.ImageFileName || "Unknown Process";
  } else {
    pid = log.InitiatingProcessId;
    procName = log.InitiatingProcessFileName || "Unknown Process";
  }

  if (pid) {
    if (!processes.has(pid) || processes.get(pid) === "Unknown Process") {
      processes.set(pid, procName);
    }
  }
});

console.log("Users:", Array.from(users));
console.log("Event Types:", Array.from(eventTypes));
console.log("Processes:", Array.from(processes.entries()));
