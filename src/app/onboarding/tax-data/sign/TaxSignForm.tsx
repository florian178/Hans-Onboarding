"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { SignaturePad } from "@/components/ui/SignaturePad"
import { Button } from "@/components/ui/Button"
import { TaxFormPreview } from "@/components/TaxFormPreview"
import { signTaxForm } from "./actions"
import styles from "../../contract/ContractForm.module.css"

interface TaxSignFormProps {
  user: any
  personalData: any
  taxData: any
  taxDataProgress?: any
}

export function TaxSignForm({ user, personalData, taxData, taxDataProgress }: TaxSignFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  // If we already signed it in a previous session, we might want to just show the success state.
  // But usually this step is "sign and continue". We'll just check if signatureUrl is there.
  const [signedUrl, setSignedUrl] = useState<string | null>(taxData?.signatureUrl || null)

  const handleSign = (dataUrl: string) => {
    startTransition(async () => {
      try {
        const result = await signTaxForm(dataUrl)
        if (result.success) {
          setSignedUrl(result.url)
          // Also pre-fetch the next route
          router.replace("/onboarding/contract")
        }
      } catch (e: unknown) {
        setError("Fehler beim Speichern der Unterschrift: " + (e as Error).message)
      }
    })
  }

  if (signedUrl) {
    return (
      <div className={`${styles.container} ${styles.signedState}`}>
        <div className={styles.successMessage}>
          <p>✓ Personalfragebogen erfolgreich unterschrieben!</p>
          <div className={styles.finalActions}>
            <Button onClick={() => router.push("/onboarding/contract")}>Weiter zum Arbeitsvertrag</Button>
          </div>
          <div className={styles.secondaryActions}>
            <Button variant="ghost" size="sm" onClick={() => setSignedUrl(null)}>
              Unterschrift ändern
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/onboarding/tax-data")}>
              Daten korrigieren
            </Button>
          </div>
        </div>

        <div className={styles.contractPreview} style={{ padding: 0 }}>
          <TaxFormPreview 
            user={user} 
            personalData={personalData} 
            taxData={{...taxData, signatureUrl: signedUrl}} 
            taxDataProgressDate={taxDataProgress?.updatedAt || new Date()} 
            signatureUrl={signedUrl}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.contractPreview} style={{ padding: 0 }}>
        <TaxFormPreview 
          user={user} 
          personalData={personalData} 
          taxData={taxData} 
          taxDataProgressDate={taxDataProgress?.updatedAt || new Date()} 
        />
      </div>

      <div className={styles.signatureSection}>
        <div className={styles.sectionHeader}>
          <h4>Bitte überprüfe deine Angaben und unterschreibe hier digital:</h4>
          <Button variant="ghost" size="sm" className={styles.backBtn} onClick={() => router.push("/onboarding/tax-data")}>
            Daten korrigieren / Zurück
          </Button>
        </div>
        
        {isPending ? (
          <p className={styles.loading}>Dokument wird gespeichert...</p>
        ) : (
          <SignaturePad onSign={handleSign} />
        )}
      </div>
    </div>
  )
}
