import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import ContractFormClient from "./ContractFormClient"
import styles from "./page.module.css"

export default async function ContractStep() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = session.user.id!

  // Check if previous step is completed
  const taxDataProgressCheck = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "tax-data" } }
  })
  if (!taxDataProgressCheck?.completed) {
    redirect("/onboarding/tax-data")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { startDate: true, hourlyWage: true }
  })

  const existingProgress = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "contract" } }
  })

  // Get personal data from step 1
  const personalDataProgress = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "personal-data" } }
  })

  let personalData = null
  if (personalDataProgress?.data) {
    try {
      personalData = JSON.parse(personalDataProgress.data)
    } catch (e) {}
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Arbeitsvertrag unterschreiben</CardTitle>
        <p className={styles.description}>
          Bitte lies dir den Arbeitsvertrag aufmerksam durch und unterschreibe ihn digital am Ende der Seite.
        </p>
      </CardHeader>
      <CardContent>
        {existingProgress?.completed ? (
           <div className={styles.missing}>
             <p>Du hast den Vertrag bereits erfolgreich unterschrieben!</p>
             <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
               <a href="/onboarding/instructions">
                 <Button>Weiter zum nächsten Schritt</Button>
               </a>
             </div>
           </div>
        ) : (
           <ContractFormClient personalData={personalData} startDate={user?.startDate} hourlyWage={user?.hourlyWage || 13.90} />
        )}
      </CardContent>
    </Card>
  )
}
