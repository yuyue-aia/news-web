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
    
    // 添加极客风格的键盘快捷键
    setupKeyboardShortcuts();
    
    // 添加高级交互效果
    setupAdvancedInteractions();
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

// ===== 极客风格的高级功能 =====

// 设置键盘快捷键
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // 只在首页启用快捷键
        if (window.location.pathname !== '/') return;
        
        // 避免在输入框中触发
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
        
        switch(event.key.toLowerCase()) {
            case 'r': // R - 刷新页面
                event.preventDefault();
                location.reload();
                break;
                
            case 'l': // L - 加载更多
                event.preventDefault();
                const loadMoreBtn = document.getElementById('load-more-btn');
                if (loadMoreBtn && loadMoreBtn.style.display !== 'none') {
                    loadMoreBtn.click();
                }
                break;
                
            case 't': // T - 返回顶部
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
                
            case 'b': // B - 跳转到底部
                event.preventDefault();
                window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
                break;
                
            case '?': // ? - 显示帮助
                event.preventDefault();
                showKeyboardHelp();
                break;
        }
    });
}

// 设置高级交互效果
function setupAdvancedInteractions() {
    // 添加视差滚动效果
    setupParallaxEffect();
    
    // 添加鼠标跟随效果
    setupMouseTracker();
    
    // 添加动态背景
    setupDynamicBackground();
}

// 视差滚动效果
function setupParallaxEffect() {
    let ticking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const parallax = scrolled * 0.3;
        
        document.body.style.backgroundPosition = `center ${parallax}px`;
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    });
}

// 鼠标跟随效果
function setupMouseTracker() {
    const cursor = document.createElement('div');
    cursor.className = 'geek-cursor';
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border: 2px solid #00d9ff;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transition: all 0.1s ease;
        opacity: 0;
        transform: translate(-50%, -50%);
    `;
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', function(e) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        cursor.style.opacity = '0.6';
    });
    
    document.addEventListener('mouseleave', function() {
        cursor.style.opacity = '0';
    });
    
    // 悬停在可点击元素上时放大
    document.addEventListener('mouseover', function(e) {
        if (e.target.matches('button, a, .summary-icon')) {
            cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
            cursor.style.borderColor = '#ff6b35';
        } else {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            cursor.style.borderColor = '#00d9ff';
        }
    });
}

// 动态背景效果
function setupDynamicBackground() {
    // 添加微妙的背景动画
    const background = document.createElement('div');
    background.className = 'dynamic-bg';
    background.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        opacity: 0.03;
        background-image: 
            radial-gradient(circle at 25% 25%, #00d9ff 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, #ff6b35 0%, transparent 50%);
        animation: backgroundPulse 8s ease-in-out infinite alternate;
    `;
    document.body.insertBefore(background, document.body.firstChild);
}

// 显示键盘帮助
function showKeyboardHelp() {
    const helpModal = document.createElement('div');
    helpModal.className = 'keyboard-help-modal';
    helpModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(10, 14, 39, 0.9);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    helpModal.innerHTML = `
        <div style="
            background: #252a48;
            border: 1px solid #3c4563;
            border-radius: 12px;
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        ">
            <h3 style="color: #00d9ff; font-family: 'JetBrains Mono', monospace; margin-bottom: 1.5rem; text-align: center;">
                键盘快捷键
            </h3>
            <div style="color: #e8eaed; font-size: 0.9rem; line-height: 1.6;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <kbd style="background: #3c4563; padding: 0.25rem 0.5rem; border-radius: 4px;">R</kbd>
                    <span>刷新页面</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <kbd style="background: #3c4563; padding: 0.25rem 0.5rem; border-radius: 4px;">L</kbd>
                    <span>加载更多</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <kbd style="background: #3c4563; padding: 0.25rem 0.5rem; border-radius: 4px;">T</kbd>
                    <span>返回顶部</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <kbd style="background: #3c4563; padding: 0.25rem 0.5rem; border-radius: 4px;">B</kbd>
                    <span>跳转底部</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                    <kbd style="background: #3c4563; padding: 0.25rem 0.5rem; border-radius: 4px;">?</kbd>
                    <span>显示帮助</span>
                </div>
                <div style="text-align: center; margin-top: 1.5rem;">
                    <button onclick="this.closest('.keyboard-help-modal').remove()" style="
                        background: #00d9ff;
                        color: #0a0e27;
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    ">关闭</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(helpModal);
    
    // 点击背景关闭
    helpModal.addEventListener('click', function(e) {
        if (e.target === helpModal) {
            helpModal.remove();
        }
    });
    
    // ESC 键关闭
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            helpModal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// 添加 CSS 动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes backgroundPulse {
        0% { transform: scale(1) rotate(0deg); }
        100% { transform: scale(1.1) rotate(180deg); }
    }
    
    /* 隐藏鼠标指针在此区域 */
    .geek-cursor ~ * {
        cursor: none;
    }
`;
document.head.appendChild(style);

// 由于鼠标跟随效果可能影响性能，添加开关
if (window.innerWidth > 768) {
    // 只在桌面端启用高级效果
    document.body.classList.add('advanced-effects-enabled');
}