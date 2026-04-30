import { NextRequest, NextResponse } from 'next/server'
import { readGenerations, deleteGeneration } from '@/lib/local-storage'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const type = searchParams.get('type') ?? 'all'   // 'all' | 'image' | 'animation'
  const limit = 20
  const offset = (page - 1) * limit

  const all = readGenerations()
  const filtered = type === 'all' ? all : all.filter((g) => (g.type ?? 'image') === type)
  const items = filtered.slice(offset, offset + limit)

  return NextResponse.json({ items, total: filtered.length, page, limit })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })
  deleteGeneration(id)
  return NextResponse.json({ success: true })
}
