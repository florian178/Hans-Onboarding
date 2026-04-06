"use client"
import { useState, useEffect } from "react"
import styles from "./benefits.module.css"

interface Props {
  firstName: string
  lastName: string
  birthDate: string | null
}

export default function MemberCard({ firstName, lastName, birthDate }: Props) {
  const [timeStr, setTimeStr] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      // Format: DD.MM.YYYY - HH:MM:SS
      const d = String(now.getDate()).padStart(2, '0')
      const mo = String(now.getMonth() + 1).padStart(2, '0')
      const y = now.getFullYear()
      const h = String(now.getHours()).padStart(2, '0')
      const mi = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      
      setTimeStr(`${d}.${mo}.${y} – ${h}:${mi}:${s}`)
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  let formattedBirthDate = '-'
  if (birthDate) {
    try {
      formattedBirthDate = new Date(birthDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {}
  }

  return (
    <div className={styles.memberCardWrapper}>
      <div className={styles.memberCard}>
        <div className={styles.cardHeader}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" className={styles.cardLogo} />
          <span className={styles.cardType}>MEMBER</span>
        </div>
        
        <div className={styles.cardBody}>
          <div className={styles.cardName}>
            {firstName} {lastName}
          </div>
          <div className={styles.cardDetails}>
            Geburtsdatum: {formattedBirthDate}
          </div>
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.liveIndicator}>
            <span className={styles.dot}></span> LIVE VERIFIKATION
          </div>
          <div className={styles.timestamp}>
            {timeStr}
          </div>
        </div>
      </div>
    </div>
  )
}
