"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import styles from "./admin-timesheet.module.css"

interface UserInfo {
  id: string
  name: string | null
  email: string | null
}

interface AdminTimesheet {
  id: string
  userId: string
  date: string
  startTime: string
  endTime: string
  breakMinutes: number
  totalHours: number
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
  note: string | null
  hourlyWage: number | null
  approvedBy: string | null
  createdAt: string
  user: {
    name: string | null
    email: string | null
  } | null
}

interface Props {
  timesheets: AdminTimesheet[]
  users: UserInfo[]
}

const STATUS_MAP = {
  DRAFT: { label: "Entwurf", bg: "#f5f5f7", color: "#86868b" },
  SUBMITTED: { label: "Eingereicht", bg: "#e8f0fe", color: "#0071e3" },
  APPROVED: { label: "Genehmigt", bg: "rgba(40, 167, 69, 0.1)", color: "#28a745" },
  REJECTED: { label: "Abgelehnt", bg: "rgba(217, 48, 37, 0.1)", color: "#d93025" },
}

export default function TimesheetAdminClient({ timesheets: initialTimesheets, users }: Props) {
  const [timesheets, setTimesheets] = useState<AdminTimesheet[]>(initialTimesheets)
  
  // Filters
  const [filterUser, setFilterUser] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterMonth, setFilterMonth] = useState("")

  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/timesheets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        const updated = await res.json()
        setTimesheets(prev => prev.map(t => t.id === id ? { ...t, status: updated.status, approvedBy: updated.approvedBy } : t))
      } else {
        alert("Fehler beim Aktualisieren des Status")
      }
    } finally {
      setLoadingId(null)
    }
  }

  const exportCSV = () => {
    const header = [
      "ID", "Mitarbeiter", "Datum", "Start", "Ende", "Pause (Min)", 
      "Gesamtstunden", "Stundenlohn", "Gesamtlohn", "Status", "Notiz"
    ].join(";")
    
    const rows = filteredTimesheets.map(t => {
      const wage = t.hourlyWage || 13.90
      const totalWage = (t.totalHours * wage).toFixed(2).replace('.', ',')
      const name = t.user?.name || t.user?.email || "Unbekannt"
      const note = t.note ? `"${t.note.replace(/"/g, '""')}"` : ""
      
      return [
        t.id, 
        `"${name}"`, 
        t.date, 
        t.startTime, 
        t.endTime, 
        t.breakMinutes, 
        t.totalHours.toString().replace('.', ','), 
        wage.toFixed(2).replace('.', ','), 
        totalWage, 
        STATUS_MAP[t.status].label, 
        note
      ].join(";")
    })
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [header, ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `zeiterfassung_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Derived filtered data
  const filteredTimesheets = timesheets.filter(t => {
    if (filterUser && t.userId !== filterUser) return false
    if (filterStatus && t.status !== filterStatus) return false
    if (filterMonth && !t.date.startsWith(filterMonth)) return false
    return true
  })

  const totalHours = filteredTimesheets.reduce((acc, t) => acc + t.totalHours, 0)
  const totalWage = filteredTimesheets.reduce((acc, t) => acc + (t.totalHours * (t.hourlyWage || 13.90)), 0)

  // Generate exact months that are available in the data
  const months = Array.from(new Set(timesheets.map(t => t.date.substring(0, 7)))).sort().reverse()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Zeiterfassung - Verwaltung</h2>
          <p className={styles.subtitle}>Prüfe, verwalte und exportiere Arbeitszeiten.</p>
        </div>
        <Button onClick={exportCSV}>CSV Export</Button>
      </div>

      <div className={styles.filters}>
        <select 
          className={styles.filterSelect} 
          value={filterUser} 
          onChange={e => setFilterUser(e.target.value)}
        >
          <option value="">Alle Mitarbeiter</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name || u.email}</option>
          ))}
        </select>

        <select 
          className={styles.filterSelect} 
          value={filterMonth} 
          onChange={e => setFilterMonth(e.target.value)}
        >
          <option value="">Alle Monate</option>
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select 
          className={styles.filterSelect} 
          value={filterStatus} 
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Alle Status</option>
          <option value="DRAFT">Entwurf</option>
          <option value="SUBMITTED">Eingereicht</option>
          <option value="APPROVED">Genehmigt</option>
          <option value="REJECTED">Abgelehnt</option>
        </select>
      </div>

      <div className={styles.stats}>
        <div className={styles.statsItem}>
          <span className={styles.statsLabel}>Angezeigte Stunden</span>
          <span className={styles.statsValue}>{totalHours.toFixed(2)}h</span>
        </div>
        <div className={styles.statsItem}>
          <span className={styles.statsLabel}>Geschätzte Kosten</span>
          <span className={styles.statsValue}>{totalWage.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        <div className={styles.statsItem}>
          <span className={styles.statsLabel}>Einträge</span>
          <span className={styles.statsValue}>{filteredTimesheets.length}</span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mitarbeiter</th>
              <th>Datum</th>
              <th>Zeit / Pause</th>
              <th>Stunden</th>
              <th>Notiz</th>
              <th>Status</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {filteredTimesheets.map(t => (
              <tr key={t.id}>
                <td>{t.user?.name || t.user?.email || "Unbekannt"}</td>
                <td>{new Date(t.date).toLocaleDateString("de-DE")}</td>
                <td>{t.startTime} - {t.endTime} ({t.breakMinutes} Min)</td>
                <td><strong>{t.totalHours}</strong></td>
                <td><span style={{ fontSize: '0.8rem', color: '#666' }}>{t.note || "-"}</span></td>
                <td>
                  <span 
                    className={styles.statusBadge} 
                    style={{ backgroundColor: STATUS_MAP[t.status].bg, color: STATUS_MAP[t.status].color }}
                  >
                    {STATUS_MAP[t.status].label}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    {t.status === "SUBMITTED" && (
                      <>
                        <button 
                          className={styles.btnApprove} 
                          onClick={() => handleStatusChange(t.id, "APPROVED")}
                          disabled={loadingId === t.id}
                        >✓</button>
                        <button 
                          className={styles.btnReject} 
                          onClick={() => handleStatusChange(t.id, "REJECTED")}
                          disabled={loadingId === t.id}
                        >✗</button>
                      </>
                    )}
                    {t.status === "APPROVED" && (
                       <button 
                         className={styles.btnReject} 
                         onClick={() => handleStatusChange(t.id, "REJECTED")}
                         disabled={loadingId === t.id}
                       >Revoc.</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredTimesheets.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#86868b" }}>
                  Keine Ergebnisse für diese Filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
