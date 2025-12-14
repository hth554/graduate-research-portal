// ============================
// 数据模型与配置
// ============================

const projectsData = [
    {
        id: 1,
        title: "基于深度学习的医学图像分割算法研究",
        category: "medical",
        description: "本研究旨在开发一种高效的深度学习算法，用于医学图像中的器官与病变区域自动分割，提高诊断准确性与效率。",
        advisor: "张明教授",
        status: "进行中",
        statusType: "in-progress",
        image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: 2,
        title: "可再生能源智能微电网优化控制策略",
        category: "engineering",
        description: "研究微电网中太阳能、风能等可再生能源的集成优化控制策略，提高能源利用效率与系统稳定性。",
        advisor: "李华教授",
        status: "进行中",
        statusType: "in-progress",
        image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: 3,
        title: "新型纳米材料在环境污染物去除中的应用",
        category: "science",
        description: "探索新型纳米材料在废水处理与空气净化中的应用潜力，开发高效、低成本的环境修复技术。",
        advisor: "王静教授",
        status: "已完成",
        statusType: "completed",
        image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: 4,
        title: "人工智能辅助的金融风险预测模型",
        category: "science",
        description: "构建基于机器学习与深度学习的金融风险预测模型，提高金融机构的风险识别与防范能力。",
        advisor: "赵伟教授",
        status: "进行中",
        statusType: "in-progress",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: 5,
        title: "数字化转型对企业组织文化的影响研究",
        category: "humanities",
        description: "探究数字化转型过程中企业组织文化的变迁机制，为企业数字化转型提供管理策略建议。",
        advisor: "刘芳教授",
        status: "进行中",
        statusType: "in-progress",
        image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: 6,
        title: "新型肿瘤靶向药物递送系统研究",
        category: "medical",
        description: "开发基于纳米技术的肿瘤靶向药物递送系统，提高抗癌药物在肿瘤部位的富集与疗效。",
        advisor: "陈晨教授",
        status: "筹备中",
        statusType: "preparation",
        image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    }
];

const advisorsData = [
    {
        id: 1,
        name: "刘曙光",
        title: "教授，博士生导师",
        field: "碳循环、水循环、生态系统功能和服务",
        bio: "国家海外引进高级人才、中组部 '千人计划' 入选者，与中科院合作证实成熟森林土壤可累积碳，推翻经典理论，成果发表于《SCIENCE》并入选 '中国科学10大进展'；研发 GEMS 生物地球化学循环模型、SkyCenterESM 生态系统服务核算模型，主导完成美国全域生态系统固碳与减排潜力评估。",
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        email: "liusg@example.com",
        website: "https://example.com/liusg"
    },
    {
        id: 2,
        name: "赵淑清",
        title: "教授，博士生导师",
        field: "城市生态学",
        bio: "创新性建立了城市化对植被生长影响的理论与定量方法，在 PNAS 发文证实城市环境对植被生长的普遍促进作用，该成果被学界广泛验证应用；提出解释城市化生物多样性梯度的 '热促进和胁迫平衡假说'，构建了我国城市生态系统有机碳储量评估体系，还搭建了北京城乡生态梯度长期研究平台（BES）。",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        email: "zhaosq@example.com",
        website: "https://example.com/zhaosq"
    },
    {
        id: 3,
        name: "王静",
        title: "教授，博士生导师",
        field: "环境工程，纳米材料",
        bio: "浙江大学环境学院教授，长江学者特聘教授，致力于环境功能材料与污染控制技术研究，在国际知名期刊发表论文150余篇，获国家科技进步二等奖2项。",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        email: "wangjing@example.com",
        website: "https://example.com/wangjing"
    },
    {
        id: 4,
        name: "赵伟",
        title: "教授，博士生导师",
        field: "金融工程，人工智能",
        bio: "上海交通大学安泰经济与管理学院教授，研究方向为金融科技、风险管理与人工智能，主持国家自然科学基金重点项目3项，出版专著5部。",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        email: "zhaowei@example.com",
        website: "https://example.com/zhaowei"
    }
];

const studentsData = [
    {
        id: 1,
        name: "李明",
        degree: "博士研究生",
        field: "计算机科学与技术",
        supervisor: "张明教授",
        research: "研究方向为医学图像处理与深度学习，主要研究基于注意力机制的医学图像分割算法。",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        email: "liming@example.com",
        github: "https://github.com/liming"
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
        github: "https://github.com/wangfang"
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
        github: "https://github.com/zhangwei"
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
        github: "https://github.com/liuyang"
    }
];

const publicationsData = [
    {
        id: 1,
        type: "期刊论文",
        title: "基于注意力机制的医学图像分割算法研究",
        authors: "张明, 李雷, 韩梅梅",
        venue: "《中国医学影像学杂志》, 2023, 31(5): 12-18",
        abstract: "本文提出了一种基于注意力机制的深度学习模型，用于医学图像中的器官分割，通过自注意力机制有效捕捉图像中的长距离依赖关系，在多个公开数据集上取得了最优性能。",
        doi: "10.1234/j.issn.1000-1234.2023.05.002",
        link: "https://example.com/paper1"
    },
    {
        id: 2,
        type: "会议论文",
        title: "可再生能源微电网的优化调度策略",
        authors: "李华, 王强, 张伟",
        venue: "IEEE电力与能源系统国际会议, 2023",
        abstract: "本文提出了一种基于强化学习的微电网优化调度策略，有效提高了可再生能源的消纳能力，降低了系统运行成本，并通过仿真验证了其有效性。",
        doi: "10.1109/ICPES.2023.1234567",
        link: "https://example.com/paper2"
    },
    {
        id: 3,
        type: "专利",
        title: "一种高效去除重金属离子的纳米复合材料制备方法",
        authors: "王静, 刘洋, 陈晨",
        venue: "中国发明专利, ZL202310123456.7, 2023",
        abstract: "本发明公开了一种高效去除水中重金属离子的纳米复合材料及其制备方法，该材料具有高吸附容量和良好的再生性能，适用于工业废水处理。",
        link: "https://example.com/patent1"
    },
    {
        id: 4,
        type: "期刊论文",
        title: "数字化转型背景下组织文化变革路径研究",
        authors: "刘芳, 赵明, 孙丽",
        venue: "《管理科学学报》, 2023, 26(3): 45-56",
        abstract: "本研究基于组织变革理论，探讨了数字化转型过程中企业组织文化的变革路径与影响因素，提出了适应数字时代的企业文化构建框架。",
        doi: "10.1234/j.cnki.1671-9301.2023.03.005",
        link: "https://example.com/paper3"
    }
];

const updatesData = [
    {
        id: 1,
        date: "2023-10-15",
        title: "医学图像分割项目取得重要进展",
        type: "项目进展",
        content: "课题组在医学图像分割算法研究中取得重要突破，新提出的注意力机制模型在公开数据集上的分割准确率达到了95.2%，较现有方法提升了3.1%。",
        project: "基于深度学习的医学图像分割算法研究",
        projectId: 1
    },
    {
        id: 2,
        date: "2023-10-08",
        title: "课题组参加国际学术会议",
        type: "学术活动",
        content: "课题组三名研究生参加了在杭州举办的国际人工智能大会，展示了最新的研究成果，并与国内外同行进行了深入交流。",
        project: "人工智能辅助的金融风险预测模型",
        projectId: 4
    },
    {
        id: 3,
        date: "2023-09-25",
        title: "纳米材料研究获得国家自然科学基金资助",
        type: "科研资助",
        content: "课题组申报的'新型纳米材料在环境污染物去除中的机理与应用研究'项目获得国家自然科学基金面上项目资助，资助金额80万元。",
        project: "新型纳米材料在环境污染物去除中的应用",
        projectId: 3
    },
    {
        id: 4,
        date: "2023-09-18",
        title: "微电网控制策略实现现场应用",
        type: "技术转化",
        content: "课题组研发的可再生能源微电网优化控制策略在某工业园区实现现场应用，系统运行稳定性显著提升，能源利用率提高了18%。",
        project: "可再生能源智能微电网优化控制策略",
        projectId: 2
    },
    {
        id: 5,
        title: "博士生李明获得优秀研究生称号",
        date: "2023-09-10",
        type: "学生荣誉",
        content: "课题组博士生李明因在医学图像分割领域的突出研究成果，获得学校'优秀研究生'荣誉称号。",
        project: "基于深度学习的医学图像分割算法研究",
        projectId: 1
    },
    {
        id: 6,
        title: "课题组与企业签订合作研究协议",
        date: "2023-09-05",
        type: "产学研合作",
        content: "课题组与某知名金融科技公司签订合作研究协议，共同开展金融风险智能预警系统的研发与应用。",
        project: "人工智能辅助的金融风险预测模型",
        projectId: 4
    }
];

// ============================
// 配置常量
// ============================

const CONFIG = {
    STORAGE_KEYS: {
        THEME: 'lab_theme_preference',
        PROJECT_FILTER: 'project_filter_state'
    },
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark'
    },
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
    projectForm: document.getElementById('projectForm'),
    projectsList: document.getElementById('projects-list')
};

// ============================
// 工具函数
// ============================

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
// 渲染函数
// ============================

/**
 * 渲染课题卡片
 */
function renderProjects(filter = 'all') {
    if (!DOM.projectsGrid) return;
    
    DOM.projectsGrid.innerHTML = '';
    
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
                <button class="btn btn-outline project-details-btn" data-id="${project.id}">
                    查看详情
                </button>
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
}

/**
 * 渲染导师卡片
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
                <a href="#" title="研究成果">
                    <i class="fas fa-file-alt"></i>
                </a>
            </div>
        `;
        
        DOM.advisorsGrid.appendChild(advisorCard);
    });
}

/**
 * 渲染学生卡片
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
                <a href="#" title="学术主页">
                    <i class="fab fa-google-scholar"></i>
                </a>
                <a href="#" title="个人简历">
                    <i class="fas fa-file-pdf"></i>
                </a>
            </div>
        `;
        
        DOM.studentsGrid.appendChild(studentCard);
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
            localStorage.setItem(CONFIG.STORAGE_KEYS.PROJECT_FILTER, filter);
            
            // 渲染过滤后的课题
            renderProjects(filter);
            
            // 滚动到课题区域
            document.getElementById('projects').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
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
            localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, CONFIG.THEMES.DARK);
            this.innerHTML = '<i class="fas fa-sun"></i>';
            this.setAttribute('title', '切换到浅色模式');
        } else {
            localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, CONFIG.THEMES.LIGHT);
            this.innerHTML = '<i class="fas fa-moon"></i>';
            this.setAttribute('title', '切换到深色模式');
        }
    });
}

/**
 * 初始化主题
 */
function initTheme() {
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
    
    if (savedTheme === CONFIG.THEMES.DARK) {
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
 * 显示课题详情
 */
function showProjectDetails(projectId) {
    const project = projectsData.find(p => p.id == projectId);
    if (!project) return;
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
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
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 显示模态框
    setTimeout(() => modal.classList.add('show'), 10);
    
    // 关闭模态框
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
    
    // 点击外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    });
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

/**
 * 初始化过滤器状态
 */
function initFilterState() {
    const savedFilter = localStorage.getItem(CONFIG.STORAGE_KEYS.PROJECT_FILTER) || 'all';
    
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
            // 这里可以替换为实际的API调用
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
    form.insertBefore(messageDiv, form.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// ============================
// 初始化
// ============================

/**
 * 初始化所有功能
 */
function init() {
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
    
    // 添加模态框样式
    addModalStyles();
    
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
        
        .project-details-btn {
            margin-top: 15px;
            width: 100%;
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
    renderProjects,
    renderAdvisors,
    renderStudents,
    renderPublications,
    renderUpdates,
    showProjectDetails,
    scrollToProject
};
