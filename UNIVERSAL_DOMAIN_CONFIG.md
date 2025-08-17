# 通用域名配置系统

## 系统概述

环境切换助手现在采用**通用域名配置系统**，支持任何符合命名规范的 `.sankuai.com` 域名，同时兼容特殊域名的自定义配置。

## 配置策略

### 1. 标准域名规则（自动生成）
对于大多数域名，系统会自动生成标准的环境配置：

```
生产环境: https://{prefix}.sankuai.com
预发环境: https://{prefix}.waimai.st.sankuai.com
测试环境: https://{prefix}.waimai.test.sankuai.com
```

**支持的域名示例：**
- `https://fst.sankuai.com` → 自动生成FST环境配置
- `https://fsd.sankuai.com` → 自动生成FSD环境配置
- `https://abs.sankuai.com` → 自动生成ABS环境配置
- `https://any.sankuai.com` → 自动生成ANY环境配置

### 2. 特殊域名规则（手动配置）
对于有特殊跳转规则的域名，可以在配置中单独定义：

```javascript
'xgpt': {
  prod: 'https://bots.sankuai.com',           // 特殊：跳转到bots.sankuai.com
  st: 'https://xgpt.waimai.st.sankuai.com',  // 标准：预发环境
  test: 'https://xgpt.waimai.test.sankuai.com' // 标准：测试环境
}
```

## 配置优先级

1. **特殊域名配置**：如果在特殊配置清单中，使用自定义规则
2. **标准域名配置**：如果不在特殊配置中，自动生成标准规则

## 支持的域名类型

### 标准域名（自动支持）
| 域名前缀 | 生产环境 | 预发环境 | 测试环境 |
|----------|----------|----------|----------|
| `fst` | `https://fst.sankuai.com` | `https://fst.waimai.st.sankuai.com` | `https://fst.waimai.test.sankuai.com` |
| `fsd` | `https://fsd.sankuai.com` | `https://fsd.waimai.st.sankuai.com` | `https://fsd.waimai.test.sankuai.com` |
| `abs` | `https://abs.sankuai.com` | `https://abs.waimai.st.sankuai.com` | `https://abs.waimai.test.sankuai.com` |
| `any` | `https://any.sankuai.com` | `https://any.waimai.st.sankuai.com` | `https://any.waimai.test.sankuai.com` |

### 特殊域名（手动配置）
| 域名前缀 | 生产环境 | 预发环境 | 测试环境 | 说明 |
|----------|----------|----------|----------|------|
| `xgpt` | `https://bots.sankuai.com` | `https://xgpt.waimai.st.sankuai.com` | `https://xgpt.waimai.test.sankuai.com` | 生产环境跳转到bots.sankuai.com |

## 技术实现

### 核心方法

```javascript
// 1. 获取域名前缀
getDomainPrefix() {
  // 智能提取域名前缀
  // 支持 prefix.sankuai.com 和 prefix.waimai.env.sankuai.com 格式
}

// 2. 检查是否为特殊域名
isSpecialDomain(domainPrefix) {
  // 检查是否在特殊配置清单中
}

// 3. 生成标准域名配置
generateStandardDomainConfig(domainPrefix) {
  // 自动生成标准的环境配置
}

// 4. 获取最终域名配置
getDomainConfig(domainPrefix) {
  // 优先使用特殊配置，否则生成标准配置
}
```

### 配置流程

```
访问域名 → 提取前缀 → 检查特殊配置 → 生成环境配置 → 渲染UI
    ↓           ↓           ↓           ↓         ↓
  xgpt.waimai.st.sankuai.com → xgpt → 特殊域名 → 使用自定义规则 → 显示XGPT环境
  fst.sankuai.com → fst → 标准域名 → 自动生成规则 → 显示FST环境
```

## 扩展新域名

### 添加标准域名
无需任何配置，只要域名符合规范即可自动支持：
```
https://new-system.sankuai.com → 自动支持
https://new-system.waimai.st.sankuai.com → 自动支持
https://new-system.waimai.test.sankuai.com → 自动支持
```

### 添加特殊域名
在 `getSpecialDomainConfig()` 方法中添加配置：

```javascript
'new-system': {
  prod: 'https://custom-prod.sankuai.com',     // 自定义生产环境
  st: 'https://new-system.waimai.st.sankuai.com',   // 标准预发环境
  test: 'https://new-system.waimai.test.sankuai.com' // 标准测试环境
}
```

## 使用示例

### 场景1：标准域名
1. 访问 `https://fst.sankuai.com/dashboard`
2. 系统自动识别为FST系统
3. 生成标准环境配置
4. 可切换到预发：`https://fst.waimai.st.sankuai.com/dashboard`

### 场景2：特殊域名
1. 访问 `https://xgpt.waimai.st.sankuai.com/create`
2. 系统识别为XGPT系统（特殊域名）
3. 使用特殊配置：生产环境跳转到 `https://bots.sankuai.com`
4. 可切换到生产：`https://bots.sankuai.com/create`

## 优势特性

### 1. 通用性
- 支持任何符合命名规范的域名
- 无需手动配置新系统
- 自动适应新的业务系统

### 2. 灵活性
- 支持标准域名自动生成
- 支持特殊域名自定义配置
- 配置优先级清晰

### 3. 可维护性
- 代码结构清晰
- 配置集中管理
- 易于扩展和维护

## 注意事项

1. **命名规范**：域名必须遵循标准格式
2. **特殊配置**：特殊域名需要在配置清单中明确定义
3. **优先级**：特殊配置优先于标准配置
4. **扩展性**：新增标准域名无需修改代码

## 更新日志

### v2.1.0 (2025-01-02)
- ✨ 新增通用域名配置系统
- ✨ 支持自动生成标准域名规则
- ✨ 兼容特殊域名自定义配置
- 🔧 重构代码架构，提升可维护性
- 📝 完善配置文档和示例
