'use client'

import { useEffect, useState } from 'react'
import styles from './GeneratingState.module.css'

const MESSAGES = [
  'Resizing screenshot…',
  'Uploading image…',
  'Sending to AI models…',
  'Generating code…',
  'Comparing outputs…',
]

const PROGRESS_DURATION_MS = 15_000

export default function GeneratingState({ isExiting }: { isExiting?: boolean }) {
  const [progress, setProgress] = useState(0)
  const [msgIndex, setMsgIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      const t = Math.min((Date.now() - start) / PROGRESS_DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(Math.round(eased * 85))
    }, 80)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const interval = Math.floor(PROGRESS_DURATION_MS / MESSAGES.length)
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setMsgIndex((i) => Math.min(i + 1, MESSAGES.length - 1))
        setVisible(true)
      }, 200)
    }, interval)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={[styles.wrapper, isExiting ? styles.exiting : ''].join(' ')}>
      <div className={styles.spinner} />
      <p className={[styles.message, visible ? styles.fadeIn : styles.fadeOut].join(' ')}>
        {MESSAGES[msgIndex]}
      </p>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${progress}%` }} />
      </div>
      <p className={styles.hint}>This usually takes 15–30 seconds</p>
    </div>
  )
}
