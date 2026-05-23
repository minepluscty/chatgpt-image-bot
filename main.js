const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { loadConfig, saveConfig } = require('./src/main/config');
const { ImageBot } = require('./src/main/imageBot');

let mainWindow;
let imageBot;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 820,
    minWidth: 900,
    minHeight: 680,
    title: 'ChatGPT Image Bot',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

function log(message) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const time = new Date().toLocaleTimeString('vi-VN');
  mainWindow.webContents.send('bot-log', `[${time}] ${message}`);
}

app.whenReady().then(() => {
  imageBot = new ImageBot(log);
  createWindow();
});

app.on('window-all-closed', async () => {
  if (imageBot) await imageBot.close();
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('config-load', async () => loadConfig());

ipcMain.handle('folder-select', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? '' : result.filePaths[0];
});

ipcMain.handle('folder-open', async (event, folderPath) => {
  if (!folderPath || !fs.existsSync(folderPath)) return false;
  await shell.openPath(folderPath);
  return true;
});

ipcMain.handle('bot-start', async (event, config) => {
  saveConfig(config);
  return imageBot.start(config);
});

ipcMain.handle('bot-stop', async () => {
  imageBot.stop();
  return true;
});

ipcMain.handle('bot-continue', async () => {
  imageBot.continueAfterLogin();
  return true;
});
