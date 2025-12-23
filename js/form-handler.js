class GitHubIssuesManager {
    constructor() {
        this.owner = 'HTH554';
        this.repo = 'graduate-research-portal';
        this.apiBase = 'https://api.github.com';
        this.issuesUrl = `${this.apiBase}/repos/${this.owner}/${this.repo}/issues`;
        this.token = localStorage.getItem('github_pat_token');
    }

    setToken(token) {
        if (token && (token.startsWith('ghp_') || token.startsWith('github_pat_'))) {
            this.token = token;
            localStorage.setItem('github_pat_token', token);
            return true;
        }
        return false;
    }

    hasValidToken() { return !!this.token && this.token.length > 30; }

    async submitNewProject(projectData) {
        if (!this.hasValidToken()) throw new Error('请先设置有效的 GitHub Token');
        
        const issueTitle = `[课题提交] ${projectData.title.substring(0, 100)}`;
        const issueBody = this.formatIssueBody(projectData);
        
        try {
            const response = await fetch(this.issuesUrl, {
                method: 'POST',
                headers: this.getHeaders(),
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
            if (!response.ok) throw new Error(`获取失败: ${response.status}`);
            
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

    async writeJsonFile(filename, dataObj) {
        if (!this.hasValidToken()) throw new Error('无有效 GitHub Token');
        
        const path = `data/${filename}`;
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}`;
        let sha = null;
        
        try {
            const getResp = await fetch(url, { headers: this.getHeaders() });
            if (getResp.ok) sha = (await getResp.json()).sha;
        } catch {}
        
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(dataObj, null, 2))));
        const body = JSON.stringify({
            message: `portal: 更新 ${filename} (${new Date().toLocaleString('zh-CN')})`,
            content,
            sha
        });
        
        const putResp = await fetch(url, {
            method: 'PUT',
            headers: this.getHeaders('application/json'),
            body
        });
        
        if (!putResp.ok) {
            const txt = await putResp.text();
            throw new Error(`写入 GitHub 失败 ${putResp.status}: ${txt}`);
        }
        return putResp.json();
    }

    async readJsonFile(filename) {
        const path = `data/${filename}`;
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}`;
        
        try {
            const publicResp = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
            if (publicResp.ok) {
                const { content } = await publicResp.json();
                const decodedContent = JSON.parse(decodeURIComponent(escape(atob(content))));
                console.log(`从 GitHub 公开读取 ${filename} 成功，${decodedContent?.length || 0} 条记录`);
                return decodedContent;
            } else if (publicResp.status === 404) {
                console.log(`GitHub 上不存在 ${filename}`);
                return null;
            }
            throw new Error('Public read failed');
        } catch (publicError) {
            console.log(`${filename} 公开读取失败: ${publicError.message}`);
            
            if (this.hasValidToken()) {
                try {
                    const authResp = await fetch(url, { headers: this.getHeaders() });
                    if (authResp.ok) {
                        const { content } = await authResp.json();
                        const decodedContent = JSON.parse(decodeURIComponent(escape(atob(content))));
                        console.log(`带 Token 读取 ${filename} 成功，${decodedContent?.length || 0} 条记录`);
                        return decodedContent;
                    } else if (authResp.status === 404) {
                        console.log(`GitHub 上不存在 ${filename} (带 Token)`);
                        return null;
                    }
                    throw new Error(`带 Token 读取失败 ${authResp.status}`);
                } catch (authError) {
                    console.error(`带 Token 读取 ${filename} 失败:`, authError);
                    throw new Error(`无法读取 ${filename}: ${authError.message}`);
                }
            }
            
            console.log(`既无法公开读取 ${filename}，也没有 Token`);
            throw new Error(`无法读取 ${filename}，请确保仓库是公开的或提供 GitHub Token`);
        }
    }

    async createEmptyJsonFile(filename, defaultData = []) {
        if (!this.hasValidToken()) throw new Error('无有效 GitHub Token');
        return await this.writeJsonFile(filename, defaultData);
    }

    async checkRepositoryVisibility() {
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}`;
        
        try {
            const response = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
            if (response.ok) {
                const repoInfo = await response.json();
                return {
                    isPublic: !repoInfo.private,
                    visibility: repoInfo.private ? 'private' : 'public',
                    name: repoInfo.full_name,
                    description: repoInfo.description
                };
            }
            throw new Error(`无法访问仓库: ${response.status}`);
        } catch (error) {
            console.error('检查仓库可见性失败:', error);
            return { isPublic: false, visibility: 'unknown', error: error.message };
        }
    }

    async checkDataDirectory() {
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/data`;
        
        try {
            const response = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
            if (response.ok) {
                const contents = await response.json();
                return {
                    exists: true,
                    fileCount: Array.isArray(contents) ? contents.length : 0,
                    files: Array.isArray(contents) ? contents.map(file => file.name) : []
                };
            } else if (response.status === 404) {
                return { exists: false, error: 'data 目录不存在' };
            }
            throw new Error(`检查目录失败: ${response.status}`);
        } catch (error) {
            console.error('检查数据目录失败:', error);
            return { exists: false, error: error.message };
        }
    }

    getHeaders(contentType) {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (contentType) headers['Content-Type'] = contentType;
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        return headers;
    }
}

window.githubIssuesManager = new GitHubIssuesManager();
