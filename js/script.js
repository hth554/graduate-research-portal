// 配置常量
const GITHUB_FILES = {
    PROJECTS: 'research-projects.json',
    ADVISORS: 'research-advisors.json',
    STUDENTS: 'research-students.json',
    PUBLICATIONS: 'research-publications.json',
    UPDATES: 'research-updates.json'
};

const LOCAL_STORAGE_KEYS = {
    THEME: 'lab_theme_preference',
    PROJECT_FILTER: 'project_filter_state',
    PUBLIC_DATA_CACHE: 'public_data_cache',
    PUBLIC_DATA_CACHE_TIME: 'public_data_cache_timestamp'
};

const CONFIG = {
    STATUS_COLORS: { 'preparation': '#f39c12', 'in-progress': '#3498db', 'completed': '#2ecc71', 'pending': '#ff6b6b' },
    TYPE_COLORS: { '期刊论文': '#2ecc71', '会议论文': '#9b59b6', '专利': '#e74c3c', '专著': '#f39c12', '项目进展': '#2ecc71', '学术活动': '#9b59b6', '科研资助': '#e74c3c', '技术转化': '#f39c12', '学生荣誉': '#1abc9c', '产学研合作': '#34495e' }
};

// 调试模式
const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) {
        console.log('[LabWebsite]', ...args);
    }
}

function debugError(...args) {
    if (DEBUG) {
        console.error('[LabWebsite]', ...args);
    }
}

// 辅助函数：等待条件满足
function waitFor(condition, timeout = 5000, interval = 100) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const check = () => {
            if (condition()) {
                resolve();
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`等待超时: ${timeout}ms`));
            } else {
                setTimeout(check, interval);
            }
        };
        check();
    });
}

// 数据变量
let projectsData = [], advisorsData = [], studentsData = [], publicationsData = [], updatesData = [];
let isAuthenticated = false, isReadOnlyMode = true, currentFilter = 'all';
let dataSourceInfo = { type: 'default', timestamp: null, live: false };

// DOM 缓存
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

// 辅助函数：应用数据
function applyData(allData) {
    debugLog('应用数据到本地变量');
    
    projectsData = allData.projects || [];
    advisorsData = allData.advisors || [];
    studentsData = allData.students || [];
    publicationsData = allData.publications || [];
    updatesData = allData.updates || [];
    
    dataSourceInfo = {
        type: window.dataManager && window.dataManager.publicDataCache ? 'cached' : 'default',
        timestamp: new Date(),
        live: false
    };
    
    saveToLocalStorage();
    renderAllData();
    updateDataSourceHint(dataSourceInfo.type);
}

// 权限控制
async function checkAuthentication() {
    debugLog('开始检查认证状态');
    
    // 确保 dataManager 和 githubIssuesManager 已初始化
    if (!window.dataManager || !window.githubIssuesManager) {
        debugLog('数据管理器未加载，使用游客模式');
        isAuthenticated = false;
        isReadOnlyMode = true;
        showPermissionStatus('🔧 数据管理器加载中，请稍候...', 'guest');
        await loadPublicData();
        return false;
    }
    
    // 统一验证逻辑
    const hasToken = window.dataManager.hasValidToken() || 
                    window.githubIssuesManager.hasValidToken();
    
    if (hasToken) {
        isAuthenticated = true;
        isReadOnlyMode = false;
        showPermissionStatus('🔗 已连接GitHub | 数据实时同步', 'authenticated');
        
        try {
            // 尝试从 GitHub 同步数据
            const success = await window.dataManager.syncFromGitHub();
            if (!success) {
                debugLog('GitHub同步失败，使用本地数据');
            }
            
            // 获取所有数据
            const allData = window.dataManager.getAllData();
            applyData(allData);
            
            // 开始自动同步
            window.dataManager.startAutoSync();
            return true;
        } catch (error) {
            debugError('认证后数据加载失败:', error);
            // 加载本地数据作为后备
            await loadPublicData();
            return false;
        }
    } else {
        isAuthenticated = false;
        isReadOnlyMode = true;
        showPermissionStatus('👤 游客模式，只能查看数据', 'guest');
        
        // 加载公共数据
        await loadPublicData();
        return false;
    }
}

async function loadPublicData() {
    debugLog('开始加载公共数据（优先尝试实时数据）');
    
    // 缩短缓存时间为5分钟
    const cachedData = localStorage.getItem(LOCAL_STORAGE_KEYS.PUBLIC_DATA_CACHE);
    const cacheTimestamp = localStorage.getItem(LOCAL_STORAGE_KEYS.PUBLIC_DATA_CACHE_TIME);
    const now = Date.now();
    const CACHE_VALIDITY = 5 * 60 * 1000; // 5分钟
    
    if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_VALIDITY) {
        try {
            applyPublicData(JSON.parse(cachedData), 'cached');
            showToast('已显示缓存数据（5分钟内有效）', 'info');
            
            // 异步检查是否有更新的数据
            setTimeout(() => {
                fetchPublicDataFromGitHub().catch(err => 
                    debugLog('后台更新数据失败:', err)
                );
            }, 1000);
            
            return JSON.parse(cachedData);
        } catch (error) {
            debugError('缓存数据解析失败，重新拉取:', error);
            return await fetchPublicDataFromGitHub();
        }
    } else {
        // 缓存过期或不存在，直接拉取实时数据
        return await fetchPublicDataFromGitHub();
    }
}

async function fetchPublicDataFromGitHub() {
    try {
        const baseUrl = 'https://raw.githubusercontent.com/hth554/graduate-research-portal/main/data/';
        const dataFiles = { 
            projects: 'research-projects.json', 
            advisors: 'research-advisors.json', 
            students: 'research-students.json', 
            publications: 'research-publications.json', 
            updates: 'research-updates.json' 
        };
        const allData = {};
        let loadedCount = 0;
        
        // 直接尝试从GitHub公开仓库加载数据（游客模式）
        for (const [key, filename] of Object.entries(dataFiles)) {
            try {
                const response = await fetch(baseUrl + filename);
                if (response.ok) {
                    allData[key] = await response.json();
                    loadedCount++;
                    debugLog(`成功加载 ${filename}`);
                } else {
                    allData[key] = [];
                    debugError(`加载 ${filename} 失败: ${response.status}`);
                }
            } catch (error) {
                allData[key] = [];
                debugError(`加载 ${filename} 时出错:`, error);
            }
        }
        
        if (loadedCount > 0) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.PUBLIC_DATA_CACHE, JSON.stringify(allData));
            localStorage.setItem(LOCAL_STORAGE_KEYS.PUBLIC_DATA_CACHE_TIME, Date.now().toString());
            applyPublicData(allData, 'github');
            showToast(`成功加载 ${loadedCount} 个实时数据文件`, 'success');
            return allData;
        } else {
            throw new Error('所有数据文件加载失败');
        }
    } catch (error) {
        debugError('从GitHub拉取实时数据失败:', error);
        
        // 失败后fallback到缓存/示例数据
        const cachedData = localStorage.getItem(LOCAL_STORAGE_KEYS.PUBLIC_DATA_CACHE);
        const cacheTimestamp = localStorage.getItem(LOCAL_STORAGE_KEYS.PUBLIC_DATA_CACHE_TIME);
        const now = Date.now();
        
        if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 24 * 60 * 60 * 1000) {
            try {
                applyPublicData(JSON.parse(cachedData), 'cached');
                showToast('网络连接失败，已显示缓存数据', 'warning');
                return JSON.parse(cachedData);
            } catch (parseError) {
                debugError('解析缓存数据失败:', parseError);
            }
        }
        
        // 使用示例数据
        const defaultData = {
            projects: getDefaultProjects(),
            advisors: getDefaultAdvisors(),
            students: getDefaultStudents(),
            publications: getDefaultPublications(),
            updates: getDefaultUpdates()
        };
        applyPublicData(defaultData, 'default');
        showToast('无法加载远程数据，已显示示例数据', 'error');
        return defaultData;
    }
}

function applyPublicData(allData, sourceType) {
    debugLog(`应用公共数据，来源: ${sourceType}`);
    
    projectsData = allData.projects || getDefaultProjects();
    advisorsData = allData.advisors || getDefaultAdvisors();
    studentsData = allData.students || getDefaultStudents();
    publicationsData = allData.publications || getDefaultPublications();
    updatesData = allData.updates || getDefaultUpdates();
    
    dataSourceInfo = { type: sourceType, timestamp: new Date(), live: sourceType === 'github' };
    saveToLocalStorage();
    renderAllData();
    updateDataSourceHint(sourceType);
}

function showPermissionStatus(message, type) {
    if (DOM.permissionStatus && DOM.statusMessage) {
        DOM.permissionStatus.style.display = 'block';
        DOM.statusMessage.textContent = message;
        DOM.permissionStatus.className = `permission-status status-${type}`;
        
        if (type === 'guest') {
            if (DOM.enterAdminBtn) {
                DOM.enterAdminBtn.style.display = 'inline-block';
                DOM.enterAdminBtn.innerHTML = '<i class="fas fa-key"></i> 输入Token管理数据';
                DOM.enterAdminBtn.onclick = requestTokenForAdmin;
            }
            if (DOM.logoutBtn) DOM.logoutBtn.style.display = 'none';
        } else {
            if (DOM.enterAdminBtn) DOM.enterAdminBtn.style.display = 'none';
            if (DOM.logoutBtn) {
                DOM.logoutBtn.style.display = 'inline-block';
                DOM.logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> 退出登录';
                DOM.logoutBtn.onclick = clearAuthentication;
            }
        }
    }
}

function requestTokenForAdmin() {
    const token = prompt('请输入 GitHub Personal Access Token：\n\n格式要求：以 "ghp_" 或 "github_pat_" 开头\nToken 需要以下权限：repo, workflow\n\n（Token 将安全保存在您的浏览器本地）', '');
    
    if (token && token.trim()) {
        const trimmedToken = token.trim();
        if (!trimmedToken.startsWith('ghp_') && !trimmedToken.startsWith('github_pat_')) {
            alert('❌ Token 格式不正确！\n必须以 "ghp_" 或 "github_pat_" 开头。');
            return false;
        }
        
        if (window.githubIssuesManager.setToken(trimmedToken)) {
            if (window.dataManager) window.dataManager.setGitHubToken(trimmedToken);
            localStorage.setItem('github_pat_token', trimmedToken);
            localStorage.setItem('github_admin_token', trimmedToken);
            alert('✅ Token 设置成功！正在加载最新数据...');
            checkAuthentication().then(() => {
                renderAllData();
                showToast('已成功登录，现在可以编辑和同步数据', 'success');
            });
            return true;
        }
    }
    return false;
}

function clearAuthentication() {
    if (confirm('确定要退出登录吗？将切换回游客模式，本地未保存的更改可能会丢失。')) {
        if (window.githubIssuesManager) window.githubIssuesManager.clearToken();
        if (window.dataManager) window.dataManager.githubToken = null;
        localStorage.removeItem('github_admin_token');
        localStorage.removeItem('github_pat_token');
        isAuthenticated = false;
        isReadOnlyMode = true;
        loadPublicData();
        showPermissionStatus('👤 游客模式，只能查看数据', 'guest');
        if (window.adminSystem && window.adminSystem.isAdmin) window.adminSystem.toggleAdminMode();
        showToast('已退出登录，切换为游客模式', 'info');
    }
}

// 数据管理
function loadDefaultData() {
    projectsData = getDefaultProjects();
    advisorsData = getDefaultAdvisors();
    studentsData = getDefaultStudents();
    publicationsData = getDefaultPublications();
    updatesData = getDefaultUpdates();
    dataSourceInfo = { type: 'default', timestamp: new Date(), live: false };
    saveToLocalStorage();
    renderAllData();
}

function renderAllData() {
    const savedFilter = localStorage.getItem(LOCAL_STORAGE_KEYS.PROJECT_FILTER) || 'all';
    DOM.filterButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === savedFilter) btn.classList.add('active');
    });
    renderProjects(savedFilter);
    renderAdvisors();
    renderStudents();
    renderPublications();
    renderUpdates();
}

// 工具函数
function generateId() { return '_' + Math.random().toString(36).substr(2, 9); }
function getCurrentTimestamp() { return new Date().toISOString().split('T')[0]; }

async function initializeGitHubToken() {
    if (!window.githubIssuesManager) return false;
    if (window.githubIssuesManager.hasValidToken()) return true;
    
    const token = prompt('请输入 GitHub Personal Access Token：\n\n格式要求：以 "ghp_" 或 "github_pat_" 开头\nToken 需要以下权限：repo, workflow\n\n（Token 将安全保存在您的浏览器本地）', '');
    
    if (token && token.trim()) {
        const trimmedToken = token.trim();
        if (!trimmedToken.startsWith('ghp_') && !trimmedToken.startsWith('github_pat_')) {
            alert('❌ Token 格式不正确！\n必须以 "ghp_" 或 "github_pat_" 开头。');
            return false;
        }
        
        const success = window.githubIssuesManager.setToken(trimmedToken);
        if (success) {
            if (window.dataManager) window.dataManager.setGitHubToken(trimmedToken);
            localStorage.setItem('github_pat_token', trimmedToken);
            localStorage.setItem('github_admin_token', trimmedToken);
            alert('✅ GitHub Token 设置成功！');
            isAuthenticated = true;
            isReadOnlyMode = false;
            showPermissionStatus('🔗 已连接GitHub | 数据实时同步', 'authenticated');
            return true;
        }
    }
    return false;
}

async function loadAllDataFromGitHub() {
    try {
        if (!window.githubIssuesManager || !window.githubIssuesManager.hasValidToken()) return false;
        
        const [projects, advisors, students, publications, updates] = await Promise.allSettled([
            window.githubIssuesManager.readJsonFile(GITHUB_FILES.PROJECTS).catch(() => null),
            window.githubIssuesManager.readJsonFile(GITHUB_FILES.ADVISORS).catch(() => null),
            window.githubIssuesManager.readJsonFile(GITHUB_FILES.STUDENTS).catch(() => null),
            window.githubIssuesManager.readJsonFile(GITHUB_FILES.PUBLICATIONS).catch(() => null),
            window.githubIssuesManager.readJsonFile(GITHUB_FILES.UPDATES).catch(() => null)
        ]);
        
        projectsData = projects.status === 'fulfilled' && projects.value ? projects.value : getDefaultProjects();
        advisorsData = advisors.status === 'fulfilled' && advisors.value ? advisors.value : getDefaultAdvisors();
        studentsData = students.status === 'fulfilled' && students.value ? students.value : getDefaultStudents();
        publicationsData = publications.status === 'fulfilled' && publications.value ? publications.value : getDefaultPublications();
        updatesData = updates.status === 'fulfilled' && updates.value ? updates.value : getDefaultUpdates();
        
        const hasData = projects.value || advisors.value || students.value || publications.value || updates.value;
        saveToLocalStorage();
        return hasData;
    } catch (error) {
        showToast(`数据加载失败: ${error.message}`, 'error');
        return false;
    }
}

function saveToLocalStorage() {
    try {
        const data = { projects: projectsData, advisors: advisorsData, students: studentsData, publications: publicationsData, updates: updatesData };
        localStorage.setItem('research_portal_data', JSON.stringify(data));
        localStorage.setItem('local_data_version', Date.now().toString());
        return true;
    } catch (e) {
        debugError('保存到本地存储失败:', e);
        return false;
    }
}

// ========== 修复：保存到GitHub（带详细错误处理和调试功能） ==========
async function saveAllDataToGitHub() {
    if (isReadOnlyMode) { 
        showToast('游客模式不能保存数据到GitHub', 'warning'); 
        return false; 
    }
    
    try {
        // 检查Token
        if (!window.githubIssuesManager || !window.githubIssuesManager.hasValidToken()) {
            showToast('需要GitHub Token才能保存数据', 'warning');
            const tokenSuccess = await requestTokenForAdmin();
            if (!tokenSuccess) return false;
        }
        
        // 显示保存中提示
        const saveToast = showToast('正在保存数据到GitHub...', 'info', 0); // 0表示不自动关闭
        
        // 检查仓库连接
        try {
            console.log('检查仓库连接...');
            const repoInfo = await window.githubIssuesManager.checkRepositoryVisibility();
            console.log('仓库信息:', repoInfo);
            
            if (!repoInfo.isPublic && repoInfo.permissions && !repoInfo.permissions.push) {
                showToast('仓库权限不足，无法写入', 'error');
                return false;
            }
        } catch (repoError) {
            console.error('检查仓库失败:', repoError);
            showToast(`无法连接GitHub仓库: ${repoError.message}`, 'error');
            return false;
        }
        
        // 检查data目录是否存在
        try {
            const dirInfo = await window.githubIssuesManager.checkDataDirectory();
            console.log('data目录信息:', dirInfo);
            
            if (!dirInfo.exists) {
                showToast('data目录不存在，将尝试创建文件...', 'warning');
                // 如果目录不存在，第一个文件的写入会自动创建
            }
        } catch (dirError) {
            console.log('检查目录时出错:', dirError);
            // 继续尝试保存，可能目录不存在但可以创建文件
        }
        
        // 串行保存每个文件
        const filesToSave = [
            { name: '课题', filename: GITHUB_FILES.PROJECTS, data: projectsData },
            { name: '导师', filename: GITHUB_FILES.ADVISORS, data: advisorsData },
            { name: '学生', filename: GITHUB_FILES.STUDENTS, data: studentsData },
            { name: '学术成果', filename: GITHUB_FILES.PUBLICATIONS, data: publicationsData },
            { name: '研究近况', filename: GITHUB_FILES.UPDATES, data: updatesData }
        ];
        
        const results = [];
        let successCount = 0;
        let failCount = 0;
        
        // 更新保存进度提示
        const updateProgress = (current, total) => {
            if (saveToast && saveToast.querySelector('.toast-content span')) {
                saveToast.querySelector('.toast-content span').textContent = 
                    `正在保存数据到GitHub... (${current}/${total})`;
            }
        };
        
        for (let i = 0; i < filesToSave.length; i++) {
            const file = filesToSave[i];
            updateProgress(i + 1, filesToSave.length);
            
            try {
                console.log(`正在保存 ${file.name} (${file.filename})...`);
                
                // 显示当前文件保存状态
                showToast(`正在保存${file.name}...`, 'info', 2000);
                
                const result = await window.githubIssuesManager.writeJsonFile(file.filename, file.data);
                results.push({
                    filename: file.filename,
                    success: true,
                    sha: result.content.sha.slice(0, 8) + '...'
                });
                successCount++;
                
                console.log(`✅ ${file.filename} 保存成功，SHA: ${result.content.sha.slice(0, 8)}...`);
                
                // 文件间延迟，避免GitHub API限流
                if (i < filesToSave.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 800));
                }
                
            } catch (fileError) {
                results.push({
                    filename: file.filename,
                    success: false,
                    error: fileError.message
                });
                failCount++;
                
                console.error(`❌ 保存 ${file.filename} 失败:`, fileError);
                
                // 显示具体错误
                const errorMsg = fileError.message.includes('权限不足') 
                    ? `${file.name}保存失败: 权限不足，请检查Token权限`
                    : `${file.name}保存失败: ${fileError.message.substring(0, 50)}...`;
                
                showToast(errorMsg, 'error', 3000);
                
                // 单个文件失败继续保存其他文件
                continue;
            }
        }
        
        // 关闭保存中提示
        if (saveToast && saveToast.parentNode) {
            saveToast.parentNode.removeChild(saveToast);
        }
        
        // 统计结果显示
        if (failCount === 0) {
            showToast(`✅ 所有数据已成功保存到GitHub！`, 'success');
            console.log('✅ 所有文件保存成功:', results);
            return true;
        } else if (successCount > 0) {
            const failFiles = results.filter(r => !r.success).map(r => r.filename);
            showToast(`部分保存成功 (${successCount}/${results.length})。失败的文件: ${failFiles.join(', ')}`, 'warning');
            
            // 显示详细错误信息
            results.forEach(result => {
                if (!result.success) {
                    console.error(`文件 ${result.filename} 保存失败:`, result.error);
                }
            });
            
            return false;
        } else {
            showToast('所有文件保存失败，请检查网络连接和Token权限。', 'error');
            console.error('所有文件保存失败:', results);
            return false;
        }
        
    } catch (error) {
        console.error('保存数据到GitHub失败:', error);
        showToast(`保存失败: ${error.message}`, 'error');
        return false;
    }
}

async function saveDataToGitHub(filename, data) {
    if (isReadOnlyMode || !window.githubIssuesManager.hasValidToken()) return false;
    try {
        await window.githubIssuesManager.writeJsonFile(filename, data);
        return true;
    } catch (error) { 
        debugError(`保存数据到GitHub失败:`, error);
        return false; 
    }
}

// ========== 新增：带持续时间的Toast函数 ==========
function showToast(message, type = 'success', duration = 3000) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-content"><i class="fas fa-${getToastIcon(type)}"></i><span>${message}</span></div><button class="toast-close">&times;</button>`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    // 如果duration为0，则不自动关闭
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => { 
                if (toast.parentNode) toast.parentNode.removeChild(toast); 
            }, 300);
        }, duration);
    }
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => { 
            if (toast.parentNode) toast.parentNode.removeChild(toast); 
        }, 300);
    });
    
    return toast; // 返回toast元素以便后续操作
}

// ========== 新增：测试GitHub写入功能 ==========
async function testGitHubWriteFunction() {
    console.log('=== 开始测试GitHub写入功能 ===');
    
    if (!window.githubIssuesManager) {
        alert('GitHubIssuesManager未加载');
        return false;
    }
    
    // 检查Token
    if (!window.githubIssuesManager.hasValidToken()) {
        showToast('请先设置GitHub Token', 'warning');
        const tokenSuccess = await requestTokenForAdmin();
        if (!tokenSuccess) return false;
    }
    
    // 显示测试中提示
    showToast('正在测试GitHub写入功能...', 'info');
    
    try {
        const testResult = await window.githubIssuesManager.testWriteFunction();
        
        if (testResult.success) {
            showToast('✅ GitHub写入功能测试成功！', 'success');
            
            // 显示详细结果
            setTimeout(() => {
                alert(`GitHub写入功能测试成功！\n\n` +
                      `SHA: ${testResult.sha}\n` +
                      `测试文件已创建: test-write.json\n\n` +
                      `现在可以尝试保存数据了。`);
            }, 500);
            
            return true;
        } else {
            showToast(`❌ 写入功能测试失败: ${testResult.error}`, 'error');
            
            // 显示详细错误
            setTimeout(() => {
                alert(`GitHub写入功能测试失败！\n\n` +
                      `错误: ${testResult.error}\n\n` +
                      `请检查：\n` +
                      `1. Token是否有repo权限\n` +
                      `2. 仓库是否可写入\n` +
                      `3. 网络连接是否正常`);
            }, 500);
            
            return false;
        }
    } catch (error) {
        console.error('测试失败:', error);
        showToast(`测试失败: ${error.message}`, 'error');
        return false;
    }
}

// 默认数据（简化版本）
function getDefaultProjects() {
    return [
        { id: 1, title: "基于深度学习的医学图像分割算法研究", category: "medical", description: "本研究旨在开发一种高效的深度学习算法，用于医学图像中的器官与病变区域自动分割，提高诊断准确性与效率。", advisor: "张明教授", status: "进行中", statusType: "in-progress", image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", createdAt: "2023-01-15", updatedAt: "2023-10-20" },
        { id: 2, title: "可再生能源智能微电网优化控制策略", category: "engineering", description: "研究微电网中太阳能、风能等可再生能源的集成优化控制策略，提高能源利用效率与系统稳定性。", advisor: "李华教授", status: "进行中", statusType: "in-progress", image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", createdAt: "2023-02-10", updatedAt: "2023-09-18" },
        { id: 3, title: "新型纳米材料在环境污染物去除中的应用", category: "science", description: "探索新型纳米材料在废水处理与空气净化中的应用潜力，开发高效、低成本的环境修复技术。", advisor: "王静教授", status: "已完成", statusType: "completed", image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", createdAt: "2022-11-05", updatedAt: "2023-08-30" },
        { id: 4, title: "人工智能辅助的金融风险预测模型", category: "science", description: "构建基于机器学习与深度学习的金融风险预测模型，提高金融机构的风险识别与防范能力。", advisor: "赵伟教授", status: "进行中", statusType: "in-progress", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", createdAt: "2023-03-20", updatedAt: "2023-10-15" },
        { id: 5, title: "数字化转型对企业组织文化的影响研究", category: "humanities", description: "探究数字化转型过程中企业组织文化的变迁机制，为企业数字化转型提供管理策略建议。", advisor: "刘芳教授", status: "进行中", statusType: "in-progress", image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", createdAt: "2023-04-12", updatedAt: "2023-10-10" },
        { id: 6, title: "新型肿瘤靶向药物递送系统研究", category: "medical", description: "开发基于纳米技术的肿瘤靶向药物递送系统，提高抗癌药物在肿瘤部位的富集与疗效。", advisor: "陈晨教授", status: "筹备中", statusType: "preparation", image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", createdAt: "2023-09-01", updatedAt: "2023-09-01" }
    ];
}

function getDefaultAdvisors() {
    return [
        { id: 1, name: "刘曙光", title: "教授，硕士/博士生导师", field: "碳循环、水循环、生态系统功能和服务", bio: "国家海外引进高级人才、中组部 '千人计划' 入选者，与中科院合作证实成熟森林土壤可累积碳，推翻经典理论，成果发表于《SCIENCE》并入选 '中国科学10大进展'；研发 GEMS 生物地球化学循环模型、SkyCenterESM 生态系统服务核算模型，主导完成美国全域生态系统固碳与减排潜力评估。", avatar: "https://s41.ax1x.com/2025/12/14/pZMqFfI.png", email: "shuguang.liu@hainanu.edu.cn", website: "https://ecology.hainanu.edu.cn/info/1121/5440.html", createdAt: "2022-01-10", updatedAt: "2023-10-20" },
        { id: 2, name: "赵淑清", title: "教授，硕士/博士生导师", field: "城市生态学", bio: "创新性建立了城市化对植被生长影响的理论与定量方法，在 PNAS 发文证实城市环境对植被生长的普遍促进作用，该成果被学界广泛验证应用；提出解释城市化生物多样性梯度的 '热促进和胁迫平衡假说'，构建了我国城市生态系统有机碳储量评估体系，还搭建了北京城乡生态梯度长期研究平台（BES）。", avatar: "https://s41.ax1x.com/2025/12/14/pZMqApt.png", email: "shuqing.zhao@hainanu.edu.cn", website: "https://ecology.hainanu.edu.cn/info/1121/5450.htm", createdAt: "2022-02-15", updatedAt: "2023-09-15" },
        { id: 3, name: "周德成", title: "教授，硕士/博士生导师", field: "城市气象与生态", bio: "海南大学生态学院副教授，曾赴美国地质调查局、农业部林务局等机构任高级访问学者。其核心研究方向为城市气象与生态、全球变化遥感及生态系统模拟，尤聚焦快速城市化热环境效应，目前主持国家自然科学基金面上项目等多项课题。", avatar: "https://s41.ax1x.com/2025/12/14/pZMqn0g.png", email: "decheng.zhou@hainanu.edu.cn", website: "https://ecology.hainanu.edu.cn/info/1121/10520.html", createdAt: "2021-11-20", updatedAt: "2023-08-25" },
        { id: 4, name: "郑艺", title: "教授，硕士/博士生导师", field: "金融工程，人工智能", bio: "上海交通大学安泰经济与管理学院教授，研究方向为金融科技、风险管理与人工智能，主持国家自然科学基金重点项目3项，出版专著5部。", avatar: "", email: "", website: "", createdAt: "2022-03-05", updatedAt: "2023-10-05" }
    ];
}
        
function getDefaultStudents() {
    return [    
        { id: 1, name: "张鹏", degree: "博士后", field: "城市生态", supervisor: "赵淑清教授", research: "城市森林，城市土壤", avatar: "https://s41.ax1x.com/2025/12/24/pZGt2qO.jpg", email: "liming@example.com", github: "https://github.com/liming", createdAt: "2022-09-01", updatedAt: "2023-10-15" },
        { id: 2, name: "王芳", degree: "硕士研究生", field: "电气工程", supervisor: "李华教授", research: "研究方向为智能电网优化控制，主要研究可再生能源微电网的调度策略与稳定性分析。", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", email: "wangfang@example.com", github: "https://github.com/wangfang", createdAt: "2023-03-10", updatedAt: "2023-09-20" },
        { id: 3, name: "张伟", degree: "博士研究生", field: "环境工程", supervisor: "王静教授", research: "研究方向为环境功能材料，主要研究新型纳米材料在水污染治理中的应用与机理。", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", email: "zhangwei@example.com", github: "https://github.com/zhangwei", createdAt: "2021-11-15", updatedAt: "2023-08-30" },
        { id: 4, name: "刘洋", degree: "硕士研究生", field: "金融工程", supervisor: "赵伟教授", research: "研究方向为金融科技与风险管理，主要研究基于深度学习的金融市场预测模型。", avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", email: "liuyang@example.com", github: "https://github.com/liuyang", createdAt: "2023-02-20", updatedAt: "2023-10-10" }
    ];
}

function getDefaultPublications() {
    return [
        { id: 1, type: "期刊论文", title: "基于注意力机制的医学图像分割算法研究", authors: "张明, 李雷, 韩梅梅", venue: "《中国医学影像学杂志》, 2023, 31(5): 12-18", abstract: "本文提出了一种基于注意力机制的深度学习模型，用于医学图像中的器官分割，通过自注意力机制有效捕捉图像中的长距离依赖关系，在多个公开数据集上取得了最优性能。", doi: "10.1234/j.issn.1000-1234.2023.05.002", link: "https://example.com/paper1", createdAt: "2023-05-15", updatedAt: "2023-10-20" },
        { id: 2, type: "会议论文", title: "可再生能源微电网的优化调度策略", authors: "李华, 王强, 张伟", venue: "IEEE电力与能源系统国际会议, 2023", abstract: "本文提出了一种基于强化学习的微电网优化调度策略，有效提高了可再生能源的消纳能力，降低了系统运行成本，并通过仿真验证了其有效性。", doi: "10.1109/ICPES.2023.1234567", link: "https://example.com/paper2", createdAt: "2023-08-10", updatedAt: "2023-10-15" },
        { id: 3, type: "专利", title: "一种高效去除重金属离子的纳米复合材料制备方法", authors: "王静, 刘洋, 陈晨", venue: "中国发明专利, ZL202310123456.7, 2023", abstract: "本发明公开了一种高效去除水中重金属离子的纳米复合材料及其制备方法，该材料具有高吸附容量和良好的再生性能，适用于工业废水处理。", link: "https://example.com/patent1", createdAt: "2023-06-20", updatedAt: "2023-09-25" },
        { id: 4, type: "期刊论文", title: "数字化转型背景下组织文化变革路径研究", authors: "刘芳, 赵明, 孙丽", venue: "《管理科学学报》, 2023, 26(3): 45-56", abstract: "本研究基于组织变革理论，探讨了数字化转型过程中企业组织文化的变革路径与影响因素，提出了适应数字时代的企业文化构建框架。", doi: "10.1234/j.cnki.1671-9301.2023.03.005", link: "https://example.com/paper3", createdAt: "2023-03-30", updatedAt: "2023-10-05" }
    ];
}

function getDefaultUpdates() {
    return [
        { id: 1, date: "2023-10-15", title: "医学图像分割项目取得重要进展", type: "项目进展", content: "课题组在医学图像分割算法研究中取得重要突破，新提出的注意力机制模型在公开数据集上的分割准确率达到了95.2%，较现有方法提升了3.1%。", project: "基于深度学习的医学图像分割算法研究", projectId: 1, createdAt: "2023-10-15", updatedAt: "2023-10-15" },
        { id: 2, date: "2023-10-08", title: "课题组参加国际学术会议", type: "学术活动", content: "课题组三名研究生参加了在杭州举办的国际人工智能大会，展示了最新的研究成果，并与国内外同行进行了深入交流。", project: "人工智能辅助的金融风险预测模型", projectId: 4, createdAt: "2023-10-08", updatedAt: "2023-10-08" },
        { id: 3, date: "2023-09-25", title: "纳米材料研究获得国家自然科学基金资助", type: "科研资助", content: "课题组申报的'新型纳米材料在环境污染物去除中的机理与应用研究'项目获得国家自然科学基金面上项目资助，资助金额80万元。", project: "新型纳米材料在环境污染物去除中的应用", projectId: 3, createdAt: "2023-09-25", updatedAt: "2023-09-25" },
        { id: 4, date: "2023-09-18", title: "微电网控制策略实现现场应用", type: "技术转化", content: "课题组研发的可再生能源微电网优化控制策略在某工业园区实现现场应用，系统运行稳定性显著提升，能源利用率提高了18%。", project: "可再生能源智能微电网优化控制策略", projectId: 2, createdAt: "2023-09-18", updatedAt: "2023-09-18" },
        { id: 5, title: "博士生李明获得优秀研究生称号", date: "2023-09-10", type: "学生荣誉", content: "课题组博士生李明因在医学图像分割领域的突出研究成果，获得学校'优秀研究生'荣誉称号。", project: "基于深度学习的医学图像分割算法研究", projectId: 1, createdAt: "2023-09-10", updatedAt: "2023-09-10" },
        { id: 6, title: "课题组与企业签订合作研究协议", date: "2023-09-05", type: "产学研合作", content: "课题组与某知名金融科技公司签订合作研究协议，共同开展金融风险智能预警系统的研发与应用。", project: "人工智能辅助的金融风险预测模型", projectId: 4, createdAt: "2023-09-05", updatedAt: "2023-09-05" }
    ];
}

// 工具函数
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getCategoryName(category) {
    const categoryMap = { 'engineering': '工程科学', 'science': '自然科学', 'humanities': '人文社科', 'medical': '医学健康' };
    return categoryMap[category] || category;
}

function getToastIcon(type) {
    const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle' };
    return icons[type] || 'info-circle';
}

function getStatusText(statusType) {
    const statusMap = { 'preparation': '筹备中', 'in-progress': '进行中', 'completed': '已完成' };
    return statusMap[statusType] || '筹备中';
}

function updateDataSourceHint(sourceType) {
    const hintElement = document.getElementById('dataSourceHint');
    if (!hintElement) return;
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
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

// 防抖和节流
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments, context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// CRUD 操作（使用 DataManager）
const createCRUD = (dataArray, renderFn, filename, name) => {
    // 类型映射
    const typeMap = {
        '课题': 'projects',
        '导师': 'advisors', 
        '学生': 'students',
        '学术成果': 'publications',
        '研究近况': 'updates'
    };
    
    const type = typeMap[name];
    
    return {
        add: async (data) => {
            if (isReadOnlyMode) { 
                showToast(`游客模式不能添加${name}，请先输入Token`, 'warning'); 
                requestTokenForAdmin();
                return null; 
            }
            
            // 检查 dataManager 和 Token
            if (!window.dataManager || !window.dataManager.hasValidToken()) {
                showToast(`需要GitHub Token才能添加${name}`, 'warning');
                if (!window.dataManager.hasValidToken()) {
                    requestTokenForAdmin();
                }
                return null;
            }
            
            try {
                // 添加创建时间戳
                const itemWithTimestamp = {
                    ...data,
                    createdAt: getCurrentTimestamp(),
                    updatedAt: getCurrentTimestamp()
                };
                
                debugLog(`添加${name}:`, itemWithTimestamp);
                const newId = await window.dataManager.addData(type, itemWithTimestamp);
                showToast(`${name}添加成功！`, 'success');
                
                // 更新本地数据数组
                const newItem = { ...itemWithTimestamp, id: parseInt(newId) };
                dataArray.unshift(newItem);
                renderFn();
                
                return newItem;
            } catch (error) {
                debugError(`添加${name}失败:`, error);
                showToast(`${name}添加失败: ${error.message}`, 'error');
                return null;
            }
        },
        
        update: async (id, updatedData) => {
            if (isReadOnlyMode) { 
                showToast(`游客模式不能更新${name}，请先输入Token`, 'warning'); 
                return null; 
            }
            
            if (!window.dataManager || !window.dataManager.hasValidToken()) {
                showToast(`需要GitHub Token才能更新${name}`, 'warning');
                return null;
            }
            
            try {
                // 添加更新时间戳
                const itemWithTimestamp = {
                    ...updatedData,
                    updatedAt: getCurrentTimestamp()
                };
                
                debugLog(`更新${name} ID ${id}:`, itemWithTimestamp);
                const numericId = parseInt(id);
                const success = await window.dataManager.updateData(type, numericId, itemWithTimestamp);
                
                if (success) {
                    showToast(`${name}更新成功！`, 'success');
                    
                    // 更新本地数据数组
                    const index = dataArray.findIndex(item => item.id === numericId);
                    if (index !== -1) {
                        dataArray[index] = { ...dataArray[index], ...itemWithTimestamp };
                        renderFn();
                    }
                    
                    return true;
                }
                return false;
            } catch (error) {
                debugError(`更新${name}失败:`, error);
                showToast(`${name}更新失败: ${error.message}`, 'error');
                return false;
            }
        },
        
        delete: async (id) => {
            if (isReadOnlyMode) { 
                showToast(`游客模式不能删除${name}，请先输入Token`, 'warning'); 
                return false; 
            }
            
            if (!window.dataManager || !window.dataManager.hasValidToken()) {
                showToast(`需要GitHub Token才能删除${name}`, 'warning');
                return false;
            }
            
            try {
                debugLog(`删除${name} ID ${id}`);
                const numericId = parseInt(id);
                const success = await window.dataManager.deleteData(type, numericId);
                
                if (success) {
                    showToast(`${name}已删除`, 'success');
                    
                    // 更新本地数据数组
                    const index = dataArray.findIndex(item => item.id === numericId);
                    if (index !== -1) {
                        dataArray.splice(index, 1);
                        renderFn();
                    }
                    
                    return true;
                }
                return false;
            } catch (error) {
                debugError(`删除${name}失败:`, error);
                showToast(`${name}删除失败: ${error.message}`, 'error');
                return false;
            }
        }
    };
};

// 创建 CRUD 实例
const projectCRUD = createCRUD(projectsData, () => renderProjects(currentFilter), GITHUB_FILES.PROJECTS, '课题');
const advisorCRUD = createCRUD(advisorsData, renderAdvisors, GITHUB_FILES.ADVISORS, '导师');
const studentCRUD = createCRUD(studentsData, renderStudents, GITHUB_FILES.STUDENTS, '学生');
const publicationCRUD = createCRUD(publicationsData, renderPublications, GITHUB_FILES.PUBLICATIONS, '学术成果');
const updateCRUD = createCRUD(updatesData, renderUpdates, GITHUB_FILES.UPDATES, '研究近况');

// 绑定 CRUD 方法到全局操作函数
const addProject = projectCRUD.add;
const updateProject = projectCRUD.update;
const deleteProject = projectCRUD.delete;
const addAdvisor = advisorCRUD.add;
const updateAdvisor = advisorCRUD.update;
const deleteAdvisor = advisorCRUD.delete;
const addStudent = studentCRUD.add;
const updateStudent = studentCRUD.update;
const deleteStudent = studentCRUD.delete;
const addPublication = publicationCRUD.add;
const updatePublication = publicationCRUD.update;
const deletePublication = publicationCRUD.delete;
const addUpdate = updateCRUD.add;
const updateUpdate = updateCRUD.update;
const deleteUpdate = updateCRUD.delete;

// 渲染函数
function renderProjects(filter = 'all') {
    if (!DOM.projectsGrid) return;
    debugLog(`渲染项目，过滤器: ${filter}`);
    
    DOM.projectsGrid.innerHTML = '';
    currentFilter = filter;
    let filteredProjects = projectsData;
    if (filter !== 'all') filteredProjects = projectsData.filter(project => project.category === filter);
    
    if (filteredProjects.length === 0) {
        DOM.projectsGrid.innerHTML = '<div class="empty-state"><p>暂无相关课题</p><p>请尝试其他筛选条件</p></div>';
        return;
    }
    
    filteredProjects.forEach(project => {
        const statusColor = CONFIG.STATUS_COLORS[project.statusType] || '#1abc9c';
        const showEditButton = !isReadOnlyMode && window.adminSystem && window.adminSystem.editMode;
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.setAttribute('data-category', project.category);
        projectCard.setAttribute('data-id', project.id);
        
        projectCard.innerHTML = `
            <div class="project-image">
                <img src="${project.image}" alt="${project.title}" loading="lazy">
                <div class="project-status-tag" style="background-color: ${statusColor}20; color: ${statusColor}">${project.status}</div>
                ${dataSourceInfo.type === 'default' ? '<div class="readonly-badge">示例数据</div>' : ''}
            </div>
            <div class="project-content">
                <span class="project-category">${getCategoryName(project.category)}</span>
                <h3 class="project-title">${project.title}</h3>
                <p class="project-description">${project.description}</p>
                <div class="project-meta">
                    <div class="project-advisor"><i class="fas fa-user-graduate"></i><span>${project.advisor}</span></div>
                    <div class="project-status"><i class="fas fa-circle" style="color: ${statusColor}"></i><span>${project.status}</span></div>
                </div>
                <div class="project-actions">
                    <button class="btn btn-outline project-details-btn" data-id="${project.id}">查看详情</button>
                    ${showEditButton ? `<button class="btn btn-outline project-edit-btn" data-id="${project.id}" title="编辑课题"><i class="fas fa-edit"></i></button>` : 
                      isReadOnlyMode ? `<button class="btn btn-outline project-edit-btn disabled" title="需要登录才能编辑"><i class="fas fa-edit"></i> 编辑 (需要登录)</button>` : ''}
                </div>
                <div class="project-meta-footer"><small class="text-muted">更新于: ${formatDate(project.updatedAt)}</small></div>
            </div>
        `;
        DOM.projectsGrid.appendChild(projectCard);
    });
    
    document.querySelectorAll('.project-details-btn').forEach(btn => {
        btn.addEventListener('click', function() { showProjectDetails(this.getAttribute('data-id')); });
    });
    
    if (!isReadOnlyMode && window.adminSystem && window.adminSystem.editMode) {
        document.querySelectorAll('.project-edit-btn').forEach(btn => {
            btn.addEventListener('click', function() { showEditProjectForm(this.getAttribute('data-id')); });
        });
    }
}

function renderAdvisors() {
    if (!DOM.advisorsGrid) return;
    debugLog('渲染导师数据');
    
    DOM.advisorsGrid.innerHTML = '';
    advisorsData.forEach(advisor => {
        const showEditButton = !isReadOnlyMode && window.adminSystem && window.adminSystem.editMode;
        const advisorCard = document.createElement('div');
        advisorCard.className = 'advisor-card';
        advisorCard.setAttribute('data-id', advisor.id);
        advisorCard.innerHTML = `
            <div class="advisor-avatar"><img src="${advisor.avatar}" alt="${advisor.name}" loading="lazy">${dataSourceInfo.type === 'default' ? '<div class="readonly-badge">示例数据</div>' : ''}</div>
            <h3 class="advisor-name">${advisor.name}</h3><p class="advisor-title">${advisor.title}</p><p class="advisor-field">${advisor.field}</p>
            <p class="advisor-bio">${advisor.bio}</p>
            <div class="advisor-contact">
                <a href="mailto:${advisor.email}" title="发送邮件"><i class="fas fa-envelope"></i></a>
                <a href="${advisor.website}" target="_blank" title="个人主页"><i class="fas fa-globe"></i></a>
                <a href="#" title="学术主页"><i class="fab fa-google-scholar"></i></a>
                ${showEditButton ? `<button class="advisor-edit-btn" data-id="${advisor.id}" title="编辑导师信息"><i class="fas fa-edit"></i></button>` : 
                  isReadOnlyMode ? `<button class="advisor-edit-btn disabled" title="需要登录才能编辑"><i class="fas fa-edit"></i> (需要登录)</button>` : ''}
            </div>
            <div class="advisor-meta-footer"><small class="text-muted">更新于: ${formatDate(advisor.updatedAt)}</small></div>
        `;
        DOM.advisorsGrid.appendChild(advisorCard);
    });
    
    if (!isReadOnlyMode && window.adminSystem && window.adminSystem.editMode) {
        document.querySelectorAll('.advisor-edit-btn').forEach(btn => {
            btn.addEventListener('click', function() { showEditAdvisorForm(this.getAttribute('data-id')); });
        });
    }
}

function renderStudents() {
    if (!DOM.studentsGrid) return;
    debugLog('渲染学生数据');
    
    DOM.studentsGrid.innerHTML = '';
    studentsData.forEach(student => {
        const showEditButton = !isReadOnlyMode && window.adminSystem && window.adminSystem.editMode;
        const studentCard = document.createElement('div');
        studentCard.className = 'student-card';
        studentCard.setAttribute('data-id', student.id);
        studentCard.innerHTML = `
            <div class="student-avatar"><img src="${student.avatar}" alt="${student.name}" loading="lazy">${dataSourceInfo.type === 'default' ? '<div class="readonly-badge">示例数据</div>' : ''}</div>
            <h3 class="student-name">${student.name}</h3><p class="student-degree">${student.degree}</p><p class="student-field">${student.field}</p>
            <p class="student-supervisor"><i class="fas fa-user-tie"></i><span>${student.supervisor}</span></p>
            <p class="student-research">${student.research}</p>
            <div class="student-contact">
                <a href="mailto:${student.email}" title="发送邮件"><i class="fas fa-envelope"></i></a>
                <a href="${student.github}" target="_blank" title="GitHub主页"><i class="fab fa-github"></i></a>
                ${showEditButton ? `<button class="student-edit-btn" data-id="${student.id}" title="编辑学生信息"><i class="fas fa-edit"></i></button>` : 
                  isReadOnlyMode ? `<button class="student-edit-btn disabled" title="需要登录才能编辑"><i class="fas fa-edit"></i> (需要登录)</button>` : ''}
            </div>
            <div class="student-meta-footer"><small class="text-muted">更新于: ${formatDate(student.updatedAt)}</small></div>
        `;
        DOM.studentsGrid.appendChild(studentCard);
    });
    
    if (!isReadOnlyMode && window.adminSystem && window.adminSystem.editMode) {
        document.querySelectorAll('.student-edit-btn').forEach(btn => {
            btn.addEventListener('click', function() { showEditStudentForm(this.getAttribute('data-id')); });
        });
    }
}

function renderPublications() {
    if (!DOM.publicationsGrid) return;
    debugLog('渲染学术成果数据');
    
    DOM.publicationsGrid.innerHTML = '';
    publicationsData.forEach(publication => {
        const typeColor = CONFIG.TYPE_COLORS[publication.type] || '#3498db';
        const showEditButton = !isReadOnlyMode && window.adminSystem && window.adminSystem.editMode;
        const publicationCard = document.createElement('div');
        publicationCard.className = 'publication-card';
        publicationCard.setAttribute('data-id', publication.id);
        publicationCard.innerHTML = `
            <div class="publication-header">
                <span class="publication-type" style="background-color: ${typeColor}20; color: ${typeColor}">${publication.type}</span>
                ${dataSourceInfo.type === 'default' ? '<span class="readonly-badge">示例数据</span>' : ''}
                <h3 class="publication-title">${publication.title}</h3>
                <p class="publication-authors"><i class="fas fa-users"></i>${publication.authors}</p>
                <p class="publication-venue"><i class="fas fa-book"></i>${publication.venue}</p>
                ${publication.doi ? `<p class="publication-doi"><i class="fas fa-link"></i>DOI: ${publication.doi}</p>` : ''}
            </div>
            <div class="publication-body">
                <p class="publication-abstract"><strong>摘要：</strong>${publication.abstract}</p>
                <div class="publication-actions">
                    ${publication.link ? `<a href="${publication.link}" target="_blank" class="btn btn-outline"><i class="fas fa-external-link-alt"></i>查看全文</a>` : ''}
                    ${showEditButton ? `
                        <button class="btn btn-outline edit-publication-btn" data-id="${publication.id}"><i class="fas fa-edit"></i> 编辑</button>
                        <button class="btn btn-outline delete-publication-btn" data-id="${publication.id}"><i class="fas fa-trash"></i> 删除</button>
                    ` : isReadOnlyMode ? `<button class="btn btn-outline disabled" title="需要登录才能编辑"><i class="fas fa-edit"></i> 编辑 (需要登录)</button>` : ''}
                </div>
            </div>
        `;
        DOM.publicationsGrid.appendChild(publicationCard);
    });
    
    if (!isReadOnlyMode && window.adminSystem && window.adminSystem.editMode) {
        document.querySelectorAll('.edit-publication-btn').forEach(btn => {
            btn.addEventListener('click', function() { showEditPublicationForm(this.getAttribute('data-id')); });
        });
        document.querySelectorAll('.delete-publication-btn').forEach(btn => {
            btn.addEventListener('click', function() { if (confirm('确定要删除这个学术成果吗？')) deletePublication(this.getAttribute('data-id')); });
        });
    }
}

function renderUpdates() {
    if (!DOM.updatesGrid) return;
    debugLog('渲染研究近况数据');
    
    DOM.updatesGrid.innerHTML = '';
    const sortedUpdates = [...updatesData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedUpdates.forEach(update => {
        const typeColor = CONFIG.TYPE_COLORS[update.type] || '#3498db';
        const showEditButton = !isReadOnlyMode && window.adminSystem && window.adminSystem.editMode;
        const updateCard = document.createElement('div');
        updateCard.className = 'update-card';
        updateCard.setAttribute('data-id', update.id);
        updateCard.innerHTML = `
            <div class="update-header">
                <div class="update-date-wrapper">
                    <span class="update-date" style="background-color: ${typeColor}20; color: ${typeColor}">${formatDate(update.date)}</span>
                    ${dataSourceInfo.type === 'default' ? '<span class="readonly-badge">示例数据</span>' : ''}
                    <span class="update-type" style="color: ${typeColor}">${update.type}</span>
                </div>
                <h3 class="update-title">${update.title}</h3>
            </div>
            <div class="update-body">
                <p class="update-content">${update.content}</p>
                <div class="update-footer">
                    <div class="update-project"><i class="fas fa-project-diagram"></i><span>${update.project}</span></div>
                    ${showEditButton ? `
                        <div class="update-actions">
                            <button class="btn btn-outline edit-update-btn" data-id="${update.id}"><i class="fas fa-edit"></i> 编辑</button>
                            <button class="btn btn-outline delete-update-btn" data-id="${update.id}"><i class="fas fa-trash"></i> 删除</button>
                        </div>
                    ` : isReadOnlyMode ? `<div class="update-actions"><button class="btn btn-outline disabled" title="需要登录才能编辑"><i class="fas fa-edit"></i> 编辑 (需要登录)</button></div>` : ''}
                </div>
            </div>
        `;
        DOM.updatesGrid.appendChild(updateCard);
    });
    
    if (!isReadOnlyMode && window.adminSystem && window.adminSystem.editMode) {
        document.querySelectorAll('.edit-update-btn').forEach(btn => {
            btn.addEventListener('click', function() { showEditUpdateForm(this.getAttribute('data-id')); });
        });
        document.querySelectorAll('.delete-update-btn').forEach(btn => {
            btn.addEventListener('click', function() { if (confirm('确定要删除这个研究近况吗？')) deleteUpdate(this.getAttribute('data-id')); });
        });
    }
}

// 编辑界面函数
function showEditProjectForm(projectId = null) {
    if (isReadOnlyMode) { 
        showToast('需要输入Token才能编辑数据', 'warning'); 
        requestTokenForAdmin(); 
        return; 
    }
    
    const project = projectId ? projectsData.find(p => p.id == projectId) : { title: '', category: 'science', description: '', advisor: '', status: '筹备中', statusType: 'preparation', image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' };
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
                    <div class="form-group"><label for="editTitle">课题标题 *</label><input type="text" id="editTitle" value="${project.title}" required></div>
                    <div class="form-group"><label for="editCategory">分类 *</label>
                        <select id="editCategory" required>
                            <option value="science" ${project.category === 'science' ? 'selected' : ''}>自然科学</option>
                            <option value="engineering" ${project.category === 'engineering' ? 'selected' : ''}>工程科学</option>
                            <option value="medical" ${project.category === 'medical' ? 'selected' : ''}>医学健康</option>
                            <option value="humanities" ${project.category === 'humanities' ? 'selected' : ''}>人文社科</option>
                        </select>
                    </div>
                    <div class="form-group"><label for="editDescription">描述 *</label><textarea id="editDescription" rows="4" required>${project.description}</textarea></div>
                    <div class="form-row">
                        <div class="form-group"><label for="editAdvisor">指导老师 *</label><input type="text" id="editAdvisor" value="${project.advisor}" required></div>
                        <div class="form-group"><label for="editStatus">状态 *</label>
                            <select id="editStatus" required>
                                <option value="preparation" ${project.statusType === 'preparation' ? 'selected' : ''}>筹备中</option>
                                <option value="in-progress" ${project.statusType === 'in-progress' ? 'selected' : ''}>进行中</option>
                                <option value="completed" ${project.statusType === 'completed' ? 'selected' : ''}>已完成</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group"><label for="editImage">图片URL</label><input type="url" id="editImage" value="${project.image || ''}" placeholder="https://images.unsplash.com/photo-..."></div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">${isEditMode ? '更新课题' : '添加课题'}</button>
                        ${isEditMode ? `<button type="button" class="btn btn-danger delete-btn"><i class="fas fa-trash"></i> 删除课题</button>` : ''}
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    modal.querySelector('#editProjectForm').addEventListener('submit', async function(e) {
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
    
    if (isEditMode) {
        modal.querySelector('.delete-btn').addEventListener('click', async function() {
            if (confirm('确定要删除这个课题吗？此操作不可撤销。')) {
                await deleteProject(projectId);
                closeModal(modal);
            }
        });
    }
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
    setupModalClose(modal);
}

function showEditAdvisorForm(advisorId = null) {
    if (isReadOnlyMode) { 
        showToast('需要输入Token才能编辑数据', 'warning'); 
        requestTokenForAdmin(); 
        return; 
    }
    
    const advisor = advisorId ? advisorsData.find(a => a.id == advisorId) : { name: '', title: '', field: '', bio: '', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', email: '', website: '' };
    const isEditMode = !!advisorId;
    const modal = createModal();
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${isEditMode ? '编辑导师信息' : '添加新导师'} <span class="auth-badge authenticated">已认证</span></h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="editAdvisorForm" class="edit-form">
                    <div class="form-group"><label for="editAdvisorName">姓名 *</label><input type="text" id="editAdvisorName" value="${advisor.name}" required></div>
                    <div class="form-group"><label for="editAdvisorTitle">职称 *</label><input type="text" id="editAdvisorTitle" value="${advisor.title}" required placeholder="教授，博士生导师"></div>
                    <div class="form-group"><label for="editAdvisorField">研究领域 *</label><input type="text" id="editAdvisorField" value="${advisor.field}" required placeholder="碳循环、水循环、生态系统功能和服务"></div>
                    <div class="form-group"><label for="editAdvisorBio">个人简介 *</label><textarea id="editAdvisorBio" rows="6" required>${advisor.bio}</textarea></div>
                    <div class="form-row">
                        <div class="form-group"><label for="editAdvisorEmail">邮箱</label><input type="email" id="editAdvisorEmail" value="${advisor.email || ''}" placeholder="example@university.edu.cn"></div>
                        <div class="form-group"><label for="editAdvisorWebsite">个人主页</label><input type="url" id="editAdvisorWebsite" value="${advisor.website || ''}" placeholder="https://example.com/profile"></div>
                    </div>
                    <div class="form-group"><label for="editAdvisorAvatar">头像URL</label><input type="url" id="editAdvisorAvatar" value="${advisor.avatar || ''}" placeholder="https://images.unsplash.com/photo-..."></div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">${isEditMode ? '更新导师信息' : '添加导师'}</button>
                        ${isEditMode ? `<button type="button" class="btn btn-danger delete-btn"><i class="fas fa-trash"></i> 删除导师</button>` : ''}
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    modal.querySelector('#editAdvisorForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = {
            name: modal.querySelector('#editAdvisorName').value,
            title: modal.querySelector('#editAdvisorTitle').value,
            field: modal.querySelector('#editAdvisorField').value,
            bio: modal.querySelector('#editAdvisorBio').value,
            avatar: modal.querySelector('#editAdvisorAvatar').value || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            email: modal.querySelector('#editAdvisorEmail').value || '',
            website: modal.querySelector('#editAdvisorWebsite').value || ''
        };
        if (isEditMode) {
            await updateAdvisor(advisorId, formData);
        } else {
            await addAdvisor(formData);
        }
        closeModal(modal);
    });
    
    if (isEditMode) {
        modal.querySelector('.delete-btn').addEventListener('click', async function() {
            if (confirm('确定要删除这位导师吗？此操作不可撤销。')) {
                await deleteAdvisor(advisorId);
                closeModal(modal);
            }
        });
    }
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
    setupModalClose(modal);
}

function showEditStudentForm(studentId = null) {
    if (isReadOnlyMode) { 
        showToast('需要输入Token才能编辑数据', 'warning'); 
        requestTokenForAdmin(); 
        return; 
    }
    
    const student = studentId ? studentsData.find(s => s.id == studentId) : { name: '', degree: '', field: '', supervisor: '', research: '', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', email: '', github: '' };
    const isEditMode = !!studentId;
    const modal = createModal();
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${isEditMode ? '编辑学生信息' : '添加新学生'} <span class="auth-badge authenticated">已认证</span></h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="editStudentForm" class="edit-form">
                    <div class="form-group"><label for="editStudentName">姓名 *</label><input type="text" id="editStudentName" value="${student.name}" required></div>
                    <div class="form-row">
                        <div class="form-group"><label for="editStudentDegree">学位 *</label>
                            <select id="editStudentDegree" required>
                                <option value="本科生" ${student.degree === '本科生' ? 'selected' : ''}>本科生</option>
                                <option value="硕士研究生" ${student.degree === '硕士研究生' ? 'selected' : ''}>硕士研究生</option>
                                <option value="博士研究生" ${student.degree === '博士研究生' ? 'selected' : ''}>博士研究生</option>
                                <option value="博士后" ${student.degree === '博士后' ? 'selected' : ''}>博士后</option>
                            </select>
                        </div>
                        <div class="form-group"><label for="editStudentField">专业领域 *</label><input type="text" id="editStudentField" value="${student.field}" required placeholder="计算机科学"></div>
                    </div>
                    <div class="form-group"><label for="editStudentSupervisor">指导老师 *</label><input type="text" id="editStudentSupervisor" value="${student.supervisor}" required placeholder="李四教授"></div>
                    <div class="form-group"><label for="editStudentResearch">研究方向 *</label><textarea id="editStudentResearch" rows="4" required>${student.research}</textarea></div>
                    <div class="form-row">
                        <div class="form-group"><label for="editStudentEmail">邮箱</label><input type="email" id="editStudentEmail" value="${student.email || ''}" placeholder="student@university.edu.cn"></div>
                        <div class="form-group"><label for="editStudentGithub">GitHub</label><input type="url" id="editStudentGithub" value="${student.github || ''}" placeholder="https://github.com/username"></div>
                    </div>
                    <div class="form-group"><label for="editStudentAvatar">头像URL</label><input type="url" id="editStudentAvatar" value="${student.avatar || ''}" placeholder="https://images.unsplash.com/photo-..."></div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">${isEditMode ? '更新学生信息' : '添加学生'}</button>
                        ${isEditMode ? `<button type="button" class="btn btn-danger delete-btn"><i class="fas fa-trash"></i> 删除学生</button>` : ''}
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    modal.querySelector('#editStudentForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = {
            name: modal.querySelector('#editStudentName').value,
            degree: modal.querySelector('#editStudentDegree').value,
            field: modal.querySelector('#editStudentField').value,
            supervisor: modal.querySelector('#editStudentSupervisor').value,
            research: modal.querySelector('#editStudentResearch').value,
            avatar: modal.querySelector('#editStudentAvatar').value || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            email: modal.querySelector('#editStudentEmail').value || '',
            github: modal.querySelector('#editStudentGithub').value || ''
        };
        if (isEditMode) {
            await updateStudent(studentId, formData);
        } else {
            await addStudent(formData);
        }
        closeModal(modal);
    });
    
    if (isEditMode) {
        modal.querySelector('.delete-btn').addEventListener('click', async function() {
            if (confirm('确定要删除这位学生吗？此操作不可撤销。')) {
                await deleteStudent(studentId);
                closeModal(modal);
            }
        });
    }
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
    setupModalClose(modal);
}

function showEditPublicationForm(publicationId = null) {
    if (isReadOnlyMode) { 
        showToast('需要输入Token才能编辑数据', 'warning'); 
        requestTokenForAdmin(); 
        return; 
    }
    
    const publication = publicationId ? publicationsData.find(p => p.id == publicationId) : { type: '期刊论文', title: '', authors: '', venue: '', abstract: '', doi: '', link: '' };
    const isEditMode = !!publicationId;
    const modal = createModal();
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${isEditMode ? '编辑学术成果' : '添加新学术成果'} <span class="auth-badge authenticated">已认证</span></h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="editPublicationForm" class="edit-form">
                    <div class="form-group"><label for="editPublicationType">成果类型 *</label>
                        <select id="editPublicationType" required>
                            <option value="期刊论文" ${publication.type === '期刊论文' ? 'selected' : ''}>期刊论文</option>
                            <option value="会议论文" ${publication.type === '会议论文' ? 'selected' : ''}>会议论文</option>
                            <option value="专利" ${publication.type === '专利' ? 'selected' : ''}>专利</option>
                            <option value="专著" ${publication.type === '专著' ? 'selected' : ''}>专著</option>
                            <option value="技术报告" ${publication.type === '技术报告' ? 'selected' : ''}>技术报告</option>
                        </select>
                    </div>
                    <div class="form-group"><label for="editPublicationTitle">标题 *</label><input type="text" id="editPublicationTitle" value="${publication.title}" required></div>
                    <div class="form-group"><label for="editPublicationAuthors">作者 *</label><input type="text" id="editPublicationAuthors" value="${publication.authors}" required placeholder="张三, 李四, 王五"></div>
                    <div class="form-group"><label for="editPublicationVenue">发表刊物/会议 *</label><input type="text" id="editPublicationVenue" value="${publication.venue}" required placeholder="《计算机学报》, 2023, 31(5): 12-18"></div>
                    <div class="form-group"><label for="editPublicationAbstract">摘要 *</label><textarea id="editPublicationAbstract" rows="5" required>${publication.abstract}</textarea></div>
                    <div class="form-row">
                        <div class="form-group"><label for="editPublicationDoi">DOI</label><input type="text" id="editPublicationDoi" value="${publication.doi || ''}" placeholder="10.1234/j.issn.1000-1234.2023.05.002"></div>
                        <div class="form-group"><label for="editPublicationLink">链接</label><input type="url" id="editPublicationLink" value="${publication.link || ''}" placeholder="https://example.com/paper1"></div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">${isEditMode ? '更新学术成果' : '添加学术成果'}</button>
                        ${isEditMode ? `<button type="button" class="btn btn-danger delete-btn"><i class="fas fa-trash"></i> 删除成果</button>` : ''}
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    modal.querySelector('#editPublicationForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = {
            type: modal.querySelector('#editPublicationType').value,
            title: modal.querySelector('#editPublicationTitle').value,
            authors: modal.querySelector('#editPublicationAuthors').value,
            venue: modal.querySelector('#editPublicationVenue').value,
            abstract: modal.querySelector('#editPublicationAbstract').value,
            doi: modal.querySelector('#editPublicationDoi').value || '',
            link: modal.querySelector('#editPublicationLink').value || ''
        };
        if (isEditMode) {
            await updatePublication(publicationId, formData);
        } else {
            await addPublication(formData);
        }
        closeModal(modal);
    });
    
    if (isEditMode) {
        modal.querySelector('.delete-btn').addEventListener('click', async function() {
            if (confirm('确定要删除这个学术成果吗？此操作不可撤销。')) {
                await deletePublication(publicationId);
                closeModal(modal);
            }
        });
    }
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
    setupModalClose(modal);
}

function showEditUpdateForm(updateId = null) {
    if (isReadOnlyMode) { 
        showToast('需要输入Token才能编辑数据', 'warning'); 
        requestTokenForAdmin(); 
        return; 
    }
    
    const update = updateId ? updatesData.find(u => u.id == updateId) : { date: getCurrentTimestamp(), title: '', type: '项目进展', content: '', project: '' };
    const isEditMode = !!updateId;
    const modal = createModal();
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${isEditMode ? '编辑研究近况' : '添加新研究近况'} <span class="auth-badge authenticated">已认证</span></h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="editUpdateForm" class="edit-form">
                    <div class="form-group"><label for="editUpdateDate">日期 *</label><input type="date" id="editUpdateDate" value="${update.date}" required></div>
                    <div class="form-group"><label for="editUpdateTitle">标题 *</label><input type="text" id="editUpdateTitle" value="${update.title}" required></div>
                    <div class="form-group"><label for="editUpdateType">类型 *</label>
                        <select id="editUpdateType" required>
                            <option value="项目进展" ${update.type === '项目进展' ? 'selected' : ''}>项目进展</option>
                            <option value="学术活动" ${update.type === '学术活动' ? 'selected' : ''}>学术活动</option>
                            <option value="科研资助" ${update.type === '科研资助' ? 'selected' : ''}>科研资助</option>
                            <option value="技术转化" ${update.type === '技术转化' ? 'selected' : ''}>技术转化</option>
                            <option value="学生荣誉" ${update.type === '学生荣誉' ? 'selected' : ''}>学生荣誉</option>
                            <option value="产学研合作" ${update.type === '产学研合作' ? 'selected' : ''}>产学研合作</option>
                        </select>
                    </div>
                    <div class="form-group"><label for="editUpdateContent">内容 *</label><textarea id="editUpdateContent" rows="6" required>${update.content}</textarea></div>
                    <div class="form-group"><label for="editUpdateProject">相关项目</label>
                        <select id="editUpdateProject">
                            <option value="">无关联项目</option>
                            ${projectsData.map(project => `<option value="${project.title}" ${update.project === project.title ? 'selected' : ''}>${project.title}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">${isEditMode ? '更新研究近况' : '添加研究近况'}</button>
                        ${isEditMode ? `<button type="button" class="btn btn-danger delete-btn"><i class="fas fa-trash"></i> 删除近况</button>` : ''}
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    modal.querySelector('#editUpdateForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = {
            date: modal.querySelector('#editUpdateDate').value,
            title: modal.querySelector('#editUpdateTitle').value,
            type: modal.querySelector('#editUpdateType').value,
            content: modal.querySelector('#editUpdateContent').value,
            project: modal.querySelector('#editUpdateProject').value || '',
            projectId: modal.querySelector('#editUpdateProject').value ? projectsData.find(p => p.title === modal.querySelector('#editUpdateProject').value)?.id : null
        };
        if (isEditMode) {
            await updateUpdate(updateId, formData);
        } else {
            await addUpdate(formData);
        }
        closeModal(modal);
    });
    
    if (isEditMode) {
        modal.querySelector('.delete-btn').addEventListener('click', async function() {
            if (confirm('确定要删除这个研究近况吗？此操作不可撤销。')) {
                await deleteUpdate(updateId);
                closeModal(modal);
            }
        });
    }
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
    setupModalClose(modal);
}

// ========== 新增：添加调试按钮到页面 ==========
function addDebugTools() {
   
    
}

// 管理面板
function showAdminPanel() {
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
                    <div class="stat-card"><h4>${projectsData.length}</h4><p>研究课题</p></div>
                    <div class="stat-card"><h4>${advisorsData.length}</h4><p>指导老师</p></div>
                    <div class="stat-card"><h4>${studentsData.length}</h4><p>研究生</p></div>
                    <div class="stat-card"><h4>${publicationsData.length}</h4><p>学术成果</p></div>
                    <div class="stat-card"><h4>${updatesData.length}</h4><p>研究近况</p></div>
                </div>
                <div class="admin-actions"><h4>快速操作</h4>
                    <div class="action-buttons">
                        <button class="btn btn-primary" id="addProjectBtn"><i class="fas fa-plus"></i> 添加新课题</button>
                        <button class="btn btn-primary" id="addAdvisorBtn"><i class="fas fa-user-plus"></i> 添加新导师</button>
                        <button class="btn btn-primary" id="addStudentBtn"><i class="fas fa-user-graduate"></i> 添加研究生</button>
                        <button class="btn btn-primary" id="addPublicationBtn"><i class="fas fa-book"></i> 添加学术成果</button>
                        <button class="btn btn-primary" id="addUpdateBtn"><i class="fas fa-newspaper"></i> 添加研究近况</button>
                    </div>
                </div>
                <div class="admin-tools"><h4>数据管理</h4>
                    <div class="tool-buttons">
                        <button class="btn btn-secondary" id="exportDataBtn"><i class="fas fa-download"></i> 导出数据</button>
                        <button class="btn btn-secondary" id="saveToGitHubBtn"><i class="fab fa-github"></i> 保存到GitHub</button>
                        <button class="btn btn-warning" id="testGitHubBtn"><i class="fas fa-vial"></i> 测试GitHub写入</button>
                        <button class="btn btn-danger" id="resetDataBtn"><i class="fas fa-redo"></i> 重置为默认数据</button>
                        <button class="btn btn-warning" id="clearTokenBtn"><i class="fas fa-sign-out-alt"></i> 退出登录</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
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
        if (success) showToast('数据已保存到GitHub', 'success'); 
    });
    modal.querySelector('#testGitHubBtn').addEventListener('click', async () => {
        closeModal(modal);
        await testGitHubWriteFunction();
    });
    modal.querySelector('#resetDataBtn').addEventListener('click', resetDataToDefault);
    modal.querySelector('#clearTokenBtn').addEventListener('click', () => { 
        closeModal(modal); 
        clearAuthentication(); 
    });
    setupModalClose(modal);
}

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
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `lab_data_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
    showToast('数据导出成功！', 'success');
}

async function resetDataToDefault() {
    if (confirm('确定要重置所有数据为默认值吗？此操作不可撤销。')) {
        try {
            projectsData = getDefaultProjects();
            advisorsData = getDefaultAdvisors();
            studentsData = getDefaultStudents();
            publicationsData = getDefaultPublications();
            updatesData = getDefaultUpdates();
            saveToLocalStorage();
            
            if (!isReadOnlyMode && await initializeGitHubToken()) {
                await saveAllDataToGitHub();
            }
            
            renderProjects(currentFilter);
            renderAdvisors();
            renderStudents();
            renderPublications();
            renderUpdates();
            showToast('数据已重置为默认值', 'success');
        } catch (error) {
            showToast('重置数据失败', 'error');
        }
    }
}

// 模态框函数
function createModal() { 
    const modal = document.createElement('div'); 
    modal.className = 'modal'; 
    return modal; 
}

function closeModal(modal) { 
    modal.classList.remove('show'); 
    setTimeout(() => { 
        if (modal.parentNode) modal.parentNode.removeChild(modal); 
    }, 300); 
}

function setupModalClose(modal) {
    modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', (e) => { 
        if (e.target === modal) closeModal(modal); 
    });
}

// 现有功能函数
function showProjectDetails(projectId) {
    const project = projectsData.find(p => p.id == projectId);
    if (!project) return;
    
    const modal = createModal();
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header"><h3>${project.title}</h3><button class="modal-close">&times;</button></div>
            <div class="modal-body">
                <div class="modal-image"><img src="${project.image}" alt="${project.title}"></div>
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

// 事件处理函数
function setupFilterButtons() {
    DOM.filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            DOM.filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const filter = this.getAttribute('data-filter');
            localStorage.setItem(LOCAL_STORAGE_KEYS.PROJECT_FILTER, filter);
            renderProjects(filter);
            const projectsSection = document.getElementById('projects');
            if (projectsSection) projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

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

function setupMobileMenu() {
    DOM.hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        DOM.navMenu.classList.toggle('active');
    });
    
    DOM.navLinks.forEach(link => {
        link.addEventListener('click', function() {
            DOM.hamburger.classList.remove('active');
            DOM.navMenu.classList.remove('active');
        });
    });
}

function setupBackToTop() {
    const scrollHandler = throttle(function() {
        DOM.backToTop.classList.toggle('show', window.pageYOffset > 300);
    }, 100);
    
    window.addEventListener('scroll', scrollHandler);
    DOM.backToTop.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

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
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    });
}

function addAdminButton() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions || navActions.querySelector('.admin-btn')) return;
    
    const adminBtn = document.createElement('button');
    adminBtn.className = 'btn btn-outline admin-btn';
    adminBtn.innerHTML = '<i class="fas fa-cog"></i> 管理面板';
    adminBtn.title = '打开管理面板';
    adminBtn.addEventListener('click', showAdminPanel);
    
    const themeToggle = navActions.querySelector('#theme-toggle');
    if (themeToggle) navActions.insertBefore(adminBtn, themeToggle);
    else navActions.appendChild(adminBtn);
}

// 编辑按钮事件处理
function setupEditButtonEvents() {
    // 使用事件委托处理所有编辑按钮点击
    document.addEventListener('click', function(e) {
        // 处理项目编辑按钮
        const projectEditBtn = e.target.closest('.project-edit-btn');
        if (projectEditBtn && !projectEditBtn.classList.contains('disabled')) {
            e.preventDefault();
            e.stopPropagation();
            
            const projectId = projectEditBtn.getAttribute('data-id');
            
            // 检查权限
            if (!window.dataManager || !window.dataManager.hasValidToken()) {
                showToast('需要GitHub Token才能编辑', 'warning');
                requestTokenForAdmin();
                return;
            }
            
            showEditProjectForm(projectId);
        }
        
        // 处理导师编辑按钮
        const advisorEditBtn = e.target.closest('.advisor-edit-btn');
        if (advisorEditBtn && !advisorEditBtn.classList.contains('disabled')) {
            e.preventDefault();
            e.stopPropagation();
            
            const advisorId = advisorEditBtn.getAttribute('data-id');
            
            if (!window.dataManager || !window.dataManager.hasValidToken()) {
                showToast('需要GitHub Token才能编辑', 'warning');
                requestTokenForAdmin();
                return;
            }
            
            showEditAdvisorForm(advisorId);
        }
        
        // 处理学生编辑按钮
        const studentEditBtn = e.target.closest('.student-edit-btn');
        if (studentEditBtn && !studentEditBtn.classList.contains('disabled')) {
            e.preventDefault();
            e.stopPropagation();
            
            const studentId = studentEditBtn.getAttribute('data-id');
            
            if (!window.dataManager || !window.dataManager.hasValidToken()) {
                showToast('需要GitHub Token才能编辑', 'warning');
                requestTokenForAdmin();
                return;
            }
            
            showEditStudentForm(studentId);
        }
        
        // 处理学术成果编辑按钮
        const publicationEditBtn = e.target.closest('.edit-publication-btn');
        if (publicationEditBtn && !publicationEditBtn.classList.contains('disabled')) {
            e.preventDefault();
            e.stopPropagation();
            
            const publicationId = publicationEditBtn.getAttribute('data-id');
            
            if (!window.dataManager || !window.dataManager.hasValidToken()) {
                showToast('需要GitHub Token才能编辑', 'warning');
                requestTokenForAdmin();
                return;
            }
            
            showEditPublicationForm(publicationId);
        }
        
        // 处理研究近况编辑按钮
        const updateEditBtn = e.target.closest('.edit-update-btn');
        if (updateEditBtn && !updateEditBtn.classList.contains('disabled')) {
            e.preventDefault();
            e.stopPropagation();
            
            const updateId = updateEditBtn.getAttribute('data-id');
            
            if (!window.dataManager || !window.dataManager.hasValidToken()) {
                showToast('需要GitHub Token才能编辑', 'warning');
                requestTokenForAdmin();
                return;
            }
            
            showEditUpdateForm(updateId);
        }
    });
}

// 事件监听处理函数
function handleDataUpdated(event) {
    debugLog('数据已更新，重新渲染页面');
    if (window.dataManager) {
        const allData = window.dataManager.getAllData();
        applyData(allData);
    }
}

function handleAdminModeChanged(event) {
    const { editMode, isAdmin } = event.detail;
    
    // 更新本地权限状态
    isReadOnlyMode = !isAdmin; // 关键修改：根据isAdmin更新isReadOnlyMode
    
    // 重新渲染以显示/隐藏编辑按钮
    renderAllData();
    
    // 显示提示
    if (isAdmin && editMode) {
        showToast('已进入管理员编辑模式', 'success');
    } else {
        if (isAdmin) showToast('已退出编辑模式', 'info');
    }
}

// ========== 修复：提前初始化 window.labWebsite 对象，确保渲染函数存在 ==========
async function init() {
    try {
        debugLog('开始初始化网站...');
        
        // 提前初始化 window.labWebsite 对象，确保渲染函数存在
        window.labWebsite = window.labWebsite || {};
        
        // 确保渲染函数已定义（提前绑定）
        window.labWebsite.renderProjects = function(filter = 'all') {
            renderProjects(filter);
        };
        window.labWebsite.renderAdvisors = renderAdvisors;
        window.labWebsite.renderStudents = renderStudents;
        window.labWebsite.renderPublications = renderPublications;
        window.labWebsite.renderUpdates = renderUpdates;
        
        // 等待必要的全局对象初始化
        if (!window.dataManager) {
            debugLog('等待 DataManager 初始化...');
            try {
                await waitFor(() => !!window.dataManager, 5000, 100);
            } catch (error) {
                debugError('DataManager 初始化超时:', error);
            }
        }
        
        if (!window.githubIssuesManager) {
            debugLog('等待 GitHubIssuesManager 初始化...');
            try {
                await waitFor(() => !!window.githubIssuesManager, 5000, 100);
            } catch (error) {
                debugError('GitHubIssuesManager 初始化超时:', error);
            }
        }
        
        await checkAuthentication();
        setupFilterButtons();
        setupThemeToggle();
        setupMobileMenu();
        setupBackToTop();
        setupSmoothScroll();
        initTheme();
        addAdminButton();
        addModalStyles();
        addToastStyles();
        addAdminStyles();
        addPermissionStyles();
        addDataSourceStyles();
        
        // 添加编辑按钮事件监听
        setupEditButtonEvents();
        
        // 监听数据更新事件
        document.addEventListener('dataUpdated', handleDataUpdated);
        
        // 监听管理员模式变化
        document.addEventListener('adminModeChanged', handleAdminModeChanged);
        
        // 如果是管理员，添加调试工具
        if (isAuthenticated) {
            setTimeout(() => addDebugTools(), 1000);
        }
        
        debugLog('网站初始化完成');
        
    } catch (error) {
        debugError('初始化失败:', error);
        showToast(`初始化失败: ${error.message}`, 'error');
        
        // 显示错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: fixed; top: 100px; left: 50%; transform: translateX(-50%); background: #e74c3c; color: white; padding: 20px; border-radius: 8px; z-index: 9999; max-width: 80%; box-shadow: 0 4px 12px rgba(0,0,0,0.2);';
        errorDiv.innerHTML = `
            <h3 style="margin-top:0">初始化失败</h3>
            <p><strong>错误信息:</strong> ${error.message}</p>
            <p>请检查控制台获取更多信息</p>
            <button onclick="location.reload()" style="background: white; color: #e74c3c; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px; cursor: pointer;">
                刷新页面
            </button>
        `;
        document.body.appendChild(errorDiv);
    }
}

// 样式函数
function addDataSourceStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .data-source-hint { font-size: 0.75em; padding: 6px 10px; border-radius: 6px; margin-top: 12px; text-align: center; transition: all 0.3s ease; border: 1px solid transparent; font-weight: 500; }
        .data-source-hint.live { background-color: rgba(34, 197, 94, 0.1); color: #16a34a; border-color: rgba(34, 197, 94, 0.3); }
        .data-source-hint.cached { background-color: rgba(107, 114, 128, 0.1); color: #6b7280; border-color: rgba(107, 114, 128, 0.3); }
        .data-source-hint.default { background-color: rgba(249, 115, 22, 0.1); color: #f97316; border-color: rgba(249, 115, 22, 0.3); }
        .btn.disabled { opacity: 0.6; cursor: not-allowed; background-color: #9ca3af; border-color: #9ca3af; position: relative; }
        .btn.disabled:hover::after { content: "需要登录才能编辑"; position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: #374151; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75em; white-space: nowrap; z-index: 10; pointer-events: none; }
        .advisor-edit-btn.disabled, .student-edit-btn.disabled { display: inline-flex; align-items: center; justify-content: center; background: #9ca3af; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 0.85em; cursor: not-allowed; opacity: 0.6; }
    `;
    document.head.appendChild(style);
}

function addPermissionStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .permission-status { padding: 10px 0; background: #f8f9fa; border-bottom: 1px solid #dee2e6; font-size: 14px; position: sticky; top: 80px; z-index: 999; transition: all 0.3s ease; }
        .status-guest { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border-bottom-color: #1d4ed8; }
        .status-guest::before { content: "👁️ "; margin-right: 6px; }
        .status-authenticated { background: #d4edda; color: #155724; border-bottom-color: #c3e6cb; }
        .permission-status .container { display: flex; justify-content: space-between; align-items: center; }
        .permission-status .btn-sm { padding: 4px 12px; font-size: 12px; }
        .readonly-badge { display: inline-block; background: #6c757d; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 8px; position: absolute; top: 10px; right: 10px; }
        .auth-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 10px; }
        .auth-badge.authenticated { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .auth-badge.guest { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: 1px solid #1d4ed8; }
        body.dark-mode .permission-status { background: #2c3e50; }
        body.dark-mode .status-guest { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border-bottom-color: #1d4ed8; }
        body.dark-mode .status-authenticated { background: #0f5132; color: #d1e7dd; border-bottom-color: #0c4128; }
        body.dark-mode .readonly-badge { background: #6c757d; }
        body.dark-mode .auth-badge.authenticated { background: #0f5132; color: #d1e7dd; border-color: #0c4128; }
        body.dark-mode .auth-badge.guest { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border-color: #1d4ed8; }
    `;
    document.head.appendChild(style);
}

function addModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 2000; opacity: 0; visibility: hidden; transition: opacity 0.3s, visibility 0.3s; }
        .modal.show { opacity: 1; visibility: visible; }
        .modal-content { background: white; border-radius: 12px; width: 90%; max-width: 800px; max-height: 80vh; overflow-y: auto; transform: translateY(20px); transition: transform 0.3s; }
        .modal.show .modal-content { transform: translateY(0); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #eee; }
        .modal-header h3 { margin: 0; font-size: 1.5rem; color: #333; display: flex; align-items: center; }
        .modal-close { background: none; border: none; font-size: 1.8rem; cursor: pointer; color: #666; transition: color 0.3s; }
        .modal-close:hover { color: #333; }
        .modal-body { padding: 20px; }
        .modal-image { width: 100%; height: 300px; overflow: hidden; border-radius: 8px; margin-bottom: 20px; }
        .modal-image img { width: 100%; height: 100%; object-fit: cover; }
        .modal-info p { margin-bottom: 10px; line-height: 1.6; }
        .modal-info strong { color: #333; }
        .project-status-tag { position: absolute; top: 15px; right: 15px; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
        .project-actions { display: flex; gap: 10px; margin-top: 15px; }
        .project-actions .btn { flex: 1; }
        .project-edit-btn, .advisor-edit-btn, .student-edit-btn { width: auto; padding: 8px 15px; }
        .advisor-edit-btn, .student-edit-btn { background: none; border: 1px solid #ddd; color: #666; }
        .advisor-edit-btn:hover, .student-edit-btn:hover { background: #f8f9fa; color: #333; }
        .project-meta-footer, .advisor-meta-footer, .student-meta-footer { margin-top: 10px; text-align: right; font-size: 0.85rem; color: #666; }
        .update-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; }
        .update-date-wrapper { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .form-message { margin-bottom: 20px; padding: 15px; border-radius: 8px; display: flex; align-items: center; gap: 10px; }
        .form-message i { font-size: 1.2rem; }
        body.dark-mode .modal-content { background: #2c3e50; color: #ecf0f1; }
        body.dark-mode .modal-header { border-bottom-color: #34495e; }
        body.dark-mode .modal-close { color: #bdc3c7; }
        body.dark-mode .modal-info strong { color: #ecf0f1; }
        body.dark-mode .project-meta-footer, body.dark-mode .advisor-meta-footer, body.dark-mode .student-meta-footer { color: #bdc3c7; }
    `;
    document.head.appendChild(style);
}

function addToastStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .toast { position: fixed; bottom: 20px; right: 20px; background: white; border-radius: 8px; padding: 15px 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: space-between; min-width: 300px; max-width: 400px; transform: translateY(100px); opacity: 0; transition: transform 0.3s, opacity 0.3s; z-index: 3000; }
        .toast.show { transform: translateY(0); opacity: 1; }
        .toast-content { display: flex; align-items: center; gap: 10px; flex: 1; }
        .toast i { font-size: 1.2rem; }
        .toast-success { background: #d4edda; color: #155724; border-left: 4px solid #28a745; }
        .toast-error { background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545; }
        .toast-warning { background: #fff3cd; color: #856404; border-left: 4px solid #ffc107; }
        .toast-info { background: #d1ecf1; color: #0c5460; border-left: 4px solid #17a2b8; }
        .toast-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: inherit; margin-left: 15px; }
        body.dark-mode .toast { background: #34495e; color: #ecf0f1; }
    `;
    document.head.appendChild(style);
}

function addAdminStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .admin-panel .modal-content { max-width: 800px; }
        .admin-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 4px 10px rgba(52,152,219,0.2); }
        .stat-card h4 { font-size: 2rem; margin: 0 0 5px 0; }
        .stat-card p { margin: 0; opacity: 0.9; }
        .admin-actions, .admin-tools { margin-bottom: 30px; }
        .admin-actions h4, .admin-tools h4 { margin-bottom: 15px; color: #2c3e50; }
        .action-buttons, .tool-buttons { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .edit-form .form-actions { display: flex; gap: 10px; margin-top: 20px; }
        .edit-form .form-actions .btn { flex: 1; }
        .btn-danger { background-color: #e74c3c; color: white; border: none; }
        .btn-danger:hover { background-color: #c0392b; }
        .edit-form { padding: 10px 0; }
        .edit-form .form-group { margin-bottom: 20px; }
        .edit-form label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }
        .edit-form input, .edit-form textarea, .edit-form select { width: 100%; padding: 12px 15px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: all 0.3s ease; background: #fafafa; }
        .edit-form input:focus, .edit-form textarea:focus, .edit-form select:focus { border-color: #3498db; background: white; outline: none; box-shadow: 0 0 0 3px rgba(52,152,219,0.1); }
        .edit-form select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 15px center; background-size: 16px; padding-right: 45px; }
        .edit-form textarea { resize: vertical; min-height: 100px; line-height: 1.5; }
        .form-row { display: flex; gap: 20px; margin-bottom: 0; }
        .form-row .form-group { flex: 1; margin-bottom: 20px; }
        body.dark-mode .admin-actions h4, body.dark-mode .admin-tools h4 { color: #ecf0f1; }
        body.dark-mode .stat-card { background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); }
        body.dark-mode .edit-form label { color: #ecf0f1; }
        body.dark-mode .edit-form input, body.dark-mode .edit-form textarea, body.dark-mode .edit-form select { background: #34495e; border-color: #4a6278; color: #ecf0f1; }
        body.dark-mode .edit-form input:focus, body.dark-mode .edit-form textarea:focus, body.dark-mode .edit-form select:focus { background: #2c3e50; border-color: #3498db; }
    `;
    document.head.appendChild(style);
}

// 页面加载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ========== 修复：完整导出 window.labWebsite 对象，包含所有渲染函数 ==========
window.labWebsite = {
    // 数据变量
    projectsData, 
    advisorsData, 
    studentsData, 
    publicationsData, 
    updatesData,
    isReadOnlyMode, 
    isAuthenticated,
    
    // 渲染函数（必须导出）
    renderProjects,
    renderAdvisors,
    renderStudents,
    renderPublications,
    renderUpdates,
    
    // CRUD操作函数
    addProject: projectCRUD.add, 
    updateProject: projectCRUD.update, 
    deleteProject: projectCRUD.delete,
    addAdvisor: advisorCRUD.add, 
    updateAdvisor: advisorCRUD.update, 
    deleteAdvisor: advisorCRUD.delete,
    addStudent: studentCRUD.add, 
    updateStudent: studentCRUD.update, 
    deleteStudent: studentCRUD.delete,
    addPublication: publicationCRUD.add, 
    updatePublication: publicationCRUD.update, 
    deletePublication: publicationCRUD.delete,
    addUpdate: updateCRUD.add, 
    updateUpdate: updateCRUD.update, 
    deleteUpdate: updateCRUD.delete,
    
    // 界面函数
    showEditProjectForm, 
    showEditAdvisorForm, 
    showEditStudentForm, 
    showEditPublicationForm, 
    showEditUpdateForm, 
    showAdminPanel,
    exportAllData,
    
    // 工具函数
    checkAuthentication: async () => checkAuthentication(),
    getDataManager: () => window.dataManager,
    syncData: async () => {
        if (window.dataManager) {
            return await window.dataManager.manualSync();
        }
        return false;
    },

    // ===== 新增：GitHub保存和测试函数 =====
    saveAllDataToGitHub,          // 一次性保存全部数据
    saveDataToGitHub,             // 单文件保存（保留兼容）
    requestTokenForAdmin,         // 让管理面板也能触发登录
    testGitHubWriteFunction,      // 测试GitHub写入功能
    addDebugTools                 // 添加调试工具
};
