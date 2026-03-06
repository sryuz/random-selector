// 音效管理模块

export class AudioManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.volume = 0.7;
        this.lastTickTime = 0;
        this.tickThrottle = 80; // 滴答声节流间隔（毫秒）
    }

    // 预加载音效（使用 Web Audio API 生成简单音效）
    async loadSounds() {
        // 使用 Web Audio API 生成音效，避免外部文件依赖
        this.audioContext = null;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API 不支持，音效将被禁用');
            return;
        }

        // 预定义音效参数
        this.soundConfigs = {
            tick: { frequency: 800, duration: 0.05, type: 'sine' },
            spin: { frequency: 440, duration: 0.2, type: 'sine' },
            result: { frequency: 523.25, duration: 0.5, type: 'sine' }
        };
    }

    // 播放音效
    play(soundName) {
        if (this.muted || !this.audioContext) return;

        const config = this.soundConfigs[soundName];
        if (!config) return;

        try {
            // 确保 AudioContext 处于运行状态
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = config.type;
            oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);

            // 音量包络
            gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + config.duration);
        } catch (e) {
            console.warn('播放音效失败:', e);
        }
    }

    // 播放滴答声（节流）
    playTickThrottled() {
        const now = Date.now();
        if (now - this.lastTickTime < this.tickThrottle) return;
        this.lastTickTime = now;
        this.play('tick');
    }

    // 播放结果音效（和弦效果）
    playResult() {
        if (this.muted || !this.audioContext) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // 播放一个简单的大调和弦
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
            const duration = 0.8;

            frequencies.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);

                // 延迟每个音符的开始时间
                const startTime = this.audioContext.currentTime + index * 0.1;
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            });
        } catch (e) {
            console.warn('播放结果音效失败:', e);
        }
    }

    // 设置音量
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }

    // 获取音量
    getVolume() {
        return this.volume;
    }

    // 切换静音
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    // 设置静音
    setMuted(muted) {
        this.muted = muted;
    }

    // 恢复 AudioContext（用户交互后调用）
    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
}

// 导出单例
export const audioManager = new AudioManager();