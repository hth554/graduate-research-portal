// js/admin-system.js - 管理员系统（增强版）
class AdminSystem {
    constructor() {
        this.isAdmin = false;
        this.editMode = false;
        this.githubToken = null;
        this.batchMode = false;
        this.selectedItems = new Set();
        
        this.syncStatus = {
            lastSync: null,
            connected: false,
            autoSync: false,
            error: null,
            isSyncing: false
        };
        
        this.init();
    }

    // ========== 初始化方法 ==========
    init() {
        console.log('🚀 AdminSystem 初始化...');
        
        // 从localStorage获取GitHub Token
        this.githubToken = localStorage.getItem('github_admin_token');
        
        // 如果已有Token，设置到dataManager
        if (this.githubToken && window.dataManager) {
            window.dataManager.setGitHubToken(this.githubToken);
        }
        
        this.bindEvents();
        this.updateUI();
        
        // 监听事件
        this.setupEventListeners();
        
        // 检查GitHub连接状态
        setTimeout(() => this.checkGitHubConnection(), 2000);
        
        console.log('✅ AdminSystem 初始化完成');
    }

    setupEventListeners() {
        // 监听数据更新事件
        document.addEventListener('dataUpdated', (e) => {
            this.updateSyncStatus();
            this.showMessage('数据已更新', 'success');
        });
        
        document.addEventListener('dataSaved', (e) => {
            this.updateSyncStatus();
        });
        
        document.addEventListener('dataLoaded', (e) => {
            console.log('📥 数据加载完成', e.detail);
            this.updateSyncStatus();
        });
        
        document.addEventListener('syncStatusChanged', (e) => {
            this.updateSyncStatus(e.detail);
        });
        
        document.addEventListener('conflictDetected', (e) => {
            this.showConflictResolution(e.detail);
        });
        
        // 监听网络状态
        window.addEventListener('online', () => {
            this.showMessage('网络已恢复', 'info');
        });
        
        window.addEventListener('offline', () => {
            this.showMessage('网络已断开，切换到离线模式', 'warning');
        });
    }

    // ========== 事件绑定 ==========
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
        this.bindEditButtons();
        
        // 添加管理面板按钮
        this.addAdminPanelButton();
    }

    bindEditButtons() {
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
    }

    addAdminPanelButton() {
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

    // ========== 管理员模式控制 ==========
    async toggleAdminMode() {
        // 如果退出管理员模式，先检查是否有未保存的更改
        if (this.isAdmin && !confirm('是否退出管理员模式？所有编辑将自动保存。')) {
            return;
        }
        
        this.isAdmin = !this.isAdmin;
        
        if (this.isAdmin) {
            this.editMode = true;
            this.showMessage('已进入管理员模式', 'success');
            
            // 停止自动同步（避免冲突）
            if (window.dataManager) {
                window.dataManager.stopAutoSync();
            }
            
            // 启用批量选择
            this.enableBatchSelection();
        } else {
            this.editMode = false;
            this.showMessage('已退出管理员模式', 'info');
            
            // 恢复自动同步
            if (window.dataManager) {
                window.dataManager.startAutoSync();
            }
            
            // 同步数据到GitHub
            await this.syncToGitHub();
            
            // 禁用批量选择
            this.disableBatchSelection();
        }
        
        this.updateUI();
        this.reloadPageData();
    }

    toggleEditMode() {
        if (!this.isAdmin) {
            this.showMessage('请先进入管理员模式', 'warning');
            return;
        }
        
        this.editMode = !this.editMode;
        this.updateEditModeUI();
        this.reloadPageData();
    }

    // ========== 管理面板 ==========
    showAdminPanel() {
        const stats = window.dataManager ? window.dataManager.getStats() : {
            advisors: 0, students: 0, projects: 0, publications: 0, updates: 0,
            lastSyncTime: null, dataVersion: '0', hasGitHubToken: false
        };
        
        const syncStatus = window.dataManager ? window.dataManager.getSyncStatus() : {
            lastSyncTime: null,
            isAutoSyncing: false,
            isSyncing: false
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
                        <!-- 实时状态 -->
                        <section class="admin-section">
                            <h4><i class="fas fa-tachometer-alt"></i> 系统状态</h4>
                            <div class="system-status">
                                <div class="status-item">
                                    <span class="status-label">管理员模式:</span>
                                    <span class="status-value ${this.isAdmin ? 'enabled' : 'disabled'}">
                                        ${this.isAdmin ? '已启用' : '已禁用'}
                                    </span>
                                </div>
                                <div class="status-item">
                                    <span class="status-label">编辑模式:</span>
                                    <span class="status-value ${this.editMode ? 'enabled' : 'disabled'}">
                                        ${this.editMode ? '已启用' : '已禁用'}
                                    </span>
                                </div>
                                <div class="status-item">
                                    <span class="status-label">网络状态:</span>
                                    <span class="status-value ${navigator.onLine ? 'enabled' : 'disabled'}">
                                        ${navigator.onLine ? '在线' : '离线'}
                                    </span>
                                </div>
                                <div class="status-item">
                                    <span class="status-label">自动同步:</span>
                                    <span class="status-value ${syncStatus.isAutoSyncing ? 'enabled' : 'disabled'}">
                                        ${syncStatus.isAutoSyncing ? '已启用' : '已禁用'}
                                    </span>
                                </div>
                            </div>
                        </section>

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
                                    <button class="btn btn-outline" id="test-token-btn">
                                        <i class="fas fa-plug"></i> 测试
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
                                        ${this.syncStatus.user ? `(${this.syncStatus.user})` : ''}
                                    </span>
                                </div>
                                <div class="button-group">
                                    <button class="btn btn-outline" id="check-connection-btn">
                                        <i class="fas fa-sync-alt"></i> 检查连接
                                    </button>
                                    <button class="btn btn-outline" id="clear-token-btn">
                                        <i class="fas fa-trash"></i> 清除Token
                                    </button>
                                </div>
                            </div>
                        </section>

                        <!-- 数据统计 -->
                        <section class="admin-section">
                            <h4><i class="fas fa-chart-bar"></i> 数据统计</h4>
                            <div class="admin-stats">
                                <div class="stat-card" data-tooltip="研究课题">
                                    <h5>${stats.projects}</h5>
                                    <p>研究课题</p>
                                </div>
                                <div class="stat-card" data-tooltip="指导老师">
                                    <h5>${stats.advisors}</h5>
                                    <p>指导老师</p>
                                </div>
                                <div class="stat-card" data-tooltip="研究生">
                                    <h5>${stats.students}</h5>
                                    <p>研究生</p>
                                </div>
                                <div class="stat-card" data-tooltip="学术成果">
                                    <h5>${stats.publications}</h5>
                                    <p>学术成果</p>
                                </div>
                                <div class="stat-card" data-tooltip="研究近况">
                                    <h5>${stats.updates}</h5>
                                    <p>研究近况</p>
                                </div>
                                <div class="stat-card" data-tooltip="总计">
                                    <h5>${stats.totalItems || 0}</h5>
                                    <p>总计</p>
                                </div>
                            </div>
                        </section>

                        <!-- 同步设置 -->
                        <section class="admin-section">
                            <h4><i class="fas fa-sync-alt"></i> 数据同步</h4>
                            <div class="sync-settings">
                                <div class="form-group">
                                    <label for="sync-interval-select">同步间隔</label>
                                    <select id="sync-interval-select" class="form-control">
                                        <option value="30000" ${syncStatus.syncInterval === 30000 ? 'selected' : ''}>30秒</option>
                                        <option value="60000" ${syncStatus.syncInterval === 60000 ? 'selected' : ''}>1分钟</option>
                                        <option value="300000" ${syncStatus.syncInterval === 300000 ? 'selected' : ''}>5分钟</option>
                                        <option value="600000" ${syncStatus.syncInterval === 600000 ? 'selected' : ''}>10分钟</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="conflict-strategy-select">冲突解决策略</label>
                                    <select id="conflict-strategy-select" class="form-control">
                                        <option value="merge" ${stats.conflictStrategy === 'merge' ? 'selected' : ''}>智能合并</option>
                                        <option value="remote" ${stats.conflictStrategy === 'remote' ? 'selected' : ''}>使用远程数据</option>
                                        <option value="local" ${stats.conflictStrategy === 'local' ? 'selected' : ''}>使用本地数据</option>
                                        <option value="timestamp" ${stats.conflictStrategy === 'timestamp' ? 'selected' : ''}>基于时间戳</option>
                                        <option value="ask" ${stats.conflictStrategy === 'ask' ? 'selected' : ''}>询问用户</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="sync-info">
                                <div class="sync-item">
                                    <span class="sync-label">最后同步时间：</span>
                                    <span class="sync-value">${stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : '从未同步'}</span>
                                </div>
                                <div class="sync-item">
                                    <span class="sync-label">数据版本：</span>
                                    <span class="sync-value">${stats.dataVersion}</span>
                                </div>
                                <div class="sync-item">
                                    <span class="sync-label">同步状态：</span>
                                    <span class="sync-value ${syncStatus.isSyncing ? 'syncing' : 'idle'}">
                                        ${syncStatus.isSyncing ? '同步中...' : '空闲'}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="sync-actions">
                                <button class="btn btn-primary" id="manual-sync-btn" ${syncStatus.isSyncing ? 'disabled' : ''}>
                                    <i class="fas fa-cloud-upload-alt"></i> 
                                    ${syncStatus.isSyncing ? '同步中...' : '手动同步'}
                                </button>
                                <button class="btn btn-outline" id="toggle-sync-btn">
                                    <i class="fas fa-toggle-${syncStatus.isAutoSyncing ? 'on' : 'off'}"></i>
                                    ${syncStatus.isAutoSyncing ? '关闭自动同步' : '开启自动同步'}
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
                                <button class="btn btn-outline action-btn" data-action="create-backup">
                                    <i class="fas fa-database"></i> 创建备份
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
                                <button class="btn btn-outline" id="view-backups-btn">
                                    <i class="fas fa-history"></i> 查看备份
                                </button>
                                <button class="btn btn-danger" id="reset-data-btn">
                                    <i class="fas fa-redo"></i> 重置数据
                                </button>
                            </div>
                        </section>

                        <!-- 批量操作 -->
                        <section class="admin-section">
                            <h4><i class="fas fa-object-group"></i> 批量操作</h4>
                            <div class="batch-actions">
                                <button class="btn btn-outline" id="enable-batch-btn" ${!this.editMode ? 'disabled' : ''}>
                                    <i class="fas fa-check-square"></i> 启用批量选择
                                </button>
                                <button class="btn btn-outline" id="select-all-btn" style="display: none;">
                                    <i class="fas fa-check-double"></i> 全选
                                </button>
                                <button class="btn btn-danger" id="batch-delete-btn" style="display: none;">
                                    <i class="fas fa-trash"></i> 批量删除
                                </button>
                            </div>
                            <div id="batch-selection-info" class="batch-info" style="display: none;">
                                已选择 <span id="batch-count">0</span> 个项目
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

    bindAdminPanelEvents(modal) {
        // 保存GitHub Token
        modal.querySelector('#save-token-btn').addEventListener('click', async () => {
            const tokenInput = modal.querySelector('#github-token-input');
            const token = tokenInput.value.trim();
            
            if (token) {
                await this.setGitHubToken(token);
                this.showMessage('GitHub Token 已保存', 'success');
                
                // 更新状态显示
                await this.checkGitHubConnection();
                this.updateGitHubStatus(modal);
            } else {
                this.showMessage('请输入GitHub Token', 'warning');
            }
        });

        // 测试Token
        modal.querySelector('#test-token-btn').addEventListener('click', async () => {
            const tokenInput = modal.querySelector('#github-token-input');
            const token = tokenInput.value.trim();
            
            if (!token) {
                this.showMessage('请输入Token进行测试', 'warning');
                return;
            }
            
            const result = await this.testGitHubConnection(token);
            this.updateGitHubStatus(modal, result);
            
            if (result.connected) {
                this.showMessage('Token 测试成功', 'success');
            } else {
                this.showMessage(`Token 测试失败: ${result.message}`, 'error');
            }
        });

        // 清除Token
        modal.querySelector('#clear-token-btn').addEventListener('click', () => {
            if (confirm('确定要清除GitHub Token吗？')) {
                this.clearGitHubToken();
                modal.querySelector('#github-token-input').value = '';
                this.updateGitHubStatus(modal, { connected: false });
                this.showMessage('GitHub Token 已清除', 'info');
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

        // 同步间隔设置
        modal.querySelector('#sync-interval-select').addEventListener('change', (e) => {
            const interval = parseInt(e.target.value);
            if (window.dataManager) {
                window.dataManager.setSyncInterval(interval);
                this.showMessage(`同步间隔已设置为 ${interval/1000}秒`, 'success');
            }
        });

        // 冲突解决策略
        modal.querySelector('#conflict-strategy-select').addEventListener('change', (e) => {
            const strategy = e.target.value;
            if (window.dataManager) {
                window.dataManager.setConflictStrategy(strategy);
                this.showMessage(`冲突解决策略已设置为: ${this.getStrategyName(strategy)}`, 'success');
            }
        });

        // 手动同步
        modal.querySelector('#manual-sync-btn').addEventListener('click', async () => {
            if (window.dataManager) {
                this.showMessage('开始同步数据...', 'info');
                
                // 禁用按钮
                const btn = modal.querySelector('#manual-sync-btn');
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 同步中...';
                
                const success = await this.syncToGitHub();
                
                // 恢复按钮
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> 手动同步';
                
                if (success) {
                    this.showMessage('数据同步成功', 'success');
                } else {
                    this.showMessage('数据同步失败', 'error');
                }
                
                this.updateSyncStatus();
            }
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
                    this.showMessage('正在导入数据...', 'info');
                    
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

        // 查看备份
        modal.querySelector('#view-backups-btn').addEventListener('click', () => {
            this.showBackupList();
            this.closeModal(modal);
        });

        // 创建备份
        const createBackupBtn = modal.querySelector('[data-action="create-backup"]');
        if (createBackupBtn) {
            createBackupBtn.addEventListener('click', async () => {
                if (window.githubManager) {
                    this.showMessage('正在创建备份...', 'info');
                    
                    const result = await window.githubManager.createBackup();
                    if (result.success) {
                        this.showMessage(`备份创建成功: ${result.filename}`, 'success');
                    } else {
                        this.showMessage(`备份创建失败: ${result.error}`, 'error');
                    }
                }
            });
        }

        // 重置数据
        modal.querySelector('#reset-data-btn').addEventListener('click', async () => {
            if (window.dataManager) {
                const success = await window.dataManager.resetToDefault();
                if (success) {
                    this.showMessage('数据已重置为默认值', 'success');
                    this.reloadPageData();
                } else {
                    this.showMessage('数据重置失败', 'error');
                }
            }
        });

        // 批量操作
        modal.querySelector('#enable-batch-btn').addEventListener('click', () => {
            this.toggleBatchMode();
        });

        modal.querySelector('#select-all-btn').addEventListener('click', () => {
            this.selectAllItems();
        });

        modal.querySelector('#batch-delete-btn').addEventListener('click', () => {
            this.batchDeleteItems();
        });
    }

    getStrategyName(strategy) {
        const strategies = {
            'merge': '智能合并',
            'remote': '使用远程数据',
            'local': '使用本地数据',
            'timestamp': '基于时间戳',
            'ask': '询问用户'
        };
        return strategies[strategy] || strategy;
    }

    // ========== GitHub Token 管理 ==========
    async setGitHubToken(token) {
        this.githubToken = token;
        localStorage.setItem('github_admin_token', token);
        
        // 设置到dataManager
        if (window.dataManager) {
            window.dataManager.setGitHubToken(token);
        }
        
        // 设置到githubManager
        if (window.githubManager) {
            window.githubManager.setToken(token);
        }
        
        // 检查连接
        await this.checkGitHubConnection();
    }

    clearGitHubToken() {
        this.githubToken = null;
        localStorage.removeItem('github_admin_token');
        
        // 清除dataManager的Token
        if (window.dataManager) {
            window.dataManager.githubToken = null;
        }
        
        // 清除githubManager的Token
        if (window.githubManager) {
            window.githubManager.clearToken();
        }
        
        this.syncStatus.connected = false;
        this.syncStatus.user = null;
    }

    async testGitHubConnection(token) {
        if (!token) {
            return { connected: false, message: '未提供Token' };
        }

        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                return { 
                    connected: true, 
                    message: '连接成功',
                    user: userData.login
                };
            } else {
                return { 
                    connected: false, 
                    message: `连接失败: ${response.status}` 
                };
            }
        } catch (error) {
            return { 
                connected: false, 
                message: `连接错误: ${error.message}` 
            };
        }
    }

    async checkGitHubConnection() {
        if (!this.githubToken) {
            this.syncStatus = { ...this.syncStatus, connected: false, error: '未设置Token' };
            return this.syncStatus;
        }

        if (window.dataManager) {
            const result = await window.dataManager.checkGitHubConnection();
            this.syncStatus = {
                ...this.syncStatus,
                connected: result.connected,
                error: result.message,
                user: result.user,
                rateLimit: result.rateLimit
            };
            return this.syncStatus;
        }

        return this.syncStatus;
    }

    updateGitHubStatus(modal, status = this.syncStatus) {
        const statusElement = modal.querySelector('#github-status');
        if (statusElement) {
            const dot = statusElement.querySelector('.status-dot');
            const text = statusElement.querySelector('.status-text');
            
            dot.className = `status-dot ${status.connected ? 'connected' : 'disconnected'}`;
            text.textContent = status.connected ? 
                `已连接${status.user ? ` (${status.user})` : ''}` : 
                '未连接';
        }
    }

    // ========== 数据同步 ==========
    async syncToGitHub() {
        if (!window.dataManager) {
            this.showMessage('数据管理器未初始化', 'error');
            return false;
        }

        try {
            const result = await window.dataManager.syncToGitHub();
            if (result.success) {
                this.updateSyncStatus();
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('❌ 同步失败:', error);
            return false;
        }
    }

    updateSyncStatus(status = {}) {
        if (!window.dataManager) return;
        
        const stats = window.dataManager.getStats();
        const syncStatus = window.dataManager.getSyncStatus();
        
        this.syncStatus = {
            ...this.syncStatus,
            lastSync: stats.lastSyncTime,
            autoSync: syncStatus.isAutoSyncing,
            isSyncing: status.status === 'syncing' || syncStatus.isSyncing,
            ...status
        };
        
        // 更新UI
        this.updateSyncStatusUI();
    }

    updateSyncStatusUI() {
        const syncStatusElement = document.getElementById('sync-status');
        if (!syncStatusElement) return;
        
        let statusText = '';
        let statusClass = '';
        
        if (this.syncStatus.isSyncing) {
            statusText = '同步中...';
            statusClass = 'syncing';
        } else if (this.syncStatus.connected) {
            if (this.syncStatus.lastSync) {
                const lastSync = new Date(this.syncStatus.lastSync);
                const now = new Date();
                const diffMinutes = Math.floor((now - lastSync) / (1000 * 60));
                
                if (diffMinutes < 2) {
                    statusText = `已同步 (${diffMinutes}分钟前)`;
                    statusClass = 'synced';
                } else if (diffMinutes < 10) {
                    statusText = `已同步 (${diffMinutes}分钟前)`;
                    statusClass = 'recent';
                } else {
                    statusText = `同步较旧 (${diffMinutes}分钟前)`;
                    statusClass = 'old';
                }
            } else {
                statusText = '未同步';
                statusClass = 'not-synced';
            }
        } else {
            statusText = '未配置GitHub';
            statusClass = 'no-token';
        }
        
        syncStatusElement.textContent = statusText;
        syncStatusElement.className = `sync-status ${statusClass}`;
    }

    // ========== 快速操作处理 ==========
    handleQuickAction(action) {
        const actionMap = {
            'add-project': 'showEditProjectForm',
            'add-advisor': 'showEditAdvisorForm',
            'add-student': 'showEditStudentForm',
            'add-publication': 'showEditPublicationForm',
            'add-update': 'showEditUpdateForm',
            'create-backup': 'createBackup'
        };

        if (action === 'create-backup') {
            this.createBackup();
            return;
        }

        const functionName = actionMap[action];
        if (functionName && window.labWebsite && window.labWebsite[functionName]) {
            window.labWebsite[functionName]();
        } else {
            console.warn(`未找到对应的函数: ${functionName}`);
            this.showMessage('该功能暂未实现', 'warning');
        }
    }

    async createBackup() {
        if (window.githubManager) {
            this.showMessage('正在创建数据备份...', 'info');
            
            const result = await window.githubManager.createBackup();
            if (result.success) {
                this.showMessage(`备份创建成功: ${result.filename}`, 'success');
            } else {
                this.showMessage(`备份创建失败: ${result.error}`, 'error');
            }
        }
    }

    async showBackupList() {
        if (!window.githubManager) {
            this.showMessage('GitHub管理器未初始化', 'error');
            return;
        }

        try {
            const backups = await window.githubManager.listBackups();
            
            const modal = this.createModal();
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-history"></i> 数据备份列表</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${backups.length === 0 ? 
                            '<p class="empty-state">暂无备份文件</p>' : 
                            `<div class="backup-list">
                                ${backups.map(backup => `
                                    <div class="backup-item">
                                        <div class="backup-info">
                                            <h4>${backup.name}</h4>
                                            <p>
                                                <span>大小: ${Math.round(backup.size / 1024)}KB</span>
                                                <span>时间: ${new Date(backup.lastModified).toLocaleString()}</span>
                                            </p>
                                        </div>
                                        <div class="backup-actions">
                                            <button class="btn btn-outline btn-sm restore-backup-btn" data-name="${backup.name}">
                                                <i class="fas fa-redo"></i> 恢复
                                            </button>
                                            <a href="${backup.url}" target="_blank" class="btn btn-outline btn-sm">
                                                <i class="fas fa-external-link-alt"></i> 查看
                                            </a>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>`
                        }
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            setTimeout(() => modal.classList.add('show'), 10);
            
            // 绑定恢复按钮事件
            modal.querySelectorAll('.restore-backup-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const backupName = e.target.closest('.restore-backup-btn').getAttribute('data-name');
                    await this.restoreBackup(backupName);
                    this.closeModal(modal);
                });
            });
            
            this.setupModalClose(modal);
        } catch (error) {
            this.showMessage(`获取备份列表失败: ${error.message}`, 'error');
        }
    }

    async restoreBackup(backupName) {
        if (!confirm(`确定要从备份 ${backupName} 恢复数据吗？当前数据将被覆盖。`)) {
            return;
        }

        if (window.githubManager && window.dataManager) {
            this.showMessage('正在恢复备份...', 'info');
            
            const result = await window.githubManager.restoreBackup(backupName);
            if (result.success && result.data) {
                // 导入数据
                const jsonString = JSON.stringify(result.data);
                const success = await window.dataManager.importData(jsonString);
                
                if (success) {
                    this.showMessage(`备份恢复成功: ${backupName}`, 'success');
                    this.reloadPageData();
                } else {
                    this.showMessage('备份恢复失败', 'error');
                }
            } else {
                this.showMessage(`备份恢复失败: ${result.error}`, 'error');
            }
        }
    }

    // ========== 冲突解决界面 ==========
    showConflictResolution(detail) {
        const modal = this.createModal();
        modal.innerHTML = `
            <div class="modal-content conflict-resolution">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> 检测到数据冲突</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="conflict-details">
                        <p>检测到本地数据与远程数据存在差异，请选择解决策略：</p>
                        <ul>
                            ${Object.entries(detail.conflicts).map(([type, info]) => `
                                <li>${type}: 本地 ${info.localCount} 项 ↔ 远程 ${info.newCount} 项</li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div class="conflict-actions">
                        <button class="conflict-btn" data-strategy="merge">
                            <i class="fas fa-code-branch"></i>
                            <div>
                                <strong>智能合并</strong>
                                <small>合并双方数据，保留所有项目</small>
                            </div>
                        </button>
                        <button class="conflict-btn" data-strategy="remote">
                            <i class="fas fa-cloud"></i>
                            <div>
                                <strong>使用远程数据</strong>
                                <small>丢弃本地修改，使用远程数据</small>
                            </div>
                        </button>
                        <button class="conflict-btn" data-strategy="local">
                            <i class="fas fa-desktop"></i>
                            <div>
                                <strong>使用本地数据</strong>
                                <small>保留本地修改，覆盖远程数据</small>
                            </div>
                        </button>
                        <button class="conflict-btn" data-strategy="timestamp">
                            <i class="fas fa-clock"></i>
                            <div>
                                <strong>基于时间戳</strong>
                                <small>使用最新版本的数据</small>
                            </div>
                        </button>
                    </div>
                    
                    <div class="conflict-note">
                        <p><small>选择"智能合并"可能会导致数据重复，建议检查合并结果。</small></p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        // 绑定冲突解决按钮
        modal.querySelectorAll('.conflict-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const strategy = e.currentTarget.getAttribute('data-strategy');
                this.resolveConflict(strategy);
                this.closeModal(modal);
            });
        });
        
        this.setupModalClose(modal);
    }

    resolveConflict(strategy) {
        if (window.dataManager) {
            window.dataManager.setConflictStrategy(strategy);
            this.showMessage(`冲突解决策略已设置为: ${this.getStrategyName(strategy)}`, 'success');
            
            // 重新加载数据
            setTimeout(() => window.dataManager.syncFromGitHub(), 1000);
        }
    }

    // ========== 批量操作 ==========
    enableBatchSelection() {
        this.batchMode = true;
        this.selectedItems.clear();
        
        // 显示批量操作工具栏
        this.showBatchToolbar();
        
        // 为所有项目卡片添加选择框
        this.addSelectionCheckboxes();
        
        this.showMessage('批量选择模式已启用', 'info');
    }

    disableBatchSelection() {
        this.batchMode = false;
        this.selectedItems.clear();
        
        // 隐藏批量操作工具栏
        this.hideBatchToolbar();
        
        // 移除选择框
        this.removeSelectionCheckboxes();
    }

    toggleBatchMode() {
        if (this.batchMode) {
            this.disableBatchSelection();
        } else {
            this.enableBatchSelection();
        }
    }

    addSelectionCheckboxes() {
        // 为每个卡片容器添加选择框
        const cardContainers = [
            '#projects-container',
            '#advisors-container',
            '#students-container',
            '#publications-container',
            '#updates-container'
        ];
        
        cardContainers.forEach(selector => {
            const container = document.querySelector(selector);
            if (container) {
                container.querySelectorAll('.card').forEach((card, index) => {
                    const itemId = card.dataset.id || index;
                    const type = this.getItemTypeFromContainer(selector);
                    
                    if (!card.querySelector('.batch-checkbox')) {
                        const checkbox = document.createElement('div');
                        checkbox.className = 'batch-checkbox';
                        checkbox.innerHTML = `
                            <input type="checkbox" id="batch-${type}-${itemId}" 
                                   data-type="${type}" data-id="${itemId}">
                            <label for="batch-${type}-${itemId}"></label>
                        `;
                        card.style.position = 'relative';
                        card.appendChild(checkbox);
                        
                        // 绑定点击事件
                        checkbox.querySelector('input').addEventListener('change', (e) => {
                            this.toggleItemSelection(type, itemId, e.target.checked);
                        });
                        
                        // 卡片点击时选中
                        card.addEventListener('click', (e) => {
                            if (e.target.closest('.batch-checkbox')) return;
                            const checkbox = card.querySelector('input[type="checkbox"]');
                            if (checkbox) {
                                checkbox.checked = !checkbox.checked;
                                this.toggleItemSelection(type, itemId, checkbox.checked);
                            }
                        });
                    }
                });
            }
        });
    }

    removeSelectionCheckboxes() {
        document.querySelectorAll('.batch-checkbox').forEach(checkbox => {
            checkbox.remove();
        });
        
        // 移除卡片点击事件
        document.querySelectorAll('.card').forEach(card => {
            card.style.position = '';
        });
    }

    getItemTypeFromContainer(selector) {
        const map = {
            '#projects-container': 'projects',
            '#advisors-container': 'advisors',
            '#students-container': 'students',
            '#publications-container': 'publications',
            '#updates-container': 'updates'
        };
        return map[selector] || 'unknown';
    }

    toggleItemSelection(type, id, selected) {
        const key = `${type}:${id}`;
        
        if (selected) {
            this.selectedItems.add(key);
        } else {
            this.selectedItems.delete(key);
        }
        
        this.updateBatchToolbar();
    }

    selectAllItems() {
        document.querySelectorAll('.batch-checkbox input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
            const type = checkbox.dataset.type;
            const id = checkbox.dataset.id;
            const key = `${type}:${id}`;
            this.selectedItems.add(key);
        });
        
        this.updateBatchToolbar();
    }

    async batchDeleteItems() {
        if (this.selectedItems.size === 0) {
            this.showMessage('请先选择要删除的项目', 'warning');
            return;
        }
        
        if (!confirm(`确定要删除选中的 ${this.selectedItems.size} 个项目吗？`)) {
            return;
        }
        
        // 按类型分组
        const itemsByType = {};
        this.selectedItems.forEach(key => {
            const [type, id] = key.split(':');
            if (!itemsByType[type]) {
                itemsByType[type] = [];
            }
            itemsByType[type].push(parseInt(id));
        });
        
        // 批量删除
        let deletedCount = 0;
        
        for (const [type, ids] of Object.entries(itemsByType)) {
            if (window.dataManager) {
                const count = await window.dataManager.batchDelete(type, ids);
                deletedCount += count;
            }
        }
        
        this.showMessage(`已删除 ${deletedCount} 个项目`, 'success');
        this.disableBatchSelection();
        this.reloadPageData();
    }

    showBatchToolbar() {
        let toolbar = document.querySelector('.batch-toolbar');
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.className = 'batch-toolbar';
            toolbar.innerHTML = `
                <div class="batch-count">
                    <i class="fas fa-check-square"></i>
                    已选择 <span id="batch-count">0</span> 个项目
                </div>
                <div class="batch-actions">
                    <button class="btn btn-outline" id="batch-select-all">
                        <i class="fas fa-check-double"></i> 全选
                    </button>
                    <button class="btn btn-danger" id="batch-delete-selected">
                        <i class="fas fa-trash"></i> 删除选中
                    </button>
                    <button class="btn btn-outline" id="batch-cancel">
                        <i class="fas fa-times"></i> 取消
                    </button>
                </div>
            `;
            document.body.appendChild(toolbar);
            
            // 绑定工具栏事件
            toolbar.querySelector('#batch-select-all').addEventListener('click', () => {
                this.selectAllItems();
            });
            
            toolbar.querySelector('#batch-delete-selected').addEventListener('click', () => {
                this.batchDeleteItems();
            });
            
            toolbar.querySelector('#batch-cancel').addEventListener('click', () => {
                this.disableBatchSelection();
            });
        }
        
        toolbar.classList.remove('hidden');
    }

    hideBatchToolbar() {
        const toolbar = document.querySelector('.batch-toolbar');
        if (toolbar) {
            toolbar.classList.add('hidden');
        }
    }

    updateBatchToolbar() {
        const countElement = document.querySelector('#batch-count');
        if (countElement) {
            countElement.textContent = this.selectedItems.size;
        }
    }

    // ========== UI更新方法 ==========
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
        this.updateSyncStatusUI();
    }

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

    updateEditModeUI() {
        const editButtons = document.querySelectorAll('[id^="edit-"]');
        const editModeIndicator = document.querySelector('.edit-mode-indicator');
        
        if (this.editMode && this.isAdmin) {
            // 显示所有编辑按钮为激活状态
            editButtons.forEach(btn => {
                btn.classList.add('active');
                btn.innerHTML = btn.innerHTML.replace('编辑', '退出编辑');
            });
            
            // 显示编辑模式指示器
            if (editModeIndicator) {
                editModeIndicator.classList.add('show');
            }
            
            // 添加编辑模式CSS类到body
            document.body.classList.add('edit-mode');
        } else {
            // 恢复编辑按钮
            editButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.innerHTML = btn.innerHTML.replace('退出编辑', '编辑');
            });
            
            // 隐藏编辑模式指示器
            if (editModeIndicator) {
                editModeIndicator.classList.remove('show');
            }
            
            // 移除编辑模式CSS类
            document.body.classList.remove('edit-mode');
        }
    }

    // ========== 模态框工具方法 ==========
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        return modal;
    }

    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }

    setupModalClose(modal) {
        modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }

    // ========== 消息提示系统 ==========
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
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
        `;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        messageDiv.innerHTML = `
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
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
        
        // 添加动画样式（如果不存在）
        this.addMessageStyles();
    }

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
                    background-color: rgba(46, 204, 113, 0.9);
                    color: white;
                }
                .alert-error {
                    background-color: rgba(231, 76, 60, 0.9);
                    color: white;
                }
                .alert-warning {
                    background-color: rgba(241, 196, 15, 0.9);
                    color: white;
                }
                .alert-info {
                    background-color: rgba(52, 152, 219, 0.9);
                    color: white;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ========== 页面数据重载 ==========
    reloadPageData() {
        const event = new CustomEvent('adminModeChanged', {
            detail: { 
                editMode: this.editMode,
                isAdmin: this.isAdmin 
            }
        });
        document.dispatchEvent(event);
    }

    // ========== 状态获取 ==========
    getStatus() {
        return {
            isAdmin: this.isAdmin,
            editMode: this.editMode,
            batchMode: this.batchMode,
            selectedItems: this.selectedItems.size,
            hasGitHubToken: !!this.githubToken,
            syncStatus: this.syncStatus
        };
    }
}

// 创建全局实例
window.adminSystem = new AdminSystem();
