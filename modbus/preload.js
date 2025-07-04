// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  fetchData: (params) => ipcRenderer.invoke('fetch-data', params),
  saveCSV: (rows) => ipcRenderer.invoke('save-csv', rows)
});
