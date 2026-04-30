'use client'

import { useState } from 'react'

const STYLE_OPTIONS = [
  { value: 'pixel', label: '픽셀아트', desc: '레트로 16비트' },
  { value: 'fantasy', label: '판타지', desc: '에픽 일러스트' },
  { value: 'scifi', label: 'SF', desc: '사이버펑크' },
  { value: 'anime', label: '애니메', desc: '셀쉐이딩' },
  { value: 'realistic', label: '실사', desc: '시네마틱' },
]

export default function TitleForm() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('pixel')
  const [includeTitleText, setIncludeTitleText] = useState(false)
  const [titleText, setTitleText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ id: string; url: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) {
      setError('프롬프트를 입력해주세요.')
      return
    }
    setSubmitting(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style, includeTitleText, titleText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '생성 실패')
      setResult({ id: data.id, url: data.url })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 프롬프트 */}
        <div className="space-y-1.5">
          <label className="text-sm text-gray-300 font-medium">
            장면 설명 <span className="text-gray-500 font-normal">(영문 권장)</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: a mysterious dark forest with a glowing ancient temple, mountains in background, sunset sky"
            rows={3}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-500 resize-none"
            disabled={submitting}
          />
        </div>

        {/* 스타일 */}
        <div className="space-y-2">
          <label className="text-sm text-gray-300 font-medium">아트 스타일</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {STYLE_OPTIONS.map((s) => (
              <label
                key={s.value}
                className={`flex flex-col gap-0.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  style === s.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="style"
                  value={s.value}
                  checked={style === s.value}
                  onChange={() => setStyle(s.value)}
                  className="hidden"
                />
                <span className="text-sm font-medium text-white">{s.label}</span>
                <span className="text-xs text-gray-400">{s.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 타이틀 텍스트 */}
        <div className="space-y-2 p-4 rounded-xl border border-gray-700 bg-gray-800/40">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTitleText}
              onChange={(e) => setIncludeTitleText(e.target.checked)}
              className="w-4 h-4 accent-purple-500"
              disabled={submitting}
            />
            <span className="text-sm text-gray-300 font-medium">게임 타이틀 텍스트 포함</span>
            <span className="text-xs text-gray-500">(AI가 직접 그림 — 정확도 낮을 수 있음)</span>
          </label>
          {includeTitleText && (
            <input
              type="text"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              placeholder="예: PIXEL QUEST"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 text-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-500"
              disabled={submitting}
            />
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '🎨 생성 중... (약 30~60초)' : '🖼️ 1920×1080 타이틀 배경 생성'}
        </button>
      </form>

      {result && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">✅ 생성 완료</h3>
          <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-2 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.url}
              alt="title background"
              className="w-full h-auto rounded-lg"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>해상도: 1920 × 1080</span>
            <a
              href={result.url}
              download={`title_${result.id}.png`}
              className="text-purple-400 hover:text-purple-300 transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              ⬇ 다운로드
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
