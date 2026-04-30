import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execFileAsync = promisify(execFile)

/**
 * 픽셀 사이즈에 따른 기본 팔레트 색상 수 (colors가 명시되지 않은 경우만 사용)
 */
function defaultColorsFor(pixelSize: number): number {
  if (pixelSize <= 16) return 32
  if (pixelSize <= 32) return 48
  return 64
}

/**
 * URL 또는 로컬 경로의 이미지를 받아 Python/Pillow로 픽셀아트 처리
 * - mode 'box': 일러스트/사진 → 영역 평균 다운스케일 (부드럽게)
 * - mode 'nearest': 이미 픽셀화된 큰 픽셀 입력 → NEAREST 샘플링 (선명하게)
 */
export async function pixelizeBuffer(
  imageUrl: string,
  pixelSize: number = 64,
  outputSize: number = 512,
  mode: 'box' | 'nearest' = 'box',
  colors?: number,
): Promise<Buffer> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'pixelize.py')
  const outputPath = path.join(os.tmpdir(), `pixelforge_${Date.now()}_${Math.random().toString(36).slice(2)}.png`)
  const numColors = colors ?? defaultColorsFor(pixelSize)

  // PYTHON_EXECUTABLE 환경변수 우선 사용 (venv 경로 지정 가능)
  // 예) .env.local: PYTHON_EXECUTABLE=C:/Users/.../open_ai/.venv/Scripts/python.exe
  const pythonCmd =
    process.env.PYTHON_EXECUTABLE ?? (process.platform === 'win32' ? 'python' : 'python3')

  try {
    await execFileAsync(pythonCmd, [
      scriptPath,
      imageUrl,
      String(pixelSize),
      String(outputSize),
      String(numColors),
      outputPath,
      mode,
    ])
    const buffer = fs.readFileSync(outputPath)
    return buffer
  } finally {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
  }
}

export type RemoveBgProfile = 'pixel' | 'illustration'

/**
 * 로컬 이미지 파일에서 배경 제거 (rembg)
 */
export async function removeBgLocal(inputPath: string, profile: RemoveBgProfile = 'pixel'): Promise<Buffer> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'remove_bg.py')
  const outputPath = path.join(
    os.tmpdir(),
    `pixelforge_nobg_${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
  )
  const pythonCmd =
    process.env.PYTHON_EXECUTABLE ?? (process.platform === 'win32' ? 'python' : 'python3')

  try {
    await execFileAsync(pythonCmd, [scriptPath, inputPath, outputPath, profile], {
      maxBuffer: 50 * 1024 * 1024,
    })
    return fs.readFileSync(outputPath)
  } finally {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
  }
}
