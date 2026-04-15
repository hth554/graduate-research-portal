// js/ui/Toast.js
// 轻提示组件

class Toast {
    constructor() {
        this.container = null;
        this.initContainer();
    }

    initContainer() {
        // 创建专用容器
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    /**
     * 显示提示
     * @param {string} message 消息内容
     * @param {string} type 类型：success, error, warning, info
     * @param {number} duration 持续时间（毫秒），0 表示不自动关闭
     * @returns {HTMLElement} toast 元素
     */
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 12px 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 280px;
            max-width: 400px;
            pointer-events: auto;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            border-left: 4px solid;
        `;

        // 根据类型设置样式
        const typeStyles = {
            success: { bg: '#d4edda', color: '#155724', border: '#28a745', icon: 'check-circle' },
            error: { bg: '#f8d7da', color: '#721c24', border: '#dc3545', icon: 'exclamation-circle' },
            warning: { bg: '#fff3cd', color: '#856404', border: '#ffc107', icon: 'exclamation-triangle' },
            info: { bg: '#d1ecf1', color: '#0c5460', border: '#17a2b8', icon: 'info-circle' }
        };

        const style = typeStyles[type] || typeStyles.info;
        toast.style.background = style.bg;
        toast.style.color = style.color;
        toast.style.borderLeftColor = style.border;

        toast.innerHTML = `
            <i class="fas fa-${style.icon}" style="font-size: 1.2rem;"></i>
            <span style="flex: 1; font-weight: 500;">${this.escapeHtml(message)}</span>
            <button class="toast-close" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem; opacity: 0.6;">&times;</button>
        `;

        this.container.appendChild(toast);

        // 绑定关闭事件
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.close(toast));

        // 动画入场
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);

        // 自动关闭
        if (duration > 0) {
            setTimeout(() => this.close(toast), duration);
        }

        return toast;
    }

    close(toast) {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 导出单例
export default new Toast();