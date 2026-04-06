"use client"
import React, { useState, useEffect } from "react"
import { DndContext, useDraggable, useDroppable, DragOverlay, closestCorners } from "@dnd-kit/core"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import styles from "./planning.module.css"

const AREAS = [
  { id: "POOL", title: "Verfügbare Mitarbeiter" },
  { id: "CVD", title: "CvD" },
  { id: "EINLASS", title: "Einlass" },
  { id: "GARDEROBE", title: "Garderobe" },
  { id: "BETONBAR", title: "Betonbar" },
  { id: "WALDBAR", title: "Waldbar" }
]

function DraggableEmployee({ emp, area }: { emp: any, area: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: emp.id,
    data: { ...emp, sourceArea: area }
  })

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      style={{ 
        padding: "0.8rem", 
        margin: "0.5rem 0", 
        background: "var(--background)", 
        border: "1px solid var(--border)", 
        borderRadius: "8px",
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        borderLeft: emp.availability === 'YES' ? '4px solid #34c759' : emp.availability === 'MAYBE' ? '4px solid #ff9500' : '4px solid transparent'
      }}
    >
      <div style={{ fontWeight: 600 }}>{emp.name} {emp.comment && <span style={{fontSize: "0.8rem", color: "#86868b", fontStyle: "italic"}}>({emp.comment})</span>}</div>
      
      {/* If dropped in an active area (not pool), show inputs for role and time */}
      {area !== "POOL" && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: "0.5rem" }} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
          <input 
            type="text" 
            placeholder="Rolle (z.B. Barchef)" 
            value={emp.role || ""}
             onChange={(e) => emp.onUpdate(emp.id, 'role', e.target.value)}
            style={{ flex: 1, padding: "0.4rem", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "0.8rem" }} 
          />
          <input 
            type="text" 
            placeholder="Ab 22:00" 
            value={emp.startTime || ""}
            onChange={(e) => emp.onUpdate(emp.id, 'startTime', e.target.value)}
            style={{ width: "80px", padding: "0.4rem", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "0.8rem" }} 
          />
        </div>
      )}
    </div>
  )
}

function DroppableArea({ id, title, employees }: { id: string, title: string, employees: any[] }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef} 
      style={{ 
        background: isOver ? "var(--surface-hover)" : "var(--surface)", 
        padding: "1rem", 
        borderRadius: "12px", 
        border: "1px solid var(--border)",
        minHeight: "200px",
        flex: 1
      }}
    >
      <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>{title} ({employees.length})</h3>
      {employees.map(emp => (
        <DraggableEmployee key={emp.id} emp={emp} area={id} />
      ))}
      {employees.length === 0 && <p style={{ color: "#86868b", fontSize: "0.9rem", textAlign: "center", marginTop: "1rem" }}>Leer</p>}
    </div>
  )
}

export default function SchedulerClient({ requests }: { requests: any[] }) {
  const [selectedRequestId, setSelectedRequestId] = useState<string>("")
  const [selectedDayId, setSelectedDayId] = useState<string>("")
  const [employees, setEmployees] = useState<any[]>([])
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [planStatus, setPlanStatus] = useState<string>("DRAFT")
  const [isSaving, setIsSaving] = useState(false)
  const [activeDragEmp, setActiveDragEmp] = useState<any>(null)

  useEffect(() => {
    if (requests.length > 0 && !selectedRequestId) setSelectedRequestId(requests[0].id)
  }, [requests])

  useEffect(() => {
    if (!selectedRequestId) return
    const req = requests.find(r => r.id === selectedRequestId)
    if (req && req.days.length > 0) setSelectedDayId(req.days[0].id)
  }, [selectedRequestId, requests])

  useEffect(() => {
    if (!selectedDayId) return
    
    const loadPlanAndResponses = async () => {
      // Fetch responses for the requested day
      const resResp = await fetch(`/api/planning/admin/responses?requestId=${selectedRequestId}`)
      const allResponses = await resResp.json()
      const dayResponses = allResponses.filter((r: any) => r.dayId === selectedDayId && (r.status === 'YES' || r.status === 'MAYBE'))

      // Fetch existing staff plan if available
      const resPlan = await fetch(`/api/planning/admin/shifts?dayId=${selectedDayId}`)
      const planData = await resPlan.json()

      setActivePlanId(planData ? planData.id : null)
      setPlanStatus(planData ? planData.status : "DRAFT")

      // Map employees
      const empList: any[] = []
      dayResponses.forEach((r: any) => {
        // Did they have an existing assignment in the plan?
        const assignment = planData?.assignments?.find((a: any) => a.employeeId === r.employeeId)
        
        empList.push({
          id: r.employeeId,
          name: r.user.name,
          availability: r.status,
          comment: r.comment,
          area: assignment ? assignment.area : "POOL",
          role: assignment ? assignment.role : "",
          startTime: assignment ? assignment.startTime : ""
        })
      })

      // Ensure any assigned employees who clicked "NO" (or didn't answer) are also included (rare, but possible if plan was made before they said NO)
      if (planData?.assignments) {
        planData.assignments.forEach((a: any) => {
            if (!empList.find(e => e.id === a.employeeId)) {
                empList.push({
                    id: a.employeeId,
                    name: a.user.name,
                    availability: "UNKNOWN",
                    area: a.area,
                    role: a.role,
                    startTime: a.startTime
                })
            }
        })
      }

      setEmployees(empList)
    }

    loadPlanAndResponses()
  }, [selectedDayId, selectedRequestId])

  const handleUpdateEmp = (empId: string, field: string, value: string) => {
    setEmployees(emps => emps.map(emp => emp.id === empId ? { ...emp, [field]: value } : emp))
  }

  const handleDragStart = (event: any) => {
    const { active } = event
    setActiveDragEmp(active.data.current)
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    setActiveDragEmp(null)

    if (over && active.id !== over.id) {
      setEmployees(emps => emps.map(emp => {
        if (emp.id === active.id) {
          // Empty role/time if moving back to pool
          return { 
              ...emp, 
              area: over.id,
              role: over.id === 'POOL' ? '' : emp.role,
              startTime: over.id === 'POOL' ? '' : emp.startTime
          }
        }
        return emp
      }))
    }
  }

  const handleSavePlan = async (status: string) => {
    setIsSaving(true)
    
    // Format assignments
    const assignments = employees
      .filter(e => e.area !== "POOL")
      .map(e => ({
        employeeId: e.id,
        area: e.area,
        role: e.role,
        startTime: e.startTime
      }))

    try {
      const activeDay = requests.find(r => r.id === selectedRequestId)?.days.find((d: any) => d.id === selectedDayId)
        
      const res = await fetch("/api/planning/admin/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId: selectedDayId,
          date: activeDay?.date,
          eventName: activeDay?.eventName,
          status,
          assignments
        })
      })

      if (res.ok) {
        const data = await res.json()
        setActivePlanId(data.planId)
        setPlanStatus(status)
        alert("Einsatzplan gespeichert!")
      } else {
        alert("Fehler beim Speichern")
      }
    } catch(e) {
      alert("Fehler aufgetreten")
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportCSV = () => {
    const assigned = employees.filter(e => e.area !== "POOL")
    if (assigned.length === 0) return alert("Keine Zuweisungen zum Exportieren vorhanden.")
    
    let csv = "Bereich;Rolle;Name;Beginn;Notiz\n"
    assigned.forEach(e => {
      csv += `${e.area};${e.role};${e.name};${e.startTime};${e.note || ""}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Einsatzplan_${formatDate(activeDayObj?.date || "")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = async () => {
    // Basic CSV-like text PDF for now or a bit more styled if jspdf allows easily
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text(`Einsatzplan: ${formatDate(activeDayObj?.date || "")}`, 20, 20)
    doc.setFontSize(14)
    doc.text(`Event: ${activeDayObj?.eventName || "Clubbetrieb"}`, 20, 30)
    
    let y = 45
    AREAS.filter(a => a.id !== "POOL").forEach(area => {
      const emps = employees.filter(e => e.area === area.id)
      if (emps.length > 0) {
        doc.setFontSize(12)
        doc.setTextColor(0, 113, 227)
        doc.text(area.title, 20, y)
        doc.setTextColor(0, 0, 0)
        y += 7
        
        emps.forEach(e => {
          doc.setFontSize(10)
          doc.text(`- ${e.name}: ${e.role || ""} (Beginn: ${e.startTime || "??:??"})`, 25, y)
          y += 6
        })
        y += 5
      }
    })

    doc.save(`Einsatzplan_${formatDate(activeDayObj?.date || "")}.pdf`)
  }

  const currentRequest = requests.find(r => r.id === selectedRequestId)
  const activeDayObj = currentRequest?.days.find((d: any) => d.id === selectedDayId)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", { weekday: 'short', day: '2-digit', month: '2-digit' })
  }

  return (
    <div>
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <select 
          value={selectedRequestId} 
          onChange={e => setSelectedRequestId(e.target.value)}
          style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)' }}
        >
          <option value="" disabled>Abfrage wählen</option>
          {requests.map(r => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>

        {currentRequest && (
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', flex: 1 }}>
            {currentRequest.days.map((d: any) => (
              <Button 
                key={d.id} 
                variant={selectedDayId === d.id ? "primary" : "outline"}
                onClick={() => setSelectedDayId(d.id)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {formatDate(d.date)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {activeDayObj && (
        <Card className={styles.activeDayCard}>
          <CardContent className={styles.activeDayContent}>
            <div>
              <h2 className={styles.activeDayTitle}>Planung: {formatDate(activeDayObj.date)} {activeDayObj.eventName && `- ${activeDayObj.eventName}`}</h2>
              <p className={styles.activeDayStatus}>Status: <strong>{planStatus === 'FINAL' ? 'Final (Sichtbar für MA)' : 'Entwurf'}</strong></p>
            </div>
            <div className={styles.saveActions}>
              <Button variant="ghost" onClick={handleExportCSV}>Export CSV</Button>
              <Button variant="ghost" onClick={handleExportPDF}>Export PDF</Button>
              <Button variant="outline" onClick={() => handleSavePlan("DRAFT")} disabled={isSaving}>Als Entwurf speichern</Button>
              <Button onClick={() => handleSavePlan("FINAL")} disabled={isSaving}>Finalisieren (Veröffentlichen)</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className={styles.schedulerGrid}>
          {/* Left Panel: Employee Pool */}
          <div className={styles.poolPanel}>
            <DroppableArea 
              id="POOL" 
              title="Verfügbare Mitarbeiter" 
              employees={employees.filter(e => e.area === "POOL").map(e => ({...e, onUpdate: handleUpdateEmp}))} 
            />
          </div>

          {/* Right Panel: Shift Areas */}
          <div className={styles.areasPanel}>
            {AREAS.filter(a => a.id !== "POOL").map(area => (
              <DroppableArea 
                key={area.id} 
                id={area.id} 
                title={area.title} 
                employees={employees.filter(e => e.area === area.id).map(e => ({...e, onUpdate: handleUpdateEmp}))} 
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeDragEmp ? (
            <div style={{ padding: "0.8rem", background: "var(--background)", border: "1px solid #0071e3", borderRadius: "8px", opacity: 0.9 }}>
              <strong>{activeDragEmp.name}</strong>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
