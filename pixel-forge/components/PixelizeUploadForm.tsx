'use client'

import { useState, useRef } from 'react'

type Mode = 'box' | 'nearest'
type OutputSize = 'original' | 256 | 512 | 1024

interface PixelizeResult {
  id: string
  url: string
  size: number
  outputSize: number
  mode: Mode
}

export default function PixelizeUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('box')
  const [size, setSize] = useState<16 | 32 | 64 | 128>(32)
  const [outputSize, setOutputSize] = useState<OutputSize>(512)
  const [colors, setColors] = useState<number>(48)
  const [loading, setLoading] = useState(false)
  const [removingBg, setRemovingBg] = useState(false)
  const [bgRemovedUrl, setBgRemovedUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PixelizeResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (f: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setResult(null)
    setBgRemovedUrl(null)
    setError('')
    setPreviewUrl(f ? URL.createObjectURL(f) : null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) handleFileChange(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    setBgRemovedUrl(null)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('size', String(size))
      fd.append('outputSize', String(outputSize))
      fd.append('mode', mode)
      fd.append('colors', String(colors))

      const res = await fetch('/api/pixelize', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '알 수 없는 오류')
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
      {/* 업로드 영역 */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="w-full aspect-video border-2 border-dashed border-gray-700 hover:border-purple-500 rounded-xl bg-gray-900 flex items-center justify-center cursor-pointer transition-colors overflow-hidden"
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="preview" className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-center text-gray-500 text-sm">
            <p className="text-2xl mb-2">📁</p>
            <p>이미지를 드래그하거나 클릭해서 업로드</p>
            <p className="text-xs mt-1 text-gray-600">PNG / JPG / WEBP</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          disabled={loading}
        />
      </div>

      {/* 모드 선택 */}
      <div className="space-y-2 text-sm">
        <span className="text-gray-400">변환 모드:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label
            className={`cursor-pointer rounded-lg border px-3 py-2 transition-colors ${
              mode === 'box'
                ? 'border-purple-500 bg-purple-500/10 text-white'
                : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'
            }`}
          >
            <input
              type="radio"
              name="mode"
              value="box"
              checked={mode === 'box'}
              onChange={() => setMode('box')}
              className="hidden"
              disabled={loading}
            />
            <div className="font-semibold">🎨 일러스트 → 게임 스프라이트 픽셀</div>
            <div className="text-xs text-gray-400 mt-1">
              일반 그림/사진을 부드럽게 평균내서 픽셀화
            </div>
          </label>
          <label
            className={`cursor-pointer rounded-lg border px-3 py-2 transition-colors ${
              mode === 'nearest'
                ? 'border-purple-500 bg-purple-500/10 text-white'
                : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'
            }`}
          >
            <input
              type="radio"
              name="mode"
              value="nearest"
              checked={mode === 'nearest'}
              onChange={() => setMode('nearest')}
              className="hidden"
              disabled={loading}
            />
            <div className="font-semibold">🟦 큰 픽셀 → 게임 스프라이트 픽셀</div>
            <div className="text-xs text-gray-400 mt-1">
              이미 픽셀아트인 입력을 색섞임 없이 선명하게 축소
            </div>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
        {/* 픽셀 사이즈 */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">픽셀 그리드:</span>
          {([16, 32, 64, 128] as const).map((s) => (
            <label key={s} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="size"
                value={s}
                checked={size === s}
                onChange={() => setSize(s)}
                className="accent-purple-500"
                disabled={loading}
              />
              {s}px
            </label>
          ))}
        </div>

        {/* 출력 크기 */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">출력 크기:</span>
          {(['original', 256, 512, 1024] as const).map((s) => (
            <label key={s} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="outputSize"
                value={s}
                checked={outputSize === s}
                onChange={() => setOutputSize(s)}
                className="accent-purple-500"
                disabled={loading}
              />
              {s === 'original' ? `원본(${size}px)` : `${s}px`}
            </label>
          ))}
        </div>
      </div>
      {outputSize === 'original' && (
        <p className="text-xs text-purple-300">
          ⓘ 게임 엔진용 실제 {size}×{size} PNG로 저장됩니다 (업스케일 없음)
        </p>
      )}

      {/* 색상 수 슬라이더 */}
      <div className="space-y-1 text-sm text-gray-300">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">팔레트 색상 수</span>
          <span className="font-mono text-purple-300">{colors}색</span>
        </div>
        <input
          type="range"
          min={4}
          max={128}
          step={4}
          value={colors}
          onChange={(e) => setColors(Number(e.target.value))}
          className="w-full accent-purple-500"
          disabled={loading}
        />
        <p className="text-xs text-gray-500">
          적을수록 레트로한 느낌, 많을수록 원본 색감 보존. 캐릭터 색이 칙츙하면 늘려보세요.
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !file}
        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold transition-colors"
      >
        {loading ? '픽셀화 중...' : '✨ 픽셀화하기'}
      </button>

      {/* 결과 */}
      {result && (
        <div className="space-y-2">
          <div className="text-sm text-gray-400">
            결과 ({result.size}×{result.size} 그리드 → {result.outputSize}×{result.outputSize}px PNG · {result.mode === 'nearest' ? '큰 픽셀 모드' : '일러스트 모드'})
            {bgRemovedUrl && <span className="ml-2 text-purple-300">· 배경 제거됨</span>}
          </div>
          <div
            className="rounded-xl p-4 flex items-center justify-center"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              backgroundColor: '#1a1a1a',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bgRemovedUrl ?? result.url}
              alt="pixelized"
              className="w-full h-auto max-w-[512px]"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={bgRemovedUrl ?? result.url}
              download
              className="inline-block text-sm text-purple-400 hover:text-purple-300"
            >
              ⬇ PNG 다운로드 ({result.outputSize}×{result.outputSize})
            </a>
            {!bgRemovedUrl ? (
              <button
                type="button"
                disabled={removingBg}
                onClick={async () => {
                  setRemovingBg(true)
                  setError('')
                  try {
                    const res = await fetch('/api/remove-bg-local', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ url: result.url, pixelSize: result.size }),
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error ?? '알 수 없는 오류')
                    setBgRemovedUrl(data.url)
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : '배경 제거 실패')
                  } finally {
                    setRemovingBg(false)
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                {removingBg ? '배경 제거 중... (최초 1회는 모델 다운로드)' : '✂️ 배경 제거'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setBgRemovedUrl(null)}
                className="px-4 py-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                ↩ 원본보기
              </button>
            )}
          </div>
        </div>
      )}
    </form>
  )
}
