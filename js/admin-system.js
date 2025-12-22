// js/admin-system.js - 管理员系统（修复版）

class AdminSystem {
    constructor() {
        this.isAdmin = false;
        this.editMode = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.bindDirectEditEvents(); // 新增：直接事件绑定
        this.updateUI();
    }

    // 新增：直接事件绑定方法（使用事件委托）
    bindDirectEditEvents() {
        console.log('绑定直接编辑事件...');
        
        // 使用事件委托监听整个文档
        document.addEventListener('click', (e) => {
            // 检查点击的元素是否是编辑按钮
            const target = e.target;
            const button = target.closest('.advisor-edit-btn, .student-edit-btn, .edit-publication-btn, .edit-update-btn, .project-edit-btn');
            
            if (!button) return;
            
            console.log('编辑按钮被点击:', button.className);
            
            // 阻止默认行为
            e.preventDefault();
            e.stopPropagation();
            
            // 检查权限
            if (!this.isAdmin) {
                console.log('用户不是管理员，需要登录');
                this.showLoginMessage('请先进入管理员模式', 'warning');
                
                // 提示输入Token
                if (confirm('需要GitHub Token才能编辑数据。现在输入Token？')) {
                    this.promptForToken();
                }
                return;
            }
            
            if (!this.editMode) {
                console.log('未进入编辑模式，自动进入');
                this.editMode = true;
                this.updateEditModeUI();
            }
            
            // 获取数据ID
            const id = button.getAttribute('data-id');
            const buttonClasses = button.className;
            
            console.log('按钮信息:', { id, buttonClasses });
            
            // 根据按钮类型调用相应函数
            if (buttonClasses.includes('advisor-edit-btn')) {
                this.handleEditAdvisor(id);
            } else if (buttonClasses.includes('student-edit-btn')) {
                this.handleEditStudent(id);
            } else if (buttonClasses.includes('edit-publication-btn')) {
                this.handleEditPublication(id);
            } else if (buttonClasses.includes('edit-update-btn')) {
                this.handleEditUpdate(id);
            } else if (buttonClasses.includes('project-edit-btn')) {
                this.handleEditProject(id);
            }
        });
    }

    // 新增：处理各种编辑的函数
    handleEditAdvisor(advisorId) {
        console.log('编辑导师:', advisorId);
        
        // 方法1：优先使用 labWebsite 的函数
        if (window.labWebsite && window.labWebsite.showEditAdvisorForm) {
            window.labWebsite.showEditAdvisorForm(advisorId);
            return;
        }
        
        // 方法2：如果 labWebsite 不可用，尝试直接调用
        if (typeof showEditAdvisorForm === 'function') {
            showEditAdvisorForm(advisorId);
            return;
        }
        
        // 方法3：备用方案 - 显示提示
        this.showLoginMessage('编辑功能加载中...', 'info');
        console.warn('编辑函数未找到，请检查脚本加载顺序');
    }

    handleEditStudent(studentId) {
        console.log('编辑学生:', studentId);
        
        if (window.labWebsite && window.labWebsite.showEditStudentForm) {
            window.labWebsite.showEditStudentForm(studentId);
            return;
        }
        
        if (typeof showEditStudentForm === 'function') {
            showEditStudentForm(studentId);
            return;
        }
        
        this.showLoginMessage('编辑功能加载中...', 'info');
    }

    handleEditPublication(publicationId) {
        console.log('编辑学术成果:', publicationId);
        
        if (window.labWebsite && window.labWebsite.showEditPublicationForm) {
            window.labWebsite.showEditPublicationForm(publicationId);
            return;
        }
        
        if (typeof showEditPublicationForm === 'function') {
            showEditPublicationForm(publicationId);
            return;
        }
        
        this.showLoginMessage('编辑功能加载中...', 'info');
    }

    handleEditUpdate(updateId) {
        console.log('编辑研究近况:', updateId);
        
        if (window.labWebsite && window.labWebsite.showEditUpdateForm) {
            window.labWebsite.showEditUpdateForm(updateId);
            return;
        }
        
        if (typeof showEditUpdateForm === 'function') {
            showEditUpdateForm(updateId);
            return;
        }
        
        this.showLoginMessage('编辑功能加载中...', 'info');
    }

    handleEditProject(projectId) {
        console.log('编辑课题:', projectId);
        
        if (window.labWebsite && window.labWebsite.showEditProjectForm) {
            window.labWebsite.showEditProjectForm(projectId);
            return;
        }
        
        if (typeof showEditProjectForm === 'function') {
            showEditProjectForm(projectId);
            return;
        }
        
        this.showLoginMessage('编辑功能加载中...', 'info');
    }

    // 新增：提示输入Token
    promptForToken() {
        const token = prompt(
            '请输入 GitHub Personal Access Token：\n\n' +
            '格式要求：以 "ghp_" 或 "github_pat_" 开头\n' +
            'Token 需要以下权限：repo, workflow\n\n' +
            '（Token 将安全保存在您的浏览器本地）',
            ''
        );
        
        if (token && token.trim()) {
            if (window.githubIssuesManager && window.githubIssuesManager.setToken(token)) {
                // 保存到 dataManager
                if (window.dataManager) {
                    window.dataManager.setGitHubToken(token);
                }
                
                // 保存到 localStorage
                localStorage.setItem('github_pat_token', token);
                localStorage.setItem('github_admin_token', token);
                
                // 进入管理员模式
                this.isAdmin = true;
                this.editMode = true;
                this.showLoginMessage('Token验证成功，已进入管理员模式', 'success');
                this.updateUI();
                
                // 重新加载数据
                if (window.labWebsite && window.labWebsite.checkAuthentication) {
                    window.labWebsite.checkAuthentication();
                }
                
                return true;
            }
        }
        
        return false;
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

    // 修改 toggleAdminMode 方法，添加Token检查
    toggleAdminMode() {
        // 首先检查是否有Token
        const hasToken = window.githubIssuesManager && 
                         window.githubIssuesManager.hasValidToken();
        
        if (!hasToken) {
            console.log('未检测到Token，提示用户输入');
            this.promptForToken();
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
