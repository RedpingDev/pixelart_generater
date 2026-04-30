import Link from 'next/link'
import RemoveBgForm from '@/components/RemoveBgForm'

export default function RemoveBgPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            PixelForge
          </h1>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">생성</Link>
          <Link href="/pixelize" className="hover:text-white transition-colors">업로드 픽셀화</Link>
          <Link href="/remove-bg" className="text-white">픽셀 배경 제거</Link>
          <Link href="/remove-bg-illustration" className="hover:text-white transition-colors">일러스트 배경 제거</Link>
          <Link href="/title" className="hover:text-white transition-colors">타이틀 배경</Link>
          <Link href="/gallery" className="hover:text-white transition-colors">갤러리</Link>
        </nav>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">픽셀 배경 제거</h2>
          <p className="text-gray-400 text-sm">
            픽셀 아트와 작은 스프라이트의 형태를 보존하면서 배경을 제거하고 투명 PNG로 저장합니다
          </p>
        </div>

        <RemoveBgForm />
      </div>
    </main>
  )
}
