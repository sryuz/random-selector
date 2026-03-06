// Electron 主进程入口
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        resizable: true,
        minWidth: 600,
        minHeight: 500,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: path.join(__dirname, 'assets/icons/icon.png'),
        title: '随机选择器'
    });

    mainWindow.loadFile(path.join(__dirname, 'src/index.html'));

    // 开发模式下打开开发者工具
    // mainWindow.webContents.openDevTools();
}

// 应用就绪时创建窗口
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 关闭所有窗口时退出应用 (Windows & Linux)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC: 保存配置到本地文件
ipcMain.handle('save-config', async (event, config) => {
    try {
        const configPath = path.join(app.getPath('userData'), 'config.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('保存配置失败:', error);
        return { success: false, error: error.message };
    }
});

// IPC: 读取本地配置
ipcMain.handle('load-config', async () => {
    try {
        const configPath = path.join(app.getPath('userData'), 'config.json');
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('读取配置失败:', error);
        return null;
    }
});

// IPC: 保存历史记录
ipcMain.handle('save-history', async (event, history) => {
    try {
        const historyPath = path.join(app.getPath('userData'), 'history.json');
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('保存历史失败:', error);
        return { success: false, error: error.message };
    }
});

// IPC: 读取历史记录
ipcMain.handle('load-history', async () => {
    try {
        const historyPath = path.join(app.getPath('userData'), 'history.json');
        if (fs.existsSync(historyPath)) {
            const data = fs.readFileSync(historyPath, 'utf-8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('读取历史失败:', error);
        return [];
    }
});