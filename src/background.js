// 后台脚本 - 处理扩展的生命周期和消息传递

// 默认环境配置
const DEFAULT_ENVIRONMENTS = {
  dev: {
    name: 'Development',
    pattern: 'dev',
    baseUrl: 'http://127.0.0.1:8080'
  },
  test: {
    name: 'Test',
    pattern: 'test',
    baseUrl: 'https://xgpt.waimai.test.sankuai.com'
  },
  staging: {
    name: 'Staging',
    pattern: 'st',
    baseUrl: 'https://xgpt.waimai.st.sankuai.com'
  },
  prod: {
    name: 'Production',
    pattern: 'prod',
    baseUrl: 'https://bots.sankuai.com'
  }
};

// 扩展安装时初始化默认配置
chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.sync.get(['environments']);
  if (!result.environments) {
    await chrome.storage.sync.set({ environments: DEFAULT_ENVIRONMENTS });
  }
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'switchEnvironment') {
    
    handleEnvironmentSwitch(request.targetEnv, request.currentUrl);
  } else if (request.action === 'getCurrentTab') {
    getCurrentTabInfo().then(sendResponse);
    return true; // 保持消息通道开放
  } else if (request.action === 'saveElement') {
    handleSaveElement(request, sender, sendResponse);
    return true; // 保持消息通道开放
  }
});

// 处理环境切换
const handleEnvironmentSwitch = async (targetEnv, currentUrl) => {
  try {
    const result = await chrome.storage.sync.get(['environments']);
    const environments = result.environments || DEFAULT_ENVIRONMENTS;
    
    if (!environments[targetEnv]) {
      console.error('目标环境不存在:', targetEnv);
      return;
    }

    const newUrl = buildNewUrl(currentUrl, environments, targetEnv);
    
    // 获取当前活动标签页并更新URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.update(tab.id, { url: newUrl });
    }
  } catch (error) {
    console.error('环境切换失败:', error);
  }
};

// 构建新的URL
const buildNewUrl = (currentUrl, environments, targetEnv) => {
  try {
    const url = new URL(currentUrl);
    const hostname = url.hostname;
    const targetEnvConfig = environments[targetEnv];
    
    // 检测当前环境
    let currentEnv = null;
    let pathAndQuery = url.pathname + url.search + url.hash;
    
    // 遍历所有环境，找到当前匹配的环境
    for (const [envKey, envConfig] of Object.entries(environments)) {
      const pattern = envConfig.pattern;
      const regex = new RegExp(`\\.${pattern}\\.`, 'i');
      
      if (regex.test(hostname)) {
        currentEnv = envKey;
        break;
      }
    }
    
    // 如果没有匹配到环境模式，可能是生产环境
    if (!currentEnv) {
      // 检查是否是生产环境（没有环境标识）
      for (const [envKey, envConfig] of Object.entries(environments)) {
        if (envKey === 'prod' && hostname.includes('sankuai.com') && !hostname.includes('.dev.') && !hostname.includes('.test.') && !hostname.includes('.st.')) {
          currentEnv = 'prod';
          break;
        }
      }
    }
    
    // 构建新URL
    const targetBaseUrl = new URL(targetEnvConfig.baseUrl);
    return targetBaseUrl.origin + pathAndQuery;
    
  } catch (error) {
    console.error('URL构建失败:', error);
    return currentUrl;
  }
};

// 获取当前标签页信息
const getCurrentTabInfo = async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return null;
    
    const result = await chrome.storage.sync.get(['environments']);
    const environments = result.environments || DEFAULT_ENVIRONMENTS;
    
    // 检测当前环境
    const currentEnv = detectCurrentEnvironment(tab.url, environments);
    
    return {
      url: tab.url,
      title: tab.title,
      currentEnv: currentEnv
    };
  } catch (error) {
    console.error('获取标签页信息失败:', error);
    return null;
  }
};

// 检测当前环境
const detectCurrentEnvironment = (url, environments) => {
  try {
    const hostname = new URL(url).hostname;
    const fullUrl = url;
    
    for (const [envKey, envConfig] of Object.entries(environments)) {
      const pattern = envConfig.pattern;
      const baseUrl = envConfig.baseUrl;
      
      // 方法1: 通过baseUrl的hostname直接匹配
      try {
        const baseHostname = new URL(baseUrl).hostname;
        if (hostname === baseHostname) {
          return envKey;
        }
      } catch (e) {
        // baseUrl可能格式不正确，继续其他检测方法
      }
      
      // 方法2: 特殊环境处理
      if (envKey === 'dev') {
        // 开发环境：检测localhost、127.0.0.1等本地地址
        if (hostname === '127.0.0.1' || 
            hostname === 'localhost' || 
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.includes('.dev.')) {
          return envKey;
        }
      } else if (envKey === 'prod') {
        // 生产环境特殊处理
        if (hostname.includes('sankuai.com') && 
            !hostname.includes('.dev.') && 
            !hostname.includes('.test.') && 
            !hostname.includes('.st.')) {
          return envKey;
        }
      } else {
        // 方法3: 通用模式匹配
        const regex = new RegExp(`\\.${pattern}\\.`, 'i');
        if (regex.test(hostname)) {
          return envKey;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('环境检测失败:', error);
    return null;
  }
};

// 处理保存元素
const handleSaveElement = async (request, sender, sendResponse) => {
  try {
    // 获取当前标签页信息
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ success: false, message: '无法获取当前标签页信息' });
      return;
    }

    // 构建要保存的元素数据
    const elementData = {
      ...request,
      url: tab.url,
      title: tab.title,
      hostname: new URL(tab.url).hostname,
      timestamp: new Date().toISOString(),
      tabId: tab.id
    };

    // 这里可以调用实际的API来保存元素
    // 示例：保存到本地存储或发送到远程服务器
    const savedElements = await saveElementToStorage(elementData);
    
    sendResponse({ 
      success: true, 
      message: '元素保存成功',
      data: elementData,
      totalSaved: savedElements.length
    });

  } catch (error) {
    console.error('保存元素失败:', error);
    sendResponse({ 
      success: false, 
      message: '保存失败: ' + error.message 
    });
  }
};

// 保存元素到存储（这里可以根据需要改为实际的API调用）
const saveElementToStorage = async (elementData) => {
  try {
    // 获取已保存的元素列表
    const result = await chrome.storage.local.get(['savedElements']);
    const savedElements = result.savedElements || [];
    
    // 添加新元素
    savedElements.push(elementData);
    
    // 限制保存数量，最多保存100个元素
    if (savedElements.length > 100) {
      savedElements.splice(0, savedElements.length - 100);
    }
    
    // 保存到本地存储
    await chrome.storage.local.set({ savedElements });
    
    // 这里可以添加实际的API调用逻辑
    // 例如：await fetch('https://your-api.com/elements', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(elementData)
    // });
    
    return savedElements;
  } catch (error) {
    console.error('保存到存储失败:', error);
    throw error;
  }
};