"use client"

import { useState, FormEvent, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import styles from "./timesheet.module.css"
import { TimesheetEntry } from "@/types/timesheet"
import { calculateTotalHours, validateTimesheet } from "@/lib/timesheet-utils"

interface Props {
  onSuccess: () => void
}

export default function TimesheetForm({ onSuccess }: Props) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [breakMinutes, setBreakMinutes] = useState(0)
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalHours = calculateTotalHours(startTime, endTime, breakMinutes)
  const warnings = validateTimesheet(totalHours, breakMinutes)

  const handleSubmit = async (e: FormEvent, status: "DRAFT" | "SUBMITTED") => {
    e.preventDefault()
    if (!startTime || !endTime) {
      setError("Start- und Endzeit sind erforderlich.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          startTime,
          endTime,
          breakMinutes,
          totalHours,
          note,
          status,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Fehler beim Speichern")
      }

      // Reset form
      setStartTime("")
      setEndTime("")
      setBreakMinutes(0)
      setNote("")
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.formCard}>
      <h3 className={styles.formTitle}>Neuer Zeiteintrag</h3>
      <form className={styles.formContainer}>
        <div className={styles.formGroup}>
          <label>Datum</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Beginn</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label>Ende</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Pause (Minuten)</label>
          <input 
            type="number" 
            min="0" 
            value={breakMinutes} 
            onChange={e => setBreakMinutes(parseInt(e.target.value) || 0)} 
          />
        </div>

        <div className={styles.formGroup}>
          <label>Notiz (Optional)</label>
          <input 
            type="text" 
            placeholder="Besondere Vorkommnisse..." 
            value={note} 
            onChange={e => setNote(e.target.value)} 
          />
        </div>

        <div className={styles.summaryBox}>
          <strong>Gesamtzeit: {totalHours} Stunden</strong>
        </div>

        {warnings.map((warn, i) => (
          <div key={i} className={styles.warningBox}>⚠️ {warn}</div>
        ))}
        {error && <div className={styles.errorBox}>❌ {error}</div>}

        <div className={styles.actionButtons}>
          <Button 
            variant="outline" 
            onClick={(e) => handleSubmit(e, "DRAFT")}
            disabled={loading || totalHours <= 0}
          >
            Als Entwurf speichern
          </Button>
          <Button 
            onClick={(e) => handleSubmit(e, "SUBMITTED")}
            disabled={loading || totalHours <= 0}
          >
            Direkt einreichen
          </Button>
        </div>
      </form>
    </div>
  )
}
