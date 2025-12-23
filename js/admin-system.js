class AdminSystem {
    constructor() {
        this.isAdmin = false;
        this.editMode = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.bindDirectEditEvents();
        this.updateUI();
    }

    bindDirectEditEvents() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.advisor-edit-btn, .student-edit-btn, .edit-publication-btn, .edit-update-btn, .project-edit-btn');
            if (!button) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            if (!this.isAdmin) {
                this.showLoginMessage('请先进入管理员模式', 'warning');
                if (confirm('需要GitHub Token才能编辑数据。现在输入Token？')) {
                    this.promptForToken();
                }
                return;
            }
            
            if (!this.editMode) {
                this.editMode = true;
                this.updateEditModeUI();
            }
            
            const id = button.getAttribute('data-id');
            const buttonClasses = button.className;
            
            if (buttonClasses.includes('advisor-edit-btn')) this.handleEditAdvisor(id);
            else if (buttonClasses.includes('student-edit-btn')) this.handleEditStudent(id);
            else if (buttonClasses.includes('edit-publication-btn')) this.handleEditPublication(id);
            else if (buttonClasses.includes('edit-update-btn')) this.handleEditUpdate(id);
            else if (buttonClasses.includes('project-edit-btn')) this.handleEditProject(id);
        });
    }

    handleEditAdvisor(advisorId) {
        if (window.labWebsite && window.labWebsite.showEditAdvisorForm) {
            window.labWebsite.showEditAdvisorForm(advisorId);
            return;
        }
        if (typeof showEditAdvisorForm === 'function') showEditAdvisorForm(advisorId);
        else this.showLoginMessage('编辑功能加载中...', 'info');
    }

    handleEditStudent(studentId) {
        if (window.labWebsite && window.labWebsite.showEditStudentForm) {
            window.labWebsite.showEditStudentForm(studentId);
            return;
        }
        if (typeof showEditStudentForm === 'function') showEditStudentForm(studentId);
        else this.showLoginMessage('编辑功能加载中...', 'info');
    }

    handleEditPublication(publicationId) {
        if (window.labWebsite && window.labWebsite.showEditPublicationForm) {
            window.labWebsite.showEditPublicationForm(publicationId);
            return;
        }
        if (typeof showEditPublicationForm === 'function') showEditPublicationForm(publicationId);
        else this.showLoginMessage('编辑功能加载中...', 'info');
    }

    handleEditUpdate(updateId) {
        if (window.labWebsite && window.labWebsite.showEditUpdateForm) {
            window.labWebsite.showEditUpdateForm(updateId);
            return;
        }
        if (typeof showEditUpdateForm === 'function') showEditUpdateForm(updateId);
        else this.showLoginMessage('编辑功能加载中...', 'info');
    }

    handleEditProject(projectId) {
        if (window.labWebsite && window.labWebsite.showEditProjectForm) {
            window.labWebsite.showEditProjectForm(projectId);
            return;
        }
        if (typeof showEditProjectForm === 'function') showEditProjectForm(projectId);
        else this.showLoginMessage('编辑功能加载中...', 'info');
    }

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
                if (window.dataManager) window.dataManager.setGitHubToken(token);
                localStorage.setItem('github_pat_token', token);
                localStorage.setItem('github_admin_token', token);
                this.isAdmin = true;
                this.editMode = true;
                this.showLoginMessage('Token验证成功，已进入管理员模式', 'success');
                this.updateUI();
                if (window.labWebsite && window.labWebsite.checkAuthentication) {
                    window.labWebsite.checkAuthentication();
                }
                return true;
            }
        }
        return false;
    }

    bindEvents() {
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
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!this.isAdmin) {
                        this.showLoginMessage('请先进入管理员模式', 'warning');
                        return;
                    }
                    
                    this.handleEditButtonClick(btnId);
                });
            }
        });

        const adminToggle = document.getElementById('admin-toggle');
        if (adminToggle) {
            adminToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAdminMode();
            });
        }
    }

    handleEditButtonClick(btnId) {
        const actions = {
            'edit-projects-btn': () => this.toggleEditMode(),
            'edit-advisors-btn': () => this.editItem('showEditAdvisorForm'),
            'edit-students-btn': () => this.editItem('showEditStudentForm'),
            'edit-publications-btn': () => this.editItem('showEditPublicationForm'),
            'edit-updates-btn': () => this.editItem('showEditUpdateForm')
        };
        
        if (actions[btnId]) {
            if (this.editMode && window.labWebsite && window.labWebsite[actions[btnId]()]) {
                window.labWebsite[actions[btnId]()]();
            } else {
                this.toggleEditMode();
                setTimeout(() => {
                    if (window.labWebsite && window.labWebsite[actions[btnId]()]) {
                        window.labWebsite[actions[btnId]()]();
                    }
                }, 100);
            }
        }
    }

    editItem(methodName) { return methodName; }

    toggleAdminMode() {
        const hasToken = window.githubIssuesManager && window.githubIssuesManager.hasValidToken();
        if (!hasToken) {
            this.promptForToken();
            return;
        }
        
        this.isAdmin = !this.isAdmin;
        this.editMode = this.isAdmin;
        this.showLoginMessage(this.isAdmin ? '已进入管理员模式' : '已退出管理员模式', this.isAdmin ? 'success' : 'info');
        this.updateUI();
        this.reloadPageData();
    }

    toggleEditMode() {
        if (!this.isAdmin) {
            this.showLoginMessage('请先进入管理员模式', 'warning');
            return;
        }
        
        this.editMode = !this.editMode;
        this.updateEditModeUI();
        this.showLoginMessage(this.editMode ? '已进入编辑模式，可以编辑数据' : '已退出编辑模式', this.editMode ? 'success' : 'info');
        this.reloadPageData();
    }

    showLoginMessage(message, type) {
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
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) messageDiv.parentNode.removeChild(messageDiv);
            }, 300);
        }, 3000);
        
        this.addMessageStyles();
    }

    addMessageStyles() {
        if (!document.querySelector('#message-styles')) {
            const style = document.createElement('style');
            style.id = 'message-styles';
            style.textContent = `
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
                .alert-success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .alert-info { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
                .alert-warning { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
            `;
            document.head.appendChild(style);
        }
    }

    updateUI() {
        const adminStatus = document.getElementById('admin-status');
        const adminToggle = document.getElementById('admin-toggle');
        
        if (this.isAdmin) {
            this.showEditButtons(true);
            if (adminStatus) {
                adminStatus.innerHTML = `<i class="fas fa-user-shield"></i> 管理员模式`;
                adminStatus.style.color = '#2ecc71';
            }
            if (adminToggle) {
                adminToggle.innerHTML = '<i class="fas fa-user-shield"></i> 退出管理';
                adminToggle.style.color = '#e74c3c';
            }
        } else {
            this.showEditButtons(false);
            if (adminStatus) {
                adminStatus.innerHTML = `<i class="fas fa-user"></i> 游客模式`;
                adminStatus.style.color = '#aaa';
            }
            if (adminToggle) {
                adminToggle.innerHTML = '<i class="fas fa-user-shield"></i> 管理';
                adminToggle.style.color = '';
            }
        }
        
        this.updateEditModeUI();
    }

    showEditButtons(show) {
        ['edit-projects-btn', 'edit-advisors-btn', 'edit-students-btn', 'edit-publications-btn', 'edit-updates-btn'].forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.style.display = show ? 'inline-block' : 'none';
                if (show) {
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                }
            }
        });
    }

    updateEditModeUI() {
        const editButtons = document.querySelectorAll('[id^="edit-"]');
        const buttonTexts = {
            'edit-projects-btn': this.editMode ? '<i class="fas fa-edit"></i> 退出编辑课题' : '<i class="fas fa-edit"></i> 编辑课题',
            'edit-advisors-btn': '<i class="fas fa-edit"></i> 编辑导师信息',
            'edit-students-btn': '<i class="fas fa-edit"></i> 编辑学生信息',
            'edit-publications-btn': '<i class="fas fa-edit"></i> 编辑学术成果',
            'edit-updates-btn': '<i class="fas fa-edit"></i> 编辑研究近况'
        };
        
        editButtons.forEach(btn => {
            const btnId = btn.id;
            if (this.editMode && this.isAdmin) {
                btn.classList.add('active');
                if (buttonTexts[btnId] && !btn.innerHTML.includes('退出编辑')) {
                    btn.innerHTML = buttonTexts[btnId];
                }
            } else {
                btn.classList.remove('active');
                if (buttonTexts[btnId]) btn.innerHTML = buttonTexts[btnId];
            }
        });
        
        this.editMode && this.isAdmin ? document.body.classList.add('edit-mode') : document.body.classList.remove('edit-mode');
    }

    reloadPageData() {
        document.dispatchEvent(new CustomEvent('adminModeChanged', {
            detail: { editMode: this.editMode, isAdmin: this.isAdmin }
        }));
    }

    getStatus() { return { isAdmin: this.isAdmin, editMode: this.editMode }; }
}

window.adminSystem = new AdminSystem();
