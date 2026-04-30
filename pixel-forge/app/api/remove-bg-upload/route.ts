import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { removeBgLocal, type RemoveBgProfile } from '@/lib/pixelize'
import { saveGeneration, saveImageFile } from '@/lib/local-storage'

export const maxDuration = 120

/**
 * 업로드 이미지에서 바로 배경 제거 (파일 → rembg → 저장)
 * multipart/form-data: file
 */
export async function POST(req: NextRequest) {
  let tmpPath: string | null = null
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const profileValue = formData.get('profile')
    const profile: RemoveBgProfile = profileValue === 'illustration' ? 'illustration' : 'pixel'

    if (!file) {
      return NextResponse.json({ error: '이미지 파일을 업로드해주세요.' }, { status: 400 })
    }

    // 임시 파일로 저장
    const ext = path.extname(file.name) || '.png'
    tmpPath = path.join(
      os.tmpdir(),
      `pixelforge_rmbg_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`,
    )
    const arrayBuffer = await file.arrayBuffer()
    fs.writeFileSync(tmpPath, Buffer.from(arrayBuffer))

    // rembg 배경 제거
    const pngBuffer = await removeBgLocal(tmpPath, profile)

    const fileName = `${profile === 'illustration' ? 'illust_nobg' : 'nobg'}_${Date.now()}.png`
    const outUrl = saveImageFile(pngBuffer, fileName)
    const model = profile === 'illustration' ? 'rembg-isnet-anime' : 'rembg-u2net'

    const row = saveGeneration({
      type: 'image',
      prompt_raw: `[${profile === 'illustration' ? 'illustration-remove-bg' : 'remove-bg'}] ${file.name}`,
      prompt_final: profile === 'illustration' ? 'rembg illustration background removal' : 'rembg background removal',
      image_url: outUrl,
      pixel_size: 0,
      bg_removed: true,
      model,
      cost_usd: 0,
      is_favorite: false,
    })

    return NextResponse.json({ id: row.id, url: outUrl })
  } catch (err) {
    console.error('[remove-bg-upload]', err)
    return NextResponse.json({ error: '배경 제거 중 오류가 발생했습니다.' }, { status: 500 })
  } finally {
    if (tmpPath && fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath) } catch {}
    }
  }
}
