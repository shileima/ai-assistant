# XGPT域名环境切换测试说明

## 测试目标

验证环境切换助手是否能正确识别和处理 `https://xgpt.waimai.st.sankuai.com/create` 域名。

## 修复内容

### 问题描述
之前访问 `https://xgpt.waimai.st.sankuai.com/create` 时，环境切换选项没有显示，因为：
1. `getDomainPrefix()` 方法只硬编码了 `fsd` 和 `sy` 域名
2. 没有处理 `xgpt` 等其他域名前缀

### 修复方案
将硬编码的域名检测改为智能域名前缀提取：

```javascript
// 修复前：硬编码检测
if (hostname.includes('fsd.sankuai.com')) return 'fsd';
if (hostname.includes('sy.sankuai.com')) return 'sy';

// 修复后：智能提取
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
```

## 测试步骤

### 1. 访问XGPT预发环境
- 在浏览器中访问：`https://xgpt.waimai.st.sankuai.com/create`
- 确保页面能正常加载

### 2. 打开环境切换助手
- 点击浏览器工具栏中的环境切换助手图标
- 应该看到弹窗显示

### 3. 验证域名识别
- 红色框区域应该显示：`xgpt.waimai.st.sankuai.com/create`
- 当前环境应该显示：`当前环境: XGPT预发环境`

### 4. 验证环境切换选项
- 绿色框区域应该显示XGPT环境配置：
  - **XGPT生产环境** (https://xgpt.sankuai.com)
  - **XGPT预发环境** (https://xgpt.waimai.st.sankuai.com) ← 当前环境，应该高亮
  - **XGPT测试环境** (https://xgpt.waimai.test.sankuai.com)

## 预期结果

### 成功情况
- ✅ 自动识别XGPT域名前缀
- ✅ 正确显示当前环境（预发环境）
- ✅ 生成XGPT环境切换选项
- ✅ 当前环境高亮显示
- ✅ 环境切换功能正常

### 失败情况
- ❌ 仍然显示"系统环境"标签
- ❌ 环境切换选项为空
- ❌ 无法识别XGPT域名

## 技术验证

### 域名前缀提取测试
```javascript
// 测试用例
'xgpt.waimai.st.sankuai.com' -> 'xgpt' ✅
'xgpt.sankuai.com' -> 'xgpt' ✅
'fsd.waimai.test.sankuai.com' -> 'fsd' ✅
'fsd.sankuai.com' -> 'fsd' ✅
'sy.waimai.st.sankuai.com' -> 'sy' ✅
'sy.sankuai.com' -> 'sy' ✅
'abs.sankuai.com' -> 'abs' ✅
'any.waimai.test.sankuai.com' -> 'any' ✅
```

### 环境类型检测测试
```javascript
// 测试用例
'xgpt.waimai.st.sankuai.com' -> 'st' (预发环境) ✅
'xgpt.waimai.test.sankuai.com' -> 'test' (测试环境) ✅
'xgpt.sankuai.com' -> 'prod' (生产环境) ✅
```

## 扩展支持

现在系统支持任何符合命名规范的域名：

### 生产环境
- `https://xgpt.sankuai.com/`
- `https://abs.sankuai.com/`
- `https://any.sankuai.com/`

### 预发环境
- `https://xgpt.waimai.st.sankuai.com/`
- `https://abs.waimai.st.sankuai.com/`
- `https://any.waimai.st.sankuai.com/`

### 测试环境
- `https://xgpt.waimai.test.sankuai.com/`
- `https://abs.waimai.test.sankuai.com/`
- `https://any.waimai.test.sankuai.com/`

## 注意事项

1. **命名规范**：域名必须遵循标准格式
2. **网络访问**：确保能访问所有目标环境
3. **权限要求**：扩展需要标签页访问权限
4. **浏览器兼容**：支持Chrome 88+版本

## 测试完成标准

- [ ] XGPT域名识别正常
- [ ] 当前环境显示正确
- [ ] 环境切换选项完整
- [ ] 环境切换功能正常
- [ ] UI显示正确
- [ ] 错误处理正常
