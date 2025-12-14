# 研究生课题展示与管理门户网站

这是一个现代化、响应式的研究生课题展示与管理门户网站，采用简洁专业的学术风格设计，旨在为高校研究生和导师提供全面的课题信息展示、研究进度跟踪和学术资源整合服务。

## 功能特点

- **课题展示区**：展示各学科领域的前沿研究方向与创新项目
- **导师介绍**：展示优秀导师团队信息与研究领域
- **研究进展时间轴**：跟踪各课题的最新研究进展与里程碑
- **学术成果发布**：展示最新发表的论文、专利与学术成果
- **研究资源模块**：提供学术工具、数据库与研究资料
- **响应式设计**：支持多终端自适应访问
- **暗色/亮色主题**：支持主题切换，保护视力
- **流畅交互**：平滑滚动、动态过滤、移动端友好

## 部署到GitHub Pages

### 方法一：直接上传文件
1. 在GitHub上创建一个新的仓库，命名为 `graduate-research-portal`
2. 将本项目的所有文件上传到仓库
3. 进入仓库设置，找到 "Pages" 选项
4. 在 "Source" 下拉菜单中选择 "main" 分支，然后点击 "Save"
5. 稍等几分钟，GitHub Pages 将生成网站链接

### 方法二：使用Git命令行
\`\`\`bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交更改
git commit -m "初始提交：研究生课题展示与管理门户网站"

# 添加远程仓库
git remote add origin https://github.com/你的用户名/graduate-research-portal.git

# 推送到GitHub
git branch -M main
git push -u origin main
\`\`\`

## 项目结构

\`\`\`
graduate-research-portal/
├── index.html              # 主HTML文件
├── css/
│   └── style.css          # 样式文件
├── js/
│   └── script.js          # JavaScript文件
├── images/                # 图片目录
├── assets/                # 资源文件目录
├── resources/             # 研究资源目录
└── README.md             # 项目说明文件
\`\`\`

## 本地运行

1. 下载或克隆本项目到本地
2. 使用任何现代浏览器打开 \`index.html\` 文件
3. 或者使用本地服务器运行（如使用Python）：
   \`\`\`bash
   python3 -m http.server 8000
   \`\`\`
   然后在浏览器中访问 \`http://localhost:8000\`

## 自定义内容

### 修改课题数据
编辑 \`js/script.js\` 文件中的 \`projectsData\` 数组，添加或修改课题信息。

### 修改导师信息
编辑 \`js/script.js\` 文件中的 \`advisorsData\` 数组，更新导师信息。

### 修改学术成果
编辑 \`js/script.js\` 文件中的 \`publicationsData\` 数组，更新学术成果信息。

### 修改研究资源
编辑 \`js/script.js\` 文件中的 \`resourcesData\` 数组，更新研究资源信息。

## 技术栈

- HTML5
- CSS3 (Flexbox, Grid, CSS Variables)
- JavaScript (ES6+)
- Font Awesome 图标
- Google Fonts 字体

## 许可证

本项目采用 MIT 许可证。

## 联系信息

如有问题或建议，请通过以下方式联系：
- 邮箱：research@university.edu.cn
- 地址：北京市海淀区学院路37号
