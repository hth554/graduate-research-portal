// js/data-manager.js - 数据管理和存储（重构版）
class DataManager {
    constructor() {
        // 默认数据（如果本地存储和GitHub都没有数据）
        this.defaultData = {
            advisors: [
                {
                    id: 1,
                    name: "李四教授",
                    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
                    title: "教授，博士生导师",
                    field: "计算机视觉",
                    bio: "长期从事计算机视觉研究，发表论文100余篇。"
                },
                {
                    id: 2,
                    name: "赵六教授",
                    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
                    title: "教授，博士生导师",
                    field: "自然语言处理",
                    bio: "在自然语言处理领域有深厚造诣，多项研究成果已产业化。"
                }
            ],
            students: [
                {
                    id: 1,
                    name: "张三",
                    avatar: "https://randomuser.me/api/portraits/men/22.jpg",
                    degree: "硕士生",
                    field: "计算机科学",
                    supervisor: "李四教授",
                    research: "深度学习在图像识别中的应用"
                },
                {
                    id: 2,
                    name: "王五",
                    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
                    degree: "博士生",
                    field: "人工智能",
                    supervisor: "赵六教授",
                    research: "自然语言处理与机器翻译"
                }
            ],
            projects: [
                {
                    id: 1,
                    title: "基于深度学习的人脸识别系统",
                    category: "engineering",
                    description: "本项目研究基于深度学习的人脸识别算法，旨在提高识别准确率和实时性。",
                    advisor: "李四教授",
                    status: "进行中",
                    student: "张三"
                },
                {
                    id: 2,
                    title: "量子计算在密码学中的应用",
                    category: "science",
                    description: "探索量子计算对现代密码学的影响及量子安全加密方案。",
                    advisor: "赵六教授",
                    status: "已完成",
                    student: "王五"
                }
            ],
            publications: [
                {
                    id: 1,
                    type: "期刊论文",
                    title: "基于Transformer的视觉识别模型研究",
                    authors: "张三, 李四",
                    venue: "计算机学报, 2023",
                    abstract: "本文提出了一种改进的Transformer模型..."
                }
            ],
            updates: [
                {
                    id: 1,
                    date: "2023-10-15",
                    title: "实验室获得国家自然科学基金资助",
                    type: "项目动态",
                    content: "本实验室获得国家自然科学基金重点项目资助..."
                }
            ]
        };
        
        // 数据文件映射
        this.dataFiles = {
            advisors: 'advisors.json',
            students: 'students.json',
            projects: 'projects.json',
            publications: 'publications.json',
            updates: 'updates.json'
        };
        
        // 仓库信息
        this.owner = 'HTH554';
        this.repo = 'graduate-research-portal';
        
        // GitHub Token（从localStorage获取）
        this.githubToken = localStorage.getItem('github_admin_token');
        
        // 数据版本号（用于检测更新）
        this.dataVersion = localStorage.getItem('data_version') || '0';
        this.lastSyncTime = localStorage.getItem('last_sync_time') || null;
        
        // 自动同步间隔（毫秒）
        this.syncInterval = 60000; // 1分钟
        
        // 当前数据
        this.data = { ...this.defaultData };
        
        // 初始化
        this.init();
    }

    // 初始化
    async init() {
        console.log('DataManager 初始化...');
        
        // 设置GitHub Token（如果已保存）
        if (this.githubToken && window.githubIssuesManager) {
            window.githubIssuesManager.setToken(this.githubToken);
        }
        
        // 加载数据
        await this.loadData();
        
        // 开始自动同步
        this.startAutoSync();
        
        // 监听管理员模式变化
        document.addEventListener('adminModeChanged', (event) => {
            if (event.detail.isAdmin && event.detail.editMode) {
                console.log('管理员模式启用，停止自动同步');
                this.stopAutoSync();
            } else {
                console.log('退出管理员模式，恢复自动同步');
                this.startAutoSync();
            }
        });
        
        console.log('DataManager 初始化完成');
    }

    // 设置GitHub Token
    setGitHubToken(token) {
        this.githubToken = token;
        localStorage.setItem('github_admin_token', token);
        
        // 更新githubIssuesManager的Token
        if (window.githubIssuesManager) {
            window.githubIssuesManager.setToken(token);
        }
        
        console.log('GitHub Token 已设置');
        
        // 尝试从GitHub加载数据
        this.syncFromGitHub();
    }

    // 获取GitHub Token
    getGitHubToken() {
        return this.githubToken;
    }

    // 检查GitHub Token是否有效
    hasValidToken() {
        return !!this.githubToken && 
               (this.githubToken.startsWith('ghp_') || 
                this.githubToken.startsWith('github_pat_'));
    }

    // 加载数据
    async loadData() {
        console.log('开始加载数据...');
        
        try {
            // 首先尝试从GitHub加载
            if (this.hasValidToken()) {
                console.log('尝试从GitHub加载数据...');
                const success = await this.syncFromGitHub();
                if (success) {
                    console.log('从GitHub加载数据成功');
                    return;
                }
            }
            
            // 如果GitHub加载失败或没有Token，尝试从本地存储加载
            console.log('从本地存储加载数据...');
            const savedData = localStorage.getItem('research_portal_data');
            
            if (savedData) {
                try {
                    this.data = JSON.parse(savedData);
                    this.ensureDataStructure();
                    console.log('从本地存储加载数据成功');
                } catch (e) {
                    console.error('本地存储数据解析失败，使用默认数据:', e);
                    this.data = { ...this.defaultData };
                    this.saveToLocalStorage();
                }
            } else {
                console.log('本地存储无数据，使用默认数据');
                this.data = { ...this.defaultData };
                this.saveToLocalStorage();
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            this.data = { ...this.defaultData };
        }
    }

    // 确保数据结构完整
    ensureDataStructure() {
        const dataFields = ['advisors', 'students', 'projects', 'publications', 'updates'];
        dataFields.forEach(field => {
            if (!this.data[field]) {
                this.data[field] = this.defaultData[field] || [];
            }
        });
    }

    // 从GitHub同步数据
    async syncFromGitHub() {
        if (!this.hasValidToken() || !window.githubIssuesManager) {
            console.log('无法从GitHub同步：Token无效或githubIssuesManager未初始化');
            return false;
        }

        try {
            console.log('开始从GitHub同步数据...');
            
            // 并行加载所有数据文件
            const promises = Object.entries(this.dataFiles).map(async ([type, filename]) => {
                try {
                    const data = await window.githubIssuesManager.readJsonFile(filename);
                    return { type, data };
                } catch (error) {
                    console.warn(`无法从GitHub加载 ${filename}:`, error.message);
                    // 如果GitHub文件不存在，使用默认数据
                    return { type, data: this.defaultData[type] || [] };
                }
            });

            const results = await Promise.all(promises);
            
            // 更新数据
            results.forEach(({ type, data }) => {
                this.data[type] = data;
            });
            
            // 更新同步时间和版本号
            this.lastSyncTime = new Date().toISOString();
            this.dataVersion = Date.now().toString();
            
            // 保存到本地存储
            this.saveToLocalStorage();
            
            // 保存同步信息
            localStorage.setItem('last_sync_time', this.lastSyncTime);
            localStorage.setItem('data_version', this.dataVersion);
            
            console.log('从GitHub同步数据成功');
            
            // 触发数据更新事件
            this.dispatchDataUpdated();
            
            return true;
        } catch (error) {
            console.error('从GitHub同步数据失败:', error);
            return false;
        }
    }

    // 保存数据到GitHub
    async syncToGitHub() {
        if (!this.hasValidToken() || !window.githubIssuesManager) {
            console.log('无法保存到GitHub：Token无效或githubIssuesManager未初始化');
            
            // 如果没有GitHub Token，只保存到本地
            this.saveToLocalStorage();
            return false;
        }

        try {
            console.log('开始保存数据到GitHub...');
            
            // 并行保存所有数据文件
            const promises = Object.entries(this.dataFiles).map(async ([type, filename]) => {
                try {
                    await window.githubIssuesManager.writeJsonFile(filename, this.data[type]);
                    console.log(`${filename} 保存成功`);
                    return { filename, success: true };
                } catch (error) {
                    console.error(`保存 ${filename} 到GitHub失败:`, error);
                    return { filename, success: false, error };
                }
            });

            const results = await Promise.all(promises);
            
            // 检查是否有失败
            const failed = results.filter(r => !r.success);
            
            if (failed.length > 0) {
                console.error(`部分文件保存失败: ${failed.map(f => f.filename).join(', ')}`);
                
                // 即使部分失败，也更新同步信息
                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('last_sync_time', this.lastSyncTime);
                
                return false;
            }
            
            // 更新同步时间和版本号
            this.lastSyncTime = new Date().toISOString();
            this.dataVersion = Date.now().toString();
            
            localStorage.setItem('last_sync_time', this.lastSyncTime);
            localStorage.setItem('data_version', this.dataVersion);
            
            console.log('所有数据已成功保存到GitHub');
            
            // 触发数据保存事件
            this.dispatchDataSaved();
            
            return true;
        } catch (error) {
            console.error('保存数据到GitHub失败:', error);
            
            // 即使GitHub保存失败，也要保存到本地
            this.saveToLocalStorage();
            
            return false;
        }
    }

    // 开始自动同步
    startAutoSync() {
        console.log(`开始自动同步，间隔: ${this.syncInterval/1000}秒`);
        
        // 清除现有定时器
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
        }
        
        // 设置新定时器
        this.autoSyncTimer = setInterval(async () => {
            console.log('自动同步检查...');
            
            // 检查是否有管理员正在编辑
            if (window.adminSystem && window.adminSystem.editMode) {
                console.log('管理员正在编辑，跳过自动同步');
                return;
            }
            
            await this.syncFromGitHub();
        }, this.syncInterval);
    }

    // 停止自动同步
    stopAutoSync() {
        if (this.autoSyncTimer) {
            console.log('停止自动同步');
            clearInterval(this.autoSyncTimer);
            this.autoSyncTimer = null;
        }
    }

    // 手动同步数据
    async manualSync() {
        console.log('手动同步数据...');
        
        try {
            // 先拉取最新数据
            await this.syncFromGitHub();
            
            // 然后推送本地修改（如果有）
            await this.syncToGitHub();
            
            return true;
        } catch (error) {
            console.error('手动同步失败:', error);
            return false;
        }
    }

    // 保存到本地存储
    saveToLocalStorage() {
        try {
            localStorage.setItem('research_portal_data', JSON.stringify(this.data));
            
            // 更新本地版本号
            const localVersion = Date.now().toString();
            localStorage.setItem('local_data_version', localVersion);
            
            console.log('数据已保存到本地存储');
            return true;
        } catch (e) {
            console.error('保存到本地存储失败:', e);
            return false;
        }
    }

    // 获取数据
    getData(type) {
        return this.data[type] || [];
    }

    // 获取所有数据
    getAllData() {
        return { ...this.data };
    }

    // 获取数据统计
    getStats() {
        return {
            advisors: this.data.advisors.length,
            students: this.data.students.length,
            projects: this.data.projects.length,
            publications: this.data.publications.length,
            updates: this.data.updates.length,
            lastSyncTime: this.lastSyncTime,
            dataVersion: this.dataVersion,
            hasGitHubToken: this.hasValidToken()
        };
    }

    // 更新数据
    async updateData(type, id, newData) {
        const items = this.data[type];
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            // 更新数据
            this.data[type][index] = { 
                ...this.data[type][index], 
                ...newData,
                updatedAt: new Date().toISOString()
            };
            
            // 保存到本地
            this.saveToLocalStorage();
            
            // 异步保存到GitHub
            this.syncToGitHub().catch(error => {
                console.error(`更新 ${type} 到GitHub失败:`, error);
            });
            
            // 触发数据更新事件
            this.dispatchDataUpdated();
            
            return true;
        }
        return false;
    }

    // 添加数据
    async addData(type, newItem) {
        // 生成新ID
        const items = this.data[type];
        const maxId = items.length > 0 ? Math.max(...items.map(item => item.id)) : 0;
        
        const itemWithId = {
            ...newItem,
            id: maxId + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.data[type].push(itemWithId);
        
        // 保存到本地
        this.saveToLocalStorage();
        
        // 异步保存到GitHub
        this.syncToGitHub().catch(error => {
            console.error(`添加 ${type} 到GitHub失败:`, error);
        });
        
        // 触发数据更新事件
        this.dispatchDataUpdated();
        
        return itemWithId.id;
    }

    // 删除数据
    async deleteData(type, id) {
        const items = this.data[type];
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            this.data[type].splice(index, 1);
            
            // 保存到本地
            this.saveToLocalStorage();
            
            // 异步保存到GitHub
            this.syncToGitHub().catch(error => {
                console.error(`删除 ${type} 到GitHub失败:`, error);
            });
            
            // 触发数据更新事件
            this.dispatchDataUpdated();
            
            return true;
        }
        return false;
    }

    // 批量更新数据
    async batchUpdate(type, updates) {
        const items = this.data[type];
        let updatedCount = 0;
        
        updates.forEach(update => {
            const index = items.findIndex(item => item.id === update.id);
            if (index !== -1) {
                this.data[type][index] = {
                    ...this.data[type][index],
                    ...update.data,
                    updatedAt: new Date().toISOString()
                };
                updatedCount++;
            }
        });
        
        if (updatedCount > 0) {
            // 保存到本地
            this.saveToLocalStorage();
            
            // 异步保存到GitHub
            this.syncToGitHub().catch(error => {
                console.error(`批量更新 ${type} 到GitHub失败:`, error);
            });
            
            // 触发数据更新事件
            this.dispatchDataUpdated();
        }
        
        return updatedCount;
    }

    // 导出数据
    exportData() {
        const exportData = {
            ...this.data,
            exportInfo: {
                exportedAt: new Date().toISOString(),
                version: this.dataVersion,
                source: 'research_portal'
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    // 导入数据
    async importData(jsonString) {
        try {
            const newData = JSON.parse(jsonString);
            
            // 验证数据格式
            const requiredFields = ['advisors', 'students', 'projects', 'publications', 'updates'];
            const isValid = requiredFields.every(field => Array.isArray(newData[field]));
            
            if (!isValid) {
                throw new Error('导入的数据格式不正确');
            }
            
            // 更新数据
            this.data = newData;
            this.ensureDataStructure();
            
            // 保存到本地
            this.saveToLocalStorage();
            
            // 保存到GitHub
            const success = await this.syncToGitHub();
            
            // 触发数据更新事件
            this.dispatchDataUpdated();
            
            return success;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    }

    // 重置为默认数据
    async resetToDefault() {
        this.data = { ...this.defaultData };
        
        // 保存到本地
        this.saveToLocalStorage();
        
        // 保存到GitHub
        const success = await this.syncToGitHub();
        
        // 触发数据更新事件
        this.dispatchDataUpdated();
        
        return success;
    }

    // 检查GitHub连接
    async checkGitHubConnection() {
        if (!this.hasValidToken()) {
            return { connected: false, message: '未设置GitHub Token' };
        }
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${this.githubToken}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                return { 
                    connected: true, 
                    message: '连接成功',
                    user: userData.login,
                    rateLimit: response.headers.get('X-RateLimit-Limit'),
                    rateRemaining: response.headers.get('X-RateLimit-Remaining')
                };
            } else {
                return { 
                    connected: false, 
                    message: `连接失败: ${response.status}` 
                };
            }
        } catch (error) {
            return { 
                connected: false, 
                message: `连接错误: ${error.message}` 
            };
        }
    }

    // 分发数据更新事件
    dispatchDataUpdated() {
        const event = new CustomEvent('dataUpdated', {
            detail: { 
                timestamp: new Date().toISOString(),
                dataVersion: this.dataVersion 
            }
        });
        document.dispatchEvent(event);
    }

    // 分发数据保存事件
    dispatchDataSaved() {
        const event = new CustomEvent('dataSaved', {
            detail: { 
                timestamp: new Date().toISOString(),
                dataVersion: this.dataVersion 
            }
        });
        document.dispatchEvent(event);
    }

    // 获取同步状态
    getSyncStatus() {
        return {
            lastSyncTime: this.lastSyncTime,
            dataVersion: this.dataVersion,
            hasGitHubToken: this.hasValidToken(),
            isAutoSyncing: !!this.autoSyncTimer,
            syncInterval: this.syncInterval
        };
    }
}

// 创建全局实例
window.dataManager = new DataManager();
