import { NextRequest, NextResponse } from 'next/server'
import { generatePixelArt } from '@/lib/replicate'
import { enhancePrompt } from '@/lib/openai'
import { pixelizeBuffer } from '@/lib/pixelize'
import { saveGeneration, saveImageFile } from '@/lib/local-storage'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      prompt,
      size = 64,
      removeBg = false,
      enhance = true,
      count = 4,
    } = body as {
      prompt: string
      size: number
      removeBg: boolean
      enhance: boolean
      count: number
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: '프롬프트를 입력해주세요.' }, { status: 400 })
    }

    // 1. 프롬프트 보강
    const finalPrompt = enhance ? await enhancePrompt(prompt.trim()) : prompt.trim()

    // 2. 이미지 생성 (rd-plus는 배경 제거 내장)
    const rawUrls = await generatePixelArt(finalPrompt, size, Math.min(count, 4), removeBg)

    // 3. 각 이미지 후처리 → 로컬 파일 저장
    const items = []
    for (let i = 0; i < rawUrls.length; i++) {
      const rawUrl = rawUrls[i]

      // 픽셀화 후처리
      const pngBuffer = await pixelizeBuffer(rawUrl, size, 512)

      // 로컬 파일 저장
      const fileName = `${Date.now()}_${i}.png`
      const imageUrl = saveImageFile(pngBuffer, fileName)

      // JSON 메타데이터 저장
      const row = saveGeneration({
        prompt_raw: prompt.trim(),
        prompt_final: finalPrompt,
        image_url: imageUrl,
        pixel_size: size,
        bg_removed: removeBg,
        model: 'rd-plus',
        cost_usd: 0.005,
        is_favorite: false,
      })

      items.push({ id: row.id, url: imageUrl, promptFinal: finalPrompt })
    }

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[generate]', err)
    return NextResponse.json({ error: '생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
