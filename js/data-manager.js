// js/data-manager.js - 数据管理和存储
class DataManager {
    constructor() {
        // 默认数据（如果本地存储中没有数据）
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
        
        // 从本地存储加载数据或使用默认数据
        this.loadData();
    }

    // 加载数据
    loadData() {
        // 尝试从本地存储加载
        const savedData = localStorage.getItem('research_portal_data');
        
        if (savedData) {
            try {
                this.data = JSON.parse(savedData);
                // 确保所有数据字段都存在
                this.ensureDataStructure();
            } catch (e) {
                console.error('加载数据失败，使用默认数据:', e);
                this.data = this.defaultData;
                this.saveData();
            }
        } else {
            this.data = this.defaultData;
            this.saveData();
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

    // 保存数据到本地存储
    saveData() {
        try {
            localStorage.setItem('research_portal_data', JSON.stringify(this.data));
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            return false;
        }
    }

    // 保存数据到GitHub（需要Token）
    async saveDataToGitHub(token, filename, data) {
        if (!token) {
            throw new Error('需要GitHub Token');
        }

        const owner = 'HTH554';
        const repo = 'graduate-research-portal';
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data/${filename}`;

        try {
            // 首先获取文件当前SHA（如果存在）
            let sha = null;
            try {
                const getResponse = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                }
            } catch (e) {
                // 文件不存在，将创建新文件
            }

            // 编码内容为base64
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
            
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `更新${filename}`,
                    content: content,
                    sha: sha
                })
            });

            if (!response.ok) {
                throw new Error(`GitHub API错误: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('保存到GitHub失败:', error);
            throw error;
        }
    }

    // 从GitHub加载数据
    async loadDataFromGitHub(token, filename) {
        if (!token) {
            throw new Error('需要GitHub Token');
        }

        const owner = 'HTH554';
        const repo = 'graduate-research-portal';
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data/${filename}`;

        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API错误: ${response.status}`);
            }

            const fileData = await response.json();
            const content = decodeURIComponent(escape(atob(fileData.content)));
            return JSON.parse(content);
        } catch (error) {
            console.error('从GitHub加载数据失败:', error);
            throw error;
        }
    }

    // 获取数据
    getData(type) {
        return this.data[type] || [];
    }

    // 更新数据
    updateData(type, id, newData) {
        const items = this.data[type];
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            this.data[type][index] = { ...this.data[type][index], ...newData };
            this.saveData();
            return true;
        }
        return false;
    }

    // 添加数据
    addData(type, newItem) {
        // 生成新ID
        const items = this.data[type];
        const maxId = items.length > 0 ? Math.max(...items.map(item => item.id)) : 0;
        newItem.id = maxId + 1;
        
        this.data[type].push(newItem);
        this.saveData();
        return newItem.id;
    }

    // 删除数据
    deleteData(type, id) {
        const items = this.data[type];
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            this.data[type].splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // 同步数据到GitHub
    async syncAllDataToGitHub(token) {
        if (!token) {
            throw new Error('需要GitHub Token');
        }

        const results = {};
        const files = [
            { name: 'advisors.json', data: this.data.advisors },
            { name: 'students.json', data: this.data.students },
            { name: 'projects.json', data: this.data.projects },
            { name: 'publications.json', data: this.data.publications },
            { name: 'updates.json', data: this.data.updates }
        ];

        for (const file of files) {
            try {
                const result = await this.saveDataToGitHub(token, file.name, file.data);
                results[file.name] = { success: true, result };
            } catch (error) {
                results[file.name] = { success: false, error: error.message };
            }
        }

        return results;
    }

    // 从GitHub同步所有数据
    async syncAllDataFromGitHub(token) {
        if (!token) {
            throw new Error('需要GitHub Token');
        }

        const files = ['advisors.json', 'students.json', 'projects.json', 'publications.json', 'updates.json'];
        
        for (const file of files) {
            try {
                const data = await this.loadDataFromGitHub(token, file);
                const type = file.replace('.json', '');
                this.data[type] = data;
            } catch (error) {
                console.warn(`无法加载${file}:`, error.message);
            }
        }
        
        this.saveData();
        return this.data;
    }

    // 导出数据
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    // 导入数据
    importData(jsonString) {
        try {
            const newData = JSON.parse(jsonString);
            this.data = newData;
            this.ensureDataStructure();
            this.saveData();
            return true;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    }
}

// 创建全局实例
window.dataManager = new DataManager();
