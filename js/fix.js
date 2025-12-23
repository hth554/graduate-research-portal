// fixes.js - 修复编辑按钮问题
document.addEventListener('DOMContentLoaded', function() {
    // 等待所有脚本加载完成
    setTimeout(function() {
        // 修复GitHub文件映射
        if (window.labWebsite && window.labWebsite.GITHUB_FILES) {
            window.labWebsite.GITHUB_FILES = {
                PROJECTS: 'projects.json',
                ADVISORS: 'advisors.json', 
                STUDENTS: 'students.json',
                PUBLICATIONS: 'publications.json',
                UPDATES: 'updates.json'
            };
        }
        
        // 重写编辑按钮绑定函数
        window.bindEditButtons = function() {
            console.log('绑定编辑按钮...');
            
            // 使用事件委托，避免动态元素问题
            document.addEventListener('click', function(e) {
                const target = e.target.closest('[class*="edit-btn"]');
                if (!target || target.classList.contains('disabled')) return;
                
                const id = target.getAttribute('data-id');
                const classes = target.className;
                
                e.preventDefault();
                e.stopPropagation();
                
                // 检查权限
                if (!window.adminSystem || !window.adminSystem.isAdmin) {
                    alert('请先进入管理员模式');
                    return;
                }
                
                // 调用对应的编辑函数
                if (classes.includes('advisor-edit-btn')) {
                    window.showEditAdvisorForm(id);
                } else if (classes.includes('student-edit-btn')) {
                    window.showEditStudentForm(id);
                } else if (classes.includes('project-edit-btn')) {
                    window.showEditProjectForm(id);
                } else if (classes.includes('edit-publication-btn')) {
                    window.showEditPublicationForm(id);
                } else if (classes.includes('edit-update-btn')) {
                    window.showEditUpdateForm(id);
                }
            });
        };
        
        // 初始化
        setTimeout(window.bindEditButtons, 1000);
        
        // 添加缺失的模态框样式
        const modalStyles = `
            .modal { 
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                background: rgba(0,0,0,0.7); 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                z-index: 2000; 
                opacity: 0; 
                visibility: hidden; 
                transition: opacity 0.3s, visibility 0.3s; 
            }
            .modal.show { 
                opacity: 1; 
                visibility: visible; 
            }
            .modal-content { 
                background: white; 
                border-radius: 12px; 
                width: 90%; 
                max-width: 800px; 
                max-height: 80vh; 
                overflow-y: auto; 
                transform: translateY(20px); 
                transition: transform 0.3s; 
            }
            .modal.show .modal-content { 
                transform: translateY(0); 
            }
        `;
        
        const styleEl = document.createElement('style');
        styleEl.textContent = modalStyles;
        document.head.appendChild(styleEl);
        
        console.log('修复补丁已加载');
    }, 2000);
});
