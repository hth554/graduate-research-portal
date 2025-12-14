// js/github-issues.js - GitHub Issues 集成处理
class GitHubIssuesManager {
    constructor() {
        this.owner = 'HTH554';
        this.repo = 'graduate-research-portal';
        this.apiBase = 'https://api.github.com';
        this.issuesUrl = `${this.apiBase}/repos/${this.owner}/${this.repo}/issues`;
        this.token = localStorage.getItem('github_pat_token');
    }

    // 设置 Token
    setToken(token) {
        if (token && token.startsWith('ghp_') || token.startsWith('github_pat_')) {
            this.token = token;
            localStorage.setItem('github_pat_token', token);
            console.log('Token 已保存到本地存储');
            return true;
        }
        return false;
    }

    // 检查是否有有效 Token
    hasValidToken() {
        return !!this.token && this.token.length > 30;
    }

    // 提交新课题 Issue
    async submitNewProject(projectData) {
        if (!this.hasValidToken()) {
            throw new Error('请先设置有效的 GitHub Token');
        }

        // 构建 Issue 内容
        const issueTitle = `[课题提交] ${projectData.title.substring(0, 100)}`;
        const issueBody = this.formatIssueBody(projectData);

        try {
            const response = await fetch(this.issuesUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    title: issueTitle,
                    body: issueBody,
                    labels: [
                        '课题提交',
                        '待审核',
                        projectData.tags ? projectData.tags.split(',')[0].trim() : '其他'
                    ].filter(Boolean)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`GitHub API 错误: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            return {
                success: true,
                issueNumber: result.number,
                issueUrl: result.html_url,
                title: result.title,
                createdAt: new Date(result.created_at).toLocaleString()
            };

        } catch (error) {
            console.error('提交失败:', error);
            throw error;
        }
    }

    // 格式化 Issue 内容为 Markdown
    formatIssueBody(data) {
        return `## 课题基本信息

**课题名称：** ${data.title}

**研究生：** ${data.student || '未填写'}

**指导老师：** ${data.supervisor || '未填写'}

**研究标签：** ${data.tags || '未分类'}

---

## 课题描述
${data.description}

---

## 提交信息
- **提交时间：** ${new Date().toLocaleString()}
- **状态：** 待审核
- **审核意见：** 

---

## 审核清单
- [ ] 格式检查
- [ ] 内容审核
- [ ] 导师确认
- [ ] 网站发布

---
*此 Issue 由研究生课题门户网站自动生成*`;
    }

    // 获取所有课题 Issues
    async getAllProjects() {
        try {
            const response = await fetch(`${this.issuesUrl}?labels=课题提交&per_page=20&sort=created&direction=desc`);
            
            if (!response.ok) {
                throw new Error(`获取失败: ${response.status}`);
            }

            const issues = await response.json();
            
            // 解析 Issue 为课题数据
            return issues.map(issue => ({
                id: issue.id,
                number: issue.number,
                title: issue.title.replace('[课题提交] ', ''),
                description: this.extractDescription(issue.body),
                student: this.extractField(issue.body, '研究生：'),
                supervisor: this.extractField(issue.body, '指导老师：'),
                tags: this.extractField(issue.body, '研究标签：'),
                status: this.getStatusFromLabels(issue.labels),
                createdAt: new Date(issue.created_at).toLocaleDateString('zh-CN'),
                url: issue.html_url,
                state: issue.state
            }));

        } catch (error) {
            console.error('获取课题列表失败:', error);
            return [];
        }
    }

    // 从 Issue body 提取描述
    extractDescription(body) {
        if (!body) return '暂无描述';
        const match = body.match(/## 课题描述\s*\n([\s\S]*?)\n\s*---/);
        return match ? match[1].trim() : body.substring(0, 200) + '...';
    }

    // 从 Issue body 提取字段
    extractField(body, fieldName) {
        if (!body) return '未知';
        const regex = new RegExp(`\\*\\*${fieldName}\\*\\*\\s*(.+?)\\s*\\n`);
        const match = body.match(regex);
        return match ? match[1].trim() : '未知';
    }

    // 从标签获取状态
    getStatusFromLabels(labels) {
        const labelNames = labels.map(l => l.name);
        if (labelNames.includes('已发布')) return '已发布';
        if (labelNames.includes('审核通过')) return '审核通过';
        if (labelNames.includes('待审核')) return '待审核';
        if (labelNames.includes('需要修改')) return '需要修改';
        return labelNames[0] || '新提交';
    }

    // 清除 Token
    clearToken() {
        this.token = null;
        localStorage.removeItem('github_pat_token');
    }
}

// 创建全局实例
window.githubIssuesManager = new GitHubIssuesManager();
