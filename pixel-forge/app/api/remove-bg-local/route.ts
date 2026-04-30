import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { removeBgLocal, type RemoveBgProfile } from '@/lib/pixelize'
import { saveGeneration, saveImageFile } from '@/lib/local-storage'

export const maxDuration = 120

/**
 * 이미 생성된 이미지(/generated/xxx.png)에서 배경 제거.
 * body: { url: '/generated/xxx.png', sourceId?: string, pixelSize?: number }
 * 결과를 새 파일로 저장하고 갤러리에 추가.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url, pixelSize = 0, profile = 'pixel' } = body as { url?: string; pixelSize?: number; profile?: RemoveBgProfile }
    const removeProfile: RemoveBgProfile = profile === 'illustration' ? 'illustration' : 'pixel'

    if (!url || typeof url !== 'string' || !url.startsWith('/generated/')) {
      return NextResponse.json({ error: '유효한 이미지 경로가 필요합니다.' }, { status: 400 })
    }

    const inputPath = path.join(process.cwd(), 'public', url)
    if (!fs.existsSync(inputPath)) {
      return NextResponse.json({ error: '원본 파일을 찾을 수 없습니다.' }, { status: 404 })
    }

    // rembg로 배경 제거
    const pngBuffer = await removeBgLocal(inputPath, removeProfile)

    const fileName = `${removeProfile === 'illustration' ? 'illust_nobg' : 'nobg'}_${Date.now()}.png`
    const outUrl = saveImageFile(pngBuffer, fileName)
    const model = removeProfile === 'illustration' ? 'rembg-isnet-anime' : 'rembg-u2net'

    const row = saveGeneration({
      type: 'image',
      prompt_raw: `[${removeProfile === 'illustration' ? 'illustration-remove-bg' : 'remove-bg'}] ${path.basename(url)}`,
      prompt_final: removeProfile === 'illustration' ? 'rembg illustration background removal' : 'rembg background removal',
      image_url: outUrl,
      pixel_size: pixelSize,
      bg_removed: true,
      model,
      cost_usd: 0,
      is_favorite: false,
    })

    return NextResponse.json({ id: row.id, url: outUrl })
  } catch (err) {
    console.error('[remove-bg-local]', err)
    return NextResponse.json({ error: '배경 제거 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
