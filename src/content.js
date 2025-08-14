// 内容脚本 - 在网页中运行，可以与页面交互

// 元素选择器相关变量
let elementPickerActive = false;
let currentHighlightedElement = null;
let overlayElement = null;
let resultPanel = null;

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
  } else if (request.action === 'startElementPicker') {
    // 启动元素选择器
    startElementPicker();
    sendResponse({ success: true });
  }
});

// 启动元素选择器
const startElementPicker = () => {
  if (elementPickerActive) return;
  
  elementPickerActive = true;
  
  // 创建全屏覆盖层
  createOverlay();
  
  // 添加事件监听器
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleElementClick);
  document.addEventListener('keydown', handleKeyDown);
  
  // 显示提示信息
  showPickerInstructions();
  
  // 修改鼠标样式
  document.body.style.cursor = 'crosshair';
};

// 创建覆盖层
const createOverlay = () => {
  overlayElement = document.createElement('div');
  overlayElement.id = 'element-picker-overlay';
  overlayElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: transparent;
    z-index: 999999;
    pointer-events: none;
  `;
  
  document.body.appendChild(overlayElement);
};

// 处理鼠标移动
const handleMouseMove = (event) => {
  if (!elementPickerActive) return;
  
  const target = event.target;
  if (target === overlayElement || target === resultPanel) return;
  
  // 移除之前的高亮
  if (currentHighlightedElement) {
    removeHighlight(currentHighlightedElement);
  }
  
  // 高亮当前元素
  currentHighlightedElement = target;
  highlightElement(target);
  
  // 更新提示信息
  updatePickerInstructions(target);
};

// 高亮元素
const highlightElement = (element) => {
  if (!element) return;
  
  // 保存原始样式
  element._originalOutline = element.style.outline;
  element._originalBackground = element.style.backgroundColor;
  
  // 应用高亮样式
  element.style.outline = '2px solid #007bff';
  element.style.outlineOffset = '2px';
  element.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
  
  // 创建高亮框
  const highlightBox = document.createElement('div');
  highlightBox.id = 'element-highlight-box';
  highlightBox.style.cssText = `
    position: absolute;
    border: 2px solid #007bff;
    background: rgba(0, 123, 255, 0.1);
    pointer-events: none;
    z-index: 999998;
    border-radius: 4px;
  `;
  
  const rect = element.getBoundingClientRect();
  highlightBox.style.left = rect.left + 'px';
  highlightBox.style.top = rect.top + 'px';
  highlightBox.style.width = rect.width + 'px';
  highlightBox.style.height = rect.height + 'px';
  
  document.body.appendChild(highlightBox);
};

// 移除高亮
const removeHighlight = (element) => {
  if (!element) return;
  
  // 恢复原始样式
  if (element._originalOutline !== undefined) {
    element.style.outline = element._originalOutline;
    element.style.backgroundColor = element._originalBackground;
    delete element._originalOutline;
    delete element._originalBackground;
  }
  
  // 移除高亮框
  const highlightBox = document.getElementById('element-highlight-box');
  if (highlightBox) {
    highlightBox.remove();
  }
};

// 处理元素点击
const handleElementClick = (event) => {
  if (!elementPickerActive) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const target = event.target;
  if (target === overlayElement || target === resultPanel) return;
  
  // 选择元素并显示结果
  selectElement(target);
};

// 处理键盘事件
const handleKeyDown = (event) => {
  if (!elementPickerActive) return;
  
  if (event.key === 'Escape') {
    // ESC 退出
    stopElementPicker();
  } else if (event.key === ' ' || event.key === 'Space') {
    // 空格确认选择
    event.preventDefault();
    if (currentHighlightedElement) {
      selectElement(currentHighlightedElement);
    }
  }
};

// 选择元素
const selectElement = (element) => {
  if (!element) return;
  
  // 生成选择器
  const cssSelector = generateCSSSelector(element);
  const xpath = generateXPath(element);
  
  // 显示结果面板
  showResultPanel(element, cssSelector, xpath);
  
  // 停止选择器
  stopElementPicker();
};

// 生成CSS选择器
const generateCSSSelector = (element) => {
  if (!element) return '';
  
  const path = [];
  let current = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    // 添加ID
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }
    
    // 添加类名
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }
    
    // 添加位置索引
    const siblings = Array.from(current.parentNode?.children || []);
    const index = siblings.indexOf(current) + 1;
    if (siblings.length > 1) {
      selector += `:nth-child(${index})`;
    }
    
    path.unshift(selector);
    current = current.parentNode;
  }
  
  return path.join(' > ');
};

// 生成XPath
const generateXPath = (element) => {
  if (!element) return '';
  
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const path = [];
  let current = element;
  
  while (current && current !== document.body) {
    let xpath = current.tagName.toLowerCase();
    
    // 添加位置索引
    const siblings = Array.from(current.parentNode?.children || [])
      .filter(child => child.tagName === current.tagName);
    const index = siblings.indexOf(current) + 1;
    if (siblings.length > 1) {
      xpath += `[${index}]`;
    }
    
    path.unshift(xpath);
    current = current.parentNode;
  }
  
  return `//${path.join('/')}`;
};

// 显示结果面板
const showResultPanel = (element, cssSelector, xpath) => {
  // 移除已存在的结果面板
  if (resultPanel) {
    resultPanel.remove();
  }
  
  // 创建结果面板
  resultPanel = document.createElement('div');
  resultPanel.id = 'element-picker-result';
  resultPanel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    max-height: 500px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
  `;
  
  // 获取元素信息
  const tagName = element.tagName.toLowerCase();
  const className = element.className || '';
  const id = element.id || '';
  const text = element.textContent?.trim().substring(0, 100) || '';
  
  // 处理长文本，确保单行显示
  const truncateText = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  const displayClassName = truncateText(className, 40);
  const displayText = truncateText(text, 50);
  
  resultPanel.innerHTML = `
    <div style="padding: 16px; border-bottom: 1px solid #eee;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #333;">元素信息</h3>
      <div style="font-size: 14px; color: #666;">
        <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
          <span style="min-width: 60px; font-weight: bold;">标签:</span>
          <span style="margin-left: 8px;">${tagName}</span>
        </div>
        ${id ? `<div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
          <span style="min-width: 60px; font-weight: bold;">ID:</span>
          <span style="margin-left: 8px;">${id}</span>
        </div>` : ''}
        ${className ? `<div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
          <span style="min-width: 60px; font-weight: bold;">类名:</span>
          <span style="margin-left: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px;" title="${className}">${displayClassName}</span>
        </div>` : ''}
        ${text ? `<div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
          <span style="min-width: 60px; font-weight: bold;">文本:</span>
          <span style="margin-left: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px;" title="${text}">${displayText}</span>
        </div>` : ''}
      </div>
    </div>
    
    <div style="padding: 16px; border-bottom: 1px solid #eee;">
      <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #333;">CSS 选择器</h4>
      <div style="position: relative;">
        <textarea readonly style="width: 100%; height: 60px; padding: 8px 40px 8px 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 12px; resize: none; box-sizing: border-box;">${cssSelector}</textarea>
        <button id="copy-css-btn" style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <div style="padding: 16px; border-bottom: 1px solid #eee;">
      <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #333;">XPath</h4>
      <div style="position: relative;">
        <textarea readonly style="width: 100%; height: 60px; padding: 8px 40px 8px 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 12px; resize: none; box-sizing: border-box;">${xpath}</textarea>
        <button id="copy-xpath-btn" style="position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <div style="padding: 16px;">
      <button id="restart-picker-btn" style="width: 100%; padding: 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 8px;">重新采集</button>
      <button onclick="document.getElementById('element-picker-result').remove()" style="width: 100%; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">关闭</button>
    </div>
  `;
  
  document.body.appendChild(resultPanel);
  
  // 绑定复制按钮事件
  const copyCssBtn = document.getElementById('copy-css-btn');
  const copyXpathBtn = document.getElementById('copy-xpath-btn');
  const restartPickerBtn = document.getElementById('restart-picker-btn');
  
  copyCssBtn.addEventListener('click', () => copyToClipboard(cssSelector, copyCssBtn));
  copyXpathBtn.addEventListener('click', () => copyToClipboard(xpath, copyXpathBtn));
  restartPickerBtn.addEventListener('click', () => restartElementPicker());
};

// 重新启动元素选择器
const restartElementPicker = () => {
  // 移除结果面板
  if (resultPanel) {
    resultPanel.remove();
    resultPanel = null;
  }
  
  // 确保完全清理之前的状态
  if (currentHighlightedElement) {
    removeHighlight(currentHighlightedElement);
    currentHighlightedElement = null;
  }
  
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
  
  // 重置状态
  elementPickerActive = false;
  
  // 重新启动选择器
  setTimeout(() => {
    startElementPicker();
  }, 100);
};

// 复制到剪贴板
const copyToClipboard = async (text, button) => {
  try {
    await navigator.clipboard.writeText(text);
    showCopySuccess(button);
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showCopySuccess(button);
  }
};

// 显示复制成功状态
const showCopySuccess = (button) => {
  const originalHTML = button.innerHTML;
  const originalBackground = button.style.background;
  
  // 显示成功状态
  button.innerHTML = '✅';
  button.style.background = '#28a745';
  button.disabled = true;
  
  // 2秒后恢复
  setTimeout(() => {
    button.innerHTML = originalHTML;
    button.style.background = originalBackground;
    button.disabled = false;
  }, 2000);
  
  // 显示提示消息
  showToast('已复制到剪贴板');
};

// 显示提示信息
const showPickerInstructions = () => {
  const instructions = document.createElement('div');
  instructions.id = 'picker-instructions';
  instructions.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #007bff;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 1000001;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  instructions.textContent = '移动鼠标选择元素，点击或按空格确认，ESC退出';
  
  document.body.appendChild(instructions);
};

// 更新提示信息
const updatePickerInstructions = (element) => {
  const instructions = document.getElementById('picker-instructions');
  if (!instructions || !element) return;
  
  const tagName = element.tagName.toLowerCase();
  const className = element.className || '';
  const id = element.id || '';
  
  let elementInfo = tagName;
  if (id) elementInfo += `#${id}`;
  if (className) elementInfo += `.${className.split(' ').join('.')}`;
  
  instructions.textContent = `当前元素: ${elementInfo} - 点击或按空格确认，ESC退出`;
};

// 停止元素选择器
const stopElementPicker = () => {
  if (!elementPickerActive) return;
  
  elementPickerActive = false;
  
  // 移除事件监听器
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleElementClick);
  document.removeEventListener('keydown', handleKeyDown);
  
  // 移除高亮
  if (currentHighlightedElement) {
    removeHighlight(currentHighlightedElement);
    currentHighlightedElement = null;
  }
  
  // 移除覆盖层
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
  
  // 移除提示信息
  const instructions = document.getElementById('picker-instructions');
  if (instructions) {
    instructions.remove();
  }
  
  // 恢复鼠标样式
  document.body.style.cursor = '';
};

// 显示提示消息
const showToast = (message) => {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #28a745;
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 1000002;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 2000);
};

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