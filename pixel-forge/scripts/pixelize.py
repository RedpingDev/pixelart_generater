#!/usr/bin/env python3
"""
픽셀 아트 다운스케일러 (Pillow 기반)
사용법: python pixelize.py <입력> <픽셀_사이즈> <출력_사이즈> <색상_수> <출력_경로> [<mode>]
  mode: 'box' (기본, 일러스트/사진용 - 부드럽게 평균)
        'nearest' (이미 픽셀화된 큰 픽셀 입력용 - 선명하게 샘플링)
"""

import sys
import os
import urllib.request
import tempfile
from PIL import Image


def pixelize(
    input_path: str,
    pixel_size: int,
    output_size: int,
    num_colors: int,
    output_path: str,
    mode: str = "box",
) -> None:
    img = Image.open(input_path).convert("RGBA")

    # 1단계: 다운스케일 (RGBA 그대로 유지 → 색감 보존)
    if mode == "nearest":
        small = img.resize((pixel_size, pixel_size), Image.NEAREST)
    else:
        small = img.resize((pixel_size, pixel_size), Image.BOX)

    # 2단계: RGB 채널만 팔레트 양자화하고 알파는 별도 보존
    #   (흰 배경 합성 → 가장자리 밝아짐, 팔레트 양자화에 투명 픽셀 색이 끼어드는 문제 방지)
    r, g, b, a = small.split()
    rgb = Image.merge("RGB", (r, g, b))
    quantized = rgb.quantize(colors=num_colors, dither=0).convert("RGB")
    qr, qg, qb = quantized.split()
    result_small = Image.merge("RGBA", (qr, qg, qb, a))

    # 알파 임계값: 50% 미만은 완전 투명으로 (가장자리 반투명 노이즈 제거)
    a_data = result_small.split()[3].point(lambda v: 255 if v >= 128 else 0)
    result_small.putalpha(a_data)

    # 3단계: 디스플레이용 NEAREST 업스케일 (output_size == pixel_size면 생략)
    if output_size == pixel_size:
        result = result_small
    else:
        result = result_small.resize((output_size, output_size), Image.NEAREST)

    result.save(output_path, "PNG")


def main() -> None:
    if len(sys.argv) < 6:
        print(
            "Usage: pixelize.py <input> <pixel_size> <output_size> <num_colors> <output_path> [mode]",
            file=sys.stderr,
        )
        sys.exit(1)

    input_src = sys.argv[1]
    pixel_size = int(sys.argv[2])
    output_size = int(sys.argv[3])
    num_colors = int(sys.argv[4])
    output_path = sys.argv[5]
    mode = sys.argv[6] if len(sys.argv) >= 7 else "box"

    if input_src.startswith("http://") or input_src.startswith("https://"):
        tmp_fd, tmp_path = tempfile.mkstemp(suffix=".png")
        os.close(tmp_fd)
        try:
            urllib.request.urlretrieve(input_src, tmp_path)
            pixelize(tmp_path, pixel_size, output_size, num_colors, output_path, mode)
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    else:
        pixelize(input_src, pixel_size, output_size, num_colors, output_path, mode)



if __name__ == "__main__":
    main()
