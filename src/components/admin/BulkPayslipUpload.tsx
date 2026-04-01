"use client"

import { useState, useRef } from "react"
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
  const monthRef = useRef<HTMLSelectElement>(null)
  const yearRef = useRef<HTMLSelectElement>(null)
  // Store split page PDFs for manual assignment later
  const splitPagesRef = useRef<Map<number, Uint8Array>>(new Map())

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

  /**
   * Extract text from each page using pdfjs-dist (runs in browser).
   */
  async function extractTextPerPage(data: ArrayBuffer): Promise<string[]> {
    const pdfjsLib = await import("pdfjs-dist")
    // Use the bundled worker for browser
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise
    const texts: string[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const text = content.items
        .filter((item): item is { str: string } & typeof item => "str" in item)
        .map((item) => item.str)
        .join(" ")
      texts.push(text)
    }
    await doc.destroy()
    return texts
  }

  /**
   * Split PDF into single-page PDFs using pdf-lib (runs in browser).
   */
  async function splitPages(data: ArrayBuffer): Promise<Map<number, Uint8Array>> {
    const { PDFDocument } = await import("pdf-lib")
    const srcDoc = await PDFDocument.load(data)
    const pages = new Map<number, Uint8Array>()

    for (let i = 0; i < srcDoc.getPageCount(); i++) {
      const newDoc = await PDFDocument.create()
      const [page] = await newDoc.copyPages(srcDoc, [i])
      newDoc.addPage(page)
      const bytes = await newDoc.save()
      pages.set(i + 1, bytes) // 1-indexed
    }
    return pages
  }

  /**
   * Upload a single-page PDF to the server.
   */
  async function uploadPage(pageBytes: Uint8Array, userId: string, month: number, year: number): Promise<string> {
    const blob = new Blob([pageBytes.buffer as ArrayBuffer], { type: "application/pdf" })
    const file = new File([blob], "payslip.pdf", { type: "application/pdf" })

    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", userId)
    formData.append("month", String(month))
    formData.append("year", String(year))

    const res = await fetch("/api/payslips/save", {
      method: "POST",
      body: formData,
    })

    const responseText = await res.text()
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      throw new Error(`Server-Fehler (${res.status})`)
    }
    if (!res.ok) throw new Error(data.error || "Upload fehlgeschlagen")
    return data.employeeName
  }

  /**
   * Match employee name in page text.
   */
  function findEmployee(pageText: string): Employee | null {
    for (const emp of employees) {
      if (!emp.name) continue
      const nameParts = emp.name.trim().split(/\s+/)
      const allPartsFound = nameParts.every((part) =>
        pageText.toLowerCase().includes(part.toLowerCase())
      )
      if (allPartsFound) return emp
    }
    return null
  }

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

    setIsProcessing(true)

    try {
      const arrayBuffer = await file.arrayBuffer()

      // Step 1: Extract text from each page (in browser)
      setStatusText("Text wird aus PDF extrahiert…")
      const pageTexts = await extractTextPerPage(arrayBuffer)

      // Step 2: Split PDF into individual pages (in browser)
      setStatusText("PDF wird aufgeteilt…")
      const pages = await splitPages(arrayBuffer)
      splitPagesRef.current = pages

      const monthNum = parseInt(month)
      const yearNum = parseInt(year)
      const assigned: AssignedResult[] = []
      const unassigned: UnassignedResult[] = []

      // Step 3: Match employees and upload matched pages
      for (let i = 0; i < pageTexts.length; i++) {
        const pageNum = i + 1
        const pageText = pageTexts[i]
        const emp = findEmployee(pageText)

        if (emp) {
          setStatusText(`Lade Seite ${pageNum} hoch (${emp.name})…`)
          const pageBytes = pages.get(pageNum)
          if (pageBytes) {
            await uploadPage(pageBytes, emp.id, monthNum, yearNum)
          }
          assigned.push({
            employeeName: emp.name || emp.email || "Unbekannt",
            employeeId: emp.id,
            page: pageNum,
          })
        } else {
          const snippet = pageText.substring(0, 200).replace(/\s+/g, " ").trim()
          unassigned.push({
            page: pageNum,
            textSnippet: snippet || "(Kein Text erkannt)",
          })
        }
      }

      setResult({ assigned, unassigned, totalPages: pageTexts.length })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsProcessing(false)
      setStatusText("")
    }
  }

  async function handleManualAssign(page: number, userId: string) {
    if (!monthRef.current || !yearRef.current) return

    const pageBytes = splitPagesRef.current.get(page)
    if (!pageBytes) {
      setError("Seite nicht mehr verfügbar — bitte PDF erneut hochladen")
      return
    }

    setAssigningPage(page)

    try {
      const monthNum = parseInt(monthRef.current.value)
      const yearNum = parseInt(yearRef.current.value)
      const employeeName = await uploadPage(pageBytes, userId, monthNum, yearNum)

      setResult((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          unassigned: prev.unassigned.filter((u) => u.page !== page),
          assigned: [
            ...prev.assigned,
            { employeeName, employeeId: userId, page },
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
