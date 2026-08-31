import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function RightPanel({ nodeData, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!nodeData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm italic p-4 text-center">
        Click on a node in the graph to view its detailed events and properties.
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
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h2 className="text-xl font-bold break-all text-blue-600 dark:text-blue-400">{label}</h2>
          <p className="text-sm text-gray-500 font-mono mt-1">PID: {id}</p>
          {timestamp && <p className="text-xs text-gray-400 mt-1">First Seen: {timestamp}</p>}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
          ✕
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Filter node events..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search size={14} className="absolute left-3 top-3 text-gray-400" />
      </div>

      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
          Associated Events ({filteredEvents.length})
        </h3>

        {filteredEvents.map((event, i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700">
             <div className="text-xs font-semibold mb-2 text-purple-600 dark:text-purple-400 uppercase tracking-wider">
               {event.ActionType || 'Event Record'}
             </div>
             <table className="w-full text-xs">
               <tbody>
                 {Object.entries(event).map(([key, val]) => {
                   if(val === null || val === undefined || val === '') return null; // Skip empty
                   return (
                     <tr key={key} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                       <td className="py-1 pr-2 font-medium text-gray-500 dark:text-gray-400 w-1/3 align-top break-words">
                         {key}
                       </td>
                       <td className="py-1 font-mono text-gray-800 dark:text-gray-200 break-all">
                         {searchTerm ? (
                           String(val).split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, index) =>
                             part.toLowerCase() === searchTerm.toLowerCase() ? (
                               <span key={index} className="bg-yellow-500 text-black px-1 rounded">{part}</span>
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
