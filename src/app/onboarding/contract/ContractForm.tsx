"use client"

import React, { useState, useTransition } from "react"
import { SignaturePad } from "@/components/ui/SignaturePad"
import { Button } from "@/components/ui/Button"
import { signContract } from "./actions"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import styles from "./ContractForm.module.css"
import { ZoomableDocument } from "@/components/ui/ZoomableDocument"

const getEndDateStr = (startStr?: string | Date | null) => {
  const start = startStr ? new Date(startStr) : new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 7);
  end.setDate(0);
  return end.toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface PersonalData {
  firstName: string
  lastName: string
  address: string
  zipCode: string
  city: string
  iban?: string
}

interface ContractFormProps {
  personalData: PersonalData | null
  startDate?: Date | null
  hourlyWage: number
}

function ContractText({ name, addressLine, today, startDate, personalData, hourlyWage }: { name: string, addressLine: string, today: string, startDate: string | null, personalData: PersonalData | null, hourlyWage: number }) {
  return (
    <div className={styles.contractText} id="contract-content">
      <div className={styles.documentLogo}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Hans im Club Logo" />
      </div>
      <h2>Arbeitsvertrag für eine geringfügige Beschäftigung (Minijob)</h2>
      <p>
        zwischen<br/>
        HS Event GmbH, Schützenplatz 14, 01067 Dresden<br/>
        – nachfolgend „Arbeitgeber“ –
      </p>
      <p>und</p>
      <p>
        <strong>{name}</strong>, {addressLine}<br/>
        – nachfolgend „Arbeitnehmer“ –
      </p>
      <p>wird folgender Arbeitsvertrag geschlossen:</p>

      <h3>§1 Beginn des Arbeitsverhältnisses</h3>
      <p>Das Arbeitsverhältnis beginnt am {startDate || '18.03.2026'}.</p>

      <h3>§2 Vertragsdauer</h3>
      <p>Das Arbeitsverhältnis wird auf unbestimmte Zeit geschlossen.<br/>
      Die ersten 3 Monate gelten als Probezeit. Während dieser Zeit kann das Arbeitsverhältnis mit einer Frist von 2 Wochen gekündigt werden.</p>

      <h3>§3 Tätigkeit und Arbeitsort</h3>
      <p>Der Arbeitnehmer wird als Servicekraft / Barkraft im Betrieb<br/>
      „Hans im Club“, Wallstraße 11, 01067 Dresden eingesetzt.<br/>
      Der Arbeitgeber ist berechtigt, dem Arbeitnehmer andere gleichwertige und zumutbare Tätigkeiten zuzuweisen.</p>

      <h3>§4 Vergütung</h3>
      <p>Der Arbeitnehmer erhält einen Stundenlohn in Höhe von {hourlyWage.toFixed(2).replace('.', ',')} € brutto.<br/>
      Die Beschäftigung erfolgt im Rahmen eines geringfügigen Beschäftigungsverhältnisses gemäß § 8 SGB IV.<br/>
      Das regelmäßige monatliche Arbeitsentgelt darf die gesetzliche Geringfügigkeitsgrenze (derzeit 603 €) nicht überschreiten.<br/>
      Die Auszahlung erfolgt jeweils zum 15. des Folgemonats auf ein vom Arbeitnehmer benanntes Konto: IBAN {personalData?.iban || '_______________________'}.<br/>
      Der Arbeitgeber führt die pauschalen Abgaben zur Sozialversicherung an die Minijob-Zentrale ab.</p>

      <h3>§5 Arbeitszeit (Arbeit auf Abruf)</h3>
      <p>Die Beschäftigung erfolgt nach Bedarf des Arbeitgebers.<br/>
      Die monatliche Arbeitszeit beträgt maximal 43 Stunden.<br/>
      Die Einsätze erfolgen in der Regel zu folgenden Zeiten:</p>
      <ul>
        <li>Mittwoch: 22:00 – 05:00 Uhr</li>
        <li>Freitag: 22:00 – 05:00 Uhr</li>
        <li>Samstag: 22:00 – 05:00 Uhr</li>
        <li>Feiertage: 22:00 – 05:00 Uhr</li>
      </ul>
      <p>Beginn und Ende der täglichen Arbeitszeit richten sich nach den betrieblichen Erfordernissen.</p>

      <h3>§6 Urlaub</h3>
      <p>Der Arbeitnehmer hat Anspruch auf den gesetzlichen Mindesturlaub.<br/>
      Die Urlaubstage werden anteilig entsprechend der tatsächlichen Arbeitstage berechnet.</p>

      <h3>§7 Krankheit</h3>
      <p>Der Arbeitnehmer ist verpflichtet, dem Arbeitgeber eine Arbeitsunfähigkeit unverzüglich mitzuteilen.<br/>
      Spätestens am dritten Kalendertag ist eine ärztliche Bescheinigung vorzulegen.<br/>
      Im Übrigen gelten die gesetzlichen Vorschriften zur Entgeltfortzahlung im Krankheitsfall.</p>

      <h3>§8 Verschwiegenheit</h3>
      <p>Der Arbeitnehmer verpflichtet sich, über alle Betriebs- und Geschäftsgeheimnisse auch nach Beendigung des Arbeitsverhältnisses Stillschweigen zu bewahren.</p>

      <h3>§9 Nebentätigkeit</h3>
      <p>Eine Nebentätigkeit ist dem Arbeitgeber vorher anzuzeigen und bedarf dessen Zustimmung, sofern berechtigte betriebliche Interessen betroffen sind.</p>

      <h3>§10 Rentenversicherung (Minijob)</h3>
      <p>Der Arbeitnehmer wird darauf hingewiesen, dass grundsätzlich Rentenversicherungspflicht besteht.<br/>
      Er kann sich auf Antrag von der Rentenversicherungspflicht befreien lassen. Der Antrag ist schriftlich gegenüber dem Arbeitgeber zu erklären.</p>

      <h3>§11 Kassen- und Kontrollregelung</h3>
      <p>Der Arbeitnehmer ist verpflichtet, sorgfältig mit Bargeld und Betriebseigentum umzugehen.<br/>
      Taschen- und Personenkontrollen sind ausschließlich in begründeten Einzelfällen zulässig, wenn ein konkreter Verdacht auf Pflichtverletzungen besteht.<br/>
      Dabei sind die Persönlichkeitsrechte des Arbeitnehmers zu wahren.<br/>
      Für vorsätzlich oder grob fahrlässig verursachte Kassendifferenzen haftet der Arbeitnehmer im Rahmen der gesetzlichen Vorschriften.</p>

      <h3>§12 Alkohol- und Drogenverbot</h3>
      <p>Dem Arbeitnehmer ist es untersagt, während der Arbeitszeit sowie vor Dienstantritt in einem Zustand zu erscheinen, der seine Arbeitsfähigkeit beeinträchtigt, insbesondere durch Alkohol oder andere berauschende Mittel.<br/>
      Bei Verstößen ist der Arbeitgeber berechtigt, den Arbeitnehmer von der Arbeitsleistung auszuschließen.<br/>
      Weitere arbeitsrechtliche Maßnahmen (insbesondere Abmahnung oder Kündigung) bleiben vorbehalten.</p>

      <h3>§13 Verhalten bei Nichterscheinen (No-Show)</h3>
      <p>Der Arbeitnehmer ist verpflichtet, vereinbarte Arbeitseinsätze wahrzunehmen.<br/>
      Ist ihm die Arbeitsaufnahme nicht möglich, hat er den Arbeitgeber unverzüglich zu informieren.<br/>
      Ein unentschuldigtes Nichterscheinen stellt eine erhebliche Pflichtverletzung dar und kann arbeitsrechtliche Konsequenzen nach sich ziehen (insbesondere Abmahnung oder Kündigung).<br/>
      Verursacht der Arbeitnehmer durch schuldhaftes Nichterscheinen einen nachweisbaren Schaden, ist er im Rahmen der gesetzlichen Vorschriften zum Ersatz verpflichtet.</p>

      <h3>§14 Kündigung</h3>
      <p>Nach Ablauf der Probezeit gelten die gesetzlichen Kündigungsfristen gemäß § 622 BGB.<br/>
      Die Kündigung bedarf der Schriftform.</p>

      <h3>§15 Ausschlussfristen</h3>
      <p>Ansprüche aus dem Arbeitsverhältnis verfallen, wenn sie nicht innerhalb von 3 Monaten nach Fälligkeit schriftlich geltend gemacht werden.</p>

      <h3>§16 Schlussbestimmungen</h3>
      <p>Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform.<br/>
      Sollte eine Bestimmung dieses Vertrages unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</p>
      
      <br/>
      <p>Dresden, {today}</p>
      <p>Ort, Datum</p>
    </div>
  )
}

export function ContractForm({ personalData, startDate, hourlyWage }: ContractFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSign = (dataUrl: string) => {
    startTransition(async () => {
      try {
        const result = await signContract(dataUrl)
        if (result.success) {
          setSignedUrl(result.url)
        }
      } catch (e: unknown) {
        setError("Fehler beim Speichern der Unterschrift: " + (e as Error).message)
      }
    })
  }

  const handleDownloadPdf = async () => {
    const element = document.getElementById("contract-preview")
    if (!element) return

    setIsGenerating(true)
    try {
      // Create a hidden desktop-width clone to enforce correct A4 layout regardless of device viewport
      const clone = element.cloneNode(true) as HTMLElement
      const wrapper = document.createElement("div")
      wrapper.style.position = "absolute"
      wrapper.style.left = "-9999px"
      wrapper.style.top = "0"
      wrapper.style.width = "794px" // A4 width at 96dpi
      wrapper.style.backgroundColor = "#ffffff"
      wrapper.appendChild(clone)
      document.body.appendChild(wrapper)

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794,
      })
      
      document.body.removeChild(wrapper)

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      
      const margin = 15
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const usableWidth = pageWidth - 2 * margin
      const usableHeight = pageHeight - 2 * margin
      
      // Calculate total image height in mm
      const imgHeightMM = (canvas.height * usableWidth) / canvas.width
      
      // Calculate how many pixels correspond to one page of usable height
      const pxPerMM = canvas.width / usableWidth
      const pageHeightPx = Math.floor(usableHeight * pxPerMM)
      
      let pageCount = 0
      let yOffset = 0
      
      while (yOffset < canvas.height) {
        if (pageCount > 0) pdf.addPage()
        
        const sliceHeight = Math.min(pageHeightPx, canvas.height - yOffset)
        
        // Create a canvas slice for this page
        const pageCanvas = document.createElement("canvas")
        pageCanvas.width = canvas.width
        pageCanvas.height = sliceHeight
        const ctx = pageCanvas.getContext("2d")!
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
        ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)
        
        const pageImgData = pageCanvas.toDataURL("image/png")
        const sliceHeightMM = (sliceHeight * usableWidth) / canvas.width
        
        pdf.addImage(pageImgData, "PNG", margin, margin, usableWidth, sliceHeightMM)
        
        yOffset += pageHeightPx
        pageCount++
      }
      
      pdf.save("Arbeitsvertrag.pdf")
    } catch (e) {
      console.error("PDF generation error", e)
      alert("Fehler bei der PDF-Erzeugung. Bitte nutzen Sie die Drucken-Funktion Ihres Browsers.")
    } finally {
      setIsGenerating(false)
    }
  }

  const name = personalData ? `${personalData.firstName} ${personalData.lastName}` : "Mitarbeiter/-in"
  const addressLine = personalData ? `${personalData.address}, ${personalData.zipCode} ${personalData.city}` : "Adresse"
  
  // Date formatting for the dynamic dates.
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const startDateStr = startDate ? new Date(startDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null

  if (signedUrl) {
    return (
      <div className={`${styles.container} ${styles.signedState}`}>
        <div className={styles.successMessage}>
          <p>✓ Vertrag erfolgreich unterschrieben!</p>
          <div className={styles.finalActions}>
            <Button variant="outline" onClick={handleDownloadPdf} disabled={isGenerating}>
              {isGenerating ? "Wird erstellt..." : "Download"}
            </Button>
            <a href="/onboarding/instructions">
              <Button>Weiter zum nächsten Schritt</Button>
            </a>
          </div>
          <div className={styles.secondaryActions}>
            <Button variant="ghost" size="sm" onClick={() => setSignedUrl(null)}>
              Unterschrift ändern
            </Button>
            <a href="/onboarding/tax-data/sign">
              <Button variant="ghost" size="sm">Daten korrigieren / Zurück</Button>
            </a>
          </div>
        </div>

        <ZoomableDocument id="contract-preview">
          <div style={{ padding: '4rem 3.5rem' }}>
          <ContractText name={name} addressLine={addressLine} today={today} startDate={startDateStr} personalData={personalData} hourlyWage={hourlyWage} />
          
          <div className={styles.signatureRow}>
             <div className={styles.sigContainer}>
               <div className={styles.employerSigPlaceHolder} style={{ fontSize: '12px' }}>
                 HS Event GmbH vertreten durch Geschäftsführer Florian Herbst
               </div>
               <div className={styles.signatureLine}></div>
               <p className={styles.label}>Unterschrift Arbeitgeber</p>
             </div>
             <div className={styles.sigContainer}>
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={signedUrl} alt="Digitale Unterschrift" className={styles.finalSignature} />
               <div className={styles.signatureLine}></div>
               <p className={styles.label}>Unterschrift Arbeitnehmer</p>
             </div>
          </div>
          </div>
        </ZoomableDocument>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}
      
      <ZoomableDocument id="contract-preview">
        <div style={{ padding: '4rem 3.5rem' }}>
          <ContractText name={name} addressLine={addressLine} today={today} startDate={startDateStr} personalData={personalData} hourlyWage={hourlyWage} />
        </div>
      </ZoomableDocument>

      <div className={styles.signatureSection}>
        <div className={styles.sectionHeader}>
          <h4>Bitte hier digital unterschreiben:</h4>
          <a href="/onboarding/tax-data/sign">
            <Button variant="ghost" size="sm" className={styles.backBtn}>Zurück zum Personalfragebogen</Button>
          </a>
        </div>
        {isPending ? (
          <p className={styles.loading}>Vertrag wird gespeichert...</p>
        ) : (
          <SignaturePad onSign={handleSign} />
        )}
      </div>
    </div>
  )
}
