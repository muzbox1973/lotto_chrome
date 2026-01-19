#!/usr/bin/env python3
"""
로또 예측 분석기 아이콘 생성 스크립트
"""

from PIL import Image, ImageDraw, ImageFont
import math

def create_gradient_circle(size, color1, color2):
    """그라디언트 원 생성"""
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    center = size // 2
    radius = int(size * 0.45)

    # 그라디언트 효과를 위한 여러 원 그리기
    for r in range(radius, 0, -1):
        # 그라디언트 계산
        ratio = 1 - (r / radius)
        r_val = int(color1[0] + (color2[0] - color1[0]) * ratio)
        g_val = int(color1[1] + (color2[1] - color1[1]) * ratio)
        b_val = int(color1[2] + (color2[2] - color1[2]) * ratio)

        color = (r_val, g_val, b_val, 255)

        bbox = [center - r, center - r, center + r, center + r]
        draw.ellipse(bbox, fill=color)

    return image

def add_shine_effect(image, size):
    """반짝이는 효과 추가"""
    shine = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shine)

    center = size // 2
    shine_center_x = int(center - size * 0.1)
    shine_center_y = int(center - size * 0.1)
    shine_radius = int(size * 0.15)

    # 빛 반사 효과
    for r in range(shine_radius, 0, -1):
        opacity = int(100 * (1 - r / shine_radius))
        color = (255, 255, 255, opacity)
        bbox = [
            shine_center_x - r, shine_center_y - r,
            shine_center_x + r, shine_center_y + r
        ]
        draw.ellipse(bbox, fill=color)

    # 원본 이미지와 합성
    image.paste(shine, (0, 0), shine)
    return image

def add_number(image, size, number="7"):
    """숫자 추가"""
    draw = ImageDraw.Draw(image)

    # 폰트 크기 계산
    font_size = int(size * 0.55)

    try:
        # 시스템 폰트 시도
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", font_size)
        except:
            # 기본 폰트 사용
            font = ImageFont.load_default()

    # 텍스트 위치 계산 (중앙 정렬)
    bbox = draw.textbbox((0, 0), number, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    x = (size - text_width) // 2 - bbox[0]
    y = (size - text_height) // 2 - bbox[1]

    # 그림자 효과
    shadow_offset = max(1, size // 40)
    draw.text((x + shadow_offset, y + shadow_offset), number, font=font, fill=(0, 0, 0, 100))

    # 메인 텍스트
    draw.text((x, y), number, font=font, fill=(255, 255, 255, 255))

    return image

def create_lotto_icon(size):
    """로또 아이콘 생성"""
    # 그라디언트 색상 (보라색 계열)
    color1 = (102, 126, 234)  # #667eea
    color2 = (118, 75, 162)   # #764ba2

    # 그라디언트 원 생성
    image = create_gradient_circle(size, color1, color2)

    # 반짝이는 효과 추가
    image = add_shine_effect(image, size)

    # 숫자 7 추가 (행운의 숫자)
    image = add_number(image, size, "7")

    return image

def main():
    """메인 함수"""
    sizes = [16, 32, 48, 128]

    print("로또 예측 분석기 아이콘 생성 중...")

    for size in sizes:
        icon = create_lotto_icon(size)
        filename = f"icons/icon{size}.png"
        icon.save(filename, "PNG")
        print(f"✓ {filename} 생성 완료")

    print("\n모든 아이콘이 성공적으로 생성되었습니다!")

if __name__ == "__main__":
    main()
