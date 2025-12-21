// js/form-handler.js - 表单处理逻辑
document.addEventListener('DOMContentLoaded', function() {
    const manager = window.githubManager; // 修复：统一全局变量名
    const projectForm = document.getElementById('project-form');
    const formMessage = document.getElementById('form-message');
    const tokenAlert = document.getElementById('token-alert');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const submitLoading = document.getElementById('submit-loading');
    const projectsList = document.getElementById('projects-list');
    
    // 初始化：检查 Token 并显示提示（修复：判断 manager 存在）
    if (manager && !manager.hasValidToken() && tokenAlert) {
        tokenAlert.style.display = 'block';
    }
    
    // 全局保存 Token 函数
    window.saveGitHubToken = function() {
        const tokenInput = document.getElementById('github-token-input');
        const token = tokenInput.value.trim();
        
        if (!token) {
            alert('请输入 GitHub Token');
            return;
        }
        
        if (manager && manager.setToken(token)) {
            if (tokenAlert) {
                tokenAlert.innerHTML = `
                    <div class="alert alert-success">
                        <h4>✅ Token 设置成功！</h4>
                        <p>现在可以提交课题了。Token 已安全保存在您的浏览器中。</p>
                    </div>
                `;
            }
            loadProjects(); // 加载已有课题
        } else {
            alert('Token 格式不正确，请检查！');
        }
    };
    
    // 表单提交处理
    if (projectForm && manager) { // 修复：增加 manager 存在判断
        projectForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!manager.hasValidToken()) {
                if (formMessage) {
                    formMessage.innerHTML = `
                        <div class="alert alert-warning">
                            <h4>⚠️ 需要设置 Token</h4>
                            <p>请先在上方设置 GitHub Token 以提交课题。</p>
                        </div>
                    `;
                }
                if (tokenAlert) {
                    tokenAlert.style.display = 'block';
                }
                return;
            }
            
            // 收集表单数据
            const formData = {
                title: document.getElementById('project-title').value.trim(),
                description: document.getElementById('project-description').value.trim(),
                student: document.getElementById('student-name').value.trim(),
                supervisor: document.getElementById('supervisor-name').value.trim(),
                tags: document.getElementById('project-tags').value.trim()
            };
            
            // 验证必填字段
            if (!formData.title || !formData.description) {
                if (formMessage) {
                    formMessage.innerHTML = `
                        <div class="alert alert-warning">
                            <h4>⚠️ 请填写完整</h4>
                            <p>课题名称和描述是必填项。</p>
                        </div>
                    `;
                }
                return;
            }
            
            // 显示加载状态
            if (submitText) submitText.style.display = 'none';
            if (submitLoading) submitLoading.style.display = 'inline';
            if (submitBtn) submitBtn.disabled = true;
            
            try {
                // 提交到 GitHub Issues（使用修复后的 manager 方法）
                const result = await manager.submitNewProject(formData);
                
                // 显示成功消息
                if (formMessage) {
                    formMessage.innerHTML = `
                        <div class="alert alert-success">
                            <h4>🎉 提交成功！</h4>
                            <p><strong>${formData.title}</strong> 已提交审核。</p>
                            <p>Issue 编号: <a href="${result.issueUrl}" target="_blank" style="color: #155724; font-weight: bold;">#${result.issueNumber}</a></p>
                            <p>审核通过后将在网站展示，您可以在 GitHub 上跟踪审核进度。</p>
                            <button onclick="loadProjects()" class="btn btn-primary" style="margin-top: 15px;">刷新课题列表</button>
                        </div>
                    `;
                }
                
                // 清空表单
                projectForm.reset();
                
                // 重新加载课题列表
                setTimeout(loadProjects, 2000);
                
            } catch (error) {
                // 显示错误消息
                if (formMessage) {
                    formMessage.innerHTML = `
                        <div class="alert alert-error">
                            <h4>❌ 提交失败</h4>
                            <p><strong>错误信息：</strong> ${error.message}</p>
                            <p>可能的原因：</p>
                            <ul>
                                <li>Token 无效或已过期（需 repo 权限）</li>
                                <li>网络连接问题</li>
                                <li>GitHub API 限制</li>
                            </ul>
                            <p>请检查 Token 设置或稍后重试。</p>
                        </div>
                    `;
                }
                console.error('提交错误:', error);
                
            } finally {
                // 恢复按钮状态
                if (submitText) submitText.style.display = 'inline';
                if (submitLoading) submitLoading.style.display = 'none';
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
    
    // 加载并显示课题列表
    async function loadProjects() {
        if (!projectsList || !manager) return;
        
        projectsList.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>加载课题中...</p>
            </div>
        `;
        
        try {
            const projects = await manager.getAllProjects();
            
            if (projects.length === 0) {
                projectsList.innerHTML = `
                    <div class="empty-state">
                        <p>📭 暂无已提交的课题</p>
                        <p>成为第一个提交课题的研究生！</p>
                    </div>
                `;
                return;
            }
            
            // 渲染课题列表
            projectsList.innerHTML = projects.map(project => `
                <div class="project-card" data-status="${project.status.toLowerCase()}">
                    <div class="project-header">
                        <span class="project-status ${getStatusClass(project.status)}">
                            ${getStatusIcon(project.status)} ${project.status}
                        </span>
                        <span class="project-number">#${project.number}</span>
                    </div>
                    <h4 class="project-title">${project.title}</h4>
                    <p class="project-desc">${project.description.substring(0, 120)}...</p>
                    <div class="project-meta">
                        <span>👨‍🎓 ${project.student}</span>
                        <span>👨‍🏫 ${project.supervisor}</span>
                        <span class="project-date">📅 ${project.createdAt}</span>
                    </div>
                    <div class="project-tags">
                        ${project.tags.split(',').map(tag => 
                            `<span class="tag">${tag.trim()}</span>`
                        ).join('')}
                    </div>
                    <a href="${project.url}" target="_blank" class="project-link">
                        查看详情 →
                    </a>
                </div>
            `).join('');
            
        } catch (error) {
            projectsList.innerHTML = `
                <div class="error-state">
                    <p>⚠️ 加载课题列表失败</p>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    // 辅助函数：获取状态图标
    function getStatusIcon(status) {
        const icons = {
            '待审核': '⏳',
            '审核通过': '✅',
            '已发布': '🚀',
            '需要修改': '📝',
            '新提交': '🆕'
        };
        return icons[status] || '📄';
    }
    
    // 辅助函数：获取状态 CSS 类
    function getStatusClass(status) {
        const classes = {
            '待审核': 'status-pending',
            '审核通过': 'status-approved',
            '已发布': 'status-published',
            '需要修改': 'status-revision',
            '新提交': 'status-new'
        };
        return classes[status] || 'status-default';
    }
    
    // 页面加载时获取课题列表
    if (manager && manager.hasValidToken()) {
        loadProjects();
    }
    
    // 使 loadProjects 在全局可用
    window.loadProjects = loadProjects;
});
