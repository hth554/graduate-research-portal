// js/admin-system.js - 管理员系统（简化版，无需登录）
class AdminSystem {
    constructor() {
        this.isAdmin = false; // 默认不是管理员
        this.editMode = false;
        
        this.init();
    }

    // 初始化
    init() {
        this.bindEvents();
        this.updateUI();
    }

    // 绑定事件
    bindEvents() {
        // 编辑按钮
        const editButtons = [
            'edit-projects-btn',
            'edit-advisors-btn',
            'edit-students-btn',
            'edit-publications-btn',
            'edit-updates-btn'
        ];

        editButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => this.toggleEditMode());
            }
        });

        // 管理员切换
        const adminToggle = document.getElementById('admin-toggle');
        if (adminToggle) {
            adminToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAdminMode();
            });
        }
    }

    // 切换管理员模式
    toggleAdminMode() {
        this.isAdmin = !this.isAdmin;
        if (this.isAdmin) {
            this.editMode = true;
            this.showLoginMessage('已进入管理员模式', 'success');
        } else {
            this.editMode = false;
            this.showLoginMessage('已退出管理员模式', 'info');
        }
        this.updateUI();
        this.reloadPageData();
    }

    // 切换编辑模式
    toggleEditMode() {
        if (!this.isAdmin) {
            this.showLoginMessage('请先进入管理员模式', 'warning');
            return;
        }
        
        this.editMode = !this.editMode;
        this.updateEditModeUI();
        this.reloadPageData();
    }

    // 显示消息
    showLoginMessage(message, type) {
        // 创建一个简单的消息提示
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 9999;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span style="margin-left: 10px;">${message}</span>
        `;
        
        document.body.appendChild(messageDiv);
        
        // 3秒后移除消息
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
        
        // 添加动画样式
        if (!document.querySelector('#message-styles')) {
            const style = document.createElement('style');
            style.id = 'message-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .alert-success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .alert-info {
                    background-color: #d1ecf1;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                }
                .alert-warning {
                    background-color: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeaa7;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 更新UI状态
    updateUI() {
        const adminStatus = document.getElementById('admin-status');
        
        if (this.isAdmin) {
            // 显示编辑按钮
            this.showEditButtons(true);
            
            // 更新状态显示
            if (adminStatus) {
                adminStatus.innerHTML = `<i class="fas fa-user-shield"></i> 管理员模式`;
                adminStatus.style.color = '#2ecc71';
            }
            
            // 更新管理员切换按钮
            const adminToggle = document.getElementById('admin-toggle');
            if (adminToggle) {
                adminToggle.innerHTML = '<i class="fas fa-user-shield"></i> 退出管理';
                adminToggle.style.color = '#e74c3c';
            }
        } else {
            // 隐藏编辑按钮
            this.showEditButtons(false);
            
            // 更新状态显示
            if (adminStatus) {
                adminStatus.innerHTML = `<i class="fas fa-user"></i> 游客模式`;
                adminStatus.style.color = '#aaa';
            }
            
            // 更新管理员切换按钮
            const adminToggle = document.getElementById('admin-toggle');
            if (adminToggle) {
                adminToggle.innerHTML = '<i class="fas fa-user-shield"></i> 管理';
                adminToggle.style.color = '';
            }
        }
        
        // 更新编辑模式
        this.updateEditModeUI();
    }

    // 显示/隐藏编辑按钮
    showEditButtons(show) {
        const editButtons = [
            'edit-projects-btn',
            'edit-advisors-btn',
            'edit-students-btn',
            'edit-publications-btn',
            'edit-updates-btn'
        ];
        
        editButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.style.display = show ? 'inline-block' : 'none';
            }
        });
    }

    // 更新编辑模式UI
    updateEditModeUI() {
        const editButtons = document.querySelectorAll('[id^="edit-"]');
        
        if (this.editMode && this.isAdmin) {
            // 显示所有编辑按钮为激活状态
            editButtons.forEach(btn => {
                btn.classList.add('active');
                btn.innerHTML = btn.innerHTML.replace('编辑', '退出编辑');
            });
            
            // 添加编辑模式CSS类到body
            document.body.classList.add('edit-mode');
        } else {
            // 恢复编辑按钮
            editButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.innerHTML = btn.innerHTML.replace('退出编辑', '编辑');
            });
            
            // 移除编辑模式CSS类
            document.body.classList.remove('edit-mode');
        }
    }

    // 重新加载页面数据
    reloadPageData() {
        // 触发自定义事件，让其他模块重新渲染
        const event = new CustomEvent('adminModeChanged', {
            detail: { 
                editMode: this.editMode,
                isAdmin: this.isAdmin 
            }
        });
        document.dispatchEvent(event);
    }

    // 获取当前状态
    getStatus() {
        return {
            isAdmin: this.isAdmin,
            editMode: this.editMode
        };
    }
}

// 创建全局实例
window.adminSystem = new AdminSystem();
