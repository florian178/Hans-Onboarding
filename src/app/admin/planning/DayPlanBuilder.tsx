"use client"
import React, { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/Button"
import styles from "./planning.module.css"

/* ─── Types ─── */
interface PlanRow {
  id: string
  assignmentLabel: string
  employeeId: string | null
  employeeName: string | null
  startTime: string
  endTime: string
  note: string
}

interface AvailInfo {
  employeeId: string
  name: string
  status: string // YES, NO, MAYBE
  comment: string
}

interface Template {
  id: string
  name: string
  rows: { assignmentLabel: string; defaultStartTime: string | null }[]
}

/* ─── Default row presets ─── */
const DEFAULT_ROWS = [
  "Beton Bar (Bar-Chef)",
  "Bar",
  "Bar",
  "Wald Bar (Bar-Chef)",
  "Bar",
  "Einlass",
  "Garderobe",
  "CvD",
]

let rowIdCounter = 0
function makeRow(label = "", startTime = ""): PlanRow {
  rowIdCounter++
  return { id: `_new_${rowIdCounter}_${Date.now()}`, assignmentLabel: label, employeeId: null, employeeName: null, startTime, endTime: "", note: "" }
}

/* ─── Employee Picker Popover ─── */
function EmployeePicker({ avails, onSelect, onClose, anchorRect }: {
  avails: AvailInfo[]
  onSelect: (empId: string, empName: string) => void
  onClose: () => void
  anchorRect: DOMRect | null
}) {
  const [search, setSearch] = useState("")
  const [showNo, setShowNo] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  const q = search.toLowerCase()
  const filtered = avails.filter(a => a.name.toLowerCase().includes(q))
  const yes = filtered.filter(a => a.status === "YES")
  const maybe = filtered.filter(a => a.status === "MAYBE")
  const no = filtered.filter(a => a.status === "NO")

  const pickerStyle: React.CSSProperties = {
    position: "fixed",
    top: anchorRect ? anchorRect.bottom + 4 : "50%",
    left: anchorRect ? Math.min(anchorRect.left, window.innerWidth - 320) : "50%",
    zIndex: 9999,
  }

  return (
    <div ref={ref} className={styles.picker} style={pickerStyle}>
      <input
        type="text"
        placeholder="Mitarbeiter suchen…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={styles.pickerSearch}
        autoFocus
      />
      {yes.length > 0 && (
        <div className={styles.pickerGroup}>
          <div className={styles.pickerGroupLabel}>✅ Verfügbar ({yes.length})</div>
          {yes.map(a => (
            <button key={a.employeeId} className={styles.pickerItem} onClick={() => onSelect(a.employeeId, a.name)}>
              <span className={styles.pickerName}>{a.name}</span>
              {a.comment && <span className={styles.pickerComment}>{a.comment}</span>}
            </button>
          ))}
        </div>
      )}
      {maybe.length > 0 && (
        <div className={styles.pickerGroup}>
          <div className={styles.pickerGroupLabel}>⚠️ Vielleicht ({maybe.length})</div>
          {maybe.map(a => (
            <button key={a.employeeId} className={styles.pickerItem} onClick={() => onSelect(a.employeeId, a.name)}>
              <span className={styles.pickerName}>{a.name}</span>
              {a.comment && <span className={styles.pickerComment}>{a.comment}</span>}
            </button>
          ))}
        </div>
      )}
      {no.length > 0 && (
        <div className={styles.pickerGroup}>
          <button className={styles.pickerToggle} onClick={() => setShowNo(!showNo)}>
            {showNo ? "▾" : "▸"} Nicht verfügbar ({no.length})
          </button>
          {showNo && no.map(a => (
            <button key={a.employeeId} className={`${styles.pickerItem} ${styles.pickerItemNo}`} onClick={() => onSelect(a.employeeId, a.name)}>
              <span className={styles.pickerName}>{a.name}</span>
              {a.comment && <span className={styles.pickerComment}>{a.comment}</span>}
            </button>
          ))}
        </div>
      )}
      {filtered.length === 0 && <div className={styles.pickerEmpty}>Keine Mitarbeiter gefunden</div>}
      <button className={styles.pickerClear} onClick={() => onSelect("", "")}>✕ Zuweisung entfernen</button>
    </div>
  )
}

/* ─── Main Component ─── */
export default function DayPlanBuilder({ requests }: { requests: any[] }) {
  const [selectedRequestId, setSelectedRequestId] = useState("")
  const [selectedDayId, setSelectedDayId] = useState("")
  const [rows, setRows] = useState<PlanRow[]>([])
  const [planStatus, setPlanStatus] = useState("DRAFT")
  const [dayNote, setDayNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [avails, setAvails] = useState<AvailInfo[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [pickerRowId, setPickerRowId] = useState<string | null>(null)
  const [pickerRect, setPickerRect] = useState<DOMRect | null>(null)
  const [showMultiDay, setShowMultiDay] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [showTemplateSave, setShowTemplateSave] = useState(false)

  // Load templates once
  useEffect(() => {
    fetch("/api/planning/templates").then(r => r.json()).then(setTemplates).catch(() => {})
  }, [])

  // Auto-select first request
  useEffect(() => {
    if (requests.length > 0 && !selectedRequestId) setSelectedRequestId(requests[0].id)
  }, [requests, selectedRequestId])

  // Auto-select first day
  useEffect(() => {
    if (!selectedRequestId) return
    const req = requests.find(r => r.id === selectedRequestId)
    if (req && req.days.length > 0 && !req.days.find((d: any) => d.id === selectedDayId)) {
      setSelectedDayId(req.days[0].id)
    }
  }, [selectedRequestId, requests, selectedDayId])

  // Load plan + availability when day changes
  useEffect(() => {
    if (!selectedDayId || !selectedRequestId) return
    loadDayData()
  }, [selectedDayId, selectedRequestId])

  const loadDayData = async () => {
    try {
      const [planRes, availRes] = await Promise.all([
        fetch(`/api/planning/admin/shifts?dayId=${selectedDayId}`),
        fetch(`/api/planning/admin/responses?requestId=${selectedRequestId}`)
      ])
      const plan = await planRes.json()
      const allResponses = await availRes.json()

      // Build availability for this day
      const dayResponses = allResponses.filter((r: any) => r.dayId === selectedDayId)
      setAvails(dayResponses.map((r: any) => ({
        employeeId: r.employeeId,
        name: r.user?.name || r.employeeId,
        status: r.status,
        comment: r.comment || "",
      })))

      if (plan && plan.rows && plan.rows.length > 0) {
        setPlanStatus(plan.status || "DRAFT")
        setDayNote(plan.note || "")
        setRows(plan.rows.map((r: any) => ({
          id: r.id,
          assignmentLabel: r.assignmentLabel,
          employeeId: r.employeeId,
          employeeName: r.user?.name || null,
          startTime: r.startTime || "",
          endTime: r.endTime || "",
          note: r.note || "",
        })))
      } else {
        setPlanStatus("DRAFT")
        setDayNote("")
        // Start with default rows
        setRows(DEFAULT_ROWS.map(label => makeRow(label)))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const currentRequest = requests.find(r => r.id === selectedRequestId)
  const activeDayObj = currentRequest?.days.find((d: any) => d.id === selectedDayId)

  /* ─── Row manipulation ─── */
  const updateRow = useCallback((rowId: string, field: keyof PlanRow, value: string) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r))
  }, [])

  const addRow = (afterIndex: number) => {
    setRows(prev => {
      const next = [...prev]
      next.splice(afterIndex + 1, 0, makeRow())
      return next
    })
  }

  const removeRow = (rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId))
  }

  const moveRow = (index: number, direction: -1 | 1) => {
    setRows(prev => {
      const next = [...prev]
      const newIdx = index + direction
      if (newIdx < 0 || newIdx >= next.length) return prev
      ;[next[index], next[newIdx]] = [next[newIdx], next[index]]
      return next
    })
  }

  /* ─── Template ─── */
  const applyTemplate = (templateId: string) => {
    const tpl = templates.find(t => t.id === templateId)
    if (!tpl) return
    setRows(tpl.rows.map(r => makeRow(r.assignmentLabel, r.defaultStartTime || "")))
  }

  const saveAsTemplate = async () => {
    if (!templateName.trim()) return
    try {
      const res = await fetch("/api/planning/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          rows: rows.map(r => ({ assignmentLabel: r.assignmentLabel, defaultStartTime: r.startTime || null }))
        })
      })
      if (res.ok) {
        const newTpl = await res.json()
        setTemplates(prev => [...prev, newTpl])
        setTemplateName("")
        setShowTemplateSave(false)
      }
    } catch (e) { console.error(e) }
  }

  const deleteTemplate = async (id: string) => {
    await fetch(`/api/planning/templates/${id}`, { method: "DELETE" })
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  /* ─── Save plan ─── */
  const handleSave = async (status: string) => {
    if (!selectedDayId || !activeDayObj) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/planning/admin/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId: selectedDayId,
          date: activeDayObj.date,
          eventName: activeDayObj.eventName,
          note: dayNote,
          status,
          rows: rows.map((r, i) => ({
            assignmentLabel: r.assignmentLabel,
            employeeId: r.employeeId || null,
            startTime: r.startTime || null,
            endTime: r.endTime || null,
            note: r.note || null,
          }))
        })
      })
      if (res.ok) {
        setPlanStatus(status)
      }
    } catch (e) { console.error(e) }
    finally { setIsSaving(false) }
  }

  /* ─── CSV Export ─── */
  const handleCSV = () => {
    const day = activeDayObj
    let csv = "Einteilung;Mitarbeiter;Beginn;Ende;Notiz\n"
    rows.forEach(r => {
      csv += `${r.assignmentLabel};${r.employeeName || ""};${r.startTime};${r.endTime};${r.note}\n`
    })
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const dateStr = day ? new Date(day.date).toLocaleDateString("de-DE") : "plan"
    link.download = `Einsatzplan_${dateStr}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /* ─── Print ─── */
  const handlePrint = () => window.print()

  const formatDate = (d: string) => new Date(d).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })

  /* ─── Employee picker ─── */
  const openPicker = (rowId: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPickerRowId(rowId)
    setPickerRect(rect)
  }

  const handlePickerSelect = (empId: string, empName: string) => {
    if (pickerRowId) {
      setRows(prev => prev.map(r => r.id === pickerRowId ? { ...r, employeeId: empId || null, employeeName: empName || null } : r))
    }
    setPickerRowId(null)
  }

  const unassignedCount = rows.filter(r => !r.employeeId).length

  return (
    <div className={styles.builderWrapper}>
      {/* ─── Header bar ─── */}
      <div className={styles.builderHeader}>
        <select value={selectedRequestId} onChange={e => setSelectedRequestId(e.target.value)} className={styles.selectInput}>
          <option value="" disabled>Abfrage wählen</option>
          {requests.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>

        {currentRequest && (
          <div className={styles.dayButtons}>
            {currentRequest.days.map((d: any) => (
              <button key={d.id} className={`${styles.dayBtn} ${selectedDayId === d.id ? styles.dayBtnActive : ""}`} onClick={() => setSelectedDayId(d.id)}>
                {new Date(d.date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Template bar ─── */}
      <div className={styles.templateBar}>
        <span className={styles.templateLabel}>Vorlage:</span>
        {templates.map(t => (
          <div key={t.id} className={styles.templateChip}>
            <button className={styles.templateBtn} onClick={() => applyTemplate(t.id)}>{t.name}</button>
            <button className={styles.templateDeleteBtn} onClick={() => deleteTemplate(t.id)} title="Löschen">×</button>
          </div>
        ))}
        {templates.length === 0 && <span className={styles.templateHint}>Noch keine Vorlagen vorhanden</span>}
        <button className={styles.templateSaveToggle} onClick={() => setShowTemplateSave(!showTemplateSave)}>
          + Aktuelle Planung als Vorlage speichern
        </button>
        {showTemplateSave && (
          <div className={styles.templateSaveBar}>
            <input
              type="text"
              placeholder="Vorlagenname…"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              className={styles.templateNameInput}
            />
            <Button onClick={saveAsTemplate} size="sm" disabled={!templateName.trim()}>Speichern</Button>
          </div>
        )}
      </div>

      {/* ─── Day header (print-friendly) ─── */}
      {activeDayObj && (
        <div className={styles.planDayHeader}>
          <div className={styles.planDayTitle}>
            <h2>{formatDate(activeDayObj.date)}</h2>
            {activeDayObj.eventName && <span className={styles.planEventName}>{activeDayObj.eventName}</span>}
            <span className={`${styles.statusBadge} ${planStatus === "FINAL" ? styles.statusFinal : styles.statusDraft}`}>
              {planStatus === "FINAL" ? "✅ Final" : "📝 Entwurf"}
            </span>
          </div>
          <div className={styles.planDayNote}>
            <input
              type="text"
              placeholder="Tagesnotiz (optional)…"
              value={dayNote}
              onChange={e => setDayNote(e.target.value)}
              className={styles.dayNoteInput}
            />
          </div>
          {unassignedCount > 0 && (
            <div className={styles.warningBanner}>
              ⚠️ {unassignedCount} Position{unassignedCount > 1 ? "en" : ""} noch unbesetzt
            </div>
          )}
        </div>
      )}

      {/* ─── Plan Table ─── */}
      <div className={styles.planTableWrap}>
        <table className={styles.planTable}>
          <thead>
            <tr>
              <th className={styles.colNum}>#</th>
              <th className={styles.colLabel}>Einteilung</th>
              <th className={styles.colEmployee}>Mitarbeiter</th>
              <th className={styles.colTime}>Beginn</th>
              <th className={styles.colTime}>Ende</th>
              <th className={styles.colNote}>Notiz</th>
              <th className={`${styles.colActions} ${styles.noPrint}`}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={!row.employeeId ? styles.rowUnassigned : ""}>
                <td className={styles.colNum}>{idx + 1}</td>
                <td className={styles.colLabel}>
                  <input
                    type="text"
                    value={row.assignmentLabel}
                    onChange={e => updateRow(row.id, "assignmentLabel", e.target.value)}
                    className={styles.cellInput}
                    placeholder="z.B. Beton Bar"
                  />
                </td>
                <td className={styles.colEmployee}>
                  <button
                    className={`${styles.employeeCell} ${row.employeeId ? styles.employeeFilled : styles.employeeEmpty}`}
                    onClick={e => openPicker(row.id, e)}
                  >
                    {row.employeeName || "— auswählen —"}
                  </button>
                </td>
                <td className={styles.colTime}>
                  <input type="text" value={row.startTime} onChange={e => updateRow(row.id, "startTime", e.target.value)} className={styles.timeInput} placeholder="HH:MM" />
                </td>
                <td className={styles.colTime}>
                  <input type="text" value={row.endTime} onChange={e => updateRow(row.id, "endTime", e.target.value)} className={styles.timeInput} placeholder="HH:MM" />
                </td>
                <td className={styles.colNote}>
                  <input type="text" value={row.note} onChange={e => updateRow(row.id, "note", e.target.value)} className={styles.cellInput} placeholder="" />
                </td>
                <td className={`${styles.colActions} ${styles.noPrint}`}>
                  <div className={styles.rowActions}>
                    <button onClick={() => moveRow(idx, -1)} disabled={idx === 0} title="Hoch">↑</button>
                    <button onClick={() => moveRow(idx, 1)} disabled={idx === rows.length - 1} title="Runter">↓</button>
                    <button onClick={() => addRow(idx)} title="Zeile einfügen">+</button>
                    <button onClick={() => removeRow(row.id)} title="Zeile löschen" className={styles.deleteRowBtn}>×</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className={`${styles.addRowBtn} ${styles.noPrint}`} onClick={() => addRow(rows.length - 1)}>
          + Zeile hinzufügen
        </button>
      </div>

      {/* ─── Footer actions ─── */}
      <div className={`${styles.builderFooter} ${styles.noPrint}`}>
        <div className={styles.footerLeft}>
          <Button variant="outline" onClick={handleCSV}>CSV Export</Button>
          <Button variant="outline" onClick={handlePrint}>🖨️ Drucken</Button>
        </div>
        <div className={styles.footerRight}>
          <Button variant="outline" onClick={() => handleSave("DRAFT")} disabled={isSaving}>
            {isSaving ? "Speichert…" : "Entwurf speichern"}
          </Button>
          <Button onClick={() => handleSave("FINAL")} disabled={isSaving}>
            Finalisieren
          </Button>
        </div>
      </div>

      {/* ─── Employee picker popover ─── */}
      {pickerRowId && (
        <EmployeePicker
          avails={avails}
          onSelect={handlePickerSelect}
          onClose={() => setPickerRowId(null)}
          anchorRect={pickerRect}
        />
      )}
    </div>
  )
}
