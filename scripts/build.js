#!/usr/bin/env node
/**
 * 构建脚本 - 将源代码复制到dist目录
 */
const fs = require('fs');
const path = require('path');

// 需要复制的文件和目录
const FILES_TO_COPY = [
  'manifest.json',
  'popup.html',
  'src/',
  'scripts/popup.js',
  'styles/',
  'icons/'
];

// 需要复制到根目录的文件
const ROOT_FILES = {
  'src/background.js': 'background.js',
  'src/content.js': 'content.js'
};

// 创建目录
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 复制文件
const copyFile = (src, dest) => {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`复制: ${src} -> ${dest}`);
};

// 复制目录
const copyDir = (src, dest) => {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
};

// 主构建函数
const build = () => {
  const startTime = Date.now();
  console.log('开始构建Chrome扩展...');
  console.log(`⏰ 构建开始时间: ${new Date(startTime).toLocaleTimeString()}`);
  
  // 清理dist目录
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  
  // 创建dist目录
  ensureDir('dist');
  
  // 复制文件
  for (const item of FILES_TO_COPY) {
    const srcPath = item;
    
    if (!fs.existsSync(srcPath)) {
      console.warn(`警告: 文件不存在 ${srcPath}`);
      continue;
    }
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      const destPath = path.join('dist', item);
      copyDir(srcPath, destPath);
    } else {
      const destPath = path.join('dist', item);
      copyFile(srcPath, destPath);
    }
  }
  
  // 特殊处理：将关键文件复制到dist根目录
  for (const [srcFile, destFile] of Object.entries(ROOT_FILES)) {
    if (fs.existsSync(srcFile)) {
      copyFile(srcFile, path.join('dist', destFile));
    }
  }
  
  const endTime = Date.now();
  const buildTime = endTime - startTime;
  console.log(`✅ 构建完成！输出目录: dist/ (耗时: ${buildTime}ms)`);
  console.log(`⏰ 构建结束时间: ${new Date(endTime).toLocaleTimeString()}`);
  console.log('可以将dist目录加载到Chrome浏览器中进行测试。');
};

// 运行构建
if (require.main === module) {
  build();
}

module.exports = { build };