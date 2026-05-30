import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { sql } from '@/lib/db'

function isValidStarRating(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 5 && v * 2 === Math.floor(v * 2)
}

export async function POST(req: NextRequest) {
  let ratings: unknown
  try {
    const body = await req.json()
    ratings = body?.ratings
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!Array.isArray(ratings) || ratings.length === 0) {
    return NextResponse.json({ error: 'ratings must be a non-empty array' }, { status: 400 })
  }

  for (const r of ratings) {
    if (typeof r?.generation_id !== 'string' || !isValidStarRating(r?.star_rating)) {
      return NextResponse.json(
        { error: 'Each rating needs a generation_id string and star_rating (1–5, multiples of 0.5)' },
        { status: 400 }
      )
    }
  }

  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const raterSessionHash = createHash('sha256')
    .update(ip + (process.env.SESSION_SALT ?? 'dev'))
    .digest('hex')

  for (const r of ratings as { generation_id: string; star_rating: number }[]) {
    await sql`
      INSERT INTO ratings (generation_id, star_rating, rater_session_hash)
      VALUES (${r.generation_id}, ${r.star_rating}, ${raterSessionHash})
    `
  }

  return NextResponse.json({ ok: true })
}
