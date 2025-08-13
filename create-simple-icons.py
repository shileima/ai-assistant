#!/usr/bin/env python3
"""
创建简单的PNG图标文件
使用PIL库创建基本的图标
"""
from PIL import Image, ImageDraw
import os

def create_icon(size):
    # 创建图像
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 绘制圆形背景
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin], 
                fill=(33, 150, 243, 255), outline=(255, 255, 255, 255), width=2)
    
    # 绘制环境切换箭头
    center = size // 2
    arrow_size = size // 4
    
    # 上箭头
    points1 = [
        (center - arrow_size//2, center - arrow_size//2),
        (center + arrow_size//2, center - arrow_size//2),
        (center + arrow_size//4, center - arrow_size//4),
        (center + arrow_size//4, center - arrow_size//8),
        (center - arrow_size//4, center - arrow_size//8),
        (center - arrow_size//4, center - arrow_size//4)
    ]
    draw.polygon(points1, fill=(255, 255, 255, 255))
    
    # 下箭头
    points2 = [
        (center - arrow_size//2, center + arrow_size//2),
        (center + arrow_size//2, center + arrow_size//2),
        (center + arrow_size//4, center + arrow_size//4),
        (center + arrow_size//4, center + arrow_size//8),
        (center - arrow_size//4, center + arrow_size//8),
        (center - arrow_size//4, center + arrow_size//4)
    ]
    draw.polygon(points2, fill=(255, 255, 255, 255))
    
    # 中心点
    center_size = size // 16
    draw.ellipse([center-center_size, center-center_size, center+center_size, center+center_size], 
                fill=(255, 255, 255, 255))
    
    return img

def main():
    # 确保icons目录存在
    os.makedirs('icons', exist_ok=True)
    
    # 创建不同尺寸的图标
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        icon = create_icon(size)
        filename = f'icons/icon{size}.png'
        icon.save(filename, 'PNG')
        print(f'创建图标: {filename}')
    
    print('所有图标创建完成！')

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print('需要安装PIL库: pip install Pillow')
        print('或者手动创建PNG图标文件')