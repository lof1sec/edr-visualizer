import React, { useState, useEffect } from 'react';
import { fetchFiles, uploadFile, deleteFile } from '../services/api';
import { Upload, Trash2, FileText, Download } from 'lucide-react';

export default function Sidebar({ onSelectFile, selectedFile }) {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [logType, setLogType] = useState('defender');

  const loadFiles = async () => {
    try {
      const fileList = await fetchFiles();
      setFiles(fileList);
    } catch (e) {
      console.error("Error loading files", e);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadFile(file, logType);
      await loadFiles();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Ensure backend is running and file is correct.");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = null;
    }
  };

  const handleDelete = async (filename, e) => {
    e.stopPropagation();
    if(window.confirm(`Are you sure you want to delete ${filename}?`)) {
      try {
        await deleteFile(filename);
        if(selectedFile === filename) onSelectFile(null);
        await loadFiles();
      } catch (error) {
        console.error("Delete failed", error);
      }
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col gap-2 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <h3 className="font-semibold text-sm uppercase text-gray-500 dark:text-gray-400">Upload Data</h3>

        <select
          value={logType}
          onChange={e => setLogType(e.target.value)}
          className="p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="defender">Defender XDR (CSV)</option>
          <option value="crowdstrike">CrowdStrike Falcon (JSONL)</option>
        </select>

        <label className={`flex items-center justify-center gap-2 p-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Upload size={16} />
          <span className="text-sm">{isUploading ? 'Uploading...' : 'Select File'}</span>
          <input
            type="file"
            className="hidden"
            accept={logType === 'defender' ? '.csv' : '.jsonl'}
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      <div className="flex-grow flex flex-col gap-2 overflow-y-auto">
        <h3 className="font-semibold text-sm uppercase text-gray-500 dark:text-gray-400 sticky top-0 bg-white dark:bg-gray-800 py-2">Available Logs</h3>
        {files.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No files uploaded yet.</p>
        ) : (
          files.map(file => (
            <div
              key={file}
              onClick={() => onSelectFile(file)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-colors
                ${selectedFile === file
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800'
                  : 'bg-white border-gray-200 hover:border-blue-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-700'
                }`}
            >
              <div className="flex items-center gap-2 overflow-hidden text-sm">
                <FileText size={16} className="text-blue-500 flex-shrink-0" />
                <span className="truncate" title={file}>{file}</span>
              </div>
              <div className="flex gap-2">
                <a
                  href={`http://localhost:3001/api/files/${file}`}
                  download
                  onClick={e => e.stopPropagation()}
                  className="text-gray-400 hover:text-green-500 transition-colors p-1"
                  title="Download File"
                >
                  <Download size={16} />
                </a>
                <button
                  onClick={(e) => handleDelete(file, e)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Delete File"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
