'use client'

import { useId } from 'react'

const STAR_PATH =
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
const FILLED = '#f59e0b'
const EMPTY = '#374151'

interface StarDisplayProps {
  value: number
  size?: number
}

export default function StarDisplay({ value, size = 14 }: StarDisplayProps) {
  const uid = useId()

  return (
    <span style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((starNum) => {
        const gradId = `${uid}-s${starNum}`
        const fill = value >= starNum ? 1 : value >= starNum - 0.5 ? 0.5 : 0

        return (
          <svg key={starNum} width={size} height={size} viewBox="0 0 24 24">
            {fill === 0.5 && (
              <defs>
                <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor={FILLED} />
                  <stop offset="50%" stopColor={EMPTY} />
                </linearGradient>
              </defs>
            )}
            <path
              d={STAR_PATH}
              fill={fill === 1 ? FILLED : fill === 0.5 ? `url(#${gradId})` : EMPTY}
            />
          </svg>
        )
      })}
    </span>
  )
}
