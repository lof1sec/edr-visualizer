import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function RightPanel({ nodeData, rawLogs, onClose, exactFilters, onExactFilterSelect }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Local search states for global summary lists
  const [userSearch, setUserSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [processSearch, setProcessSearch] = useState('');

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
      const user = log.AccountName || log.InitiatingProcessAccountName || log.UserName || log.SubjectUserName || "Unknown";
      if (user) {
        users.add(user);
      }

      // Process
      const isCrowdStrike = log.hasOwnProperty('#event_simpleName');

      let pid, procName;
      if (isCrowdStrike) {
        pid = log.TargetProcessId || log.ContextProcessId || log.SourceProcessId || log.ParentProcessId;
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

    const filteredUsers = userList.filter(u => u.toLowerCase().includes(userSearch.toLowerCase()));
    const filteredEvents = eventTypeList.filter(e => e.toLowerCase().includes(eventSearch.toLowerCase()));
    const filteredProcesses = processList.filter(p => p.name.toLowerCase().includes(processSearch.toLowerCase()) || p.pid.includes(processSearch));

    return (
      <div className="flex flex-col h-full gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700 pb-2">
          Global Log Summary
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">
          Select a node in the graph to view its specific details. Click an item to filter the graph.
        </p>

        <div className="space-y-4">
          {/* Users List */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold mb-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Users ({filteredUsers.length}/{userList.length})
            </h3>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search size={12} className="absolute left-2 top-2 text-gray-400" />
            </div>
            <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 max-h-40 overflow-y-auto pr-1">
              {filteredUsers.length > 0 ? filteredUsers.map(u => {
                const isActive = exactFilters?.users?.includes(u);
                return (
                  <li
                    key={u}
                    onClick={() => onExactFilterSelect && onExactFilterSelect('users', u)}
                    className={`break-all cursor-pointer px-1 rounded transition-colors ${isActive ? 'bg-blue-200 dark:bg-blue-900 font-bold' : 'hover:bg-blue-50 dark:hover:bg-gray-700'}`}
                    title={isActive ? "Click to remove filter" : "Click to filter graph exactly by this user"}
                  >
                    • {u}
                  </li>
                );
              }) : <li className="text-gray-400 italic px-1">No matches</li>}
            </ul>
          </div>

          {/* Event Types List */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold mb-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Event Types ({filteredEvents.length}/{eventTypeList.length})
            </h3>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Search events..."
                value={eventSearch}
                onChange={e => setEventSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search size={12} className="absolute left-2 top-2 text-gray-400" />
            </div>
            <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 max-h-40 overflow-y-auto pr-1">
              {filteredEvents.length > 0 ? filteredEvents.map(e => {
                const isActive = exactFilters?.eventTypes?.includes(e);
                return (
                  <li
                    key={e}
                    onClick={() => onExactFilterSelect && onExactFilterSelect('eventTypes', e)}
                    className={`break-all cursor-pointer px-1 rounded transition-colors ${isActive ? 'bg-blue-200 dark:bg-blue-900 font-bold' : 'hover:bg-blue-50 dark:hover:bg-gray-700'}`}
                    title={isActive ? "Click to remove filter" : "Click to filter graph exactly by this event type"}
                  >
                    • {e}
                  </li>
                );
              }) : <li className="text-gray-400 italic px-1">No matches</li>}
            </ul>
          </div>

          {/* Processes List */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold mb-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Processes ({filteredProcesses.length}/{processList.length})
            </h3>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Search processes..."
                value={processSearch}
                onChange={e => setProcessSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search size={12} className="absolute left-2 top-2 text-gray-400" />
            </div>
            <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 max-h-40 overflow-y-auto pr-1">
              {filteredProcesses.length > 0 ? filteredProcesses.map(p => {
                const isActive = exactFilters?.processes?.includes(p.pid);
                return (
                  <li
                    key={p.pid}
                    onClick={() => onExactFilterSelect && onExactFilterSelect('processes', p.pid)}
                    className={`border-b border-gray-100 dark:border-gray-700 last:border-0 py-1 px-1 flex flex-col cursor-pointer rounded transition-colors ${isActive ? 'bg-blue-200 dark:bg-blue-900' : 'hover:bg-blue-50 dark:hover:bg-gray-700'}`}
                    title={isActive ? "Click to remove filter" : "Click to filter graph exactly by this PID"}
                  >
                    <span className={`font-semibold break-all ${isActive ? 'font-bold' : ''}`}>{p.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 font-mono text-[10px]">PID: {p.pid}</span>
                  </li>
                );
              }) : <li className="text-gray-400 italic px-1">No matches</li>}
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

  const isEdge = !!nodeData.source && !!nodeData.target;

  return (
    <div className="flex flex-col h-full gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
      <div className="flex justify-between items-start border-b border-gray-300 dark:border-gray-700 pb-4">
        <div>
          <h2 className="text-xl font-bold break-all text-blue-700 dark:text-blue-400">{label}</h2>
          {!isEdge && <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mt-1">PID: {id}</p>}
          {isEdge && <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mt-1">Edge ID: {id}</p>}
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
