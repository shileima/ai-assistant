// 内容脚本 - 在网页中运行，可以与页面交互

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageInfo') {
    // 获取页面信息
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      hostname: window.location.hostname
    };
    sendResponse(pageInfo);
  }
});

// 可以在这里添加页面相关的功能，比如显示当前环境的标识
const showEnvironmentIndicator = (environment) => {
  // 移除已存在的指示器
  const existingIndicator = document.getElementById('env-switcher-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  if (!environment) return;
  
  // 创建环境指示器
  const indicator = document.createElement('div');
  indicator.id = 'env-switcher-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: ${getEnvironmentColor(environment)};
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    z-index: 10000;
    font-family: Arial, sans-serif;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;
  indicator.textContent = environment.toUpperCase();
  
  document.body.appendChild(indicator);
  
  // 3秒后自动隐藏
  setTimeout(() => {
    if (indicator && indicator.parentNode) {
      indicator.remove();
    }
  }, 3000);
};

// 获取环境对应的颜色
const getEnvironmentColor = (env) => {
  const colors = {
    dev: '#28a745',
    test: '#ffc107',
    staging: '#fd7e14',
    prod: '#dc3545'
  };
  return colors[env] || '#6c757d';
};

// 页面加载完成后检测当前环境
document.addEventListener('DOMContentLoaded', () => {
  // 可以在这里添加初始化逻辑
});

// 监听URL变化（SPA应用）
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href;
    // URL变化时可以重新检测环境
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});