'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import GalleryItem from '@/components/GalleryItem'
import type { Generation } from '@/lib/local-storage'

type Tab = 'image' | 'title'

export default function GalleryPage() {
  const [tab, setTab] = useState<Tab>('image')
  const [items, setItems] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchItems = async (p: number, t: Tab) => {
    setLoading(true)
    const res = await fetch(`/api/gallery?page=${p}&type=${t}`)
    const data = await res.json()
    setItems(data.items ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }

  useEffect(() => {
    setPage(1)
    fetchItems(1, tab)
  }, [tab])

  useEffect(() => { fetchItems(page, tab) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setTotal((t) => t - 1)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            PixelForge
          </h1>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">생성</Link>
          <Link href="/pixelize" className="hover:text-white transition-colors">업로드 픽셀화</Link>
          <Link href="/remove-bg" className="hover:text-white transition-colors">픽셀 배경 제거</Link>
          <Link href="/remove-bg-illustration" className="hover:text-white transition-colors">일러스트 배경 제거</Link>
          <Link href="/title" className="hover:text-white transition-colors">타이틀 배경</Link>
          <span className="text-white font-medium">갤러리</span>
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">갤러리</h2>
          <span className="text-sm text-gray-500">총 {total}개</span>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 p-1 bg-gray-800 rounded-xl w-fit mb-6">
          {([['image', '🖼️ 픽셀 아트'], ['title', '🖼️ 타이틀 배경']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-3">
            <p>{tab === 'image' ? '생성된 픽셀 아트가 없습니다.' : '생성된 타이틀 배경이 없습니다.'}</p>
            <Link href={tab === 'image' ? '/' : '/title'} className="text-purple-400 hover:text-purple-300 text-sm">
              {tab === 'image' ? '첫 작품 만들기 →' : '첫 타이틀 배경 만들기 →'}
            </Link>
          </div>
        ) : tab === 'image' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <GalleryItem key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <GalleryItem key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-8">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-sm">이전</button>
            <span className="px-4 py-2 text-sm text-gray-400">{page} / {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-sm">다음</button>
          </div>
        )}
      </div>
    </main>
  )
}
