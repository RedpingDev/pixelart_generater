import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { pixelizeBuffer } from '@/lib/pixelize'
import { saveGeneration, saveImageFile } from '@/lib/local-storage'

export const maxDuration = 60

/**
 * 사용자가 업로드한 이미지를 받아 Python/Pillow 픽셀화 후 저장
 * multipart/form-data: file, size(16/32/64/128), outputSize(default 512)
 */
export async function POST(req: NextRequest) {
  let tmpInputPath: string | null = null
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const size = Number(formData.get('size') ?? 32)
    const outputSizeRaw = formData.get('outputSize')
    // 'original' 이면 pixelSize 그대로 출력 (실제 N×N PNG)
    const outputSize = outputSizeRaw === 'original' ? size : Number(outputSizeRaw ?? 512)
    const modeRaw = String(formData.get('mode') ?? 'box')
    const mode: 'box' | 'nearest' = modeRaw === 'nearest' ? 'nearest' : 'box'
    const colorsRaw = formData.get('colors')
    const colors = colorsRaw ? Math.min(Math.max(Number(colorsRaw), 4), 256) : undefined

    if (!file) {
      return NextResponse.json({ error: '이미지 파일을 업로드해주세요.' }, { status: 400 })
    }
    if (![16, 32, 64, 128].includes(size)) {
      return NextResponse.json({ error: '잘못된 픽셀 사이즈입니다.' }, { status: 400 })
    }

    // 업로드 파일을 임시 경로에 저장 (Python 스크립트가 로컬 경로 입력을 받음)
    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)
    const ext = path.extname(file.name) || '.png'
    tmpInputPath = path.join(
      os.tmpdir(),
      `pixelforge_in_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`,
    )
    fs.writeFileSync(tmpInputPath, inputBuffer)

    // 픽셀화 (Python/Pillow)
    const pngBuffer = await pixelizeBuffer(tmpInputPath, size, outputSize, mode, colors)

    // public/generated에 저장
    const fileName = `upload_${Date.now()}.png`
    const imageUrl = saveImageFile(pngBuffer, fileName)

    // 갤러리 메타데이터 저장
    const row = saveGeneration({
      type: 'image',
      prompt_raw: `[upload] ${file.name}`,
      prompt_final: `pixelize ${size}px (${mode})`,
      image_url: imageUrl,
      pixel_size: size,
      bg_removed: false,
      model: 'pillow-pixelize',
      cost_usd: 0,
      is_favorite: false,
    })

    return NextResponse.json({ id: row.id, url: imageUrl, size, outputSize, mode, colors: colors ?? null })
  } catch (err) {
    console.error('[pixelize]', err)
    return NextResponse.json({ error: '픽셀화 중 오류가 발생했습니다.' }, { status: 500 })
  } finally {
    if (tmpInputPath && fs.existsSync(tmpInputPath)) {
      try { fs.unlinkSync(tmpInputPath) } catch {}
    }
  }
}
