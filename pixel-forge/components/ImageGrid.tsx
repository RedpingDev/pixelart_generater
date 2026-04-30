'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ResultItem {
  id: string
  url: string
  promptFinal: string
}

export default function ImageGrid({ items, prompt }: { items: ResultItem[]; prompt: string }) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyPrompt = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  const download = async (url: string, id: string) => {
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `pixel-art-${id.slice(0, 8)}.png`
    a.click()
  }

  if (items.length === 0) return null

  return (
    <div className="w-full max-w-2xl mx-auto mt-6">
      <p className="text-xs text-gray-500 mb-3">
        최종 프롬프트: <span className="text-gray-400">{items[0]?.promptFinal}</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-xl overflow-hidden border border-gray-700 bg-gray-800"
          >
            <div className="relative aspect-square">
              <Image
                src={item.url}
                alt={prompt}
                fill
                className="object-contain"
                style={{ imageRendering: 'pixelated' }}
                unoptimized
              />
            </div>

            {/* hover 오버레이 */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                onClick={() => download(item.url, item.id)}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium"
              >
                다운로드
              </button>
              <button
                onClick={() => copyPrompt(item.promptFinal, item.id)}
                className="px-3 py-1.5 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-xs font-medium"
              >
                {copied === item.id ? '복사됨!' : '프롬프트 복사'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
