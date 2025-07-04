// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require('path');

let mainWindow;
let serialPort;
let parser;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for serial communication
ipcMain.handle('get-serial-ports', async () => {
  try {
    console.log('Attempting to list serial ports...');
    const ports = await SerialPort.list();
    console.log('Raw ports found:', ports);
    const mappedPorts = ports.map(port => ({
      path: port.path,
      manufacturer: port.manufacturer,
      serialNumber: port.serialNumber,
      vendorId: port.vendorId,
      productId: port.productId
    }));
    return mappedPorts; // <-- 🔧 This line was missing
  } catch (error) {
    console.error('Error listing ports:', error);
    return [];
  }
});


ipcMain.handle('connect-serial', async (event, portPath, baudRate = 9600) => {
  try {
    if (serialPort && serialPort.isOpen) {
      await serialPort.close();
    }

    serialPort = new SerialPort({
      path: portPath,
      baudRate: parseInt(baudRate),
      autoOpen: false
    });

    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

    return new Promise((resolve, reject) => {
      serialPort.open((err) => {
        if (err) {
          reject(err);
          return;
        }

        // Listen for data
        parser.on('data', (data) => {
          try {
            // Try to parse as JSON first, then as comma-separated values
            let parsedData;
            if (data.trim().startsWith('{')) {
              parsedData = JSON.parse(data.trim());
            } else {
              // Assume comma-separated values: timestamp,value1,value2,...
              const values = data.trim().split(',');
              parsedData = {
                timestamp: Date.now(),
                values: values.map(v => parseFloat(v)).filter(v => !isNaN(v))
              };
            }
            
            mainWindow.webContents.send('serial-data', parsedData);
          } catch (parseError) {
            // If parsing fails, send raw data
            mainWindow.webContents.send('serial-data', {
              timestamp: Date.now(),
              raw: data.trim()
            });
          }
        });

        parser.on('error', (err) => {
          console.error('Parser error:', err);
          mainWindow.webContents.send('serial-error', err.message);
        });

        resolve({ success: true, message: 'Connected successfully' });
      });
    });
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('disconnect-serial', async () => {
  try {
    if (serialPort && serialPort.isOpen) {
      await serialPort.close();
      return { success: true, message: 'Disconnected successfully' };
    }
    return { success: true, message: 'Already disconnected' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('send-serial-data', async (event, data) => {
  try {
    if (!serialPort || !serialPort.isOpen) {
      throw new Error('Serial port not connected');
    }
    
    await serialPort.write(data + '\n');
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});