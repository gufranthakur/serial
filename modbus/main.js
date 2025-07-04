// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { readModbusData } = require('./modbusClient');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('fetch-data', async (_event, params) => {
  try {
    return await readModbusData(params);
  } catch (err) {
    throw new Error(err.message);
  }
});

ipcMain.handle('save-csv', async (event, data) => {
  const win = BrowserWindow.getFocusedWindow();
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Save CSV',
    defaultPath: 'modbus_data.csv',
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });

  if (!canceled && filePath) {
    const csv = data.map(row => row.join(',')).join('\n');
    fs.writeFileSync(filePath, csv);
    return 'Saved to ' + filePath;
  } else {
    return 'Canceled';
  }
});
