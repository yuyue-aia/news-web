const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const moment = require('moment');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

// MongoDB连接配置 - Clacky Environment
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://admin:dzXAsmSh@127.0.0.1:27017/admin";
const DB_NAME = process.env.DB_NAME || 'news_db';
const COLLECTION_NAME = 'news';

let db;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 连接MongoDB
async function connectDB() {
  try {
    console.log('正在连接MongoDB...');
    console.log('连接字符串:', MONGODB_URI);
    console.log('目标数据库:', DB_NAME);
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    // 检查news集合
    const newsCount = await db.collection(COLLECTION_NAME).countDocuments();
    console.log(`${COLLECTION_NAME}集合中有 ${newsCount} 条记录`);
    
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
}

// 首页路由 - 显示新闻列表（时间轴模式）
app.get('/', async (req, res) => {
  try {
    const limit = 15; // 初始加载更多条目
    
    const news = await db.collection(COLLECTION_NAME)
      .find({})
      .sort({ publish_date: -1 })
      .limit(limit)
      .toArray();
    
    const totalNews = await db.collection(COLLECTION_NAME).countDocuments();
    const hasMore = news.length === limit && totalNews > limit;
    
    // 按日期分组新闻
    const newsGroupedByDate = groupNewsByDate(news);
    
    res.render('index', {
      newsGroupedByDate,
      hasMore,
      totalNews,
      moment
    });
  } catch (error) {
    console.error('获取新闻列表失败:', error);
    res.status(500).render('error', { message: '服务器错误' });
  }
});

// 按日期分组新闻的辅助函数
function groupNewsByDate(news) {
  const grouped = {};
  
  news.forEach(article => {
    const dateKey = moment(article.publish_date).format('MM-DD');
    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        date: dateKey,
        fullDate: moment(article.publish_date).format('YYYY-MM-DD'),
        articles: []
      };
    }
    grouped[dateKey].articles.push(article);
  });
  
  // 转换为数组并按日期排序
  return Object.values(grouped).sort((a, b) => 
    moment(b.fullDate).valueOf() - moment(a.fullDate).valueOf()
  );
}



// API路由 - 返回JSON格式的新闻数据
app.get('/api/news', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const blogType = req.query.blog_type;
    
    let query = {};
    if (blogType) {
      query.blog_type = blogType;
    }
    
    const news = await db.collection(COLLECTION_NAME)
      .find(query)
      .sort({ publish_date: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await db.collection(COLLECTION_NAME).countDocuments(query);
    
    res.json({
      success: true,
      data: news,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('API获取新闻失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// API路由 - Feed流无限滚动加载（时间轴模式）
app.get('/api/news/feed', async (req, res) => {
  try {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const blogType = req.query.blog_type;
    
    let query = {};
    if (blogType) {
      query.blog_type = blogType;
    }
    
    const news = await db.collection(COLLECTION_NAME)
      .find(query)
      .sort({ publish_date: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    const total = await db.collection(COLLECTION_NAME).countDocuments(query);
    const hasMore = (offset + news.length) < total;
    
    // 按日期分组新闻
    const newsGroupedByDate = groupNewsByDate(news);
    
    res.json({
      success: true,
      data: newsGroupedByDate,
      hasMore,
      total,
      nextOffset: offset + news.length
    });
  } catch (error) {
    console.error('API获取Feed流新闻失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});



// 原代理路由已删除 - 不再支持iframe展示原文

// 启动服务器
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);