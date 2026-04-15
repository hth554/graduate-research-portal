// js/core/ApiClient.js
// GitHub API 底层封装，处理 Token、请求、冲突重试

class ApiClient {
    constructor() {
        this.owner = 'HTH554';
        this.repo = 'graduate-research-portal';
        this.apiBase = 'https://api.github.com';
        this.token = null;
        this.loadTokenFromStorage();
    }

    /**
     * 从 localStorage 加载 Token
     */
    loadTokenFromStorage() {
        const stored = localStorage.getItem('github_pat_token') || localStorage.getItem('github_admin_token');
        if (stored) {
            this.token = stored;
        }
    }

    /**
     * 设置 Token
     * @param {string} token 
     */
    setToken(token) {
        if (token && (token.startsWith('ghp_') || token.startsWith('github_pat_'))) {
            this.token = token;
            localStorage.setItem('github_pat_token', token);
            return true;
        }
        return false;
    }

    /**
     * 检查是否有有效 Token
     */
    hasValidToken() {
        return !!this.token && this.token.length > 30;
    }

    /**
     * 清除 Token
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('github_pat_token');
        localStorage.removeItem('github_admin_token');
    }

    /**
     * 读取 JSON 文件（优先从公开 raw 地址读取）
     * @param {string} filename 文件名（如 research-projects.json）
     */
    async readJsonFile(filename) {
        const rawUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/data/${filename}`;
        
        try {
            // 先尝试公开读取
            const response = await fetch(rawUrl, { cache: 'no-cache' });
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.warn(`公开读取 ${filename} 失败，尝试 API 读取`, e);
        }

        // 降级：使用 API 读取（需要 Token）
        if (!this.hasValidToken()) {
            throw new Error('无有效 Token，无法读取数据');
        }

        const apiUrl = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/data/${filename}`;
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            cache: 'no-cache'
        });

        if (!response.ok) {
            throw new Error(`读取失败: ${response.status}`);
        }

        const data = await response.json();
        const content = atob(data.content);
        return JSON.parse(decodeURIComponent(escape(content)));
    }

    /**
     * 写入 JSON 文件（带冲突重试）
     * @param {string} filename 文件名
     * @param {object} data 要写入的数据
     * @param {number} maxRetries 最大重试次数
     */
    async writeJsonFile(filename, data, maxRetries = 3) {
        if (!this.hasValidToken()) {
            throw new Error('需要有效的 GitHub Token 才能保存数据');
        }

        const path = `data/${filename}`;
        const url = `${this.apiBase}/repos/${this.owner}/${this.repo}/contents/${path}`;
        
        let sha = null;
        let retryCount = 0;
        let lastError = null;

        // 获取当前文件的 SHA
        const getLatestSha = async () => {
            try {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                if (response.ok) {
                    const respData = await response.json();
                    return respData.sha;
                } else if (response.status === 404) {
                    return null; // 文件不存在，将创建新文件
                }
                throw new Error(`获取 SHA 失败: ${response.status}`);
            } catch (error) {
                throw new Error(`获取 SHA 失败: ${error.message}`);
            }
        };

        while (retryCount < maxRetries) {
            try {
                retryCount++;
                sha = await getLatestSha();

                const jsonStr = JSON.stringify(data, null, 2);
                const content = btoa(unescape(encodeURIComponent(jsonStr)));
                const commitMessage = `portal: 更新 ${filename} (${new Date().toLocaleString('zh-CN')})`;

                const body = JSON.stringify({
                    message: commitMessage,
                    content: content,
                    sha: sha,
                    branch: 'main'
                });

                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: body
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ 写入成功: ${filename}`);
                    return result;
                } else if (response.status === 409) {
                    // SHA 冲突，稍等后重试
                    if (retryCount < maxRetries) {
                        console.log(`⚠️ SHA 冲突，等待重试 (${retryCount}/${maxRetries})...`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                        continue;
                    }
                    throw new Error('保存失败：数据已被其他设备修改，请刷新页面后重试。');
                } else if (response.status === 403) {
                    throw new Error('权限不足，请检查 Token 是否有 Contents 读写权限。');
                } else {
                    const errorText = await response.text();
                    throw new Error(`GitHub API 错误 (${response.status}): ${errorText}`);
                }
            } catch (error) {
                lastError = error;
                if (retryCount >= maxRetries) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        throw lastError || new Error(`写入 ${filename} 失败`);
    }

    /**
     * 检查仓库连接状态
     */
    async checkConnection() {
        if (!this.hasValidToken()) {
            return { connected: false, message: '未设置 Token' };
        }

        try {
            const response = await fetch(`${this.apiBase}/user`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (response.ok) {
                const user = await response.json();
                return { 
                    connected: true, 
                    user: user.login,
                    rateRemaining: response.headers.get('X-RateLimit-Remaining')
                };
            }
            return { connected: false, message: `认证失败: ${response.status}` };
        } catch (error) {
            return { connected: false, message: error.message };
        }
    }
}

// 导出单例
export default new ApiClient();