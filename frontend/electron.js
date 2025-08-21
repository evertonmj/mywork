const path = require('path');

const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
let backend;

function createWindow() {
  // Start backend executable
  const path = require('path');
  const backendPath = process.platform === 'win32'
    ? path.join(process.resourcesPath, 'backend', 'dist', 'main.exe')
    : path.join(process.resourcesPath, 'backend', 'dist', 'main');
  backend = spawn(backendPath, [], { cwd: path.dirname(backendPath), shell: true });

  backend.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });
  backend.stderr.on('data', (data) => {
    console.error(`Backend error: ${data}`);
  });

  // Wait a moment for backend to start
  setTimeout(() => {
    const win = new BrowserWindow({ width: 1200, height: 800 });
    win.loadURL('http://localhost:3001'); // Adjust if your backend serves frontend elsewhere
  }, 2000);
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (backend) backend.kill();
});
app.on('will-quit', () => {
  if (backend) backend.kill();
});