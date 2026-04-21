# PixelForge

AI 기반 픽셀 아트 이미지 생성 서비스. 텍스트 프롬프트를 입력하면 레트로 픽셀 아트를 자동으로 생성합니다.

## 기술 스택

| 역할 | 기술 |
|---|---|
| 프레임워크 | Next.js 15 (App Router, TypeScript, Tailwind CSS) |
| 픽셀 아트 생성 | Replicate `retro-diffusion/rd-plus` (픽셀 아트 전용 모델) |
| 프롬프트 보강 | OpenAI `gpt-4o-mini` |
| 이미지 후처리 | `sharp` (다운스케일 → 업스케일로 픽셀화) |
| 파일 저장 | 로컬 파일시스템 (`public/generated/`, `data/generations.json`) |

## 시작하기

### 1. 의존성 설치

```bash
cd pixel-forge
npm install
```

### 2. 환경변수 설정

`pixel-forge/.env.local` 파일에 API 키 입력:

```env
REPLICATE_API_TOKEN=your_replicate_api_token
OPENAI_API_KEY=your_openai_api_key
```

- Replicate 토큰: https://replicate.com/account/api-tokens
- OpenAI 키: https://platform.openai.com/api-keys

### 3. 개발 서버 실행

```bash
cd pixel-forge
npm run dev
```

http://localhost:3000 에서 확인

## 주요 기능

- **픽셀 아트 생성**: 텍스트 프롬프트 → 픽셀 아트 이미지 (1~4장)
- **프롬프트 자동 보강**: GPT-4o-mini로 프롬프트를 픽셀 아트 최적화 영문으로 변환 (선택)
- **배경 제거**: 생성 시 remove_bg 옵션으로 투명 배경 출력 (선택)
- **픽셀 사이즈**: 32px / 64px / 128px 선택
- **갤러리**: 생성 히스토리 저장 및 조회 (`/gallery`)

## 프로젝트 구조

```
pixel-forge/
├── app/
│   ├── api/
│   │   ├── generate/route.ts   # 이미지 생성 API
│   │   ├── gallery/route.ts    # 갤러리 조회/삭제 API
│   │   └── remove-bg/route.ts  # 배경 제거 API
│   ├── gallery/page.tsx        # 갤러리 페이지
│   └── page.tsx                # 메인 페이지
├── components/
│   ├── GalleryItem.tsx
│   ├── ImageGrid.tsx
│   └── PromptForm.tsx
├── lib/
│   ├── local-storage.ts        # 로컬 파일 저장/조회
│   ├── openai.ts               # 프롬프트 보강
│   ├── pixelize.ts             # sharp 픽셀화 처리
│   └── replicate.ts            # 이미지 생성 (rd-plus)
├── public/generated/           # 생성된 이미지 저장
└── data/generations.json       # 생성 메타데이터
```

## API

### `POST /api/generate`

```json
{
  "prompt": "귀여운 고양이",
  "size": 64,
  "count": 4,
  "removeBg": false,
  "enhance": true
}
```

### `GET /api/gallery?page=1`

### `DELETE /api/gallery?id={id}`
