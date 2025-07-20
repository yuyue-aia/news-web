const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const moment = require('moment');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB连接配置
const MONGODB_URI = "mongodb://mongouser:Passwd2025@139.155.60.15:28017,139.155.60.15:28018/test?replicaSet=cmgo-pjr9kp6t_0&authSource=admin";
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
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
}

// 首页路由 - 显示新闻列表
app.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const news = await db.collection(COLLECTION_NAME)
      .find({})
      .sort({ publish_date: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const totalNews = await db.collection(COLLECTION_NAME).countDocuments();
    const totalPages = Math.ceil(totalNews / limit);
    
    res.render('index', {
      news,
      currentPage: page,
      totalPages,
      moment
    });
  } catch (error) {
    console.error('获取新闻列表失败:', error);
    res.status(500).render('error', { message: '服务器错误' });
  }
});

// 新闻详情页路由
app.get('/news/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const newsId = req.params.id;
    
    if (!ObjectId.isValid(newsId)) {
      return res.status(404).render('error', { message: '新闻不存在' });
    }
    
    const news = await db.collection(COLLECTION_NAME)
      .findOne({ _id: new ObjectId(newsId) });
    
    if (!news) {
      return res.status(404).render('error', { message: '新闻不存在' });
    }
    
    res.render('detail', { news, moment });
  } catch (error) {
    console.error('获取新闻详情失败:', error);
    res.status(500).render('error', { message: '服务器错误' });
  }
});

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

// API路由 - 获取单条新闻
app.get('/api/news/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const newsId = req.params.id;
    
    if (!ObjectId.isValid(newsId)) {
      return res.status(404).json({ success: false, message: '新闻不存在' });
    }
    
    const news = await db.collection(COLLECTION_NAME)
      .findOne({ _id: new ObjectId(newsId) });
    
    if (!news) {
      return res.status(404).json({ success: false, message: '新闻不存在' });
    }
    
    res.json({ success: true, data: news });
  } catch (error) {
    console.error('API获取新闻详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 启动服务器
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);