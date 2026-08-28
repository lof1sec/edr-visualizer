import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export const uploadFile = async (file, logType) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('logType', logType);

  const response = await axios.post(`${API_BASE}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const fetchFiles = async () => {
  const response = await axios.get(`${API_BASE}/files`);
  return response.data.files;
};

export const deleteFile = async (filename) => {
  const response = await axios.delete(`${API_BASE}/files/${filename}`);
  return response.data;
};

export const fetchFileContent = async (filename) => {
  const response = await axios.get(`${API_BASE}/files/${filename}`, {
    responseType: 'text'
  });

  // Parse JSONL
  const lines = response.data.split('\n').filter(line => line.trim() !== '');
  return lines.map(line => JSON.parse(line));
};

export const saveSessionState = async (filename, state) => {
  const response = await axios.post(`${API_BASE}/state/${filename}`, state);
  return response.data;
};

export const loadSessionState = async (filename) => {
  const response = await axios.get(`${API_BASE}/state/${filename}`);
  return response.data.state;
};
