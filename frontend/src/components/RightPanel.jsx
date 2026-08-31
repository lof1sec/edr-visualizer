import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function RightPanel({ nodeData, rawLogs, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!nodeData) {
    if (!rawLogs || rawLogs.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400 text-sm italic p-4 text-center">
          Click on a node in the graph to view its detailed events and properties.
        </div>
      );
    }

    // Aggregate global stats
    const users = new Set();
    const processes = new Map(); // pid -> process name
    const eventTypes = new Set();

    rawLogs.forEach(log => {
      // Event Type
      const evt = log.ActionType || log['#event_simpleName'] || log.EventName;
      if (evt) eventTypes.add(evt);

      // User
      const user = log.AccountName || log.UserName || log.SubjectUserName;
      if (user && user.toLowerCase() !== 'system' && !user.endsWith('$')) {
        users.add(user);
      }

      // Process
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
        // If we don't have a name yet or the current one is unknown
        if (!processes.has(pid) || processes.get(pid) === "Unknown Process") {
          processes.set(pid, procName);
        }
      }

      // Also check Target process for Defender if applicable (though Initiating is the actor)
      // or Parent process etc, but sticking to main actor is good for summary.
    });

    const userList = Array.from(users).sort();
    const eventTypeList = Array.from(eventTypes).sort();
    const processList = Array.from(processes.entries()).map(([pid, name]) => ({ pid, name })).sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div className="flex flex-col h-full gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700 pb-2">
          Global Log Summary
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">
          Select a node in the graph to view its specific details.
        </p>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold mb-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Users ({userList.length})
            </h3>
            <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
              {userList.length > 0 ? userList.map(u => <li key={u} className="break-all">{u}</li>) : <li>None found</li>}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold mb-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Event Types ({eventTypeList.length})
            </h3>
            <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
              {eventTypeList.length > 0 ? eventTypeList.map(e => <li key={e} className="break-all">{e}</li>) : <li>None found</li>}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold mb-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Processes ({processList.length})
            </h3>
            <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
              {processList.length > 0 ? processList.map(p => (
                <li key={p.pid} className="border-b border-gray-100 dark:border-gray-700 last:border-0 py-1 flex flex-col">
                  <span className="font-semibold break-all">{p.name}</span>
                  <span className="text-gray-500 dark:text-gray-400 font-mono text-[10px]">PID: {p.pid}</span>
                </li>
              )) : <li>None found</li>}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const { id, label, timestamp, events } = nodeData;

  // Filter events by search term (basic text search across all event values)
  const filteredEvents = (events || []).filter(event => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(event).some(val =>
      val !== null && val !== undefined && String(val).toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col h-full gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
      <div className="flex justify-between items-start border-b border-gray-300 dark:border-gray-700 pb-4">
        <div>
          <h2 className="text-xl font-bold break-all text-blue-700 dark:text-blue-400">{label}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mt-1">PID: {id}</p>
          {timestamp && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">First Seen: {timestamp}</p>}
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
          ✕
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Filter node events..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        <Search size={14} className="absolute left-3 top-3 text-gray-400" />
      </div>

      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
          Associated Events ({filteredEvents.length})
        </h3>

        {filteredEvents.map((event, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
             <div className="text-xs font-bold mb-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
               {event.ActionType || 'Event Record'}
             </div>
             <table className="w-full text-xs">
               <tbody>
                 {Object.entries(event).map(([key, val]) => {
                   if(val === null || val === undefined || val === '') return null; // Skip empty
                   return (
                     <tr key={key} className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                       <td className="py-2 pr-2 font-semibold text-gray-600 dark:text-gray-400 w-1/3 align-top break-words">
                         {key}
                       </td>
                       <td className="py-2 font-mono text-gray-900 dark:text-gray-100 break-all">
                         {searchTerm ? (
                           String(val).split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, index) =>
                             part.toLowerCase() === searchTerm.toLowerCase() ? (
                               <span key={index} className="bg-yellow-400 dark:bg-yellow-500 text-gray-900 px-1 rounded font-bold">{part}</span>
                             ) : (
                               <span key={index}>{part}</span>
                             )
                           )
                         ) : (
                           String(val)
                         )}
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <p className="text-sm text-gray-500 italic">No events match the filter.</p>
        )}
      </div>
    </div>
  );
}
