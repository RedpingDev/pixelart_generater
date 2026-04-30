'use client'

import { useState, useRef } from 'react'

interface RemoveBgResult {
  id: string
  url: string
}

interface RemoveBgFormProps {
  profile?: 'pixel' | 'illustration'
}

export default function RemoveBgForm({ profile = 'pixel' }: RemoveBgFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<RemoveBgResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isIllustration = profile === 'illustration'
  const accent = isIllustration ? 'cyan' : 'pink'

  const handleFileChange = (f: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setResult(null)
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

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('profile', profile)

      const res = await fetch('/api/remove-bg-upload', { method: 'POST', body: fd })
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
      {/* 업로드 + 미리보기 나란히 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 업로드 */}
        <div className="space-y-1">
          <p className="text-xs text-gray-500">원본</p>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`aspect-square border-2 border-dashed border-gray-700 ${isIllustration ? 'hover:border-cyan-500' : 'hover:border-pink-500'} rounded-xl bg-gray-900 flex items-center justify-center cursor-pointer transition-colors overflow-hidden`}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="원본" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center text-gray-500 text-sm px-4">
                <p className="text-2xl mb-2">📁</p>
                <p>드래그 또는 클릭해서 업로드</p>
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
        </div>

        {/* 결과 */}
        <div className="space-y-1">
          <p className="text-xs text-gray-500">배경 제거 결과</p>
          <div
            className="aspect-square rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              backgroundColor: '#1a1a1a',
            }}
          >
            {loading ? (
              <div className="text-center text-gray-400 text-sm">
                <svg className={`animate-spin h-8 w-8 mx-auto mb-2 ${isIllustration ? 'text-cyan-400' : 'text-pink-400'}`} viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p>배경 제거 중...</p>
                <p className="text-xs text-gray-500 mt-1">
                  {isIllustration ? '최초 실행 시 일러스트 모델 다운로드' : '최초 실행 시 모델 다운로드 (~170MB)'}
                </p>
              </div>
            ) : result ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.url}
                alt="배경 제거 결과"
                className="w-full h-full object-contain"
              />
            ) : (
              <p className="text-gray-600 text-sm">결과가 여기에 표시됩니다</p>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !file}
        className={`w-full py-3 rounded-xl ${accent === 'cyan' ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-pink-600 hover:bg-pink-500'} disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold transition-colors`}
      >
        {loading ? '처리 중...' : isIllustration ? '일러스트 배경 제거하기' : '✂️ 배경 제거하기'}
      </button>

      {result && (
        <a
          href={result.url}
          download
          className={`block text-center text-sm ${isIllustration ? 'text-cyan-400 hover:text-cyan-300' : 'text-pink-400 hover:text-pink-300'}`}
        >
          ⬇ 투명 배경 PNG 다운로드
        </a>
      )}
    </form>
  )
}
