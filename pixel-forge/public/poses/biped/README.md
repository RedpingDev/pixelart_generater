# Biped 캐릭터용 OpenPose 스켈레톤 PNG

이 폴더에 ControlNet OpenPose용 스켈레톤 이미지를 넣어주세요.

## 디렉토리 구조

```
public/poses/biped/
├── walk_cycle/
│   ├── 0.png   # contact pose (왼발 앞으로 뻗음)
│   ├── 1.png   # passing pose (왼발 아래, 오른발 무릎 올림)
│   ├── 2.png   # opposite contact (오른발 앞으로 뻗음)
│   └── 3.png   # opposite passing (오른발 아래, 왼발 무릎 올림)
└── run/
    ├── 0.png   # left contact (왼발 앞 + 오른발 뒤로 뻗음, 몸 앞으로 기울임)
    ├── 1.png   # passing airborne (양발 굽혀 공중)
    ├── 2.png   # right contact (오른발 앞 + 왼발 뒤)
    └── 3.png   # opposite passing airborne
```

## 이미지 사양

- **크기**: 1024×1024 PNG (정사각형)
- **배경**: 검은색 (#000000)
- **스켈레톤**: OpenPose 표준 컬러 (관절은 컬러 점, 뼈는 컬러 선)
- **방향**: 캐릭터가 **오른쪽을 보는 측면** (side profile, facing right)
- **포지션**: 화면 중앙, 전신이 다 들어오게

## 어디서 구하나?

1. **Civitai**: https://civitai.com 에서 "openpose walk cycle" 검색
2. **ComfyUI/Auto1111**: 실제 사람 사진을 OpenPose preprocessor로 추출
3. **수동 제작**: PoseMy.Art 같은 무료 툴로 포즈 만들고 OpenPose로 export

파일이 없으면 ControlNet 호출 시 에러가 납니다.
gpt-image-2 fallback이 자동으로 작동하지는 않으니 4장 모두 준비해주세요.
