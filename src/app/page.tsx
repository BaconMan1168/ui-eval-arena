'use client'

import { useState } from 'react'
import UploadZone from '@/components/UploadZone'
import GeneratingState from '@/components/GeneratingState'
import RatingView from '@/components/RatingView'
import styles from './page.module.css'

type Generation = { id: string; model_name: string; html_output: string }
type AppState = 'upload' | 'generating' | 'done'

export default function Home() {
  const [appState, setAppState] = useState<AppState>('upload')
  const [isExiting, setIsExiting] = useState(false)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(base64DataUri: string) {
    setPreviewImage(base64DataUri)
    setAppState('generating')
    setError(null)
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64DataUri }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? 'Submission failed')
      }
      setGenerations(data.generations)
      setSubmissionId(data.submission_id)
      setIsExiting(true)
      setTimeout(() => {
        setIsExiting(false)
        setAppState('done')
      }, 200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setAppState('upload')
    }
  }

  function handleReset() {
    setAppState('upload')
    setGenerations([])
    setSubmissionId(null)
    setPreviewImage('')
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>UI Eval Arena</h1>
        <p className={styles.subtitle}>
          Upload a UI screenshot and compare how three AI models recreate it.
        </p>
      </header>

      {appState === 'upload' && (
        <>
          <UploadZone onSubmit={handleSubmit} />
          {error && <p className={styles.error}>{error}</p>}
        </>
      )}

      {appState === 'generating' && <GeneratingState isExiting={isExiting} />}

      {appState === 'done' && submissionId && (
        <RatingView
          generations={generations}
          previewImage={previewImage}
          onReset={handleReset}
        />
      )}
    </main>
  )
}
