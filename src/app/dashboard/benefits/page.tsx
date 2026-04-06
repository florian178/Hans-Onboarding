import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import MemberCard from "./MemberCard"
import styles from "./benefits.module.css"

export default async function BenefitsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = session.user.id!

  // Fetch personal data for Member Card
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  })
  
  const personalProgress = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "personal-data" } }
  })

  const taxProgress = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "tax-data" } }
  })

  let birthDate = null
  let firstName = ""
  let lastName = ""

  if (personalProgress && personalProgress.data) {
    try {
      const pData = JSON.parse(personalProgress.data)
      firstName = pData.firstName || ""
      lastName = pData.lastName || ""
    } catch(e) {}
  }

  if (taxProgress && taxProgress.data) {
    try {
      const tData = JSON.parse(taxProgress.data)
      birthDate = tData.birthDate || null // e.g., "YYYY-MM-DD"
    } catch(e) {}
  }

  // Fallback if no step data
  if (!firstName && !lastName && user?.name) {
    const parts = user.name.split(" ")
    firstName = parts[0]
    lastName = parts.slice(1).join(" ")
  }

  // Fetch active benefits
  const benefits = await prisma.benefit.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  })

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Member Benefits</h1>
          <p className={styles.subtitle}>Deine exklusiven Vorteile als Teil des Teams.</p>
        </div>
        <a href="/dashboard" className={styles.backLink}>← Zurück zum Dashboard</a>
      </header>

      <div className={styles.cardSection}>
        <MemberCard firstName={firstName} lastName={lastName} birthDate={birthDate} />
      </div>

      <div className={styles.benefitsSection}>
        <h2 className={styles.sectionTitle}>Aktuelle Kooperationen & Vorteile</h2>
        <div className={styles.benefitList}>
          {benefits.length === 0 ? (
            <p className={styles.empty}>Momentan sind keine Benefits verfügbar.</p>
          ) : (
            benefits.map((b) => (
              <div key={b.id} className={styles.benefitCard}>
                {b.partnerLogo && (
                  <div className={styles.logoContainer}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.partnerLogo} alt={b.partnerName} className={styles.partnerLogo} />
                  </div>
                )}
                <div className={styles.benefitInfo}>
                  <h3 className={styles.partnerName}>{b.partnerName}</h3>
                  <h4 className={styles.benefitTitle}>{b.title}</h4>
                  <p className={styles.description}>{b.description}</p>
                  {b.discount && (
                    <div className={styles.discountBadge}>
                      {b.discount}
                    </div>
                  )}
                  {b.conditions && (
                    <p className={styles.conditions}>* {b.conditions}</p>
                  )}
                  {b.websiteUrl && (
                    <a 
                      href={b.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.websiteLink}
                    >
                      Webseite besuchen →
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
