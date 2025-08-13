// 创建SVG图标的脚本
const fs = require('fs');
const path = require('path');

// SVG图标内容
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#2196F3;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FF9800;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景圆形 -->
  <circle cx="64" cy="64" r="60" fill="url(#grad)" stroke="#fff" stroke-width="4"/>
  
  <!-- 环境切换图标 -->
  <g transform="translate(64,64)">
    <!-- 箭头环 -->
    <path d="M -20,-20 L -10,-30 L -10,-25 L 10,-25 L 10,-15 L -10,-15 L -10,-10 Z" fill="white" opacity="0.9"/>
    <path d="M 20,20 L 10,30 L 10,25 L -10,25 L -10,15 L 10,15 L 10,10 Z" fill="white" opacity="0.9"/>
    
    <!-- 中心点 -->
    <circle cx="0" cy="0" r="8" fill="white"/>
    <circle cx="0" cy="0" r="4" fill="#333"/>
  </g>
  
  <!-- 环境标识点 -->
  <circle cx="32" cy="32" r="6" fill="#4CAF50"/>
  <circle cx="96" cy="32" r="6" fill="#FF9800"/>
  <circle cx="32" cy="96" r="6" fill="#2196F3"/>
  <circle cx="96" cy="96" r="6" fill="#F44336"/>
</svg>
`;

// 创建不同尺寸的PNG图标（这里用SVG代替，实际项目中可以用工具转换）
const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const svgContent = iconSvg.replace('viewBox="0 0 128 128"', `viewBox="0 0 128 128" width="${size}" height="${size}"`);
  fs.writeFileSync(path.join(__dirname, `icon${size}.svg`), svgContent);
});

console.log('图标文件已创建！');
console.log('注意：SVG文件已创建，如需PNG格式，请使用在线转换工具或设计软件转换。');