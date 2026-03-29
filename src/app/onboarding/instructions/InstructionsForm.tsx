"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { SignaturePad } from "@/components/ui/SignaturePad"
import { FireSafetyPreview } from "@/components/FireSafetyPreview"
import { confirmInstructionsAction } from "./actions"
import styles from "./page.module.css"

interface InstructionsFormProps {
  instructions: any[]
  employeeName: string
  existingSignature: string
}

export function InstructionsForm({ instructions, employeeName, existingSignature }: InstructionsFormProps) {
  const router = useRouter()
  const [signature, setSignature] = useState(existingSignature)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [readConfirm, setReadConfirm] = useState(!!existingSignature)
  const [showResign, setShowResign] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!readConfirm) return alert("Bitte bestätigen Sie die Kenntnisnahme.")
    if (!signature) return alert("Bitte leisten Sie eine Unterschrift.")

    setIsSubmitting(true)
    try {
      await confirmInstructionsAction(signature)
      router.push("/onboarding/video")
    } catch (error) {
      console.error(error)
      alert("Fehler beim Speichern der Unterschrift.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignature = (dataUrl: string) => {
    setSignature(dataUrl)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.contentArea}>
        {instructions.length > 0 ? (
          <div className={styles.docsList}>
            {instructions.map((doc) => (
              <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className={styles.docLink}>
                <div className={styles.docItem}>
                  <span className={styles.docIcon}>📄</span>
                  <span className={styles.docName}>{doc.name}</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
           <div className={styles.missing}>
             <p>Aktuell sind keine allgemeinen Belehrungen als PDF hinterlegt.</p>
           </div>
        )}

        <div style={{ marginTop: '40px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>Mitarbeiterbelehrung Brandschutz</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
            Bitte lies dir die folgende Brandschutzbelehrung aufmerksam durch. Deine Unterschrift am Ende dieses Formulars gilt als Bestätigung für alle obenstehenden Dokumente sowie die folgende Brandschutzbelehrung.
          </p>
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', height: '500px', overflowY: 'auto' }}>
             <FireSafetyPreview 
                employeeName={employeeName} 
                signatureUrl={signature} 
                signatureDate={new Date()} 
             />
          </div>
        </div>

        <div className={styles.confirmSection}>
          <div className={styles.checkboxWrapper} style={{ marginBottom: '20px' }}>
            <input 
              type="checkbox" 
              id="readConfirm" 
              className={styles.checkbox} 
              checked={readConfirm}
              onChange={(e) => setReadConfirm(e.target.checked)}
              required 
            />
            <label htmlFor="readConfirm" className={styles.checkboxLabel}>
              Ich bestätige, dass ich alle oben aufgeführten Dokumente, Anweisungen sowie die Mitarbeiterbelehrung Brandschutz vollständig gelesen und verstanden habe. Ich verpflichte mich, die Hinweise im Arbeitsalltag umzusetzen.
            </label>
          </div>

          <div className={styles.signatureWrapper} style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '1rem', fontWeight: '500' }}>Digitale Unterschrift</h3>
            {signature && !showResign ? (
              <div>
                <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '4px', backgroundColor: '#f9f9f9', marginBottom: '10px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={signature} alt="Unterschrift" style={{ maxHeight: '100px' }} />
                </div>
                <Button type="button" variant="outline" onClick={() => setShowResign(true)}>
                  Erneut unterschreiben
                </Button>
              </div>
            ) : (
              <SignaturePad onSign={handleSignature} />
            )}
          </div>

          <div className={styles.actions}>
            <Button type="submit" disabled={isSubmitting || !signature || !readConfirm}>
              {existingSignature ? 'Speichern & Weiter' : 'Bestätigen & Weiter'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
