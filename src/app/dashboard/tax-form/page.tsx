import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PrintButtonClient as PrintButton } from "@/components/ui/PrintButtonClient"
import { TaxFormPreview } from "@/components/TaxFormPreview"
import { RVBefreiungPreview } from "@/components/RVBefreiungPreview"
import { ZoomableDocument } from "@/components/ui/ZoomableDocument"
import styles from "../../admin/contracts/[userId]/page.module.css"

export default async function TaxFormPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { onboardingStatus: true }
  })

  if (!user) redirect("/login")

  const steps = await prisma.stepProgress.findMany({
    where: { userId },
  })

  const personalDataStep = steps.find(s => s.stepId === 'personal-data' && s.completed)
  const taxDataProgress = steps.find(s => s.stepId === 'tax-data' && s.completed)

  if (!taxDataProgress) {
    redirect("/dashboard")
  }

  let personalData = null
  if (personalDataStep?.data) {
    try {
      personalData = JSON.parse(personalDataStep.data)
    } catch {
      // ignore
    }
  }

  let taxData = null
  if (taxDataProgress.data) {
    try {
      taxData = JSON.parse(taxDataProgress.data)
    } catch {
      // ignore
    }
  }

  const name = personalData ? `${personalData.firstName} ${personalData.lastName}` : "Mitarbeiter/-in"

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <a href="/dashboard" className={styles.backLink}>← Zurück zum Dashboard</a>
      </div>

      <div className={styles.contractHeader}>
        <h2>Dein Personalfragebogen (Vorlage Corinna Czech)</h2>
        <PrintButton 
          className={styles.printBtn} 
          elementId="tax-questionnaire" 
          filename={`Personalfragebogen_Corinna_Czech_${name.replace(/\s/g, '_')}.pdf`}
          label="Als PDF speichern"
        />
      </div>

      <ZoomableDocument id="tax-questionnaire">
        <TaxFormPreview 
          user={user} 
          personalData={personalData} 
          taxData={taxData} 
          taxDataProgressDate={taxDataProgress?.updatedAt} 
          signatureUrl={taxData?.signatureUrl} 
        />
      </ZoomableDocument>

      {taxData?.pensionExemption === 'on' && (
        <>
          <div className={styles.contractHeader} style={{ marginTop: '2rem' }}>
            <h2>Antrag auf RV-Befreiung</h2>
            <PrintButton 
              className={styles.printBtn} 
              elementId="rv-befreiung" 
              filename={`RV_Befreiung_${name.replace(/\s/g, '_')}.pdf`}
              label="Als PDF speichern"
            />
          </div>
          <ZoomableDocument id="rv-befreiung">
            <RVBefreiungPreview 
              firstName={personalData?.firstName || ''}
              lastName={personalData?.lastName || ''}
              svNumber={taxData?.svNumber || ''}
              signDate={taxDataProgress?.updatedAt}
              startDate={user?.startDate}
              signatureUrl={taxData?.signatureUrl}
            />
          </ZoomableDocument>
        </>
      )}
    </div>
  )
}
