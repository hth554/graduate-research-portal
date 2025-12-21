// js/data-manager.js - 数据管理和存储（增强版）
class DataManager {
    constructor() {
        // 默认数据结构
        this.defaultData = {
            advisors: [
                {
                    id: 1,
                    name: "李四教授",
                    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
                    title: "教授，博士生导师",
                    field: "计算机视觉",
                    bio: "长期从事计算机视觉研究，发表论文100余篇。",
                    email: "lisi@university.edu",
                    office: "计算机学院A501",
                    phone: "13800138001",
                    createdAt: "2023-01-01T00:00:00.000Z",
                    updatedAt: "2023-01-01T00:00:00.000Z"
                },
                {
                    id: 2,
                    name: "赵六教授",
                    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
                    title: "教授，博士生导师",
                    field: "自然语言处理",
                    bio: "在自然语言处理领域有深厚造诣，多项研究成果已产业化。",
                    email: "zhaoliu@university.edu",
                    office: "计算机学院A502",
                    phone: "13800138002",
                    createdAt: "2023-01-01T00:00:00.000Z",
                    updatedAt: "2023-01-01T00:00:00.000Z"
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
                    research: "深度学习在图像识别中的应用",
                    enrollment: "2022-09-01",
                    email: "zhangsan@student.edu",
                    phone: "13800138003",
                    status: "在读",
                    createdAt: "2023-01-01T00:00:00.000Z",
                    updatedAt: "2023-01-01T00:00:00.000Z"
                },
                {
                    id: 2,
                    name: "王五",
                    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
                    degree: "博士生",
                    field: "人工智能",
                    supervisor: "赵六教授",
                    research: "自然语言处理与机器翻译",
                    enrollment: "2021-09-01",
                    email: "wangwu@student.edu",
                    phone: "13800138004",
                    status: "在读",
                    createdAt: "2023-01-01T00:00:00.000Z",
                    updatedAt: "2023-01-01T00:00:00.000Z"
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
                    student: "张三",
                    startDate: "2023-01-15",
                    endDate: "2024-01-15",
                    progress: 65,
                    tags: ["深度学习", "人脸识别", "计算机视觉"],
                    createdAt: "2023-01-01T00:00:00.000Z",
                    updatedAt: "2023-01-01T00:00:00.000Z"
                },
                {
                    id: 2,
                    title: "量子计算在密码学中的应用",
                    category: "science",
                    description: "探索量子计算对现代密码学的影响及量子安全加密方案。",
                    advisor: "赵六教授",
                    status: "已完成",
                    student: "王五",
                    startDate: "2022-09-01",
                    endDate: "2023-09-01",
                    progress: 100,
                    tags: ["量子计算", "密码学", "信息安全"],
                    createdAt: "2023-01-01T00:00:00.000Z",
                    updatedAt: "2023-01-01T00:00:00.000Z"
                }
            ],
            publications: [
                {
                    id: 1,
                    type: "期刊论文",
                    title: "基于Transformer的视觉识别模型研究",
                    authors: "张三, 李四",
                    venue: "计算机学报, 2023",
                    abstract: "本文提出了一种改进的Transformer模型...",
                    doi: "10.1234/example.doi",
                    year: 2023,
                    link: "https://example.com/paper1",
                    citation: 12,
                    createdAt: "2023-01-01T00:00:00.000Z",
                    updatedAt: "2023-01-01T00:00:00.000Z"
                }
            ],
            updates: [
                {
                    id: 1,
                    date: "2023-10-15",
                    title: "实验室获得国家自然科学基金资助",
                    type: "项目动态",
                    content: "本实验室获得国家自然科学基金重点项目资助...",
                    author: "李四教授",
                    importance: "高",
                    createdAt: "2023-01-01T00:00:00.000Z",
                    updatedAt: "2023-01-01T00:00:00.000Z"
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
        
        // 数据版本控制
        this.dataVersion = localStorage.getItem('data_version') || '0';
        this.lastSyncTime = localStorage.getItem('last_sync_time') || null;
        this.lastLocalVersion = localStorage.getItem('last_local_version') || '0';
        
        // 自动同步间隔（毫秒）
        this.syncInterval = 60000; // 1分钟
        this.autoSyncTimer = null;
        this.isSyncing = false;
        
        // 冲突解决策略
        this.conflictStrategy = localStorage.getItem('conflict_strategy') || 'merge';
        
        // 当前数据
        this.data = this.loadFromLocalStorage() || { ...this.defaultData };
        
        // 初始化
        this.init();
    }

    // ========== 初始化方法 ==========
    async init() {
        console.log('🚀 DataManager 初始化...');
        
        // 设置GitHub Token
        if (this.githubToken && window.githubManager) {
            window.githubManager.setToken(this.githubToken);
        }
        
        // 加载数据
        await this.loadData();
        
        // 开始自动同步
        this.startAutoSync();
        
        // 监听事件
        this.setupEventListeners();
        
        console.log('✅ DataManager 初始化完成');
    }

    setupEventListeners() {
        // 监听管理员模式变化
        document.addEventListener('adminModeChanged', (event) => {
            if (event.detail.isAdmin && event.detail.editMode) {
                console.log('🔒 管理员模式启用，停止自动同步');
                this.stopAutoSync();
            } else {
                console.log('🔓 退出管理员模式，恢复自动同步');
                this.startAutoSync();
            }
        });
        
        // 监听数据更新请求
        document.addEventListener('requestDataReload', async () => {
            console.log('📥 收到数据重载请求');
            await this.loadData();
            this.dispatchDataUpdated();
        });
        
        // 监听网络状态变化
        window.addEventListener('online', () => {
            console.log('🌐 网络已恢复，尝试同步...');
            this.syncToGitHub();
        });
        
        window.addEventListener('offline', () => {
            console.log('🌐 网络已断开，切换到离线模式');
            this.dispatchSyncStatusChanged({ online: false });
        });
    }

    // ========== 数据加载方法 ==========
    async loadData() {
        console.log('📥 开始加载数据...');
        
        try {
            let data;
            
            // 1. 优先从GitHub加载（如果有Token）
            if (this.hasValidToken() && window.githubManager) {
                console.log('🌐 尝试从GitHub加载数据...');
                data = await this.loadFromGitHub();
                
                if (data && this.isValidData(data)) {
                    console.log('✅ 从GitHub加载数据成功');
                    this.data = data;
                    this.saveToLocalStorage();
                    this.updateSyncInfo('github');
                    this.dispatchDataLoaded('github');
                    return;
                }
            }
            
            // 2. 从本地存储加载
            console.log('💾 从本地存储加载数据...');
            data = this.loadFromLocalStorage();
            
            if (data && this.isValidData(data)) {
                console.log('✅ 从本地存储加载数据成功');
                this.data = data;
                this.dispatchDataLoaded('local');
                return;
            }
            
            // 3. 使用默认数据
            console.log('⚙️ 使用默认数据...');
            this.data = { ...this.defaultData };
            this.saveToLocalStorage();
            this.dispatchDataLoaded('default');
            
        } catch (error) {
            console.error('❌ 加载数据失败:', error);
            this.data = { ...this.defaultData };
            this.dispatchDataLoadError(error);
        }
    }

    async loadFromGitHub() {
        if (!window.githubManager || !this.hasValidToken()) {
            throw new Error('GitHub管理器未初始化或Token无效');
        }

        try {
            const results = await window.githubManager.getAllFiles();
            
            // 确保所有数据结构完整
            Object.keys(this.defaultData).forEach(key => {
                if (!results[key] || !Array.isArray(results[key])) {
                    results[key] = this.defaultData[key];
                }
            });
            
            return results;
        } catch (error) {
            console.error('❌ 从GitHub加载数据失败:', error);
            throw error;
        }
    }

    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('research_portal_data');
            if (!savedData) return null;
            
            const data = JSON.parse(savedData);
            
            // 验证数据结构
            if (!this.isValidData(data)) {
                console.warn('⚠️ 本地存储数据格式无效');
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('❌ 解析本地存储数据失败:', error);
            return null;
        }
    }

    isValidData(data) {
        const requiredKeys = ['advisors', 'students', 'projects', 'publications', 'updates'];
        return requiredKeys.every(key => 
            data[key] && Array.isArray(data[key])
        );
    }

    // ========== 数据同步方法 ==========
    async syncFromGitHub() {
        if (!window.githubManager || !this.hasValidToken()) {
            console.log('⚠️ 无法从GitHub同步：Token无效或githubManager未初始化');
            return false;
        }

        try {
            console.log('🔄 开始从GitHub同步数据...');
            this.dispatchSyncStatusChanged({ 
                status: 'syncing', 
                message: '正在从GitHub同步数据...' 
            });
            
            const data = await this.loadFromGitHub();
            
            if (data) {
                // 检查并解决冲突
                const resolvedData = await this.resolveConflicts(data);
                this.data = resolvedData;
                
                // 保存到本地存储
                this.saveToLocalStorage();
                
                // 更新同步信息
                this.lastSyncTime = new Date().toISOString();
                this.dataVersion = Date.now().toString();
                localStorage.setItem('last_sync_time', this.lastSyncTime);
                localStorage.setItem('data_version', this.dataVersion);
                
                console.log('✅ 从GitHub同步数据成功');
                this.dispatchSyncStatusChanged({ 
                    status: 'success', 
                    message: '数据同步成功' 
                });
                this.dispatchDataUpdated();
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ 从GitHub同步数据失败:', error);
            this.dispatchSyncStatusChanged({ 
                status: 'error', 
                message: `同步失败: ${error.message}` 
            });
            return false;
        }
    }

    async syncToGitHub() {
        if (!window.githubManager || !this.hasValidToken()) {
            console.log('⚠️ 无法保存到GitHub：Token无效或githubManager未初始化');
            this.dispatchSyncStatusChanged({ 
                status: 'warning', 
                message: '未配置GitHub，数据仅保存到本地' 
            });
            
            // 只保存到本地
            this.saveToLocalStorage();
            return { success: false, source: 'local' };
        }

        try {
            console.log('🔄 开始保存数据到GitHub...');
            this.dispatchSyncStatusChanged({ 
                status: 'syncing', 
                message: '正在保存数据到GitHub...' 
            });
            
            // 增加版本号
            this.incrementVersion();
            
            // 同步所有文件
            const results = await window.githubManager.syncAllFiles(this.data);
            
            // 检查结果
            const failed = Object.values(results).filter(r => !r.success);
            
            if (failed.length > 0) {
                console.error(`⚠️ 部分文件保存失败: ${failed.length} 个`);
                
                // 即使部分失败，也更新同步信息
                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('last_sync_time', this.lastSyncTime);
                
                this.dispatchSyncStatusChanged({ 
                    status: 'partial', 
                    message: `部分文件保存失败: ${failed.length} 个` 
                });
                
                return { 
                    success: false, 
                    source: 'github', 
                    failed: failed.length,
                    total: Object.keys(results).length 
                };
            }
            
            // 更新同步信息
            this.lastSyncTime = new Date().toISOString();
            this.dataVersion = Date.now().toString();
            localStorage.setItem('last_sync_time', this.lastSyncTime);
            localStorage.setItem('data_version', this.dataVersion);
            
            console.log('✅ 所有数据已成功保存到GitHub');
            this.dispatchSyncStatusChanged({ 
                status: 'success', 
                message: '数据已保存到GitHub' 
            });
            this.dispatchDataSaved();
            
            return { 
                success: true, 
                source: 'github', 
                version: this.dataVersion,
                timestamp: this.lastSyncTime 
            };
        } catch (error) {
            console.error('❌ 保存数据到GitHub失败:', error);
            
            // GitHub保存失败，保存到本地
            this.saveToLocalStorage();
            
            this.dispatchSyncStatusChanged({ 
                status: 'error', 
                message: `GitHub保存失败，数据已保存到本地` 
            });
            
            return { 
                success: false, 
                source: 'local', 
                error: error.message 
            };
        }
    }

    async manualSync() {
        console.log('🔄 手动同步数据...');
        
        try {
            // 先拉取最新数据
            await this.syncFromGitHub();
            
            // 然后推送本地修改
            const result = await this.syncToGitHub();
            
            return result;
        } catch (error) {
            console.error('❌ 手动同步失败:', error);
            return { success: false, error: error.message };
        }
    }

    // ========== 冲突解决方法 ==========
    async resolveConflicts(newData) {
        const localData = this.data;
        const conflicts = {};
        
        // 检查每个数据类型的冲突
        Object.keys(this.dataFiles).forEach(type => {
            const localItems = localData[type] || [];
            const newItems = newData[type] || [];
            
            // 比较SHA或版本号
            if (JSON.stringify(localItems) !== JSON.stringify(newItems)) {
                conflicts[type] = {
                    localCount: localItems.length,
                    newCount: newItems.length,
                    hasChanges: true
                };
            }
        });
        
        if (Object.keys(conflicts).length === 0) {
            console.log('✅ 未检测到数据冲突');
            return newData;
        }
        
        console.log('⚠️ 检测到数据冲突:', conflicts);
        
        // 根据策略解决冲突
        if (this.conflictStrategy === 'ask') {
            // 需要用户交互，暂时使用远程数据
            console.log('🤔 需要用户解决冲突，暂时使用远程数据');
            this.dispatchConflictDetected(conflicts);
            return newData;
        }
        
        // 自动解决冲突
        const resolvedData = { ...newData };
        
        Object.keys(conflicts).forEach(async (type) => {
            if (window.githubManager && conflicts[type].hasChanges) {
                resolvedData[type] = await window.githubManager.resolveConflict(
                    this.dataFiles[type],
                    localData[type],
                    newData[type],
                    this.conflictStrategy
                );
            }
        });
        
        console.log('✅ 数据冲突已自动解决');
        return resolvedData;
    }

    setConflictStrategy(strategy) {
        const validStrategies = ['merge', 'remote', 'local', 'timestamp', 'ask'];
        if (validStrategies.includes(strategy)) {
            this.conflictStrategy = strategy;
            localStorage.setItem('conflict_strategy', strategy);
            console.log(`✅ 冲突解决策略已设置为: ${strategy}`);
        }
    }

    // ========== 自动同步控制 ==========
    startAutoSync() {
        if (this.autoSyncTimer) {
            console.log('⏰ 自动同步已启动');
            return;
        }
        
        console.log(`⏰ 开始自动同步，间隔: ${this.syncInterval/1000}秒`);
        
        this.autoSyncTimer = setInterval(async () => {
            // 检查是否有管理员正在编辑
            if (window.adminSystem && window.adminSystem.editMode) {
                console.log('✏️ 管理员正在编辑，跳过自动同步');
                return;
            }
            
            // 检查网络连接
            if (!navigator.onLine) {
                console.log('🌐 网络未连接，跳过自动同步');
                return;
            }
            
            // 检查标签页是否可见
            if (document.hidden) {
                console.log('👁️ 标签页不可见，跳过自动同步');
                return;
            }
            
            console.log('🔄 自动同步检查...');
            await this.syncFromGitHub();
            
        }, this.syncInterval);
    }

    stopAutoSync() {
        if (this.autoSyncTimer) {
            console.log('⏹️ 停止自动同步');
            clearInterval(this.autoSyncTimer);
            this.autoSyncTimer = null;
        }
    }

    setSyncInterval(intervalMs) {
        this.syncInterval = intervalMs;
        console.log(`⏰ 同步间隔已设置为: ${intervalMs/1000}秒`);
        
        // 重新启动自动同步
        this.stopAutoSync();
        this.startAutoSync();
    }

    // ========== 数据操作方法 ==========
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
                console.error(`❌ 更新 ${type} 到GitHub失败:`, error);
            });
            
            // 触发数据更新事件
            this.dispatchDataUpdated();
            this.dispatchItemUpdated(type, this.data[type][index]);
            
            return true;
        }
        return false;
    }

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
            console.error(`❌ 添加 ${type} 到GitHub失败:`, error);
        });
        
        // 触发数据更新事件
        this.dispatchDataUpdated();
        this.dispatchItemAdded(type, itemWithId);
        
        return itemWithId.id;
    }

    async deleteData(type, id) {
        const items = this.data[type];
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            const deletedItem = items[index];
            this.data[type].splice(index, 1);
            
            // 保存到本地
            this.saveToLocalStorage();
            
            // 异步保存到GitHub
            this.syncToGitHub().catch(error => {
                console.error(`❌ 删除 ${type} 到GitHub失败:`, error);
            });
            
            // 触发数据更新事件
            this.dispatchDataUpdated();
            this.dispatchItemDeleted(type, deletedItem);
            
            return true;
        }
        return false;
    }

    // ========== 批量操作 ==========
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
                console.error(`❌ 批量更新 ${type} 到GitHub失败:`, error);
            });
            
            // 触发数据更新事件
            this.dispatchDataUpdated();
        }
        
        return updatedCount;
    }

    async batchDelete(type, ids) {
        const items = this.data[type];
        const deletedItems = [];
        
        // 从后往前删除，避免索引问题
        for (let i = items.length - 1; i >= 0; i--) {
            if (ids.includes(items[i].id)) {
                deletedItems.unshift(items[i]); // 保持顺序
                items.splice(i, 1);
            }
        }
        
        if (deletedItems.length > 0) {
            // 保存到本地
            this.saveToLocalStorage();
            
            // 异步保存到GitHub
            this.syncToGitHub().catch(error => {
                console.error(`❌ 批量删除 ${type} 到GitHub失败:`, error);
            });
            
            // 触发数据更新事件
            this.dispatchDataUpdated();
            this.dispatchBatchDeleted(type, deletedItems);
        }
        
        return deletedItems.length;
    }

    // ========== 数据导入导出 ==========
    exportData() {
        const exportData = {
            ...this.data,
            exportInfo: {
                exportedAt: new Date().toISOString(),
                version: this.dataVersion,
                source: 'research_portal',
                items: Object.keys(this.data).reduce((acc, key) => {
                    acc[key] = this.data[key].length;
                    return acc;
                }, {})
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    async importData(jsonString) {
        try {
            const newData = JSON.parse(jsonString);
            
            // 验证数据格式
            if (!this.isValidData(newData)) {
                throw new Error('导入的数据格式不正确');
            }
            
            // 更新数据
            this.data = newData;
            
            // 保存到本地
            this.saveToLocalStorage();
            
            // 保存到GitHub
            const success = await this.syncToGitHub();
            
            // 触发数据更新事件
            this.dispatchDataUpdated();
            
            return success;
        } catch (error) {
            console.error('❌ 导入数据失败:', error);
            return false;
        }
    }

    async resetToDefault() {
        if (!confirm('确定要重置所有数据为默认值吗？此操作不可撤销。')) {
            return false;
        }
        
        this.data = { ...this.defaultData };
        
        // 保存到本地
        this.saveToLocalStorage();
        
        // 保存到GitHub
        const success = await this.syncToGitHub();
        
        // 触发数据更新事件
        this.dispatchDataUpdated();
        
        return success;
    }

    // ========== 辅助方法 ==========
    saveToLocalStorage() {
        try {
            localStorage.setItem('research_portal_data', JSON.stringify(this.data));
            
            // 更新本地版本号
            const localVersion = Date.now().toString();
            this.lastLocalVersion = localVersion;
            localStorage.setItem('last_local_version', localVersion);
            
            console.log('💾 数据已保存到本地存储');
            return true;
        } catch (error) {
            console.error('❌ 保存到本地存储失败:', error);
            return false;
        }
    }

    incrementVersion() {
        const currentVersion = parseInt(this.dataVersion) || 0;
        this.dataVersion = (currentVersion + 1).toString();
        localStorage.setItem('data_version', this.dataVersion);
    }

    updateSyncInfo(source) {
        this.lastSyncTime = new Date().toISOString();
        localStorage.setItem('last_sync_time', this.lastSyncTime);
        console.log(`📊 同步信息更新: 来源=${source}, 时间=${this.lastSyncTime}`);
    }

    setGitHubToken(token) {
        this.githubToken = token;
        localStorage.setItem('github_admin_token', token);
        
        // 更新githubManager的Token
        if (window.githubManager) {
            window.githubManager.setToken(token);
        }
        
        console.log('✅ GitHub Token 已设置');
        
        // 尝试从GitHub加载数据
        setTimeout(() => this.syncFromGitHub(), 1000);
    }

    getGitHubToken() {
        return this.githubToken;
    }

    hasValidToken() {
        return !!this.githubToken && 
               (this.githubToken.startsWith('ghp_') || 
                this.githubToken.startsWith('github_pat_'));
    }

    async checkGitHubConnection() {
        if (!this.hasValidToken() || !window.githubManager) {
            return { connected: false, message: '未设置GitHub Token' };
        }
        
        return await window.githubManager.testConnection();
    }

    getData(type) {
        return this.data[type] || [];
    }

    getAllData() {
        return { ...this.data };
    }

    getStats() {
        return {
            advisors: this.data.advisors.length,
            students: this.data.students.length,
            projects: this.data.projects.length,
            publications: this.data.publications.length,
            updates: this.data.updates.length,
            lastSyncTime: this.lastSyncTime,
            dataVersion: this.dataVersion,
            hasGitHubToken: this.hasValidToken(),
            isAutoSyncing: !!this.autoSyncTimer,
            syncInterval: this.syncInterval,
            conflictStrategy: this.conflictStrategy,
            totalItems: Object.values(this.data).reduce((sum, arr) => sum + arr.length, 0)
        };
    }

    // ========== 事件分发方法 ==========
    dispatchDataUpdated() {
        const event = new CustomEvent('dataUpdated', {
            detail: { 
                timestamp: new Date().toISOString(),
                dataVersion: this.dataVersion,
                stats: this.getStats()
            }
        });
        document.dispatchEvent(event);
    }

    dispatchDataSaved() {
        const event = new CustomEvent('dataSaved', {
            detail: { 
                timestamp: new Date().toISOString(),
                dataVersion: this.dataVersion 
            }
        });
        document.dispatchEvent(event);
    }

    dispatchDataLoaded(source) {
        const event = new CustomEvent('dataLoaded', {
            detail: { 
                source: source,
                timestamp: new Date().toISOString(),
                stats: this.getStats()
            }
        });
        document.dispatchEvent(event);
    }

    dispatchDataLoadError(error) {
        const event = new CustomEvent('dataLoadError', {
            detail: { 
                error: error.message,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    dispatchSyncStatusChanged(status) {
        const event = new CustomEvent('syncStatusChanged', {
            detail: { 
                ...status,
                timestamp: new Date().toISOString(),
                isOnline: navigator.onLine
            }
        });
        document.dispatchEvent(event);
    }

    dispatchConflictDetected(conflicts) {
        const event = new CustomEvent('conflictDetected', {
            detail: { 
                conflicts: conflicts,
                timestamp: new Date().toISOString(),
                strategy: this.conflictStrategy
            }
        });
        document.dispatchEvent(event);
    }

    dispatchItemUpdated(type, item) {
        const event = new CustomEvent('itemUpdated', {
            detail: { 
                type: type,
                item: item,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    dispatchItemAdded(type, item) {
        const event = new CustomEvent('itemAdded', {
            detail: { 
                type: type,
                item: item,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    dispatchItemDeleted(type, item) {
        const event = new CustomEvent('itemDeleted', {
            detail: { 
                type: type,
                item: item,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    dispatchBatchDeleted(type, items) {
        const event = new CustomEvent('batchDeleted', {
            detail: { 
                type: type,
                items: items,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    getSyncStatus() {
        return {
            lastSyncTime: this.lastSyncTime,
            dataVersion: this.dataVersion,
            hasGitHubToken: this.hasValidToken(),
            isAutoSyncing: !!this.autoSyncTimer,
            syncInterval: this.syncInterval,
            isSyncing: this.isSyncing,
            conflictStrategy: this.conflictStrategy,
            online: navigator.onLine
        };
    }
}

// 创建全局实例
window.dataManager = new DataManager();
