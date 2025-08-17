# 开发环境切换功能测试说明

## 测试目标

验证环境切换助手现在支持开发环境（dev）的切换，并且开发环境选项与其他环境选项样式保持一致。

## 新增功能

### 开发环境支持
现在系统支持四个环境：
1. **生产环境** (prod) - `https://{prefix}.sankuai.com`
2. **预发环境** (st) - `https://{prefix}.waimai.st.sankuai.com`
3. **测试环境** (test) - `https://{prefix}.waimai.test.sankuai.com`
4. **开发环境** (dev) - `http://127.0.0.1:8080`

### 开发环境识别
系统能自动识别以下开发环境：
- `http://127.0.0.1:8080`
- `http://localhost:8080`
- 包含 `.dev.` 的域名

## 配置更新

### 特殊域名配置
```javascript
'xgpt': {
  prod: 'https://bots.sankuai.com',
  st: 'https://xgpt.waimai.st.sankuai.com',
  test: 'https://xgpt.waimai.test.sankuai.com',
  dev: 'http://127.0.0.1:8080'  // 新增
},
'fst': {
  prod: 'https://fst.sankuai.com',
  st: 'https://fst.waimai.st.sankuai.com',
  test: 'https://fst.waimai.test.sankuai.com',
  dev: 'http://127.0.0.1:8080'  // 新增
},
'fsd': {
  prod: 'https://fsd.sankuai.com',
  st: 'https://fsd.waimai.st.sankuai.com',
  test: 'https://fsd.waimai.test.sankuai.com',
  dev: 'http://127.0.0.1:8080'  // 新增
}
```

### 标准域名配置
```javascript
// 自动生成的开发环境配置
dev: `http://127.0.0.1:8080`
```

## 测试步骤

### 1. 测试生产环境页面
- 访问 `https://fsd.sankuai.com/workbench`
- 打开环境切换助手
- 验证显示四个环境选项：
  - FSD生产环境
  - FSD预发环境
  - FSD测试环境
  - **FSD开发环境** ← 新增

### 2. 测试预发环境页面
- 访问 `https://xgpt.waimai.st.sankuai.com/create`
- 打开环境切换助手
- 验证显示四个环境选项：
  - XGPT生产环境
  - XGPT预发环境
  - XGPT测试环境
  - **XGPT开发环境** ← 新增

### 3. 测试开发环境页面
- 访问 `http://127.0.0.1:8080`
- 打开环境切换助手
- 验证显示四个环境选项：
  - 系统生产环境
  - 系统预发环境
  - 系统测试环境
  - **系统开发环境** ← 当前环境，应该高亮

## 预期结果

### 成功情况
- ✅ 所有环境页面都显示四个环境选项
- ✅ 开发环境选项样式与其他环境一致
- ✅ 开发环境URL正确显示为 `http://127.0.0.1:8080`
- ✅ 当前环境正确高亮显示
- ✅ 环境切换功能正常工作

### 失败情况
- ❌ 仍然只显示三个环境选项
- ❌ 开发环境选项缺失
- ❌ 开发环境样式不一致
- ❌ 开发环境切换失败

## 环境切换测试

### 1. 从生产环境切换到开发环境
- 当前：`https://fsd.sankuai.com/workbench`
- 点击：`FSD开发环境`
- 预期：跳转到 `http://127.0.0.1:8080/workbench`
- 消息：显示"已切换到开发环境"

### 2. 从预发环境切换到开发环境
- 当前：`https://xgpt.waimai.st.sankuai.com/create`
- 点击：`XGPT开发环境`
- 预期：跳转到 `http://127.0.0.1:8080/create`
- 消息：显示"已切换到开发环境"

### 3. 从开发环境切换到其他环境
- 当前：`http://127.0.0.1:8080/dashboard`
- 点击：任意其他环境
- 预期：正确跳转到目标环境
- 消息：显示对应的切换成功消息

## 样式验证

### 按钮样式
- 所有四个环境按钮都应该使用 `smart-env-btn` 样式
- 统一的紫色主题
- 一致的悬停效果和激活状态

### 环境指示器
```css
.env-indicator.prod { background: #dc3545; }  /* 红色 - 生产环境 */
.env-indicator.st { background: #fd7e14; }    /* 橙色 - 预发环境 */
.env-indicator.test { background: #ffc107; }  /* 黄色 - 测试环境 */
.env-indicator.dev { background: #28a745; }   /* 绿色 - 开发环境 */
```

### 当前环境标签
```css
.current-env.prod { background: #f8d7da; color: #721c24; }
.current-env.st { background: #fff3cd; color: #856404; }
.current-env.test { background: #d1ecf1; color: #0c5460; }
.current-env.dev { background: #d4edda; color: #155724; }
```

## 技术实现

### 新增方法
1. **开发环境检测**：在 `getCurrentFSDEnvironment` 中添加开发环境识别
2. **开发环境配置**：在所有域名配置中添加 `dev` 环境
3. **开发环境渲染**：在环境按钮渲染中添加开发环境选项

### 代码变更
```javascript
// 新增开发环境检测
} else if (currentHostname === '127.0.0.1' || currentHostname === 'localhost' || currentHostname.includes('.dev.')) {
  return 'dev'; // 开发环境
}

// 新增开发环境配置
dev: {
  name: `${domainPrefix.toUpperCase()}开发环境`,
  baseUrl: domainConfig.dev
}

// 新增开发环境名称映射
dev: '开发'
```

## 注意事项

1. **本地开发**：确保本地开发服务器在 `127.0.0.1:8080` 运行
2. **网络访问**：开发环境通常只在本地可访问
3. **权限要求**：扩展需要访问本地地址的权限
4. **浏览器兼容**：确保浏览器允许访问本地地址

## 测试完成标准

- [ ] 所有环境页面都显示四个环境选项
- [ ] 开发环境选项正确显示
- [ ] 开发环境样式与其他环境一致
- [ ] 开发环境切换功能正常
- [ ] 当前环境正确高亮
- [ ] 环境指示器颜色正确
- [ ] 切换消息显示正确

## 扩展支持

现在系统支持完整的四环境架构：
- **生产环境**：正式发布版本
- **预发环境**：预发布测试版本
- **测试环境**：功能测试版本
- **开发环境**：本地开发版本

所有域名都会显示完整的四环境切换选项，为开发人员提供更灵活的环境管理能力！
