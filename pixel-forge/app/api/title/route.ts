import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import sharp from "sharp"
import { saveGeneration, saveImageFile } from "@/lib/local-storage"

export const maxDuration = 120

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const STYLE_PRESETS: Record<string, string> = {
  pixel: "Detailed pixel art style, retro 16-bit game aesthetic, vibrant saturated colors, crisp pixel-perfect edges.",
  fantasy: "Epic fantasy concept art, painterly digital illustration, dramatic lighting, rich atmosphere.",
  scifi: "Sci-fi concept art, futuristic cyberpunk aesthetic, neon lights, atmospheric haze, cinematic.",
  anime: "Anime key visual style, cel-shaded, dramatic composition, vivid colors.",
  realistic: "Photorealistic concept art, cinematic composition, dramatic lighting, highly detailed.",
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userPrompt = (body.prompt as string)?.trim()
    const style = (body.style as string) || "pixel"
    const includeTitleText = Boolean(body.includeTitleText)
    const titleText = (body.titleText as string)?.trim() || ""

    if (!userPrompt) {
      return NextResponse.json({ error: "프롬프트를 입력해주세요." }, { status: 400 })
    }

    const stylePrompt = STYLE_PRESETS[style] ?? STYLE_PRESETS.pixel
    const titleInstruction = includeTitleText && titleText
      ? ` Include the game title text "${titleText}" prominently in the composition with stylized typography.`
      : " Do NOT include any text or letters in the image."

    const fullPrompt =
      `Game title screen background, 16:9 cinematic widescreen composition. ${userPrompt}. ` +
      `${stylePrompt} Wide horizontal layout suitable for a game main menu, with strong focal point and atmospheric depth.${titleInstruction}`

    // gpt-image-2: 1536x1024 (3:2)이 가장 가까운 와이드 비율
    const response = await openai.images.generate({
      model: "gpt-image-2",
      prompt: fullPrompt,
      n: 1,
      size: "1536x1024",
    } as Parameters<typeof openai.images.generate>[0])

    const b64 = response.data[0].b64_json!
    const rawBuffer = Buffer.from(b64, "base64")

    // 1536x1024 → 1920x1080으로 리사이즈 (cover로 비율 맞추고 중앙 크롭)
    const finalBuffer = await sharp(rawBuffer)
      .resize(1920, 1080, { fit: "cover", position: "center" })
      .png()
      .toBuffer()

    const fileName = `title_${Date.now()}.png`
    const localPath = saveImageFile(finalBuffer, fileName)

    const gen = saveGeneration({
      type: "title",
      prompt_raw: userPrompt,
      prompt_final: fullPrompt,
      image_url: localPath,
      pixel_size: 1920,
      bg_removed: false,
      model: "gpt-image-2",
      cost_usd: 0.19, // gpt-image-2 1536x1024 high-quality 가격
      is_favorite: false,
    })

    return NextResponse.json({ id: gen.id, url: localPath, prompt: fullPrompt })
  } catch (err) {
    console.error("[title]", err)
    const message = err instanceof Error ? err.message : "오류가 발생했습니다."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
