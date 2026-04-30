'use client'

import { useState } from 'react'
import Link from 'next/link'
import PromptForm from '@/components/PromptForm'
import ImageGrid from '@/components/ImageGrid'

interface ResultItem {
  id: string
  url: string
  promptFinal: string
}

export default function Home() {
  const [results, setResults] = useState<ResultItem[]>([])
  const [lastPrompt, setLastPrompt] = useState('')

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            PixelForge
          </h1>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
          <Link href="/pixelize" className="hover:text-white transition-colors">업로드 픽셀화</Link>
          <Link href="/remove-bg" className="hover:text-white transition-colors">픽셀 배경 제거</Link>
          <Link href="/remove-bg-illustration" className="hover:text-white transition-colors">일러스트 배경 제거</Link>
          <Link href="/title" className="hover:text-white transition-colors">타이틀 배경</Link>
          <Link href="/gallery" className="hover:text-white transition-colors">갤러리</Link>
        </nav>
      </header>

      {/* 본문 */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">픽셀 아트 생성기</h2>
          <p className="text-gray-400 text-sm">아이디어를 입력하면 픽셀 아트로 만들어드립니다</p>
        </div>

        <PromptForm
          onResults={(items, prompt) => {
            setResults(items)
            setLastPrompt(prompt)
          }}
        />

        <ImageGrid items={results} prompt={lastPrompt} />
      </div>
    </main>
  )
}
