# 环境切换助手 Chrome 扩展

一个强大的Chrome浏览器扩展，帮助开发者快速在不同环境（dev、test、staging、prod等）之间切换URL地址。

## ✨ 功能特性

- 🔄 **一键环境切换**: 支持在dev、test、staging、prod等环境间快速切换
- 🎯 **智能URL匹配**: 基于正则规则自动识别当前环境
- ⚙️ **灵活配置**: 支持自定义环境配置和URL模式
- 🎨 **直观界面**: 清晰的弹出窗口，显示当前环境状态
- 📱 **响应式设计**: 适配不同屏幕尺寸

## 🚀 快速开始

### 安装方式

#### 方式一：从源码安装（推荐开发者）

1. 克隆或下载项目到本地
2. 安装依赖（可选）：
   ```bash
   pnpm install
   ```
3. 构建扩展：
   ```bash
   pnpm run build
   ```
4. 在Chrome中加载扩展：
   - 打开 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录

#### 方式二：安装打包版本

1. 下载预构建的zip包
2. 解压到本地目录
3. 在Chrome中加载解压后的目录

### 使用方法

1. **访问任意网站**: 打开你要切换环境的网站
2. **点击扩展图标**: 在浏览器工具栏点击环境切换助手图标
3. **选择目标环境**: 在弹出窗口中点击要切换到的环境
4. **自动跳转**: 扩展会自动构建新URL并跳转

### 配置环境

1. 点击扩展图标打开弹窗
2. 点击右上角的设置按钮⚙️
3. 在设置面板中：
   - 修改现有环境配置
   - 添加新的环境
   - 删除不需要的环境
4. 点击"保存设置"

## 🛠️ 开发指南

### 项目结构

```
environment-switcher-extension/
├── manifest.json          # Chrome扩展配置文件
├── popup.html             # 弹出窗口HTML
├── src/                   # 源代码目录
│   ├── background.js      # 后台脚本
│   └── content.js         # 内容脚本
├── scripts/               # 构建脚本
│   ├── popup.js          # 弹出窗口逻辑
│   ├── build.js          # 构建脚本
│   ├── dev.js            # 开发服务器
│   └── package.js        # 打包脚本
├── styles/               # 样式文件
│   └── popup.css         # 弹出窗口样式
├── icons/                # 图标文件
└── dist/                 # 构建输出目录
```

### 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式（监听文件变化自动重建）
pnpm run dev

# 构建扩展
pnpm run build

# 打包发布版本
pnpm run package

# 清理构建文件
pnpm run clean
```

### 开发流程

1. **启动开发模式**:
   ```bash
   pnpm run dev
   ```

2. **在Chrome中加载扩展**:
   - 打开 `chrome://extensions/`
   - 加载 `dist` 目录

3. **修改代码**: 文件变化会自动触发重建

4. **刷新扩展**: 在Chrome扩展管理页面点击刷新按钮

## 📦 构建和发布

### 本地构建

```bash
# 构建开发版本
pnpm run build

# 构建并打包发布版本
pnpm run package
```

构建完成后会生成：
- `dist/` - 开发版本目录
- `packages/` - 打包的zip文件

### Chrome商店发布

1. 运行打包命令生成发布版本
2. 访问 [Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole/)
3. 创建新应用并上传生产版本的zip文件
4. 填写应用信息、截图、描述等
5. 提交审核

## ⚙️ 配置说明

### 默认环境配置

扩展默认包含以下环境配置：

```javascript
{
  dev: {
    name: 'Development',
    pattern: 'dev',
    baseUrl: 'https://xgpt.waimai.dev.sankuai.com'
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
    baseUrl: 'https://xgpt.waimai.sankuai.com'
  }
}
```

### 环境匹配规则

- **模式匹配**: 通过URL中的模式字符串识别环境（如`.dev.`、`.test.`等）
- **路径保持**: 切换环境时保持原URL的路径和查询参数
- **智能识别**: 自动检测当前页面所属的环境

## 🔧 故障排除

### 常见问题

1. **扩展无法加载**
   - 检查manifest.json语法
   - 确认所有必需文件存在
   - 查看Chrome扩展页面的错误信息

2. **环境切换不生效**
   - 检查环境配置是否正确
   - 确认URL匹配规则
   - 查看浏览器控制台错误

3. **图标不显示**
   - 确认图标文件存在
   - 检查图标路径配置
   - 尝试重新加载扩展

### 调试方法

1. **查看后台脚本日志**:
   - 打开 `chrome://extensions/`
   - 点击扩展的"背景页"链接
   - 查看控制台输出

2. **调试弹出窗口**:
   - 右键点击扩展图标
   - 选择"检查弹出窗口"
   - 使用开发者工具调试

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如有问题或建议，请：
1. 提交GitHub Issue
2. 发送邮件至开发者
3. 查看项目Wiki文档

---

**享受高效的环境切换体验！** 🚀