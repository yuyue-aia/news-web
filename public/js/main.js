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

    // 卡片点击效果已移除（无详情页）
    
    // 初始化Feed流功能
    initializeFeedStream();
    
    // 使用事件委托绑定摘要点击事件
    setupSummaryEventDelegation();
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

// 切换原文内容显示
function toggleOriginalContent() {
    const originalContent = document.getElementById('originalContent');
    const viewOriginalBtn = document.getElementById('viewOriginalBtn');
    const articleFrame = document.getElementById('articleFrame');
    
    if (originalContent.style.display === 'none') {
        originalContent.style.display = 'block';
        viewOriginalBtn.textContent = '隐藏原文';
        viewOriginalBtn.classList.replace('btn-outline-primary', 'btn-primary');
        
        // 平滑滚动到iframe位置
        originalContent.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    } else {
        originalContent.style.display = 'none';
        viewOriginalBtn.textContent = '查看原文';
        viewOriginalBtn.classList.replace('btn-primary', 'btn-outline-primary');
        
        // 如果处于全屏状态，退出全屏
        const iframeContainer = document.querySelector('.card');
        if (iframeContainer && iframeContainer.classList.contains('fullscreen')) {
            toggleFullscreen();
        }
    }
}

// 隐藏加载指示器
function hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// 切换全屏显示
function toggleFullscreen() {
    const iframeContainer = document.querySelector('.card');
    const iframe = document.getElementById('articleFrame');
    const fullscreenIcon = document.getElementById('fullscreenIcon');
    
    if (iframeContainer.classList.contains('fullscreen')) {
        // 退出全屏
        iframeContainer.classList.remove('fullscreen');
        document.body.classList.remove('overflow-hidden');
        iframe.style.height = '600px';
        fullscreenIcon.classList.replace('bi-fullscreen-exit', 'bi-arrows-fullscreen');
    } else {
        // 进入全屏
        iframeContainer.classList.add('fullscreen');
        document.body.classList.add('overflow-hidden');
        
        // 设置iframe高度为视口高度减去头部高度
        const headerHeight = iframeContainer.querySelector('.card-header').offsetHeight;
        iframe.style.height = `calc(100vh - ${headerHeight}px)`;
        
        fullscreenIcon.classList.replace('bi-arrows-fullscreen', 'bi-fullscreen-exit');
    }
}

// ===== Feed流无限滚动功能 =====

// 初始化Feed流功能
function initializeFeedStream() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreNews);
    }
    
    // 检查是否在首页（只在首页启用无限滚动）
    if (window.location.pathname === '/' && window.feedState) {
        console.log('Feed流初始化完成', window.feedState);
    }
}

// 检查是否需要触发无限滚动
function checkInfiniteScroll() {
    // 只在首页且有feedState时执行
    if (window.location.pathname !== '/' || !window.feedState) {
        return;
    }
    
    const { loading, hasMore } = window.feedState;
    
    // 如果正在加载或者没有更多内容，则不执行
    if (loading || !hasMore) {
        return;
    }
    
    // 检查是否滚动到距离底部300px内
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollTop + windowHeight >= documentHeight - 300) {
        loadMoreNews();
    }
}

// 加载更多新闻
function loadMoreNews() {
    if (!window.feedState || window.feedState.loading || !window.feedState.hasMore) {
        return;
    }
    
    // 设置加载状态
    window.feedState.loading = true;
    
    // 显示加载指示器
    showLoadingIndicator();
    
    // 隐藏加载更多按钮
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
    }
    
    // 发起API请求
    fetch(`/api/news/feed?offset=${window.feedState.currentOffset}&limit=${window.feedState.limit}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data.length > 0) {
                // 渲染新新闻
                appendNewsItems(data.data);
                
                // 更新状态
                window.feedState.currentOffset = data.nextOffset;
                window.feedState.hasMore = data.hasMore;
                
                // 如果还有更多内容，显示加载更多按钮
                if (data.hasMore && loadMoreBtn) {
                    loadMoreBtn.style.display = 'block';
                } else {
                    // 显示加载完成指示器
                    showEndIndicator();
                }
            } else {
                // 没有更多数据
                window.feedState.hasMore = false;
                showEndIndicator();
            }
        })
        .catch(error => {
            console.error('加载更多新闻失败:', error);
            // 错误时显示加载更多按钮
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'block';
            }
        })
        .finally(() => {
            // 隐藏加载指示器
            hideLoadingIndicator();
            // 重置加载状态
            window.feedState.loading = false;
        });
}

// 添加新闻列表项
function appendNewsItems(newsItems) {
    const newsFeed = document.getElementById('news-feed');
    if (!newsFeed) return;
    
    newsItems.forEach(article => {
        const newsItem = createNewsItemElement(article);
        newsFeed.appendChild(newsItem);
        
        // 添加入场动画
        setTimeout(() => {
            newsItem.classList.add('news-item-loaded');
        }, 50);
    });
    
    // 不需要重新绑定，事件委托会自动处理
}

// 创建新闻项元素
function createNewsItemElement(article) {
    const div = document.createElement('div');
    div.className = 'col-12 news-item';
    
    const summaryButton = article.ai_summary ? `
        <button type="button"
                class="btn btn-link p-0 ms-3 summary-icon"
                data-summary="${article.ai_summary.replace(/"/g, '&quot;')}"
                title="查看 AI 摘要">
            <i class="bi bi-stars fs-4"></i>
        </button>
    ` : '';
    
    const originalLink = article.article_link ? `
        <a href="${article.article_link}" 
           target="_blank" 
           class="btn btn-link p-0 ms-2"
           title="查看原文">
            <i class="bi bi-box-arrow-up-right fs-5"></i>
        </a>
    ` : '';
    
    div.innerHTML = `
        <div class="card flex-row align-items-center p-3" data-news-id="${article._id}">
            <div class="flex-grow-1">
                <h5 class="mb-1">${article.title}</h5>
                <p class="text-muted small mb-0">
                    <span class="badge bg-secondary me-2">${article.blog_type}</span>
                    作者: ${article.author} |
                    发布时间: ${formatDate(article.publish_date)}
                </p>
            </div>
            <div class="d-flex align-items-center">
                ${summaryButton}
                ${originalLink}
            </div>
        </div>
    `;
    
    return div;
}

// 设置摘要事件委托（统一处理所有摘要点击）
function setupSummaryEventDelegation() {
    // 使用事件委托在document上监听所有摘要点击
    document.addEventListener('click', function(event) {
        // 检查点击的元素是否是摘要按钮
        if (event.target.closest('.summary-icon')) {
            event.preventDefault();
            const icon = event.target.closest('.summary-icon');
            const card = icon.closest('.card');
            const newsItem = card.closest('.news-item');
            
            // 使用data-news-id生成唯一ID
            const newsCard = newsItem.querySelector('.card');
            const newsId = newsCard ? newsCard.getAttribute('data-news-id') : Date.now();
            const summaryId = `summary-${newsId}`;
            
            // 查找已存在的摘要行
            const existingSummary = document.getElementById(summaryId);
            
            // 若摘要已存在则移除
            if (existingSummary) {
                existingSummary.remove();
                return;
            }
            
            // 创建新的摘要 DOM
            const row = document.createElement('div');
            row.id = summaryId;
            row.className = 'summary-row col-12';
            row.innerHTML = `
                <div class="border-start border-3 border-primary bg-light p-3">
                    <p class="mb-0">${icon.dataset.summary}</p>
                </div>`;
            
            // 插入到当前新闻项之后
            newsItem.parentNode.insertBefore(row, newsItem.nextSibling);
        }
    });
}

// 绑定摘要按钮事件（已废弃，使用事件委托替代）
function bindSummaryEvents() {
    document.querySelectorAll('.summary-icon:not(.bound)').forEach(icon => {
        icon.classList.add('bound');
        icon.addEventListener('click', () => {
            const card = icon.closest('.card');
            const newsItem = card.closest('.news-item');
            
            // 使用data-news-id生成唯一ID
            const newsCard = newsItem.querySelector('.card');
            const newsId = newsCard ? newsCard.getAttribute('data-news-id') : Date.now();
            const summaryId = `summary-${newsId}`;
            
            // 查找已存在的摘要行
            const existingSummary = document.getElementById(summaryId);
            
            // 若摘要已存在则移除
            if (existingSummary) {
                existingSummary.remove();
                return;
            }
            
            // 创建新的摘要 DOM
            const row = document.createElement('div');
            row.id = summaryId;
            row.className = 'summary-row col-12';
            row.innerHTML = `
                <div class="border-start border-3 border-primary bg-light p-3">
                    <p class="mb-0">${icon.dataset.summary}</p>
                </div>`;
            
            // 插入到当前新闻项之后
            newsItem.parentNode.insertBefore(row, newsItem.nextSibling);
        });
    });
}

// 显示加载指示器
function showLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.style.display = 'block';
    }
}

// 隐藏加载指示器
function hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// 显示加载完成指示器
function showEndIndicator() {
    const indicator = document.getElementById('end-indicator');
    if (indicator) {
        indicator.style.display = 'block';
    }
}