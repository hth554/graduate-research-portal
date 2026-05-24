// js/ui/ModalManager.js
// 模态框管理器，负责所有弹窗（编辑表单、详情、Token 输入）

import EventBus, { EVENTS } from '../core/EventBus.js';
import DataService from '../services/DataService.js';
import ApiClient from '../core/ApiClient.js';
import Toast from './Toast.js';
import { CATEGORY_MAP, STATUS_TEXT, TYPE_COLORS } from '../config/constants.js';

class ModalManager {
    constructor() {
        this.currentModal = null;
        this.init();
    }

    init() {
        // 监听编辑请求
        EventBus.on('ui:edit-project', ({ id }) => this.showProjectEditor(id));
        EventBus.on('ui:edit-advisor', ({ id }) => this.showAdvisorEditor(id));
        EventBus.on('ui:edit-student', ({ id }) => this.showStudentEditor(id));
        EventBus.on('ui:edit-publication', ({ id }) => this.showPublicationEditor(id));
        EventBus.on('ui:edit-update', ({ id }) => this.showUpdateEditor(id));

        // 监听详情显示请求
        EventBus.on('ui:show-details', ({ type, data }) => this.showDetailsModal(type, data));

        // 监听 Token 请求
        EventBus.on('ui:request-token', ({ callback }) => this.showTokenModal(callback));

        // 监听 ESC 关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeModal();
            }
        });
    }

    // ========== 模态框基础方法 ==========

    createModal(content, options = {}) {
        this.closeModal(); // 关闭现有弹窗

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: ${options.width || '600px'};">
                ${content}
            </div>
        `;
        document.body.appendChild(modal);

        // 绑定关闭事件
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
        modal.querySelector('.modal-close')?.addEventListener('click', () => this.closeModal());

        // 动画
        setTimeout(() => modal.classList.add('show'), 10);

        this.currentModal = modal;
        return modal;
    }

    closeModal() {
        if (this.currentModal) {
            this.currentModal.classList.remove('show');
            setTimeout(() => {
                if (this.currentModal?.parentNode) {
                    this.currentModal.parentNode.removeChild(this.currentModal);
                }
                this.currentModal = null;
            }, 300);
        }
    }

    // ========== Token 输入模态框 ==========

    showTokenModal(callback) {
        const content = `
            <div class="modal-header">
                <h3><i class="fas fa-key"></i> 连接 GitHub 数据库</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 20px;">
                    <p style="margin-bottom: 10px;">请输入 GitHub Personal Access Token 以启用编辑功能。</p>
                    <p style="font-size: 0.9rem; color: #666; background: #f8f9fa; padding: 12px; border-radius: 6px;">
                        <strong>🔐 安全提示：</strong> 请使用 <strong>Fine-grained Token</strong>，仅授予此仓库的 <code>Contents</code> 读写权限。
                        <a href="https://github.com/settings/tokens?type=beta" target="_blank" style="display: inline-block; margin-top: 8px;">
                            点击生成新 Token →
                        </a>
                    </p>
                </div>
                <form id="tokenForm">
                    <div class="form-group">
                        <label for="tokenInput">Token</label>
                        <input type="password" id="tokenInput" class="form-control" placeholder="github_pat_xxxx..." required>
                        <small style="color: #666;">Token 仅保存在您的浏览器中，不会上传到服务器。</small>
                    </div>
                    <div class="form-actions" style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">保存并连接</button>
                    </div>
                </form>
            </div>
        `;

        const modal = this.createModal(content, { width: '500px' });

        const form = modal.querySelector('#tokenForm');
        const cancelBtn = modal.querySelector('.cancel-btn');

        cancelBtn.addEventListener('click', () => this.closeModal());

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = form.querySelector('#tokenInput').value.trim();

            if (!token) {
                Toast.warning('请输入 Token');
                return;
            }

            if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
                Toast.error('Token 格式无效，应以 ghp_ 或 github_pat_ 开头');
                return;
            }

            // 设置 Token
            const success = ApiClient.setToken(token);
            if (success) {
                Toast.success('Token 验证成功！');
                this.closeModal();
                
                // 触发认证变更事件
                EventBus.emit(EVENTS.AUTH_CHANGED);
                
                // 同步数据
                await DataService.syncFromGitHub();
                
                // 执行回调
                if (callback) callback();
            } else {
                Toast.error('Token 设置失败');
            }
        });
    }

    // ========== 项目编辑/详情模态框 ==========

    showProjectEditor(projectId = null) {
        const projects = DataService.getData('projects');
        const project = projectId ? projects.find(p => p.id == projectId) : {
            title: '', category: 'ai_model', description: '', advisor: '',
            status: '筹备中', statusType: 'preparation',
            image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500'
        };
        const isEdit = !!projectId;

        const content = `
            <div class="modal-header">
                <h3>${isEdit ? '编辑课题' : '添加新课题'}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="projectForm">
                    <div class="form-group">
                        <label>课题标题 *</label>
                        <input type="text" name="title" value="${this.escapeHtml(project.title)}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>分类 *</label>
                            <select name="category" required>
                                ${Object.entries(CATEGORY_MAP).map(([val, label]) => 
                                    `<option value="${val}" ${project.category === val ? 'selected' : ''}>${label}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>状态 *</label>
                            <select name="statusType" required>
                                ${Object.entries(STATUS_TEXT).map(([val, label]) => 
                                    `<option value="${val}" ${project.statusType === val ? 'selected' : ''}>${label}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>描述 *</label>
                        <textarea name="description" rows="4" required>${this.escapeHtml(project.description)}</textarea>
                    </div>
                    <div class="form-group">
                        <label>指导老师 *</label>
                        <input type="text" name="advisor" value="${this.escapeHtml(project.advisor)}" required>
                    </div>
                    <div class="form-group">
                        <label>图片 URL</label>
                        <input type="url" name="image" value="${this.escapeHtml(project.image || '')}" placeholder="https://...">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">${isEdit ? '更新' : '添加'}</button>
                        ${isEdit ? `<button type="button" class="btn btn-danger delete-btn">删除</button>` : ''}
                    </div>
                </form>
            </div>
        `;

        const modal = this.createModal(content, { width: '700px' });
        const form = modal.querySelector('#projectForm');

        modal.querySelector('.cancel-btn').addEventListener('click', () => this.closeModal());

        if (isEdit) {
            modal.querySelector('.delete-btn').addEventListener('click', async () => {
                if (confirm('确定删除此课题？')) {
                    try {
                        await DataService.deleteItem('projects', projectId);
                        Toast.success('课题已删除');
                        this.closeModal();
                    } catch (error) {
                        Toast.error(`删除失败: ${error.message}`);
                    }
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                title: formData.get('title'),
                category: formData.get('category'),
                description: formData.get('description'),
                advisor: formData.get('advisor'),
                statusType: formData.get('statusType'),
                status: STATUS_TEXT[formData.get('statusType')],
                image: formData.get('image') || 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500'
            };

            try {
                if (isEdit) {
                    await DataService.updateItem('projects', projectId, data);
                    Toast.success('课题已更新');
                } else {
                    await DataService.addItem('projects', data);
                    Toast.success('课题已添加');
                }
                this.closeModal();
            } catch (error) {
                Toast.error(`保存失败: ${error.message}`);
            }
        });
    }

    // ========== 导师编辑 ==========

    showAdvisorEditor(advisorId = null) {
        const advisors = DataService.getData('advisors');
        const advisor = advisorId ? advisors.find(a => a.id == advisorId) : {
            name: '', title: '', field: '', bio: '',
            avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200',
            email: '', website: ''
        };
        const isEdit = !!advisorId;

        const content = `
            <div class="modal-header">
                <h3>${isEdit ? '编辑导师' : '添加导师'}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="advisorForm">
                    <div class="form-group">
                        <label>姓名 *</label>
                        <input type="text" name="name" value="${this.escapeHtml(advisor.name)}" required>
                    </div>
                    <div class="form-group">
                        <label>职称 *</label>
                        <input type="text" name="title" value="${this.escapeHtml(advisor.title)}" required placeholder="教授，博士生导师">
                    </div>
                    <div class="form-group">
                        <label>研究领域 *</label>
                        <input type="text" name="field" value="${this.escapeHtml(advisor.field)}" required>
                    </div>
                    <div class="form-group">
                        <label>个人简介 *</label>
                        <textarea name="bio" rows="4" required>${this.escapeHtml(advisor.bio)}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>邮箱</label>
                            <input type="email" name="email" value="${this.escapeHtml(advisor.email || '')}">
                        </div>
                        <div class="form-group">
                            <label>个人主页</label>
                            <input type="url" name="website" value="${this.escapeHtml(advisor.website || '')}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>头像 URL</label>
                        <input type="url" name="avatar" value="${this.escapeHtml(advisor.avatar || '')}">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">${isEdit ? '更新' : '添加'}</button>
                        ${isEdit ? `<button type="button" class="btn btn-danger delete-btn">删除</button>` : ''}
                    </div>
                </form>
            </div>
        `;

        const modal = this.createModal(content, { width: '700px' });
        const form = modal.querySelector('#advisorForm');

        modal.querySelector('.cancel-btn').addEventListener('click', () => this.closeModal());

        if (isEdit) {
            modal.querySelector('.delete-btn').addEventListener('click', async () => {
                if (confirm('确定删除此导师？')) {
                    try {
                        await DataService.deleteItem('advisors', advisorId);
                        Toast.success('导师已删除');
                        this.closeModal();
                    } catch (error) {
                        Toast.error(`删除失败: ${error.message}`);
                    }
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.avatar = data.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200';

            try {
                if (isEdit) {
                    await DataService.updateItem('advisors', advisorId, data);
                    Toast.success('导师信息已更新');
                } else {
                    await DataService.addItem('advisors', data);
                    Toast.success('导师已添加');
                }
                this.closeModal();
            } catch (error) {
                Toast.error(`保存失败: ${error.message}`);
            }
        });
    }

    // ========== 学生编辑（已移除 GitHub 输入框） ==========

    showStudentEditor(studentId = null) {
        const students = DataService.getData('students');
        const student = studentId ? students.find(s => s.id == studentId) : {
            name: '', degree: '硕士研究生', field: '', supervisor: '', research: '',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
            email: ''
        };
        const isEdit = !!studentId;

        const degreeOptions = ['本科生', '硕士研究生', '博士研究生', '博士后'];

        const content = `
            <div class="modal-header">
                <h3>${isEdit ? '编辑学生' : '添加学生'}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="studentForm">
                    <div class="form-group">
                        <label>姓名 *</label>
                        <input type="text" name="name" value="${this.escapeHtml(student.name)}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>学位 *</label>
                            <select name="degree" required>
                                ${degreeOptions.map(opt => 
                                    `<option value="${opt}" ${student.degree === opt ? 'selected' : ''}>${opt}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>专业领域 *</label>
                            <input type="text" name="field" value="${this.escapeHtml(student.field)}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>指导老师 *</label>
                        <input type="text" name="supervisor" value="${this.escapeHtml(student.supervisor)}" required>
                    </div>
                    <div class="form-group">
                        <label>研究方向 *</label>
                        <textarea name="research" rows="3" required>${this.escapeHtml(student.research)}</textarea>
                    </div>
                    <div class="form-group">
                        <label>邮箱</label>
                        <input type="email" name="email" value="${this.escapeHtml(student.email || '')}">
                    </div>
                    <div class="form-group">
                        <label>头像 URL</label>
                        <input type="url" name="avatar" value="${this.escapeHtml(student.avatar || '')}">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">${isEdit ? '更新' : '添加'}</button>
                        ${isEdit ? `<button type="button" class="btn btn-danger delete-btn">删除</button>` : ''}
                    </div>
                </form>
            </div>
        `;

        const modal = this.createModal(content, { width: '700px' });
        const form = modal.querySelector('#studentForm');

        modal.querySelector('.cancel-btn').addEventListener('click', () => this.closeModal());

        if (isEdit) {
            modal.querySelector('.delete-btn').addEventListener('click', async () => {
                if (confirm('确定删除此学生？')) {
                    try {
                        await DataService.deleteItem('students', studentId);
                        Toast.success('学生已删除');
                        this.closeModal();
                    } catch (error) {
                        Toast.error(`删除失败: ${error.message}`);
                    }
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.avatar = data.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200';

            try {
                if (isEdit) {
                    await DataService.updateItem('students', studentId, data);
                    Toast.success('学生信息已更新');
                } else {
                    await DataService.addItem('students', data);
                    Toast.success('学生已添加');
                }
                this.closeModal();
            } catch (error) {
                Toast.error(`保存失败: ${error.message}`);
            }
        });
    }

    // ========== 学术成果编辑 ==========

    showPublicationEditor(pubId = null) {
        const pubs = DataService.getData('publications');
        const pub = pubId ? pubs.find(p => p.id == pubId) : {
            type: '期刊论文', title: '', authors: '', venue: '', abstract: '', doi: '', link: ''
        };
        const isEdit = !!pubId;

        const pubTypes = ['期刊论文', '会议论文', '专利', '专著', '技术报告'];

        const content = `
            <div class="modal-header">
                <h3>${isEdit ? '编辑学术成果' : '添加学术成果'}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="pubForm">
                    <div class="form-group">
                        <label>类型 *</label>
                        <select name="type" required>
                            ${pubTypes.map(t => `<option value="${t}" ${pub.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>标题 *</label>
                        <input type="text" name="title" value="${this.escapeHtml(pub.title)}" required>
                    </div>
                    <div class="form-group">
                        <label>作者 *</label>
                        <input type="text" name="authors" value="${this.escapeHtml(pub.authors)}" required>
                    </div>
                    <div class="form-group">
                        <label>发表刊物/会议 *</label>
                        <input type="text" name="venue" value="${this.escapeHtml(pub.venue)}" required>
                    </div>
                    <div class="form-group">
                        <label>摘要 *</label>
                        <textarea name="abstract" rows="4" required>${this.escapeHtml(pub.abstract)}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>DOI</label>
                            <input type="text" name="doi" value="${this.escapeHtml(pub.doi || '')}">
                        </div>
                        <div class="form-group">
                            <label>链接</label>
                            <input type="url" name="link" value="${this.escapeHtml(pub.link || '')}">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">${isEdit ? '更新' : '添加'}</button>
                        ${isEdit ? `<button type="button" class="btn btn-danger delete-btn">删除</button>` : ''}
                    </div>
                </form>
            </div>
        `;

        const modal = this.createModal(content, { width: '700px' });
        const form = modal.querySelector('#pubForm');

        modal.querySelector('.cancel-btn').addEventListener('click', () => this.closeModal());

        if (isEdit) {
            modal.querySelector('.delete-btn').addEventListener('click', async () => {
                if (confirm('确定删除此成果？')) {
                    try {
                        await DataService.deleteItem('publications', pubId);
                        Toast.success('成果已删除');
                        this.closeModal();
                    } catch (error) {
                        Toast.error(`删除失败: ${error.message}`);
                    }
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                if (isEdit) {
                    await DataService.updateItem('publications', pubId, data);
                    Toast.success('成果已更新');
                } else {
                    await DataService.addItem('publications', data);
                    Toast.success('成果已添加');
                }
                this.closeModal();
            } catch (error) {
                Toast.error(`保存失败: ${error.message}`);
            }
        });
    }

    // ========== 研究近况编辑 ==========

    showUpdateEditor(updateId = null) {
        const updates = DataService.getData('updates');
        const projects = DataService.getData('projects');
        const update = updateId ? updates.find(u => u.id == updateId) : {
            date: new Date().toISOString().split('T')[0], title: '', type: '项目进展', content: '', project: ''
        };
        const isEdit = !!updateId;

        const updateTypes = ['项目进展', '学术活动', '科研资助', '团建活动', '荣誉', '产学研合作'];

        const content = `
            <div class="modal-header">
                <h3>${isEdit ? '编辑研究近况' : '添加研究近况'}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="updateForm">
                    <div class="form-group">
                        <label>日期 *</label>
                        <input type="date" name="date" value="${update.date}" required>
                    </div>
                    <div class="form-group">
                        <label>标题 *</label>
                        <input type="text" name="title" value="${this.escapeHtml(update.title)}" required>
                    </div>
                    <div class="form-group">
                        <label>类型 *</label>
                        <select name="type" required>
                            ${updateTypes.map(t => `<option value="${t}" ${update.type === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>内容 *</label>
                        <textarea name="content" rows="4" required>${this.escapeHtml(update.content)}</textarea>
                    </div>
                    <div class="form-group">
                        <label>关联项目</label>
                        <select name="project">
                            <option value="">无关联</option>
                            ${projects.map(p => `<option value="${p.title}" ${update.project === p.title ? 'selected' : ''}>${this.escapeHtml(p.title)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">${isEdit ? '更新' : '添加'}</button>
                        ${isEdit ? `<button type="button" class="btn btn-danger delete-btn">删除</button>` : ''}
                    </div>
                </form>
            </div>
        `;

        const modal = this.createModal(content, { width: '700px' });
        const form = modal.querySelector('#updateForm');

        modal.querySelector('.cancel-btn').addEventListener('click', () => this.closeModal());

        if (isEdit) {
            modal.querySelector('.delete-btn').addEventListener('click', async () => {
                if (confirm('确定删除此近况？')) {
                    try {
                        await DataService.deleteItem('updates', updateId);
                        Toast.success('近况已删除');
                        this.closeModal();
                    } catch (error) {
                        Toast.error(`删除失败: ${error.message}`);
                    }
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            // 添加 projectId
            const selectedProject = projects.find(p => p.title === data.project);
            data.projectId = selectedProject ? selectedProject.id : null;

            try {
                if (isEdit) {
                    await DataService.updateItem('updates', updateId, data);
                    Toast.success('近况已更新');
                } else {
                    await DataService.addItem('updates', data);
                    Toast.success('近况已添加');
                }
                this.closeModal();
            } catch (error) {
                Toast.error(`保存失败: ${error.message}`);
            }
        });
    }

    // ========== 详情模态框 ==========

    showDetailsModal(type, data) {
        EventBus.emit('ui:details-handled'); // 通知 Renderer 降级已处理

        let content = '';
        if (type === 'project') {
            content = `
                <div class="modal-header">
                    <h3>${this.escapeHtml(data.title)}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-image">
                        <img src="${data.image}" alt="${this.escapeHtml(data.title)}" style="width:100%; border-radius:8px;">
                    </div>
                    <div class="modal-info">
                        <p><strong>分类：</strong>${CATEGORY_MAP[data.category] || data.category}</p>
                        <p><strong>指导老师：</strong>${this.escapeHtml(data.advisor)}</p>
                        <p><strong>状态：</strong>${STATUS_TEXT[data.statusType] || data.status}</p>
                        <p><strong>描述：</strong>${this.escapeHtml(data.description)}</p>
                        <p><strong>创建时间：</strong>${data.createdAt || '未知'}</p>
                        <p><strong>更新时间：</strong>${data.updatedAt || '未知'}</p>
                    </div>
                </div>
            `;
        } else {
            // 其他类型的详情可扩展
            content = `
                <div class="modal-header">
                    <h3>详情</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
        }

        this.createModal(content, { width: '700px' });
    }

    // 辅助方法
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 导出单例
export default new ModalManager();
