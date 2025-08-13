# 安装指南

## 🚀 快速安装

### 方式一：从源码构建安装（推荐）

1. **下载项目**
   ```bash
   git clone <repository-url>
   cd environment-switcher-extension
   ```

2. **安装依赖（可选）**
   ```bash
   pnpm install
   ```

3. **构建扩展**
   ```bash
   pnpm run build
   ```

4. **在Chrome中安装**
   - 打开Chrome浏览器
   - 访问 `chrome://extensions/`
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目中的 `dist` 目录
   - 扩展安装完成！

### 方式二：直接使用构建包

1. **下载预构建包**
   - 下载项目的zip文件
   - 解压到本地目录

2. **构建（如果需要）**
   ```bash
   pnpm run build
   ```

3. **安装到Chrome**
   - 按照方式一的第4步操作

## 📱 使用方法

### 基本使用

1. **访问目标网站**
   - 打开你想要切换环境的网站
   - 例如：`https://xgpt.waimai.test.sankuai.com/space/SPe99e500533e44f48/workflow`

2. **打开扩展**
   - 点击浏览器工具栏中的扩展图标
   - 扩展会自动检测当前环境

3. **切换环境**
   - 在弹出窗口中点击目标环境按钮
   - 页面会自动跳转到对应环境的相同路径

### 环境配置

1. **打开设置**
   - 点击扩展图标
   - 点击右上角的设置按钮⚙️

2. **配置环境**
   - **环境名称**：显示名称（如"Development"）
   - **匹配模式**：URL中的环境标识（如"dev"、"test"）
   - **基础URL**：环境的根URL地址

3. **保存设置**
   - 修改完成后点击"保存设置"
   - 返回主界面查看新配置

## 🔧 开发者安装

### 开发环境设置

1. **安装Node.js和pnpm**
   ```bash
   # 安装pnpm
   npm install -g pnpm
   ```

2. **克隆项目**
   ```bash
   git clone <repository-url>
   cd environment-switcher-extension
   ```

3. **安装依赖**
   ```bash
   pnpm install
   ```

4. **启动开发模式**
   ```bash
   pnpm run dev
   ```

5. **在Chrome中加载**
   - 访问 `chrome://extensions/`
   - 开启开发者模式
   - 加载 `dist` 目录

### 开发工作流

1. **修改代码** - 编辑源文件
2. **自动构建** - 开发模式会自动重建
3. **刷新扩展** - 在Chrome扩展页面点击刷新
4. **测试功能** - 验证修改效果

## 📦 打包发布

### 创建发布包

```bash
# 创建生产版本包
pnpm run package
```

生成文件：
- `packages/environment-switcher-v1.0.0-dev-[日期].zip` - 开发版本
- `packages/environment-switcher-v1.0.0-release.zip` - 生产版本

### Chrome商店发布

1. **准备发布包**
   - 使用生产版本的zip文件
   - 确保所有功能正常工作

2. **提交到Chrome商店**
   - 访问 [Chrome开发者控制台](https://chrome.google.com/webstore/devconsole/)
   - 创建新应用
   - 上传zip文件
   - 填写应用信息
   - 提交审核

## 🛠️ 故障排除

### 安装问题

**问题：扩展无法加载**
- ✅ 检查manifest.json语法是否正确
- ✅ 确认所有必需文件都存在
- ✅ 查看Chrome扩展页面的错误信息

**问题：构建失败**
- ✅ 确认Node.js版本 >= 14
- ✅ 检查文件路径是否正确
- ✅ 重新安装依赖：`rm -rf node_modules && pnpm install`

### 功能问题

**问题：环境切换不生效**
- ✅ 检查环境配置是否正确
- ✅ 确认URL匹配规则
- ✅ 查看浏览器控制台是否有错误

**问题：无法识别当前环境**
- ✅ 检查URL是否包含环境标识
- ✅ 确认匹配模式配置正确
- ✅ 尝试手动配置环境规则

### 调试方法

1. **查看后台脚本日志**
   ```
   chrome://extensions/ → 点击"背景页" → 查看控制台
   ```

2. **调试弹出窗口**
   ```
   右键扩展图标 → "检查弹出窗口" → 使用开发者工具
   ```

3. **查看存储数据**
   ```javascript
   // 在控制台中执行
   chrome.storage.sync.get(null, console.log)
   ```

## 📋 系统要求

- **浏览器**：Chrome 88+ 或基于Chromium的浏览器
- **开发环境**：Node.js 14+, pnpm 6+
- **操作系统**：Windows, macOS, Linux

## 🔄 更新扩展

### 开发版本更新
1. 拉取最新代码
2. 运行 `pnpm run build`
3. 在Chrome扩展页面点击刷新按钮

### 商店版本更新
- Chrome会自动检测并更新商店版本

## 📞 获取帮助

如果遇到问题：
1. 查看本文档的故障排除部分
2. 检查项目的GitHub Issues
3. 提交新的Issue描述问题
4. 联系开发者获取支持

---

**祝你使用愉快！** 🎉