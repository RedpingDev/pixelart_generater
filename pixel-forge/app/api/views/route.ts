import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export const maxDuration = 60

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const STYLE_SUFFIX =
  " Preserve the EXACT same character: same pixel art style, same colors, same proportions, same chibi design. Transparent background. Do NOT add new elements."

const DIRECTIONS = [
  {
    key: "right",
    label: "우측면",
    prompt:
      "Convert this pixel art character to a strict RIGHT-FACING SIDE PROFILE VIEW. The character faces exactly to the RIGHT. Full body visible from the side. Side profile only.",
  },
  {
    key: "left",
    label: "좌측면",
    prompt:
      "Convert this pixel art character to a strict LEFT-FACING SIDE PROFILE VIEW. The character faces exactly to the LEFT. Full body visible from the side. Side profile only.",
  },
  {
    key: "front",
    label: "정면",
    prompt:
      "Convert this pixel art character to a FRONT-FACING VIEW. The character faces directly FORWARD toward the viewer. Full body visible, symmetric front view.",
  },
  {
    key: "back",
    label: "후면",
    prompt:
      "Convert this pixel art character to a BACK-FACING VIEW. The character faces directly AWAY from the viewer, showing the character's back. Full body visible.",
  },
]

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "이미지를 업로드해주세요." }, { status: 400 })
    }

    // File을 ArrayBuffer로 한 번만 읽고 각 병렬 호출용 File 객체 재생성
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    const mimeType = file.type || "image/png"
    const fileName = file.name || "input.png"

    const results = await Promise.all(
      DIRECTIONS.map(async (dir) => {
        const imageFile = new File([fileBuffer], fileName, { type: mimeType })
        const response = await openai.images.edit({
          model: "gpt-image-2",
          image: imageFile,
          prompt: dir.prompt + STYLE_SUFFIX,
          n: 1,
          size: "1024x1024",
        } as Parameters<typeof openai.images.edit>[0])

        const b64 = response.data[0].b64_json!
        return {
          direction: dir.key,
          label: dir.label,
          url: `data:image/png;base64,${b64}`,
        }
      })
    )

    return NextResponse.json({ views: results })
  } catch (err) {
    console.error("[views]", err)
    const message = err instanceof Error ? err.message : "오류가 발생했습니다."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


function normalizeOutput(o: unknown): string {
  if (typeof o === "string") return o
  if (o && typeof (o as { url?: () => URL }).url === "function") {
    return (o as { url: () => URL }).url().toString()
  }
  return String(o)
}

async function createPredictionWithRetry(
  replicate: Replicate,
  input: Record<string, unknown>,
  maxRetries = 6,
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await replicate.predictions.create({
        model: "black-forest-labs/flux-kontext-pro",
        input,
      })
    } catch (err: unknown) {
      // ApiError는 e.status 또는 e.response?.status 두 곳 중 하나에 있음
      const e = err as { status?: number; response?: { status?: number; headers?: { get?: (k: string) => string | null } } }
      const httpStatus = e?.status ?? e?.response?.status
      if (httpStatus === 429 && attempt < maxRetries) {
        const retryAfter = Number(e?.response?.headers?.get?.("retry-after") ?? "12") || 12
        const waitMs = (retryAfter + 3) * 1000
        console.warn(`[views] 429 rate limit, ${waitMs / 1000}s 대기 후 재시도 (${attempt + 1}/${maxRetries})`)
        await new Promise(r => setTimeout(r, waitMs))
        continue
      }
      throw err
    }
  }
  throw new Error("createPredictionWithRetry: max retries exceeded")
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "이미지를 업로드해주세요." }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const imageBase64 = Buffer.from(arrayBuffer).toString("base64")
    const imageType = file.type || "image/png"
    const imageDataUrl = `data:${imageType};base64,${imageBase64}`

    // 버스트=1 제한 → 순차 생성 후 wait는 병렬로
    const predictions: Awaited<ReturnType<typeof replicate.predictions.create>>[] = []
    for (const dir of DIRECTIONS) {
      const pred = await createPredictionWithRetry(replicate, {
        prompt: dir.prompt + STYLE_SUFFIX,
        input_image: imageDataUrl,
        aspect_ratio: "match_input_image",
        output_format: "png",
        safety_tolerance: 2,
      })
      predictions.push(pred)
      // burst=1, 6req/min → 요청 간 최소 11초 간격
      if (dir !== DIRECTIONS[DIRECTIONS.length - 1]) {
        await new Promise(r => setTimeout(r, 11000))
      }
    }

    // 생성 요청 완료 후 완료 대기는 병렬 가능
    const results = await Promise.all(
      predictions.map(async (pred, idx) => {
        const dir = DIRECTIONS[idx]
        const finished = await replicate.wait(pred, { interval: 1500 })
        if (finished.status === "failed" || finished.status === "canceled") {
          throw new Error((finished.error && String(finished.error)) || `${dir.label} 생성 실패`)
        }
        return { direction: dir.key, label: dir.label, url: normalizeOutput(finished.output) }
      })
    )

    return NextResponse.json({ views: results })
  } catch (err) {
    console.error("[views]", err)
    const message = err instanceof Error ? err.message : "오류가 발생했습니다."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
