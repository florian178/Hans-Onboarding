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
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    const calculateScale = () => {
      if (innerRef.current && containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const docWidth = 794 // A4 target width
        if (containerWidth < docWidth && containerWidth > 0) {
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

  // Use ResizeObserver to track the actual unscaled height of the inner content
  useEffect(() => {
    if (!innerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentHeight(entry.target.scrollHeight)
      }
    })
    resizeObserver.observe(innerRef.current)
    return () => resizeObserver.disconnect()
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
      >
        <div
          ref={innerRef}
          id={id}
          className={`${styles.scaledInner} ${scale < 1 ? styles.isScaled : ''}`}
          style={{
            transform: scale < 1 ? `scale(${scale})` : 'none',
            transformOrigin: 'top left',
            width: scale < 1 ? '794px' : '100%',
          }}
        >
          {children}
        </div>
        
        {/* Platzhalter für exakte Container-Höhe bei absolute positioning */}
        {scale < 1 && contentHeight > 0 && (
          <div style={{ height: (contentHeight * scale) + 'px', width: '100%' }} />
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
