"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/Button"
import styles from "./page.module.css"

export function VideoPlayer({ 
  videoUrl, 
  isAlreadyCompleted, 
  onComplete 
}: { 
  videoUrl: string, 
  isAlreadyCompleted: boolean, 
  onComplete: () => void 
}) {
  const [hasEnded, setHasEnded] = useState(isAlreadyCompleted)
  
  return (
    <div className={styles.playerContainer}>
      <div className={styles.videoWrapper}>
        <video 
          controls 
          className={styles.video}
          onEnded={() => setHasEnded(true)}
        >
          <source src={videoUrl} type="video/mp4" />
          Dein Browser unterstützt das Video-Tag leider nicht.
        </video>
      </div>

      <div className={styles.actions}>
        <form action={onComplete}>
          <Button type="submit" disabled={!hasEnded}>
            {hasEnded ? "Onboarding Abschließen" : "Bitte Video vollständig ansehen..."}
          </Button>
        </form>
      </div>
    </div>
  )
}
