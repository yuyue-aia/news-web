// 主要的JavaScript功能
document.addEventListener('DOMContentLoaded', function() {
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 返回顶部按钮
    const backToTopBtn = createBackToTopButton();
    document.body.appendChild(backToTopBtn);

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
        
        // 无限滚动检测
        checkInfiniteScroll();
    });
    
    // 初始化Feed流功能（时间轴模式）
    initializeTimelineFeedStream();
    
    // 添加新闻项加载动画
    animateNewsItems();
});

// 创建返回顶部按钮
function createBackToTopButton() {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'btn btn-primary position-fixed';
    button.style.cssText = `
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        display: none;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        font-size: 20px;
        font-weight: bold;
    `;
    
    button.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    return button;
}

// 切换AI摘要显示/隐藏
function toggleAISummary(newsId) {
    const summaryElement = document.getElementById(`summary-${newsId}`);
    if (summaryElement) {
        if (summaryElement.classList.contains('show')) {
            summaryElement.classList.remove('show');
        } else {
            summaryElement.classList.add('show');
        }
    }
}

// 初始化时间轴Feed流功能
function initializeTimelineFeedStream() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreNews);
    }
}

// 加载更多新闻
async function loadMoreNews() {
    if (window.feedState.loading || !window.feedState.hasMore) {
        return;
    }
    
    window.feedState.loading = true;
    
    const loadMoreBtn = document.getElementById('load-more-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // 显示加载状态
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    
    try {
        const response = await fetch(`/api/news/feed?offset=${window.feedState.currentOffset}&limit=${window.feedState.limit}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            // 添加新的新闻组到时间轴
            appendNewsGroupsToTimeline(data.data);
            
            // 更新状态
            window.feedState.currentOffset = data.nextOffset;
            window.feedState.hasMore = data.hasMore;
            
            // 添加加载动画
            setTimeout(() => {
                animateNewlyAddedItems();
            }, 100);
        }
        
        // 隐藏加载指示器
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        // 处理是否还有更多内容
        if (window.feedState.hasMore) {
            if (loadMoreBtn) loadMoreBtn.style.display = 'block';
        } else {
            // 显示结束指示器
            const endIndicator = document.getElementById('end-indicator');
            if (endIndicator) endIndicator.style.display = 'block';
        }
        
    } catch (error) {
        console.error('加载更多新闻失败:', error);
        alert('加载失败，请稍后重试');
        
        // 恢复加载更多按钮
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (loadMoreBtn) loadMoreBtn.style.display = 'block';
    }
    
    window.feedState.loading = false;
}

// 将新闻组添加到时间轴
function appendNewsGroupsToTimeline(newsGroups) {
    const timeline = document.getElementById('news-timeline');
    if (!timeline) return;
    
    newsGroups.forEach(dateGroup => {
        const dateGroupElement = createDateGroupElement(dateGroup);
        timeline.appendChild(dateGroupElement);
    });
}

// 创建日期组元素
function createDateGroupElement(dateGroup) {
    const dateGroupDiv = document.createElement('div');
    dateGroupDiv.className = 'date-group';
    
    // 创建日期标签和点
    const dateLabel = document.createElement('div');
    dateLabel.className = 'date-label';
    dateLabel.textContent = dateGroup.date;
    
    const dateDot = document.createElement('div');
    dateDot.className = 'date-dot';
    
    // 创建新闻列表
    const newsList = document.createElement('div');
    newsList.className = 'news-list';
    
    dateGroup.articles.forEach(article => {
        const newsItem = createNewsItemElement(article);
        newsList.appendChild(newsItem);
    });
    
    dateGroupDiv.appendChild(dateLabel);
    dateGroupDiv.appendChild(dateDot);
    dateGroupDiv.appendChild(newsList);
    
    return dateGroupDiv;
}

// 创建新闻项元素
function createNewsItemElement(article) {
    const newsItem = document.createElement('div');
    newsItem.className = 'timeline-news-item';
    
    const publishTime = new Date(article.publish_date);
    const timeString = publishTime.toTimeString().slice(0, 5); // HH:MM 格式
    
    newsItem.innerHTML = `
        <div class="timeline-news-card" data-news-id="${article._id}">
            <!-- 一行布局：公司名称、分类、标题、链接 -->
            <div class="timeline-news-content">
                <span class="company-tag">${article.author || 'Unknown'}</span>
                <span class="category-tag">${article.blog_type}</span>
                <div class="timeline-news-title" onclick="toggleAISummary('${article._id}')">
                    ${article.title}
                </div>
                <div class="link-area">
                    ${article.article_link ? `
                        <a href="${article.article_link}" 
                           target="_blank" 
                           class="text-decoration-none"
                           title="查看原文"
                           style="color: #1a73e8; font-size: 0.75rem;">
                            <i class="bi bi-box-arrow-up-right"></i>
                        </a>
                    ` : ''}
                </div>
            </div>
            
            <!-- AI摘要区域 -->
            ${article.ai_summary ? `
                <div id="summary-${article._id}" class="ai-summary-section">
                    <div class="ai-summary-header">
                        <i class="bi bi-stars"></i>
                        AI 摘要
                    </div>
                    <div class="ai-summary-content">
                        ${article.ai_summary}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    return newsItem;
}

// 为新闻项添加加载动画
function animateNewsItems() {
    const newsItems = document.querySelectorAll('.timeline-news-item:not(.loaded)');
    
    newsItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('loaded');
        }, index * 100);
    });
}

// 为新添加的项目添加动画
function animateNewlyAddedItems() {
    const newsItems = document.querySelectorAll('.timeline-news-item:not(.loaded)');
    
    newsItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('loaded');
        }, index * 50);
    });
}

// 无限滚动检测
function checkInfiniteScroll() {
    if (window.feedState.loading || !window.feedState.hasMore) {
        return;
    }
    
    const scrollTop = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    
    // 当滚动到页面底部附近时自动加载
    if (scrollTop + windowHeight >= docHeight - 800) {
        loadMoreNews();
    }
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 截取文本
function truncateText(text, maxLength = 150) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// API调用示例函数
async function fetchNews(page = 1, blogType = null) {
    try {
        let url = `/api/news?page=${page}`;
        if (blogType) {
            url += `&blog_type=${encodeURIComponent(blogType)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            return data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('获取新闻失败:', error);
        throw error;
    }
}

// 全局函数，供HTML中的onclick使用
window.toggleAISummary = toggleAISummary;