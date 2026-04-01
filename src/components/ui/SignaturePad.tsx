"use client"

import React, { useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"
import { Button } from "./Button"
import styles from "./SignaturePad.module.css"

interface SignaturePadProps {
  onSign: (dataUrl: string) => void
}

export function SignaturePad({ onSign }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const clear = () => {
    sigCanvas.current?.clear()
    setIsEmpty(true)
  }

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      return
    }
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png")
    if (dataUrl) {
      onSign(dataUrl)
    }
  }

  const handleBegin = () => {
    setIsEmpty(false)
  }

  // Effect to handle canvas resizing so that internal resolution matches CSS resolution.
  React.useEffect(() => {
    const canvas = sigCanvas.current?.getCanvas()
    const wrapper = canvas?.parentElement
    if (!canvas || !wrapper) return

    let prevWidth = 0
    let prevHeight = 0

    const handleResize = () => {
      if (wrapper.offsetWidth > 0) {
        if (wrapper.offsetWidth === prevWidth && wrapper.offsetHeight === prevHeight) return
        prevWidth = wrapper.offsetWidth
        prevHeight = wrapper.offsetHeight

        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        canvas.width = wrapper.offsetWidth * ratio
        canvas.height = wrapper.offsetHeight * ratio
        canvas.getContext("2d")?.scale(ratio, ratio)
        sigCanvas.current?.clear() // Clear to avoid scaling issues on existing drawing
      }
    }

    const observer = new ResizeObserver(() => {
      handleResize()
    })
    
    observer.observe(wrapper)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.canvasWrapper}>
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{ className: styles.sigCanvas }}
          onBegin={handleBegin}
        />
      </div>
      <div className={styles.actions}>
        <Button type="button" variant="outline" onClick={clear}>Löschen</Button>
        <Button type="button" onClick={save} disabled={isEmpty}>Unterschrift bestätigen</Button>
      </div>
    </div>
  )
}
