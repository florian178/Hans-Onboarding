"use client"

import { useState, useEffect } from "react"
import { TimesheetEntry } from "@/types/timesheet"
import { Button } from "@/components/ui/Button"
import TimesheetForm from "./TimesheetForm"
import styles from "./timesheet.module.css"

interface Props {
  initialTimesheets: TimesheetEntry[]
}

const STATUS_MAP = {
  DRAFT: { label: "Entwurf", color: "#86868b", bg: "#f5f5f7" },
  SUBMITTED: { label: "Eingereicht", color: "#0071e3", bg: "#e8f0fe" },
  APPROVED: { label: "Genehmigt", color: "#28a745", bg: "rgba(40, 167, 69, 0.1)" },
  REJECTED: { label: "Abgelehnt", color: "#d93025", bg: "rgba(217, 48, 37, 0.1)" },
}

export default function TimesheetClient({ initialTimesheets }: Props) {
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>(initialTimesheets)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchTimesheets = async () => {
    try {
      const res = await fetch("/api/timesheets")
      if (res.ok) {
        const data = await res.json()
        setTimesheets(data)
        setShowForm(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const submitDraft = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/timesheets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SUBMITTED" })
      })
      if (res.ok) {
        await fetchTimesheets()
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteEntry = async (id: string) => {
    if (!confirm("Diesen Eintrag wirklich löschen?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/timesheets/${id}`, { method: "DELETE" })
      if (res.ok) {
        await fetchTimesheets()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Zeiterfassung</h1>
          <p className={styles.subtitle}>Dokumentiere deine Arbeitszeiten</p>
        </div>
        <a href="/dashboard" className={styles.backLink}>← Zurück zum Dashboard</a>
      </header>

      {!showForm ? (
        <div className={styles.listSection}>
          <div className={styles.listHeader}>
            <h3>Deine Einträge</h3>
            <Button onClick={() => setShowForm(true)}>+ Neuer Eintrag</Button>
          </div>

          <div className={styles.list}>
            {timesheets.length === 0 ? (
              <div className={styles.emptyState}>Noch keine Einträge vorhanden.</div>
            ) : (
              timesheets.map((ts) => (
                <div key={ts.id} className={styles.timesheetCard}>
                  <div className={styles.tsMain}>
                    <div className={styles.tsDate}>
                      {new Date(ts.date).toLocaleDateString("de-DE", { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                    <div className={styles.tsTimes}>
                      {ts.startTime} - {ts.endTime} Uhr ({ts.breakMinutes} Min Pause)
                    </div>
                    <div className={styles.tsTotal}>{ts.totalHours} Stunden</div>
                    {ts.note && <div className={styles.tsNote}>Notiz: {ts.note}</div>}
                  </div>
                  
                  <div className={styles.tsSide}>
                    <span 
                      className={styles.statusBadge} 
                      style={{ color: STATUS_MAP[ts.status].color, backgroundColor: STATUS_MAP[ts.status].bg }}
                    >
                      {STATUS_MAP[ts.status].label}
                    </span>
                    
                    {ts.status === "DRAFT" && (
                      <div className={styles.draftActions}>
                        <button onClick={() => submitDraft(ts.id)} disabled={loading} className={styles.textBtn}>Einreichen</button>
                        <button onClick={() => deleteEntry(ts.id)} disabled={loading} className={styles.textBtnDanger}>Löschen</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className={styles.formSection}>
          <TimesheetForm onSuccess={fetchTimesheets} />
          <button className={styles.cancelLink} onClick={() => setShowForm(false)}>
            Abbrechen
          </button>
        </div>
      )}
    </div>
  )
}
