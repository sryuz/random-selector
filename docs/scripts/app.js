// 主应用逻辑

import { Wheel } from './wheel.js';
import { audioManager } from './audio.js';

class RandomSelectorApp {
    constructor() {
        this.wheel = null;
        this.options = ['选项A', '选项B', '选项C'];
        this.history = [];
        this.isSpinning = false;

        this.initElements();
        this.initEventListeners();
        this.init();
    }

    // 初始化 DOM 元素引用
    initElements() {
        this.canvas = document.getElementById('wheel-canvas');
        this.startBtn = document.getElementById('start-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.resultDisplay = document.getElementById('result');
        this.optionsContainer = document.getElementById('options-container');
        this.addOptionBtn = document.getElementById('add-option');
        this.clearAllBtn = document.getElementById('clear-all');
        this.historyContainer = document.getElementById('history-container');
        this.clearHistoryBtn = document.getElementById('clear-history');
        this.volumeSlider = document.getElementById('volume-slider');
        this.muteBtn = document.getElementById('mute-btn');
    }

    // 初始化事件监听器
    initEventListeners() {
        // 开始按钮
        this.startBtn.addEventListener('click', () => this.startSpin());

        // 停止按钮（当前版本轮盘自动停止，此按钮预留给未来功能）
        this.stopBtn.addEventListener('click', () => this.stopSpin());

        // 添加选项
        this.addOptionBtn.addEventListener('click', () => this.addOption());

        // 清空所有选项
        this.clearAllBtn.addEventListener('click', () => this.clearAllOptions());

        // 清空历史
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        // 音量控制
        this.volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            audioManager.setVolume(volume);
            this.updateMuteButton(volume === 0);
        });

        // 静音按钮
        this.muteBtn.addEventListener('click', () => this.toggleMute());

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isSpinning) {
                e.preventDefault();
                this.startSpin();
            }
        });
    }

    // 初始化应用
    async init() {
        // 初始化音效
        await audioManager.loadSounds();

        // 加载保存的配置
        await this.loadSavedConfig();

        // 加载历史记录
        await this.loadHistory();

        // 初始化轮盘
        this.initWheel();

        // 渲染选项列表
        this.renderOptions();
    }

    // 初始化轮盘
    initWheel() {
        this.wheel = new Wheel(this.canvas, this.options);

        // 设置轮盘完成回调
        this.wheel.onComplete = (result, index) => {
            this.onSpinComplete(result, index);
        };

        // 设置滴答声回调
        this.wheel.onTick = () => {
            audioManager.playTickThrottled();
        };
    }

    // 开始旋转
    async startSpin() {
        if (this.isSpinning) return;
        if (this.options.length < 2) {
            this.showMessage('请至少添加 2 个选项');
            return;
        }

        // 恢复 AudioContext（需要用户交互）
        await audioManager.resumeContext();

        this.isSpinning = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.resultDisplay.textContent = '旋转中...';
        this.resultDisplay.classList.remove('highlight');

        // 播放开始音效
        audioManager.play('spin');

        // 开始轮盘旋转
        this.wheel.startSpin();
    }

    // 停止旋转
    stopSpin() {
        // 当前版本轮盘自动停止
        // 未来可以添加手动提前停止功能
    }

    // 旋转完成
    onSpinComplete(result, index) {
        this.isSpinning = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;

        // 播放结果音效
        audioManager.playResult();

        // 显示结果
        this.resultDisplay.textContent = `🎉 结果：${result}`;
        this.resultDisplay.classList.add('highlight');

        // 保存到历史
        this.addToHistory(result);

        // 更新轮盘显示
        this.wheel.draw();
    }

    // 渲染选项列表
    renderOptions() {
        this.optionsContainer.innerHTML = '';

        this.options.forEach((option, index) => {
            const item = document.createElement('div');
            item.className = 'option-item';
            item.innerHTML = `
                <input type="text" value="${option}" data-index="${index}"
                       placeholder="输入选项内容">
                <button class="remove-btn" data-index="${index}">×</button>
            `;
            this.optionsContainer.appendChild(item);
        });

        // 绑定输入事件
        this.optionsContainer.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.options[index] = e.target.value.trim() || `选项${index + 1}`;
                this.wheel.setOptions(this.options);
                this.saveConfig();
            });
        });

        // 绑定删除按钮事件
        this.optionsContainer.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.options.length <= 2) {
                    this.showMessage('至少需要 2 个选项');
                    return;
                }
                const index = parseInt(e.target.dataset.index);
                this.removeOption(index);
            });
        });
    }

    // 添加选项
    addOption() {
        if (this.options.length >= 12) {
            this.showMessage('最多支持 12 个选项');
            return;
        }

        this.options.push(`选项${String.fromCharCode(65 + this.options.length)}`);
        this.renderOptions();
        this.wheel.setOptions(this.options);
        this.saveConfig();
    }

    // 移除选项
    removeOption(index) {
        this.options.splice(index, 1);
        this.renderOptions();
        this.wheel.setOptions(this.options);
        this.saveConfig();
    }

    // 清空所有选项
    clearAllOptions() {
        if (confirm('确定要清空所有选项吗？')) {
            this.options = ['选项A', '选项B', '选项C'];
            this.renderOptions();
            this.wheel.setOptions(this.options);
            this.saveConfig();
        }
    }

    // 添加到历史记录
    addToHistory(result) {
        const now = new Date();
        const timeStr = now.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        this.history.unshift({
            result,
            time: timeStr,
            options: [...this.options]
        });

        // 最多保存 50 条记录
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }

        this.renderHistory();
        this.saveHistory();
    }

    // 渲染历史记录
    renderHistory() {
        this.historyContainer.innerHTML = '';

        if (this.history.length === 0) {
            this.historyContainer.innerHTML = '<div style="color: #9ca3af; text-align: center; padding: 20px;">暂无历史记录</div>';
            return;
        }

        this.history.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <span class="result-text">${item.result}</span>
                <span class="time">${item.time}</span>
            `;
            this.historyContainer.appendChild(div);
        });
    }

    // 清空历史
    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            this.history = [];
            this.renderHistory();
            this.saveHistory();
        }
    }

    // 切换静音
    toggleMute() {
        const muted = audioManager.toggleMute();
        this.updateMuteButton(muted || audioManager.getVolume() === 0);
    }

    // 更新静音按钮状态
    updateMuteButton(muted) {
        this.muteBtn.textContent = muted ? '🔇' : '🔈';
    }

    // 显示消息
    showMessage(msg) {
        // 简单的提示，可以使用 alert 或更优雅的方式
        alert(msg);
    }

    // 保存配置
    async saveConfig() {
        if (window.electronAPI) {
            await window.electronAPI.saveConfig({
                options: this.options,
                volume: audioManager.getVolume(),
                muted: audioManager.muted
            });
        } else {
            // 浏览器环境使用 localStorage
            localStorage.setItem('random-selector-config', JSON.stringify({
                options: this.options,
                volume: audioManager.getVolume(),
                muted: audioManager.muted
            }));
        }
    }

    // 加载保存的配置
    async loadSavedConfig() {
        let config = null;

        if (window.electronAPI) {
            config = await window.electronAPI.loadConfig();
        } else {
            const saved = localStorage.getItem('random-selector-config');
            if (saved) {
                config = JSON.parse(saved);
            }
        }

        if (config) {
            if (config.options && config.options.length >= 2) {
                this.options = config.options;
            }
            if (config.volume !== undefined) {
                audioManager.setVolume(config.volume);
                this.volumeSlider.value = config.volume * 100;
            }
            if (config.muted !== undefined) {
                audioManager.setMuted(config.muted);
                this.updateMuteButton(config.muted);
            }
        }
    }

    // 保存历史记录
    async saveHistory() {
        if (window.electronAPI) {
            await window.electronAPI.saveHistory(this.history);
        } else {
            localStorage.setItem('random-selector-history', JSON.stringify(this.history));
        }
    }

    // 加载历史记录
    async loadHistory() {
        if (window.electronAPI) {
            this.history = await window.electronAPI.loadHistory() || [];
        } else {
            const saved = localStorage.getItem('random-selector-history');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        }
        this.renderHistory();
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new RandomSelectorApp();
});