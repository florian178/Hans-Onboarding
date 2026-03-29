"use client"

import React, { useState } from "react"
import { Button } from "./Button"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { sendDocumentsToAdvisor } from "@/app/admin/adminActions"
import { FiMail, FiCheckCircle, FiLoader, FiAlertTriangle } from "react-icons/fi"

export function SendToAdvisorButton({ 
  userId, 
  employeeName, 
  className 
}: { 
  userId: string
  employeeName: string
  className?: string 
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const generatePdfBase64 = async (elementId: string): Promise<string | null> => {
    const element = document.getElementById(elementId)
    if (!element) return null

    try {
      const clone = element.cloneNode(true) as HTMLElement
      const wrapper = document.createElement("div")
      wrapper.style.position = "absolute"
      wrapper.style.left = "-9999px"
      wrapper.style.top = "0"
      wrapper.style.width = "794px"
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

      const pdf = new jsPDF("p", "mm", "a4")
      const margin = 15
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const usableWidth = pageWidth - 2 * margin
      const usableHeight = pageHeight - 2 * margin
      
      const imgHeight = (canvas.height * usableWidth) / canvas.width
      const imgData = canvas.toDataURL("image/jpeg", 0.95) // Use JPEG to reduce size
      
      let heightLeft = imgHeight
      let position = margin

      pdf.addImage(imgData, "JPEG", margin, position, usableWidth, imgHeight)
      heightLeft -= usableHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + margin
        pdf.addPage()
        pdf.addImage(imgData, "JPEG", margin, position, usableWidth, imgHeight)
        heightLeft -= usableHeight
      }

      return pdf.output("datauristring")
    } catch (e) {
      console.error("PDF Generation error for", elementId, e)
      return null
    }
  }

  const handleSend = async () => {
    setIsGenerating(true)
    setErrorMsg(null)
    setSuccess(false)

    try {
      // Collect base64 for all 3 documents if they exist
      const attachments = []

      // 1. Personalfragebogen
      const taxPdf = await generatePdfBase64("tax-questionnaire")
      if (taxPdf) {
        attachments.push({
          filename: `Personalfragebogen_${employeeName.replace(/\\s/g, '_')}.pdf`,
          content: taxPdf
        })
      }

      // 2. Arbeitsvertrag
      const contractPdf = await generatePdfBase64("contract-preview")
      if (contractPdf) {
        attachments.push({
          filename: `Arbeitsvertrag_${employeeName.replace(/\\s/g, '_')}.pdf`,
          content: contractPdf
        })
      }

      // 3. RV-Befreiung (optional)
      const rvPdf = await generatePdfBase64("rv-befreiung")
      if (rvPdf) {
        attachments.push({
          filename: `RV_Befreiung_${employeeName.replace(/\\s/g, '_')}.pdf`,
          content: rvPdf
        })
      }

      if (attachments.length === 0) {
        throw new Error("Keine sichtbaren Dokumente zur Generierung gefunden.")
      }

      // Send to server layout
      const result = await sendDocumentsToAdvisor(userId, employeeName, attachments)
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 5000)
      } else {
        throw new Error(result.error || "Versand via Resend fehlgeschlagen")
      }
      
    } catch (err: any) {
      setErrorMsg(err.message || "Fehler beim Erstellen der Dokumente.")
    } finally {
      setIsGenerating(false)
    }
  }

  if (success) {
    return (
      <Button variant="outline" className={className} style={{ backgroundColor: '#e6ffe6', borderColor: '#00cc00', color: '#006600' }} disabled>
        <FiCheckCircle className="w-4 h-4 mr-2" />
        Erfolgreich an Steuerbüro gesendet!
      </Button>
    )
  }

  if (errorMsg) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Button variant="outline" className={className} onClick={handleSend} disabled={isGenerating}>
          {isGenerating ? <FiLoader className="w-4 h-4 mr-2 animate-spin" /> : <FiMail className="w-4 h-4 mr-2" />}
          {isGenerating ? "Generiere..." : "Erneut an Steuerbüro senden"}
        </Button>
        <div style={{ color: 'red', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
          <FiAlertTriangle className="w-4 h-4 mr-1" />
          {errorMsg}
        </div>
      </div>
    )
  }

  return (
    <Button onClick={handleSend} disabled={isGenerating} className={className}>
      {isGenerating ? (
        <><FiLoader className="w-4 h-4 mr-2 animate-spin" /> Generiere PDFs ({employeeName})...</>
      ) : (
        <><FiMail className="w-4 h-4 mr-2" /> An Steuerberater senden</>
      )}
    </Button>
  )
}
