# 新闻展示Web服务器

基于Express和MongoDB的新闻内容展示系统，支持新闻列表展示、详情查看和API接口。

## 功能特性

- 📰 新闻列表展示（支持分页）
- 📖 新闻详情页面
- 🔍 AI摘要显示
- 📱 响应式设计
- 🚀 RESTful API接口
- 🎨 Bootstrap UI框架

## 技术栈

- **后端**: Node.js + Express
- **数据库**: MongoDB
- **模板引擎**: EJS
- **前端**: Bootstrap 5 + 原生JavaScript
- **其他**: Moment.js (日期处理)

## 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
创建 `.env` 文件（可选）：
```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=news_db
PORT=3000
```

### 3. 启动服务器
```bash
# 生产环境
npm start

# 开发环境（需要安装nodemon）
npm run dev
```

### 4. 访问应用
- 网站首页: http://localhost:3000
- API接口: http://localhost:3000/api/news

## API接口

### 获取新闻列表
```
GET /api/news?page=1&limit=10&blog_type=公司
```

**参数说明:**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `blog_type`: 新闻类型筛选（可选）

**响应示例:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 获取单条新闻
```
GET /api/news/:id
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "_id": "687c9cc87a7fd4da40554fc5",
    "title": "A $50 million fund to build with communities",
    "blog_type": "公司",
    "ai_summary": "...",
    ...
  }
}
```

## 数据库结构

新闻文档结构示例：
```javascript
{
  "_id": ObjectId("687c9cc87a7fd4da40554fc5"),
  "title": "A $50 million fund to build with communities",
  "blog_type": "公司",
  "publish_date": "2025-07-18T00:00",
  "article_link": "https://openai.com/index/50-million-fund-to-build-with-communities/",
  "author": "OpenAI",
  "source_type": "company",
  "crawl_time": "2025-07-20T07:17:53.172Z",
  "content_hash": "671b6b651f56e1a5e19f218a247c40ea",
  "ai_summary": "OpenAI宣布设立5000万美元基金...",
  "summary_generated_at": "2025-07-20T07:27:05.088Z",
  "summary_status": "success",
  "original_content_length": 2032
}
```

## 页面路由

- `/` - 新闻列表首页
- `/news/:id` - 新闻详情页
- `/api/news` - 新闻列表API
- `/api/news/:id` - 单条新闻API

## 开发说明

### 项目结构
```
├── server.js          # 主服务器文件
├── package.json       # 项目配置
├── views/            # EJS模板文件
│   ├── layout.ejs    # 布局模板
│   ├── index.ejs     # 首页模板
│   ├── detail.ejs    # 详情页模板
│   └── error.ejs     # 错误页模板
├── public/           # 静态资源
│   ├── css/
│   │   └── style.css # 自定义样式
│   └── js/
│       └── main.js   # 前端JavaScript
└── README.md         # 项目说明
```

### 自定义配置
- 修改 `server.js` 中的数据库连接配置
- 调整 `COLLECTION_NAME` 变量来匹配你的集合名称
- 根据需要修改分页大小和其他参数

## 注意事项

1. 确保MongoDB服务正在运行
2. 数据库中需要有名为 `news` 的集合
3. 新闻文档需要包含必要的字段（title, publish_date等）
4. 生产环境建议使用环境变量配置数据库连接

## 许可证

MIT License