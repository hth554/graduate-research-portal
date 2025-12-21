// js/github-manager.js - GitHub 集成管理器（增强版）
class GitHubManager {
    constructor() {
        this.owner = 'HTH554';
        this.repo = 'graduate-research-portal';
        this.apiBase = 'https://api.github.com';
        this.contentsUrl = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents`;
        this.token = localStorage.getItem('github_admin_token');
        this.dataPath = 'data';
        
        // 数据文件映射
        this.dataFiles = {
            advisors: 'advisors.json',
            students: 'students.json',
            projects: 'projects.json',
            publications: 'publications.json',
            updates: 'updates.json'
        };
        
        // API 速率限制跟踪
        this.rateLimit = {
            remaining: 60,
            reset: 0,
            limit: 60
        };
        
        // 同步队列
        this.syncQueue = [];
        this.isSyncing = false;
    }

    // ========== Token 管理 ==========
    setToken(token) {
        if (token && (token.startsWith('ghp_') || token.startsWith('github_pat_'))) {
            this.token = token;
            localStorage.setItem('github_admin_token', token);
            console.log('✅ GitHub Token 已保存到本地存储');
            return true;
        }
        return false;
    }

    hasValidToken() {
        return !!this.token && (this.token.startsWith('ghp_') || this.token.startsWith('github_pat_'));
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('github_admin_token');
        console.log('🗑️ GitHub Token 已清除');
    }

    // ========== 核心数据同步方法 ==========
    async syncFile(filename, data, message = '自动同步更新') {
        if (!this.hasValidToken()) {
            console.warn('❌ 无法同步：未设置有效的 GitHub Token');
            throw new Error('请先设置有效的 GitHub Token');
        }

        try {
            const path = `${this.dataPath}/${filename}`;
            const url = `${this.contentsUrl}/${path}`;
            
            console.log(`🔄 正在同步文件: ${filename}`);
            
            // 1. 获取当前文件SHA（如果存在）
            let sha = null;
            try {
                const response = await this.apiRequest(url);
                if (response.sha) {
                    sha = response.sha;
                    console.log(`📝 找到现有文件，SHA: ${sha.substring(0, 8)}...`);
                }
            } catch (error) {
                if (error.status === 404) {
                    console.log(`📄 文件 ${filename} 不存在，将创建新文件`);
                } else {
                    throw error;
                }
            }

            // 2. 准备数据（美化JSON格式）
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
            const body = JSON.stringify({
                message: `${message} - ${new Date().toLocaleString('zh-CN')}`,
                content: content,
                sha: sha,
                committer: {
                    name: 'Research Portal Sync',
                    email: 'sync@research-portal.com'
                }
            });

            // 3. 上传数据
            const result = await this.apiRequest(url, {
                method: 'PUT',
                body: body
            });

            console.log(`✅ 文件 ${filename} 同步成功`, {
                sha: result.content.sha.substring(0, 8) + '...',
                commit: result.commit.message,
                url: result.content.html_url
            });
            
            return {
                success: true,
                sha: result.content.sha,
                commit: result.commit,
                url: result.content.html_url,
                size: result.content.size
            };

        } catch (error) {
            console.error(`❌ 同步文件 ${filename} 失败:`, error);
            throw error;
        }
    }

    async getFile(filename) {
        if (!this.hasValidToken()) {
            console.warn('❌ 无法获取文件：未设置有效的 GitHub Token');
            throw new Error('请先设置有效的 GitHub Token');
        }

        try {
            const path = `${this.dataPath}/${filename}`;
            const url = `${this.contentsUrl}/${path}`;
            
            console.log(`📥 正在获取文件: ${filename}`);
            
            const response = await this.apiRequest(url);
            
            // 解码Base64内容
            const content = decodeURIComponent(escape(atob(response.content)));
            const data = JSON.parse(content);
            
            console.log(`✅ 文件 ${filename} 获取成功`, {
                size: response.size,
                sha: response.sha.substring(0, 8) + '...'
            });
            
            return {
                success: true,
                data: data,
                sha: response.sha,
                size: response.size,
                lastModified: response.updated_at || response.created_at,
                url: response.html_url
            };

        } catch (error) {
            if (error.status === 404) {
                console.log(`📭 文件 ${filename} 不存在`);
                return {
                    success: false,
                    error: '文件不存在',
                    data: []
                };
            }
            console.error(`❌ 获取文件 ${filename} 失败:`, error);
            throw error;
        }
    }

    // ========== 批量数据操作 ==========
    async syncAllFiles(data) {
        console.log('🔄 开始批量同步所有文件');
        
        const results = {};
        const promises = Object.entries(this.dataFiles).map(async ([key, filename]) => {
            try {
                const fileData = data[key] || [];
                const result = await this.syncFile(filename, fileData, `批量同步: ${key}`);
                results[key] = result;
                return result;
            } catch (error) {
                results[key] = { 
                    success: false, 
                    error: error.message,
                    filename: filename
                };
                console.error(`❌ ${filename} 同步失败:`, error);
                return null;
            }
        });

        await Promise.all(promises);
        
        // 检查结果
        const failed = Object.values(results).filter(r => !r.success);
        if (failed.length > 0) {
            console.warn(`⚠️ 部分文件同步失败: ${failed.length} 个`);
        }
        
        console.log('✅ 批量同步完成', results);
        return results;
    }

    async getAllFiles() {
        console.log('📥 开始获取所有数据文件');
        
        const results = {};
        const promises = Object.entries(this.dataFiles).map(async ([type, filename]) => {
            try {
                const result = await this.getFile(filename);
                if (result.success) {
                    results[type] = result.data;
                    console.log(`✅ ${type}.json 加载成功`);
                } else {
                    results[type] = [];
                    console.log(`📭 ${type}.json 不存在，使用空数组`);
                }
            } catch (error) {
                results[type] = [];
                console.error(`❌ ${type}.json 获取失败:`, error);
            }
        });

        await Promise.all(promises);
        console.log('✅ 所有数据文件获取完成');
        return results;
    }

    // ========== 冲突检测与解决 ==========
    async checkForChanges(filename, localSha) {
        if (!this.hasValidToken()) {
            return { changed: false, error: '未设置Token' };
        }

        try {
            const path = `${this.dataPath}/${filename}`;
            const url = `${this.contentsUrl}/${path}`;
            
            const response = await this.apiRequest(url);
            
            if (response.sha !== localSha) {
                console.log(`📊 检测到文件变更: ${filename}`, {
                    localSha: localSha ? localSha.substring(0, 8) + '...' : '无',
                    remoteSha: response.sha.substring(0, 8) + '...'
                });
                
                return {
                    changed: true,
                    remoteSha: response.sha,
                    lastModified: response.updated_at,
                    size: response.size
                };
            }
            
            console.log(`📊 文件未变更: ${filename}`);
            return { changed: false };
            
        } catch (error) {
            if (error.status === 404) {
                console.log(`📭 远程文件 ${filename} 不存在`);
                return { changed: true, error: '文件不存在' };
            }
            console.error(`❌ 检查文件变更失败:`, error);
            return { changed: false, error: error.message };
        }
    }

    async resolveConflict(filename, localData, remoteData, strategy = 'merge') {
        console.log(`🤝 解决数据冲突: ${filename}`, { strategy });
        
        switch (strategy) {
            case 'merge':
                // 智能合并：保留双方的新增项目，合并重复项目
                const localMap = new Map(localData.map(item => [item.id, item]));
                const remoteMap = new Map(remoteData.map(item => [item.id, item]));
                
                const merged = [...remoteData];
                
                localData.forEach(item => {
                    if (!remoteMap.has(item.id)) {
                        // 本地新增的项目
                        merged.push(item);
                    } else {
                        // 双方都有的项目，使用较新的版本
                        const remoteItem = remoteMap.get(item.id);
                        const localTime = new Date(item.updatedAt || item.createdAt || 0);
                        const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt || 0);
                        
                        if (localTime > remoteTime) {
                            // 本地版本更新，替换远程版本
                            const index = merged.findIndex(i => i.id === item.id);
                            if (index !== -1) {
                                merged[index] = { ...remoteItem, ...item, merged: true };
                            }
                        }
                    }
                });
                
                console.log(`✅ 合并完成: 共 ${merged.length} 个项目`);
                return merged;
                
            case 'remote':
                // 使用远程数据
                console.log(`✅ 使用远程数据: ${remoteData.length} 个项目`);
                return remoteData;
                
            case 'local':
                // 使用本地数据
                console.log(`✅ 使用本地数据: ${localData.length} 个项目`);
                return localData;
                
            case 'timestamp':
                // 基于时间戳的合并
                const allItems = [...localData, ...remoteData];
                const itemMap = new Map();
                
                allItems.forEach(item => {
                    const existing = itemMap.get(item.id);
                    const itemTime = new Date(item.updatedAt || item.createdAt || 0);
                    const existingTime = existing ? new Date(existing.updatedAt || existing.createdAt || 0) : 0;
                    
                    if (!existing || itemTime > existingTime) {
                        itemMap.set(item.id, item);
                    }
                });
                
                const result = Array.from(itemMap.values());
                console.log(`✅ 时间戳合并完成: ${result.length} 个项目`);
                return result;
                
            default:
                console.log(`⚠️ 未知策略，使用默认合并`);
                return remoteData;
        }
    }

    // ========== Issues 功能（保持兼容） ==========
    async submitNewProject(projectData) {
        if (!this.hasValidToken()) {
            throw new Error('请先设置有效的 GitHub Token');
        }
        
        const issuesUrl = `${this.apiBase}/repos/${this.owner}/${this.repo}/issues`;
        const issueTitle = `[课题提交] ${projectData.title.substring(0, 100)}`;
        const issueBody = this.formatIssueBody(projectData);
        
        try {
            const response = await this.apiRequest(issuesUrl, {
                method: 'POST',
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

            console.log('✅ 课题提交成功', { issueNumber: response.number });
            
            return {
                success: true,
                issueNumber: response.number,
                issueUrl: response.html_url,
                title: response.title,
                createdAt: new Date(response.created_at).toLocaleString()
            };
            
        } catch (error) {
            console.error('❌ 课题提交失败:', error);
            throw error;
        }
    }

    formatIssueBody(data) {
        return `## 课题基本信息\n\n**课题名称：** ${data.title}\n\n**研究生：** ${data.student || '未填写'}\n\n**指导老师：** ${data.supervisor || '未填写'}\n\n**研究标签：** ${data.tags || '未分类'}\n\n---\n\n## 课题描述\n${data.description}\n\n---\n\n## 提交信息\n- **提交时间：** ${new Date().toLocaleString()}\n- **状态：** 待审核\n- **审核意见：** \n\n---\n\n## 审核清单\n- [ ] 格式检查\n- [ ] 内容审核\n- [ ] 导师确认\n- [ ] 网站发布\n\n---\n*此 Issue 由研究生课题门户网站自动生成*`;
    }

    async getAllProjects() {
        try {
            const issuesUrl = `${this.apiBase}/repos/${this.owner}/${this.repo}/issues`;
            const response = await fetch(`${issuesUrl}?labels=课题提交&per_page=20&sort=created&direction=desc`);
            
            if (!response.ok) {
                throw new Error(`获取失败: ${response.status}`);
            }
            
            const issues = await response.json();
            
            const projects = issues.map(issue => ({
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
            
            console.log(`✅ 获取到 ${projects.length} 个课题`);
            return projects;
            
        } catch (error) {
            console.error('❌ 获取课题列表失败:', error);
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

    // ========== 辅助方法 ==========
    async apiRequest(url, options = {}) {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            headers,
            ...options
        });

        // 更新速率限制信息
        this.updateRateLimit(response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            const error = new Error(`GitHub API 错误: ${response.status} - ${errorText}`);
            error.status = response.status;
            throw error;
        }

        return await response.json();
    }

    updateRateLimit(headers) {
        const remaining = headers.get('X-RateLimit-Remaining');
        const limit = headers.get('X-RateLimit-Limit');
        const reset = headers.get('X-RateLimit-Reset');

        if (remaining) this.rateLimit.remaining = parseInt(remaining);
        if (limit) this.rateLimit.limit = parseInt(limit);
        if (reset) this.rateLimit.reset = parseInt(reset);
        
        // 如果接近限制，发出警告
        if (this.rateLimit.remaining < 10) {
            console.warn(`⚠️ GitHub API 接近限制: ${this.rateLimit.remaining}/${this.rateLimit.limit}`);
        }
    }

    getRateLimitInfo() {
        const now = Math.floor(Date.now() / 1000);
        const remainingMinutes = Math.ceil((this.rateLimit.reset - now) / 60);
        
        return {
            remaining: this.rateLimit.remaining,
            limit: this.rateLimit.limit,
            reset: new Date(this.rateLimit.reset * 1000).toLocaleString(),
            resetInMinutes: remainingMinutes > 0 ? remainingMinutes : 0,
            percentage: Math.round((this.rateLimit.remaining / this.rateLimit.limit) * 100),
            isLimited: this.rateLimit.remaining < 10
        };
    }

    // ========== 数据备份与恢复 ==========
    async createBackup() {
        if (!this.hasValidToken()) {
            throw new Error('请先设置有效的 GitHub Token');
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup-${timestamp}.json`;
        
        try {
            console.log('💾 开始创建数据备份...');
            const allData = await this.getAllFiles();
            
            const backupData = {
                ...allData,
                _backupInfo: {
                    createdAt: new Date().toISOString(),
                    version: '1.0',
                    source: 'research-portal',
                    fileCount: Object.keys(allData).length,
                    totalItems: Object.values(allData).reduce((sum, arr) => sum + arr.length, 0)
                }
            };

            const result = await this.syncFile(backupName, backupData, '创建数据备份');
            
            console.log('✅ 备份创建成功', {
                filename: backupName,
                items: backupData._backupInfo.totalItems
            });
            
            return {
                success: true,
                filename: backupName,
                ...result,
                backupInfo: backupData._backupInfo
            };
        } catch (error) {
            console.error('❌ 创建备份失败:', error);
            return { success: false, error: error.message };
        }
    }

    async restoreBackup(filename) {
        if (!this.hasValidToken()) {
            throw new Error('请先设置有效的 GitHub Token');
        }

        try {
            console.log('🔄 开始恢复备份...', { filename });
            const result = await this.getFile(filename);
            
            if (result.success) {
                // 移除备份信息字段
                const { _backupInfo, ...data } = result.data;
                
                console.log('✅ 备份数据加载成功', {
                    backupDate: _backupInfo?.createdAt,
                    items: _backupInfo?.totalItems
                });
                
                return {
                    success: true,
                    data: data,
                    backupInfo: _backupInfo
                };
            }
            return result;
        } catch (error) {
            console.error('❌ 恢复备份失败:', error);
            return { success: false, error: error.message };
        }
    }

    async listBackups() {
        if (!this.hasValidToken()) {
            throw new Error('请先设置有效的 GitHub Token');
        }

        try {
            const url = `${this.contentsUrl}/${this.dataPath}`;
            const response = await this.apiRequest(url);
            
            const backups = response
                .filter(item => item.name.startsWith('backup-') && item.name.endsWith('.json'))
                .map(item => ({
                    name: item.name,
                    size: item.size,
                    url: item.html_url,
                    lastModified: item.updated_at || item.created_at,
                    sha: item.sha
                }))
                .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
            
            console.log(`📚 找到 ${backups.length} 个备份文件`);
            return backups;
        } catch (error) {
            console.error('❌ 获取备份列表失败:', error);
            return [];
        }
    }

    // ========== 仓库统计信息 ==========
    async getRepoStats() {
        if (!this.hasValidToken()) {
            throw new Error('请先设置有效的 GitHub Token');
        }

        try {
            console.log('📊 获取仓库统计信息...');
            
            const [repoInfo, commits, contributors] = await Promise.all([
                this.apiRequest(`${this.apiBase}/repos/${this.owner}/${this.repo}`),
                this.apiRequest(`${this.apiBase}/repos/${this.owner}/${this.repo}/commits?per_page=1`),
                this.apiRequest(`${this.apiBase}/repos/${this.owner}/${this.repo}/contributors?per_page=10`)
            ]);

            const stats = {
                stars: repoInfo.stargazers_count,
                forks: repoInfo.forks_count,
                watchers: repoInfo.watchers_count,
                lastCommit: commits[0] ? commits[0].commit.author.date : null,
                totalIssues: repoInfo.open_issues_count,
                size: repoInfo.size,
                updatedAt: repoInfo.updated_at,
                defaultBranch: repoInfo.default_branch,
                contributors: contributors.length,
                language: repoInfo.language,
                license: repoInfo.license?.name
            };
            
            console.log('✅ 仓库统计获取成功', stats);
            return stats;
        } catch (error) {
            console.error('❌ 获取仓库统计失败:', error);
            return null;
        }
    }

    // ========== 同步队列管理 ==========
    async queueSync(filename, data, message) {
        return new Promise((resolve, reject) => {
            const syncTask = {
                filename,
                data,
                message,
                resolve,
                reject,
                timestamp: Date.now()
            };
            
            this.syncQueue.push(syncTask);
            console.log(`📋 同步任务已加入队列: ${filename} (队列长度: ${this.syncQueue.length})`);
            
            // 如果队列未在处理，则开始处理
            if (!this.isSyncing) {
                this.processSyncQueue();
            }
        });
    }

    async processSyncQueue() {
        if (this.syncQueue.length === 0 || this.isSyncing) {
            return;
        }

        this.isSyncing = true;
        console.log(`⚙️ 开始处理同步队列，剩余任务: ${this.syncQueue.length}`);

        while (this.syncQueue.length > 0) {
            const task = this.syncQueue[0];
            
            try {
                console.log(`🔄 处理队列任务: ${task.filename}`);
                const result = await this.syncFile(task.filename, task.data, task.message);
                task.resolve(result);
                console.log(`✅ 队列任务完成: ${task.filename}`);
            } catch (error) {
                console.error(`❌ 队列任务失败: ${task.filename}`, error);
                task.reject(error);
            }
            
            // 移除已处理的任务
            this.syncQueue.shift();
            
            // 添加延迟以避免速率限制（仅在多个任务时）
            if (this.syncQueue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        this.isSyncing = false;
        console.log('✅ 同步队列处理完成');
    }

    clearSyncQueue() {
        const count = this.syncQueue.length;
        this.syncQueue = [];
        console.log(`🗑️ 已清除同步队列，移除 ${count} 个任务`);
    }

    // ========== 连接测试 ==========
    async testConnection() {
        if (!this.hasValidToken()) {
            return { 
                connected: false, 
                message: '未设置 GitHub Token' 
            };
        }

        try {
            console.log('🔗 测试 GitHub 连接...');
            
            const [userResponse, repoResponse] = await Promise.all([
                this.apiRequest(`${this.apiBase}/user`),
                this.apiRequest(`${this.apiBase}/repos/${this.owner}/${this.repo}`)
            ]);

            const rateLimit = this.getRateLimitInfo();
            
            console.log('✅ GitHub 连接测试成功', {
                user: userResponse.login,
                repo: repoResponse.full_name,
                rateLimit: `${rateLimit.remaining}/${rateLimit.limit}`
            });
            
            return {
                connected: true,
                message: '连接成功',
                user: userResponse.login,
                repo: repoResponse.full_name,
                rateLimit: rateLimit
            };
        } catch (error) {
            console.error('❌ GitHub 连接测试失败:', error);
            return {
                connected: false,
                message: `连接失败: ${error.message}`
            };
        }
    }

    // ========== 数据验证 ==========
    validateData(type, data) {
        console.log(`🔍 验证 ${type} 数据...`);
        
        const validators = {
            advisors: (item) => item.name && item.title,
            students: (item) => item.name && item.degree,
            projects: (item) => item.title && item.description,
            publications: (item) => item.title && item.authors,
            updates: (item) => item.title && item.content
        };

        const validator = validators[type];
        if (!validator) {
            console.warn(`⚠️ 未知数据类型: ${type}`);
            return { valid: true, issues: [] };
        }

        const issues = [];
        
        if (!Array.isArray(data)) {
            issues.push({ level: 'error', message: '数据必须是数组' });
            return { valid: false, issues };
        }

        data.forEach((item, index) => {
            if (!item.id) {
                issues.push({ 
                    level: 'warning', 
                    message: `第 ${index + 1} 项缺少 id 字段` 
                });
            }
            
            if (!validator(item)) {
                issues.push({ 
                    level: 'error', 
                    message: `第 ${index + 1} 项缺少必需字段` 
                });
            }
        });

        const valid = issues.filter(issue => issue.level === 'error').length === 0;
        
        if (valid) {
            console.log(`✅ ${type} 数据验证通过: ${data.length} 项`);
        } else {
            console.warn(`⚠️ ${type} 数据验证失败: ${issues.length} 个问题`);
        }
        
        return { valid, issues, count: data.length };
    }
}

// 创建全局实例
window.githubManager = new GitHubManager();
