// js/ui/Renderer.js
// 完整版 UI 渲染器，包含筛选器动态生成、详情弹窗、权限 UI 更新

import EventBus, { EVENTS } from '../core/EventBus.js';
import DataService from '../services/DataService.js';
import ApiClient from '../core/ApiClient.js';
import { CATEGORY_MAP, STATUS_COLORS, STATUS_TEXT, TYPE_COLORS } from '../config/constants.js';

class Renderer {
    constructor() {
        this.currentFilter = 'all';
        this.DOM = {
            projectsGrid: document.getElementById('projects-grid'),
            advisorsGrid: document.getElementById('advisors-grid'),
            studentsGrid: document.getElementById('students-grid'),
            publicationsGrid: document.getElementById('publications-grid'),
            updatesGrid: document.getElementById('updates-grid'),
            filtersContainer: document.querySelector('.filters'),
            sectionHeader: document.querySelector('#projects .section-header')
        };

        this.init();
    }

    init() {
        // 监听数据变化事件
        EventBus.on(EVENTS.DATA_CHANGED, () => this.renderAll());
        
        // 监听认证状态变化
        EventBus.on(EVENTS.AUTH_CHANGED, () => {
            this.updatePermissionUI();
            this.renderAll();
        });

        // 监听打开编辑器事件（由 ModalManager 处理，此处只做转发）
        EventBus.on('ui:open-editor', ({ type, id }) => {
            // 触发具体类型的编辑事件，由外部 ModalManager 监听
            EventBus.emit(`ui:edit-${type}`, { id });
        });

        // 设置全局点击委托
        this.setupGlobalDelegation();
        
        // 绑定各区域的"新增"按钮
        this.bindAddButtons();
        
        // 初始渲染
        this.renderAll();
        this.updatePermissionUI();
    }

    /**
     * 为各个编辑按钮（新增）绑定事件
     */
    bindAddButtons() {
        const buttons = [
            { id: 'edit-projects-btn', type: 'project' },
            { id: 'edit-advisors-btn', type: 'advisor' },
            { id: 'edit-students-btn', type: 'student' },
            { id: 'edit-publications-btn', type: 'publication' },
            { id: 'edit-updates-btn', type: 'update' }
        ];

        buttons.forEach(({ id, type }) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (!ApiClient.hasValidToken()) {
                        EventBus.emit(EVENTS.UI_SHOW_TOAST, {
                            message: '🔐 请先输入 GitHub Token 以编辑数据',
                            type: 'warning'
                        });
                        EventBus.emit('ui:request-token', {
                            callback: () => EventBus.emit(`ui:edit-${type}`, {})
                        });
                    } else {
                        EventBus.emit(`ui:edit-${type}`, {});
                    }
                });
            }
        });
    }

    /**
     * 全局事件委托（处理详情、编辑、删除等按钮点击）
     */
    setupGlobalDelegation() {
        document.addEventListener('click', (e) => {
            // 处理项目详情按钮
            const detailsBtn = e.target.closest('.project-details-btn');
            if (detailsBtn) {
                e.preventDefault();
                const id = detailsBtn.dataset.id;
                this.showProjectDetails(id);
                return;
            }

            // 处理编辑按钮（带有 data-edit-type 属性）
            const editBtn = e.target.closest('[data-edit-type]');
            if (editBtn) {
                e.preventDefault();
                const type = editBtn.dataset.editType;
                const id = editBtn.dataset.id;
                
                if (!ApiClient.hasValidToken()) {
                    EventBus.emit(EVENTS.UI_SHOW_TOAST, { 
                        message: '🔐 请先输入 GitHub Token 以编辑数据', 
                        type: 'warning' 
                    });
                    EventBus.emit('ui:request-token', { 
                        callback: () => EventBus.emit(`ui:edit-${type}`, { id })
                    });
                    return;
                }
                
                EventBus.emit(`ui:edit-${type}`, { id });
                return;
            }

            // 处理删除按钮（可选）
            const deleteBtn = e.target.closest('[data-delete-type]');
            if (deleteBtn) {
                e.preventDefault();
                const type = deleteBtn.dataset.deleteType;
                const id = deleteBtn.dataset.deleteId;
                const name = deleteBtn.dataset.deleteName || '该项';
                
                if (confirm(`确定要删除 ${name} 吗？此操作不可撤销。`)) {
                    DataService.deleteItem(type, id).catch(err => {
                        EventBus.emit(EVENTS.UI_SHOW_TOAST, {
                            message: `❌ 删除失败: ${err.message}`,
                            type: 'error'
                        });
                    });
                    EventBus.emit(EVENTS.UI_SHOW_TOAST, { 
                        message: '✅ 删除成功', 
                        type: 'success' 
                    });
                }
                return;
            }
        });
    }

    /**
     * 根据认证状态更新 UI（显示/隐藏编辑相关元素）
     */
    updatePermissionUI() {
        const hasToken = ApiClient.hasValidToken();
        const statusDiv = document.getElementById('permission-status');
        const statusMsg = document.getElementById('status-message');
        const enterAdminBtn = document.getElementById('enter-admin-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (statusDiv && statusMsg) {
            if (hasToken) {
                statusMsg.innerHTML = '🔓 管理员模式 | 数据实时同步';
                statusDiv.className = 'permission-status status-authenticated';
                if (enterAdminBtn) enterAdminBtn.style.display = 'none';
                if (logoutBtn) {
                    logoutBtn.style.display = 'inline-block';
                    logoutBtn.onclick = () => {
                        ApiClient.clearToken();
                        EventBus.emit(EVENTS.AUTH_CHANGED);
                        EventBus.emit(EVENTS.UI_SHOW_TOAST, { message: '已退出管理员模式', type: 'info' });
                    };
                }
            } else {
                statusMsg.innerHTML = '👁️ 游客模式 | 只能查看数据';
                statusDiv.className = 'permission-status status-guest';
                if (enterAdminBtn) {
                    enterAdminBtn.style.display = 'inline-block';
                    enterAdminBtn.onclick = () => {
                        EventBus.emit('ui:request-token', { callback: () => {
                            EventBus.emit(EVENTS.AUTH_CHANGED);
                            DataService.syncFromGitHub();
                        }});
                    };
                }
                if (logoutBtn) logoutBtn.style.display = 'none';
            }
        }

        // 显示/隐藏编辑按钮区域
        const editSectionBtns = [
            'edit-projects-btn',
            'edit-advisors-btn',
            'edit-students-btn',
            'edit-publications-btn',
            'edit-updates-btn'
        ];
        editSectionBtns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = hasToken ? 'inline-block' : 'none';
        });
    }

    /**
     * 渲染所有区域
     */
    renderAll() {
        // 首先根据项目数据动态生成筛选按钮
        this.renderFilterButtons();
        // 然后渲染各区域
        this.renderProjects();
        this.renderAdvisors();
        this.renderStudents();
        this.renderPublications();
        this.renderUpdates();
    }

    /**
     * 动态生成筛选按钮（基于实际数据中的分类）
     */
    renderFilterButtons() {
        if (!this.DOM.filtersContainer) return;
        
        const projects = DataService.getData('projects');
        // 提取所有不重复的分类
        const categories = [...new Set(projects.map(p => p.category))];
        
        // 如果没有项目，隐藏筛选器或显示提示
        if (projects.length === 0) {
            this.DOM.filtersContainer.innerHTML = `<p style="text-align:center; color: var(--gray-color);">暂无课题数据，请先添加课题</p>`;
            return;
        }
        
        // 构建按钮 HTML
        let html = `<button class="filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">全部课题</button>`;
        
        categories.forEach(cat => {
            const displayName = CATEGORY_MAP[cat] || cat;
            const activeClass = this.currentFilter === cat ? 'active' : '';
            html += `<button class="filter-btn ${activeClass}" data-filter="${cat}">${displayName}</button>`;
        });
        
        this.DOM.filtersContainer.innerHTML = html;
        
        // 重新绑定筛选事件
        this.DOM.filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.DOM.filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderProjects();
                
                // 平滑滚动到项目区域
                document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    /**
     * 渲染项目卡片
     */
    renderProjects() {
        if (!this.DOM.projectsGrid) return;
        
        const projects = DataService.getData('projects');
        const filtered = this.currentFilter === 'all' 
            ? projects 
            : projects.filter(p => p.category === this.currentFilter);

        if (filtered.length === 0) {
            this.DOM.projectsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-flask" style="font-size: 3rem; opacity: 0.3;"></i>
                    <p>暂无相关课题</p>
                    <p style="font-size: 0.9rem;">尝试切换筛选条件或添加新课题</p>
                </div>
            `;
            return;
        }

        const hasToken = ApiClient.hasValidToken();
        
        this.DOM.projectsGrid.innerHTML = filtered.map(project => {
            const statusColor = STATUS_COLORS[project.statusType] || '#1abc9c';
            const statusText = STATUS_TEXT[project.statusType] || project.status;
            
            return `
            <div class="project-card" data-id="${project.id}" data-category="${project.category}">
                <div class="project-image">
                    <img src="${project.image || 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500'}" 
                         alt="${this.escapeHtml(project.title)}" 
                         loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500'">
                    <div class="project-status-tag" style="background-color: ${statusColor}20; color: ${statusColor}">
                        ${statusText}
                    </div>
                </div>
                <div class="project-content">
                    <span class="project-category">${CATEGORY_MAP[project.category] || project.category}</span>
                    <h3 class="project-title">${this.escapeHtml(project.title)}</h3>
                    <p class="project-description">${this.escapeHtml(this.truncate(project.description, 120))}</p>
                    <div class="project-meta">
                        <div class="project-advisor">
                            <i class="fas fa-user-graduate"></i>
                            <span>${this.escapeHtml(project.advisor)}</span>
                        </div>
                        <div class="project-status">
                            <i class="fas fa-circle" style="color: ${statusColor}"></i>
                            <span>${statusText}</span>
                        </div>
                    </div>
                    <div class="project-actions">
                        <button class="btn btn-outline project-details-btn" data-id="${project.id}">
                            <i class="fas fa-info-circle"></i> 详情
                        </button>
                        ${hasToken ? `
                            <button class="btn btn-outline" data-edit-type="project" data-id="${project.id}" title="编辑课题">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline" data-delete-type="projects" data-delete-id="${project.id}" 
                                    data-delete-name="${this.escapeHtml(project.title)}" title="删除课题"
                                    style="color: #e74c3c;">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                    <div class="project-meta-footer">
                        <small>📅 更新于 ${this.formatDate(project.updatedAt)}</small>
                    </div>
                </div>
            </div>
        `}).join('');
    }

    /**
     * 显示项目详情模态框（简化版，完整版应由 ModalManager 处理）
     */
    showProjectDetails(projectId) {
        const project = DataService.getData('projects').find(p => p.id == projectId);
        if (!project) return;

        // 触发详情显示事件，由 ModalManager 或 app.js 处理
        EventBus.emit('ui:show-details', { type: 'project', data: project });
        
        // 简单降级：如果 2 秒内没有模态框出现，用 alert 显示基本信息
        const timeout = setTimeout(() => {
            alert(`
课题：${project.title}
导师：${project.advisor}
状态：${STATUS_TEXT[project.statusType] || project.status}
分类：${CATEGORY_MAP[project.category] || project.category}

描述：${project.description}
            `.trim());
        }, 200);
        
        // 如果事件被处理，清除降级定时器
        EventBus.once('ui:details-handled', () => clearTimeout(timeout));
    }

    /**
     * 渲染导师卡片
     */
    renderAdvisors() {
        if (!this.DOM.advisorsGrid) return;
        const advisors = DataService.getData('advisors');
        const hasToken = ApiClient.hasValidToken();
        
        this.DOM.advisorsGrid.innerHTML = advisors.map(advisor => `
            <div class="advisor-card" data-id="${advisor.id}">
                <div class="advisor-avatar">
                    <img src="${advisor.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200'}" 
                         alt="${this.escapeHtml(advisor.name)}" 
                         loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200'">
                </div>
                <h3 class="advisor-name">${this.escapeHtml(advisor.name)}</h3>
                <p class="advisor-title">${this.escapeHtml(advisor.title)}</p>
                <p class="advisor-field">${this.escapeHtml(advisor.field)}</p>
                <p class="advisor-bio">${this.escapeHtml(this.truncate(advisor.bio, 150))}</p>
                <div class="advisor-contact">
                    ${advisor.email ? `<a href="mailto:${advisor.email}" title="发送邮件"><i class="fas fa-envelope"></i></a>` : ''}
                    ${advisor.website ? `<a href="${advisor.website}" target="_blank" title="个人主页"><i class="fas fa-globe"></i></a>` : ''}
                    ${hasToken ? `
                        <button data-edit-type="advisor" data-id="${advisor.id}" style="background:none;border:none;cursor:pointer;" title="编辑导师">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-delete-type="advisors" data-delete-id="${advisor.id}" 
                                data-delete-name="${this.escapeHtml(advisor.name)}"
                                style="background:none;border:none;cursor:pointer;color:#e74c3c;" title="删除导师">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="advisor-meta-footer">
                    <small>📅 更新于 ${this.formatDate(advisor.updatedAt)}</small>
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染学生卡片
     */
    renderStudents() {
        if (!this.DOM.studentsGrid) return;
        const students = DataService.getData('students');
        const hasToken = ApiClient.hasValidToken();
        
        this.DOM.studentsGrid.innerHTML = students.map(student => `
            <div class="student-card" data-id="${student.id}">
                <div class="student-avatar">
                    <img src="${student.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}" 
                         alt="${this.escapeHtml(student.name)}" 
                         loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'">
                </div>
                <h3 class="student-name">${this.escapeHtml(student.name)}</h3>
                <p class="student-degree">${this.escapeHtml(student.degree)}</p>
                <p class="student-field">${this.escapeHtml(student.field)}</p>
                <p class="student-supervisor"><i class="fas fa-user-tie"></i> ${this.escapeHtml(student.supervisor)}</p>
                <p class="student-research">${this.escapeHtml(this.truncate(student.research, 100))}</p>
                <div class="student-contact">
                    ${student.email ? `<a href="mailto:${student.email}"><i class="fas fa-envelope"></i></a>` : ''}
                    ${hasToken ? `
                        <button data-edit-type="student" data-id="${student.id}" style="background:none;border:none;cursor:pointer;" title="编辑学生">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-delete-type="students" data-delete-id="${student.id}" 
                                data-delete-name="${this.escapeHtml(student.name)}"
                                style="background:none;border:none;cursor:pointer;color:#e74c3c;" title="删除学生">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="student-meta-footer">
                    <small>📅 更新于 ${this.formatDate(student.updatedAt)}</small>
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染学术成果
     */
    renderPublications() {
        if (!this.DOM.publicationsGrid) return;
        const pubs = DataService.getData('publications');
        const hasToken = ApiClient.hasValidToken();
        
        this.DOM.publicationsGrid.innerHTML = pubs.map(pub => `
            <div class="publication-card">
                <div class="publication-header">
                    <span class="publication-type" style="background-color: ${TYPE_COLORS[pub.type] || '#3498db'}20; color: ${TYPE_COLORS[pub.type] || '#3498db'}">
                        ${pub.type}
                    </span>
                    <h3 class="publication-title">${this.escapeHtml(pub.title)}</h3>
                    <p class="publication-authors"><i class="fas fa-users"></i> ${this.escapeHtml(pub.authors)}</p>
                    <p class="publication-venue"><i class="fas fa-book"></i> ${this.escapeHtml(pub.venue)}</p>
                    ${pub.doi ? `<p class="publication-doi"><i class="fas fa-link"></i> DOI: ${pub.doi}</p>` : ''}
                </div>
                <div class="publication-body">
                    <p class="publication-abstract"><strong>摘要：</strong>${this.escapeHtml(this.truncate(pub.abstract, 200))}</p>
                    <div class="publication-actions">
                        ${pub.link ? `<a href="${pub.link}" target="_blank" class="btn btn-outline"><i class="fas fa-external-link-alt"></i> 查看全文</a>` : ''}
                        ${hasToken ? `
                            <button class="btn btn-outline" data-edit-type="publication" data-id="${pub.id}">
                                <i class="fas fa-edit"></i> 编辑
                            </button>
                            <button class="btn btn-outline" data-delete-type="publications" data-delete-id="${pub.id}" 
                                    data-delete-name="${this.escapeHtml(pub.title)}"
                                    style="color:#e74c3c;">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染研究近况
     */
    renderUpdates() {
        if (!this.DOM.updatesGrid) return;
        const updates = DataService.getData('updates');
        const hasToken = ApiClient.hasValidToken();
        
        const sorted = [...updates].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        this.DOM.updatesGrid.innerHTML = sorted.map(update => `
            <div class="update-card">
                <div class="update-header">
                    <div class="update-date-wrapper">
                        <span class="update-date" style="background-color: ${TYPE_COLORS[update.type] || '#3498db'}20; color: ${TYPE_COLORS[update.type] || '#3498db'}">
                            ${this.formatDate(update.date)}
                        </span>
                        <span class="update-type" style="color: ${TYPE_COLORS[update.type] || '#3498db'}">${update.type}</span>
                    </div>
                    <h3 class="update-title">${this.escapeHtml(update.title)}</h3>
                </div>
                <div class="update-body">
                    <p class="update-content">${this.escapeHtml(this.truncate(update.content, 150))}</p>
                    <div class="update-footer">
                        <div class="update-project">
                            <i class="fas fa-project-diagram"></i>
                            <span>${this.escapeHtml(update.project || '未关联')}</span>
                        </div>
                        ${hasToken ? `
                            <div class="update-actions">
                                <button class="btn btn-outline" data-edit-type="update" data-id="${update.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-outline" data-delete-type="updates" data-delete-id="${update.id}" 
                                        data-delete-name="${this.escapeHtml(update.title)}"
                                        style="color:#e74c3c;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ========== 辅助方法 ==========
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncate(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    formatDate(dateStr) {
        if (!dateStr) return '未知';
        try {
            return new Date(dateStr).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch {
            return dateStr;
        }
    }
}

// 导出单例
export default new Renderer();
