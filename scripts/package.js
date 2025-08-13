#!/usr/bin/env node
/**
 * 打包脚本 - 创建可分发的zip文件
 */
const fs = require('fs');
const path = require('path');
const { build } = require('./build.js');

// 创建zip文件的函数
const createZip = async (sourceDir, outputPath) => {
  try {
    // 尝试使用archiver包
    const archiver = require('archiver');
    
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => {
        console.log(`📦 打包完成: ${outputPath} (${archive.pointer()} bytes)`);
        resolve();
      });
      
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  } catch (error) {
    // 如果archiver不可用，使用系统zip命令
    console.log('使用系统zip命令进行打包...');
    const { execSync } = require('child_process');
    
    try {
      execSync(`cd ${sourceDir} && zip -r ../${path.basename(outputPath)} .`, { stdio: 'inherit' });
      console.log(`📦 打包完成: ${outputPath}`);
    } catch (zipError) {
      throw new Error('打包失败，请确保系统已安装zip命令或运行 pnpm install 安装依赖');
    }
  }
};

// 主打包函数
const packageExtension = async () => {
  console.log('📦 开始打包Chrome扩展...');
  
  try {
    // 先构建
    console.log('1. 构建扩展...');
    build();
    
    // 检查dist目录
    if (!fs.existsSync('dist')) {
      throw new Error('dist目录不存在，构建可能失败');
    }
    
    // 创建packages目录
    const packagesDir = 'packages';
    if (!fs.existsSync(packagesDir)) {
      fs.mkdirSync(packagesDir);
    }
    
    // 读取版本信息
    const manifest = JSON.parse(fs.readFileSync('dist/manifest.json', 'utf8'));
    const version = manifest.version;
    const name = manifest.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    
    // 创建不同类型的包
    const timestamp = new Date().toISOString().slice(0, 10);
    
    // 1. 开发版本
    const devPackageName = `${name}-v${version}-dev-${timestamp}.zip`;
    const devPackagePath = path.join(packagesDir, devPackageName);
    
    console.log('2. 创建开发版本包...');
    await createZip('dist', devPackagePath);
    
    // 2. 生产版本（移除开发相关文件）
    console.log('3. 创建生产版本包...');
    const prodDistDir = 'dist-prod';
    
    // 复制dist到临时目录
    if (fs.existsSync(prodDistDir)) {
      fs.rmSync(prodDistDir, { recursive: true, force: true });
    }
    
    const { execSync } = require('child_process');
    execSync(`cp -r dist ${prodDistDir}`);
    
    // 移除开发相关文件（如果有的话）
    const devFiles = [
      path.join(prodDistDir, 'console.log'),
      path.join(prodDistDir, '*.map'),
    ];
    
    devFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.rmSync(file, { force: true });
      }
    });
    
    const prodPackageName = `${name}-v${version}-release.zip`;
    const prodPackagePath = path.join(packagesDir, prodPackageName);
    
    await createZip(prodDistDir, prodPackagePath);
    
    // 清理临时目录
    fs.rmSync(prodDistDir, { recursive: true, force: true });
    
    console.log('\n✅ 打包完成！');
    console.log('\n📦 生成的包文件:');
    console.log(`   开发版本: ${devPackagePath}`);
    console.log(`   生产版本: ${prodPackagePath}`);
    
    console.log('\n📋 安装说明:');
    console.log('   1. 打开Chrome浏览器');
    console.log('   2. 访问 chrome://extensions/');
    console.log('   3. 开启"开发者模式"');
    console.log('   4. 选择"加载已解压的扩展程序"，选择dist目录');
    console.log('   或者：');
    console.log('   4. 将zip文件解压后，选择"加载已解压的扩展程序"');
    
    console.log('\n🏪 Chrome商店发布:');
    console.log(`   使用生产版本包: ${prodPackageName}`);
    console.log('   1. 访问 https://chrome.google.com/webstore/devconsole/');
    console.log('   2. 创建新项目并上传zip文件');
    console.log('   3. 填写应用信息并提交审核');
    
  } catch (error) {
    console.error('❌ 打包失败:', error.message);
    process.exit(1);
  }
};

// 运行打包
if (require.main === module) {
  packageExtension();
}

module.exports = { packageExtension };