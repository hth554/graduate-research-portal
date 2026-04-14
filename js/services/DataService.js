// js/services/DataService.js
// 数据服务层，协调 API 调用和内存数据，触发事件

import ApiClient from '../core/ApiClient.js';
import EventBus, { EVENTS } from '../core/EventBus.js';
import { 
    DEFAULT_PROJECTS, 
    DEFAULT_ADVISORS, 
    DEFAULT_STUDENTS, 
    DEFAULT_PUBLICATIONS, 
    DEFAULT_UPDATES 
} from '../config/default-data.js';

class DataService {
    constructor() {
        // 内存中的数据
        this.data = {
            projects: [...DEFAULT_PROJECTS],
            advisors: [...DEFAULT_ADVISORS],
            students: [...DEFAULT_STUDENTS],
            publications: [...DEFAULT_PUBLICATIONS],
            updates: [...DEFAULT_UPDATES]
        };

        // 数据文件名映射
        this.fileMap = {
            projects: 'research-projects.json',
            advisors: 'research-advisors.json',
            students: 'research-students.json',
            publications: 'research-publications.json',
            updates: 'research-updates.json'
        };

        // 加载本地缓存
        this.loadFromLocalCache();
    }

    /**
     * 从本地 localStorage 加载缓存数据（修复合并逻辑）
     */
    loadFromLocalCache() {
        try {
            const cached = localStorage.getItem('research_portal_data');
            if (cached) {
                const parsed = JSON.parse(cached);
                // 逐字段合并，保留默认数据作为后备，避免覆盖整个对象
                if (parsed.projects && Array.isArray(parsed.projects)) {
                    this.data.projects = parsed.projects;
                }
                if (parsed.advisors && Array.isArray(parsed.advisors)) {
                    this.data.advisors = parsed.advisors;
                }
                if (parsed.students && Array.isArray(parsed.students)) {
                    this.data.students = parsed.students;
                }
                if (parsed.publications && Array.isArray(parsed.publications)) {
                    this.data.publications = parsed.publications;
                }
                if (parsed.updates && Array.isArray(parsed.updates)) {
                    this.data.updates = parsed.updates;
                }
            }
        } catch (e) {
            console.warn('读取本地缓存失败', e);
        }
    }

    /**
     * 保存数据到本地缓存
     */
    saveToLocalCache() {
        try {
            localStorage.setItem('research_portal_data', JSON.stringify(this.data));
        } catch (e) {
            console.warn('保存本地缓存失败', e);
        }
    }

    /**
     * 从 GitHub 同步所有数据
     */
    async syncFromGitHub() {
        const types = Object.keys(this.fileMap);
        let hasChanges = false;

        for (const type of types) {
            try {
                const filename = this.fileMap[type];
                const remoteData = await ApiClient.readJsonFile(filename);
                if (remoteData && Array.isArray(remoteData)) {
                    this.data[type] = remoteData;
                    hasChanges = true;
                }
            } catch (error) {
                console.warn(`同步 ${type} 失败，使用现有数据:`, error.message);
            }
        }

        if (hasChanges) {
            this.saveToLocalCache();
            EventBus.emit(EVENTS.DATA_CHANGED, { source: 'github' });
        }
        
        return hasChanges;
    }

    /**
     * 保存所有数据到 GitHub
     */
    async saveAllToGitHub() {
        const results = [];
        
        for (const [type, filename] of Object.entries(this.fileMap)) {
            try {
                await ApiClient.writeJsonFile(filename, this.data[type]);
                results.push({ type, success: true });
                // 文件间延迟避免限流
                await new Promise(r => setTimeout(r, 500));
            } catch (error) {
                results.push({ type, success: false, error: error.message });
                console.error(`保存 ${type} 失败:`, error);
            }
        }

        const failed = results.filter(r => !r.success);
        if (failed.length === 0) {
            this.saveToLocalCache();
            EventBus.emit(EVENTS.DATA_CHANGED, { source: 'local' });
        }
        
        return results;
    }

    /**
     * 获取数据副本
     */
    getData(type) {
        return this.data[type] ? [...this.data[type]] : [];
    }

    /**
     * 获取所有数据
     */
    getAllData() {
        return {
            projects: [...this.data.projects],
            advisors: [...this.data.advisors],
            students: [...this.data.students],
            publications: [...this.data.publications],
            updates: [...this.data.updates]
        };
    }

    /**
     * 添加数据项
     */
    async addItem(type, item) {
        const items = this.data[type];
        const maxId = items.length > 0 ? Math.max(...items.map(i => i.id)) : 0;
        
        const newItem = {
            ...item,
            id: maxId + 1,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
        };
        
        items.push(newItem);
        this.saveToLocalCache();
        
        // 尝试保存到 GitHub
        this.saveAllToGitHub().catch(console.warn);
        
        EventBus.emit(EVENTS.DATA_CHANGED, { type, action: 'add', id: newItem.id });
        return newItem;
    }

    /**
     * 更新数据项
     */
    async updateItem(type, id, updates) {
        const items = this.data[type];
        const index = items.findIndex(item => item.id == id);
        
        if (index === -1) return false;
        
        items[index] = {
            ...items[index],
            ...updates,
            updatedAt: new Date().toISOString().split('T')[0]
        };
        
        this.saveToLocalCache();
        this.saveAllToGitHub().catch(console.warn);
        
        EventBus.emit(EVENTS.DATA_CHANGED, { type, action: 'update', id });
        return true;
    }

    /**
     * 删除数据项
     */
    async deleteItem(type, id) {
        const items = this.data[type];
        const index = items.findIndex(item => item.id == id);
        
        if (index === -1) return false;
        
        items.splice(index, 1);
        this.saveToLocalCache();
        this.saveAllToGitHub().catch(console.warn);
        
        EventBus.emit(EVENTS.DATA_CHANGED, { type, action: 'delete', id });
        return true;
    }

    /**
     * 重置为默认数据
     */
    resetToDefault() {
        this.data = {
            projects: [...DEFAULT_PROJECTS],
            advisors: [...DEFAULT_ADVISORS],
            students: [...DEFAULT_STUDENTS],
            publications: [...DEFAULT_PUBLICATIONS],
            updates: [...DEFAULT_UPDATES]
        };
        this.saveToLocalCache();
        EventBus.emit(EVENTS.DATA_CHANGED, { source: 'reset' });
    }

    /**
     * 导出数据为 JSON
     */
    exportData() {
        return JSON.stringify({
            ...this.getAllData(),
            exportTime: new Date().toISOString()
        }, null, 2);
    }
}

// 导出单例
export default new DataService();