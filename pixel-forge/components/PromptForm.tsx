'use client'

import { useState } from 'react'

interface GenerateResult {
  id: string
  url: string
  promptFinal: string
}

export default function PromptForm({
  onResults,
}: {
  onResults: (items: GenerateResult[], prompt: string) => void
}) {
  const [prompt, setPrompt] = useState('')
  const [size, setSize] = useState<16 | 32 | 64 | 128>(64)
  const [removeBg, setRemoveBg] = useState(false)
  const [enhance, setEnhance] = useState(true)
  const [count, setCount] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size, removeBg, enhance, count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '알 수 없는 오류')
      onResults(data.items, prompt)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-4">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="어떤 픽셀 아트를 만들고 싶으세요? (예: 용을 타는 마법사)"
          rows={3}
          className="w-full rounded-xl border border-gray-700 bg-gray-800 text-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-gray-500"
          disabled={loading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
        {/* 사이즈 */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">픽셀 사이즈:</span>
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

        {/* 생성 수 */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400">생성 수:</span>
          {([1, 2, 4] as const).map((n) => (
            <label key={n} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="count"
                value={n}
                checked={count === n}
                onChange={() => setCount(n)}
                className="accent-purple-500"
                disabled={loading}
              />
              {n}장
            </label>
          ))}
        </div>

        {/* 체크박스 */}
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={removeBg}
            onChange={(e) => setRemoveBg(e.target.checked)}
            className="accent-purple-500"
            disabled={loading}
          />
          배경 제거
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={enhance}
            onChange={(e) => setEnhance(e.target.checked)}
            className="accent-purple-500"
            disabled={loading}
          />
          프롬프트 자동 보강
        </label>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            생성 중... (10~30초)
          </span>
        ) : (
          '✨ 생성하기'
        )}
      </button>
    </form>
  )
}
