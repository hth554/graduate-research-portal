class DataManager {
    constructor() {
        this.defaultData = {
            advisors: [
                {id: 1, name: "李四教授", avatar: "https://randomuser.me/api/portraits/men/32.jpg", title: "教授，博士生导师", field: "计算机视觉", bio: "长期从事计算机视觉研究，发表论文100余篇。", isDefault: true},
                {id: 2, name: "赵六教授", avatar: "https://randomuser.me/api/portraits/women/44.jpg", title: "教授，博士生导师", field: "自然语言处理", bio: "在自然语言处理领域有深厚造诣，多项研究成果已产业化。", isDefault: true}
            ],
            students: [
                {id: 1, name: "张三", avatar: "https://randomuser.me/api/portraits/men/22.jpg", degree: "硕士生", field: "计算机科学", supervisor: "李四教授", research: "深度学习在图像识别中的应用", isDefault: true},
                {id: 2, name: "王五", avatar: "https://randomuser.me/api/portraits/women/33.jpg", degree: "博士生", field: "人工智能", supervisor: "赵六教授", research: "自然语言处理与机器翻译", isDefault: true}
            ],
            projects: [
                {id: 1, title: "基于深度学习的人脸识别系统", category: "engineering", description: "本项目研究基于深度学习的人脸识别算法，旨在提高识别准确率和实时性。", advisor: "李四教授", status: "进行中", student: "张三", isDefault: true},
                {id: 2, title: "量子计算在密码学中的应用", category: "science", description: "探索量子计算对现代密码学的影响及量子安全加密方案。", advisor: "赵六教授", status: "已完成", student: "王五", isDefault: true}
            ],
            publications: [
                {id: 1, type: "期刊论文", title: "基于Transformer的视觉识别模型研究", authors: "张三, 李四", venue: "计算机学报, 2023", abstract: "本文提出了一种改进的Transformer模型...", isDefault: true}
            ],
            updates: [
                {id: 1, date: "2023-10-15", title: "实验室获得国家自然科学基金资助", type: "项目动态", content: "本实验室获得国家自然科学基金重点项目资助...", isDefault: true}
            ]
        };
        
        this.dataFiles = {
            advisors: 'research-advisors.json',
            students: 'research-students.json',
            projects: 'research-projects.json',
            publications: 'research-publications.json',
            updates: 'research-updates.json'
        };
        
        this.owner = 'HTH554';
        this.repo = 'graduate-research-portal';
        this.githubToken = localStorage.getItem('github_admin_token');
        this.dataVersion = localStorage.getItem('data_version') || '0';
        this.lastSyncTime = localStorage.getItem('last_sync_time') || null;
        this.syncInterval = 60000;
        this.data = { ...this.defaultData };
        this.publicDataCacheTime = localStorage.getItem('public_data_cache_time') || null;
        this.publicDataCache = null;
        this.autoSyncTimer = null;
        
        this.init();
    }

    async init() {
        try {
            await this.loadPublicData();
            
            if (this.hasValidToken() && window.githubIssuesManager) {
                window.githubIssuesManager.setToken(this.githubToken);
                await this.syncFromGitHub();
                this.startAutoSync();
                this.updatePermissionStatus('authenticated');
            } else {
                this.updatePermissionStatus('guest');
            }
            
            this.bindEvents();
            console.log('✅ DataManager 初始化完成');
        } catch (error) {
            console.error('❌ DataManager 初始化失败:', error);
        }
    }

    bindEvents() {
        document.addEventListener('adminModeChanged', (event) => {
            event.detail.isAdmin && event.detail.editMode ? 
                this.stopAutoSync() : this.startAutoSync();
        });
        
        document.addEventListener('dataUpdated', () => {
            // 使用 labWebsite 的渲染函数（已修复）
            if (window.labWebsite && window.labWebsite.renderProjects) {
                const currentFilter = localStorage.getItem('project_filter_state') || 'all';
                window.labWebsite.renderProjects(currentFilter);
                window.labWebsite.renderAdvisors();
                window.labWebsite.renderStudents();
                window.labWebsite.renderPublications();
                window.labWebsite.renderUpdates();
            } else {
                // 如果 labWebsite 未加载，直接触发自定义事件
                this.dispatchCustomEvent('renderNeeded');
            }
        });
    }
    
    dispatchCustomEvent(eventName, detail = {}) {
        document.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    updatePermissionStatus(status) {
        if (window.labWebsite && window.labWebsite.showPermissionStatus) {
            // 使用 labWebsite 的函数（如果可用）
            const messages = {
                'guest': '👤 游客模式，只能查看数据',
                'authenticated': '🔗 已连接GitHub | 数据实时同步'
            };
            window.labWebsite.showPermissionStatus(messages[status] || status, status);
        }
    }

    async loadPublicData() {
        try {
            // 优先检查本地存储的用户数据
            const savedData = localStorage.getItem('research_portal_data');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                // 合并本地数据和默认数据，但本地数据优先
                this.mergeDataWithDefaults(parsedData);
                this.saveToLocalStorage();
                console.log('✅ 从本地存储加载数据成功');
                return true;
            }
            
            // 其次检查公共数据缓存
            const cachedData = localStorage.getItem('public_data_cache');
            const cacheTime = localStorage.getItem('public_data_cache_time');
            
            if (cachedData && cacheTime && Date.now() - parseInt(cacheTime) < 3600000) {
                this.publicDataCache = JSON.parse(cachedData);
                this.publicDataCacheTime = cacheTime;
                this.mergeDataWithDefaults(this.publicDataCache);
                console.log('✅ 从缓存加载公共数据成功');
                return true;
            }
            
            // 最后尝试从 GitHub 获取
            const publicData = await this.fetchPublicData();
            
            if (publicData) {
                localStorage.setItem('public_data_cache', JSON.stringify(publicData));
                localStorage.setItem('public_data_cache_time', Date.now().toString());
                this.publicDataCache = publicData;
                this.publicDataCacheTime = Date.now().toString();
                this.mergeDataWithDefaults(publicData);
                console.log('✅ 从 GitHub 加载公共数据成功');
                return true;
            }
            
            // 所有方式都失败，使用默认数据
            console.log('❌ 所有数据源加载失败，使用默认数据');
            this.data = { ...this.defaultData };
            this.saveToLocalStorage();
            return false;
            
        } catch (error) {
            console.error('❌ 加载公共数据失败:', error);
            this.data = { ...this.defaultData };
            this.saveToLocalStorage();
            return false;
        }
    }
    
    mergeDataWithDefaults(externalData) {
        // 合并外部数据和默认数据，外部数据优先
        ['advisors', 'students', 'projects', 'publications', 'updates'].forEach(field => {
            if (externalData[field] && Array.isArray(externalData[field])) {
                // 过滤掉示例数据，只保留用户数据
                const userData = externalData[field].filter(item => !item.isDefault);
                // 合并用户数据和默认数据
                this.data[field] = [...this.defaultData[field], ...userData];
            } else {
                this.data[field] = this.defaultData[field] || [];
            }
        });
    }
    
    async fetchPublicData() {
        try {
            const files = [
                'research-projects.json', 
                'research-advisors.json', 
                'research-students.json', 
                'research-publications.json', 
                'research-updates.json'
            ];
            const data = {};
            let successCount = 0;
            
            for (const filename of files) {
                try {
                    const response = await fetch(
                        `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/data/${filename}`,
                        { cache: 'no-cache' }
                    );
                    
                    if (response.ok) {
                        const jsonData = await response.json();
                        const key = filename.replace('.json', '').replace('research-', '');
                        data[key] = jsonData;
                        successCount++;
                        console.log(`✅ 加载 ${filename} 成功`);
                    } else {
                        const key = filename.replace('.json', '').replace('research-', '');
                        data[key] = this.defaultData[key] || [];
                        console.log(`⚠️ 加载 ${filename} 失败: ${response.status}`);
                    }
                } catch (error) {
                    const key = filename.replace('.json', '').replace('research-', '');
                    data[key] = this.defaultData[key] || [];
                    console.log(`❌ 加载 ${filename} 出错:`, error.message);
                }
            }
            
            return successCount > 0 ? data : null;
        } catch (error) {
            console.error('❌ 获取公开数据失败:', error);
            return null;
        }
    }
    
    applyPublicData(publicData) {
        this.mergeDataWithDefaults(publicData);
        this.saveToLocalStorage();
        this.dispatchDataUpdated();
    }

    setGitHubToken(token) {
        this.githubToken = token;
        localStorage.setItem('github_admin_token', token);
        
        if (window.githubIssuesManager) {
            window.githubIssuesManager.setToken(token);
        }
        
        this.syncFromGitHub();
    }

    getGitHubToken() { return this.githubToken; }

    hasValidToken() {
        return !!this.githubToken && 
               (this.githubToken.startsWith('ghp_') || 
                this.githubToken.startsWith('github_pat_'));
    }

    async loadData() {
        try {
            if (this.hasValidToken()) {
                const success = await this.syncFromGitHub();
                if (success) return;
            }
            
            const savedData = localStorage.getItem('research_portal_data');
            this.data = savedData ? JSON.parse(savedData) : { ...this.defaultData };
            this.ensureDataStructure();
            this.saveToLocalStorage();
        } catch (error) {
            console.error('❌ 加载数据失败:', error);
            this.data = { ...this.defaultData };
        }
    }

    ensureDataStructure(dataObj = this.data) {
        ['advisors', 'students', 'projects', 'publications', 'updates'].forEach(field => {
            if (!dataObj[field]) dataObj[field] = this.defaultData[field] || [];
        });
    }

    async syncFromGitHub() {
        if (!this.hasValidToken() || !window.githubIssuesManager) {
            console.log('⚠️ 无法从GitHub同步：Token无效或githubIssuesManager未初始化');
            return false;
        }

        try {
            console.log('🔄 开始从GitHub同步数据...');
            const promises = Object.entries(this.dataFiles).map(async ([type, filename]) => {
                try {
                    const data = await window.githubIssuesManager.readJsonFile(filename);
                    return { type, data, success: true };
                } catch (error) {
                    console.warn(`❌ 无法从GitHub加载 ${filename}:`, error.message);
                    return { type, data: this.defaultData[type] || [], success: false, error };
                }
            });

            const results = await Promise.all(promises);
            let allSuccess = true;
            
            results.forEach(({ type, data, success }) => {
                if (success) {
                    // 过滤掉示例数据，只保留用户数据
                    const userData = data.filter(item => !item.isDefault);
                    // 合并用户数据和默认数据
                    this.data[type] = [...this.defaultData[type], ...userData];
                } else {
                    allSuccess = false;
                    // 失败时保留现有数据
                }
            });
            
            this.lastSyncTime = new Date().toISOString();
            this.dataVersion = Date.now().toString();
            
            this.saveToLocalStorage();
            localStorage.setItem('last_sync_time', this.lastSyncTime);
            localStorage.setItem('data_version', this.dataVersion);
            
            this.dispatchDataUpdated();
            console.log(`✅ 从GitHub同步数据${allSuccess ? '成功' : '部分成功'}`);
            return allSuccess;
        } catch (error) {
            console.error('❌ 从GitHub同步数据失败:', error);
            return false;
        }
    }

    async syncToGitHub() {
        if (!this.hasValidToken() || !window.githubIssuesManager) {
            if (typeof showToast === 'function') {
                showToast('需要GitHub Token才能保存数据到云端', 'warning');
            }
            this.saveToLocalStorage();
            return { success: false, message: '无有效Token' };
        }

        try {
            console.log('🔄 开始保存数据到GitHub...');
            const results = [];
            
            for (const [type, filename] of Object.entries(this.dataFiles)) {
                try {
                    // 只保存非示例数据
                    const userData = this.data[type].filter(item => !item.isDefault);
                    await window.githubIssuesManager.writeJsonFile(filename, userData);
                    results.push({ filename, success: true });
                    console.log(`✅ 保存 ${filename} 成功`);
                } catch (error) {
                    console.error(`❌ 保存 ${filename} 到GitHub失败:`, error);
                    results.push({ filename, success: false, error: error.message });
                }
            }
            
            const failed = results.filter(r => !r.success);
            
            if (failed.length > 0) {
                const errorMsg = `部分文件保存失败: ${failed.map(f => f.filename).join(', ')}`;
                console.error(`❌ ${errorMsg}`);
                
                // 保存到本地存储作为备份
                this.saveToLocalStorage();
                
                return {
                    success: false,
                    message: errorMsg,
                    failedFiles: failed.map(f => f.filename),
                    results: results
                };
            }
            
            this.lastSyncTime = new Date().toISOString();
            this.dataVersion = Date.now().toString();
            localStorage.setItem('last_sync_time', this.lastSyncTime);
            localStorage.setItem('data_version', this.dataVersion);
            
            this.dispatchDataSaved();
            console.log('✅ 所有数据保存到GitHub成功');
            return {
                success: true,
                message: '数据保存成功',
                results: results
            };
        } catch (error) {
            console.error('❌ 保存数据到GitHub失败:', error);
            this.saveToLocalStorage();
            return {
                success: false,
                message: `保存失败: ${error.message}`,
                error: error
            };
        }
    }

    startAutoSync() {
        if (this.autoSyncTimer) clearInterval(this.autoSyncTimer);
        
        this.autoSyncTimer = setInterval(async () => {
            if (window.adminSystem && window.adminSystem.editMode) return;
            await this.syncFromGitHub();
        }, this.syncInterval);
    }

    stopAutoSync() {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
            this.autoSyncTimer = null;
        }
    }

    async manualSync() {
        try {
            const syncResult = await this.syncToGitHub();
            if (syncResult.success) {
                await this.syncFromGitHub();
                return { success: true, message: '同步成功' };
            }
            return syncResult;
        } catch (error) {
            console.error('❌ 手动同步失败:', error);
            return { success: false, message: `同步失败: ${error.message}` };
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('research_portal_data', JSON.stringify(this.data));
            localStorage.setItem('local_data_version', Date.now().toString());
            return true;
        } catch (e) {
            console.error('❌ 保存到本地存储失败:', e);
            return false;
        }
    }

    getData(type) { return this.data[type] || []; }
    getAllData() { return { ...this.data }; }

    getStats() {
        const userData = {
            advisors: this.data.advisors.filter(item => !item.isDefault).length,
            students: this.data.students.filter(item => !item.isDefault).length,
            projects: this.data.projects.filter(item => !item.isDefault).length,
            publications: this.data.publications.filter(item => !item.isDefault).length,
            updates: this.data.updates.filter(item => !item.isDefault).length
        };
        
        return {
            total: {
                advisors: this.data.advisors.length,
                students: this.data.students.length,
                projects: this.data.projects.length,
                publications: this.data.publications.length,
                updates: this.data.updates.length
            },
            user: userData,
            default: {
                advisors: this.data.advisors.filter(item => item.isDefault).length,
                students: this.data.students.filter(item => item.isDefault).length,
                projects: this.data.projects.filter(item => item.isDefault).length,
                publications: this.data.publications.filter(item => item.isDefault).length,
                updates: this.data.updates.filter(item => item.isDefault).length
            },
            lastSyncTime: this.lastSyncTime,
            dataVersion: this.dataVersion,
            hasGitHubToken: this.hasValidToken(),
            publicDataCacheTime: this.publicDataCacheTime
        };
    }

    async updateData(type, id, newData) {
        const items = this.data[type];
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            this.data[type][index] = { 
                ...this.data[type][index], 
                ...newData,
                updatedAt: new Date().toISOString(),
                isDefault: false // 确保更新后不是示例数据
            };
            
            this.saveToLocalStorage();
            this.syncToGitHub().catch(console.error);
            this.dispatchDataUpdated();
            return true;
        }
        return false;
    }

    async addData(type, newItem) {
        const items = this.data[type];
        const maxId = items.length > 0 ? Math.max(...items.map(item => item.id)) : 0;
        
        const itemWithId = {
            ...newItem,
            id: maxId + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDefault: false // 新添加的数据不是示例数据
        };
        
        this.data[type].push(itemWithId);
        this.saveToLocalStorage();
        this.syncToGitHub().catch(console.error);
        this.dispatchDataUpdated();
        return itemWithId.id;
    }

    async deleteData(type, id) {
        const items = this.data[type];
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            // 检查是否为示例数据
            if (items[index].isDefault) {
                console.log('⚠️ 尝试删除示例数据，已阻止');
                return false;
            }
            
            this.data[type].splice(index, 1);
            this.saveToLocalStorage();
            this.syncToGitHub().catch(console.error);
            this.dispatchDataUpdated();
            return true;
        }
        return false;
    }

    async batchUpdate(type, updates) {
        const items = this.data[type];
        let updatedCount = 0;
        
        updates.forEach(update => {
            const index = items.findIndex(item => item.id === update.id);
            if (index !== -1 && !items[index].isDefault) {
                this.data[type][index] = {
                    ...this.data[type][index],
                    ...update.data,
                    updatedAt: new Date().toISOString()
                };
                updatedCount++;
            }
        });
        
        if (updatedCount > 0) {
            this.saveToLocalStorage();
            this.syncToGitHub().catch(console.error);
            this.dispatchDataUpdated();
        }
        
        return updatedCount;
    }

    exportData() {
        // 只导出用户数据
        const userData = {
            advisors: this.data.advisors.filter(item => !item.isDefault),
            students: this.data.students.filter(item => !item.isDefault),
            projects: this.data.projects.filter(item => !item.isDefault),
            publications: this.data.publications.filter(item => !item.isDefault),
            updates: this.data.updates.filter(item => !item.isDefault)
        };
        
        return JSON.stringify({
            ...userData,
            exportInfo: {
                exportedAt: new Date().toISOString(),
                version: this.dataVersion,
                source: 'research_portal',
                note: '仅包含用户添加的数据，不包含示例数据'
            }
        }, null, 2);
    }

    async importData(jsonString) {
        try {
            const newData = JSON.parse(jsonString);
            const requiredFields = ['advisors', 'students', 'projects', 'publications', 'updates'];
            const isValid = requiredFields.every(field => Array.isArray(newData[field]));
            
            if (!isValid) throw new Error('导入的数据格式不正确');
            
            // 标记导入的数据为用户数据
            requiredFields.forEach(field => {
                if (newData[field]) {
                    newData[field].forEach(item => {
                        item.isDefault = false;
                        if (!item.createdAt) item.createdAt = new Date().toISOString();
                        if (!item.updatedAt) item.updatedAt = new Date().toISOString();
                    });
                }
            });
            
            // 合并导入的数据和默认数据
            requiredFields.forEach(field => {
                this.data[field] = [...this.defaultData[field], ...newData[field]];
            });
            
            this.ensureDataStructure();
            this.saveToLocalStorage();
            const syncResult = await this.syncToGitHub();
            this.dispatchDataUpdated();
            return syncResult.success;
        } catch (e) {
            console.error('❌ 导入数据失败:', e);
            return false;
        }
    }

    async resetToDefault() {
        // 只重置为用户数据为空，保留默认数据
        ['advisors', 'students', 'projects', 'publications', 'updates'].forEach(field => {
            this.data[field] = this.defaultData[field];
        });
        
        this.saveToLocalStorage();
        const syncResult = await this.syncToGitHub();
        this.dispatchDataUpdated();
        return syncResult.success;
    }

    async checkGitHubConnection() {
        if (!this.hasValidToken()) {
            return { connected: false, message: '未设置GitHub Token' };
        }
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: { 'Authorization': `Bearer ${this.githubToken}` }
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
            }
            return { connected: false, message: `连接失败: ${response.status}` };
        } catch (error) {
            return { connected: false, message: `连接错误: ${error.message}` };
        }
    }

    dispatchDataUpdated() {
        document.dispatchEvent(new CustomEvent('dataUpdated', {
            detail: { 
                timestamp: new Date().toISOString(), 
                dataVersion: this.dataVersion,
                stats: this.getStats()
            }
        }));
    }

    dispatchDataSaved() {
        document.dispatchEvent(new CustomEvent('dataSaved', {
            detail: { 
                timestamp: new Date().toISOString(), 
                dataVersion: this.dataVersion,
                message: '数据已保存到GitHub'
            }
        }));
    }

    getSyncStatus() {
        return {
            lastSyncTime: this.lastSyncTime,
            dataVersion: this.dataVersion,
            hasGitHubToken: this.hasValidToken(),
            isAutoSyncing: !!this.autoSyncTimer,
            syncInterval: this.syncInterval,
            publicDataCacheTime: this.publicDataCacheTime,
            stats: this.getStats()
        };
    }
    
    // 新增方法：获取用户数据（过滤示例数据）
    getUserData(type) {
        if (!this.data[type]) return [];
        return this.data[type].filter(item => !item.isDefault);
    }
    
    // 新增方法：获取所有用户数据
    getAllUserData() {
        return {
            advisors: this.getUserData('advisors'),
            students: this.getUserData('students'),
            projects: this.getUserData('projects'),
            publications: this.getUserData('publications'),
            updates: this.getUserData('updates')
        };
    }
}

window.dataManager = new DataManager();
