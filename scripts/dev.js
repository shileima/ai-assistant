#!/usr/bin/env node
/**
 * 开发脚本 - 监听文件变化并自动重新构建
 */
const fs = require('fs');
const path = require('path');
const { build } = require('./build.js');

// 监听的目录和文件
const WATCH_PATHS = [
  'src/',
  'scripts/popup.js',
  'styles/',
  'manifest.json',
  'popup.html'
];

let isBuilding = false;

// 防抖构建函数
const debouncedBuild = (() => {
  let timeout;
  return () => {
    if (isBuilding) return;
    
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      isBuilding = true;
      console.log('\n文件变化检测到，重新构建...');
      try {
        build();
        console.log('✅ 构建成功');
      } catch (error) {
        console.error('❌ 构建失败:', error.message);
      } finally {
        isBuilding = false;
      }
    }, 500);
  };
})();

// 监听文件变化
const watchPath = (watchPath) => {
  if (!fs.existsSync(watchPath)) {
    console.warn(`警告: 监听路径不存在 ${watchPath}`);
    return;
  }
  
  const stat = fs.statSync(watchPath);
  
  if (stat.isDirectory()) {
    // 监听目录
    fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
      if (filename) {
        console.log(`文件变化: ${path.join(watchPath, filename)}`);
        debouncedBuild();
      }
    });
    console.log(`监听目录: ${watchPath}`);
  } else {
    // 监听单个文件
    fs.watch(watchPath, (eventType) => {
      console.log(`文件变化: ${watchPath}`);
      debouncedBuild();
    });
    console.log(`监听文件: ${watchPath}`);
  }
};

// 主函数
const startDev = () => {
  console.log('🚀 启动开发模式...');
  
  // 初始构建
  try {
    build();
    console.log('✅ 初始构建完成');
  } catch (error) {
    console.error('❌ 初始构建失败:', error.message);
    process.exit(1);
  }
  
  // 开始监听
  console.log('\n开始监听文件变化...');
  WATCH_PATHS.forEach(watchPath);
  
  console.log('\n开发服务器已启动！');
  console.log('📁 构建输出: dist/');
  console.log('🔧 在Chrome中加载dist目录来测试扩展');
  console.log('⚡ 文件变化将自动触发重新构建');
  console.log('\n按 Ctrl+C 停止开发服务器');
};

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n👋 开发服务器已停止');
  process.exit(0);
});

// 运行开发服务器
if (require.main === module) {
  startDev();
}

module.exports = { startDev };