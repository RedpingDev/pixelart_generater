'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Generation } from '@/lib/local-storage'

export default function GalleryItem({
  item,
  onDelete,
}: {
  item: Generation
  onDelete: (id: string) => void
}) {
  const [deleting, setDeleting] = useState(false)

  const download = async () => {
    const res = await fetch(item.image_url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `pixel-art-${item.id.slice(0, 8)}.png`
    a.click()
  }

  const handleDelete = async () => {
    if (!confirm('삭제하시겠습니까?')) return
    setDeleting(true)
    await fetch('/api/gallery', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id }),
    })
    onDelete(item.id)
  }

  return (
    <div className="group relative rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
      <div className="relative aspect-square">
        <Image
          src={item.image_url}
          alt={item.prompt_raw}
          fill
          className="object-contain"
          style={{ imageRendering: 'pixelated' }}
          unoptimized
        />
      </div>

      <div className="p-2">
        <p className="text-xs text-gray-400 truncate">{item.prompt_raw}</p>
        <p className="text-xs text-gray-600">{new Date(item.created_at).toLocaleDateString('ko-KR')}</p>
      </div>

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          onClick={download}
          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium"
        >
          다운로드
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-medium disabled:opacity-50"
        >
          {deleting ? '...' : '삭제'}
        </button>
      </div>
    </div>
  )
}
