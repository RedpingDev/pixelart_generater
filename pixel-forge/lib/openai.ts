import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function enhancePrompt(userPrompt: string): Promise<string> {
  console.log('[enhancePrompt] 호출됨, 입력:', userPrompt)
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a pixel art prompt engineer. Convert the user\'s idea into a detailed English prompt for a pixel art image generation model. Keep it under 120 tokens. Focus on style: pixel art, 16-bit, sprite-style. Return only the prompt text, nothing else.',
        },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 120,
      temperature: 0.7,
    })
    const result = response.choices[0].message.content?.trim() ?? userPrompt
    console.log('[enhancePrompt] OpenAI 응답:', result)
    return result
  } catch (err) {
    console.warn('[enhancePrompt] OpenAI 실패, 원본 프롬프트 사용:', err)
    return userPrompt
  }
}

/**
 * 업로드 이미지를 분석해 캐릭터 특징을 영문 텍스트로 추출
 * (이미지를 그대로 input_image로 쓰면 모델이 정적 포즈를 그대로 복사하는 문제 해결)
 */
export async function describeCharacter(
  imageBase64: string,
  mimeType: string,
  userHint: string = '',
): Promise<string> {
  console.log('[describeCharacter] 호출됨, 힌트:', userHint)
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You describe pixel-art game characters concisely for a sprite generator. Output ONLY a comma-separated list of visual traits in English (color, species, clothing, accessories, distinctive features). Do NOT include pose, action, or background. Keep under 30 words.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userHint ? `User hint: ${userHint}. Describe this character:` : 'Describe this character:' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        },
      ],
      max_tokens: 100,
      temperature: 0.3,
    })
    const result = response.choices[0].message.content?.trim() ?? userHint
    console.log('[describeCharacter] 응답:', result)
    return result
  } catch (err) {
    console.warn('[describeCharacter] 실패, 힌트만 사용:', err)
    return userHint
  }
}
