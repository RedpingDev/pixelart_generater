import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { removeBgLocal, type RemoveBgProfile } from '@/lib/pixelize'
import { saveImageFile } from '@/lib/local-storage'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  let tmpPath: string | null = null
  try {
    const { imageUrl, profile = 'pixel' } = await req.json() as { imageUrl: string; profile?: RemoveBgProfile }
    const removeProfile: RemoveBgProfile = profile === 'illustration' ? 'illustration' : 'pixel'

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'imageUrl이 필요합니다.' }, { status: 400 })
    }

    const url = new URL(imageUrl)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return NextResponse.json({ error: 'http 또는 https 이미지 URL만 사용할 수 있습니다.' }, { status: 400 })
    }

    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) {
      return NextResponse.json({ error: '원본 이미지를 가져오지 못했습니다.' }, { status: 400 })
    }

    const contentType = imageRes.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: '이미지 URL이 필요합니다.' }, { status: 400 })
    }

    const ext = contentType.includes('jpeg') ? '.jpg' : contentType.includes('webp') ? '.webp' : '.png'
    tmpPath = path.join(
      os.tmpdir(),
      `pixelforge_rmbg_url_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`,
    )
    fs.writeFileSync(tmpPath, Buffer.from(await imageRes.arrayBuffer()))

    const pngBuffer = await removeBgLocal(tmpPath, removeProfile)
    const fileName = `${removeProfile === 'illustration' ? 'illust_nobg' : 'nobg'}_${Date.now()}.png`
    const resultUrl = saveImageFile(pngBuffer, fileName)

    return NextResponse.json({ url: resultUrl })
  } catch (err) {
    console.error('[remove-bg]', err)
    return NextResponse.json({ error: '배경 제거 중 오류가 발생했습니다.' }, { status: 500 })
  } finally {
    if (tmpPath && fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath) } catch {}
    }
  }
}
