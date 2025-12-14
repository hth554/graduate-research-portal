// ============================
// 数据模型与配置
// ============================

// 存储键名
const STORAGE_KEYS = {
    PROJECTS: 'lab_projects',
    ADVISORS: 'lab_advisors',
    STUDENTS: 'lab_students',
    PUBLICATIONS: 'lab_publications',
    UPDATES: 'lab_updates',
    THEME: 'lab_theme_preference',
    PROJECT_FILTER: 'project_filter_state'
};

// 初始化数据 - 如果本地存储没有数据，则使用默认数据
let projectsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS)) || [
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

let advisorsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADVISORS)) || [
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

let studentsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [
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

let publicationsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.PUBLICATIONS)) || [
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

let updatesData = JSON.parse(localStorage.getItem(STORAGE_KEYS.UPDATES)) || [
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

// 当前筛选状态
let currentFilter = 'all';

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
    projectForm: document.getElementById('projectForm')
};

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
 * 保存数据到本地存储
 */
function saveDataToLocalStorage() {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projectsData));
    localStorage.setItem(STORAGE_KEYS.ADVISORS, JSON.stringify(advisorsData));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(studentsData));
    localStorage.setItem(STORAGE_KEYS.PUBLICATIONS, JSON.stringify(publicationsData));
    localStorage.setItem(STORAGE_KEYS.UPDATES, JSON.stringify(updatesData));
}

/**
 * 初始化本地存储
 */
function initializeLocalStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
        saveDataToLocalStorage();
    }
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
// CRUD 操作函数
// ============================

/**
 * 添加新项目
 */
function addProject(projectData) {
    const newProject = {
        ...projectData,
        id: generateId(),
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
    };
    
    projectsData.unshift(newProject); // 添加到数组开头
    saveDataToLocalStorage();
    renderProjects(currentFilter);
    return newProject;
}

/**
 * 更新项目
 */
function updateProject(projectId, updatedData) {
    const index = projectsData.findIndex(p => p.id == projectId);
    if (index !== -1) {
        projectsData[index] = {
            ...projectsData[index],
            ...updatedData,
            updatedAt: getCurrentTimestamp()
        };
        saveDataToLocalStorage();
        renderProjects(currentFilter);
        return projectsData[index];
    }
    return null;
}

/**
 * 删除项目
 */
function deleteProject(projectId) {
    const index = projectsData.findIndex(p => p.id == projectId);
    if (index !== -1) {
        projectsData.splice(index, 1);
        saveDataToLocalStorage();
        renderProjects(currentFilter);
        return true;
    }
    return false;
}

/**
 * 添加新导师
 */
function addAdvisor(advisorData) {
    const newAdvisor = {
        ...advisorData,
        id: generateId(),
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
    };
    
    advisorsData.unshift(newAdvisor);
    saveDataToLocalStorage();
    renderAdvisors();
    return newAdvisor;
}

/**
 * 更新导师信息
 */
function updateAdvisor(advisorId, updatedData) {
    const index = advisorsData.findIndex(a => a.id == advisorId);
    if (index !== -1) {
        advisorsData[index] = {
            ...advisorsData[index],
            ...updatedData,
            updatedAt: getCurrentTimestamp()
        };
        saveDataToLocalStorage();
        renderAdvisors();
        return advisorsData[index];
    }
    return null;
}

/**
 * 删除导师
 */
function deleteAdvisor(advisorId) {
    const index = advisorsData.findIndex(a => a.id == advisorId);
    if (index !== -1) {
        advisorsData.splice(index, 1);
        saveDataToLocalStorage();
        renderAdvisors();
        return true;
    }
    return false;
}

/**
 * 添加新学生
 */
function addStudent(studentData) {
    const newStudent = {
        ...studentData,
        id: generateId(),
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
    };
    
    studentsData.unshift(newStudent);
    saveDataToLocalStorage();
    renderStudents();
    return newStudent;
}

/**
 * 更新学生信息
 */
function updateStudent(studentId, updatedData) {
    const index = studentsData.findIndex(s => s.id == studentId);
    if (index !== -1) {
        studentsData[index] = {
            ...studentsData[index],
            ...updatedData,
            updatedAt: getCurrentTimestamp()
        };
        saveDataToLocalStorage();
        renderStudents();
        return studentsData[index];
    }
    return null;
}

/**
 * 删除学生
 */
function deleteStudent(studentId) {
    const index = studentsData.findIndex(s => s.id == studentId);
    if (index !== -1) {
        studentsData.splice(index, 1);
        saveDataToLocalStorage();
        renderStudents();
        return true;
    }
    return false;
}

// ============================
// 渲染函数（带编辑按钮）
// ============================

/**
 * 渲染课题卡片（带编辑按钮）
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
                    <button class="btn btn-outline project-edit-btn" data-id="${project.id}" title="编辑课题">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
                <div class="project-meta-footer">
                    <small class="text-muted">
                        更新于: ${formatDate(project.updatedAt)}
                    </small>
                </div>
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
    
    // 添加编辑按钮事件监听
    document.querySelectorAll('.project-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const projectId = this.getAttribute('data-id');
            showEditProjectForm(projectId);
        });
    });
}

/**
 * 渲染导师卡片（带编辑按钮）
 */
function renderAdvisors() {
    if (!DOM.advisorsGrid) return;
    
    DOM.advisorsGrid.innerHTML = '';
    
    advisorsData.forEach(advisor => {
        const advisorCard = document.createElement('div');
        advisorCard.className = 'advisor-card';
        advisorCard.setAttribute('data-id', advisor.id);
        
        advisorCard.innerHTML = `
            <div class="advisor-avatar">
                <img src="${advisor.avatar}" alt="${advisor.name}" loading="lazy">
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
                <button class="advisor-edit-btn" data-id="${advisor.id}" title="编辑导师信息">
                    <i class="fas fa-edit"></i>
                </button>
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
    document.querySelectorAll('.advisor-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const advisorId = this.getAttribute('data-id');
            showEditAdvisorForm(advisorId);
        });
    });
}

/**
 * 渲染学生卡片（带编辑按钮）
 */
function renderStudents() {
    if (!DOM.studentsGrid) return;
    
    DOM.studentsGrid.innerHTML = '';
    
    studentsData.forEach(student => {
        const studentCard = document.createElement('div');
        studentCard.className = 'student-card';
        studentCard.setAttribute('data-id', student.id);
        
        studentCard.innerHTML = `
            <div class="student-avatar">
                <img src="${student.avatar}" alt="${student.name}" loading="lazy">
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
                <button class="student-edit-btn" data-id="${student.id}" title="编辑学生信息">
                    <i class="fas fa-edit"></i>
                </button>
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
    document.querySelectorAll('.student-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.getAttribute('data-id');
            showEditStudentForm(studentId);
        });
    });
}

/**
 * 渲染学术成果
 */
function renderPublications() {
    if (!DOM.publicationsGrid) return;
    
    DOM.publicationsGrid.innerHTML = '';
    
    publicationsData.forEach(publication => {
        const typeColor = CONFIG.TYPE_COLORS[publication.type] || '#3498db';
        
        const publicationCard = document.createElement('div');
        publicationCard.className = 'publication-card';
        publicationCard.setAttribute('data-id', publication.id);
        
        publicationCard.innerHTML = `
            <div class="publication-header">
                <span class="publication-type" style="background-color: ${typeColor}20; color: ${typeColor}">
                    ${publication.type}
                </span>
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
                    <button class="btn btn-outline citation-btn" data-doi="${publication.doi || ''}">
                        <i class="fas fa-quote-right"></i>
                        引用格式
                    </button>
                </div>
            </div>
        `;
        
        DOM.publicationsGrid.appendChild(publicationCard);
    });
    
    // 添加引用按钮事件监听
    document.querySelectorAll('.citation-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const doi = this.getAttribute('data-doi');
            if (doi) {
                showCitation(doi);
            }
        });
    });
}

/**
 * 渲染研究近况
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
        
        const updateCard = document.createElement('div');
        updateCard.className = 'update-card';
        updateCard.setAttribute('data-id', update.id);
        
        updateCard.innerHTML = `
            <div class="update-header">
                <div class="update-date-wrapper">
                    <span class="update-date" style="background-color: ${typeColor}20; color: ${typeColor}">
                        ${formatDate(update.date)}
                    </span>
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
                    <button class="btn btn-outline update-details-btn" data-project-id="${update.projectId}">
                        查看相关课题
                    </button>
                </div>
            </div>
        `;
        
        DOM.updatesGrid.appendChild(updateCard);
    });
    
    // 添加详情按钮事件监听
    document.querySelectorAll('.update-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project-id');
            if (projectId) {
                scrollToProject(projectId);
            }
        });
    });
}

// ============================
// 编辑界面函数
// ============================

/**
 * 显示项目编辑表单
 */
function showEditProjectForm(projectId = null) {
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
                <h3>${isEditMode ? '编辑课题' : '添加新课题'}</h3>
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
    form.addEventListener('submit', function(e) {
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
            updateProject(projectId, formData);
            showToast('课题更新成功！', 'success');
        } else {
            addProject(formData);
            showToast('课题添加成功！', 'success');
        }
        
        closeModal(modal);
    });
    
    // 删除按钮事件
    if (isEditMode) {
        modal.querySelector('.delete-btn').addEventListener('click', function() {
            if (confirm('确定要删除这个课题吗？此操作不可撤销。')) {
                deleteProject(projectId);
                showToast('课题已删除', 'success');
                closeModal(modal);
            }
        });
    }
    
    // 取消按钮事件
    modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
    
    // 关闭模态框
    setupModalClose(modal);
}

/**
 * 显示导师编辑表单
 */
function showEditAdvisorForm(advisorId = null) {
    const advisor = advisorId ? 
        advisorsData.find(a => a.id == advisorId) : 
        {
            name: '',
            title: '',
            field: '',
            bio: '',
            avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            email: '',
            website: ''
        };
    
    const isEditMode = !!advisorId;
    
    const modal = createModal();
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${isEditMode ? '编辑导师信息' : '添加新导师'}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="editAdvisorForm" class="edit-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editAdvisorName">姓名 *</label>
                            <input type="text" id="editAdvisorName" value="${advisor.name}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editAdvisorTitle">职称 *</label>
                            <input type="text" id="editAdvisorTitle" value="${advisor.title}" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="editAdvisorField">研究领域 *</label>
                        <input type="text" id="editAdvisorField" value="${advisor.field}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editAdvisorBio">简介 *</label>
                        <textarea id="editAdvisorBio" rows="5" required>${advisor.bio}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editAdvisorEmail">邮箱</label>
                            <input type="email" id="editAdvisorEmail" value="${advisor.email || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="editAdvisorWebsite">个人网站</label>
                            <input type="url" id="editAdvisorWebsite" value="${advisor.website || ''}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="editAdvisorAvatar">头像URL</label>
                        <input type="url" id="editAdvisorAvatar" value="${advisor.avatar || ''}">
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">
                            ${isEditMode ? '更新导师信息' : '添加导师'}
                        </button>
                        ${isEditMode ? `
                            <button type="button" class="btn btn-danger delete-btn">
                                <i class="fas fa-trash"></i> 删除导师
                            </button>
                        ` : ''}
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    const form = modal.querySelector('#editAdvisorForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: modal.querySelector('#editAdvisorName').value,
            title: modal.querySelector('#editAdvisorTitle').value,
            field: modal.querySelector('#editAdvisorField').value,
            bio: modal.querySelector('#editAdvisorBio').value,
            email: modal.querySelector('#editAdvisorEmail').value,
            website: modal.querySelector('#editAdvisorWebsite').value,
            avatar: modal.querySelector('#editAdvisorAvatar').value || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        };
        
        if (isEditMode) {
            updateAdvisor(advisorId, formData);
            showToast('导师信息更新成功！', 'success');
        } else {
            addAdvisor(formData);
            showToast('导师添加成功！', 'success');
        }
        
        closeModal(modal);
    });
    
    if (isEditMode) {
        modal.querySelector('.delete-btn').addEventListener('click', function() {
            if (confirm('确定要删除这位导师吗？此操作不可撤销。')) {
                deleteAdvisor(advisorId);
                showToast('导师已删除', 'success');
                closeModal(modal);
            }
        });
    }
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
    setupModalClose(modal);
}

/**
 * 显示学生编辑表单
 */
function showEditStudentForm(studentId = null) {
    const student = studentId ? 
        studentsData.find(s => s.id == studentId) : 
        {
            name: '',
            degree: '硕士研究生',
            field: '',
            supervisor: '',
            research: '',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            email: '',
            github: ''
        };
    
    const isEditMode = !!studentId;
    
    const modal = createModal();
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${isEditMode ? '编辑学生信息' : '添加新学生'}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="editStudentForm" class="edit-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editStudentName">姓名 *</label>
                            <input type="text" id="editStudentName" value="${student.name}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editStudentDegree">学位 *</label>
                            <select id="editStudentDegree" required>
                                <option value="博士研究生" ${student.degree === '博士研究生' ? 'selected' : ''}>博士研究生</option>
                                <option value="硕士研究生" ${student.degree === '硕士研究生' ? 'selected' : ''}>硕士研究生</option>
                                <option value="本科生" ${student.degree === '本科生' ? 'selected' : ''}>本科生</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="editStudentField">专业领域 *</label>
                        <input type="text" id="editStudentField" value="${student.field}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editStudentSupervisor">指导老师 *</label>
                        <input type="text" id="editStudentSupervisor" value="${student.supervisor}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editStudentResearch">研究方向 *</label>
                        <textarea id="editStudentResearch" rows="4" required>${student.research}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editStudentEmail">邮箱</label>
                            <input type="email" id="editStudentEmail" value="${student.email || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="editStudentGithub">GitHub链接</label>
                            <input type="url" id="editStudentGithub" value="${student.github || ''}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="editStudentAvatar">头像URL</label>
                        <input type="url" id="editStudentAvatar" value="${student.avatar || ''}">
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                        <button type="submit" class="btn btn-primary">
                            ${isEditMode ? '更新学生信息' : '添加学生'}
                        </button>
                        ${isEditMode ? `
                            <button type="button" class="btn btn-danger delete-btn">
                                <i class="fas fa-trash"></i> 删除学生
                            </button>
                        ` : ''}
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    const form = modal.querySelector('#editStudentForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: modal.querySelector('#editStudentName').value,
            degree: modal.querySelector('#editStudentDegree').value,
            field: modal.querySelector('#editStudentField').value,
            supervisor: modal.querySelector('#editStudentSupervisor').value,
            research: modal.querySelector('#editStudentResearch').value,
            email: modal.querySelector('#editStudentEmail').value,
            github: modal.querySelector('#editStudentGithub').value,
            avatar: modal.querySelector('#editStudentAvatar').value || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        };
        
        if (isEditMode) {
            updateStudent(studentId, formData);
            showToast('学生信息更新成功！', 'success');
        } else {
            addStudent(formData);
            showToast('学生添加成功！', 'success');
        }
        
        closeModal(modal);
    });
    
    if (isEditMode) {
        modal.querySelector('.delete-btn').addEventListener('click', function() {
            if (confirm('确定要删除这位学生吗？此操作不可撤销。')) {
                deleteStudent(studentId);
                showToast('学生已删除', 'success');
                closeModal(modal);
            }
        });
    }
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => closeModal(modal));
    setupModalClose(modal);
}

// ============================
// 管理面板功能
// ============================

/**
 * 显示管理面板
 */
function showAdminPanel() {
    const modal = createModal();
    modal.innerHTML = `
        <div class="modal-content admin-panel">
            <div class="modal-header">
                <h3><i class="fas fa-cog"></i> 管理面板</h3>
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
                    </div>
                </div>
                
                <div class="admin-tools">
                    <h4>数据管理</h4>
                    <div class="tool-buttons">
                        <button class="btn btn-secondary" id="exportDataBtn">
                            <i class="fas fa-download"></i> 导出数据
                        </button>
                        <button class="btn btn-secondary" id="importDataBtn">
                            <i class="fas fa-upload"></i> 导入数据
                        </button>
                        <button class="btn btn-danger" id="resetDataBtn">
                            <i class="fas fa-redo"></i> 重置为默认数据
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
    
    modal.querySelector('#exportDataBtn').addEventListener('click', exportAllData);
    modal.querySelector('#importDataBtn').addEventListener('click', showImportDataDialog);
    modal.querySelector('#resetDataBtn').addEventListener('click', resetDataToDefault);
    
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
        exportDate: new Date().toISOString()
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
 * 导入数据
 */
function showImportDataDialog() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('导入数据将覆盖现有数据，确定要继续吗？')) {
                    // 验证数据格式
                    if (data.projects && Array.isArray(data.projects)) {
                        projectsData = data.projects;
                        advisorsData = data.advisors || advisorsData;
                        studentsData = data.students || studentsData;
                        publicationsData = data.publications || publicationsData;
                        updatesData = data.updates || updatesData;
                        
                        saveDataToLocalStorage();
                        
                        // 重新渲染所有组件
                        renderProjects(currentFilter);
                        renderAdvisors();
                        renderStudents();
                        renderPublications();
                        renderUpdates();
                        
                        showToast('数据导入成功！', 'success');
                    } else {
                        showToast('数据格式不正确', 'error');
                    }
                }
            } catch (error) {
                showToast('导入失败：文件格式错误', 'error');
            }
        };
        reader.readAsText(file);
    };
    
    fileInput.click();
}

/**
 * 重置数据为默认值
 */
function resetDataToDefault() {
    if (confirm('确定要重置所有数据为默认值吗？此操作不可撤销。')) {
        // 清除本地存储
        localStorage.removeItem(STORAGE_KEYS.PROJECTS);
        localStorage.removeItem(STORAGE_KEYS.ADVISORS);
        localStorage.removeItem(STORAGE_KEYS.STUDENTS);
        localStorage.removeItem(STORAGE_KEYS.PUBLICATIONS);
        localStorage.removeItem(STORAGE_KEYS.UPDATES);
        
        // 重新加载页面
        location.reload();
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
// 现有功能函数（保持不变）
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
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => modal.classList.add('show'), 10);
    
    setupModalClose(modal);
}

/**
 * 显示引用格式
 */
function showCitation(doi) {
    const citation = `请引用为：DOI: ${doi}`;
    alert(citation);
}

/**
 * 滚动到指定课题
 */
function scrollToProject(projectId) {
    const projectElement = document.querySelector(`.project-card[data-id="${projectId}"]`);
    if (projectElement) {
        const headerOffset = 80;
        const elementPosition = projectElement.offsetTop;
        const offsetPosition = elementPosition - headerOffset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
        
        // 高亮显示
        projectElement.style.boxShadow = '0 0 0 3px rgba(52, 152, 219, 0.3)';
        setTimeout(() => {
            projectElement.style.boxShadow = '';
        }, 2000);
    }
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
            localStorage.setItem(STORAGE_KEYS.PROJECT_FILTER, filter);
            
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
            localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
            this.innerHTML = '<i class="fas fa-sun"></i>';
            this.setAttribute('title', '切换到浅色模式');
        } else {
            localStorage.setItem(STORAGE_KEYS.THEME, 'light');
            this.innerHTML = '<i class="fas fa-moon"></i>';
            this.setAttribute('title', '切换到深色模式');
        }
    });
}

/**
 * 初始化主题
 */
function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    
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

/**
 * 初始化过滤器状态
 */
function initFilterState() {
    const savedFilter = localStorage.getItem(STORAGE_KEYS.PROJECT_FILTER) || 'all';
    
    // 设置活动按钮
    DOM.filterButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === savedFilter) {
            btn.classList.add('active');
        }
    });
    
    // 渲染对应过滤的课题
    renderProjects(savedFilter);
}

// ============================
// 表单处理
// ============================

/**
 * 设置表单提交
 */
function setupProjectForm() {
    if (!DOM.projectForm) return;
    
    DOM.projectForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            title: this.querySelector('#projectTitle').value,
            category: this.querySelector('#projectCategory').value,
            description: this.querySelector('#projectDescription').value,
            advisor: this.querySelector('#projectAdvisor').value,
            studentName: this.querySelector('#studentName').value,
            studentEmail: this.querySelector('#studentEmail').value,
            researchPlan: this.querySelector('#researchPlan').value
        };
        
        // 验证表单数据
        if (!validateFormData(formData)) {
            showFormMessage('请填写所有必填字段', 'error');
            return;
        }
        
        // 显示提交中状态
        const submitBtn = this.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
        submitBtn.disabled = true;
        
        // 模拟API调用
        setTimeout(() => {
            console.log('提交的数据：', formData);
            
            // 显示成功消息
            showFormMessage('课题提交成功！我们将在3个工作日内回复您。', 'success');
            
            // 重置表单
            this.reset();
            
            // 恢复按钮状态
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 1500);
    });
}

/**
 * 验证表单数据
 */
function validateFormData(data) {
    return data.title && data.category && data.description && 
           data.advisor && data.studentName && data.studentEmail;
}

/**
 * 显示表单消息
 */
function showFormMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message alert alert-${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    const form = DOM.projectForm;
    if (form) {
        form.insertBefore(messageDiv, form.firstChild);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
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
    adminBtn.innerHTML = '<i class="fas fa-cog"></i> 管理';
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
function init() {
    // 初始化本地存储
    initializeLocalStorage();
    
    // 渲染所有数据
    initFilterState();
    renderAdvisors();
    renderStudents();
    renderPublications();
    renderUpdates();
    
    // 设置事件监听
    setupFilterButtons();
    setupThemeToggle();
    setupMobileMenu();
    setupBackToTop();
    setupSmoothScroll();
    setupProjectForm();
    
    // 初始化状态
    initTheme();
    
    // 添加管理按钮
    addAdminButton();
    
    // 添加CSS样式
    addModalStyles();
    addToastStyles();
    addAdminStyles();
    
    console.log('实验室网站初始化完成');
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
    
    // 界面操作
    showEditProjectForm,
    showEditAdvisorForm,
    showEditStudentForm,
    showAdminPanel,
    
    // 工具函数
    saveDataToLocalStorage,
    exportAllData
};
