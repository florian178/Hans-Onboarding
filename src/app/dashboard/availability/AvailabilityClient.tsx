"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import styles from "./availability.module.css"

export default function AvailabilityClient({ requests }: { requests: any[] }) {
  // Store responses locally: { [dayId]: { status, comment } }
  const [responses, setResponses] = useState<Record<string, { status: "YES" | "NO" | "MAYBE", comment: string }>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Wait, we need to load existing responses from the API
  useEffect(() => {
    async function loadResponses() {
      // For simplicity, we fetch all responses for the user for the PUBLISHED requests
      // In a real optimized app, you'd fetch per request, but here we just fetch one by one
      for (const req of requests) {
        try {
          const res = await fetch(`/api/planning/responses?requestId=${req.id}`)
          if (res.ok) {
            const data = await res.json()
            setResponses(prev => {
              const next = { ...prev }
              data.forEach((r: any) => {
                next[r.dayId] = { status: r.status, comment: r.comment || "" }
              })
              return next
            })
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
    loadResponses()
  }, [requests])

  const handleSelect = (dayId: string, status: "YES" | "NO" | "MAYBE") => {
    setResponses(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], status, comment: prev[dayId]?.comment || "" }
    }))
    setHasChanges(true)
  }

  const handleCommentChange = (dayId: string, comment: string) => {
    setResponses(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], status: prev[dayId]?.status || "MAYBE", comment }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // Format payload
    const payload = Object.keys(responses).map(dayId => ({
      dayId,
      status: responses[dayId].status,
      comment: responses[dayId].comment
    }))

    try {
      const res = await fetch("/api/planning/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: payload })
      })

      if (res.ok) {
        alert("Deine Verfügbarkeiten wurden gespeichert!")
        setHasChanges(false)
      } else {
        alert("Fehler beim Speichern. Bitte lade die Seite neu.")
      }
    } catch (e) {
      alert("Ein Netzwerkfehler ist aufgetreten.")
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <>
      {requests.map(req => (
        <div key={req.id} className={styles.requestSection}>
          <h2 className={styles.requestTitle}>{req.title}</h2>
          
          {req.days.map((day: any) => {
            const currentResp = responses[day.id]
            
            return (
              <div key={day.id} className={styles.dayCard}>
                <div className={styles.dayHeader}>
                  <span className={styles.dayDate}>{formatDate(day.date)}</span>
                  {day.eventName && <span className={styles.dayEvent}>{day.eventName}</span>}
                  {day.note && <span className={styles.dayNote}>Info: {day.note}</span>}
                </div>
                
                <div className={styles.buttonGroup}>
                  <button 
                    className={`${styles.selectBtn} ${styles.yes} ${currentResp?.status === 'YES' ? styles.selected : ''}`}
                    onClick={() => handleSelect(day.id, 'YES')}
                  >
                    Ja, ich kann
                  </button>
                  <button 
                    className={`${styles.selectBtn} ${styles.maybe} ${currentResp?.status === 'MAYBE' ? styles.selected : ''}`}
                    onClick={() => handleSelect(day.id, 'MAYBE')}
                  >
                    Vielleicht
                  </button>
                  <button 
                    className={`${styles.selectBtn} ${styles.no} ${currentResp?.status === 'NO' ? styles.selected : ''}`}
                    onClick={() => handleSelect(day.id, 'NO')}
                  >
                    Nein, keine Zeit
                  </button>
                </div>
                
                <input 
                  type="text" 
                  placeholder="Kommentar (optional, z.B. nur bis 02:00 Uhr)"
                  className={styles.commentInput}
                  value={currentResp?.comment || ""}
                  onChange={(e) => handleCommentChange(day.id, e.target.value)}
                />
              </div>
            )
          })}
        </div>
      ))}
      
      {hasChanges && (
        <div className={styles.saveArea}>
          <Button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Speichere..." : "Änderungen speichern"}
          </Button>
        </div>
      )}
    </>
  )
}
