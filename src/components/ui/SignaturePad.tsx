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
    const handleResize = () => {
      const canvas = sigCanvas.current?.getCanvas()
      if (canvas) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        canvas.width = canvas.offsetWidth * ratio
        canvas.height = canvas.offsetHeight * ratio
        canvas.getContext("2d")?.scale(ratio, ratio)
        sigCanvas.current?.clear() // Clear to avoid scaling issues on existing drawing
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
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
