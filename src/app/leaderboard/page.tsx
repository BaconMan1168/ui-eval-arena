'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StarDisplay from '@/components/StarDisplay'
import styles from './page.module.css'

interface ModelStats {
  model_name: string
  avg_star_rating: number | null
  rating_count: number
  distribution: number[]
  avg_clip_score: number | null
  clip_last_updated: string | null
}

const DISPLAY: Record<string, { name: string; provider: string; color: string }> = {
  'claude-haiku-4-5':  { name: 'Claude Haiku 4.5',  provider: 'Anthropic',       color: '#3fb950' },
  'gemini-2.5-flash':  { name: 'Gemini 2.5 Flash',  provider: 'Google',          color: '#58a6ff' },
  'llama-4-scout':     { name: 'Llama 4 Scout',      provider: 'Meta via Groq',   color: '#8b949e' },
}

const RATING_LABELS = ['0.5','1','1.5','2','2.5','3','3.5','4','4.5','5']

function BarChart({ distribution, color }: { distribution: number[]; color: string }) {
  const max = Math.max(...distribution, 1)
  return (
    <div className={styles.chart}>
      <div className={styles.bars}>
        {distribution.map((count, i) => {
          const heightPx = Math.max(2, Math.round((count / max) * 56))
          const opacity = (0.35 + (count / max) * 0.65).toFixed(2)
          return (
            <div key={i} className={styles.barCol}>
              <span className={styles.barCount}>{count > 0 ? count : ''}</span>
              <div
                className={styles.bar}
                style={{ height: heightPx, background: color, opacity }}
              />
              <span className={styles.barLabel}>{RATING_LABELS[i]}</span>
            </div>
          )
        })}
      </div>
      <div className={styles.chartXLabel}>Rating distribution (0.5 – 5.0 stars)</div>
    </div>
  )
}

export default function LeaderboardPage() {
  const [models, setModels] = useState<ModelStats[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d) => setModels(d.models))
      .catch(() => setError('Failed to load leaderboard data.'))
  }, [])

  if (error) return <div className={styles.page}><div className={styles.inner}><p className={styles.error}>{error}</p></div></div>
  if (!models) return <div className={styles.page}><div className={styles.inner}><p className={styles.loading}>Loading...</p></div></div>

  const clipLastUpdated = models.reduce<string | null>((latest, m) => {
    if (!m.clip_last_updated) return latest
    if (!latest) return m.clip_last_updated
    return m.clip_last_updated > latest ? m.clip_last_updated : latest
  }, null)

  const hasClipScores = models.some((m) => m.avg_clip_score !== null)

  const clipRanked = hasClipScores
    ? [...models].sort((a, b) => (b.avg_clip_score ?? -1) - (a.avg_clip_score ?? -1))
    : []

  const totalRatings = models.reduce((sum, m) => sum + m.rating_count, 0) / 3

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.backLink}>← Back</Link>
        </nav>

        <h1 className={styles.title}>Leaderboard</h1>
        <p className={styles.subtitle}>
          Ranked by average human star rating &middot; {Math.round(totalRatings)} submission{Math.round(totalRatings) !== 1 ? 's' : ''} &middot; live
        </p>

        {models.map((m, i) => {
          const display = DISPLAY[m.model_name] ?? { name: m.model_name, provider: '', color: '#8b949e' }
          return (
            <div key={m.model_name} className={`${styles.card} ${i === 0 ? styles.first : ''}`}>
              <div className={styles.cardHeader}>
                <div className={styles.cardLeft}>
                  <span className={styles.rank}>#{i + 1}</span>
                  <div>
                    <div className={styles.modelName}>{display.name}</div>
                    <div className={styles.modelProvider}>{display.provider}</div>
                  </div>
                </div>
                <div className={styles.cardRight}>
                  <div className={styles.avgNum}>
                    {m.avg_star_rating != null ? m.avg_star_rating.toFixed(1) : '—'}
                    <span className={styles.avgDenom}>/ 5</span>
                  </div>
                  {m.avg_star_rating != null && (
                    <div className={styles.starRow}>
                      <StarDisplay value={m.avg_star_rating} size={13} />
                    </div>
                  )}
                  <div className={styles.ratingCount}>{m.rating_count} rating{m.rating_count !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <BarChart distribution={m.distribution} color={display.color} />
            </div>
          )
        })}

        <hr className={styles.divider} />

        <h2 className={styles.sectionTitle}>Human vs. Automated Metric Comparison</h2>
        <p className={styles.sectionSub}>
          CLIP similarity computed on the same user-submitted screenshots. Do human raters and automated scoring agree?
        </p>

        {!hasClipScores ? (
          <p className={styles.noClip}>
            CLIP scores not yet computed. Run{' '}
            <code className={styles.noClipMono}>scripts/run-clip.py</code> to generate.
          </p>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Human avg</th>
                  <th>Human rank</th>
                  <th>CLIP score</th>
                  <th>CLIP rank</th>
                  <th>Agreement</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m, humanRank) => {
                  const display = DISPLAY[m.model_name] ?? { name: m.model_name, provider: '' }
                  const clipRank = clipRanked.findIndex((c) => c.model_name === m.model_name)
                  const agrees = humanRank === clipRank
                  const clipPct = m.avg_clip_score != null ? Math.round(m.avg_clip_score * 100) : 0

                  return (
                    <tr key={m.model_name}>
                      <td>
                        <div className={styles.modelCell}>
                          <span className={styles.modelCellName}>{display.name}</span>
                          <span className={styles.modelCellProvider}>{display.provider}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.humanCell}>
                          <span className={styles.humanNum}>
                            {m.avg_star_rating != null ? m.avg_star_rating.toFixed(1) : '—'}
                          </span>
                          {m.avg_star_rating != null && (
                            <StarDisplay value={m.avg_star_rating} size={11} />
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.rankPill} ${humanRank === 0 ? styles.top : ''}`}>
                          #{humanRank + 1}
                        </span>
                      </td>
                      <td>
                        {m.avg_clip_score != null ? (
                          <div className={styles.clipCell}>
                            <div className={styles.clipBarBg}>
                              <div className={styles.clipBarFill} style={{ width: `${clipPct}%` }} />
                            </div>
                            <span className={styles.clipVal}>{m.avg_clip_score.toFixed(2)}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        {m.avg_clip_score != null ? (
                          <span className={`${styles.rankPill} ${clipRank === 0 ? styles.top : ''}`}>
                            #{clipRank + 1}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        {m.avg_clip_score != null ? (
                          <span className={agrees ? styles.agreeYes : styles.agreeNo}>
                            {agrees ? 'Yes' : 'No'}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className={styles.clipNote}>
              CLIP scores last updated:{' '}
              {clipLastUpdated
                ? new Date(clipLastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'unknown'}
              . Run <code className={styles.clipNoteMono}>scripts/run-clip.py</code> to refresh.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
