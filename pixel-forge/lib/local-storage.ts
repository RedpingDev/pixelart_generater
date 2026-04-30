import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const GENERATIONS_FILE = path.join(DATA_DIR, 'generations.json')
const IMAGES_DIR = path.join(process.cwd(), 'public', 'generated')

export interface Generation {
  id: string
  type: 'image' | 'title'
  prompt_raw: string
  prompt_final: string
  image_url: string
  pixel_size: number
  bg_removed: boolean
  model: string
  cost_usd: number | null
  is_favorite: boolean
  created_at: string
}

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true })
}

// ── Generations ──────────────────────────────────────────────

export function readGenerations(): Generation[] {
  ensureDirs()
  if (!fs.existsSync(GENERATIONS_FILE)) return []
  const raw = JSON.parse(fs.readFileSync(GENERATIONS_FILE, 'utf-8')) as Generation[]
  return raw.map((g) => ({ type: 'image' as const, ...g }))
}

function writeGenerations(items: Generation[]) {
  ensureDirs()
  fs.writeFileSync(GENERATIONS_FILE, JSON.stringify(items, null, 2), 'utf-8')
}

export function saveGeneration(item: Omit<Generation, 'id' | 'created_at'>): Generation {
  const generations = readGenerations()
  const newItem: Generation = {
    ...item,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  generations.unshift(newItem)
  writeGenerations(generations)
  return newItem
}

export function deleteGeneration(id: string): void {
  const generations = readGenerations()
  const item = generations.find((g) => g.id === id)
  if (item) {
    const filePath = path.join(IMAGES_DIR, path.basename(item.image_url))
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }
  writeGenerations(generations.filter((g) => g.id !== id))
}

export function saveImageFile(buffer: Buffer, fileName: string): string {
  ensureDirs()
  fs.writeFileSync(path.join(IMAGES_DIR, fileName), buffer)
  return `/generated/${fileName}`
}
