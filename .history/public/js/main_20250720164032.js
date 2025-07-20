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
    });

    // 卡片点击效果
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.tagName !== 'A') {
                const link = this.querySelector('.card-title a');
                if (link) {
                    window.location.href = link.href;
                }
            }
        });
    });
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