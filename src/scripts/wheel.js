// 轮盘动画模块

// 预定义的轮盘颜色
const COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#a855f7', '#d946ef'
];

export class Wheel {
    constructor(canvas, options = []) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = options.length > 0 ? options : ['选项A', '选项B', '选项C'];
        this.angle = 0;
        this.targetAngle = 0;
        this.isSpinning = false;
        this.animationId = null;
        this.onComplete = null;
        this.onTick = null;

        // 初始绘制
        this.draw();
    }

    // 更新选项
    setOptions(options) {
        if (options && options.length >= 2) {
            this.options = options;
            this.draw();
        }
    }

    // 获取扇形颜色
    getColor(index) {
        return COLORS[index % COLORS.length];
    }

    // 绘制轮盘
    draw() {
        const { ctx, canvas, options, angle } = this;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const sliceAngle = (2 * Math.PI) / options.length;

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 保存状态并旋转
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);

        // 绘制每个扇形
        options.forEach((option, i) => {
            const startAngle = i * sliceAngle;
            const endAngle = startAngle + sliceAngle;

            // 绘制扇形
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = this.getColor(i);
            ctx.fill();

            // 绘制边框
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 绘制文字
            ctx.save();
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px "Segoe UI", "Microsoft YaHei", sans-serif';

            // 文字截断
            const maxLen = 10;
            const displayText = option.length > maxLen
                ? option.substring(0, maxLen) + '...'
                : option;

            ctx.fillText(displayText, radius - 15, 0);
            ctx.restore();
        });

        // 绘制中心圆
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, 2 * Math.PI);
        ctx.fillStyle = '#1f2937';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
    }

    // 缓动函数 - 四次缓出
    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    // 开始旋转
    startSpin() {
        if (this.isSpinning || this.options.length < 2) return;

        this.isSpinning = true;

        // 随机选择结果
        const resultIndex = Math.floor(Math.random() * this.options.length);
        const sliceAngle = (2 * Math.PI) / this.options.length;

        // 固定旋转圈数：6-8 圈，保证力度足够
        const extraSpins = 6 + Math.floor(Math.random() * 3);

        // 计算目标停止角度（相对于 Canvas 的绝对位置）
        // 指针在顶部（-π/2 位置），让目标扇形中心对准指针
        // 添加随机偏移，让结果更自然（在扇形中间 60% 范围内）
        const randomOffset = (Math.random() - 0.5) * sliceAngle * 0.6;
        const targetSliceCenter = resultIndex * sliceAngle + sliceAngle / 2 + randomOffset;
        const targetStopAngle = (3 * Math.PI / 2) - targetSliceCenter;

        // 计算从当前角度顺时针旋转到目标位置需要的角度
        // 归一化当前角度和目标停止角度到 [0, 2π)
        const currentNorm = ((this.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const targetNorm = ((targetStopAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

        // 计算顺时针方向需要旋转的角度
        let rotationToTarget = targetNorm - currentNorm;
        if (rotationToTarget <= 0) {
            rotationToTarget += 2 * Math.PI; // 确保顺时针至少转一点
        }

        // 目标角度 = 当前角度 + 固定圈数 + 到目标的旋转量
        this.targetAngle = this.angle + extraSpins * 2 * Math.PI + rotationToTarget;

        this.animate(resultIndex);
    }

    // 动画循环
    animate(resultIndex) {
        const duration = 4000 + Math.random() * 1000; // 4-5秒
        const startTime = performance.now();
        const startAngle = this.angle;
        const totalRotation = this.targetAngle - this.angle;

        let lastTickAngle = this.angle;
        const tickInterval = (2 * Math.PI) / this.options.length * 0.8;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = this.easeOutQuart(progress);

            this.angle = startAngle + totalRotation * easedProgress;
            this.draw();

            // 触发滴答声
            if (this.onTick && (this.angle - lastTickAngle) > tickInterval) {
                this.onTick();
                lastTickAngle = this.angle;
            }

            if (progress < 1) {
                this.animationId = requestAnimationFrame(step);
            } else {
                this.isSpinning = false;
                if (this.onComplete) {
                    this.onComplete(this.options[resultIndex], resultIndex);
                }
            }
        };

        this.animationId = requestAnimationFrame(step);
    }

    // 停止旋转（加速停止）
    stopSpin() {
        // 当前实现中轮盘会自动停止
        // 此方法可用于未来扩展
    }

    // 重置
    reset() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.angle = 0;
        this.isSpinning = false;
        this.draw();
    }

    // 获取当前指向的选项
    getCurrentOption() {
        const sliceAngle = (2 * Math.PI) / this.options.length;
        const normalizedAngle = (((-this.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) + Math.PI / 2) % (2 * Math.PI);
        const index = Math.floor(normalizedAngle / sliceAngle);
        return this.options[index];
    }
}