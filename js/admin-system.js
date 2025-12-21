// js/admin-system.js - 管理员系统
class AdminSystem {
    constructor() {
        this.isAdmin = false;
        this.adminToken = localStorage.getItem('admin_token');
        this.githubToken = localStorage.getItem('github_admin_token');
        this.editMode = false;
        
        this.init();
    }

    // 初始化
    init() {
        // 检查是否已登录
        this.checkLoginStatus();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化UI
        this.updateUI();
    }

    // 检查登录状态
    checkLoginStatus() {
        if (this.adminToken || this.githubToken) {
            this.isAdmin = true;
        }
    }

    // 绑定事件
    bindEvents() {
        // 登录按钮
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        // 退出按钮
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // 关闭模态框
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideLoginModal());
        }

        // 点击模态框外部关闭
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideLoginModal();
                }
            });
        }

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
                this.toggleEditMode();
            });
        }
    }

    // 显示登录模态框
    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // 隐藏登录模态框
    hideLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 使用GitHub Token登录
    async loginWithGitHubToken() {
        const tokenInput = document.getElementById('github-token-login');
        const messageDiv = document.getElementById('login-message');
        
        if (!tokenInput) return;

        const token = tokenInput.value.trim();
        
        if (!token) {
            this.showLoginMessage('请输入GitHub Token', 'error');
            return;
        }

        // 验证Token
        try {
            this.showLoginMessage('验证Token中...', 'info');
            
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.githubToken = token;
                localStorage.setItem('github_admin_token', token);
                this.isAdmin = true;
                this.hideLoginModal();
                this.updateUI();
                this.showLoginMessage('GitHub Token登录成功！', 'success');
                
                // 尝试从GitHub加载数据
                try {
                    await window.dataManager.syncAllDataFromGitHub(token);
                    this.showLoginMessage('数据同步成功！', 'success');
                    // 重新加载页面数据
                    this.reloadPageData();
                } catch (syncError) {
                    console.warn('数据同步失败:', syncError);
                }
            } else {
                this.showLoginMessage('Token无效，请检查权限', 'error');
            }
        } catch (error) {
            console.error('登录失败:', error);
            this.showLoginMessage('网络错误，请稍后重试', 'error');
        }
    }

    // 使用密码登录
    loginWithPassword() {
        const passwordInput = document.getElementById('password-login');
        const messageDiv = document.getElementById('login-message');
        
        if (!passwordInput) return;

        const password = passwordInput.value.trim();
        
        // 默认密码：admin123 （可以在生产环境中修改）
        if (password === 'admin123') {
            this.adminToken = 'local_admin_' + Date.now();
            localStorage.setItem('admin_token', this.adminToken);
            this.isAdmin = true;
            this.hideLoginModal();
            this.updateUI();
            this.showLoginMessage('密码登录成功！', 'success');
        } else {
            this.showLoginMessage('密码错误', 'error');
        }
    }

    // 显示登录消息
    showLoginMessage(message, type) {
        const messageDiv = document.getElementById('login-message');
        if (!messageDiv) return;
        
        messageDiv.innerHTML = `
            <div class="alert alert-${type}" style="margin-top: 15px;">
                ${message}
            </div>
        `;
        
        // 3秒后清除消息
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    }

    // 退出登录
    logout() {
        this.isAdmin = false;
        this.editMode = false;
        this.adminToken = null;
        this.githubToken = null;
        
        localStorage.removeItem('admin_token');
        localStorage.removeItem('github_admin_token');
        
        this.updateUI();
        this.showLoginMessage('已退出登录', 'info');
        
        // 重新加载页面以退出编辑模式
        location.reload();
    }

    // 更新UI状态
    updateUI() {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const adminNavItem = document.getElementById('admin-nav-item');
        const adminStatus = document.getElementById('admin-status');
        
        if (this.isAdmin) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (adminNavItem) adminNavItem.style.display = 'list-item';
            
            // 显示编辑按钮
            this.showEditButtons(true);
            
            // 更新状态显示
            if (adminStatus) {
                const tokenType = this.githubToken ? 'GitHub Token' : '本地密码';
                adminStatus.innerHTML = `<i class="fas fa-user-shield"></i> 管理员已登录 (${tokenType})`;
                adminStatus.style.color = '#2ecc71';
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (adminNavItem) adminNavItem.style.display = 'none';
            
            // 隐藏编辑按钮
            this.showEditButtons(false);
            
            // 更新状态显示
            if (adminStatus) {
                adminStatus.innerHTML = `<i class="fas fa-user"></i> 游客模式`;
                adminStatus.style.color = '#aaa';
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

    // 切换编辑模式
    toggleEditMode() {
        if (!this.isAdmin) {
            this.showLoginModal();
            return;
        }
        
        this.editMode = !this.editMode;
        this.updateEditModeUI();
        
        // 重新渲染内容
        this.reloadPageData();
    }

    // 更新编辑模式UI
    updateEditModeUI() {
        const adminToggle = document.getElementById('admin-toggle');
        const editButtons = document.querySelectorAll('[id^="edit-"]');
        
        if (this.editMode) {
            if (adminToggle) {
                adminToggle.innerHTML = '<i class="fas fa-edit"></i> 退出编辑';
                adminToggle.style.color = '#e74c3c';
            }
            
            // 显示所有编辑按钮为激活状态
            editButtons.forEach(btn => {
                btn.classList.add('active');
                btn.innerHTML = btn.innerHTML.replace('编辑', '退出编辑');
            });
            
            // 添加编辑模式CSS类到body
            document.body.classList.add('edit-mode');
        } else {
            if (adminToggle) {
                adminToggle.innerHTML = '<i class="fas fa-user-shield"></i> 管理';
                adminToggle.style.color = '';
            }
            
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
            detail: { editMode: this.editMode }
        });
        document.dispatchEvent(event);
    }

    // 保存数据到GitHub
    async saveToGitHub() {
        if (!this.githubToken) {
            alert('请使用GitHub Token登录以保存到GitHub');
            return false;
        }
        
        try {
            const results = await window.dataManager.syncAllDataToGitHub(this.githubToken);
            console.log('保存到GitHub结果:', results);
            return true;
        } catch (error) {
            console.error('保存到GitHub失败:', error);
            alert('保存到GitHub失败: ' + error.message);
            return false;
        }
    }

    // 从GitHub加载数据
    async loadFromGitHub() {
        if (!this.githubToken) {
            alert('请使用GitHub Token登录以从GitHub加载');
            return false;
        }
        
        try {
            await window.dataManager.syncAllDataFromGitHub(this.githubToken);
            this.reloadPageData();
            return true;
        } catch (error) {
            console.error('从GitHub加载失败:', error);
            alert('从GitHub加载失败: ' + error.message);
            return false;
        }
    }

    // 导出数据
    exportData() {
        const data = window.dataManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'research-portal-data-' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 导入数据
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const success = window.dataManager.importData(e.target.result);
            if (success) {
                alert('数据导入成功！');
                this.reloadPageData();
            } else {
                alert('数据导入失败，请检查文件格式');
            }
        };
        reader.readAsText(file);
    }

    // 获取当前状态
    getStatus() {
        return {
            isAdmin: this.isAdmin,
            editMode: this.editMode,
            hasGitHubToken: !!this.githubToken
        };
    }
}

// 创建全局实例
window.adminSystem = new AdminSystem();

// 全局登录函数（供HTML按钮调用）
window.loginWithGitHubToken = function() {
    window.adminSystem.loginWithGitHubToken();
};

window.loginWithPassword = function() {
    window.adminSystem.loginWithPassword();
};
