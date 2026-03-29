"use server"

import { Resend } from "resend"
import { prisma } from "@/lib/prisma"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDocumentsToAdvisor(
  userId: string,
  employeeName: string,
  attachments: { filename: string; content: string }[]
) {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured on the server.")
    }

    if (!attachments || attachments.length === 0) {
      throw new Error("Keine Dokumente zum Versenden vorhanden.")
    }

    // Convert data URIs to plain base64 strings if necessary
    const cleanedAttachments = attachments.map(att => {
      let b64 = att.content
      if (b64.includes("base64,")) {
        b64 = b64.split("base64,")[1]
      }
      return {
        filename: att.filename,
        content: b64,
      }
    })

    const data = await resend.emails.send({
      from: "onboarding@hansimclub.de",
      replyTo: "onboarding@hansimclub.de",
      to: "hallo@hansimclub.de",
      subject: `Neue Mitarbeiter-Unterlagen: ${employeeName}`,
      html: `
        <p>Hallo,</p>
        <p>anbei übersenden wir die vollständig digital signierten Unterlagen für unseren neuen Mitarbeiter <strong>${employeeName}</strong>.</p>
        <p>Bitte prüfen und in die Lohnbuchhaltung aufnehmen.</p>
        <br/>
        <p>Mit freundlichen Grüßen,<br/>Das Onboarding-System</p>
      `,
      attachments: cleanedAttachments,
    })

    if (data.error) {
      console.error("[sendDocumentsToAdvisor] Resend Error:", data.error)
      return { success: false, error: data.error.message }
    }

    // Erfolgreicher Versand -> Track im onboarding system
    await prisma.stepProgress.upsert({
      where: { userId_stepId: { userId, stepId: 'advisor-sent' } },
      create: { 
        userId, 
        stepId: 'advisor-sent', 
        completed: true 
      },
      update: { 
        updatedAt: new Date() 
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error("[sendDocumentsToAdvisor] Error:", error)
    return { success: false, error: error.message || "Unbekannter Fehler beim Versand" }
  }
}
