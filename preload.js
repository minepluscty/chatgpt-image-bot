const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('botApi', {
  loadConfig: () => ipcRenderer.invoke('config-load'),
  selectFolder: () => ipcRenderer.invoke('folder-select'),
  openFolder: (folderPath) => ipcRenderer.invoke('folder-open', folderPath),
  start: (config) => ipcRenderer.invoke('bot-start', config),
  stop: () => ipcRenderer.invoke('bot-stop'),
  continueRun: () => ipcRenderer.invoke('bot-continue'),
  onLog: (callback) => ipcRenderer.on('bot-log', (event, message) => callback(message))
});
