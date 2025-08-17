# BOTS域名环境切换测试说明

## 测试目标

验证当访问 `https://bots.sankuai.com/` 时，环境切换助手能正确显示环境切换选项，并且样式与 `fsd.sankuai.com` 保持一致。

## 修复内容

### 问题描述
之前访问 `https://bots.sankuai.com/` 时：
1. 系统无法识别为支持环境切换的域名
2. 没有显示环境切换选项
3. 样式与 `fsd.sankuai.com` 不一致

### 修复方案
1. **扩展域名检测范围**：`isFSDPage()` 方法现在支持任何 `.sankuai.com` 域名
2. **特殊域名识别**：`bots.sankuai.com` 被识别为 XGPT 系统
3. **统一样式应用**：所有环境按钮都使用 `smart-env-btn` 样式

## 技术实现

### 1. 域名检测逻辑
```javascript
// 修复前：只检测特定域名
isFSDPage() {
  return (hostname.includes('sankuai.com') && 
          (hostname.includes('fsd') || hostname.includes('sy') || hostname.includes('waimai')));
}

// 修复后：支持所有.sankuai.com域名
isFSDPage() {
  return hostname.endsWith('.sankuai.com');
}
```

### 2. 特殊域名识别
```javascript
// 特殊处理：bots.sankuai.com 识别为 XGPT 系统
if (hostname === 'bots.sankuai.com') {
  return 'xgpt';
}
```

### 3. 统一样式应用
```javascript
// 所有环境按钮都使用统一的样式类
button.className = 'env-btn smart-env-btn';
```

## 测试步骤

### 1. 访问BOTS域名
- 在浏览器中访问：`https://bots.sankuai.com/`
- 确保页面能正常加载

### 2. 打开环境切换助手
- 点击浏览器工具栏中的环境切换助手图标
- 应该看到弹窗显示

### 3. 验证域名识别
- 红色框区域应该显示：`bots.sankuai.com/`
- 当前环境应该显示：`当前环境: XGPT生产环境`

### 4. 验证环境切换选项
- 蓝色信息框应该显示：`检测到XGPT系统，已为您生成环境切换选项`
- 应该显示三个环境按钮，都使用紫色主题：
  - **XGPT生产环境** (https://bots.sankuai.com) ← 当前环境，应该高亮
  - **XGPT预发环境** (https://xgpt.waimai.st.sankuai.com)
  - **XGPT测试环境** (https://xgpt.waimai.test.sankuai.com)

### 5. 验证样式一致性
- 所有环境按钮都应该使用统一的紫色主题
- 样式应该与 `fsd.sankuai.com` 完全一致

## 预期结果

### 成功情况
- ✅ 自动识别BOTS域名为XGPT系统
- ✅ 正确显示当前环境（生产环境）
- ✅ 生成XGPT环境切换选项
- ✅ 所有按钮使用统一的紫色主题
- ✅ 样式与FSD域名完全一致

### 失败情况
- ❌ 仍然显示"系统环境"标签
- ❌ 环境切换选项为空
- ❌ 按钮样式不一致
- ❌ 无法识别BOTS域名

## 样式对比

### 修复前
```
访问 fsd.sankuai.com → 显示环境切换选项，紫色主题 ✅
访问 bots.sankuai.com → 不显示环境切换选项 ❌
```

### 修复后
```
访问 fsd.sankuai.com → 显示环境切换选项，紫色主题 ✅
访问 bots.sankuai.com → 显示环境切换选项，紫色主题 ✅
```

## 环境切换测试

### 1. 切换到预发环境
- 点击"XGPT预发环境"按钮
- 应该跳转到：`https://xgpt.waimai.st.sankuai.com/`
- 显示"已切换到预发环境"消息

### 2. 切换到测试环境
- 点击"XGPT测试环境"按钮
- 应该跳转到：`https://xgpt.waimai.test.sankuai.com/`
- 显示"已切换到测试环境"消息

### 3. 切换回生产环境
- 点击"XGPT生产环境"按钮
- 应该跳转到：`https://bots.sankuai.com/`
- 显示"已切换到生产环境"消息

## 技术验证

### 域名识别测试
```javascript
// 测试用例
'bots.sankuai.com' -> 'xgpt' ✅
'xgpt.waimai.st.sankuai.com' -> 'xgpt' ✅
'xgpt.waimai.test.sankuai.com' -> 'xgpt' ✅
```

### 环境类型检测测试
```javascript
// 测试用例
'bots.sankuai.com' -> 'prod' (生产环境) ✅
'xgpt.waimai.st.sankuai.com' -> 'st' (预发环境) ✅
'xgpt.waimai.test.sankuai.com' -> 'test' (测试环境) ✅
```

## 注意事项

1. **网络要求**：确保能访问所有XGPT环境域名
2. **权限要求**：扩展需要标签页访问权限
3. **浏览器版本**：建议使用Chrome 88+版本
4. **样式一致性**：所有环境按钮都应该使用相同的紫色主题

## 测试完成标准

- [ ] BOTS域名识别正常
- [ ] 当前环境显示正确
- [ ] 环境切换选项完整
- [ ] 按钮样式统一（紫色主题）
- [ ] 环境切换功能正常
- [ ] 样式与FSD域名一致

## 扩展支持

现在系统支持更多域名类型：
- **标准域名**：`fst.sankuai.com`、`fsd.sankuai.com`、`abs.sankuai.com`
- **特殊域名**：`bots.sankuai.com` (XGPT生产环境)
- **环境域名**：`*.waimai.st.sankuai.com`、`*.waimai.test.sankuai.com`

所有域名都会显示统一的环境切换选项，并使用一致的紫色主题样式！
