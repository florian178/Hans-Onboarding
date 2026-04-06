"use client"
import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import styles from "./planning.module.css"

export default function RequestsClient({ requests, onRefresh }: { requests: any[], onRefresh: () => void }) {
  const [isCreating, setIsCreating] = useState(false)
  
  // Form State
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  // Days State
  const [days, setDays] = useState<{ date: string; eventName: string; note: string }[]>([])
  
  // New Day Input State
  const [newDayDate, setNewDayDate] = useState("")
  const [newDayEvent, setNewDayEvent] = useState("")
  const [newDayNote, setNewDayNote] = useState("")

  const [isLoading, setIsLoading] = useState(false)

  const handleAddDay = () => {
    if (!newDayDate) return
    setDays([...days, { date: newDayDate, eventName: newDayEvent, note: newDayNote }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    setNewDayDate("")
    setNewDayEvent("")
    setNewDayNote("")
  }

  const handleRemoveDay = (dateStr: string) => {
    setDays(days.filter(d => d.date !== dateStr))
  }

  const handleCreate = async () => {
    if (!title || !startDate || !endDate || days.length === 0) {
      alert("Bitte fülle alle Pflichtfelder aus und füge mindestens einen Tag hinzu.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/planning/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, startDate, endDate, days })
      })

      if (res.ok) {
        setIsCreating(false)
        setTitle("")
        setStartDate("")
        setEndDate("")
        setDays([])
        onRefresh()
      } else {
        alert("Fehler beim Speichern")
      }
    } catch (e) {
      alert("Ein Fehler ist aufgetreten.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (newStatus === "CLOSED" && !confirm("Abfrage wirklich schließen? Mitarbeiter können dann keine Antworten mehr geben.")) return

    try {
      await fetch(`/api/planning/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      onRefresh()
    } catch (e) {
      alert("Fehler beim Ändern des Status.")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Abfrage wirklich löschen? Alle Antworten der Mitarbeiter werden unwiderruflich gelöscht!")) return
    
    try {
      await fetch(`/api/planning/requests/${id}`, { method: "DELETE" })
      onRefresh()
    } catch(e) {
      alert("Fehler beim Löschen")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div>
      <div className={styles.actionHeader}>
        <h2>Verfügbarkeitsabfragen</h2>
        {!isCreating && <Button onClick={() => setIsCreating(true)}>+ Neue Abfrage</Button>}
      </div>

      {isCreating && (
        <div className={styles.formCard}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3>Neue Abfrage erstellen</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div className={styles.formGrid}>
              <Input label="Titel (z.B. April 2026)" value={title} onChange={e => setTitle(e.target.value)} required />
              <div />
              <Input label="Sichtbar für welchen Zeitraum? Start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
              <Input label="Ende" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
              
              <div className={styles.dayBuilder}>
                <h4 style={{ marginBottom: '1rem' }}>Tage hinzufügen</h4>
                <div className={styles.dayControls}>
                  <div style={{flex: 1}}><Input label="Datum" type="date" value={newDayDate} onChange={e => setNewDayDate(e.target.value)} /></div>
                  <div style={{flex: 1}}><Input label="Event (optional)" placeholder="z.B. 90/00er Party" value={newDayEvent} onChange={e => setNewDayEvent(e.target.value)} /></div>
                  <div style={{flex: 1}}><Input label="Notiz (optional)" placeholder="Extra Personal benötigt" value={newDayNote} onChange={e => setNewDayNote(e.target.value)} /></div>
                  <Button type="button" variant="outline" onClick={handleAddDay}>Hinzufügen</Button>
                </div>
                
                <div className={styles.dayList}>
                  {days.length === 0 && <p style={{ fontSize: '0.9rem', color: '#86868b' }}>Noch keine Tage hinzugefügt.</p>}
                  {days.map((d) => (
                    <div key={d.date} className={styles.dayItemLine}>
                      <span><strong>{formatDate(d.date)}</strong> {d.eventName && `– ${d.eventName}`} {d.note && `(${d.note})`}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDay(d.date)}>X</Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.formActions}>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Abbrechen</Button>
              <Button onClick={handleCreate} disabled={isLoading}>{isLoading ? 'Speichert...' : 'Entwurf erstellen'}</Button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.requestsList}>
        {requests.length === 0 && !isCreating && (
          <p style={{ color: '#86868b' }}>Noch keine Abfragen erstellt.</p>
        )}

        {requests.map(req => (
          <Card key={req.id} className={styles.requestCard}>
            <CardContent className={styles.cardContentPadded}>
              <div className={styles.requestHeader}>
                <div>
                  <h3 style={{ margin: 0 }}>{req.title}</h3>
                  <div className={styles.requestMeta}>
                    Zeitraum: {new Date(req.startDate).toLocaleDateString('de-DE')} - {new Date(req.endDate).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span className={`${styles.statusBadge} ${styles[`status${req.status}`]}`}>
                    {req.status === 'DRAFT' ? 'Entwurf' : req.status === 'PUBLISHED' ? 'Veröffentlicht' : 'Geschlossen'}
                  </span>
                  
                  {req.status === 'DRAFT' && (
                    <Button size="sm" onClick={() => handleStatusChange(req.id, 'PUBLISHED')}>Veröffentlichen</Button>
                  )}
                  {req.status === 'PUBLISHED' && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(req.id, 'CLOSED')}>Schließen</Button>
                  )}
                  
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(req.id)}>Löschen</Button>
                </div>
              </div>
              
              <div className={styles.daysGrid}>
                {req.days.map((d: any) => (
                  <div key={d.id} className={styles.dayCard}>
                    <div className={styles.dayDate}>{formatDate(d.date)}</div>
                    {d.eventName && <div className={styles.dayEvent}>{d.eventName}</div>}
                    {d.note && <div className={styles.dayNote}>{d.note}</div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
