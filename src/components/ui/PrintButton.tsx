"use client"

import React, { useState } from "react"
import { Button } from "./Button"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

export function PrintButton({ className, label = "Als PDF herunterladen" }: { className?: string, label?: string }) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownloadPdf = async () => {
    const element = document.getElementById("contract-preview")
    if (!element) {
      alert("Vertrag konnte nicht gefunden werden.")
      return
    }

    setIsGenerating(true)
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      })
      
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save("Arbeitsvertrag.pdf")
    } catch (e) {
      console.error("PDF generation error", e)
      alert("Fehler bei der PDF-Erzeugung. Bitte nutzen Sie stattdessen die Drucken-Funktion Ihres Browsers.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      className={className} 
      onClick={handleDownloadPdf}
      disabled={isGenerating}
    >
      {isGenerating ? "PDF wird generiert..." : label}
    </Button>
  )
}

