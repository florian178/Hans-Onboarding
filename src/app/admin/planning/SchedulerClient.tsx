"use client"
import React, { useState, useEffect, useCallback } from "react"
import { DndContext, useDraggable, useDroppable, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import styles from "./planning.module.css"

const AREAS = [
  { id: "CVD", title: "CvD" },
  { id: "EINLASS", title: "Einlass" },
  { id: "GARDEROBE", title: "Garderobe" },
  { id: "BETONBAR", title: "Betonbar" },
  { id: "WALDBAR", title: "Waldbar" }
]

function DraggableChip({ emp, area, onUpdate }: { emp: any, area: string, onUpdate: (id: string, field: string, value: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: emp.id,
    data: { ...emp, sourceArea: area }
  })

  const statusColor = emp.availability === 'YES' ? '#34c759' : emp.availability === 'MAYBE' ? '#ff9500' : '#86868b'

  return (
    <div
      ref={setNodeRef}
      className={styles.empChip}
      style={{ opacity: isDragging ? 0.4 : 1, borderLeftColor: statusColor }}
    >
      <div {...listeners} {...attributes} className={styles.empDragHandle}>⠿</div>
      <div className={styles.empChipContent}>
        <span className={styles.empName}>{emp.name}</span>
        {emp.comment && <span className={styles.empComment}>{emp.comment}</span>}
        {area !== "POOL" && (
          <div className={styles.empInputs} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
            <input
              type="text"
              placeholder="Rolle"
              value={emp.role || ""}
              onChange={e => onUpdate(emp.id, 'role', e.target.value)}
              className={styles.empInput}
            />
            <input
              type="text"
              placeholder="Ab..."
              value={emp.startTime || ""}
              onChange={e => onUpdate(emp.id, 'startTime', e.target.value)}
              className={styles.empInputSmall}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function DropZone({ id, title, employees, onUpdate }: { id: string, title: string, employees: any[], onUpdate: (id: string, field: string, value: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.dropZone} ${isOver ? styles.dropZoneOver : ''}`}
    >
      <div className={styles.dropZoneHeader}>{title} <span className={styles.dropZoneCount}>{employees.length}</span></div>
      {employees.map(emp => (
        <DraggableChip key={emp.id} emp={emp} area={id} onUpdate={onUpdate} />
      ))}
      {employees.length === 0 && <div className={styles.dropZoneEmpty}>Mitarbeiter hierher ziehen</div>}
    </div>
  )
}

export default function SchedulerClient({ requests }: { requests: any[] }) {
  const [selectedRequestId, setSelectedRequestId] = useState<string>("")
  const [selectedDayId, setSelectedDayId] = useState<string>("")
  const [employees, setEmployees] = useState<any[]>([])
  const [planStatus, setPlanStatus] = useState<string>("DRAFT")
  const [isSaving, setIsSaving] = useState(false)
  const [activeDragEmp, setActiveDragEmp] = useState<any>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    if (requests.length > 0 && !selectedRequestId) setSelectedRequestId(requests[0].id)
  }, [requests])

  useEffect(() => {
    if (!selectedRequestId) return
    const req = requests.find(r => r.id === selectedRequestId)
    if (req && req.days.length > 0) setSelectedDayId(req.days[0].id)
  }, [selectedRequestId, requests])

  useEffect(() => {
    if (!selectedDayId || !selectedRequestId) return

    const load = async () => {
      try {
        const [resResp, resPlan] = await Promise.all([
          fetch(`/api/planning/admin/responses?requestId=${selectedRequestId}`),
          fetch(`/api/planning/admin/shifts?dayId=${selectedDayId}`)
        ])
        const allResponses = await resResp.json()
        const planData = await resPlan.json()

        const dayResponses = allResponses.filter((r: any) => r.dayId === selectedDayId && (r.status === 'YES' || r.status === 'MAYBE'))

        setPlanStatus(planData ? planData.status : "DRAFT")

        const empList: any[] = []
        dayResponses.forEach((r: any) => {
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
      } catch (e) {
        console.error(e)
      }
    }

    load()
  }, [selectedDayId, selectedRequestId])

  const handleUpdateEmp = useCallback((empId: string, field: string, value: string) => {
    setEmployees(emps => emps.map(emp => emp.id === empId ? { ...emp, [field]: value } : emp))
  }, [])

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    setActiveDragEmp(null)
    if (!over) return

    const targetArea = over.id as string
    const empId = active.id as string

    // Only move if we're dropping onto a valid area and not onto another employee
    const validAreas = ["POOL", ...AREAS.map(a => a.id)]
    if (!validAreas.includes(targetArea)) return

    setEmployees(emps => emps.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          area: targetArea,
          role: targetArea === 'POOL' ? '' : emp.role,
          startTime: targetArea === 'POOL' ? '' : emp.startTime
        }
      }
      return emp
    }))
  }

  const handleSavePlan = async (status: string) => {
    setIsSaving(true)
    const assignments = employees
      .filter(e => e.area !== "POOL")
      .map(e => ({ employeeId: e.id, area: e.area, role: e.role, startTime: e.startTime }))

    try {
      const activeDay = requests.find(r => r.id === selectedRequestId)?.days.find((d: any) => d.id === selectedDayId)
      const res = await fetch("/api/planning/admin/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId: selectedDayId, date: activeDay?.date, eventName: activeDay?.eventName, status, assignments })
      })
      if (res.ok) {
        setPlanStatus(status)
        alert("Einsatzplan gespeichert!")
      } else {
        alert("Fehler beim Speichern")
      }
    } catch (e) {
      alert("Fehler aufgetreten")
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportCSV = () => {
    const assigned = employees.filter(e => e.area !== "POOL")
    if (assigned.length === 0) return alert("Keine Zuweisungen zum Exportieren vorhanden.")
    let csv = "Bereich;Rolle;Name;Beginn\n"
    assigned.forEach(e => { csv += `${e.area};${e.role};${e.name};${e.startTime}\n` })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Einsatzplan_${formatDate(activeDayObj?.date || "")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const currentRequest = requests.find(r => r.id === selectedRequestId)
  const activeDayObj = currentRequest?.days.find((d: any) => d.id === selectedDayId)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", { weekday: 'short', day: '2-digit', month: '2-digit' })
  }

  const poolEmps = employees.filter(e => e.area === "POOL")

  return (
    <div className={styles.schedulerWrapper}>
      {/* Header bar */}
      <div className={styles.schedulerHeader}>
        <select
          value={selectedRequestId}
          onChange={e => setSelectedRequestId(e.target.value)}
          className={styles.selectInput}
        >
          <option value="" disabled>Abfrage wählen</option>
          {requests.map(r => (
            <option key={r.id} value={r.id}>{r.title}</option>
          ))}
        </select>

        {currentRequest && (
          <div className={styles.dayButtons}>
            {currentRequest.days.map((d: any) => (
              <button
                key={d.id}
                className={`${styles.dayBtn} ${selectedDayId === d.id ? styles.dayBtnActive : ''}`}
                onClick={() => setSelectedDayId(d.id)}
              >
                {formatDate(d.date)}
              </button>
            ))}
          </div>
        )}

        <div className={styles.schedulerActions}>
          <button className={styles.exportBtn} onClick={handleExportCSV}>CSV</button>
          <Button variant="outline" onClick={() => handleSavePlan("DRAFT")} disabled={isSaving}>Entwurf</Button>
          <Button onClick={() => handleSavePlan("FINAL")} disabled={isSaving}>Finalisieren</Button>
        </div>
      </div>

      {activeDayObj && (
        <div className={styles.schedulerStatus}>
          <strong>{activeDayObj.eventName || 'Veranstaltung'}</strong>
          <span> · Status: {planStatus === 'FINAL' ? '✅ Final' : '📝 Entwurf'}</span>
        </div>
      )}

      {/* DnD Area: Single screen, no excessive scrolling */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={e => setActiveDragEmp(e.active.data.current)}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.schedulerBody}>
          {/* Left: Pool */}
          <div className={styles.schedulerPool}>
            <DropZone id="POOL" title="Pool" employees={poolEmps} onUpdate={handleUpdateEmp} />
          </div>

          {/* Right: Areas in compact grid */}
          <div className={styles.schedulerAreas}>
            {AREAS.map(area => (
              <DropZone
                key={area.id}
                id={area.id}
                title={area.title}
                employees={employees.filter(e => e.area === area.id)}
                onUpdate={handleUpdateEmp}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeDragEmp ? (
            <div className={styles.dragOverlayChip}>
              <strong>{activeDragEmp.name}</strong>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
