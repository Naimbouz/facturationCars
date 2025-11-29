const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 4000;
let serverProcess = null;

// Start the Express server as a child process
function startServer() {
  try {
    const serverScript = path.join(__dirname, 'server', 'index.js');
    serverProcess = spawn('node', [serverScript], {
      cwd: path.join(__dirname, 'server'),
      stdio: 'inherit'
    });
    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
    });
    serverProcess.on('exit', (code) => {
      console.log('Server exited with code:', code);
      serverProcess = null;
    });
    console.log('Server started on port', PORT);
  } catch (e) {
    console.error('Error starting server:', e);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Remove default menu
  win.removeMenu();

  // Load the app served by the server
  const url = `http://localhost:${PORT}`;
  win.loadURL(url);
}

app.whenReady().then(() => {
  startServer();
  // Wait a moment for server to start before opening window
  setTimeout(() => {
    createWindow();
  }, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      serverProcess.kill();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
