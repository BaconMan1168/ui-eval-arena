'use client'

import { useEffect, useState } from 'react'
import StarRating from './StarRating'
import Modal from './Modal'
import styles from './RatingView.module.css'

interface Generation {
  id: string
  model_name: string
  html_output: string
}

interface ModalState {
  type: 'image' | 'iframe'
  src: string
  label: string
}

interface AccordionState {
  open: boolean
  tab: 'html' | 'css'
}

interface RatingViewProps {
  generations: Generation[]
  previewImage: string
  onReset: () => void
}

function extractCodeParts(htmlOutput: string): { html: string; css: string } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlOutput, 'text/html')
  const styleEls = Array.from(doc.querySelectorAll('style'))
  const css = styleEls.map((s) => s.textContent ?? '').join('\n')
  styleEls.forEach((s) => s.remove())
  return { html: doc.documentElement.outerHTML, css }
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function RatingView({ generations, previewImage, onReset }: RatingViewProps) {
  const [visible, setVisible] = useState(false)
  const [ratings, setRatings] = useState<Record<string, number | null>>(
    () => Object.fromEntries(generations.map((g) => [g.id, null]))
  )
  const [submitted, setSubmitted] = useState(false)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [accordions, setAccordions] = useState<Record<string, AccordionState>>({})
  const [order] = useState<number[]>(() => shuffle(generations.map((_, i) => i)))

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const allRated = generations.every((g) => ratings[g.id] !== null)

  async function handleSubmit() {
    const body = {
      ratings: Object.entries(ratings).map(([generation_id, star_rating]) => ({
        generation_id,
        star_rating,
      })),
    }
    await fetch('/api/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSubmitted(true)
  }

  function toggleAccordion(id: string) {
    setAccordions((prev) => ({
      ...prev,
      [id]: { open: !prev[id]?.open, tab: prev[id]?.tab ?? 'html' },
    }))
  }

  function setTab(id: string, tab: 'html' | 'css') {
    setAccordions((prev) => ({ ...prev, [id]: { ...prev[id], open: true, tab } }))
  }

  return (
    <div className={[styles.container, visible ? styles.visible : ''].join(' ')}>
      <div className={styles.layout}>
        <div className={styles.leftPanel}>
          <p className={styles.panelLabel}>Original</p>
          <img
            src={previewImage}
            alt="Original screenshot"
            className={styles.originalImg}
            onClick={() => setModal({ type: 'image', src: previewImage, label: 'Original' })}
          />
        </div>

        <div className={styles.rightPanel}>
          {order.map((genIndex, position) => {
            const gen = generations[genIndex]
            const blindLabel = `Model ${position + 1}`
            const rowLabel = submitted ? gen.model_name : blindLabel
            const { html, css } = extractCodeParts(gen.html_output)
            const acc = accordions[gen.id]

            return (
              <div key={gen.id} className={styles.modelRow}>
                <p className={styles.modelRowHeader}>{rowLabel}</p>
                <div className={styles.modelRowContent}>
                  <div
                    className={styles.iframeWrapper}
                    onClick={() =>
                      setModal({ type: 'iframe', src: gen.html_output, label: blindLabel })
                    }
                  >
                    <iframe
                      srcDoc={gen.html_output}
                      sandbox="allow-same-origin"
                      className={styles.iframe}
                      title={blindLabel}
                    />
                  </div>
                  <div className={styles.ratingColumn}>
                    <StarRating
                      value={ratings[gen.id]}
                      locked={submitted}
                      onChange={(v) => setRatings((prev) => ({ ...prev, [gen.id]: v }))}
                    />
                    {!submitted && (
                      <p className={styles.ratingHint}>
                        {ratings[gen.id] !== null ? `${ratings[gen.id]}★` : 'Rate this'}
                      </p>
                    )}
                  </div>
                </div>

                {submitted && (
                  <div className={styles.accordion}>
                    <button
                      className={styles.accordionToggle}
                      onClick={() => toggleAccordion(gen.id)}
                    >
                      <span>View Code</span>
                      <span>{acc?.open ? '▲' : '▼'}</span>
                    </button>
                    <div className={[styles.accordionBody, acc?.open ? styles.open : ''].join(' ')}>
                      <div className={styles.tabs}>
                        <button
                          className={[styles.tab, (!acc?.tab || acc.tab === 'html') ? styles.active : ''].join(' ')}
                          onClick={() => setTab(gen.id, 'html')}
                        >
                          HTML
                        </button>
                        <button
                          className={[styles.tab, acc?.tab === 'css' ? styles.active : ''].join(' ')}
                          onClick={() => setTab(gen.id, 'css')}
                        >
                          CSS
                        </button>
                      </div>
                      <pre className={styles.codeBlock}>
                        <code>{(!acc?.tab || acc.tab === 'html') ? html : css}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <div className={styles.footer}>
            {!submitted ? (
              <button className={styles.submitBtn} disabled={!allRated} onClick={handleSubmit}>
                Submit Ratings
              </button>
            ) : (
              <button className={styles.resetBtn} onClick={onReset}>
                Try another screenshot
              </button>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <Modal
          type={modal.type}
          src={modal.src}
          label={modal.label}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
