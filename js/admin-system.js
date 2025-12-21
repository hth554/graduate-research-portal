// js/admin-system.js - 管理员系统（简化版，实时同步）
class AdminSystem {
    constructor() {
        this.isAdmin = false;
        this.editMode = false;
        this.githubToken = null;
        this.syncStatus = {
            lastSync: null,
            connected: false,
            autoSync: false,
            error: null
        };
        
        this.init();
    }

    // 初始化
    init() {
        console.log('AdminSystem 初始化...');
        
        // 从localStorage获取GitHub Token
        this.githubToken = localStorage.getItem('github_admin_token');
        
        // 如果已有Token，设置到dataManager
        if (this.githubToken && window.dataManager) {
            window.dataManager.setGitHubToken(this.githubToken);
        }
        
        this.bindEvents();
        this.updateUI();
        
        // 监听数据更新事件
        document.addEventListener('dataUpdated', () => this.updateSyncStatus());
        document.addEventListener('dataSaved', () => this.updateSyncStatus());
        
        // 检查GitHub连接状态
        this.checkGitHubConnection();
        
        console.log('AdminSystem 初始化完成');
    }

    // 绑定事件
    bindEvents() {
        // 管理员切换按钮
        const adminToggle = document.getElementById('admin-toggle');
        if (adminToggle) {
            adminToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAdminMode();
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

        // 添加新的管理面板按钮
        const navActions = document.querySelector('.nav-actions');
        if (navActions && !navActions.querySelector('#admin-panel-btn')) {
            const adminPanelBtn = document.createElement('button');
            adminPanelBtn.id = 'admin-panel-btn';
            adminPanelBtn.className = 'btn btn-outline';
            adminPanelBtn.innerHTML = '<i class="fas fa-cog"></i> 管理面板';
            adminPanelBtn.title = '打开管理面板';
            adminPanelBtn.addEventListener('click', () => this.showAdminPanel());
            
            navActions.insertBefore(adminPanelBtn, document.getElementById('theme-toggle'));
        }
    }

    // 切换管理员模式
    async toggleAdminMode() {
        this.isAdmin = !this.isAdmin;
        
        if (this.isAdmin) {
            this.editMode = true;
            this.showMessage('已进入管理员模式', 'success');
            
            // 停止自动同步（避免冲突）
            if (window.dataManager) {
                window.dataManager.stopAutoSync();
            }
        } else {
            this.editMode = false;
            this.showMessage('已退出管理员模式', 'info');
            
            // 恢复自动同步
            if (window.dataManager) {
                window.dataManager.startAutoSync();
            }
            
            // 同步数据到GitHub
            await this.syncToGitHub();
        }
        
        this.updateUI();
        this.reloadPageData();
    }

    // 切换编辑模式
    toggleEditMode() {
        if (!this.isAdmin) {
            this.showMessage('请先进入管理员模式', 'warning');
            return;
        }
        
        this.editMode = !this.editMode;
        this.updateEditModeUI();
        this.reloadPageData();
    }

    // 显示管理面板
    showAdminPanel() {
        const stats = window.dataManager ? window.dataManager.getStats() : {
            advisors: 0, students: 0, projects: 0, publications: 0, updates: 0,
            lastSyncTime: null, dataVersion: '0', hasGitHubToken: false
        };
        
        const modal = this.createModal();
        modal.innerHTML = `
            <div class="modal-content admin-panel">
                <div class="modal-header">
                    <h3><i class="fas fa-cog"></i> 系统管理面板</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="admin-sections">
                        <!-- GitHub 配置 -->
                        <section class="admin-section">
                            <h4><i class="fab fa-github"></i> GitHub 配置</h4>
                            <div class="form-group">
                                <label for="github-token-input">GitHub Personal Access Token</label>
                                <div class="input-group">
                                    <input type="password" id="github-token-input" 
                                           placeholder="ghp_ 或 github_pat_ 开头"
                                           value="${this.githubToken || ''}">
                                    <button class="btn btn-primary" id="save-token-btn">
                                        <i class="fas fa-save"></i> 保存
                                    </button>
                                </div>
                                <p class="help-text">
                                    需要 repo 权限来读写数据。获取Token：
                                    <a href="https://github.com/settings/tokens" target="_blank">
                                        https://github.com/settings/tokens
                                    </a>
                                </p>
                            </div>
                            
                            <div class="form-group">
                                <label>GitHub 连接状态</label>
                                <div id="github-status" class="status-indicator">
                                    <span class="status-dot ${this.syncStatus.connected ? 'connected' : 'disconnected'}"></span>
                                    <span class="status-text">
                                        ${this.syncStatus.connected ? '已连接' : '未连接'}
                                    </span>
                                </div>
                                <button class="btn btn-outline" id="check-connection-btn">
                                    <i class="fas fa-sync-alt"></i> 检查连接
                                </button>
                            </div>
                        </section>

                        <!-- 数据统计 -->
                        <section class="admin-section">
                            <h4><i class="fas fa-chart-bar"></i> 数据统计</h4>
                            <div class="admin-stats">
                                <div class="stat-card">
                                    <h5>${stats.projects}</h5>
                                    <p>研究课题</p>
                                </div>
                                <div class="stat-card">
                                    <h5>${stats.advisors}</h5>
                                    <p>指导老师</p>
                                </div>
                                <div class="stat-card">
                                    <h5>${stats.students}</h5>
                                    <p>研究生</p>
                                </div>
                                <div class="stat-card">
                                    <h5>${stats.publications}</h5>
                                    <p>学术成果</p>
                                </div>
                                <div class="stat-card">
                                    <h5>${stats.updates}</h5>
                                    <p>研究近况</p>
                                </div>
                            </div>
                        </section>

                        <!-- 同步状态 -->
                        <section class="admin-section">
                            <h4><i class="fas fa-sync-alt"></i> 数据同步</h4>
                            <div class="sync-status">
                                <div class="sync-item">
                                    <span class="sync-label">最后同步时间：</span>
                                    <span class="sync-value">${stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : '从未同步'}</span>
                                </div>
                                <div class="sync-item">
                                    <span class="sync-label">数据版本：</span>
                                    <span class="sync-value">${stats.dataVersion}</span>
                                </div>
                                <div class="sync-item">
                                    <span class="sync-label">自动同步：</span>
                                    <span class="sync-value ${window.dataManager && window.dataManager.autoSyncTimer ? 'enabled' : 'disabled'}">
                                        ${window.dataManager && window.dataManager.autoSyncTimer ? '已启用' : '已禁用'}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="sync-actions">
                                <button class="btn btn-primary" id="manual-sync-btn">
                                    <i class="fas fa-cloud-upload-alt"></i> 手动同步
                                </button>
                                <button class="btn btn-outline" id="toggle-sync-btn">
                                    <i class="fas fa-toggle-${window.dataManager && window.dataManager.autoSyncTimer ? 'on' : 'off'}"></i>
                                    ${window.dataManager && window.dataManager.autoSyncTimer ? '关闭自动同步' : '开启自动同步'}
                                </button>
                            </div>
                        </section>

                        <!-- 快速操作 -->
                        <section class="admin-section">
                            <h4><i class="fas fa-bolt"></i> 快速操作</h4>
                            <div class="quick-actions">
                                <button class="btn btn-outline action-btn" data-action="add-project">
                                    <i class="fas fa-plus"></i> 添加课题
                                </button>
                                <button class="btn btn-outline action-btn" data-action="add-advisor">
                                    <i class="fas fa-user-plus"></i> 添加导师
                                </button>
                                <button class="btn btn-outline action-btn" data-action="add-student">
                                    <i class="fas fa-user-graduate"></i> 添加学生
                                </button>
                                <button class="btn btn-outline action-btn" data-action="add-publication">
                                    <i class="fas fa-book"></i> 添加成果
                                </button>
                                <button class="btn btn-outline action-btn" data-action="add-update">
                                    <i class="fas fa-newspaper"></i> 添加近况
                                </button>
                            </div>
                        </section>

                        <!-- 数据管理 -->
                        <section class="admin-section">
                            <h4><i class="fas fa-database"></i> 数据管理</h4>
                            <div class="data-actions">
                                <button class="btn btn-outline" id="export-data-btn">
                                    <i class="fas fa-download"></i> 导出数据
                                </button>
                                <button class="btn btn-outline" id="import-data-btn">
                                    <i class="fas fa-upload"></i> 导入数据
                                </button>
                                <input type="file" id="import-file-input" accept=".json" style="display: none;">
                                <button class="btn btn-danger" id="reset-data-btn">
                                    <i class="fas fa-redo"></i> 重置数据
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        // 绑定事件
        this.bindAdminPanelEvents(modal);
        
        // 设置关闭事件
        this.setupModalClose(modal);
    }

    // 绑定管理面板事件
    bindAdminPanelEvents(modal) {
        // 保存GitHub Token
        modal.querySelector('#save-token-btn').addEventListener('click', () => {
            const tokenInput = modal.querySelector('#github-token-input');
            const token = tokenInput.value.trim();
            
            if (token) {
                this.setGitHubToken(token);
                this.showMessage('GitHub Token 已保存', 'success');
                
                // 更新状态显示
                this.checkGitHubConnection().then(() => {
                    this.updateGitHubStatus(modal);
                });
            } else {
                this.showMessage('请输入GitHub Token', 'warning');
            }
        });

        // 检查连接
        modal.querySelector('#check-connection-btn').addEventListener('click', async () => {
            const result = await this.checkGitHubConnection();
            this.updateGitHubStatus(modal, result);
            
            if (result.connected) {
                this.showMessage('GitHub 连接成功', 'success');
            } else {
                this.showMessage(`连接失败: ${result.message}`, 'error');
            }
        });

        // 手动同步
        modal.querySelector('#manual-sync-btn').addEventListener('click', async () => {
            this.showMessage('开始同步数据...', 'info');
            const success = await this.syncToGitHub();
            
            if (success) {
                this.showMessage('数据同步成功', 'success');
            } else {
                this.showMessage('数据同步失败', 'error');
            }
            
            this.updateSyncStatus();
        });

        // 切换自动同步
        modal.querySelector('#toggle-sync-btn').addEventListener('click', () => {
            if (window.dataManager) {
                if (window.dataManager.autoSyncTimer) {
                    window.dataManager.stopAutoSync();
                    this.showMessage('已关闭自动同步', 'info');
                } else {
                    window.dataManager.startAutoSync();
                    this.showMessage('已开启自动同步', 'success');
                }
                
                // 更新按钮状态
                const btn = modal.querySelector('#toggle-sync-btn');
                const icon = btn.querySelector('i');
                const text = window.dataManager.autoSyncTimer ? '关闭自动同步' : '开启自动同步';
                
                icon.className = `fas fa-toggle-${window.dataManager.autoSyncTimer ? 'on' : 'off'}`;
                btn.innerHTML = `<i class="${icon.className}"></i> ${text}`;
            }
        });

        // 快速操作按钮
        modal.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                this.handleQuickAction(action);
                this.closeModal(modal);
            });
        });

        // 导出数据
        modal.querySelector('#export-data-btn').addEventListener('click', () => {
            if (window.dataManager) {
                const data = window.dataManager.exportData();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `research-portal-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showMessage('数据导出成功', 'success');
            }
        });

        // 导入数据
        modal.querySelector('#import-data-btn').addEventListener('click', () => {
            modal.querySelector('#import-file-input').click();
        });

        modal.querySelector('#import-file-input').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!confirm('导入数据将覆盖现有数据，是否继续？')) {
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const success = await window.dataManager.importData(event.target.result);
                    if (success) {
                        this.showMessage('数据导入成功', 'success');
                        this.reloadPageData();
                    } else {
                        this.showMessage('数据导入失败，请检查文件格式', 'error');
                    }
                } catch (error) {
                    this.showMessage('数据导入失败: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        });

        // 重置数据
        modal.querySelector('#reset-data-btn').addEventListener('click', async () => {
            if (confirm('确定要重置所有数据为默认值吗？此操作不可撤销。')) {
                if (window.dataManager) {
                    const success = await window.dataManager.resetToDefault();
                    if (success) {
                        this.showMessage('数据已重置为默认值', 'success');
                        this.reloadPageData();
                    } else {
                        this.showMessage('数据重置失败', 'error');
                    }
                }
            }
        });
    }

    // 处理快速操作
    handleQuickAction(action) {
        const actionMap = {
            'add-project': 'showEditProjectForm',
            'add-advisor': 'showEditAdvisorForm',
            'add-student': 'showEditStudentForm',
            'add-publication': 'showEditPublicationForm',
            'add-update': 'showEditUpdateForm'
        };

        const functionName = actionMap[action];
        if (functionName && window.labWebsite && window.labWebsite[functionName]) {
            window.labWebsite[functionName]();
        } else {
            console.warn(`未找到对应的函数: ${functionName}`);
        }
    }

    // 设置GitHub Token
    async setGitHubToken(token) {
        this.githubToken = token;
        localStorage.setItem('github_admin_token', token);
        
        // 设置到dataManager
        if (window.dataManager) {
            window.dataManager.setGitHubToken(token);
        }
        
        // 更新githubIssuesManager
        if (window.githubIssuesManager) {
            window.githubIssuesManager.setToken(token);
        }
        
        // 检查连接
        await this.checkGitHubConnection();
    }

    // 检查GitHub连接
    async checkGitHubConnection() {
        if (!this.githubToken) {
            this.syncStatus = { ...this.syncStatus, connected: false, error: '未设置Token' };
            return this.syncStatus;
        }

        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${this.githubToken}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                this.syncStatus = {
                    ...this.syncStatus,
                    connected: true,
                    error: null,
                    user: userData.login
                };
            } else {
                this.syncStatus = {
                    ...this.syncStatus,
                    connected: false,
                    error: `API错误: ${response.status}`
                };
            }
        } catch (error) {
            this.syncStatus = {
                ...this.syncStatus,
                connected: false,
                error: `网络错误: ${error.message}`
            };
        }

        return this.syncStatus;
    }

    // 更新GitHub状态显示
    updateGitHubStatus(modal, status = this.syncStatus) {
        const statusElement = modal.querySelector('#github-status');
        if (statusElement) {
            const dot = statusElement.querySelector('.status-dot');
            const text = statusElement.querySelector('.status-text');
            
            dot.className = `status-dot ${status.connected ? 'connected' : 'disconnected'}`;
            text.textContent = status.connected ? '已连接' : '未连接';
        }
    }

    // 同步数据到GitHub
    async syncToGitHub() {
        if (!window.dataManager) {
            this.showMessage('数据管理器未初始化', 'error');
            return false;
        }

        try {
            const success = await window.dataManager.syncToGitHub();
            if (success) {
                this.updateSyncStatus();
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('同步失败:', error);
            return false;
        }
    }

    // 更新同步状态
    updateSyncStatus() {
        if (!window.dataManager) return;
        
        const stats = window.dataManager.getStats();
        const syncStatus = window.dataManager.getSyncStatus();
        
        this.syncStatus = {
            ...this.syncStatus,
            lastSync: stats.lastSyncTime,
            autoSync: syncStatus.isAutoSyncing
        };
    }

    // 创建模态框
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        return modal;
    }

    // 关闭模态框
    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    // 设置模态框关闭事件
    setupModalClose(modal) {
        modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 移除现有消息
        const existingMsg = document.querySelector('.admin-message');
        if (existingMsg) {
            existingMsg.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `admin-message alert-${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 9999;
            max-width: 300px;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        messageDiv.innerHTML = `
            <i class="fas fa-${this.getMessageIcon(type)}"></i>
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
        this.addMessageStyles();
    }

    // 获取消息图标
    getMessageIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // 添加消息样式
    addMessageStyles() {
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
                .alert-error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                .alert-warning {
                    background-color: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeaa7;
                }
                .alert-info {
                    background-color: #d1ecf1;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 更新UI状态
    updateUI() {
        const adminStatus = document.getElementById('admin-status');
        const adminToggle = document.getElementById('admin-toggle');
        
        if (this.isAdmin) {
            // 显示编辑按钮
            this.showEditButtons(true);
            
            // 更新状态显示
            if (adminStatus) {
                adminStatus.innerHTML = `<i class="fas fa-user-shield"></i> 管理员模式`;
                adminStatus.style.color = '#2ecc71';
            }
            
            // 更新管理员切换按钮
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
            editMode: this.editMode,
            hasGitHubToken: !!this.githubToken,
            syncStatus: this.syncStatus
        };
    }
}

// 创建全局实例
window.adminSystem = new AdminSystem();
