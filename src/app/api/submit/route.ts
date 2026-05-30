import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createHash } from 'crypto'
import { sql } from '@/lib/db'
import { generateWithClaude, generateWithGemini, generateWithLlama } from '@/lib/llm'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(req: NextRequest) {
  let image: unknown
  try {
    const body = await req.json()
    image = body?.image
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!image || typeof image !== 'string') {
    return NextResponse.json({ error: 'Missing image' }, { status: 400 })
  }

  const match = image.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
  }
  const [, mimeType, base64] = match

  if (!ALLOWED_TYPES.has(mimeType)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  const buffer = Buffer.from(base64, 'base64')
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const sessionHash = createHash('sha256')
    .update(ip + (process.env.SESSION_SALT ?? 'dev'))
    .digest('hex')

  const blob = await put(`screenshots/${Date.now()}.jpg`, buffer, {
    access: 'public',
    contentType: mimeType,
  })

  const [submission] = await sql`
    INSERT INTO submissions (screenshot_url, session_hash)
    VALUES (${blob.url}, ${sessionHash})
    RETURNING id
  `

  const results = await Promise.allSettled([
    generateWithClaude(base64),
    generateWithGemini(base64),
    generateWithLlama(base64),
  ])

  const generations: { model_name: string; html_output: string }[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { model_name, html_output } = result.value
      await sql`
        INSERT INTO generations (submission_id, model_name, html_output)
        VALUES (${submission.id}, ${model_name}, ${html_output})
      `
      generations.push({ model_name, html_output })
    }
  }

  return NextResponse.json({ submission_id: submission.id, generations })
}
