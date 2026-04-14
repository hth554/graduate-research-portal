// js/config/default-data.js
// 唯一的默认数据源，当 GitHub 拉取失败时使用

export const DEFAULT_PROJECTS = [
    {
        id: 1,
        title: "人工智能驱动的 GEMS 模型部署、验证与应用",
        category: "ai_model",
        description: "本课题聚焦人工智能大模型与 GEMS 模型的融合应用，以海南区域为核心研究场景，围绕海洋动力、森林生态两大领域，构建“模型运行 - AI 部署 - 数据同化 - 实地验证”的全流程技术体系。",
        advisor: "刘曙光教授",
        status: "进行中",
        statusType: "in-progress",
        image: "https://s41.ax1x.com/2025/12/29/pZtP2RA.png",
        createdAt: "2025-12-25",
        updatedAt: "2025-12-29"
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
    }
];

export const DEFAULT_ADVISORS = [
    {
        id: 1,
        name: "刘曙光",
        title: "教授，硕士/博士生导师",
        field: "碳循环、水循环、生态系统功能和服务",
        bio: "国家海外引进高级人才、中组部'千人计划'入选者，与中科院合作证实成熟森林土壤可累积碳，推翻经典理论，成果发表于《SCIENCE》并入选'中国科学10大进展'；研发 GEMS 生物地球化学循环模型、SkyCenterESM 生态系统服务核算模型，主导完成美国全域生态系统固碳与减排潜力评估。",
        avatar: "https://s41.ax1x.com/2025/12/14/pZMqFfI.png",
        email: "shuguang.liu@hainanu.edu.cn",
        website: "https://ecology.hainanu.edu.cn/info/1121/5440.html",
        createdAt: "2022-01-10",
        updatedAt: "2023-10-20"
    },
    {
        id: 2,
        name: "赵淑清",
        title: "教授，硕士/博士生导师",
        field: "城市生态学",
        bio: "创新性建立了城市化对植被生长影响的理论与定量方法，在 PNAS 发文证实城市环境对植被生长的普遍促进作用，该成果被学界广泛验证应用；提出解释城市化生物多样性梯度的'热促进和胁迫平衡假说'，构建了我国城市生态系统有机碳储量评估体系，还搭建了北京城乡生态梯度长期研究平台（BES）。",
        avatar: "https://s41.ax1x.com/2025/12/14/pZMqApt.png",
        email: "shuqing.zhao@hainanu.edu.cn",
        website: "https://ecology.hainanu.edu.cn/info/1121/5450.htm",
        createdAt: "2022-02-15",
        updatedAt: "2023-09-15"
    }
];

export const DEFAULT_STUDENTS = [
    {
        id: 1,
        name: "张鹏",
        degree: "博士后",
        field: "城市生态",
        supervisor: "赵淑清教授",
        research: "城市森林，城市土壤",
        avatar: "https://s41.ax1x.com/2025/12/24/pZGt2qO.jpg",
        email: "zhangpeng@example.com",
        github: "https://github.com/zhangpeng",
        createdAt: "2022-09-01",
        updatedAt: "2023-10-15"
    }
];

export const DEFAULT_PUBLICATIONS = [
    {
        id: 1,
        type: "期刊论文",
        title: "基于注意力机制的医学图像分割算法研究",
        authors: "张明, 李雷, 韩梅梅",
        venue: "《中国医学影像学杂志》, 2023, 31(5): 12-18",
        abstract: "本文提出了一种基于注意力机制的深度学习模型，用于医学图像中的器官分割。",
        doi: "10.1234/j.issn.1000-1234.2023.05.002",
        link: "https://example.com/paper1",
        createdAt: "2023-05-15",
        updatedAt: "2023-10-20"
    }
];

export const DEFAULT_UPDATES = [
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
    }
];