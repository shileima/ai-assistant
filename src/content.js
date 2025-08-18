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
  } else if (request.action === 'showSaveElementDialog') {
    // 显示保存元素弹框
    showSaveElementDialog(request.elementData);
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
    max-height: 600px;
    min-height: 580px;
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
      <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #666;">CSS 选择器</h4>
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
    
    <div style="padding: 16px;">
      <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #666;">XPath</h4>
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
    
    <div style="padding: 16px 16px 20px 16px; margin-top: 20px; border-top: 1px solid #eee">
      <button id="save-element-btn" style="width: 100%; padding: 6px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 8px; font-size: 13px;">保存元素</button>
      <button id="restart-picker-btn" style="width: 100%; padding: 6px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 8px; font-size: 13px;">重新采集</button>
      <button onclick="document.getElementById('element-picker-result').remove()" style="width: 100%; padding: 6px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">关闭</button>
    </div>
  `;
  
  document.body.appendChild(resultPanel);
  
  // 绑定复制按钮事件
  const copyCssBtn = document.getElementById('copy-css-btn');
  const copyXpathBtn = document.getElementById('copy-xpath-btn');
  const restartPickerBtn = document.getElementById('restart-picker-btn');
  const saveElementBtn = document.getElementById('save-element-btn');
  
  copyCssBtn.addEventListener('click', () => copyToClipboard(cssSelector, copyCssBtn));
  copyXpathBtn.addEventListener('click', () => copyToClipboard(xpath, copyXpathBtn));
  restartPickerBtn.addEventListener('click', () => restartElementPicker());
  saveElementBtn.addEventListener('click', () => saveElement(element));
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

// 保存元素到后台
const saveElement = async (element) => {
  if (!element) {
    showToast('请先选择一个元素');
    return;
  }

  const tagName = element.tagName.toLowerCase();
  const className = element.className || '';
  const id = element.id || '';
  const text = element.textContent?.trim() || '';
  const cssSelector = generateCSSSelector(element);
  const xpath = generateXPath(element);

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'saveElement',
      tagName: tagName,
      className: className,
      id: id,
      text: text,
      cssSelector: cssSelector,
      xpath: xpath
    });

    if (response.success) {
      showToast('元素已保存！');
      // 可以选择刷新页面或更新已保存的元素列表
    } else {
      showToast('保存失败: ' + response.message);
    }
  } catch (error) {
    showToast('保存失败: ' + error.message);
  }
};

// 显示保存元素弹框
const showSaveElementDialog = (elementData) => {
  // 移除已存在的弹框
  const existingDialog = document.getElementById('save-element-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }

  // 创建弹框容器
  const dialog = document.createElement('div');
  dialog.id = 'save-element-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // 创建弹框内容
  const dialogContent = document.createElement('div');
  dialogContent.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 24px;
    width: 500px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  `;

  // 弹框标题
  const title = document.createElement('h3');
  title.textContent = '保存元素';
  title.style.cssText = `
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  `;

  // 保存类型选择
  const typeSection = document.createElement('div');
  typeSection.style.cssText = 'margin-bottom: 20px;';
  
  const typeLabel = document.createElement('label');
  typeLabel.textContent = '保存类型：';
  typeLabel.style.cssText = `
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #555;
  `;
  
  const typeSelect = document.createElement('select');
  typeSelect.id = 'locate-mode-select';
  typeSelect.style.cssText = `
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  `;
  
  const cssOption = document.createElement('option');
  cssOption.value = 'CSS';
  cssOption.textContent = 'CSS选择器';
  
  const xpathOption = document.createElement('option');
  xpathOption.value = 'Xpath';
  xpathOption.textContent = 'XPath';
  
  typeSelect.appendChild(cssOption);
  typeSelect.appendChild(xpathOption);
  
  typeSection.appendChild(typeLabel);
  typeSection.appendChild(typeSelect);

  // 元素名称输入
  const nameSection = document.createElement('div');
  nameSection.style.cssText = 'margin-bottom: 20px;';
  
  const nameLabel = document.createElement('label');
  nameLabel.textContent = '元素名称：';
  nameLabel.style.cssText = `
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #555;
  `;
  
  const nameInput = document.createElement('input');
  nameInput.id = 'element-name-input';
  nameInput.type = 'text';
  nameInput.style.cssText = `
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
  `;
  
  // 自动生成元素名称
  const generateElementName = () => {
    const selectedType = typeSelect.value;
    const text = elementData.text || '';
    const tagName = elementData.tagName || '';
    return `新建元素-${text}-${tagName}-${selectedType}`;
  };
  
  nameInput.value = generateElementName();
  
  // 当类型改变时更新名称
  typeSelect.addEventListener('change', () => {
    nameInput.value = generateElementName();
  });
  
  nameSection.appendChild(nameLabel);
  nameSection.appendChild(nameInput);

  // 元素内容显示
  const contentSection = document.createElement('div');
  contentSection.style.cssText = 'margin-bottom: 20px;';
  
  const contentLabel = document.createElement('label');
  contentLabel.textContent = '元素内容：';
  contentLabel.style.cssText = `
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #555;
  `;
  
  const contentTextarea = document.createElement('textarea');
  contentTextarea.id = 'element-content-textarea';
  contentTextarea.style.cssText = `
    width: 100%;
    height: 80px;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    resize: vertical;
    box-sizing: border-box;
    font-family: monospace;
  `;
  
  // 根据选择的类型显示不同的内容
  const updateContent = () => {
    const selectedType = typeSelect.value;
    if (selectedType === 'CSS') {
      contentTextarea.value = elementData.cssSelector || '';
    } else {
      contentTextarea.value = elementData.xpath || '';
    }
  };
  
  updateContent();
  typeSelect.addEventListener('change', updateContent);
  
  contentSection.appendChild(contentLabel);
  contentSection.appendChild(contentTextarea);

  // 按钮区域
  const buttonSection = document.createElement('div');
  buttonSection.style.cssText = `
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  `;
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = '取消';
  cancelButton.style.cssText = `
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  `;
  
  const saveButton = document.createElement('button');
  saveButton.textContent = '保存提交';
  saveButton.style.cssText = `
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  `;
  
  // 取消按钮事件
  cancelButton.addEventListener('click', () => {
    dialog.remove();
  });
  
  // 保存按钮事件
  saveButton.addEventListener('click', async () => {
    console.log('保存按钮被点击');
    const locateMode = typeSelect.value;
    const elementName = nameInput.value.trim();
    const locateModeValue = contentTextarea.value.trim();
    
    console.log('保存参数:', { locateMode, elementName, locateModeValue, elementData });
    
    if (!elementName) {
      alert('请输入元素名称');
      return;
    }
    
    if (!locateModeValue) {
      alert('请输入元素内容');
      return;
    }
    
    // 显示加载状态
    saveButton.textContent = '保存中...';
    saveButton.disabled = true;
    
    try {
      console.log('准备发送消息到background script');
      // 通过background script调用API保存元素
      const response = await new Promise((resolve, reject) => {
        const message = {
          action: 'saveElementToAPI',
          elementData: {
            ...elementData,
            locateModeValue: locateModeValue
          },
          locateMode: locateMode,
          elementName: elementName
        };
        
        console.log('发送消息:', message);
        
        chrome.runtime.sendMessage(message, (response) => {
          console.log('收到background script响应:', response);
          if (chrome.runtime.lastError) {
            console.error('Chrome runtime错误:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      if (response && response.success) {
        showToast('元素保存成功！');
        dialog.remove();
      } else {
        alert('保存失败: ' + (response ? response.message : '未知错误'));
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + error.message);
    } finally {
      saveButton.textContent = '保存提交';
      saveButton.disabled = false;
    }
  });
  
  buttonSection.appendChild(cancelButton);
  buttonSection.appendChild(saveButton);

  // 组装弹框
  dialogContent.appendChild(title);
  dialogContent.appendChild(typeSection);
  dialogContent.appendChild(nameSection);
  dialogContent.appendChild(contentSection);
  dialogContent.appendChild(buttonSection);
  
  dialog.appendChild(dialogContent);
  document.body.appendChild(dialog);
  
  // 点击背景关闭弹框
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.remove();
    }
  });
  
  // ESC键关闭弹框
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dialog.remove();
    }
  });
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