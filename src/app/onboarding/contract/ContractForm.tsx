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
  end.setMonth(end.getMonth() + 6);
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
}

function ContractText({ name, addressLine, today, startDate, personalData }: { name: string, addressLine: string, today: string, startDate: string | null, personalData: PersonalData | null }) {
  return (
    <div className={styles.contractText} id="contract-content">
      <div className={styles.documentLogo}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Hans im Club Logo" />
      </div>
      <h2>Arbeitsvertrag einer geringfügigen Beschäftigung</h2>
      <p>
        Zwischen HS Event GmbH, Schützenplatz 14, 01067 Dresden<br/>
        (Name und Adresse des Arbeitgebers) - nachfolgend „Arbeitgeber“ genannt -
      </p>
      <p>und</p>
      <p>
        <strong>{name}</strong>, {addressLine}<br/>
        - nachfolgend „Arbeitnehmer/-in“ genannt -
      </p>
      <p>wird folgender Arbeitsvertrag geschlossen:</p>

      <h3>§ 1 Arbeitsverhältnis</h3>
      <p>Das Arbeitsverhältnis beginnt am {startDate || '18.03.2026'}. Der Arbeitnehmer wird im Rahmen eines geringfügigen Beschäftigungsverhältnisses auf Anfrage bis zu 603 Euro beschäftigt.</p>

      <h3>§ 2 Vertragsdauer</h3>
      <p>Das Arbeitsverhältnis wird auf befristete Zeit geschlossen, einschließlich bis zum {getEndDateStr(startDate)}. Nach Ablauf der Frist verlängert sich der Arbeitsvertrag automatisch um jeweils einen Monat bis zur Kündigung.</p>

      <h3>§ 3 Tätigkeit und Aufgabengebiet</h3>
      <p>Der Arbeitnehmer/ die Arbeitnehmerin wird als Servicekraft/ Barkraft im “Hans im Club”, Wallstraße 11, 01067 Dresden, eingestellt.</p>

      <h3>§ 4 Arbeitsvergütung</h3>
      <p>Der Arbeitnehmer/ die Arbeitnehmerin erhält einen Stundenlohn von 13,90€/h (höchstens 603 Euro). Die Vergütung wird jeweils am 15. des Folgemonats zahlbar auf das vom Arbeitnehmer angegebene Konto überwiesen: IBAN {personalData?.iban || '_______________________'}.</p>
      <p>Der Arbeitgeber leistet die Pauschalabgabe in der jeweils gesetzlich geschuldeten Höhe an die zentrale Einzugsstelle (Bundesknappschaft).</p>

      <h3>§ 5 Arbeitszeit</h3>
      <p>Der Arbeitnehmer/ die Arbeitnehmerin arbeitet beim Arbeitgeber auf Anfrage<br/>
      Die regelmäßige monatliche Arbeitszeit beträgt maximal 43,38h Stunden.</p>
      <p>Die grundsätzliche Verteilung der wöchentlichen Arbeitszeit erfolgt in der Regel an Wochentagen und Zeiten:</p>
      <ul>
        <li>Mittwoch: 22:00 Uhr bis 05:00 Uhr</li>
        <li>Freitag: 22:00 Uhr bis 05:00 Uhr</li>
        <li>Samstag: 22:00 Uhr bis 05:00 Uhr</li>
        <li>Feiertage: 22:00 Uhr bis 05:00 Uhr</li>
      </ul>

      <h3>§ 6 Krankheit</h3>
      <p>Die Arbeitsunfähigkeit ist dem Arbeitgeber unverzüglich mitzuteilen. Außerdem ist vor Ablauf des dritten Kalendertags nach Beginn der Erkrankung eine ärztliche Bescheinigung über die Arbeitsunfähigkeit und deren voraussichtliche Dauer vorzulegen.</p>

      <h3>§ 8 Verschwiegenheitspflicht</h3>
      <p>Der Arbeitnehmer/ die Arbeitnehmerin verpflichtet sich, während der Dauer des Arbeitsverhältnisses und auch nach dem Ausscheiden, über alle Betriebs- und Geschäftsgeheimnisse Stillschweigen zu bewahren.</p>

      <h3>§ 9 Nebentätigkeit</h3>
      <p>Jede entgeltliche oder das Arbeitsverhältnis beeinträchtigende Nebenbeschäftigung ist nur mit Zustimmung des Arbeitgebers zulässig.</p>

      <h3>§10 Hinweis bzgl. des Verzichts auf Rentenversicherungsfreiheit</h3>
      <p>Der Arbeitnehmer hat die Möglichkeit, jederzeit durch schriftliche Erklärung gegenüber dem Arbeitgeber auf seine Versicherungsfreiheit in der gesetzlichen Rentenversicherung zu verzichten. Der Verzicht kann nur für die Zukunft und im Falle der Ausübung mehrerer geringfügiger Beschäftigungen nur einheitlich für alle Beschäftigungen erklärt werden.</p>
      <p>Wird der Verzicht erklärt, ist der Arbeitnehmer verpflichtet, den gesetzlichen Pauschalbeitrag zur Rentenversicherung von 15 % des Arbeitsentgelts auf den jeweils geltenden Rentenversicherungsbeitrag aufzustocken. Durch diese eigenen Zuzahlungen werden volle Leistungsansprüche in der Rentenversicherung erworben.</p>

      <h3>§11 Sonstige Bestimmungen</h3>
      <p>Während der Arbeit darf der Arbeitnehmer/ die Arbeitnehmerin maximal 50,00€ Bargeld mit sich führen. Wenn ein Mitarbeiter aus irgendeinem Grund an einem bestimmten Arbeitstag über mehr Bargeld verfügt, ist er verpflichtet, dies zu melden. Der Mitarbeiter ist mit stichprobenartigen Kontrollen von Taschen oder Jacken einverstanden.</p>
      
      <br/>
      <p>Dresden, {today}</p>
      <p>Ort, Datum</p>
    </div>
  )
}

export function ContractForm({ personalData, startDate }: ContractFormProps) {
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
      
      const imgHeight = (canvas.height * usableWidth) / canvas.width
      
      let position = margin
      let heightLeft = imgHeight

      // Page 1
      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight)
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, pageHeight - margin, pageWidth, margin, "F")
      
      heightLeft -= usableHeight

      // Additional Pages
      while (heightLeft > 0) {
        position = position - usableHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight)
        pdf.setFillColor(255, 255, 255)
        pdf.rect(0, 0, pageWidth, margin, "F")
        pdf.rect(0, pageHeight - margin, pageWidth, margin, "F")
        heightLeft -= usableHeight
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
          <ContractText name={name} addressLine={addressLine} today={today} startDate={startDateStr} personalData={personalData} />
          
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
      
      <div className={styles.contractPreview}>
        <ContractText name={name} addressLine={addressLine} today={today} startDate={startDateStr} personalData={personalData} />
      </div>

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
