'use client'

import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import styles from './UploadZone.module.css'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_SIZE = 10 * 1024 * 1024

type Props = {
  onSubmit: (base64DataUri: string) => void
  disabled?: boolean
}

export default function UploadZone({ onSubmit, disabled }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function validate(file: File): string | null {
    if (!ALLOWED_TYPES.has(file.type)) return 'Only PNG, JPEG, and WebP files are supported.'
    if (file.size > MAX_SIZE) return 'File must be under 10MB.'
    return null
  }

  function processFile(file: File) {
    const err = validate(file)
    if (err) {
      setError(err)
      setPreview(null)
      return
    }
    setError(null)
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 800 / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      setPreview(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = objectUrl
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(true)
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={[styles.zone, dragging && styles.dragging, disabled && styles.disabled]
          .filter(Boolean)
          .join(' ')}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className={styles.hiddenInput}
          onChange={onFileChange}
          disabled={disabled}
        />
        {preview ? (
          <img src={preview} alt="Preview" className={styles.preview} />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.icon}>↑</span>
            <p className={styles.label}>Drop a UI screenshot here, or click to browse</p>
            <p className={styles.hint}>PNG, JPEG, or WebP · max 10MB</p>
          </div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {preview && !disabled && (
        <button className={styles.button} onClick={() => onSubmit(preview)}>
          Generate UI Implementations →
        </button>
      )}
    </div>
  )
}
