class DataManager {
    constructor() {
        this.defaultData = {
            advisors: [
                {id: 1, name: "李四教授", avatar: "https://randomuser.me/api/portraits/men/32.jpg", title: "教授，博士生导师", field: "计算机视觉", bio: "长期从事计算机视觉研究，发表论文100余篇。"},
                {id: 2, name: "赵六教授", avatar: "https://randomuser.me/api/portraits/women/44.jpg", title: "教授，博士生导师", field: "自然语言处理", bio: "在自然语言处理领域有深厚造诣，多项研究成果已产业化。"}
            ],
            students: [
                {id: 1, name: "张三", avatar: "https://randomuser.me/api/portraits/men/22.jpg", degree: "硕士生", field: "计算机科学", supervisor: "李四教授", research: "深度学习在图像识别中的应用"},
                {id: 2, name: "王五", avatar: "https://randomuser.me/api/portraits/women/33.jpg", degree: "博士生", field: "人工智能", supervisor: "赵六教授", research: "自然语言处理与机器翻译"}
            ],
            projects: [
                {id: 1, title: "基于深度学习的人脸识别系统", category: "engineering", description: "本项目研究基于深度学习的人脸识别算法，旨在提高识别准确率和实时性。", advisor: "李四教授", status: "进行中", student: "张三"},
                {id: 2, title: "量子计算在密码学中的应用", category: "science", description: "探索量子计算对现代密码学的影响及量子安全加密方案。", advisor: "赵六教授", status: "已完成", student: "王五"}
            ],
            publications: [
                {id: 1, type: "期刊论文", title: "基于Transformer的视觉识别模型研究", authors: "张三, 李四", venue: "计算机学报, 2023", abstract: "本文提出了一种改进的Transformer模型..."}
            ],
            updates: [
                {id: 1, date: "2023-10-15", title: "实验室获得国家自然科学基金资助", type: "项目动态", content: "本实验室获得国家自然科学基金重点项目资助..."}
            ]
        };
        
        this.dataFiles = {
            advisors: 'advisors.json',
            students: 'students.json',
            projects: 'projects.json',
            publications: 'publications.json',
            updates: 'updates.json'
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
            if (window.labWebsite) {
                const currentFilter = localStorage.getItem('project_filter_state') || 'all';
                window.labWebsite.renderProjects(currentFilter);
                window.labWebsite.renderAdvisors();
                window.labWebsite.renderStudents();
                window.labWebsite.renderPublications();
                window.labWebsite.renderUpdates();
            }
        });
    }

    updatePermissionStatus(status) {
        if (window.labWebsite && window.labWebsite.updatePermissionStatus) {
            window.labWebsite.updatePermissionStatus(status);
        }
    }

    async loadPublicData() {
        try {
            const cachedData = localStorage.getItem('public_data_cache');
            const cacheTime = localStorage.getItem('public_data_cache_time');
            
            if (cachedData && cacheTime && Date.now() - parseInt(cacheTime) < 3600000) {
                this.publicDataCache = JSON.parse(cachedData);
                this.publicDataCacheTime = cacheTime;
                this.applyPublicData(this.publicDataCache);
                return true;
            }
            
            const publicData = await this.fetchPublicData();
            
            if (publicData) {
                localStorage.setItem('public_data_cache', JSON.stringify(publicData));
                localStorage.setItem('public_data_cache_time', Date.now().toString());
                this.publicDataCache = publicData;
                this.publicDataCacheTime = Date.now().toString();
                this.applyPublicData(publicData);
                return true;
            }
            
            console.log('GitHub加载失败，使用默认数据');
            this.data = { ...this.defaultData };
            this.saveToLocalStorage();
            return false;
            
        } catch (error) {
            console.error('加载公共数据失败:', error);
            this.data = { ...this.defaultData };
            this.saveToLocalStorage();
            return false;
        }
    }
    
    async fetchPublicData() {
        try {
            const files = ['projects.json', 'advisors.json', 'students.json', 
                          'publications.json', 'updates.json'];
            const data = {};
            let successCount = 0;
            
            await Promise.all(files.map(async (filename) => {
                try {
                    const response = await fetch(
                        `https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/${filename}`
                    );
                    
                    if (response.ok) {
                        const jsonData = await response.json();
                        data[filename.replace('.json', '')] = jsonData;
                        successCount++;
                    } else {
                        const key = filename.replace('.json', '');
                        data[key] = this.defaultData[key] || [];
                    }
                } catch (error) {
                    const key = filename.replace('.json', '');
                    data[key] = this.defaultData[key] || [];
                }
            }));
            
            return successCount > 0 ? data : null;
        } catch (error) {
            console.error('获取公开数据失败:', error);
            return null;
        }
    }
    
    applyPublicData(publicData) {
        this.data = {
            advisors: publicData.advisors || this.defaultData.advisors,
            students: publicData.students || this.defaultData.students,
            projects: publicData.projects || this.defaultData.projects,
            publications: publicData.publications || this.defaultData.publications,
            updates: publicData.updates || this.defaultData.updates
        };
        
        this.ensureDataStructure();
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
            console.error('加载数据失败:', error);
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
            console.log('无法从GitHub同步：Token无效或githubIssuesManager未初始化');
            return false;
        }

        try {
            const promises = Object.entries(this.dataFiles).map(async ([type, filename]) => {
                try {
                    const data = await window.githubIssuesManager.readJsonFile(filename);
                    return { type, data };
                } catch (error) {
                    console.warn(`无法从GitHub加载 ${filename}:`, error.message);
                    return { type, data: this.defaultData[type] || [] };
                }
            });

            const results = await Promise.all(promises);
            results.forEach(({ type, data }) => this.data[type] = data);
            
            this.lastSyncTime = new Date().toISOString();
            this.dataVersion = Date.now().toString();
            
            this.saveToLocalStorage();
            localStorage.setItem('last_sync_time', this.lastSyncTime);
            localStorage.setItem('data_version', this.dataVersion);
            
            this.dispatchDataUpdated();
            return true;
        } catch (error) {
            console.error('从GitHub同步数据失败:', error);
            return false;
        }
    }

    async syncToGitHub() {
        if (!this.hasValidToken() || !window.githubIssuesManager) {
            if (typeof showToast === 'function') {
                showToast('需要GitHub Token才能保存数据到云端', 'warning');
            }
            this.saveToLocalStorage();
            return false;
        }

        try {
            const promises = Object.entries(this.dataFiles).map(async ([type, filename]) => {
                try {
                    await window.githubIssuesManager.writeJsonFile(filename, this.data[type]);
                    return { filename, success: true };
                } catch (error) {
                    console.error(`保存 ${filename} 到GitHub失败:`, error);
                    return { filename, success: false, error };
                }
            });

            const results = await Promise.all(promises);
            const failed = results.filter(r => !r.success);
            
            if (failed.length > 0) {
                console.error(`部分文件保存失败: ${failed.map(f => f.filename).join(', ')}`);
                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('last_sync_time', this.lastSyncTime);
                return false;
            }
            
            this.lastSyncTime = new Date().toISOString();
            this.dataVersion = Date.now().toString();
            localStorage.setItem('last_sync_time', this.lastSyncTime);
            localStorage.setItem('data_version', this.dataVersion);
            
            this.dispatchDataSaved();
            return true;
        } catch (error) {
            console.error('保存数据到GitHub失败:', error);
            this.saveToLocalStorage();
            return false;
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
            await this.syncFromGitHub();
            await this.syncToGitHub();
            return true;
        } catch (error) {
            console.error('手动同步失败:', error);
            return false;
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('research_portal_data', JSON.stringify(this.data));
            localStorage.setItem('local_data_version', Date.now().toString());
            return true;
        } catch (e) {
            console.error('保存到本地存储失败:', e);
            return false;
        }
    }

    getData(type) { return this.data[type] || []; }
    getAllData() { return { ...this.data }; }

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
                updatedAt: new Date().toISOString()
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
            updatedAt: new Date().toISOString()
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
            this.saveToLocalStorage();
            this.syncToGitHub().catch(console.error);
            this.dispatchDataUpdated();
        }
        
        return updatedCount;
    }

    exportData() {
        return JSON.stringify({
            ...this.data,
            exportInfo: {
                exportedAt: new Date().toISOString(),
                version: this.dataVersion,
                source: 'research_portal'
            }
        }, null, 2);
    }

    async importData(jsonString) {
        try {
            const newData = JSON.parse(jsonString);
            const requiredFields = ['advisors', 'students', 'projects', 'publications', 'updates'];
            const isValid = requiredFields.every(field => Array.isArray(newData[field]));
            
            if (!isValid) throw new Error('导入的数据格式不正确');
            
            this.data = newData;
            this.ensureDataStructure();
            this.saveToLocalStorage();
            const success = await this.syncToGitHub();
            this.dispatchDataUpdated();
            return success;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    }

    async resetToDefault() {
        this.data = { ...this.defaultData };
        this.saveToLocalStorage();
        const success = await this.syncToGitHub();
        this.dispatchDataUpdated();
        return success;
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
            detail: { timestamp: new Date().toISOString(), dataVersion: this.dataVersion }
        }));
    }

    dispatchDataSaved() {
        document.dispatchEvent(new CustomEvent('dataSaved', {
            detail: { timestamp: new Date().toISOString(), dataVersion: this.dataVersion }
        }));
    }

    getSyncStatus() {
        return {
            lastSyncTime: this.lastSyncTime,
            dataVersion: this.dataVersion,
            hasGitHubToken: this.hasValidToken(),
            isAutoSyncing: !!this.autoSyncTimer,
            syncInterval: this.syncInterval,
            publicDataCacheTime: this.publicDataCacheTime
        };
    }
}

window.dataManager = new DataManager();
