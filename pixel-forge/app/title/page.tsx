import Link from 'next/link'
import TitleForm from '@/components/TitleForm'

export default function TitlePage() {
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
          <Link href="/title" className="text-white font-medium">타이틀 배경</Link>
          <Link href="/gallery" className="hover:text-white transition-colors">갤러리</Link>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">게임 타이틀 배경 생성기</h2>
          <p className="text-gray-400 text-sm">
            1920×1080 와이드스크린 타이틀 화면 배경을 생성합니다 (gpt-image-2)
          </p>
        </div>

        <TitleForm />
      </div>
    </main>
  )
}
