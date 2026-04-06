"use client"
import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import styles from "./planning.module.css"

export default function ResponsesClient({ requests }: { requests: any[] }) {
  const [selectedRequestId, setSelectedRequestId] = useState<string>("")
  const [responses, setResponses] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<"DAY" | "EMPLOYEE">("DAY")
  
  // For Day View
  const [selectedDayId, setSelectedDayId] = useState<string>("")

  // For Employee View
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")

  useEffect(() => {
    if (requests.length > 0 && !selectedRequestId) {
      setSelectedRequestId(requests[0].id)
    }
  }, [requests])

  useEffect(() => {
    if (!selectedRequestId) return
    
    // Set default day when request changes
    const req = requests.find(r => r.id === selectedRequestId)
    if (req && req.days.length > 0) {
      setSelectedDayId(req.days[0].id)
    }

    // Fetch responses for this request
    const fetchResponses = async () => {
      try {
        const res = await fetch(`/api/planning/admin/responses?requestId=${selectedRequestId}`)
        const data = await res.json()
        setResponses(data)
      } catch(e) {
        console.error(e)
      }
    }
    fetchResponses()
  }, [selectedRequestId, requests])

  const currentRequest = requests.find(r => r.id === selectedRequestId)
  const uniqueEmployees = Array.from(new Set(responses.map(r => r.employeeId))).map(id => {
    const r = responses.find(resp => resp.employeeId === id)
    return { id, name: r.user.name }
  }).sort((a,b) => a.name.localeCompare(b.name))

  if (requests.length === 0) return <p>Bitte erstelle zuerst eine Abfrage.</p>

  const getStatusBadge = (status: string) => {
    if (status === "YES") return <span style={{ color: "#34c759", fontWeight: "bold" }}>JA</span>
    if (status === "NO") return <span style={{ color: "#ff3b30", fontWeight: "bold" }}>NEIN</span>
    if (status === "MAYBE") return <span style={{ color: "#ff9500", fontWeight: "bold" }}>VIELLEICHT</span>
    return <span>-</span>
  }

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
            <option key={r.id} value={r.id}>{r.title} ({r.status})</option>
          ))}
        </select>

        <div className={styles.tabs} style={{ paddingBottom: 0 }}>
          <button 
            className={`${styles.tab} ${viewMode === "DAY" ? styles.activeTab : ""}`}
            onClick={() => setViewMode("DAY")}
          >
            Tagesansicht
          </button>
          <button 
            className={`${styles.tab} ${viewMode === "EMPLOYEE" ? styles.activeTab : ""}`}
            onClick={() => setViewMode("EMPLOYEE")}
          >
            Mitarbeiteransicht
          </button>
        </div>
      </div>

      <Card>
        <CardContent className={styles.cardContentPadded}>
          
          {viewMode === "DAY" && currentRequest && (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1.5rem' }}>
                {currentRequest.days.map((d: any) => (
                  <Button 
                    key={d.id} 
                    variant={selectedDayId === d.id ? "primary" : "outline"}
                    onClick={() => setSelectedDayId(d.id)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {formatDate(d.date)} {d.eventName && `(${d.eventName})`}
                  </Button>
                ))}
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "0.8rem 0" }}>Mitarbeiter</th>
                    <th>Status</th>
                    <th>Kommentar</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueEmployees.map(emp => {
                    const resp = responses.find(r => r.employeeId === emp.id && r.dayId === selectedDayId)
                    return (
                      <tr key={emp.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.8rem 0" }}>{emp.name}</td>
                        <td>{resp ? getStatusBadge(resp.status) : <span style={{ color: "#86868b" }}>Keine Antwort</span>}</td>
                        <td style={{ color: "#86868b", fontSize: "0.9rem" }}>{resp?.comment}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === "EMPLOYEE" && currentRequest && (
            <div>
              <div style={{ marginBottom: "1.5rem" }}>
                <select 
                  value={selectedEmployeeId} 
                  onChange={e => setSelectedEmployeeId(e.target.value)}
                  style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                >
                  <option value="" disabled>Mitarbeiter wählen</option>
                  {uniqueEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              {!selectedEmployeeId && uniqueEmployees.length > 0 && <p>Wähle einen Mitarbeiter aus, um seine Antworten zu sehen.</p>}
              {!selectedEmployeeId && uniqueEmployees.length === 0 && <p>Es gibt bisher keine Antworten für diese Abfrage.</p>}

              {selectedEmployeeId && (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                      <th style={{ padding: "0.8rem 0" }}>Datum</th>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Kommentar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRequest.days.map((d: any) => {
                      const resp = responses.find(r => r.employeeId === selectedEmployeeId && r.dayId === d.id)
                      return (
                        <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "0.8rem 0", fontWeight: 500 }}>{formatDate(d.date)}</td>
                          <td style={{ color: "#0071e3", fontSize: "0.9rem" }}>{d.eventName || "-"}</td>
                          <td>{resp ? getStatusBadge(resp.status) : <span style={{ color: "#86868b" }}>Keine Antwort</span>}</td>
                          <td style={{ color: "#86868b", fontSize: "0.9rem" }}>{resp?.comment}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
