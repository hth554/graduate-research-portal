// js/app.js
// 应用入口，集成所有模块

import EventBus, { EVENTS } from './core/EventBus.js';
import ApiClient from './core/ApiClient.js';
import DataService from './services/DataService.js';
import Renderer from './ui/Renderer.js';
import ModalManager from './ui/ModalManager.js';
import Toast from './ui/Toast.js';
import { STORAGE_KEYS } from './config/constants.js';

// 监听 Toast 事件
EventBus.on(EVENTS.UI_SHOW_TOAST, ({ message, type }) => {
    Toast.show(message, type);
});

// 主题切换
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

// 移动端菜单
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.querySelector('.nav-menu');
    hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// 返回顶部
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        btn.classList.toggle('show', window.scrollY > 300);
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// 管理面板按钮
function initAdminPanel() {
    const adminToggle = document.getElementById('admin-toggle');
    if (adminToggle) {
        adminToggle.addEventListener('click', (e) => {
            e.preventDefault();
            if (ApiClient.hasValidToken()) {
                // 已登录则退出
                ApiClient.clearToken();
                EventBus.emit(EVENTS.AUTH_CHANGED);
                Toast.info('已退出管理员模式');
            } else {
                // 未登录则弹出 Token 输入框
                EventBus.emit('ui:request-token', {
                    callback: () => {
                        EventBus.emit(EVENTS.AUTH_CHANGED);
                        DataService.syncFromGitHub();
                    }
                });
            }
        });
    }
}

// 启动应用
async function init() {
    console.log('🚀 应用启动...');
    
    // 初始化 UI 组件
    initTheme();
    initMobileMenu();
    initBackToTop();
    initAdminPanel();
    
    // 注意：Renderer 和 ModalManager 通过 import 会自动初始化（它们的构造函数会执行）
    // 只需确保它们被导入即可
    
    // 尝试从 GitHub 同步数据
    try {
        await DataService.syncFromGitHub();
    } catch (error) {
        console.warn('初始同步失败，使用本地数据', error);
    }
    
    // 显示连接状态
    const statusDiv = document.getElementById('permission-status');
    const statusMsg = document.getElementById('status-message');
    if (statusDiv && statusMsg) {
        if (ApiClient.hasValidToken()) {
            statusMsg.innerHTML = '🔓 管理员模式 | 数据实时同步';
            statusDiv.className = 'permission-status status-authenticated';
        } else {
            statusMsg.innerHTML = '👁️ 游客模式 | 只能查看数据';
            statusDiv.className = 'permission-status status-guest';
        }
        statusDiv.style.display = 'block';
    }
    
    console.log('✅ 应用初始化完成');
}

// 启动
init();