import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const rows = await sql`
    SELECT
      g.model_name,
      ROUND(AVG(r.star_rating)::numeric, 2)           AS avg_star_rating,
      COUNT(r.id)                                       AS rating_count,
      ROUND(AVG(g.clip_score)::numeric, 4)             AS avg_clip_score,
      MAX(g.clip_scored_at)                             AS clip_last_updated,
      COUNT(r.id) FILTER (WHERE r.star_rating = 0.5)  AS d0,
      COUNT(r.id) FILTER (WHERE r.star_rating = 1.0)  AS d1,
      COUNT(r.id) FILTER (WHERE r.star_rating = 1.5)  AS d2,
      COUNT(r.id) FILTER (WHERE r.star_rating = 2.0)  AS d3,
      COUNT(r.id) FILTER (WHERE r.star_rating = 2.5)  AS d4,
      COUNT(r.id) FILTER (WHERE r.star_rating = 3.0)  AS d5,
      COUNT(r.id) FILTER (WHERE r.star_rating = 3.5)  AS d6,
      COUNT(r.id) FILTER (WHERE r.star_rating = 4.0)  AS d7,
      COUNT(r.id) FILTER (WHERE r.star_rating = 4.5)  AS d8,
      COUNT(r.id) FILTER (WHERE r.star_rating = 5.0)  AS d9
    FROM generations g
    LEFT JOIN ratings r ON r.generation_id = g.id
    GROUP BY g.model_name
    ORDER BY avg_star_rating DESC NULLS LAST
  `

  const models = rows.map((row) => ({
    model_name: row.model_name as string,
    avg_star_rating: row.avg_star_rating != null ? Number(row.avg_star_rating) : null,
    rating_count: Number(row.rating_count),
    distribution: [row.d0, row.d1, row.d2, row.d3, row.d4, row.d5, row.d6, row.d7, row.d8, row.d9].map(Number),
    avg_clip_score: row.avg_clip_score != null ? Number(row.avg_clip_score) : null,
    clip_last_updated: row.clip_last_updated ? (row.clip_last_updated as Date).toISOString() : null,
  }))

  return NextResponse.json({ models })
}
