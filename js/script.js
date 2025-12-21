// ============================
// 数据模型与配置
// ============================

// GitHub 数据文件名
const GITHUB_FILES = {
    PROJECTS: 'research-projects.json',
    ADVISORS: 'research-advisors.json',
    STUDENTS: 'research-students.json',
    PUBLICATIONS: 'research-publications.json',
    UPDATES: 'research-updates.json'
};

// 本地存储键名（仅用于主题和过滤状态等用户偏好设置）
const LOCAL_STORAGE_KEYS = {
    THEME: 'lab_theme_preference',
    PROJECT_FILTER: 'project_filter_state',
    PUBLIC_DATA_CACHE: 'public_data_cache',
    PUBLIC_DATA_CACHE_TIME: 'public_data_cache_timestamp'
};

// 初始化数据
let projectsData = [];
let advisorsData = [];
let studentsData = [];
let publicationsData = [];
let updatesData = [];

// 权限控制
let isAuthenticated = false;
let isReadOnlyMode = true; // 默认只读模式

// 当前筛选状态
let currentFilter = 'all';

// 数据源信息
let dataSourceInfo = {
    type: 'default', // 'github', 'cache', 'default'
    timestamp: null,
    live: false
};

// ============================
// 配置常量
// ============================

const CONFIG = {
    STATUS_COLORS: {
        'preparation': '#f39c12',
        'in-progress': '#3498db',
        'completed': '#2ecc71',
        'pending': '#ff6b6b'
    },
    TYPE_COLORS: {
        '期刊论文': '#2ecc71',
        '会议论文': '#9b59b6',
        '专利': '#e74c3c',
        '专著': '#f39c12',
        '项目进展': '#2ecc71',
        '学术活动': '#9b59b6',
        '科研资助': '#e74c3c',
        '技术转化': '#f39c12',
        '学生荣誉': '#1abc9c',
        '产学研合作': '#34495e'
    }
};

// ============================
// DOM元素缓存
// ============================

const DOM = {
    projectsGrid: document.querySelector('.projects-grid'),
    advisorsGrid: document.querySelector('.advisors-grid'),
    studentsGrid: document.querySelector('.students-grid'),
    publicationsGrid: document.querySelector('.publications-grid'),
    updatesGrid: document.querySelector('.updates-grid'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    hamburger: document.getElementById('hamburger'),
    navMenu: document.querySelector('.nav-menu'),
    backToTop: document.getElementById('backToTop'),
    navLinks: document.querySelectorAll('.nav-link'),
    permissionStatus: document.getElementById('permission-status'),
    statusMessage: document.getElementById('status-message'),
    enterAdminBtn: document.getElementById('enter-admin-btn'),
    logoutBtn: document.getElementById('logout-btn')
};

// ============================
// 权限控制模块
// ============================

/**
 * 检查认证状态
 */
async function checkAuthentication() {
    console.log('检查认证状态...');
    
    // 检查是否有有效Token
    const hasToken = window.githubIssuesManager && 
                     window.githubIssuesManager.hasValidToken();
    
    if (hasToken) {
        isAuthenticated = true;
        isReadOnlyMode = false;
        console.log('✅ 用户已认证，可以编辑和同步数据');
        showPermissionStatus('🔗 已连接GitHub | 数据实时同步', 'authenticated');
        
        // 从GitHub加载最新数据
        const success = await loadAllDataFromGitHub();
        if (!success) {
            // 如果GitHub加载失败，退回到默认数据
            loadDefaultData();
        }
        return true;
    } else {
        isAuthenticated = false;
        isReadOnlyMode = true;
        console.log('👤 游客模式，只能查看数据');
        showPermissionStatus('👤 游客模式，只能查看数据', 'guest');
        
        // 使用公共数据
        await loadPublicData();
        return false;
    }
}

/**
 * 加载公共数据（游客模式）
 */
function loadPublicData() {
    console.log('加载公共数据...');
    
    // 检查是否有缓存数据
    const cachedData = localStorage.getItem(LOCAL_STORAGE_KEYS.PUBLIC_DATA_CACHE);
    const cacheTimestamp = localStorage.getItem(LOCAL_STORAGE_KEYS.PUBLIC_DATA_CACHE_TIME);
    const now = Date.now();
    const cacheExpiry = 30 * 60 * 1000; // 30分钟缓存
    
    if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheExpiry) {
        // 使用缓存数据
        console.log('使用缓存的公共数据');
        try {
            const data = JSON.parse(cachedData);
            applyPublicData(data, 'cached');
            showToast('已显示缓存数据', 'info');
        } catch (error) {
            console.error('缓存数据解析失败:', error);
            // 缓存无效，从GitHub获取
            fetchPublicDataFromGitHub();
        }
    } else {
        // 从 GitHub 获取最新数据
        console.log('从 GitHub 获取最新数据');
        fetchPublicDataFromGitHub();
    }
}

/**
 * 从GitHub获取公共数据
 */
async function fetchPublicDataFromGitHub() {
    try {
        console.log('开始从GitHub加载数据...');
        
        // 您的GitHub仓库基础URL
        const baseUrl = 'https://raw.githubusercontent.com/hth554/graduate-research-portal/main/data/';
        
        // 所有需要加载的数据文件
        const dataFiles = {
            projects: GITHUB_FILES.PROJECTS,
            advisors: GITHUB_FILES.ADVISORS,
            students: GITHUB_FILES.STUDENTS,
            publications: GITHUB_FILES.PUBLICATIONS,
            updates: GITHUB_FILES.UPDATES
        };
        
        // 加载所有数据
        const allData = {};
        let loadedCount = 0;
        
        for (const [key, filename] of Object.entries(dataFiles)) {
            try {
                const url = baseUrl + filename;
                console.log(`正在加载: ${url}`);
                
                const response = await fetch(url);
                
                if (response.ok) {
                    allData[key] = await response.json();
                    loadedCount++;
                    console.log(`✅ 成功加载 ${filename} (${allData[key].length} 条记录)`);
                } else {
                    console.warn(`⚠️ 无法加载 ${filename}: ${response.status} ${response.statusText}`);
                    allData[key] = [];
                }
            } catch (error) {
                console.error(`❌ 加载 ${filename} 失败:`, error);
                allData[key] = [];
            }
        }
        
        console.log(`总计加载 ${loadedCount}/${Object.keys(dataFiles).length} 个文件`);
        
        if (loadedCount > 0) {
            // 缓存所有数据
            localStorage.setItem(LOCAL_STORAGE_KEYS.PUBLIC_DATA_CACHE, JSON.stringify(allData));
            localStorage.setItem(LOCAL_STORAGE_KEYS.PUBLIC_DATA_CACHE_TIME, Date.now().toString());
            
            // 应用数据到页面
            applyPublicData(allData, 'github');
            showToast(`成功加载 ${loadedCount} 个数据文件`, 'success');
            
            return allData;
        } else {
            throw new Error('所有数据文件加载失败');
        }
        
    } catch (error) {
        console.error('获取GitHub公共数据失败:', error);
        
        // 尝试使用缓存数据
        const cachedData = localStorage.getItem(LOCAL_STORAGE_KEYS.PUBLIC_DATA_CACHE);
        const cacheTimestamp = localStorage.getItem(LOCAL_STORAGE_KEYS.PUBLIC_DATA_CACHE_TIME);
        const now = Date.now();
        const cacheExpiry = 24 * 60 * 60 * 1000; // 24小时缓存
        
        if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheExpiry) {
            try {
                const data = JSON.parse(cachedData);
                console.log('使用缓存的GitHub数据');
                applyPublicData(data, 'cached');
                showToast('网络连接失败，已显示缓存数据', 'warning');
                return data;
            } catch (parseError) {
                console.error('缓存数据解析失败:', parseError);
            }
        }
        
        // 使用默认数据作为最后的后备
        console.log('使用默认示例数据');
        showToast('无法加载远程数据，已显示示例数据', 'error');
        
        const defaultData = {
            projects: getDefaultProjects(),
            advisors: getDefaultAdvisors(),
            students: getDefaultStudents(),
            publications: getDefaultPublications(),
            updates: getDefaultUpdates()
        };
        
        applyPublicData(defaultData, 'default');
        return defaultData;
    }
}

/**
 * 应用公共数据到页面
 */
function applyPublicData(allData, sourceType) {
    console.log('应用公共数据，来源:', sourceType);
    
    if (allData && allData.projects) {
        projectsData = allData.projects || getDefaultProjects();
        advisorsData = allData.advisors || getDefaultAdvisors();
        studentsData = allData.students || getDefaultStudents();
        publicationsData = allData.publications || getDefaultPublications();
        updatesData = allData.updates || getDefaultUpdates();
        
        // 更新数据源信息
        dataSourceInfo = {
            type: sourceType,
            timestamp: new Date(),
            live: sourceType === 'github'
        };
        
        // 保存到本地存储（作为缓存）
        saveToLocalStorage();
        
        // 渲染数据
        renderAllData();
        
        // 更新数据源提示
        updateDataSourceHint(sourceType);
        
        console.log('数据应用完成:', {
            课题: projectsData.length,
            导师: advisorsData.length,
            学生: studentsData.length,
            成果: publicationsData.length,
            近况: updatesData.length
        });
    }
}

/**
 * 显示权限状态
 */
function showPermissionStatus(message, type) {
    if (DOM.permissionStatus && DOM.statusMessage) {
        DOM.permissionStatus.style.display = 'block';
        DOM.statusMessage.textContent = message;
        
        // 设置样式
        DOM.permissionStatus.className = `permission-status status-${type}`;
        
        // 根据类型调整按钮显示
        if (type === 'guest') {
            if (DOM.enterAdminBtn) {
                DOM.enterAdminBtn.style.display = 'inline-block';
                DOM.enterAdminBtn.innerHTML = '<i class="fas fa-key"></i> 输入Token管理数据';
                DOM.enterAdminBtn.onclick = requestTokenForAdmin;
            }
            if (DOM.logoutBtn) {
                DOM.logoutBtn.style.display = 'none';
            }
        } else {
            if (DOM.enterAdminBtn) {
                DOM.enterAdminBtn.style.display = 'none';
            }
            if (DOM.logoutBtn) {
                DOM.logoutBtn.style.display = 'inline-block';
                DOM.logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> 退出登录';
                DOM.logoutBtn.onclick = clearAuthentication;
            }
        }
    }
}

/**
 * 请求Token进入管理员模式
 */
function requestTokenForAdmin() {
    const token = prompt(
        '请输入 GitHub Personal Access Token：\n\n' +
        '格式要求：以 "ghp_" 或 "github_pat_" 开头\n' +
        'Token 需要以下权限：repo, workflow\n\n' +
        '（Token 将安全保存在您的浏览器本地）',
        ''
    );
    
    if (token && token.trim()) {
        const trimmedToken = token.trim();
        
        // 验证 Token 格式
        if (!trimmedToken.startsWith('ghp_') && !trimmedToken.startsWith('github_pat_')) {
            alert('❌ Token 格式不正确！\n必须以 "ghp_" 或 "github_pat_" 开头。');
            return;
        }
        
        // 保存Token
        if (window.githubIssuesManager.setToken(trimmedToken)) {
            // 保存到 dataManager
            if (window.dataManager) {
                window.dataManager.setGitHubToken(trimmedToken);
            }
            
            // 保存到 localStorage
            localStorage.setItem('github_pat_token', trimmedToken);
            localStorage.setItem('github_admin_token', trimmedToken);
            
            alert('✅ Token 设置成功！正在加载最新数据...');
            
            // 重新检查认证状态
            checkAuthentication().then(() => {
                // 刷新页面数据
                renderAllData();
                showToast('已成功登录，现在可以编辑和同步数据', 'success');
            });
        }
    }
}

/**
 * 清除认证状态
 */
function clearAuthentication() {
    if (confirm('确定要退出登录吗？将切换回游客模式，本地未保存的更改可能会丢失。')) {
        // 清除Token
        if (window.githubIssuesManager) {
            window.githubIssuesManager.clearToken();
        }
        if (window.dataManager) {
            window.dataManager.githubToken = null;
        }
        
        // 清除本地存储的Token
        localStorage.removeItem('github_admin_token');
        localStorage.removeItem('github_pat_token');
        
        // 重置权限状态
        isAuthenticated = false;
        isReadOnlyMode = true;
        
        // 切换到公共数据
        loadPublicData();
        
        // 更新UI
        showPermissionStatus('👤 游客模式，只能查看数据', 'guest');
        
        // 退出管理员模式
        if (window.adminSystem && window.adminSystem.isAdmin) {
            window.adminSystem.toggleAdminMode();
        }
        
        showToast('已退出登录，切换为游客模式', 'info');
    }
}

// ============================
// 数据管理模块
// ============================

/**
 * 加载默认数据（游客模式）
 */
function loadDefaultData() {
    console.log('加载默认数据...');
    
    projectsData = getDefaultProjects();
    advisorsData = getDefaultAdvisors();
    studentsData = getDefaultStudents();
    publicationsData = getDefaultPublications();
    updatesData = getDefaultUpdates();
    
    dataSourceInfo = {
        type: 'default',
        timestamp: new Date(),
        live: false
    };
    
    // 保存到本地存储
    saveToLocalStorage();
    
    // 渲染数据
    renderAllData();
}

/**
 * 渲染所有数据（根据权限）
 */
function renderAllData() {
    const savedFilter = localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_FILTER) || 'all';
    
    // 设置活动按钮
    DOM.filterButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === savedFilter) {
            btn.classList.add('active');
        }
    });
    
    renderProjects(savedFilter);
    renderAdvisors();
    renderStudents();
    renderPublications();
    renderUpdates();
}

// ============================
// 工具函数
// ============================

/**
 * 生成唯一ID
 */
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 获取当前时间戳
 */
function getCurrentTimestamp() {
    return new Date().toISOString().split('T')[0];
}

/**
 * 检查并初始化 GitHub Token
 */
async function initializeGitHubToken() {
    console.log('初始化 GitHub Token...');
    
    // 检查 githubIssuesManager 是否已加载
    if (!window.githubIssuesManager) {
        console.error('❌ githubIssuesManager 未加载！');
        return false;
    }
    
    // 如果已有有效 Token，直接返回
    if (window.githubIssuesManager.hasValidToken()) {
        return true;
    }
    
    // 提示用户输入 Token
    console.log('⚠️ 需要用户输入 Token');
    const token = prompt(
        '请输入 GitHub Personal Access Token：\n\n' +
        '格式要求：以 "ghp_" 或 "github_pat_" 开头\n' +
        'Token 需要以下权限：repo, workflow\n\n' +
        '（Token 将安全保存在您的浏览器本地）',
        ''
    );
    
    if (token && token.trim()) {
        const trimmedToken = token.trim();
        
        // 验证 Token 格式
        if (!trimmedToken.startsWith('ghp_') && !trimmedToken.startsWith('github_pat_')) {
            alert('❌ Token 格式不正确！\n必须以 "ghp_" 或 "github_pat_" 开头。');
            return false;
        }
        
        // 保存Token
        const success = window.githubIssuesManager.setToken(trimmedToken);
        
        if (success) {
            // 保存到 dataManager
            if (window.dataManager) {
                window.dataManager.setGitHubToken(trimmedToken);
            }
            
            // 保存到 localStorage
            localStorage.setItem('github_pat_token', trimmedToken);
            localStorage.setItem('github_admin_token', trimmedToken);
            
            alert('✅ GitHub Token 设置成功！');
            
            // 更新权限状态
            isAuthenticated = true;
            isReadOnlyMode = false;
            showPermissionStatus('🔗 已连接GitHub | 数据实时同步', 'authenticated');
            
            return true;
        }
    }
    
    return false;
}

/**
 * 从 GitHub 加载所有数据
 */
async function loadAllDataFromGitHub() {
    console.log('开始从 GitHub 加载数据...');
    
    try {
        // 检查管理器是否可用
        if (!window.githubIssuesManager) {
            console.error('❌ githubIssuesManager 不可用');
            return false;
        }
        
        // 检查 Token
        const hasToken = window.githubIssuesManager.hasValidToken();
        if (!hasToken) {
            console.log('⚠️ 没有有效 Token，无法从GitHub加载数据');
            return false;
        }
        
        // 并行加载所有数据
        console.log('📥 从 GitHub 加载数据文件...');
        const [projects, advisors, students, publications, updates] = await Promise.allSettled([
            window.githubIssuesManager.readJsonFile(GITHUB_FILES.PROJECTS).catch(err => {
                console.warn(`读取 ${GITHUB_FILES.PROJECTS} 失败:`, err.message);
                return null;
            }),
            window.githubIssuesManager.readJsonFile(GITHUB_FILES.ADVISORS).catch(err => {
                console.warn(`读取 ${GITHUB_FILES.ADVISORS} 失败:`, err.message);
                return null;
            }),
            window.githubIssuesManager.readJsonFile(GITHUB_FILES.STUDENTS).catch(err => {
                console.warn(`读取 ${GITHUB_FILES.STUDENTS} 失败:`, err.message);
                return null;
            }),
            window.githubIssuesManager.readJsonFile(GITHUB_FILES.PUBLICATIONS).catch(err => {
                console.warn(`读取 ${GITHUB_FILES.PUBLICATIONS} 失败:`, err.message);
                return null;
            }),
            window.githubIssuesManager.readJsonFile(GITHUB_FILES.UPDATES).catch(err => {
                console.warn(`读取 ${GITHUB_FILES.UPDATES} 失败:`, err.message);
                return null;
            })
        ]);
        
        // 检查是否有数据
        let hasData = false;
        
        // 设置数据，如果文件不存在则使用默认数据
        projectsData = projects.status === 'fulfilled' && projects.value ? projects.value : getDefaultProjects();
        advisorsData = advisors.status === 'fulfilled' && advisors.value ? advisors.value : getDefaultAdvisors();
        studentsData = students.status === 'fulfilled' && students.value ? students.value : getDefaultStudents();
        publicationsData = publications.status === 'fulfilled' && publications.value ? publications.value : getDefaultPublications();
        updatesData = updates.status === 'fulfilled' && updates.value ? updates.value : getDefaultUpdates();
        
        // 检查是否从GitHub成功加载了任何数据
        if (projects.value || advisors.value || students.value || publications.value || updates.value) {
            hasData = true;
        }
        
        // 保存到本地存储
        saveToLocalStorage();
        
        console.log('✅ 数据加载完成：', {
            课题: projectsData.length,
            导师: advisorsData.length,
            学生: studentsData.length,
            成果: publicationsData.length,
            近况: updatesData.length,
            数据源: hasData ? 'GitHub' : '默认数据'
        });
        
        return hasData;
    } catch (error) {
        console.error('❌ 从 GitHub 加载数据失败:', error);
        showToast(`数据加载失败: ${error.message}`, 'error');
        return false;
    }
}

/**
 * 保存到本地存储
 */
function saveToLocalStorage() {
    const data = {
        projects: projectsData,
        advisors: advisorsData,
        students: studentsData,
        publications: publicationsData,
        updates: updatesData
    };
    localStorage.setItem('research_portal_data', JSON.stringify(data));
}

/**
 * 保存所有数据到 GitHub
 */
async function saveAllDataToGitHub() {
    // 检查权限
    if (isReadOnlyMode) {
        showToast('游客模式不能保存数据到GitHub', 'warning');
        return false;
    }
    
    try {
        // 检查 Token
        if (!window.githubIssuesManager.hasValidToken()) {
            showToast('需要GitHub Token才能保存数据', 'warning');
            const success = await initializeGitHubToken();
            if (!success) return false;
        }

        // 并行保存所有数据
        await Promise.all([
            window.githubIssuesManager.writeJsonFile(GITHUB_FILES.PROJECTS, projectsData),
            window.githubIssuesManager.writeJsonFile(GITHUB_FILES.ADVISORS, advisorsData),
            window.githubIssuesManager.writeJsonFile(GITHUB_FILES.STUDENTS, studentsData),
            window.githubIssuesManager.writeJsonFile(GITHUB_FILES.PUBLICATIONS, publicationsData),
            window.githubIssuesManager.writeJsonFile(GITHUB_FILES.UPDATES, updatesData)
        ]);

        console.log('所有数据已保存到 GitHub');
        showToast('数据已同步到 GitHub', 'success');
        return true;
    } catch (error) {
        console.error('保存到 GitHub 失败:', error);
        showToast(`数据保存失败: ${error.message}`, 'error');
        return false;
    }
}

/**
 * 保存单个数据到 GitHub
 */
async function saveDataToGitHub(filename, data) {
    // 检查权限
    if (isReadOnlyMode) {
        console.warn(`游客模式不能保存 ${filename}`);
        return false;
    }
    
    try {
        if (!window.githubIssuesManager.hasValidToken()) {
            console.warn(`保存 ${filename} 需要Token`);
            return false;
        }

        await window.githubIssuesManager.writeJsonFile(filename, data);
        console.log(`${filename} 保存成功`);
        return true;
    } catch (error) {
        console.error(`保存 ${filename} 到 GitHub 失败:`, error);
        return false;
    }
}

/**
 * 获取默认项目数据
 */
function getDefaultProjects() {
    return [
        {
            id: 1,
            title: "基于深度学习的医学图像分割算法研究",
            category: "medical",
            description: "本研究旨在开发一种高效的深度学习算法，用于医学图像中的器官与病变区域自动分割，提高诊断准确性与效率。",
            advisor: "张明教授",
            status: "进行中",
            statusType: "in-progress",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            createdAt: "2023-01-15",
            updatedAt: "2023-10-20"
        },
        {
            id: 2,
            title: "可再生能源智能微电网优化控制策略",
            category: "engineering",
            description: "研究微电网中太阳能、风能等可再生能源的集成优化控制策略，提高能源利用效率与系统稳定性。",
            advisor: "李华教授",
            status: "进行中",
            statusType: "in-progress",
            image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            createdAt: "2023-02-10",
            updatedAt: "2023-09-18"
        },
        {
            id: 3,
            title: "新型纳米材料在环境污染物去除中的应用",
            category: "science",
            description: "探索新型纳米材料在废水处理与空气净化中的应用潜力，开发高效、低成本的环境修复技术。",
            advisor: "王静教授",
            status: "已完成",
            statusType: "completed",
            image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            createdAt: "2022-11-05",
            updatedAt: "2023-08-30"
        },
        {
            id: 4,
            title: "人工智能辅助的金融风险预测模型",
            category: "science",
            description: "构建基于机器学习与深度学习的金融风险预测模型，提高金融机构的风险识别与防范能力。",
            advisor: "赵伟教授",
            status: "进行中",
            statusType: "in-progress",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            createdAt: "2023-03-20",
            updatedAt: "2023-10-15"
        },
        {
            id: 5,
            title: "数字化转型对企业组织文化的影响研究",
            category: "humanities",
            description: "探究数字化转型过程中企业组织文化的变迁机制，为企业数字化转型提供管理策略建议。",
            advisor: "刘芳教授",
            status: "进行中",
            statusType: "in-progress",
            image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            createdAt: "2023-04-12",
            updatedAt: "2023-10-10"
        },
        {
            id: 6,
            title: "新型肿瘤靶向药物递送系统研究",
            category: "medical",
            description: "开发基于纳米技术的肿瘤靶向药物递送系统，提高抗癌药物在肿瘤部位的富集与疗效。",
            advisor: "陈晨教授",
            status: "筹备中",
            statusType: "preparation",
            image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            createdAt: "2023-09-01",
            updatedAt: "2023-09-01"
        }
    ];
}

/**
 * 获取默认导师数据
 */
function getDefaultAdvisors() {
    return [
        {
            id: 1,
            name: "刘曙光",
            title: "教授，博士生导师",
            field: "碳循环、水循环、生态系统功能和服务",
            bio: "国家海外引进高级人才、中组部 '千人计划' 入选者，与中科院合作证实成熟森林土壤可累积碳，推翻经典理论，成果发表于《SCIENCE》并入选 '中国科学10大进展'；研发 GEMS 生物地球化学循环模型、SkyCenterESM 生态系统服务核算模型，主导完成美国全域生态系统固碳与减排潜力评估。",
            avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            email: "liusg@example.com",
            website: "https://example.com/liusg",
            createdAt: "2022-01-10",
            updatedAt: "2023-10-20"
        },
        {
            id: 2,
            name: "赵淑清",
            title: "教授，博士生导师",
            field: "城市生态学",
            bio: "创新性建立了城市化对植被生长影响的理论与定量方法，在 PNAS 发文证实城市环境对植被生长的普遍促进作用，该成果被学界广泛验证应用；提出解释城市化生物多样性梯度的 '热促进和胁迫平衡假说'，构建了我国城市生态系统有机碳储量评估体系，还搭建了北京城乡生态梯度长期研究平台（BES）。",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            email: "zhaosq@example.com",
            website: "https://example.com/zhaosq",
            createdAt: "2022-02-15",
            updatedAt: "2023-09-15"
        },
        {
            id: 3,
            name: "王静",
            title: "教授，博士生导师",
            field: "环境工程，纳米材料",
            bio: "浙江大学环境学院教授，长江学者特聘教授，致力于环境功能材料与污染控制技术研究，在国际知名期刊发表论文150余篇，获国家科技进步二等奖2项。",
            avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            email: "wangjing@example.com",
            website: "https://example.com/wangjing",
            createdAt: "2021-11-20",
            updatedAt: "2023-08-25"
        },
        {
            id: 4,
            name: "赵伟",
            title: "教授，博士生导师",
            field: "金融工程，人工智能",
            bio: "上海交通大学安泰经济与管理学院教授，研究方向为金融科技、风险管理与人工智能，主持国家自然科学基金重点项目3项，出版专著5部。",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            email: "zhaowei@example.com",
            website: "https://example.com/zhaowei",
            createdAt: "2022-03-05",
            updatedAt: "2023-10-05"
        }
    ];
}

/**
 * 获取默认学生数据
 */
function getDefaultStudents() {
    return [
        {
            id: 1,
            name: "李明",
            degree: "博士研究生",
            field: "计算机科学与技术",
            supervisor: "张明教授",
            research: "研究方向为医学图像处理与深度学习，主要研究基于注意力机制的医学图像分割算法。",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            email: "liming@example.com",
            github: "https://github.com/liming",
            createdAt: "2022-09-01",
            updatedAt: "2023-10-15"
        },
        {
            id: 2,
            name: "王芳",
            degree: "硕士研究生",
            field: "电气工程",
            supervisor: "李华教授",
            research: "研究方向为智能电网优化控制，主要研究可再生能源微电网的调度策略与稳定性分析。",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            email: "wangfang@example.com",
            github: "https://github.com/wangfang",
            createdAt: "2023-03-10",
            updatedAt: "2023-09-20"
        },
        {
            id: 3,
            name: "张伟",
            degree: "博士研究生",
            field: "环境工程",
            supervisor: "王静教授",
            research: "研究方向为环境功能材料，主要研究新型纳米材料在水污染治理中的应用与机理。",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            email: "zhangwei@example.com",
            github: "https://github.com/zhangwei",
            createdAt: "2021-11-15",
            updatedAt: "2023-08-30"
        },
        {
            id: 4,
            name: "刘洋",
            degree: "硕士研究生",
            field: "金融工程",
            supervisor: "赵伟教授",
            research: "研究方向为金融科技与风险管理，主要研究基于深度学习的金融市场预测模型。",
            avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
            email: "liuyang@example.com",
            github: "https://github.com/liuyang",
            createdAt: "2023-02-20",
            updatedAt: "2023-10-10"
        }
    ];
}

/**
 * 获取默认出版物数据
 */
function getDefaultPublications() {
    return [
        {
            id: 1,
            type: "期刊论文",
            title: "基于注意力机制的医学图像分割算法研究",
            authors: "张明, 李雷, 韩梅梅",
            venue: "《中国医学影像学杂志》, 2023, 31(5): 12-18",
            abstract: "本文提出了一种基于注意力机制的深度学习模型，用于医学图像中的器官分割，通过自注意力机制有效捕捉图像中的长距离依赖关系，在多个公开数据集上取得了最优性能。",
            doi: "10.1234/j.issn.1000-1234.2023.05.002",
            link: "https://example.com/paper1",
            createdAt: "2023-05-15",
            updatedAt: "2023-10-20"
        },
        {
            id: 2,
            type: "会议论文",
            title: "可再生能源微电网的优化调度策略",
            authors: "李华, 王强, 张伟",
            venue: "IEEE电力与能源系统国际会议, 2023",
            abstract: "本文提出了一种基于强化学习的微电网优化调度策略，有效提高了可再生能源的消纳能力，降低了系统运行成本，并通过仿真验证了其有效性。",
            doi: "10.1109/ICPES.2023.1234567",
            link: "https://example.com/paper2",
            createdAt: "2023-08-10",
            updatedAt: "2023-10-15"
        },
        {
            id: 3,
            type: "专利",
            title: "一种高效去除重金属离子的纳米复合材料制备方法",
            authors: "王静, 刘洋, 陈晨",
            venue: "中国发明专利, ZL202310123456.7, 2023",
            abstract: "本发明公开了一种高效去除水中重金属离子的纳米复合材料及其制备方法，该材料具有高吸附容量和良好的再生性能，适用于工业废水处理。",
            link: "https://example.com/patent1",
            createdAt: "2023-06-20",
            updatedAt: "2023-09-25"
        },
        {
            id: 4,
            type: "期刊论文",
            title: "数字化转型背景下组织文化变革路径研究",
            authors: "刘芳, 赵明, 孙丽",
            venue: "《管理科学学报》, 2023, 26(3): 45-56",
            abstract: "本研究基于组织变革理论，探讨了数字化转型过程中企业组织文化的变革路径与影响因素，提出了适应数字时代的企业文化构建框架。",
            doi: "10.1234/j.cnki.1671-9301.2023.03.005",
            link: "https://example.com/paper3",
            createdAt: "2023-03-30",
            updatedAt: "2023-10-05"
        }
    ];
}

/**
 * 获取默认更新数据
 */
function getDefaultUpdates() {
    return [
        {
            id: 1,
            date: "2023-10-15",
            title: "医学图像分割项目取得重要进展",
            type: "项目进展",
            content: "课题组在医学图像分割算法研究中取得重要突破，新提出的注意力机制模型在公开数据集上的分割准确率达到了95.2%，较现有方法提升了3.1%。",
            project: "基于深度学习的医学图像分割算法研究",
            projectId: 1,
            createdAt: "2023-10-15",
            updatedAt: "2023-10-15"
        },
        {
            id: 2,
            date: "2023-10-08",
            title: "课题组参加国际学术会议",
            type: "学术活动",
            content: "课题组三名研究生参加了在杭州举办的国际人工智能大会，展示了最新的研究成果，并与国内外同行进行了深入交流。",
            project: "人工智能辅助的金融风险预测模型",
            projectId: 4,
            createdAt: "2023-10-08",
            updatedAt: "2023-10-08"
        },
        {
            id: 3,
            date: "2023-09-25",
            title: "纳米材料研究获得国家自然科学基金资助",
            type: "科研资助",
            content: "课题组申报的'新型纳米材料在环境污染物去除中的机理与应用研究'项目获得国家自然科学基金面上项目资助，资助金额80万元。",
            project: "新型纳米材料在环境污染物去除中的应用",
            projectId: 3,
            createdAt: "2023-09-25",
            updatedAt: "2023-09-25"
        },
        {
            id: 4,
            date: "2023-09-18",
            title: "微电网控制策略实现现场应用",
            type: "技术转化",
            content: "课题组研发的可再生能源微电网优化控制策略在某工业园区实现现场应用，系统运行稳定性显著提升，能源利用率提高了18%。",
            project: "可再生能源智能微电网优化控制策略",
            projectId: 2,
            createdAt: "2023-09-18",
            updatedAt: "2023-09-18"
        },
        {
            id: 5,
            title: "博士生李明获得优秀研究生称号",
            date: "2023-09-10",
            type: "学生荣誉",
            content: "课题组博士生李明因在医学图像分割领域的突出研究成果，获得学校'优秀研究生'荣誉称号。",
            project: "基于深度学习的医学图像分割算法研究",
            projectId: 1,
            createdAt: "2023-09-10",
            updatedAt: "2023-09-10"
        },
        {
            id: 6,
            title: "课题组与企业签订合作研究协议",
            date: "2023-09-05",
            type: "产学研合作",
            content: "课题组与某知名金融科技公司签订合作研究协议，共同开展金融风险智能预警系统的研发与应用。",
            project: "人工智能辅助的金融风险预测模型",
            projectId: 4,
            createdAt: "2023-09-05",
            updatedAt: "2023-09-05"
        }
    ];
}

/**
 * 格式化日期显示
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * 获取分类名称
 */
function getCategoryName(category) {
    const categoryMap = {
        'engineering': '工程科学',
        'science': '自然科学',
        'humanities': '人文社科',
        'medical': '医学健康'
    };
    return categoryMap[category] || category;
}

/**
 * 显示Toast消息
 */
function showToast(message, type = 'success') {
    // 移除现有的toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    document.body.appendChild(toast);
    
    // 显示toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // 自动消失
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
    
    // 手动关闭
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
}

/**
 * 获取Toast图标
 */
function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * 获取状态文本
 */
function getStatusText(statusType) {
    const statusMap = {
        'preparation': '筹备中',
        'in-progress': '进行中',
        'completed': '已完成'
    };
    return statusMap[statusType] || '筹备中';
}

/**
 * 获取数据源提示文本
 */
function getDataSourceHint() {
    if (!dataSourceInfo.timestamp) return '';
    
    const time = formatDate(dataSourceInfo.timestamp);
    let hint = '';
    
    switch (dataSourceInfo.type) {
        case 'github':
            hint = `<div class="data-source-hint live">🔄 实时数据 | 更新于: ${time}</div>`;
            break;
        case 'cache':
            hint = `<div class="data-source-hint cached">💾 缓存数据 | 更新于: ${time}</div>`;
            break;
        case 'default':
            hint = `<div class="data-source-hint default">📋 示例数据 | 更新于: ${time}</div>`;
            break;
        default:
            hint = `<div class="data-source-hint">📊 数据 | 更新于: ${time}</div>`;
    }
    
    return hint;
}

/**
 * 更新数据源提示
 */
function updateDataSourceHint(sourceType) {
    const hintElement = document.getElementById('dataSourceHint');
    if (!hintElement) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    if (sourceType === 'github') {
        hintElement.textContent = `🟢 实时数据 (更新于 ${timeString})`;
        hintElement.className = 'data-source-hint live';
    } else if (sourceType === 'cached') {
        hintElement.textContent = `⚪ 缓存数据 (更新于 ${timeString})`;
        hintElement.className = 'data-source-hint cached';
    } else {
        hintElement.textContent = `📋 示例数据 (更新于 ${timeString})`;
        hintElement.className = 'data-source-hint default';
    }
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================
// CRUD 操作函数（带权限检查）
// ============================

/**
 * 添加新项目
 */
async function addProject(projectData) {
    if (isReadOnlyMode) {
        showToast('游客模式不能添加数据，请先输入Token', 'warning');
        return null;
    }
    
    const newProject = {
        ...projectData,
        id: generateId(),
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
    };
    
    projectsData.unshift(newProject); // 添加到数组开头
    saveToLocalStorage();
    
    // 保存到GitHub
    if (await initializeGitHubToken()) {
        await saveDataToGitHub(GITHUB_FILES.PROJECTS, projectsData);
    }
    
    renderProjects(currentFilter);
    showToast('课题添加成功！', 'success');
    return newProject;
}

/**
 * 更新项目
 */
async function updateProject(projectId, updatedData) {
    if (isReadOnlyMode) {
        showToast('游客模式不能更新数据，请先输入Token', 'warning');
        return null;
    }
    
    const index = projectsData.findIndex(p => p.id == projectId);
    if (index !== -1) {
        projectsData[index] = {
            ...projectsData[index],
            ...updatedData,
            updatedAt: getCurrentTimestamp()
        };
        saveToLocalStorage();
        if (await initializeGitHubToken()) {
            await saveDataToGitHub(GITHUB_FILES.PROJECTS, projectsData);
        }
        renderProjects(currentFilter);
        showToast('课题更新成功！', 'success');
        return projectsData[index];
    }
    return null;
}

/**
 * 删除项目
 */
async function deleteProject(projectId) {
    if (isReadOnlyMode) {
        showToast('游客模式不能删除数据，请先输入Token', 'warning');
        return false;
    }
    
    const index = projectsData.findIndex(p => p.id == projectId);
    if (index !== -1) {
        projectsData.splice(index, 1);
        saveToLocalStorage();
        if (await initializeGitHubToken()) {
            await saveDataToGitHub(GITHUB_FILES.PROJECTS, projectsData);
        }
        renderProjects(currentFilter);
        showToast('课题已删除', 'success');
        return true;
    }
    return false;
}

/**
 * 添加新导师
 */
async function addAdvisor(advisorData) {
    if (isReadOnlyMode) {
        showToast('游客模式不能添加数据，请先输入Token', 'warning');
        return null;
    }
    
    const newAdvisor = {
        ...advisorData,
        id: generateId(),
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
    };
    
    advisorsData.unshift(newAdvisor);
    saveToLocalStorage();
    if (await initializeGitHubToken()) {
        await saveDataToGitHub(GITHUB_FILES.ADVISORS, advisorsData);
    }
    renderAdvisors();
    showToast('导师添加成功！', 'success');
    return newAdvisor;
}

/**
 * 更新导师信息
 */
async function updateAdvisor(advisorId, updatedData) {
    if (isReadOnlyMode) {
        showToast('游客模式不能更新数据，请先输入Token', 'warning');
        return null;
    }
    
    const index = advisorsData.findIndex(a => a.id == advisorId);
    if (index !== -1) {
        advisorsData[index] = {
            ...advisorsData[index],
            ...updatedData,
            updatedAt: getCurrentTimestamp()
        };
        saveToLocalStorage();
        if (await initializeGitHubToken()) {
            await saveDataToGitHub(GITHUB_FILES.ADVISORS, advisorsData);
        }
        renderAdvisors();
        showToast('导师信息更新成功！', 'success');
        return advisorsData[index];
    }
    return null;
}

/**
 * 删除导师
 */
async function deleteAdvisor(advisorId) {
    if (isReadOnlyMode) {
        showToast('游客模式不能删除数据，请先输入Token', 'warning');
        return false;
    }
    
    const index = advisorsData.findIndex(a => a.id == advisorId);
    if (index !== -1) {
        advisorsData.splice(index, 1);
        saveToLocalStorage();
        if (await initializeGitHubToken()) {
            await saveDataToGitHub(GITHUB_FILES.ADVISORS, advisorsData);
        }
        renderAdvisors();
        showToast('导师已删除', 'success');
        return true;
    }
    return false;
}

/**
 * 添加新学生
 */
async function addStudent(studentData) {
    if (isReadOnlyMode) {
        showToast('游客模式不能添加数据，请先输入Token', 'warning');
        return null;
    }
    
    const newStudent = {
        ...studentData,
        id: generateId(),
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
    };
    
    studentsData.unshift(newStudent);
    saveToLocalStorage();
    if (await initializeGitHubToken()) {
        await saveDataToGitHub(GITHUB_FILES.STUDENTS, studentsData);
    }
    renderStudents();
    showToast('学生添加成功！', 'success');
    return newStudent;
}

/**
 * 更新学生信息
 */
async function updateStudent(studentId, updatedData) {
    if (isReadOnlyMode) {
        showToast('游客模式不能更新数据，请先输入Token', 'warning');
        return null;
    }
    
    const index = studentsData.findIndex(s => s.id == studentId);
    if (index !== -1) {
        studentsData[index] = {
            ...studentsData[index],
            ...updatedData,
            updatedAt: getCurrentTimestamp()
        };
        saveToLocalStorage();
        if (await initializeGitHubToken()) {
            await saveDataToGitHub(GITHUB_FILES.STUDENTS, studentsData);
        }
        renderStudents();
        showToast('学生信息更新成功！', 'success');
        return studentsData[index];
    }
    return null;
}

/**
 * 删除学生
 */
async function deleteStudent(studentId) {
    if (isReadOnlyMode) {
        showToast('游客模式不能删除数据，请先输入Token', 'warning');
        return false;
    }
    
    const index = studentsData.findIndex(s => s.id == studentId);
    if (index !== -1) {
        studentsData.splice(index, 1);
        saveToLocalStorage();
        if (await initializeGitHubToken()) {
            await saveDataToGitHub(GITHUB_FILES.STUDENTS, studentsData);
        }
        renderStudents();
        showToast('学生已删除', 'success');
        return true;
    }
    return false;
}

/**
 * 添加新学术成果
 */
async function addPublication(publicationData) {
    if (isReadOnlyMode) {
        showToast('游客模式不能添加数据，请先输入Token', 'warning');
        return null;
    }
    
    const newPublication = {
        ...publicationData,
        id: generateId(),
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
    };
    
    publicationsData.unshift(newPublication);
    saveToLocalStorage();
    if (await initializeGitHubToken()) {
        await saveDataToGitHub(GITHUB_FILES.PUBLICATIONS, publicationsData);
    }
    renderPublications();
    showToast('学术成果添加成功！', 'success');
    return newPublication;
}

/**
 * 更新学术成果
 */
async function updatePublication(publicationId, updatedData) {
    if (isReadOnlyMode) {
        showToast('游客模式不能更新数据，请先输入Token', 'warning');
        return null;
    }
    
    const index = publicationsData.findIndex(p => p.id == publicationId);
    if (index !== -1) {
        publicationsData[index] = {
            ...publicationsData[index],
            ...updatedData,
            updatedAt: getCurrentTimestamp()
        };
        saveToLocalStorage();
        if (await initializeGitHubToken()) {
            await saveDataToGitHub(GITHUB_FILES.PUBLICATIONS, publicationsData);
        }
        renderPublications();
        showToast('学术成果更新成功！', 'success');
        return publicationsData[index];
    }
    return null;
}

/**
 * 删除学术成果
 */
async function deletePublication(publicationId) {
    if (isReadOnlyMode) {
        showToast('游客模式不能删除数据，请先输入Token', 'warning');
        return false;
    }
    
    const index = publicationsData.findIndex(p => p.id == publicationId);
    if (index !== -1) {
        publicationsData.splice(index, 1);
        saveToLocalStorage();
        if (await initializeGitHubToken()) {
            await saveDataToGitHub(GITHUB_FILES.PUBLICATIONS, publicationsData);
        }
        renderPublications();
        showToast('学术成果已删除', 'success');
        return true;
    }
    return false;
}

/**
 * 添加新研究近况
 */
async function addUpdate(updateData) {
    if (isReadOnlyMode) {
        showToast('游客模式不能添加数据，请先输入Token', 'warning');
        return null;
    }
    
    const newUpdate = {
        ...updateData,
        id: generateId(),
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
    };
    
    updatesData.unshift(newUpdate);
    saveToLocalStorage();
    if (await initializeGitHubToken()) {
        await saveDataToGitHub(GITHUB_FILES.UPDATES, updatesData);
    }
    renderUpdates();
    showToast('研究近况添加成功！', 'success');
    return newUpdate;
}

/**
 * 更新研究近况
 */
async function updateUpdate(updateId, updatedData) {
    if (isReadOnlyMode) {
        showToast('游客模式不能更新数据，请先输入Token', 'warning');
        return null;
    }
    
    const index = updatesData.findIndex(u => u.id == updateId);
    if (index !== -1) {
        updatesData[index] = {
            ...updatesData[index],
            ...updatedData,
            updatedAt: getCurrentTimestamp()
        };
        saveToLocalStorage();
        if (await initializeGitHubToken()) {
            await saveDataToGitHub(GITHUB_FILES.UPDATES, updatesData);
        }
        renderUpdates();
        showToast('研究近况更新成功！', 'success');
        return updatesData[index];
    }
    return null;
}

/**
 * 删除研究近况
 */
async function deleteUpdate(updateId) {
    if (isReadOnlyMode) {
        showToast('游客模式不能删除数据，请先输入Token', 'warning');
        return false;
    }
    
    const index = updatesData.findIndex(u => u.id == updateId);
    if (index !== -1) {
        updatesData.splice(index, 1);
        saveToLocalStorage();
        if (await initializeGitHubToken()) {
            await saveDataToGitHub(GITHUB_FILES.UPDATES, updatesData);
        }
        renderUpdates();
        showToast('研究近况已删除', 'success');
        return true;
    }
    return false;
}

// ============================
// 渲染函数（带权限控制）
// ============================

/**
 * 渲染课题卡片（根据权限显示编辑按钮）
 */
function renderProjects(filter = 'all') {
    if (!DOM.projectsGrid) return;
    
    DOM.projectsGrid.innerHTML = '';
    currentFilter = filter;
    
    let filteredProjects = projectsData;
    if (filter !== 'all') {
        filteredProjects = projectsData.filter(project => project.category === filter);
    }
    
    if (filteredProjects.length === 0) {
        DOM.projectsGrid.innerHTML = `
            <div class="empty-state">
                <p>暂无相关课题</p>
                <p>请尝试其他筛选条件</p>
            </div>
        `;
        return;
    }
    
    filteredProjects.forEach(project => {
        const statusColor = CONFIG.STATUS_COLORS[project.statusType] || '#1abc9c';
        
        // 根据权限决定是否显示编辑按钮
        const showEditButton = !isReadOnlyMode && 
                              window.adminSystem && 
                              window.adminSystem.editMode;
        
        // 获取数据源提示
        const dataSourceHint = getDataSourceHint();
        
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.setAttribute('data-category', project.category);
        projectCard.setAttribute('data-id', project.id);
        
        projectCard.innerHTML = `
            <div class="project-image">
                <img src="${project.image}" alt="${project.title}" loading="lazy">
                <div class="project-status-tag" style="background-color: ${statusColor}20; color: ${statusColor}">
                    ${project.status}
                </div>
                ${dataSourceInfo.type === 'default' ? '<div class="readonly-badge">示例数据</div>' : ''}
            </div>
            <div class="project-content">
                <span class="project-category">${getCategoryName(project.category)}</span>
                <h3 class="project-title">${project.title}</h3>
                <p class="project-description">${project.description}</p>
                <div class="project-meta">
                    <div class="project-advisor">
                        <i class="fas fa-user-graduate"></i>
                        <span>${project.advisor}</span>
                    </div>
                    <div class="project-status">
                        <i class="fas fa-circle" style="color: ${statusColor}"></i>
                        <span>${project.status}</span>
                    </div>
                </div>
                <div class="project-actions">
                    <button class="btn btn-outline project-details-btn" data-id="${project.id}">
                        查看详情
                    </button>
                    ${showEditButton ? `
                        <button class="btn btn-outline project-edit-btn" data-id="${project.id}" title="编辑课题">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : isReadOnlyMode ? `
                        <button class="btn btn-outline project-edit-btn disabled" title="需要登录才能编辑">
                            <i class="fas fa-edit"></i> 编辑 (需要登录)
                        </button>
                    ` : ''}
                </div>
                <div class="project-meta-footer">
                    <small class="text-muted">
                        更新于: ${formatDate(project.updatedAt)}
                    </small>
                </div>
                <!-- 数据来源提示 -->
                ${dataSourceHint}
            </div>
        `;
        
        DOM.projectsGrid.appendChild(projectCard);
    });
    
    // 添加详情按钮事件监听
    document.querySelectorAll('.project-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const projectId = this.getAttribute('data-id');
            showProjectDetails(projectId);
        });
    });
    
    // 只在认证模式下添加编辑按钮事件
    if (!isReadOnlyMode && window.adminSystem && window.adminSystem.editMode) {
        document.querySelectorAll('.project-edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const projectId = this.getAttribute('data-id');
                showEditProjectForm(projectId);
            });
        });
    }
}

/**
 * 渲染导师卡片（根据权限显示编辑按钮）
 */
function renderAdvisors() {
    if (!DOM.advisorsGrid) return;
    
    DOM.advisorsGrid.innerHTML = '';
    
    advisorsData.forEach(advisor => {
        // 根据权限决定是否显示编辑按钮
        const showEditButton = !isReadOnlyMode && 
                              window.adminSystem && 
                              window.adminSystem.editMode;
        
        const advisorCard = document.createElement('div');
        advisorCard.className = 'advisor-card';
        advisorCard.setAttribute('data-id', advisor.id);
        
        advisorCard.innerHTML = `
            <div class="advisor-avatar">
                <img src="${advisor.avatar}" alt="${advisor.name}" loading="lazy">
                ${dataSourceInfo.type === 'default' ? '<div class="readonly-badge">示例数据</div>' : ''}
            </div>
            <h3 class="advisor-name">${advisor.name}</h3>
            <p class="advisor-title">${advisor.title}</p>
            <p class="advisor-field">${advisor.field}</p>
            <p class="advisor-bio">${advisor.bio}</p>
            <div class="advisor-contact">
                <a href="mailto:${advisor.email}" title="发送邮件">
                    <i class="fas fa-envelope"></i>
                </a>
                <a href="${advisor.website}" target="_blank" title="个人主页">
                    <i class="fas fa-globe"></i>
                </a>
                <a href="#" title="学术主页">
                    <i class="fab fa-google-scholar"></i>
                </a>
                ${showEditButton ? `
                    <button class="advisor-edit-btn" data-id="${advisor.id}" title="编辑导师信息">
                        <i class="fas fa-edit"></i>
                    </button>
                ` : isReadOnlyMode ? `
                    <button class="advisor-edit-btn disabled" title="需要登录才能编辑">
                        <i class="fas fa-edit"></i> (需要登录)
                    </button>
                ` : ''}
            </div>
            <div class="advisor-meta-footer">
                <small class="text-muted">
                    更新于: ${formatDate(advisor.updatedAt)}
                </small>
            </div>
        `;
        
        DOM.advisorsGrid.appendChild(advisorCard);
    });
    
    // 添加编辑按钮事件监听
    if (!isReadOnlyMode && window.adminSystem && window.adminSystem.editMode) {
        document.querySelectorAll('.advisor-edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const advisorId = this.getAttribute('data-id');
                showEditAdvisorForm(advisorId);
            });
        });
    }
}

/**
 * 渲染学生卡片（根据权限显示编辑按钮）
 */
function renderStudents() {
    if (!DOM.studentsGrid) return;
    
    DOM.studentsGrid.innerHTML = '';
    
    studentsData.forEach(student => {
        // 根据权限决定是否显示编辑按钮
        const showEditButton = !isReadOnlyMode && 
                              window.adminSystem && 
                              window.adminSystem.editMode;
        
        const studentCard = document.createElement('div');
        studentCard.className = 'student-card';
        studentCard.setAttribute('data-id', student.id);
        
        studentCard.innerHTML = `
            <div class="student-avatar">
                <img src="${student.avatar}" alt="${student.name}" loading="lazy">
                ${dataSourceInfo.type === 'default' ? '<div class="readonly-badge">示例数据</div>' : ''}
            </div>
            <h3 class="student-name">${student.name}</h3>
            <p class="student-degree">${student.degree}</p>
            <p class="student-field">${student.field}</p>
            <p class="student-supervisor">
                <i class="fas fa-user-tie"></i>
                <span>${student.supervisor}</span>
            </p>
            <p class="student-research">${student.research}</p>
            <div class="student-contact">
                <a href="mailto:${student.email}" title="发送邮件">
                    <i class="fas fa-envelope"></i>
                </a>
                <a href="${student.github}" target="_blank" title="GitHub主页">
                    <i class="fab fa-github"></i>
                </a>
                ${showEditButton ? `
                    <button class="student-edit-btn" data-id="${student.id}" title="编辑学生信息">
                        <i class="fas fa-edit"></i>
                    </button>
                ` : isReadOnlyMode ? `
                    <button class="student-edit-btn disabled" title="需要登录才能编辑">
                        <i class="fas fa-edit"></i> (需要登录)
                    </button>
                ` : ''}
            </div>
            <div class="student-meta-footer">
                <small class="text-muted">
                    更新于: ${formatDate(student.updatedAt)}
                </small>
            </div>
        `;
        
        DOM.studentsGrid.appendChild(studentCard);
    });
    
    // 添加编辑按钮事件监听
    if (!isReadOnlyMode && window.adminSystem && window.adminSystem.editMode) {
        document.querySelectorAll('.student-edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const studentId = this.getAttribute('data-id');
                showEditStudentForm(studentId);
            });
        });
    }
}

/**
 * 渲染学术成果（根据权限显示编辑按钮）
 */
function renderPublications() {
    if (!DOM.publicationsGrid) return;
    
    DOM.publicationsGrid.innerHTML = '';
    
    publicationsData.forEach(publication => {
        const typeColor = CONFIG.TYPE_COLORS[publication.type] || '#3498db';
        
        // 根据权限决定是否显示编辑按钮
        const showEditButton = !isReadOnlyMode && 
                              window.adminSystem && 
                              window.adminSystem.editMode;
        
        const publicationCard = document.createElement('div');
        publicationCard.className = 'publication-card';
        publicationCard.setAttribute('data-id', publication.id);
        
        publicationCard.innerHTML = `
            <div class="publication-header">
                <span class="publication-type" style="background-color: ${typeColor}20; color: ${typeColor}">
                    ${publication.type}
                </span>
                ${dataSourceInfo.type === 'default' ? '<span class="readonly-badge">示例数据</span>' : ''}
                <h3 class="publication-title">${publication.title}</h3>
                <p class="publication-authors">
                    <i class="fas fa-users"></i>
                    ${publication.authors}
                </p>
                <p class="publication-venue">
                    <i class="fas fa-book"></i>
                    ${publication.venue}
                </p>
                ${publication.doi ? `
                    <p class="publication-doi">
                        <i class="fas fa-link"></i>
                        DOI: ${publication.doi}
                    </p>
                ` : ''}
            </div>
            <div class="publication-body">
                <p class="publication-abstract">
                    <strong>摘要：</strong>${publication.abstract}
                </p>
                <div class="publication-actions">
                    ${publication.link ? `
                        <a href="${publication.link}" target="_blank" class="btn btn-outline">
                            <i class="fas fa-external-link-alt"></i>
                            查看全文
                        </a>
                    ` : ''}
                    ${showEditButton ? `
                        <button class="btn btn-outline edit-publication-btn" data-id="${publication.id}">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-outline delete-publication-btn" data-id="${publication.id}">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    ` : isReadOnlyMode ? `
                        <button class="btn btn-outline disabled" title="需要登录才能编辑">
                            <i class="fas fa-edit"></i> 编辑 (需要登录)
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        DOM.publicationsGrid.appendChild(publicationCard);
    });
    
    // 添加编辑按钮事件监听
    if (!isReadOnlyMode && window.adminSystem && window.adminSystem.editMode) {
        document.querySelectorAll('.edit-publication-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const publicationId = this.getAttribute('data-id');
                showEditPublicationForm(publicationId);
            });
        });
        
        document.querySelectorAll('.delete-publication-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const publicationId = this.getAttribute('data-id');
                if (confirm('确定要删除这个学术成果吗？')) {
                    deletePublication(publicationId);
                }
            });
        });
    }
}

/**
 * 渲染研究近况（根据权限显示编辑按钮）
 */
function renderUpdates() {
    if (!DOM.updatesGrid) return;
    
    DOM.updatesGrid.innerHTML = '';
    
    // 按日期排序（最新在前）
    const sortedUpdates = [...updatesData].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedUpdates.forEach(update => {
        const typeColor = CONFIG.TYPE_COLORS[update.type] || '#3498db';
        
        // 根据权限决定是否显示编辑按钮
        const showEditButton = !isReadOnlyMode && 
                              window.adminSystem && 
                              window.adminSystem.editMode;
        
        const updateCard = document.createElement('div');
        updateCard.className = 'update-card';
        updateCard.setAttribute('data-id', update.id);
        
        updateCard.innerHTML = `
            <div class="update-header">
                <div class="update-date-wrapper">
                    <span class="update-date" style="background-color: ${typeColor}20; color: ${typeColor}">
                        ${formatDate(update.date)}
                    </span>
                    ${dataSourceInfo.type === 'default' ? '<span class="readonly-badge">示例数据</span>' : ''}
                    <span class="update-type" style="color: ${typeColor}">
                        ${update.type}
                    </span>
                </div>
                <h3 class="update-title">${update.title}</h3>
            </div>
            <div class="update-body">
                <p class="update-content">${update.content}</p>
                <div class="update-footer">
                    <div class="update-project">
                        <i class="fas fa-project-diagram"></i>
                        <span>${update.project}</span>
                    </div>
                    ${showEditButton ? `
                        <div class="update-actions">
                            <button class="btn btn-outline edit-update-btn" data-id="${update.id}">
                                <i class="fas fa-edit"></i> 编辑
                            </button>
                            <button class="btn btn-outline delete-update-btn" data-id="${update.id}">
                                <i class="fas fa-trash"></i> 删除
                            </button>
                        </div>
                    ` : isReadOnlyMode ? `
                        <div class="update-actions">
                            <button class="btn btn-outline disabled" title="需要登录才能编辑">
                                <i class="fas fa-edit"></i> 编辑 (需要登录)
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        DOM.updatesGrid.appendChild(updateCard);
    });
    
    // 添加编辑按钮事件监听
    if (!isReadOnlyMode && window.adminSystem && window.adminSystem.editMode) {
        document.querySelectorAll('.edit-update-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const updateId = this.getAttribute('data-id');
                showEditUpdateForm(updateId);
            });
        });
        
        document.querySelectorAll('.delete-update-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const updateId = this.getAttribute('data-id');
                if (confirm('确定要删除这个研究近况吗？')) {
                    deleteUpdate(updateId);
                }
            });
        });
    }
}

// ============================
// 编辑界面函数（带权限检查）
// ============================

/**
 * 显示项目编辑表单
 */
function showEditProjectForm(projectId = null) {
    // 检查权限
    if (isReadOnlyMode) {
        showToast('需要输入Token才能编辑数据', 'warning');
        requestTokenForAdmin();
        return;
    }
    
    const project = projectId ? 
        projectsData.find(p => p.id == projectId) : 
        {
            title: '',
            category: 'science',
            description: '',
            advisor: '',
            status: '筹备中',
            statusType: 'preparation',
            image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
        };
    
    const isEditMode = !!projectId;
    
    const modal = createModal();
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${isEditMode ? '编辑课题' : '添加新课题'} <span class="auth-badge authenticated">已认证</span></h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="editProjectForm" class="edit-form">
                    <div class="form-group">
                        <label for="editTitle">课题标题 *</label>
                        <input type="text" id="editTitle" value="${project.title}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editCategory">分类 *</label>
                        <select id="editCategory" required>
                            <option value="science" ${project.category === 'science' ? 'selected' : ''}>自然科学</option>
                            <option value="engineering" ${project.category === 'engineering' ? 'selected' : ''}>工程科学</option>
                            <option value="medical" ${project.category === 'medical' ? 'selected' : ''}>医学健康</option>
                            <option value="humanities" ${project.category === 'humanities' ? 'selected' : ''}>人文社科</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="editDescription">描述 *</label>
                        <textarea id="editDescription" rows="4" required>${project.description}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editAdvisor">指导老师 *</label>
                            <input type="text" id="editAdvisor" value="${project.advisor}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editStatus">状态 *</label>
                            <select id="editStatus" required>
                                <option value="preparation" ${project.statusType === 'preparation' ? 'selected' : ''}>筹备中</option>
                                <option value="in-progress" ${project.statusType === 'in-progress' ? 'selected' : ''}>进行中</option>
                                <option value="completed" ${project.statusType === 'completed' ? 'selected' : ''}>已完成</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="editImage">图片URL</label>
                        <input type="url" id="editImage" value="${project.image || ''}" 
                               placeholder="https://images.unsplash.com/photo-...">
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">
                            ${isEditMode ? '更新课题' : '添加课题'}
                        </button>
                        ${isEditMode ? `
                            <button type="button" class="btn btn-danger delete-btn">
                                <i class="fas fa-trash"></i> 删除课题
                            </button>
                        ` : ''}
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 显示模态框
    setTimeout(() => modal.classList.add('show'), 10);
    
    // 表单提交事件
    const form = modal.querySelector('#editProjectForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            title: modal.querySelector('#editTitle').value,
            category: modal.querySelector('#editCategory').value,
            description: modal.querySelector('#editDescription').value,
            advisor: modal.querySelector('#editAdvisor').value,
            status: getStatusText(modal.querySelector('#editStatus').value),
            statusType: modal.querySelector('#editStatus').value,
            image: modal.querySelector('#editImage').value || 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
        };
        
        if (isEditMode) {
            await updateProject(projectId, formData);
        } else {
            await addProject(formData);
        }
        
        closeModal(modal);
    });
    
    // 删除按钮事件
    if (isEditMode) {
        modal.querySelector('.delete-btn').addEventListener('click', async function() {
            if (confirm('确定要删除这个课题吗？此操作不可撤销。')) {
                await deleteProject(projectId);
                closeModal(modal);
            }
        });
    }
    
    // 取消按钮事件
    modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
    
    // 关闭模态框
    setupModalClose(modal);
}

// ============================
// 管理面板功能（带权限控制）
// ============================

/**
 * 显示管理面板
 */
function showAdminPanel() {
    // 检查权限
    if (isReadOnlyMode) {
        showToast('需要输入Token才能进入管理面板', 'warning');
        requestTokenForAdmin();
        return;
    }
    
    const modal = createModal();
    modal.innerHTML = `
        <div class="modal-content admin-panel">
            <div class="modal-header">
                <h3><i class="fas fa-cog"></i> 管理面板 <span class="auth-badge authenticated">已认证</span></h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="admin-stats">
                    <div class="stat-card">
                        <h4>${projectsData.length}</h4>
                        <p>研究课题</p>
                    </div>
                    <div class="stat-card">
                        <h4>${advisorsData.length}</h4>
                        <p>指导老师</p>
                    </div>
                    <div class="stat-card">
                        <h4>${studentsData.length}</h4>
                        <p>研究生</p>
                    </div>
                    <div class="stat-card">
                        <h4>${publicationsData.length}</h4>
                        <p>学术成果</p>
                    </div>
                    <div class="stat-card">
                        <h4>${updatesData.length}</h4>
                        <p>研究近况</p>
                    </div>
                </div>
                
                <div class="admin-actions">
                    <h4>快速操作</h4>
                    <div class="action-buttons">
                        <button class="btn btn-primary" id="addProjectBtn">
                            <i class="fas fa-plus"></i> 添加新课题
                        </button>
                        <button class="btn btn-primary" id="addAdvisorBtn">
                            <i class="fas fa-user-plus"></i> 添加新导师
                        </button>
                        <button class="btn btn-primary" id="addStudentBtn">
                            <i class="fas fa-user-graduate"></i> 添加研究生
                        </button>
                        <button class="btn btn-primary" id="addPublicationBtn">
                            <i class="fas fa-book"></i> 添加学术成果
                        </button>
                        <button class="btn btn-primary" id="addUpdateBtn">
                            <i class="fas fa-newspaper"></i> 添加研究近况
                        </button>
                    </div>
                </div>
                
                <div class="admin-tools">
                    <h4>数据管理</h4>
                    <div class="tool-buttons">
                        <button class="btn btn-secondary" id="exportDataBtn">
                            <i class="fas fa-download"></i> 导出数据
                        </button>
                        <button class="btn btn-secondary" id="saveToGitHubBtn">
                            <i class="fab fa-github"></i> 保存到GitHub
                        </button>
                        <button class="btn btn-danger" id="resetDataBtn">
                            <i class="fas fa-redo"></i> 重置为默认数据
                        </button>
                        <button class="btn btn-warning" id="clearTokenBtn">
                            <i class="fas fa-sign-out-alt"></i> 退出登录
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    // 添加按钮事件
    modal.querySelector('#addProjectBtn').addEventListener('click', () => {
        closeModal(modal);
        setTimeout(() => showEditProjectForm(), 100);
    });
    
    modal.querySelector('#addAdvisorBtn').addEventListener('click', () => {
        closeModal(modal);
        setTimeout(() => showEditAdvisorForm(), 100);
    });
    
    modal.querySelector('#addStudentBtn').addEventListener('click', () => {
        closeModal(modal);
        setTimeout(() => showEditStudentForm(), 100);
    });
    
    modal.querySelector('#addPublicationBtn').addEventListener('click', () => {
        closeModal(modal);
        setTimeout(() => showEditPublicationForm(), 100);
    });
    
    modal.querySelector('#addUpdateBtn').addEventListener('click', () => {
        closeModal(modal);
        setTimeout(() => showEditUpdateForm(), 100);
    });
    
    modal.querySelector('#exportDataBtn').addEventListener('click', exportAllData);
    modal.querySelector('#saveToGitHubBtn').addEventListener('click', async () => {
        const success = await saveAllDataToGitHub();
        if (success) {
            showToast('数据已保存到GitHub', 'success');
        }
    });
    modal.querySelector('#resetDataBtn').addEventListener('click', resetDataToDefault);
    modal.querySelector('#clearTokenBtn').addEventListener('click', () => {
        closeModal(modal);
        clearAuthentication();
    });
    
    setupModalClose(modal);
}

/**
 * 导出所有数据为JSON文件
 */
function exportAllData() {
    const allData = {
        projects: projectsData,
        advisors: advisorsData,
        students: studentsData,
        publications: publicationsData,
        updates: updatesData,
        exportDate: new Date().toISOString(),
        source: isReadOnlyMode ? '示例数据' : 'GitHub数据'
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `lab_data_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('数据导出成功！', 'success');
}

/**
 * 重置数据为默认值
 */
async function resetDataToDefault() {
    if (confirm('确定要重置所有数据为默认值吗？此操作不可撤销。')) {
        try {
            // 设置为默认数据
            projectsData = getDefaultProjects();
            advisorsData = getDefaultAdvisors();
            studentsData = getDefaultStudents();
            publicationsData = getDefaultPublications();
            updatesData = getDefaultUpdates();
            
            // 保存到本地存储
            saveToLocalStorage();
            
            // 如果已认证，保存到 GitHub
            if (!isReadOnlyMode && await initializeGitHubToken()) {
                await saveAllDataToGitHub();
            }
            
            // 重新渲染
            renderProjects(currentFilter);
            renderAdvisors();
            renderStudents();
            renderPublications();
            renderUpdates();
            
            showToast('数据已重置为默认值', 'success');
        } catch (error) {
            console.error('重置数据失败:', error);
            showToast('重置数据失败', 'error');
        }
    }
}

// ============================
// 模态框辅助函数
// ============================

/**
 * 创建模态框
 */
function createModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    return modal;
}

/**
 * 关闭模态框
 */
function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }, 300);
}

/**
 * 设置模态框关闭事件
 */
function setupModalClose(modal) {
    modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

// ============================
// 现有功能函数
// ============================

/**
 * 显示课题详情
 */
function showProjectDetails(projectId) {
    const project = projectsData.find(p => p.id == projectId);
    if (!project) return;
    
    const modal = createModal();
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${project.title}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="modal-image">
                    <img src="${project.image}" alt="${project.title}">
                </div>
                <div class="modal-info">
                    <p><strong>分类：</strong>${getCategoryName(project.category)}</p>
                    <p><strong>指导老师：</strong>${project.advisor}</p>
                    <p><strong>状态：</strong>${project.status}</p>
                    <p><strong>描述：</strong>${project.description}</p>
                    <p><strong>创建时间：</strong>${formatDate(project.createdAt)}</p>
                    <p><strong>更新时间：</strong>${formatDate(project.updatedAt)}</p>
                    <p><strong>数据来源：</strong>${dataSourceInfo.type === 'default' ? '示例数据' : dataSourceInfo.type === 'github' ? 'GitHub实时数据' : '本地缓存数据'}</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => modal.classList.add('show'), 10);
    
    setupModalClose(modal);
}

// ============================
// 事件处理函数
// ============================

/**
 * 过滤课题
 */
function setupFilterButtons() {
    DOM.filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            DOM.filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // 为当前点击的按钮添加active类
            this.classList.add('active');
            
            // 获取过滤条件
            const filter = this.getAttribute('data-filter');
            
            // 保存过滤状态到本地存储
            localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_FILTER, filter);
            
            // 渲染过滤后的课题
            renderProjects(filter);
            
            // 滚动到课题区域
            const projectsSection = document.getElementById('projects');
            if (projectsSection) {
                projectsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * 切换主题
 */
function setupThemeToggle() {
    DOM.themeToggle.addEventListener('click', function() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        
        if (isDarkMode) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, 'dark');
            this.innerHTML = '<i class="fas fa-sun"></i>';
            this.setAttribute('title', '切换到浅色模式');
        } else {
            localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, 'light');
            this.innerHTML = '<i class="fas fa-moon"></i>';
            this.setAttribute('title', '切换到深色模式');
        }
    });
}

/**
 * 初始化主题
 */
function initTheme() {
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME);
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        DOM.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        DOM.themeToggle.setAttribute('title', '切换到浅色模式');
    } else {
        document.body.classList.remove('dark-mode');
        DOM.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        DOM.themeToggle.setAttribute('title', '切换到深色模式');
    }
}

/**
 * 移动端导航菜单切换
 */
function setupMobileMenu() {
    DOM.hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        DOM.navMenu.classList.toggle('active');
    });
    
    // 点击导航链接关闭移动端菜单
    DOM.navLinks.forEach(link => {
        link.addEventListener('click', function() {
            DOM.hamburger.classList.remove('active');
            DOM.navMenu.classList.remove('active');
        });
    });
}

/**
 * 返回顶部按钮
 */
function setupBackToTop() {
    const scrollHandler = throttle(function() {
        if (window.pageYOffset > 300) {
            DOM.backToTop.classList.add('show');
        } else {
            DOM.backToTop.classList.remove('show');
        }
    }, 100);
    
    window.addEventListener('scroll', scrollHandler);
    
    DOM.backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * 平滑滚动
 */
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.offsetTop;
                const offsetPosition = elementPosition - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================
// 添加管理按钮到导航栏
// ============================

/**
 * 添加管理按钮
 */
function addAdminButton() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;
    
    // 检查是否已存在管理按钮
    if (navActions.querySelector('.admin-btn')) return;
    
    const adminBtn = document.createElement('button');
    adminBtn.className = 'btn btn-outline admin-btn';
    adminBtn.innerHTML = '<i class="fas fa-cog"></i> 管理面板';
    adminBtn.title = '打开管理面板';
    
    adminBtn.addEventListener('click', showAdminPanel);
    
    // 插入到主题切换按钮之前
    const themeToggle = navActions.querySelector('#theme-toggle');
    if (themeToggle) {
        navActions.insertBefore(adminBtn, themeToggle);
    } else {
        navActions.appendChild(adminBtn);
    }
}

// ============================
// 初始化
// ============================

/**
 * 初始化所有功能
 */
async function init() {
    console.log('=== 系统初始化开始 ===');
    
    try {
        // 显示当前加载的模块
        console.log('已加载的模块:', {
            githubIssuesManager: !!window.githubIssuesManager,
            dataManager: !!window.dataManager,
            adminSystem: !!window.adminSystem
        });
        
        // 检查认证状态
        await checkAuthentication();
        
        // 设置事件监听
        setupFilterButtons();
        setupThemeToggle();
        setupMobileMenu();
        setupBackToTop();
        setupSmoothScroll();
        
        // 初始化状态
        initTheme();
        
        // 添加管理按钮
        addAdminButton();
        
        // 添加CSS样式
        addModalStyles();
        addToastStyles();
        addAdminStyles();
        addPermissionStyles();
        addDataSourceStyles();
        
        // 监听管理员模式变化
        document.addEventListener('adminModeChanged', function(event) {
            console.log('管理员模式变更:', event.detail);
            
            const { editMode, isAdmin } = event.detail;
            if (isAdmin && editMode) {
                if (isReadOnlyMode) {
                    showToast('需要输入Token才能编辑数据', 'warning');
                    requestTokenForAdmin();
                    return;
                }
                
                // 重新渲染以显示编辑按钮
                const currentFilter = localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_FILTER) || 'all';
                renderProjects(currentFilter);
                renderAdvisors();
                renderStudents();
                renderPublications();
                renderUpdates();
                
                showToast('已进入管理员编辑模式', 'success');
            } else {
                // 重新渲染以隐藏编辑按钮
                const currentFilter = localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_FILTER) || 'all';
                renderProjects(currentFilter);
                renderAdvisors();
                renderStudents();
                renderPublications();
                renderUpdates();
                
                if (isAdmin) {
                    showToast('已退出编辑模式', 'info');
                }
            }
        });
        
        console.log('✅ 系统初始化完成');
        
    } catch (error) {
        console.error('❌ 初始化失败:', error);
        showToast(`初始化失败: ${error.message}`, 'error');
        
        // 显示错误详情
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #e74c3c;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 9999;
            max-width: 80%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        errorDiv.innerHTML = `
            <h3 style="margin-top:0">初始化失败</h3>
            <p><strong>错误信息:</strong> ${error.message}</p>
            <p>请检查控制台获取更多信息</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #e74c3c;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                margin-top: 10px;
                cursor: pointer;
            ">刷新页面</button>
        `;
        document.body.appendChild(errorDiv);
    }
}

/**
 * 添加数据源样式
 */
function addDataSourceStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .data-source-hint {
            font-size: 0.75em;
            padding: 6px 10px;
            border-radius: 6px;
            margin-top: 12px;
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid transparent;
            font-weight: 500;
        }
        
        .data-source-hint.live {
            background-color: rgba(34, 197, 94, 0.1);
            color: #16a34a;
            border-color: rgba(34, 197, 94, 0.3);
        }
        
        .data-source-hint.cached {
            background-color: rgba(107, 114, 128, 0.1);
            color: #6b7280;
            border-color: rgba(107, 114, 128, 0.3);
        }
        
        .data-source-hint.default {
            background-color: rgba(249, 115, 22, 0.1);
            color: #f97316;
            border-color: rgba(249, 115, 22, 0.3);
        }
        
        .btn.disabled {
            opacity: 0.6;
            cursor: not-allowed;
            background-color: #9ca3af;
            border-color: #9ca3af;
            position: relative;
        }
        
        .btn.disabled:hover::after {
            content: "需要登录才能编辑";
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            background: #374151;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75em;
            white-space: nowrap;
            z-index: 10;
            pointer-events: none;
        }
        
        .advisor-edit-btn.disabled,
        .student-edit-btn.disabled {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: #9ca3af;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 0.85em;
            cursor: not-allowed;
            opacity: 0.6;
        }
    `;
    document.head.appendChild(style);
}

/**
 * 添加权限相关样式
 */
function addPermissionStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .permission-status {
            padding: 10px 0;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
            font-size: 14px;
            position: sticky;
            top: 80px;
            z-index: 999;
            transition: all 0.3s ease;
        }
        
        .status-guest {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border-bottom-color: #1d4ed8;
        }
        
        .status-guest::before {
            content: "👁️ ";
            margin-right: 6px;
        }
        
        .status-authenticated {
            background: #d4edda;
            color: #155724;
            border-bottom-color: #c3e6cb;
        }
        
        .permission-status .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .permission-status .btn-sm {
            padding: 4px 12px;
            font-size: 12px;
        }
        
        .readonly-badge {
            display: inline-block;
            background: #6c757d;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            margin-left: 8px;
            position: absolute;
            top: 10px;
            right: 10px;
        }
        
        .auth-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }
        
        .auth-badge.authenticated {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .auth-badge.guest {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border: 1px solid #1d4ed8;
        }
        
        body.dark-mode .permission-status {
            background: #2c3e50;
        }
        
        body.dark-mode .status-guest {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border-bottom-color: #1d4ed8;
        }
        
        body.dark-mode .status-authenticated {
            background: #0f5132;
            color: #d1e7dd;
            border-bottom-color: #0c4128;
        }
        
        body.dark-mode .readonly-badge {
            background: #6c757d;
        }
        
        body.dark-mode .auth-badge.authenticated {
            background: #0f5132;
            color: #d1e7dd;
            border-color: #0c4128;
        }
        
        body.dark-mode .auth-badge.guest {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border-color: #1d4ed8;
        }
    `;
    document.head.appendChild(style);
}

/**
 * 添加模态框样式
 */
function addModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
        }
        
        .modal.show {
            opacity: 1;
            visibility: visible;
        }
        
        .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            transform: translateY(20px);
            transition: transform 0.3s;
        }
        
        .modal.show .modal-content {
            transform: translateY(0);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        
        .modal-header h3 {
            margin: 0;
            font-size: 1.5rem;
            color: #333;
            display: flex;
            align-items: center;
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 1.8rem;
            cursor: pointer;
            color: #666;
            transition: color 0.3s;
        }
        
        .modal-close:hover {
            color: #333;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .modal-image {
            width: 100%;
            height: 300px;
            overflow: hidden;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .modal-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .modal-info p {
            margin-bottom: 10px;
            line-height: 1.6;
        }
        
        .modal-info strong {
            color: #333;
        }
        
        .project-status-tag {
            position: absolute;
            top: 15px;
            right: 15px;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .project-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .project-actions .btn {
            flex: 1;
        }
        
        .project-edit-btn, .advisor-edit-btn, .student-edit-btn {
            width: auto;
            padding: 8px 15px;
        }
        
        .advisor-edit-btn, .student-edit-btn {
            background: none;
            border: 1px solid #ddd;
            color: #666;
        }
        
        .advisor-edit-btn:hover, .student-edit-btn:hover {
            background: #f8f9fa;
            color: #333;
        }
        
        .project-meta-footer, .advisor-meta-footer, .student-meta-footer {
            margin-top: 10px;
            text-align: right;
            font-size: 0.85rem;
            color: #666;
        }
        
        .update-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }
        
        .update-date-wrapper {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .form-message {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .form-message i {
            font-size: 1.2rem;
        }
        
        body.dark-mode .modal-content {
            background: #2c3e50;
            color: #ecf0f1;
        }
        
        body.dark-mode .modal-header {
            border-bottom-color: #34495e;
        }
        
        body.dark-mode .modal-close {
            color: #bdc3c7;
        }
        
        body.dark-mode .modal-info strong {
            color: #ecf0f1;
        }
        
        body.dark-mode .project-meta-footer,
        body.dark-mode .advisor-meta-footer,
        body.dark-mode .student-meta-footer {
            color: #bdc3c7;
        }
    `;
    document.head.appendChild(style);
}

/**
 * 添加Toast样式
 */
function addToastStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            padding: 15px 20px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 400px;
            transform: translateY(100px);
            opacity: 0;
            transition: transform 0.3s, opacity 0.3s;
            z-index: 3000;
        }
        
        .toast.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .toast i {
            font-size: 1.2rem;
        }
        
        .toast-success {
            background: #d4edda;
            color: #155724;
            border-left: 4px solid #28a745;
        }
        
        .toast-error {
            background: #f8d7da;
            color: #721c24;
            border-left: 4px solid #dc3545;
        }
        
        .toast-warning {
            background: #fff3cd;
            color: #856404;
            border-left: 4px solid #ffc107;
        }
        
        .toast-info {
            background: #d1ecf1;
            color: #0c5460;
            border-left: 4px solid #17a2b8;
        }
        
        .toast-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: inherit;
            margin-left: 15px;
        }
        
        body.dark-mode .toast {
            background: #34495e;
            color: #ecf0f1;
        }
    `;
    document.head.appendChild(style);
}

/**
 * 添加管理面板样式
 */
function addAdminStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .admin-panel .modal-content {
            max-width: 800px;
        }
        
        .admin-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 10px rgba(52, 152, 219, 0.2);
        }
        
        .stat-card h4 {
            font-size: 2rem;
            margin: 0 0 5px 0;
        }
        
        .stat-card p {
            margin: 0;
            opacity: 0.9;
        }
        
        .admin-actions, .admin-tools {
            margin-bottom: 30px;
        }
        
        .admin-actions h4, .admin-tools h4 {
            margin-bottom: 15px;
            color: #2c3e50;
        }
        
        .action-buttons, .tool-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .edit-form .form-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .edit-form .form-actions .btn {
            flex: 1;
        }
        
        .btn-danger {
            background-color: #e74c3c;
            color: white;
            border: none;
        }
        
        .btn-danger:hover {
            background-color: #c0392b;
        }
        
        .edit-form {
            padding: 10px 0;
        }
        
        .edit-form .form-group {
            margin-bottom: 20px;
        }
        
        .edit-form label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        
        .edit-form input,
        .edit-form textarea,
        .edit-form select {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.3s ease;
            background: #fafafa;
        }
        
        .edit-form input:focus,
        .edit-form textarea:focus,
        .edit-form select:focus { 
            border-color: #3498db;
            background: white;
            outline: none;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        
        .edit-form select {
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 15px center;
            background-size: 16px;
            padding-right: 45px;
        }
        
        .edit-form textarea {
            resize: vertical;
            min-height: 100px;
            line-height: 1.5;
        }
        
        .form-row {
            display: flex;
            gap: 20px;
            margin-bottom: 0;
        }
        
        .form-row .form-group {
            flex: 1;
            margin-bottom: 20px;
        }
        
        body.dark-mode .admin-actions h4,
        body.dark-mode .admin-tools h4 {
            color: #ecf0f1;
        }
        
        body.dark-mode .stat-card {
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
        }
        
        body.dark-mode .edit-form label {
            color: #ecf0f1;
        }
        
        body.dark-mode .edit-form input,
        body.dark-mode .edit-form textarea,
        body.dark-mode .edit-form select {
            background: #34495e;
            border-color: #4a6278;
            color: #ecf0f1;
        }
        
        body.dark-mode .edit-form input:focus,
        body.dark-mode .edit-form textarea:focus,
        body.dark-mode .edit-form select:focus {
            background: #2c3e50;
            border-color: #3498db;
        }
    `;
    document.head.appendChild(style);
}

// ============================
// 页面加载
// ============================

// 当DOM完全加载后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ============================
// 导出（如果需要）
// ============================

// 如果需要，可以将一些函数导出
window.labWebsite = {
    // 数据操作
    projectsData,
    advisorsData,
    studentsData,
    publicationsData,
    updatesData,
    
    // CRUD操作
    addProject,
    updateProject,
    deleteProject,
    addAdvisor,
    updateAdvisor,
    deleteAdvisor,
    addStudent,
    updateStudent,
    deleteStudent,
    addPublication,
    updatePublication,
    deletePublication,
    addUpdate,
    updateUpdate,
    deleteUpdate,
    
    // 新增加的公共数据函数
    loadPublicData,
    fetchPublicDataFromGitHub,
    applyPublicData,
    
    // 界面操作
    showEditProjectForm,
    showEditAdvisorForm,
    showEditStudentForm,
    showEditPublicationForm,
    showEditUpdateForm,
    showAdminPanel,
    
    // 工具函数
    saveAllDataToGitHub,
    exportAllData
};
