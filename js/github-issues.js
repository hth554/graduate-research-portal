// js/github-issues.js - GitHub Issues 集成处理（新增写 JSON 能力）
class GitHubIssuesManager {
    constructor() {
        this.owner = 'HTH554';
        this.repo = 'graduate-research-portal';
        this.apiBase = 'https://api.github.com';
        this.issuesUrl = `${this.apiBase}/repos/${this.owner}/${this.repo}/issues`;
        this.token = localStorage.getItem('github_pat_token');
        this.writeLock = false; // 并发锁：防止同时写入同一文件
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

    /* ========== 核心修复：写 JSON 文件（SHA 重试+冲突自动处理） ========== */
    async writeJsonFile(filename, dataObj) {
        // 1. 检查权限和并发锁
        if (!this.hasValidToken()) throw new Error('无有效 GitHub Token');
        if (this.writeLock) throw new Error(`当前有其他写入操作，请1秒后重试（文件：${filename}）`);
        
        const path = `data/${filename}`;
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}`;
        let sha = null;
        const MAX_RETRY = 2; // 写入冲突时最大重试次数

        // 辅助方法：获取最新 SHA（带重试）
        const getLatestSHA = async (retry = 2) => {
            for (let i = 0; i < retry; i++) {
                try {
                    const getResp = await fetch(url, {
                        headers: {
                            'Authorization': `Bearer ${this.token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        },
                        cache: 'no-cache',
                        signal: AbortSignal.timeout(3000) // 3秒超时，避免阻塞
                    });

                    if (getResp.ok) {
                        const respData = await getResp.json();
                        const latestSha = respData.sha;
                        console.log(`[SHA获取][重试${i+1}] 成功：${filename} 的 SHA 为 ${latestSha.slice(0,8)}...`);
                        return latestSha;
                    } else if (getResp.status === 404) {
                        console.log(`[SHA获取][重试${i+1}] ${filename} 不存在，将创建新文件`);
                        return null;
                    } else {
                        console.warn(`[SHA获取][重试${i+1}] 失败（状态码：${getResp.status}）`);
                    }
                } catch (err) {
                    console.warn(`[SHA获取][重试${i+1}] 异常：${err.message}`);
                }
                // 重试间隔：100ms（短间隔确保实时性）
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            throw new Error(`获取 ${filename} 的 SHA 重试${retry}次失败`);
        };

        // 辅助方法：核心写入逻辑（用于重试）
        const coreWrite = async (currentSha) => {
            try {
                // 写入前预拉取远程最新数据，确保本地数据基于最新版本
                const latestRemoteData = await this.readJsonFile(filename);
                let finalData = dataObj;

                // 合并本地与远程数据（避免覆盖远程新增内容，数组类型按ID去重）
                if (latestRemoteData && Array.isArray(latestRemoteData) && Array.isArray(dataObj)) {
                    const remoteIds = new Set(latestRemoteData.map(item => item.id));
                    // 保留远程所有数据 + 本地未存在的数据
                    finalData = [...latestRemoteData, ...dataObj.filter(item => !remoteIds.has(item.id))];
                    console.log(`[数据合并] ${filename} 已合并远程 ${latestRemoteData.length} 条数据 + 本地新增数据`);
                }

                // 编码内容（处理中文）
                const jsonStr = JSON.stringify(finalData, null, 2);
                const content = btoa(unescape(encodeURIComponent(jsonStr)));
                const body = JSON.stringify({
                    message: `portal: 安全更新 ${filename} (${new Date().toLocaleString('zh-CN')})`,
                    content,
                    sha: currentSha,
                    branch: 'main' // 明确指定分支，避免默认分支不匹配
                });

                // 执行写入
                const putResp = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body,
                    cache: 'no-cache',
                    signal: AbortSignal.timeout(5000) // 5秒超时
                });

                if (!putResp.ok) {
                    const errTxt = await putResp.text();
                    // 捕获 409 冲突，抛出特定错误用于重试
                    if (putResp.status === 409) {
                        throw new Error(`[409冲突] ${filename} 的 SHA 已过期，需重新获取`);
                    }
                    throw new Error(`写入失败 ${putResp.status}: ${errTxt}`);
                }

                const result = await putResp.json();
                console.log(`[写入成功] ${filename} 新 SHA：${result.content.sha.slice(0,8)}...`);
                return result;
            } catch (error) {
                console.error(`[核心写入] 失败：${error.message}`);
                throw error;
            }
        };

        // 主逻辑：加锁 + 重试写入
        try {
            this.writeLock = true; // 开启锁
            console.log(`[写入开始] ${filename}（最大重试${MAX_RETRY}次）`);

            // 第一次获取 SHA 并写入
            sha = await getLatestSHA();
            try {
                return await coreWrite(sha);
            } catch (firstErr) {
                // 若第一次失败且是 409 冲突，重试1次
                if (firstErr.message.includes('[409冲突]') && MAX_RETRY > 1) {
                    console.log(`[冲突重试] 第2次尝试写入 ${filename}...`);
                    const newSha = await getLatestSHA(1); // 重新获取最新 SHA
                    return await coreWrite(newSha);
                }
                throw firstErr; // 非冲突错误直接抛出
            }
        } catch (finalErr) {
            console.error(`[写入最终失败] ${filename}：${finalErr.message}`);
            throw finalErr;
        } finally {
            this.writeLock = false; // 释放锁
            console.log(`[写入结束] ${filename}（锁已释放）`);
        }
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
                    defaultBranch: repoInfo.default_branch // 新增：返回默认分支，避免分支不匹配
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
}

/* ========== 全局实例 ========== */
window.githubIssuesManager = new GitHubIssuesManager();
