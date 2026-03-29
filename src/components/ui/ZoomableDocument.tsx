"use client"

import React, { useState, useRef, useEffect } from "react"
import styles from "./ZoomableDocument.module.css"

interface ZoomableDocumentProps {
  children: React.ReactNode
  id?: string
  className?: string
}

export function ZoomableDocument({ children, id, className }: ZoomableDocumentProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const calculateScale = () => {
      if (innerRef.current && containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const docWidth = 794 // A4 target width
        if (containerWidth < docWidth) {
          setScale(containerWidth / docWidth)
        } else {
          setScale(1)
        }
      }
    }

    calculateScale()
    window.addEventListener("resize", calculateScale)
    return () => window.removeEventListener("resize", calculateScale)
  }, [])

  // Lock body scroll when zoomed
  useEffect(() => {
    if (isZoomed) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isZoomed])

  return (
    <>
      {/* Miniatur-Vorschau */}
      <div
        ref={containerRef}
        className={`${styles.previewContainer} ${className || ''}`}
        onClick={() => scale < 1 && setIsZoomed(true)}
        style={{ cursor: scale < 1 ? 'pointer' : 'default' }}
        id={id}
      >
        <div
          ref={innerRef}
          className={styles.scaledInner}
          style={{
            transform: scale < 1 ? `scale(${scale})` : 'none',
            transformOrigin: 'top left',
            width: scale < 1 ? '794px' : '100%',
          }}
        >
          {children}
        </div>
        {/* Platzhalter für korrekte Container-Höhe */}
        {scale < 1 && innerRef.current && (
          <div style={{ height: (innerRef.current.scrollHeight * scale) + 'px' }} />
        )}

        {/* Tap-Hinweis auf Mobile */}
        {scale < 1 && (
          <div className={styles.tapHint}>
            <span>🔍</span> Zum Vergrößern antippen
          </div>
        )}
      </div>

      {/* Fullscreen Overlay */}
      {isZoomed && (
        <div className={styles.overlay} onClick={() => setIsZoomed(false)}>
          <div className={styles.overlayHeader}>
            <button className={styles.closeBtn} onClick={() => setIsZoomed(false)}>
              ✕ Schließen
            </button>
          </div>
          <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.overlayDocument}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
