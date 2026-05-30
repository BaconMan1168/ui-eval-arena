'use client'

import { useState } from 'react'
import UploadZone from '@/components/UploadZone'
import GeneratingState from '@/components/GeneratingState'
import styles from './page.module.css'

type Generation = { model_name: string; html_output: string }
type AppState = 'upload' | 'generating' | 'done'

export default function Home() {
  const [appState, setAppState] = useState<AppState>('upload')
  const [generations, setGenerations] = useState<Generation[]>([])
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(base64DataUri: string) {
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
      setAppState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setAppState('upload')
    }
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

      {appState === 'generating' && <GeneratingState />}

      {appState === 'done' && (
        <div className={styles.done}>
          <p className={styles.doneTitle}>Generations complete</p>
          <p className={styles.doneSubtitle}>
            {generations.length} model{generations.length !== 1 ? 's' : ''} responded ·{' '}
            <span className={styles.submissionId}>{submissionId}</span>
          </p>
          <ul className={styles.modelList}>
            {generations.map((g) => (
              <li key={g.model_name} className={styles.modelItem}>
                {g.model_name}
              </li>
            ))}
          </ul>
          <button className={styles.resetButton} onClick={() => setAppState('upload')}>
            Try another screenshot
          </button>
        </div>
      )}
    </main>
  )
}
