'use client'

import { useEffect } from 'react'
import styles from './Modal.module.css'

interface ModalProps {
  type: 'image' | 'iframe'
  src: string
  label: string
  onClose: () => void
}

export default function Modal({ type, src, label, onClose }: ModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <p className={styles.label}>{label}</p>
        {type === 'image' ? (
          <img src={src} alt={label} className={styles.image} />
        ) : (
          <iframe
            srcDoc={src}
            sandbox="allow-same-origin"
            className={styles.iframe}
            title={label}
          />
        )}
      </div>
    </div>
  )
}
