import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'

const PROMPT =
  'You are given a screenshot of a UI. Generate a complete, self-contained HTML file with inline CSS that visually replicates this UI as closely as possible. Output only the HTML — no explanation, no markdown, no code fences.'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function generateWithClaude(
  base64: string,
): Promise<{ model_name: string; html_output: string }> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  })
  const html = message.content.find((b) => b.type === 'text')?.text ?? ''
  return { model_name: 'claude-haiku-4-5', html_output: html }
}

export async function generateWithGemini(
  base64: string,
): Promise<{ model_name: string; html_output: string }> {
  const model = googleAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await model.generateContent([
    { inlineData: { data: base64, mimeType: 'image/jpeg' } },
    PROMPT,
  ])
  const html = result.response.text()
  return { model_name: 'gemini-2.0-flash', html_output: html }
}

export async function generateWithLlama(
  base64: string,
): Promise<{ model_name: string; html_output: string }> {
  const completion = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64}` },
          },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any,
      },
    ],
  })
  const html = completion.choices[0]?.message?.content ?? ''
  return { model_name: 'llama-4-scout', html_output: html }
}
