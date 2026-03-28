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
      // Create a hidden desktop-width clone to enforce correct A4 layout
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
      
      const margin = 15 // 15mm margin
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
      pdf.rect(0, pageHeight - margin, pageWidth, margin, "F") // mask bottom
      
      heightLeft -= usableHeight

      // Additional Pages
      while (heightLeft > 0) {
        position = position - usableHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight)
        
        // mask top and bottom margins
        pdf.setFillColor(255, 255, 255)
        pdf.rect(0, 0, pageWidth, margin, "F")
        pdf.rect(0, pageHeight - margin, pageWidth, margin, "F")
        
        heightLeft -= usableHeight
      }
      
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

