"use client"

import { useState, useRef } from "react"
import { upload } from "@vercel/blob/client"
import { Button } from "@/components/ui/Button"
import styles from "./BulkPayslipUpload.module.css"

interface Employee {
  id: string
  name: string | null
  email: string | null
}

interface AssignedResult {
  employeeName: string
  employeeId: string
  page: number
}

interface UnassignedResult {
  page: number
  textSnippet: string
}

interface BulkResult {
  assigned: AssignedResult[]
  unassigned: UnassignedResult[]
  totalPages: number
}

interface Props {
  employees: Employee[]
}

export default function BulkPayslipUpload({ employees }: Props) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState("")
  const [result, setResult] = useState<BulkResult | null>(null)
  const [assigningPage, setAssigningPage] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const originalFileRef = useRef<File | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const monthRef = useRef<HTMLSelectElement>(null)
  const yearRef = useRef<HTMLSelectElement>(null)

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]
  const months = [
    { value: 1, label: "Januar" },
    { value: 2, label: "Februar" },
    { value: 3, label: "März" },
    { value: 4, label: "April" },
    { value: 5, label: "Mai" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Dezember" },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)

    const file = fileRef.current?.files?.[0]
    const month = monthRef.current?.value
    const year = yearRef.current?.value

    if (!file || !month || !year) {
      setError("Bitte alle Felder ausfüllen")
      return
    }

    originalFileRef.current = file
    setIsProcessing(true)

    try {
      // Step 1: Upload PDF to Vercel Blob (bypasses 4.5MB serverless limit)
      setStatusText("PDF wird hochgeladen…")
      const blob = await upload(`bulk-payslips/${Date.now()}_${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/payslips/upload",
      })
      blobUrlRef.current = blob.url

      // Step 2: Send Blob URL to processing API (small JSON payload)
      setStatusText("Lohnzettel werden analysiert & zugeordnet…")
      const res = await fetch("/api/payslips/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: blob.url,
          month: parseInt(month),
          year: parseInt(year),
        }),
      })

      const responseText = await res.text()

      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        console.error("Non-JSON response:", res.status, responseText.substring(0, 500))
        throw new Error(`Server-Fehler (${res.status}): ${responseText.substring(0, 150)}`)
      }

      if (!res.ok) {
        throw new Error(data.error || `Fehler (${res.status})`)
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsProcessing(false)
      setStatusText("")
    }
  }

  async function handleManualAssign(page: number, userId: string) {
    if (!blobUrlRef.current || !monthRef.current || !yearRef.current) return

    setAssigningPage(page)

    try {
      const res = await fetch("/api/payslips/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: blobUrlRef.current,
          page,
          userId,
          month: parseInt(monthRef.current.value),
          year: parseInt(yearRef.current.value),
        }),
      })

      const responseText = await res.text()
      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error(`Server-Fehler (${res.status})`)
      }

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Zuordnen")
      }

      // Move from unassigned to assigned
      setResult((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          unassigned: prev.unassigned.filter((u) => u.page !== page),
          assigned: [
            ...prev.assigned,
            { employeeName: data.employeeName, employeeId: userId, page },
          ].sort((a, b) => a.page - b.page),
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Zuordnen")
    } finally {
      setAssigningPage(null)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.iconCircle}>📄</div>
        <div>
          <h3 className={styles.title}>Sammel-PDF verarbeiten</h3>
          <p className={styles.subtitle}>
            Lade eine PDF mit allen Lohnzetteln hoch — die Zuordnung erfolgt automatisch.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Monat</label>
            <select ref={monthRef} className={styles.select} defaultValue={new Date().getMonth() + 1}>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Jahr</label>
            <select ref={yearRef} className={styles.select} defaultValue={currentYear}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Sammel-PDF Datei</label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className={styles.fileInput}
            required
          />
        </div>

        <Button type="submit" fullWidth disabled={isProcessing}>
          {isProcessing ? (
            <span className={styles.loadingText}>
              <span className={styles.spinner} />
              {statusText || "Verarbeite PDF…"}
            </span>
          ) : (
            "PDF analysieren & zuordnen"
          )}
        </Button>
      </form>

      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️</span> {error}
        </div>
      )}

      {result && (
        <div className={styles.results}>
          <div className={styles.resultSummary}>
            <span className={styles.summaryItem}>
              📊 {result.totalPages} Seiten insgesamt
            </span>
            <span className={styles.summaryItem + " " + styles.successText}>
              ✅ {result.assigned.length} zugewiesen
            </span>
            {result.unassigned.length > 0 && (
              <span className={styles.summaryItem + " " + styles.warningText}>
                ⚠️ {result.unassigned.length} offen
              </span>
            )}
          </div>

          {result.assigned.length > 0 && (
            <div className={styles.resultSection}>
              <h4 className={styles.sectionTitle}>Erfolgreich zugewiesen</h4>
              <div className={styles.resultList}>
                {result.assigned.map((item) => (
                  <div key={item.page} className={styles.resultItem + " " + styles.successItem}>
                    <div className={styles.resultInfo}>
                      <span className={styles.pageTag}>Seite {item.page}</span>
                      <span className={styles.employeeName}>{item.employeeName}</span>
                    </div>
                    <span className={styles.checkmark}>✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.unassigned.length > 0 && (
            <div className={styles.resultSection}>
              <h4 className={styles.sectionTitle}>Manuelle Zuordnung nötig</h4>
              <div className={styles.resultList}>
                {result.unassigned.map((item) => (
                  <div key={item.page} className={styles.resultItem + " " + styles.warningItem}>
                    <div className={styles.resultInfo}>
                      <span className={styles.pageTag}>Seite {item.page}</span>
                      <span className={styles.textSnippet}>
                        {item.textSnippet}
                      </span>
                    </div>
                    <div className={styles.assignControls}>
                      <select
                        id={`assign-${item.page}`}
                        className={styles.assignSelect}
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleManualAssign(item.page, e.target.value)
                          }
                        }}
                        disabled={assigningPage === item.page}
                      >
                        <option value="">Mitarbeiter wählen…</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name || emp.email}
                          </option>
                        ))}
                      </select>
                      {assigningPage === item.page && (
                        <span className={styles.spinner} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
