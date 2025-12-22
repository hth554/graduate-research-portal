// js/admin-system.js - 管理员系统（集成权限控制）
class AdminSystem {
    constructor() {
        this.isAdmin = false; // 默认不是管理员
        this.editMode = false;
        
        this.init();
        
        // 添加事件监听，确保脚本加载完成后再绑定事件
        this.ensureEventBindings();
    }

    // 初始化
    init() {
        this.bindEvents();
        this.updateUI();
    }

    // 新增方法：确保事件绑定
    ensureEventBindings() {
        // 监听页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.rebindEvents();
            });
        } else {
            this.rebindEvents();
        }
    }

    // 新增方法：重新绑定事件
    rebindEvents() {
        // 检查labWebsite是否已加载
        if (!window.labWebsite) {
            console.warn('labWebsite未加载，等待1秒后重试...');
            setTimeout(() => this.rebindEvents(), 1000);
            return;
        }
        
        console.log('重新绑定编辑按钮事件...');
        this.bindEvents();
    }

    // 绑定事件
    bindEvents() {
        // 获取编辑按钮
        const editButtons = [
            'edit-projects-btn',
            'edit-advisors-btn',
            'edit-students-btn',
            'edit-publications-btn',
            'edit-updates-btn'
        ];

        // 为每个编辑按钮添加点击事件
        editButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // 检查是否是管理员模式
                    if (!this.isAdmin) {
                        this.showLoginMessage('请先进入管理员模式', 'warning');
                        return;
                    }
                    
                    // 根据按钮ID执行不同的操作
                    switch(btnId) {
                        case 'edit-projects-btn':
                            // 如果已经在编辑模式，则退出编辑模式
                            if (this.editMode) {
                                this.toggleEditMode();
                            } else {
                                // 进入编辑模式并显示项目编辑界面
                                this.toggleEditMode();
                                // 可以在这里添加项目编辑的额外逻辑
                            }
                            break;
                            
                        case 'edit-advisors-btn':
                            // 如果已经在编辑模式，检查是否有编辑函数可用
                            if (this.editMode && window.labWebsite && window.labWebsite.showEditAdvisorForm) {
                                window.labWebsite.showEditAdvisorForm();
                            } else {
                                this.toggleEditMode();
                                // 延迟执行，等待UI更新
                                setTimeout(() => {
                                    if (window.labWebsite && window.labWebsite.showEditAdvisorForm) {
                                        window.labWebsite.showEditAdvisorForm();
                                    }
                                }, 100);
                            }
                            break;
                            
                        case 'edit-students-btn':
                            if (this.editMode && window.labWebsite && window.labWebsite.showEditStudentForm) {
                                window.labWebsite.showEditStudentForm();
                            } else {
                                this.toggleEditMode();
                                setTimeout(() => {
                                    if (window.labWebsite && window.labWebsite.showEditStudentForm) {
                                        window.labWebsite.showEditStudentForm();
                                    }
                                }, 100);
                            }
                            break;
                            
                        case 'edit-publications-btn':
                            if (this.editMode && window.labWebsite && window.labWebsite.showEditPublicationForm) {
                                window.labWebsite.showEditPublicationForm();
                            } else {
                                this.toggleEditMode();
                                setTimeout(() => {
                                    if (window.labWebsite && window.labWebsite.showEditPublicationForm) {
                                        window.labWebsite.showEditPublicationForm();
                                    }
                                }, 100);
                            }
                            break;
                            
                        case 'edit-updates-btn':
                            if (this.editMode && window.labWebsite && window.labWebsite.showEditUpdateForm) {
                                window.labWebsite.showEditUpdateForm();
                            } else {
                                this.toggleEditMode();
                                setTimeout(() => {
                                    if (window.labWebsite && window.labWebsite.showEditUpdateForm) {
                                        window.labWebsite.showEditUpdateForm();
                                    }
                                }, 100);
                            }
                            break;
                    }
                });
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

    // 切换管理员模式（添加权限检查）
    toggleAdminMode() {
        // 首先检查是否已认证
        if (window.labWebsite && window.labWebsite.isReadOnlyMode) {
            // 如果是只读模式，提示输入Token
            if (confirm('需要GitHub Token才能进入管理员模式。现在输入Token？')) {
                const token = prompt('请输入GitHub Token:');
                if (token && window.githubIssuesManager.setToken(token)) {
                    // 设置dataManager的Token
                    if (window.dataManager) {
                        window.dataManager.setGitHubToken(token);
                    }
                    
                    // 重新检查认证状态
                    if (window.labWebsite.checkAuthentication) {
                        window.labWebsite.checkAuthentication().then(() => {
                            // 进入管理员模式
                            this.isAdmin = true;
                            this.editMode = true;
                            this.showLoginMessage('Token验证成功，已进入管理员模式', 'success');
                            this.updateUI();
                            this.reloadPageData();
                        });
                    }
                }
            }
            return;
        }
        
        // 原有切换逻辑
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
        
        if (this.editMode) {
            this.showLoginMessage('已进入编辑模式，可以编辑数据', 'success');
        } else {
            this.showLoginMessage('已退出编辑模式', 'info');
        }
        
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
                if (show) {
                    btn.style.display = 'inline-block';
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                } else {
                    btn.style.display = 'none';
                }
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
                
                // 根据按钮ID设置不同的文本
                const btnId = btn.id;
                const originalText = btn.textContent.trim();
                
                if (!originalText.includes('退出编辑')) {
                    switch(btnId) {
                        case 'edit-projects-btn':
                            btn.innerHTML = '<i class="fas fa-edit"></i> 退出编辑课题';
                            break;
                        case 'edit-advisors-btn':
                            btn.innerHTML = '<i class="fas fa-edit"></i> 编辑导师信息';
                            break;
                        case 'edit-students-btn':
                            btn.innerHTML = '<i class="fas fa-edit"></i> 编辑学生信息';
                            break;
                        case 'edit-publications-btn':
                            btn.innerHTML = '<i class="fas fa-edit"></i> 编辑学术成果';
                            break;
                        case 'edit-updates-btn':
                            btn.innerHTML = '<i class="fas fa-edit"></i> 编辑研究近况';
                            break;
                    }
                }
            });
            
            // 添加编辑模式CSS类到body
            document.body.classList.add('edit-mode');
        } else {
            // 恢复编辑按钮
            editButtons.forEach(btn => {
                btn.classList.remove('active');
                
                const btnId = btn.id;
                switch(btnId) {
                    case 'edit-projects-btn':
                        btn.innerHTML = '<i class="fas fa-edit"></i> 编辑课题';
                        break;
                    case 'edit-advisors-btn':
                        btn.innerHTML = '<i class="fas fa-edit"></i> 编辑导师信息';
                        break;
                    case 'edit-students-btn':
                        btn.innerHTML = '<i class="fas fa-edit"></i> 编辑学生信息';
                        break;
                    case 'edit-publications-btn':
                        btn.innerHTML = '<i class="fas fa-edit"></i> 编辑学术成果';
                        break;
                    case 'edit-updates-btn':
                        btn.innerHTML = '<i class="fas fa-edit"></i> 编辑研究近况';
                        break;
                }
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
