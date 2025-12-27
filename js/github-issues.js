// js/github-issues.js - GitHub Issues 集成处理（增强写入可靠性）
class GitHubIssuesManager {
    constructor() {
        this.owner = 'HTH554';
        this.repo = 'graduate-research-portal';
        this.apiBase = 'https://api.github.com';
        this.issuesUrl = `${this.apiBase}/repos/${this.owner}/${this.repo}/issues`;
        this.token = localStorage.getItem('github_pat_token');
        this.writeLocks = {};
        this.globalWriteLock = false;
        this.writeRetryCount = {};
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

    /* ========== 核心修复：写 JSON 文件（增强版） ========== */
    async writeJsonFile(filename, dataObj, maxRetries = 3) {
        // 1. 检查权限
        if (!this.hasValidToken()) {
            throw new Error('无有效 GitHub Token，请先设置Token');
        }
        
        const path = `data/${filename}`;
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}`;
        
        let sha = null;
        let retryCount = 0;
        let lastError = null;
        
        // 辅助方法：获取最新SHA
        const getLatestSHA = async () => {
            try {
                console.log(`[获取SHA] 尝试获取 ${filename} 的最新SHA...`);
                const getResp = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Cache-Control': 'no-cache'
                    },
                    cache: 'no-store'
                });
                
                if (getResp.ok) {
                    const respData = await getResp.json();
                    const latestSha = respData.sha;
                    console.log(`[获取SHA] 成功：${filename} 的 SHA 为 ${latestSha.slice(0,8)}...`);
                    return latestSha;
                } else if (getResp.status === 404) {
                    console.log(`[获取SHA] ${filename} 不存在，将创建新文件`);
                    return null;
                } else {
                    const errorText = await getResp.text();
                    throw new Error(`获取SHA失败 (${getResp.status}): ${errorText}`);
                }
            } catch (error) {
                console.error(`[获取SHA] 失败:`, error);
                throw error;
            }
        };

        // 主循环：带重试的写入
        while (retryCount < maxRetries) {
            try {
                retryCount++;
                console.log(`[写入尝试 ${retryCount}/${maxRetries}] ${filename}`);
                
                // 获取最新SHA
                sha = await getLatestSHA();
                
                // 准备提交数据
                const jsonStr = JSON.stringify(dataObj, null, 2);
                const content = btoa(unescape(encodeURIComponent(jsonStr)));
                
                const commitMessage = `portal: 更新 ${filename} (${new Date().toLocaleString('zh-CN')})`;
                
                const body = JSON.stringify({
                    message: commitMessage,
                    content: content,
                    sha: sha, // 如果为null表示创建新文件
                    branch: 'main'
                });
                
                console.log(`[写入请求] 正在提交 ${filename}...`);
                
                // 执行写入
                const putResp = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: body
                });
                
                if (putResp.ok) {
                    const result = await putResp.json();
                    console.log(`✅ [写入成功] ${filename}`);
                    return result;
                } else {
                    const errorText = await putResp.text();
                    console.error(`[写入失败] 状态码: ${putResp.status}, 错误:`, errorText);
                    
                    // 如果是409冲突（SHA过期），等待后重试
                    if (putResp.status === 409 && retryCount < maxRetries) {
                        console.log(`[409冲突] SHA已过期，等待1秒后重试...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue; // 继续下一次尝试
                    }
                    
                    // 如果是403，可能是权限问题
                    if (putResp.status === 403) {
                        throw new Error(`权限不足 (403)。请确保Token有"repo"权限，且仓库不是只读。详细信息: ${errorText}`);
                    }
                    
                    // 如果是404，可能是路径问题
                    if (putResp.status === 404) {
                        throw new Error(`文件路径不存在 (404)。请确保data目录存在。`);
                    }
                    
                    // 其他错误
                    throw new Error(`GitHub API错误 (${putResp.status}): ${errorText}`);
                }
            } catch (error) {
                lastError = error;
                console.warn(`[写入失败，准备重试] ${filename}:`, error.message);
                
                if (retryCount >= maxRetries) {
                    console.error(`❌ [写入最终失败] ${filename}:`, error);
                    throw error;
                }
                
                // 等待后重试
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        throw new Error(`写入 ${filename} 失败，重试 ${maxRetries} 次后仍然失败: ${lastError?.message}`);
    }

    /* ========== 修改：读 JSON 文件（强化实时性） ========== */
    async readJsonFile(filename) {
        const path = `data/${filename}`;
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}`;

        // 1. 公开读取（优先实时获取）
        try {
            console.log(`[读取][公开] 尝试获取 ${filename}...`);
            const publicResp = await fetch(url, {
                headers: { 'Accept': 'application/vnd.github.v3+json' },
                cache: 'no-cache',
                signal: AbortSignal.timeout(3000)
            });
            if (publicResp.ok) {
                const { content } = await publicResp.json();
                const decodedContent = JSON.parse(decodeURIComponent(escape(atob(content))));
                console.log(`[读取][公开] 成功：${filename}（${JSON.stringify(decodedContent).length} 字节）`);
                return decodedContent;
            } else if (publicResp.status === 404) {
                console.log(`[读取][公开] ${filename} 不存在`);
                return null;
            } else if (publicResp.status === 403) {
                console.warn(`[读取][公开] 无权限（仓库私有），切换带 Token 读取`);
            } else {
                console.warn(`[读取][公开] 失败（${publicResp.status}）`);
            }
        } catch (publicError) {
            console.log(`[读取][公开] 异常：${publicError.message}`);
        }

        // 2. 带 Token 读取（确保有权限）
        if (this.hasValidToken()) {
            try {
                console.log(`[读取][带Token] 尝试获取 ${filename}...`);
                const authResp = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    cache: 'no-cache',
                    signal: AbortSignal.timeout(3000)
                });
                if (authResp.ok) {
                    const { content } = await authResp.json();
                    const decodedContent = JSON.parse(decodeURIComponent(escape(atob(content))));
                    console.log(`[读取][带Token] 成功：${filename}（${JSON.stringify(decodedContent).length} 字节）`);
                    return decodedContent;
                } else if (authResp.status === 404) {
                    console.log(`[读取][带Token] ${filename} 不存在`);
                    return null;
                }
                console.warn(`[读取][带Token] 失败（${authResp.status}）`);
            } catch (authError) {
                console.error(`[读取][带Token] 异常：${authError.message}`);
            }
        }

        // 3. 所有方式失败，返回 null
        console.log(`[读取][最终] 无法获取 ${filename}，返回 null`);
        return null;
    }

    /* ========== 新增：创建空的 JSON 文件 ========== */
    async createEmptyJsonFile(filename, defaultData = []) {
        if (!this.hasValidToken()) throw new Error('无有效 GitHub Token');
        try {
            console.log(`[创建空文件] 开始：${filename}`);
            const result = await this.writeJsonFile(filename, defaultData);
            console.log(`[创建空文件] 成功：${filename}`);
            return result;
        } catch (error) {
            console.error(`[创建空文件] 失败：${error.message}`);
            throw error;
        }
    }

    /* ========== 新增：检查仓库是否公开 ========== */
    async checkRepositoryVisibility() {
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}`;
        try {
            const response = await fetch(url, {
                headers: { 'Accept': 'application/vnd.github.v3+json' },
                cache: 'no-cache',
                signal: AbortSignal.timeout(3000)
            });
            if (response.ok) {
                const repoInfo = await response.json();
                const result = {
                    isPublic: !repoInfo.private,
                    visibility: repoInfo.private ? 'private' : 'public',
                    name: repoInfo.full_name,
                    description: repoInfo.description,
                    defaultBranch: repoInfo.default_branch,
                    permissions: repoInfo.permissions
                };
                console.log(`[仓库检查] 结果：${JSON.stringify(result)}`);
                return result;
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
                headers: { 'Accept': 'application/vnd.github.v3+json' },
                cache: 'no-cache',
                signal: AbortSignal.timeout(3000)
            });
            if (response.ok) {
                const contents = await response.json();
                const result = {
                    exists: true,
                    fileCount: Array.isArray(contents) ? contents.length : 0,
                    files: Array.isArray(contents) ? contents.map(file => file.name) : [],
                    lastChecked: new Date().toLocaleString()
                };
                console.log(`[目录检查] data 目录存在（${result.fileCount} 个文件）`);
                return result;
            } else if (response.status === 404) {
                console.log(`[目录检查] data 目录不存在`);
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

    /* ========== 新增：测试写入功能 ========== */
    async testWriteFunction() {
        console.log('=== 开始测试写入功能 ===');
        
        const testData = {
            test: true,
            message: '这是一个测试文件',
            timestamp: new Date().toISOString(),
            purpose: '测试GitHub写入功能是否正常'
        };
        
        try {
            console.log('1. 检查Token状态:', this.hasValidToken() ? '✅ 有效' : '❌ 无效');
            
            if (!this.hasValidToken()) {
                return { success: false, error: 'Token无效' };
            }
            
            console.log('2. 检查仓库连接...');
            const repoInfo = await this.checkRepositoryVisibility();
            console.log('仓库信息:', repoInfo);
            
            if (repoInfo.error) {
                return { success: false, error: `仓库连接失败: ${repoInfo.error}` };
            }
            
            console.log('3. 检查data目录...');
            const dirInfo = await this.checkDataDirectory();
            console.log('目录信息:', dirInfo);
            
            console.log('4. 测试写入文件...');
            const result = await this.writeJsonFile('test-write.json', testData, 2);
            
            console.log('✅ 测试写入成功:', result);
            return { 
                success: true, 
                message: '写入功能正常',
                sha: result.content.sha.slice(0, 8) + '...'
            };
            
        } catch (error) {
            console.error('❌ 测试写入失败:', error);
            return { 
                success: false, 
                error: error.message,
                details: error
            };
        }
    }
}

/* ========== 全局实例 ========== */
window.githubIssuesManager = new GitHubIssuesManager();
