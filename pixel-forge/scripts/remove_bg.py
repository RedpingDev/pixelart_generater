#!/usr/bin/env python3
"""
배경 제거 (rembg 기반)
사용법: python remove_bg.py <input_path> <output_path> [pixel|illustration]

작은 픽셀아트(<= 128px) 입력은 NEAREST로 업스케일 후 추론하고,
얻은 알파 마스크를 다시 원본 크기로 NEAREST 다운스케일해서 적용한다.
(U²-Net은 내부적으로 320x320으로 리사이즈하여 추론하므로 16x16 같은 작은 입력은
거의 인식이 불가능 → 형태 자체가 사라지는 문제 방지)
"""

import sys
from collections import deque
from statistics import median
from rembg import new_session, remove
from PIL import Image, ImageChops, ImageFilter

# rembg 추론용 최소 캔버스 크기 (이보다 작으면 NEAREST 업스케일)
INFER_MIN = 512


def luminance(rgb: tuple[int, int, int]) -> float:
    r, g, b = rgb
    return 0.299 * r + 0.587 * g + 0.114 * b


def max_channel_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> int:
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))


def estimate_border_background(rgb: Image.Image) -> tuple[tuple[int, int, int], float]:
    width, height = rgb.size
    samples: list[tuple[int, int, int]] = []

    for x in range(width):
        samples.append(rgb.getpixel((x, 0)))
        samples.append(rgb.getpixel((x, height - 1)))
    for y in range(1, height - 1):
        samples.append(rgb.getpixel((0, y)))
        samples.append(rgb.getpixel((width - 1, y)))

    dark_samples = sorted(samples, key=luminance)[: max(16, len(samples) // 3)]
    bg_rgb = tuple(int(median([sample[i] for sample in dark_samples])) for i in range(3))
    return bg_rgb, luminance(bg_rgb)


def build_border_connected_background_mask(
    rgb: Image.Image,
    subject_alpha: Image.Image,
) -> Image.Image:
    width, height = rgb.size
    bg_rgb, bg_luma = estimate_border_background(rgb)
    luma_limit = max(28.0, bg_luma + 24.0)
    color_limit = 52 if bg_luma <= 16 else 64

    visited = bytearray(width * height)
    background = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def index(x: int, y: int) -> int:
        return y * width + x

    def is_background_candidate(x: int, y: int) -> bool:
        pixel = rgb.getpixel((x, y))
        alpha_value = subject_alpha.getpixel((x, y))
        return (
            alpha_value < 200
            and luminance(pixel) <= luma_limit
            and max_channel_distance(pixel, bg_rgb) <= color_limit
        )

    def push_if_candidate(x: int, y: int) -> None:
        idx = index(x, y)
        if visited[idx]:
            return
        visited[idx] = 1
        if is_background_candidate(x, y):
            background[idx] = 1
            queue.append((x, y))

    for x in range(width):
        push_if_candidate(x, 0)
        push_if_candidate(x, height - 1)
    for y in range(1, height - 1):
        push_if_candidate(0, y)
        push_if_candidate(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                idx = index(nx, ny)
                if visited[idx]:
                    continue
                visited[idx] = 1
                if is_background_candidate(nx, ny):
                    background[idx] = 1
                    queue.append((nx, ny))

    keep_alpha = Image.new("L", (width, height), 255)
    keep_alpha.putdata([0 if background[i] else 255 for i in range(width * height)])
    return keep_alpha


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: remove_bg.py <input_path> <output_path> [pixel|illustration]", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    profile = sys.argv[3] if len(sys.argv) >= 4 else "pixel"

    with Image.open(input_path) as img:
        rgba = img.convert("RGBA")

    orig_w, orig_h = rgba.size
    if profile == "illustration":
        session = new_session("isnet-anime")
        cut = remove(rgba, session=session)
        subject_alpha = cut.split()[3]
        border_keep_alpha = build_border_connected_background_mask(rgba.convert("RGB"), subject_alpha)

        # 배경은 테두리에서 연결된 검은색 계열만 지우고,
        # rembg 알파는 머리카락/손가락 같은 미세 경계 보호용으로 합친다.
        border_keep_alpha = border_keep_alpha.filter(ImageFilter.GaussianBlur(radius=0.8))
        subject_alpha = subject_alpha.filter(ImageFilter.MaxFilter(5))
        subject_alpha = subject_alpha.filter(ImageFilter.GaussianBlur(radius=1.0))
        alpha = ImageChops.lighter(border_keep_alpha, subject_alpha)
        alpha = alpha.point(lambda v: 0 if v < 8 else 255 if v > 248 else v)

        result = rgba.copy()
        result.putalpha(alpha)
        result.save(output_path, "PNG")
        return

    is_pixel_art = max(orig_w, orig_h) <= 128

    if is_pixel_art:
        # 정수배 NEAREST 업스케일 (픽셀 형태 보존)
        scale = max(1, INFER_MIN // max(orig_w, orig_h))
        upscaled = rgba.resize((orig_w * scale, orig_h * scale), Image.NEAREST)

        cut = remove(upscaled)

        # 알파만 추출 → 원본 크기로 NEAREST 다운스케일 → 원본 색상 그대로 유지
        alpha = cut.split()[3].resize((orig_w, orig_h), Image.NEAREST)
        alpha = alpha.point(lambda v: 255 if v >= 128 else 0)

        result = rgba.copy()
        result.putalpha(alpha)
    else:
        cut = remove(rgba)
        a = cut.split()[3].point(lambda v: 255 if v >= 128 else 0)
        cut.putalpha(a)
        result = cut

    result.save(output_path, "PNG")


if __name__ == "__main__":
    main()
