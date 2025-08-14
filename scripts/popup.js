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
        console.error('启动元素选择器失败:', error);
        this.showMessage('启动失败，请刷新页面后重试', 'error');
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

    Object.entries(this.environments).forEach(([key, env]) => {
      const button = this.createEnvironmentButton(key, env);
      container.appendChild(button);
    });
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

  // 更新当前信息显示
  updateCurrentInfo() {
    const currentUrlElement = document.getElementById('currentUrl');
    const currentEnvElement = document.getElementById('currentEnv');

    if (currentUrlElement && this.currentTab?.url) {
      const url = new URL(this.currentTab.url);
      currentUrlElement.textContent = `${url.hostname}${url.pathname}`;
    }

    if (currentEnvElement) {
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

    Object.entries(this.environments).forEach(([key, env]) => {
      const configItem = this.createEnvironmentConfigItem(key, env);
      container.appendChild(configItem);
    });
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