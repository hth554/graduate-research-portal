// js/github-issues.js - GitHub Issues 集成处理（新增写 JSON 能力）
class GitHubIssuesManager {
    constructor() {
        this.owner = 'HTH554';
        this.repo = 'graduate-research-portal';
        this.apiBase = 'https://api.github.com';
        this.issuesUrl = `${this.apiBase}/repos/${this.owner}/${this.repo}/issues`;
        this.token = localStorage.getItem('github_pat_token');
    }

    /* ========== 原有功能保持不变 ========== */
    setToken(token) {
        if (token && (token.startsWith('ghp_') || token.startsWith('github_pat_'))) {
            this.token = token;
            localStorage.setItem('github_pat_token', token);
            console.log('Token 已保存到本地存储');
            return true;
        }
        return false;
    }

    hasValidToken() {
        return !!this.token && this.token.length > 30;
    }

    async submitNewProject(projectData) {
        if (!this.hasValidToken()) {
            throw new Error('请先设置有效的 GitHub Token');
        }
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

    formatIssueBody(data) {
        return `## 课题基本信息\n\n**课题名称：** ${data.title}\n\n**研究生：** ${data.student || '未填写'}\n\n**指导老师：** ${data.supervisor || '未填写'}\n\n**研究标签：** ${data.tags || '未分类'}\n\n---\n\n## 课题描述\n${data.description}\n\n---\n\n## 提交信息\n- **提交时间：** ${new Date().toLocaleString()}\n- **状态：** 待审核\n- **审核意见：** \n\n---\n\n## 审核清单\n- [ ] 格式检查\n- [ ] 内容审核\n- [ ] 导师确认\n- [ ] 网站发布\n\n---\n*此 Issue 由研究生课题门户网站自动生成*`;
    }

    async getAllProjects() {
        try {
            const response = await fetch(`${this.issuesUrl}?labels=课题提交&per_page=20&sort=created&direction=desc`);
            if (!response.ok) {
                throw new Error(`获取失败: ${response.status}`);
            }
            const issues = await response.json();
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

    extractDescription(body) {
        if (!body) return '暂无描述';
        const match = body.match(/## 课题描述\s*\n([\s\S]*?)\n\s*---/);
        return match ? match[1].trim() : body.substring(0, 200) + '...';
    }

    extractField(body, fieldName) {
        if (!body) return '未知';
        const regex = new RegExp(`\\*\\*${fieldName}\\*\\*\\s*(.+?)\\s*\\n`);
        const match = body.match(regex);
        return match ? match[1].trim() : '未知';
    }

    getStatusFromLabels(labels) {
        const labelNames = labels.map(l => l.name);
        if (labelNames.includes('已发布')) return '已发布';
        if (labelNames.includes('审核通过')) return '审核通过';
        if (labelNames.includes('待审核')) return '待审核';
        if (labelNames.includes('需要修改')) return '需要修改';
        return labelNames[0] || '新提交';
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('github_pat_token');
    }

    /* ========== 新增：写任意 JSON 文件到仓库 ========== */
    async writeJsonFile(filename, dataObj) {
        if (!this.hasValidToken()) throw new Error('无有效 GitHub Token');

        const path = `data/${filename}`;
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}`;

        // 1. 拿当前文件的 SHA（文件不存在会 404，此时 sha 保持 null 即可新建）
        let sha = null;
        try {
            const getResp = await fetch(url, {
                headers: { 
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (getResp.ok) sha = (await getResp.json()).sha;
        } catch {}

        // 2. 提交新内容
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(dataObj, null, 2))));
        const body = JSON.stringify({
            message: `portal: 更新 ${filename} (${new Date().toLocaleString('zh-CN')})`,
            content,
            sha
        });

        const putResp = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body
        });

        if (!putResp.ok) {
            const txt = await putResp.text();
            throw new Error(`写入 GitHub 失败 ${putResp.status}: ${txt}`);
        }
        return putResp.json();
    }

    /* ========== 修改：读任意 JSON 文件（支持公开读取） ========== */
    async readJsonFile(filename) {
        const path = `data/${filename}`;
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}`;
        
        // 1. 首先尝试公开读取（不需要 Token）
        try {
            console.log(`尝试公开读取 ${filename}...`);
            const publicResp = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (publicResp.ok) {
                const { content } = await publicResp.json();
                const decodedContent = JSON.parse(decodeURIComponent(escape(atob(content))));
                console.log(`✅ 从 GitHub 公开读取 ${filename} 成功`);
                return decodedContent;
            } else if (publicResp.status === 404) {
                console.log(`ℹ️ GitHub 上不存在 ${filename}`);
                return null;
            } else {
                console.warn(`⚠️ 公开读取失败 ${publicResp.status}，尝试其他方式`);
            }
        } catch (publicError) {
            console.log(`${filename} 公开读取失败: ${publicError.message}`);
        }
        
        // 2. 如果公开读取失败但有 Token，尝试带 Token 读取（用于管理员）
        if (this.hasValidToken()) {
            console.log(`尝试带 Token 读取 ${filename}...`);
            try {
                const authResp = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (authResp.ok) {
                    const { content } = await authResp.json();
                    const decodedContent = JSON.parse(decodeURIComponent(escape(atob(content))));
                    console.log(`✅ 带 Token 读取 ${filename} 成功`);
                    return decodedContent;
                } else if (authResp.status === 404) {
                    console.log(`ℹ️ GitHub 上不存在 ${filename} (带 Token)`);
                    return null;
                }
                console.warn(`⚠️ 带 Token 读取失败 ${authResp.status}`);
            } catch (authError) {
                console.error(`❌ 带 Token 读取 ${filename} 失败:`, authError);
            }
        }
        
        // 3. 两种方式都失败，返回null（不抛出错误，避免阻断游客模式）
        console.log(`无法读取 ${filename}，返回 null`);
        return null;
    }

    /* ========== 新增：创建空的 JSON 文件 ========== */
    async createEmptyJsonFile(filename, defaultData = []) {
        if (!this.hasValidToken()) throw new Error('无有效 GitHub Token');
        
        try {
            const result = await this.writeJsonFile(filename, defaultData);
            console.log(`已创建空的 ${filename} 文件`);
            return result;
        } catch (error) {
            console.error(`创建 ${filename} 失败:`, error);
            throw error;
        }
    }

    /* ========== 新增：检查仓库是否公开 ========== */
    async checkRepositoryVisibility() {
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const repoInfo = await response.json();
                return {
                    isPublic: !repoInfo.private,
                    visibility: repoInfo.private ? 'private' : 'public',
                    name: repoInfo.full_name,
                    description: repoInfo.description
                };
            } else {
                throw new Error(`无法访问仓库: ${response.status}`);
            }
        } catch (error) {
            console.error('检查仓库可见性失败:', error);
            return {
                isPublic: false,
                visibility: 'unknown',
                error: error.message
            };
        }
    }

    /* ========== 新增：检查数据目录是否存在 ========== */
    async checkDataDirectory() {
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/data`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const contents = await response.json();
                return {
                    exists: true,
                    fileCount: Array.isArray(contents) ? contents.length : 0,
                    files: Array.isArray(contents) ? contents.map(file => file.name) : []
                };
            } else if (response.status === 404) {
                return {
                    exists: false,
                    error: 'data 目录不存在'
                };
            } else {
                throw new Error(`检查目录失败: ${response.status}`);
            }
        } catch (error) {
            console.error('检查数据目录失败:', error);
            return {
                exists: false,
                error: error.message
            };
        }
    }
}

/* ========== 全局实例 ========== */
window.githubIssuesManager = new GitHubIssuesManager();
