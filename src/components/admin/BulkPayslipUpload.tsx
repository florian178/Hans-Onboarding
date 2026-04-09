"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/Button"
import styles from "./BulkPayslipUpload.module.css"

interface Employee {
  id: string
  name: string | null
  email: string | null
  firstName?: string
  lastName?: string
  zipCode?: string
}

type PageType = 'PAYSLIP' | 'SKIP'

interface AssignedResult {
  employeeName: string
  employeeId: string
  page: number
}

interface UnassignedResult {
  page: number
  candidateName: string
}

interface SkippedResult {
  page: number
  reason: string
}

interface BulkResult {
  assigned: AssignedResult[]
  unassigned: UnassignedResult[]
  skipped: SkippedResult[]
  totalPages: number
  monthLabel: string
  yearLabel: string
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
  async function extractTextPerPage(data: ArrayBuffer, onProgress: (cur: number, total: number) => void): Promise<string[]> {
    console.log("Starting text extraction...")
    const pdfjsLib = await import("pdfjs-dist")
    
    // Use unpkg as fallback if cdnjs is missing versions
    const version = pdfjsLib.version || "5.4.296"
    const workerUrl = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`
    console.log(`Using PDF.js version ${version}, worker: ${workerUrl}`)
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(data),
      useWorkerFetch: false,
      isEvalSupported: false,
      enableXfa: true,
    })
    
    const doc = await loadingTask.promise
    const totalPages = doc.numPages
    console.log(`PDF loaded, total pages: ${totalPages}`)
    
    const texts: string[] = []
    for (let i = 1; i <= totalPages; i++) {
      onProgress(i, totalPages)
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
   * Robustly split PDF by rendering each page to a canvas (flattening).
   * This handles encrypted or complex PDFs where direct page copying fails.
   */
  async function splitPages(data: ArrayBuffer, onProgress: (cur: number, total: number) => void): Promise<Map<number, Uint8Array>> {
    console.log("Starting robust PDF split (flattening)...")
    const pdfjsLib = await import("pdfjs-dist")
    const { PDFDocument } = await import("pdf-lib")
    
    const version = pdfjsLib.version || "5.4.296"
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`

    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(data.slice(0)),
      enableXfa: true,
    })
    const pdf = await loadingTask.promise
    const totalPages = pdf.numPages
    const pagesMap = new Map<number, Uint8Array>()

    for (let i = 1; i <= totalPages; i++) {
      onProgress(i, totalPages)
      const page = await pdf.getPage(i)
      
      // Use 2.0x scale for good print quality (approx 144 DPI)
      const viewport = page.getViewport({ scale: 2.0 })
      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")
      canvas.height = viewport.height
      canvas.width = viewport.width

      if (context) {
        // Render PDF page to canvas
        console.log(`Rendering page ${i} to canvas: ${canvas.width}x${canvas.height}`)
        await page.render({ canvasContext: context, viewport } as any).promise
        
        // Convert to high-quality JPEG
        const imgDataUrl = canvas.toDataURL("image/jpeg", 0.9)
        console.log(`Page ${i} image data length: ${imgDataUrl.length}`)
        const base64 = imgDataUrl.split(",")[1]
        const binStr = atob(base64)
        const imgBytes = new Uint8Array(binStr.length)
        for (let j = 0; j < binStr.length; j++) {
          imgBytes[j] = binStr.charCodeAt(j)
        }

        // Create new 1-page PDF
        const newDoc = await PDFDocument.create()
        const jpgImage = await newDoc.embedJpg(imgBytes)
        
        // Set page size to match original viewport
        const newPage = newDoc.addPage([viewport.width, viewport.height])
        newPage.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        })
        
        const bytes = await newDoc.save()
        pagesMap.set(i, bytes)
      }
    }
    
    await pdf.destroy()
    return pagesMap
  }

  /**
   * Upload a single-page PDF to the server.
   */
  async function uploadPage(pageBytes: Uint8Array, userId: string, month: number, year: number): Promise<string> {
    const blob = new Blob([pageBytes as any], { type: "application/pdf" })
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
   * Classify the page type based on known DATEV document headers.
   * Only "Abrechnung" pages are actual individual payslips.
   */
  function classifyPage(pageText: string): { type: PageType; reason: string } {
    const text = pageText.toLowerCase()
    
    if (text.includes("abrechnung der brutto") || text.includes("brutto/netto-bez")) {
      return { type: 'PAYSLIP', reason: '' }
    }
    if (text.includes("lohnjournal")) {
      return { type: 'SKIP', reason: 'Lohnjournal (Übersicht)' }
    }
    if (text.includes("meldebescheinigung")) {
      return { type: 'SKIP', reason: 'Meldebescheinigung (SV)' }
    }
    if (text.includes("übersicht zahlungen")) {
      return { type: 'SKIP', reason: 'Zahlungsübersicht' }
    }
    if (text.includes("dü-protokoll") || text.includes("lohnsteuer-anmeldung")) {
      return { type: 'SKIP', reason: 'DÜ-Protokoll / Steueranmeldung' }
    }
    if (text.includes("beitragsnachweis")) {
      return { type: 'SKIP', reason: 'Beitragsnachweis' }
    }
    // Unknown page type — don't skip, let the matcher try
    return { type: 'PAYSLIP', reason: '' }
  }

  /**
   * Match employee on an individual payslip page.
   * Strategy:
   *   1. Check if "Vorname Nachname" (full name combo) appears in the text.
   *   2. Prefer exact full-name matches over partial matches.
   *   3. Use zipCode as tiebreaker when multiple last-name matches exist.
   */
  function findEmployeeMatch(
    pageText: string
  ): { employee: Employee | null, candidateName: string } {
    const text = pageText.toLowerCase()
    
    // Score each employee
    const scored: { emp: Employee; score: number }[] = []
    
    for (const emp of employees) {
      const fName = emp.firstName?.toLowerCase()?.trim()
      const lName = emp.lastName?.toLowerCase()?.trim()
      const zCode = emp.zipCode?.toLowerCase()?.trim()
      
      if (!fName && !lName) continue
      
      let score = 0
      
      // Check if the full name combo appears (strongest signal for payslip pages)
      // On DATEV payslips, the name appears as "Vorname Nachname" on one line
      if (fName && lName) {
        const fullNameCombo = `${fName} ${lName}`
        if (text.includes(fullNameCombo)) {
          score += 10 // Very strong match
        } else {
          // Check individual parts
          if (text.includes(fName)) score += 2
          if (text.includes(lName)) score += 2
        }
      } else {
        if (fName && text.includes(fName)) score += 2
        if (lName && text.includes(lName)) score += 2
      }
      
      // Zip code as bonus confirmation
      if (zCode && zCode.length >= 4 && text.includes(zCode)) score += 3
      
      if (score >= 4) {
        scored.push({ emp, score })
      }
    }
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)
    
    // If exactly one top-scorer with score >= 10, auto-assign (full name match)
    if (scored.length >= 1 && scored[0].score >= 10) {
      // Check for ambiguity: two people with same top score
      if (scored.length === 1 || scored[0].score > scored[1].score) {
        return { employee: scored[0].emp, candidateName: scored[0].emp.name || '' }
      }
    }
    
    // If exactly one match with score >= 7 (name parts + zip), auto-assign
    if (scored.length === 1 && scored[0].score >= 7) {
      return { employee: scored[0].emp, candidateName: scored[0].emp.name || '' }
    }
    
    // If there are candidates, suggest the best one
    if (scored.length >= 1) {
      return { employee: null, candidateName: scored[0].emp.name || '' }
    }
    
    return { employee: null, candidateName: '' }
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
      setStatusText("Bibliotheken werden geladen…")
      const pageTexts = await extractTextPerPage(arrayBuffer.slice(0), (cur, total) => {
        setStatusText(`Analysiere Seite ${cur} von ${total}…`)
      })

      // Step 2: Classify pages by document type
      const pageClassifications = pageTexts.map((text, i) => {
        const result = classifyPage(text)
        console.log(`Page ${i + 1}: type=${result.type}, reason=${result.reason}`)
        return result
      })

      const payslipPages = pageClassifications.filter(c => c.type === 'PAYSLIP').length
      const skippedPages = pageClassifications.filter(c => c.type === 'SKIP').length
      console.log(`Classification: ${payslipPages} payslips, ${skippedPages} skipped`)

      // Step 3: Split ONLY payslip pages into individual PDFs (in browser)
      const pages = await splitPages(arrayBuffer.slice(0), (cur, total) => {
        setStatusText(`Teile Seite ${cur} von ${total}…`)
      })
      splitPagesRef.current = pages

      const monthNum = parseInt(month)
      const yearNum = parseInt(year)
      const assigned: AssignedResult[] = []
      const unassigned: UnassignedResult[] = []
      const skipped: SkippedResult[] = []

      // Step 4: Match employees and upload matched pages
      for (let i = 0; i < pageTexts.length; i++) {
        const pageNum = i + 1
        const pageText = pageTexts[i]
        const classification = pageClassifications[i]

        // Skip non-payslip pages entirely
        if (classification.type === 'SKIP') {
          skipped.push({ page: pageNum, reason: classification.reason })
          continue
        }

        const { employee: emp, candidateName } = findEmployeeMatch(pageText)

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
          unassigned.push({
            page: pageNum,
            candidateName,
          })
        }
      }

      setResult({ 
        assigned, 
        unassigned, 
        skipped,
        totalPages: pageTexts.length,
        monthLabel: months.find(m => m.value === monthNum)?.label || "",
        yearLabel: String(yearNum)
      })
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
            {result.skipped.length > 0 && (
              <span className={styles.summaryItem}>
                ⏭️ {result.skipped.length} übersprungen
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
                      <div className={styles.unassignedDetails}>
                        <span className={styles.candidateName}>
                          {item.candidateName || "(Kein Name erkannt)"}
                        </span>
                        <span className={styles.periodTag}>
                          Lohnzettel {result.monthLabel} {result.yearLabel}
                        </span>
                      </div>
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

          {result.skipped.length > 0 && (
            <div className={styles.resultSection}>
              <h4 className={styles.sectionTitle}>Automatisch übersprungen</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                Diese Seiten sind keine individuellen Lohnzettel und wurden nicht zugeordnet.
              </p>
              <div className={styles.resultList}>
                {result.skipped.map((item) => (
                  <div key={item.page} className={styles.resultItem} style={{ opacity: 0.6 }}>
                    <div className={styles.resultInfo}>
                      <span className={styles.pageTag}>Seite {item.page}</span>
                      <span style={{ fontSize: '0.85rem' }}>{item.reason}</span>
                    </div>
                    <span>⏭️</span>
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
