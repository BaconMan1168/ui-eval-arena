'use client'

import { useId, useState } from 'react'
import styles from './StarRating.module.css'

const STAR_PATH =
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'

const FILLED = '#f59e0b'
const EMPTY = '#d1d5db'

interface StarRatingProps {
  value: number | null
  locked: boolean
  onChange: (v: number | null) => void
}

export default function StarRating({ value, locked, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const uid = useId()
  const displayed = hovered ?? value

  function getFill(starNum: number): 0 | 0.5 | 1 {
    if (displayed === null) return 0
    if (displayed >= starNum) return 1
    if (displayed >= starNum - 0.5) return 0.5
    return 0
  }

  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((starNum) => {
        const fill = getFill(starNum)
        const gradId = `${uid}-s${starNum}`

        return (
          <span key={starNum} className={styles.starWrapper}>
            <svg className={styles.starSvg} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
                  {fill === 1 && <stop offset="100%" stopColor={FILLED} />}
                  {fill === 0.5 && (
                    <>
                      <stop offset="50%" stopColor={FILLED} />
                      <stop offset="50%" stopColor={EMPTY} />
                    </>
                  )}
                  {fill === 0 && <stop offset="100%" stopColor={EMPTY} />}
                </linearGradient>
              </defs>
              <path d={STAR_PATH} fill={`url(#${gradId})`} />
            </svg>
            {!locked && (
              <>
                <button
                  className={`${styles.halfBtn} ${styles.halfLeft}`}
                  aria-label={`Rate ${starNum - 0.5} stars`}
                  onMouseEnter={() => setHovered(starNum - 0.5)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onChange(value === starNum - 0.5 ? null : starNum - 0.5)}
                />
                <button
                  className={`${styles.halfBtn} ${styles.halfRight}`}
                  aria-label={`Rate ${starNum} stars`}
                  onMouseEnter={() => setHovered(starNum)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onChange(value === starNum ? null : starNum)}
                />
              </>
            )}
          </span>
        )
      })}
    </div>
  )
}
