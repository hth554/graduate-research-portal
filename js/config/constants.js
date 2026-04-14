// js/config/constants.js
// 全局常量配置

// 分类名称映射表
export const CATEGORY_MAP = {
    'ai_model': '🤖 人工智能与大模型',
    'eco_remote_sensing': '🛰️ 生态遥感',
    'urban_ecology': '🌆 城市生态',
    'betel_nut_yellowing': '🌴 槟榔黄化病',
    'eco_process': '🌿 生态过程',
    'engineering': '⚙️ 工程技术',
    'science': '🔬 基础科学',
    'medical': '💊 医学健康',
    'humanities': '📚 人文社科'
};

// 状态颜色映射
export const STATUS_COLORS = {
    'preparation': '#f39c12',
    'in-progress': '#3498db',
    'completed': '#2ecc71',
    'pending': '#ff6b6b'
};

// 状态文本映射
export const STATUS_TEXT = {
    'preparation': '筹备中',
    'in-progress': '进行中',
    'completed': '已完成',
    'pending': '待审核'
};

// 成果类型颜色
export const TYPE_COLORS = {
    '期刊论文': '#2ecc71',
    '会议论文': '#9b59b6',
    '专利': '#e74c3c',
    '专著': '#f39c12',
    '技术报告': '#3498db',
    '项目进展': '#2ecc71',
    '学术活动': '#9b59b6',
    '科研资助': '#e74c3c',
    '技术转化': '#f39c12',
    '学生荣誉': '#1abc9c',
    '产学研合作': '#34495e'
};

// GitHub 仓库配置
export const GITHUB_CONFIG = {
    owner: 'HTH554',
    repo: 'graduate-research-portal',
    branch: 'main',
    dataPath: 'data'
};

// 本地存储键名
export const STORAGE_KEYS = {
    TOKEN: 'github_pat_token',
    THEME: 'lab_theme_preference',
    DATA_CACHE: 'research_portal_data',
    FILTER_STATE: 'project_filter_state'
};