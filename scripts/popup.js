// 弹出窗口脚本
class EnvironmentSwitcher {
  constructor() {
    this.environments = {};
    this.currentTab = null;
    this.init();
  }

  // 初始化
  async init() {
    await this.loadEnvironments();
    await this.loadCurrentTab();
    this.setupEventListeners();
    this.renderEnvironments();
    this.updateCurrentInfo();
  }

  // 加载环境配置
  async loadEnvironments() {
    try {
      const result = await chrome.storage.sync.get(['environments']);
      this.environments = result.environments || {};
    } catch (error) {
      console.error('加载环境配置失败:', error);
    }
  }

  // 加载当前标签页信息
  async loadCurrentTab() {
    try {
      this.currentTab = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getCurrentTab' }, resolve);
      });
    } catch (error) {
      console.error('获取当前标签页失败:', error);
    }
  }

  // 设置事件监听器
  setupEventListeners() {
    // 设置按钮
    const settingsBtn = document.getElementById('settingsBtn');
    const elementPickerBtn = document.getElementById('elementPickerBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    
    settingsBtn?.addEventListener('click', () => this.showSettings());
    closeSettingsBtn?.addEventListener('click', () => this.hideSettings());

    // 元素选择器按钮
    elementPickerBtn?.addEventListener('click', async () => {
      try {
        // 在当前激活标签页开启采集器
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await chrome.tabs.sendMessage(tab.id, { action: 'startElementPicker' });
          this.showMessage('元素选择器已启动，移动鼠标选择元素，按 Space 或 点击确认；ESC 退出。', 'info');
          // 关闭弹窗，便于在页面上操作
          setTimeout(() => window.close(), 300);
        }
      } catch (error) {
        this.showMessage('启动失败，请刷新页面后重试', error);
      }
    });

    // 设置面板按钮
    const addEnvironmentBtn = document.getElementById('addEnvironmentBtn');
    const resetConfigBtn = document.getElementById('resetConfigBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    addEnvironmentBtn?.addEventListener('click', () => this.addEnvironment());
    resetConfigBtn?.addEventListener('click', () => this.resetConfig());
    saveSettingsBtn?.addEventListener('click', () => this.saveSettings());
  }

  // 渲染环境按钮
  renderEnvironments() {
    const container = document.getElementById('environmentsContainer');
    if (!container) return;

    container.innerHTML = '';

    // 检查是否是FSD页面，如果是则生成FSD环境按钮
    if (this.isFSDPage()) {
      this.renderFSDEnvironmentButtons(container);
    } else {
      // 原有的环境按钮渲染逻辑
      Object.entries(this.environments).forEach(([key, env]) => {
        const button = this.createEnvironmentButton(key, env);
        container.appendChild(button);
      });
    }
  }

  // 渲染环境切换按钮
  renderFSDEnvironmentButtons(container) {
    const domainPrefix = this.getDomainPrefix();
    if (!domainPrefix) return;

    // 获取域名配置（自动处理特殊和标准域名）
    const domainConfig = this.getDomainConfig(domainPrefix);
    const isSpecial = this.isSpecialDomain(domainPrefix);

    // 生成环境配置
    const environments = {
      dev: {
        name: `${domainPrefix.toUpperCase()}开发环境`,
        baseUrl: domainConfig.dev
      },
      
      
      test: {
        name: `${domainPrefix.toUpperCase()}测试环境`,
        baseUrl: domainConfig.test
      },
      st: {
        name: `${domainPrefix.toUpperCase()}预发环境`,
        baseUrl: domainConfig.st
      },
      prod: {
        name: `${domainPrefix.toUpperCase()}生产环境`,
        baseUrl: domainConfig.prod
      },
      
    };

    // 添加环境说明
    const description = document.createElement('div');
    description.className = 'fsd-env-description';
    description.innerHTML = `
      <div class="fsd-env-info">
        <span>检测到${domainPrefix.toUpperCase()}系统，已为您生成环境切换选项</span>
        ${isSpecial ? `<br><small style="color: #666;">使用特殊域名配置</small>` : ''}
      </div>
    `;
    // container.appendChild(description);

    // 渲染环境按钮（按指定顺序：dev、test、st、prod）
    const environmentOrder = ['dev', 'test', 'st', 'prod'];
    environmentOrder.forEach(key => {
      if (environments[key]) {
        const button = this.createFSDEnvironmentButton(key, environments[key]);
        container.appendChild(button);
      }
    });
  }

  // 创建环境按钮
  createFSDEnvironmentButton(key, env) {
    const button = document.createElement('button');
    button.className = 'env-btn smart-env-btn';
    button.dataset.env = key;

    // 检查是否为当前环境
    const isCurrentEnv = this.isCurrentEnvironment(key);
    if (isCurrentEnv) {
      button.classList.add('active');
    }

    button.innerHTML = `
      <div class="env-info">
        <div class="env-name">${env.name}</div>
        <div class="env-url">${env.baseUrl}</div>
      </div>
      <div class="env-indicator ${key}"></div>
    `;

    button.addEventListener('click', () => this.switchToFSDEnvironment(key));

    return button;
  }

  // 检查是否为当前环境
  isCurrentEnvironment(targetEnv) {
    if (!this.currentTab?.url) return false;
    
    const currentUrl = new URL(this.currentTab.url);
    const currentHostname = currentUrl.hostname;
    
    // 获取当前环境类型
    const currentEnv = this.getCurrentFSDEnvironment();
    if (!currentEnv) return false;
    
    return currentEnv === targetEnv;
  }

  // 获取当前环境类型
  getCurrentFSDEnvironment() {
    if (!this.currentTab?.url) return null;
    
    const currentUrl = new URL(this.currentTab.url);
    const currentHostname = currentUrl.hostname;
    
    // 智能检测环境类型
    if (currentHostname.includes('.waimai.st.sankuai.com')) {
      return 'st'; // 预发环境
    } else if (currentHostname.includes('.waimai.test.sankuai.com')) {
      return 'test'; // 测试环境
    } else if (currentHostname.endsWith('.sankuai.com') && !currentHostname.includes('.waimai.')) {
      return 'prod'; // 生产环境（不包含waimai的sankuai.com域名）
    } else if (currentHostname === '127.0.0.1' || currentHostname === 'localhost' || currentHostname.includes('.dev.')) {
      return 'dev'; // 开发环境
    }
    
    return null;
  }

  // 创建环境按钮
  createEnvironmentButton(key, env) {
    const button = document.createElement('button');
    button.className = 'env-btn';
    button.dataset.env = key;

    // 检查是否为当前环境
    if (this.currentTab?.currentEnv === key) {
      button.classList.add('active');
    }

    button.innerHTML = `
      <div class="env-info">
        <div class="env-name">${env.name}</div>
        <div class="env-url">${env.baseUrl}</div>
      </div>
      <div class="env-indicator ${key}"></div>
    `;

    button.addEventListener('click', () => this.switchEnvironment(key));

    return button;
  }

  // 切换环境
  async switchEnvironment(targetEnv) {
    if (!this.currentTab?.url) {
      this.showMessage('无法获取当前页面信息', 'error');
      return;
    }

    if (this.currentTab.currentEnv === targetEnv) {
      this.showMessage('已经在目标环境中', 'info');
      return;
    }

    this.showLoading(true);

    try {
      await chrome.runtime.sendMessage({
        action: 'switchEnvironment',
        targetEnv: targetEnv,
        currentUrl: this.currentTab.url
      });

      this.showMessage('环境切换成功', 'success');
      
      // 延迟关闭弹窗
      setTimeout(() => {
        window.close();
      }, 1000);

    } catch (error) {
      console.error('环境切换失败:', error);
      this.showMessage('环境切换失败', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // 切换到环境
  async switchToFSDEnvironment(targetEnv) {
    if (!this.currentTab?.url) {
      this.showMessage('无法获取当前页面信息', 'error');
      return;
    }

    this.showLoading(true);

    try {
      const domainPrefix = this.getDomainPrefix();
      if (!domainPrefix) {
        throw new Error('无法识别当前域名');
      }

      // 获取域名配置（自动处理特殊和标准域名）
      const domainConfig = this.getDomainConfig(domainPrefix);
      const targetBaseUrl = domainConfig[targetEnv];

      if (!targetBaseUrl) {
        throw new Error('无效的环境');
      }

      // 构建新的URL
      const currentUrl = new URL(this.currentTab.url);
      const newUrl = targetBaseUrl + currentUrl.pathname + currentUrl.search + currentUrl.hash;

      // 发送消息给background script进行环境切换
      await chrome.runtime.sendMessage({
        action: 'switchToFSDEnvironment',
        targetUrl: newUrl
      });

      const envNames = {
        prod: '生产',
        st: '预发',
        test: '测试',
        dev: '开发'
      };

      this.showMessage(`已切换到${envNames[targetEnv]}环境`, 'success');
      
      // 延迟关闭弹窗
      setTimeout(() => {
        window.close();
      }, 1000);

    } catch (error) {
      console.error('环境切换失败:', error);
      this.showMessage('环境切换失败', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // 更新当前信息显示
  updateCurrentInfo() {
    const currentUrlElement = document.getElementById('currentUrl');
    const currentEnvElement = document.getElementById('currentEnv');

    if (currentUrlElement && this.currentTab?.url) {
      const url = new URL(this.currentTab.url);
      currentUrlElement.textContent = `${url.hostname}${url.pathname}`;
    }

    if (currentEnvElement) {
      // 检查是否是支持环境切换的页面
      if (this.isFSDPage()) {
        const currentFSDEnv = this.getCurrentFSDEnvironment();
        const domainPrefix = this.getDomainPrefix();
        
        if (currentFSDEnv && domainPrefix) {
          const envNames = {
            prod: `${domainPrefix.toUpperCase()}生产环境`,
            st: `${domainPrefix.toUpperCase()}预发环境`,
            test: `${domainPrefix.toUpperCase()}测试环境`,
            dev: `${domainPrefix.toUpperCase()}开发环境`
          };
          currentEnvElement.textContent = `当前环境: ${envNames[currentFSDEnv]}`;
          currentEnvElement.className = `current-env ${currentFSDEnv}`;
        } else {
          currentEnvElement.textContent = `${domainPrefix ? domainPrefix.toUpperCase() : '系统'}环境`;
          currentEnvElement.className = 'current-env fsd';
        }
      } else {
        // 原有的环境检测逻辑
        const currentEnv = this.currentTab?.currentEnv;
        if (currentEnv && this.environments[currentEnv]) {
          currentEnvElement.textContent = `当前环境: ${this.environments[currentEnv].name}`;
          currentEnvElement.className = `current-env ${currentEnv}`;
        } else {
          currentEnvElement.textContent = '未识别环境';
          currentEnvElement.className = 'current-env unknown';
        }
      }
    }
  }

  // 显示设置面板
  showSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
      settingsPanel.style.display = 'block';
      this.renderEnvironmentConfig();
    }
  }

  // 隐藏设置面板
  hideSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
      settingsPanel.style.display = 'none';
    }
  }

  // 渲染环境配置表单
  renderEnvironmentConfig() {
    const container = document.getElementById('environmentConfig');
    if (!container) return;

    container.innerHTML = '';

    // 检查是否是FSD页面，如果是则生成FSD环境配置
    if (this.isFSDPage()) {
      this.renderFSDEnvironmentConfig(container);
    } else {
      // 原有的环境配置渲染逻辑
      Object.entries(this.environments).forEach(([key, env]) => {
        const configItem = this.createEnvironmentConfigItem(key, env);
        container.appendChild(configItem);
      });
    }
  }

  // 检查是否是支持环境切换的页面
  isFSDPage() {
    if (!this.currentTab?.url) return false;
    
    const url = new URL(this.currentTab.url);
    const hostname = url.hostname;
    
    // 检测是否是支持环境切换的域名
    // 支持任何以 .sankuai.com 结尾的域名
    // 包括特殊域名如 bots.sankuai.com
    return hostname.endsWith('.sankuai.com');
  }

  // 特殊域名映射配置
  getSpecialDomainConfig() {
    return {
      'xgpt': {
        prod: 'https://bots.sankuai.com',
        st: 'https://xgpt.waimai.st.sankuai.com',
        test: 'https://xgpt.waimai.test.sankuai.com',
        dev: 'http://127.0.0.1:8080'
      },
    };
  }

  // 获取域名前缀（如 fsd, sy, xgpt等）
  getDomainPrefix() {
    if (!this.currentTab?.url) return null;
    
    const url = new URL(this.currentTab.url);
    const hostname = url.hostname;
    
    // 智能提取域名前缀
    // 支持格式：
    // - prefix.sankuai.com (生产环境)
    // - prefix.waimai.env.sankuai.com (预发/测试环境)
    // - 特殊域名如 bots.sankuai.com (XGPT生产环境)
    
    // 特殊处理：bots.sankuai.com 识别为 XGPT 系统
    if (hostname === 'bots.sankuai.com') {
      return 'xgpt';
    }
    
    if (hostname.includes('.waimai.')) {
      // 环境域名格式：prefix.waimai.env.sankuai.com
      const parts = hostname.split('.');
      if (parts.length >= 4 && parts[1] === 'waimai') {
        return parts[0]; // 返回第一部分作为前缀
      }
    } else if (hostname.endsWith('.sankuai.com')) {
      // 生产域名格式：prefix.sankuai.com
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        return parts[0]; // 返回第一部分作为前缀
      }
    }
    
    return null;
  }

  // 检查是否为特殊域名
  isSpecialDomain(domainPrefix) {
    const specialConfig = this.getSpecialDomainConfig();
    return specialConfig.hasOwnProperty(domainPrefix);
  }

  // 生成标准域名配置
  generateStandardDomainConfig(domainPrefix) {
    return {
      prod: `https://${domainPrefix}.sankuai.com`,
      st: `https://${domainPrefix}.waimai.st.sankuai.com`,
      test: `https://${domainPrefix}.waimai.test.sankuai.com`,
      dev: `http://127.0.0.1:8080`
    };
  }

  // 获取域名配置（优先使用特殊配置，否则生成标准配置）
  getDomainConfig(domainPrefix) {
    if (this.isSpecialDomain(domainPrefix)) {
      return this.getSpecialDomainConfig()[domainPrefix];
    } else {
      return this.generateStandardDomainConfig(domainPrefix);
    }
  }

  // 渲染环境配置
  renderFSDEnvironmentConfig(container) {
    const domainPrefix = this.getDomainPrefix();
    if (!domainPrefix) return;

    // 获取域名配置（自动处理特殊和标准域名）
    const domainConfig = this.getDomainConfig(domainPrefix);
    const isSpecial = this.isSpecialDomain(domainPrefix);

    // 生成环境配置
    const environments = {
      prod: {
        name: `${domainPrefix.toUpperCase()}生产环境`,
        pattern: 'prod',
        baseUrl: domainConfig.prod
      },
      st: {
        name: `${domainPrefix.toUpperCase()}预发环境`,
        pattern: 'st',
        baseUrl: domainConfig.st
      },
      test: {
        name: `${domainPrefix.toUpperCase()}测试环境`,
        pattern: 'test',
        baseUrl: domainConfig.test
      },
      dev: {
        name: `${domainPrefix.toUpperCase()}开发环境`,
        pattern: 'dev',
        baseUrl: domainConfig.dev
      }
    };

    // 添加环境配置说明
    const description = document.createElement('div');
    description.className = 'fsd-description';
    description.innerHTML = `
      <div class="fsd-info">
        <h3>${domainPrefix.toUpperCase()}环境配置</h3>
        <p>检测到您正在访问${domainPrefix.toUpperCase()}系统，已为您生成对应的环境切换配置</p>
        ${isSpecial ? `<p style="color: #666; font-size: 12px;">⚠️ 使用特殊域名配置</p>` : ''}
      </div>
    `;
    container.appendChild(description);

    // 渲染环境配置项
    Object.entries(environments).forEach(([key, env]) => {
      const configItem = this.createFSDEnvironmentConfigItem(key, env);
      container.appendChild(configItem);
    });
  }

  // 创建FSD环境配置项
  createFSDEnvironmentConfigItem(key, env) {
    const item = document.createElement('div');
    item.className = 'env-config-item fsd-env';
    item.dataset.envKey = key;

    item.innerHTML = `
      <div class="env-config-header">
        <div class="env-config-title">${env.name} (${key})</div>
        <div class="env-status">已配置</div>
      </div>
      <div class="form-group">
        <label class="form-label">环境名称</label>
        <input type="text" class="form-input" name="name" value="${env.name}" placeholder="例如: FSD生产环境" readonly>
      </div>
      <div class="form-group">
        <label class="form-label">匹配模式</label>
        <input type="text" class="form-input" name="pattern" value="${env.pattern}" placeholder="例如: prod" readonly>
      </div>
      <div class="form-group">
        <label class="form-label">基础URL</label>
        <input type="text" class="form-input" name="baseUrl" value="${env.baseUrl}" placeholder="例如: https://fsd.sankuai.com" readonly>
      </div>
      <div class="fsd-actions">
        <button class="switch-fsd-btn" onclick="environmentSwitcher.switchToFSDEnvironment('${key}')">
          切换到${env.name}
        </button>
      </div>
    `;

    return item;
  }

  // 创建环境配置项
  createEnvironmentConfigItem(key, env) {
    const item = document.createElement('div');
    item.className = 'env-config-item';
    item.dataset.envKey = key;

    item.innerHTML = `
      <div class="env-config-header">
        <div class="env-config-title">${env.name} (${key})</div>
        <button class="remove-env-btn" onclick="environmentSwitcher.removeEnvironment('${key}')">删除</button>
      </div>
      <div class="form-group">
        <label class="form-label">环境名称</label>
        <input type="text" class="form-input" name="name" value="${env.name}" placeholder="例如: Development">
      </div>
      <div class="form-group">
        <label class="form-label">匹配模式</label>
        <input type="text" class="form-input" name="pattern" value="${env.pattern}" placeholder="例如: dev">
      </div>
      <div class="form-group">
        <label class="form-label">基础URL</label>
        <input type="text" class="form-input" name="baseUrl" value="${env.baseUrl}" placeholder="例如: https://example.dev.com">
      </div>
    `;

    return item;
  }

  // 添加新环境
  addEnvironment() {
    const newKey = `env_${Date.now()}`;
    const newEnv = {
      name: '新环境',
      pattern: 'new',
      baseUrl: 'https://example.com'
    };

    this.environments[newKey] = newEnv;
    this.renderEnvironmentConfig();
  }

  // 删除环境
  removeEnvironment(key) {
    if (confirm(`确定要删除环境 "${this.environments[key]?.name}" 吗？`)) {
      delete this.environments[key];
      this.renderEnvironmentConfig();
    }
  }

  // 重置配置
  async resetConfig() {
    if (confirm('确定要重置所有环境配置吗？这将恢复默认设置。')) {
      try {
        await chrome.storage.sync.remove(['environments']);
        await this.loadEnvironments();
        this.renderEnvironmentConfig();
        this.showMessage('配置已重置', 'success');
      } catch (error) {
        console.error('重置配置失败:', error);
        this.showMessage('重置配置失败', 'error');
      }
    }
  }

  // 保存设置
  async saveSettings() {
    try {
      const configItems = document.querySelectorAll('.env-config-item');
      const newEnvironments = {};

      configItems.forEach(item => {
        const key = item.dataset.envKey;
        const nameInput = item.querySelector('input[name="name"]');
        const patternInput = item.querySelector('input[name="pattern"]');
        const baseUrlInput = item.querySelector('input[name="baseUrl"]');

        if (nameInput?.value && patternInput?.value && baseUrlInput?.value) {
          newEnvironments[key] = {
            name: nameInput.value.trim(),
            pattern: patternInput.value.trim(),
            baseUrl: baseUrlInput.value.trim()
          };
        }
      });

      await chrome.storage.sync.set({ environments: newEnvironments });
      this.environments = newEnvironments;
      
      this.hideSettings();
      this.renderEnvironments();
      this.showMessage('设置已保存', 'success');

    } catch (error) {
      console.error('保存设置失败:', error);
      this.showMessage('保存设置失败', 'error');
    }
  }

  // 显示加载状态
  showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
  }

  // 显示消息
  showMessage(message, type = 'info') {
    // 创建临时消息元素
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 3000;
      color: white;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
    `;
    messageEl.textContent = message;

    document.body.appendChild(messageEl);

    // 3秒后移除
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, 3000);
  }
}

// 初始化环境切换器
let environmentSwitcher;

document.addEventListener('DOMContentLoaded', () => {
  environmentSwitcher = new EnvironmentSwitcher();
});