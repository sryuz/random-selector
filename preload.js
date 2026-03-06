// Electron 预加载脚本 - 安全桥接主进程和渲染进程
const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 配置管理
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    loadConfig: () => ipcRenderer.invoke('load-config'),

    // 历史记录
    saveHistory: (history) => ipcRenderer.invoke('save-history', history),
    loadHistory: () => ipcRenderer.invoke('load-history'),

    // 平台信息
    platform: process.platform
});