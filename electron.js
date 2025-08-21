const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const APP_NAME = 'MyWork';
const LOCALSTACK_PORT = 4566;
const BACKEND_PORT = 8001;
const FRONTEND_PORT = 3001;

let localstackProcess, backendProcess, frontendProcess;

function startLocalstack() {
	localstackProcess = spawn('docker', [
		'run', '--rm', '-d', '-p', `${LOCALSTACK_PORT}:4566`, '--name', 'localstack', 'localstack/localstack'
	], { stdio: 'inherit' });
}

function startBackend() {
	backendProcess = spawn('uvicorn', [
		'main:app', '--host', '0.0.0.0', '--port', `${BACKEND_PORT}`
	], { cwd: path.join(__dirname, 'backend'), stdio: 'inherit' });
}

function startFrontend() {
	frontendProcess = spawn('npm', ['run', 'dev'], { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
}

function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		title: APP_NAME,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		}
	});
	win.loadURL(`http://localhost:${FRONTEND_PORT}`);
}

app.whenReady().then(() => {
	startLocalstack();
	setTimeout(() => {
		startBackend();
		setTimeout(() => {
			startFrontend();
			setTimeout(createWindow, 5000); // Wait for frontend to start
		}, 3000);
	}, 3000);
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
	// Clean up processes
	if (localstackProcess) spawn('docker', ['stop', 'localstack']);
	if (backendProcess) backendProcess.kill();
	if (frontendProcess) frontendProcess.kill();
});
