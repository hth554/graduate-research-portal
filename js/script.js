// 数据模型
const projectsData = [
    {
        id: 1,
        title: "基于深度学习的医学图像分割算法研究",
        category: "medical",
        description: "本研究旨在开发一种高效的深度学习算法，用于医学图像中的器官与病变区域自动分割，提高诊断准确性与效率。",
        advisor: "张明教授",
        status: "进行中",
        image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: 2,
        title: "可再生能源智能微电网优化控制策略",
        category: "engineering",
        description: "研究微电网中太阳能、风能等可再生能源的集成优化控制策略，提高能源利用效率与系统稳定性。",
        advisor: "李华教授",
        status: "进行中",
        image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: 3,
        title: "新型纳米材料在环境污染物去除中的应用",
        category: "science",
        description: "探索新型纳米材料在废水处理与空气净化中的应用潜力，开发高效、低成本的环境修复技术。",
        advisor: "王静教授",
        status: "已完成",
        image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: 4,
        title: "人工智能辅助的金融风险预测模型",
        category: "science",
        description: "构建基于机器学习与深度学习的金融风险预测模型，提高金融机构的风险识别与防范能力。",
        advisor: "赵伟教授",
        status: "进行中",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: 5,
        title: "数字化转型对企业组织文化的影响研究",
        category: "humanities",
        description: "探究数字化转型过程中企业组织文化的变迁机制，为企业数字化转型提供管理策略建议。",
        advisor: "刘芳教授",
        status: "进行中",
        image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: 6,
        title: "新型肿瘤靶向药物递送系统研究",
        category: "medical",
        description: "开发基于纳米技术的肿瘤靶向药物递送系统，提高抗癌药物在肿瘤部位的富集与疗效。",
        advisor: "陈晨教授",
        status: "筹备中",
        image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    }
];

const advisorsData = [
    {
        id: 1,
        name: "张明",
        title: "教授，博士生导师",
        field: "医学人工智能，医学图像处理",
        bio: "清华大学医学院教授，长期从事医学人工智能研究，在国内外顶级期刊发表论文100余篇。",
        avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    {
        id: 2,
        name: "李华",
        title: "教授，博士生导师",
        field: "电力系统，可再生能源",
        bio: "北京大学工学院教授，国家杰出青年科学基金获得者，主要从事智能电网与可再生能源研究。",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    {
        id: 3,
        name: "王静",
        title: "教授，博士生导师",
        field: "环境工程，纳米材料",
        bio: "浙江大学环境学院教授，长江学者特聘教授，致力于环境功能材料与污染控制技术研究。",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    {
        id: 4,
        name: "赵伟",
        title: "教授，博士生导师",
        field: "金融工程，人工智能",
        bio: "上海交通大学安泰经济与管理学院教授，研究方向为金融科技、风险管理与人工智能。",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    }
];

const timelineData = [
    {
        id: 1,
        date: "2023-09",
        title: "医学图像分割算法初步验证",
        description: "完成深度学习模型在公开医学图像数据集上的初步验证，分割准确率达到92%。",
        project: "基于深度学习的医学图像分割算法研究"
    },
    {
        id: 2,
        date: "2023-08",
        title: "微电网控制策略仿真成功",
        description: "成功仿真验证了提出的可再生能源微电网优化控制策略，系统稳定性提升15%。",
        project: "可再生能源智能微电网优化控制策略"
    },
    {
        id: 3,
        date: "2023-07",
        title: "纳米材料合成方法优化",
        description: "优化了新型纳米材料的合成方法，材料比表面积提升30%，污染物吸附能力显著增强。",
        project: "新型纳米材料在环境污染物去除中的应用"
    },
    {
        id: 4,
        date: "2023-06",
        title: "金融风险预测模型构建完成",
        description: "完成了基于深度学习的金融风险预测模型构建，在测试集上准确率达到88%。",
        project: "人工智能辅助的金融风险预测模型"
    },
    {
        id: 5,
        date: "2023-05",
        title: "企业数字化转型调研完成",
        description: "完成对50家数字化转型企业的深度调研，收集了组织文化变迁的一手数据。",
        project: "数字化转型对企业组织文化的影响研究"
    }
];

const publicationsData = [
    {
        id: 1,
        type: "期刊论文",
        title: "基于注意力机制的医学图像分割算法研究",
        authors: "张明, 李雷, 韩梅梅",
        venue: "《中国医学影像学杂志》, 2023, 31(5): 12-18",
        abstract: "本文提出了一种基于注意力机制的深度学习模型，用于医学图像中的器官分割..."
    },
    {
        id: 2,
        type: "会议论文",
        title: "可再生能源微电网的优化调度策略",
        authors: "李华, 王强, 张伟",
        venue: "IEEE电力与能源系统国际会议, 2023",
        abstract: "本文提出了一种基于强化学习的微电网优化调度策略，有效提高了可再生能源的消纳能力..."
    },
    {
        id: 3,
        type: "专利",
        title: "一种高效去除重金属离子的纳米复合材料制备方法",
        authors: "王静, 刘洋, 陈晨",
        venue: "中国发明专利, ZL202310123456.7, 2023",
        abstract: "本发明公开了一种高效去除水中重金属离子的纳米复合材料及其制备方法..."
    },
    {
        id: 4,
        type: "期刊论文",
        title: "数字化转型背景下组织文化变革路径研究",
        authors: "刘芳, 赵明, 孙丽",
        venue: "《管理科学学报》, 2023, 26(3): 45-56",
        abstract: "本研究基于组织变革理论，探讨了数字化转型过程中企业组织文化的变革路径与影响因素..."
    }
];

const resourcesData = [
    {
        id: 1,
        icon: "fas fa-book",
        title: "学术文献数据库",
        description: "提供CNKI、Web of Science、IEEE Xplore等国内外知名学术数据库的访问指南与使用技巧。"
    },
    {
        id: 2,
        icon: "fas fa-tools",
        title: "研究工具集",
        description: "统计分析、文献管理、科研绘图等常用科研工具的使用教程与资源下载。"
    },
    {
        id: 3,
        icon: "fas fa-file-contract",
        title: "论文写作指南",
        description: "学术论文写作规范、投稿流程、审稿意见回复策略等实用指南与模板。"
    },
    {
        id: 4,
        icon: "fas fa-chart-line",
        title: "数据分析资源",
        description: "Python、R、MATLAB等数据分析工具的学习资源与代码示例，助力科研数据分析。"
    },
    {
        id: 5,
        icon: "fas fa-graduation-cap",
        title: "学术伦理指南",
        description: "学术诚信、研究伦理、数据管理规范等重要的学术伦理指南与政策文件。"
    },
    {
        id: 6,
        icon: "fas fa-comments",
        title: "学术交流平台",
        description: "国内外学术会议信息、研究生论坛、学术沙龙等学术交流机会与平台。"
    }
];

// DOM元素
const projectsGrid = document.querySelector('.projects-grid');
const advisorsGrid = document.querySelector('.advisors-grid');
const timeline = document.querySelector('.timeline');
const publicationsGrid = document.querySelector('.publications-grid');
const resourcesGrid = document.querySelector('.resources-grid');
const filterButtons = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('theme-toggle');
const hamburger = document.getElementById('hamburger');
const navMenu = document.querySelector('.nav-menu');
const backToTop = document.getElementById('backToTop');
const navLinks = document.querySelectorAll('.nav-link');

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    renderProjects('all');
    renderAdvisors();
    renderTimeline();
    renderPublications();
    renderResources();
    
    // 设置活动导航链接
    setActiveNavLink();
    
    // 初始化主题
    initTheme();
});

// 渲染课题卡片
function renderProjects(filter = 'all') {
    projectsGrid.innerHTML = '';
    
    let filteredProjects = projectsData;
    if (filter !== 'all') {
        filteredProjects = projectsData.filter(project => project.category === filter);
    }
    
    filteredProjects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.setAttribute('data-category', project.category);
        
        // 根据状态设置颜色
        let statusColor = '#1abc9c'; // 默认绿色
        if (project.status === '进行中') statusColor = '#3498db'; // 蓝色
        if (project.status === '筹备中') statusColor = '#f39c12'; // 橙色
        if (project.status === '已完成') statusColor = '#2ecc71'; // 绿色
        
        projectCard.innerHTML = `
            <div class="project-image">
                <img src="${project.image}" alt="${project.title}">
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
            </div>
        `;
        
        projectsGrid.appendChild(projectCard);
    });
}

// 获取分类名称
function getCategoryName(category) {
    const categoryMap = {
        'engineering': '工程科学',
        'science': '自然科学',
        'humanities': '人文社科',
        'medical': '医学健康'
    };
    return categoryMap[category] || category;
}

// 渲染导师卡片
function renderAdvisors() {
    advisorsGrid.innerHTML = '';
    
    advisorsData.forEach(advisor => {
        const advisorCard = document.createElement('div');
        advisorCard.className = 'advisor-card';
        
        advisorCard.innerHTML = `
            <div class="advisor-avatar">
                <img src="${advisor.avatar}" alt="${advisor.name}">
            </div>
            <h3 class="advisor-name">${advisor.name}</h3>
            <p class="advisor-title">${advisor.title}</p>
            <p class="advisor-field">${advisor.field}</p>
            <p class="advisor-bio">${advisor.bio}</p>
            <div class="advisor-contact">
                <a href="#"><i class="fas fa-envelope"></i></a>
                <a href="#"><i class="fas fa-globe"></i></a>
                <a href="#"><i class="fab fa-google-scholar"></i></a>
            </div>
        `;
        
        advisorsGrid.appendChild(advisorCard);
    });
}

// 渲染时间轴
function renderTimeline() {
    timeline.innerHTML = '';
    
    timelineData.forEach((item, index) => {
        const timelineItem = document.createElement('div');
        timelineItem.className = `timeline-item ${index % 2 === 0 ? 'odd' : 'even'}`;
        
        timelineItem.innerHTML = `
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <span class="timeline-date">${item.date}</span>
                <h3 class="timeline-title">${item.title}</h3>
                <p class="timeline-description">${item.description}</p>
                <div class="timeline-project">
                    <i class="fas fa-project-diagram"></i>
                    <span>${item.project}</span>
                </div>
            </div>
        `;
        
        timeline.appendChild(timelineItem);
    });
}

// 渲染学术成果
function renderPublications() {
    publicationsGrid.innerHTML = '';
    
    publicationsData.forEach(publication => {
        const publicationCard = document.createElement('div');
        publicationCard.className = 'publication-card';
        
        // 根据类型设置颜色
        let typeColor = '#3498db'; // 默认蓝色
        if (publication.type === '期刊论文') typeColor = '#2ecc71'; // 绿色
        if (publication.type === '会议论文') typeColor = '#9b59b6'; // 紫色
        if (publication.type === '专利') typeColor = '#e74c3c'; // 红色
        
        publicationCard.innerHTML = `
            <div class="publication-header">
                <span class="publication-type" style="background-color: ${typeColor}20; color: ${typeColor}">${publication.type}</span>
                <h3 class="publication-title">${publication.title}</h3>
                <p class="publication-authors">${publication.authors}</p>
                <p class="publication-venue">${publication.venue}</p>
            </div>
            <div class="publication-body">
                <p class="publication-abstract">${publication.abstract}</p>
                <div class="publication-links">
                    <a href="#" class="publication-link">
                        <i class="fas fa-file-pdf"></i>
                        <span>全文下载</span>
                    </a>
                    <a href="#" class="publication-link">
                        <i class="fas fa-quote-right"></i>
                        <span>引用</span>
                    </a>
                </div>
            </div>
        `;
        
        publicationsGrid.appendChild(publicationCard);
    });
}

// 渲染研究资源
function renderResources() {
    resourcesGrid.innerHTML = '';
    
    resourcesData.forEach(resource => {
        const resourceCard = document.createElement('div');
        resourceCard.className = 'resource-card';
        
        resourceCard.innerHTML = `
            <div class="resource-icon">
                <i class="${resource.icon}"></i>
            </div>
            <h3 class="resource-title">${resource.title}</h3>
            <p class="resource-description">${resource.description}</p>
            <a href="#" class="resource-link">
                <span>访问资源</span>
                <i class="fas fa-arrow-right"></i>
            </a>
        `;
        
        resourcesGrid.appendChild(resourceCard);
    });
}

// 过滤课题
filterButtons.forEach(button => {
    button.addEventListener('click', function() {
        // 移除所有按钮的active类
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        // 为当前点击的按钮添加active类
        this.classList.add('active');
        
        // 获取过滤条件
        const filter = this.getAttribute('data-filter');
        
        // 渲染过滤后的课题
        renderProjects(filter);
    });
});

// 切换主题
themeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        this.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        localStorage.setItem('theme', 'light');
        this.innerHTML = '<i class="fas fa-moon"></i>';
    }
});

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// 移动端导航菜单切换
hamburger.addEventListener('click', function() {
    this.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// 点击导航链接关闭移动端菜单
navLinks.forEach(link => {
    link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        
        // 设置活动导航链接
        navLinks.forEach(item => item.classList.remove('active'));
        this.classList.add('active');
    });
});

// 返回顶部按钮
window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }
    
    // 设置活动导航链接
    setActiveNavLink();
});

backToTop.addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// 设置活动导航链接
function setActiveNavLink() {
    const sections = document.querySelectorAll('section');
    const scrollPos = window.pageYOffset + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// 平滑滚动到锚点
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});
