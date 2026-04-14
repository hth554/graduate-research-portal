// js/core/EventBus.js
// 全局事件总线，用于模块间解耦通信

class EventBus {
    constructor() {
        this.events = {};
    }

    /**
     * 订阅事件
     * @param {string} event 事件名
     * @param {Function} callback 回调函数
     * @returns {Function} 取消订阅函数
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        
        // 返回取消订阅函数
        return () => this.off(event, callback);
    }

    /**
     * 取消订阅
     * @param {string} event 事件名
     * @param {Function} callback 回调函数
     */
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    /**
     * 发布事件
     * @param {string} event 事件名
     * @param {*} data 传递的数据
     */
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`事件 ${event} 的回调执行出错:`, error);
            }
        });
    }

    /**
     * 订阅一次性事件
     * @param {string} event 事件名
     * @param {Function} callback 回调函数
     */
    once(event, callback) {
        const onceWrapper = (data) => {
            callback(data);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    }
}

// 导出单例
export default new EventBus();

// 预定义事件常量
export const EVENTS = {
    DATA_CHANGED: 'data:changed',
    AUTH_CHANGED: 'auth:changed',
    EDIT_MODE_CHANGED: 'editMode:changed',
    UI_EDIT_REQUEST: 'ui:edit-request',
    UI_SHOW_TOAST: 'ui:show-toast'
};