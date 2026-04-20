import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { InstructionsForm } from "./InstructionsForm"
import styles from "./page.module.css"

export default async function InstructionsStep() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = session.user.id!

  // Check if previous step is completed
  const contractProgressCheck = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "contract" } }
  })
  if (!contractProgressCheck?.completed) {
    redirect("/onboarding/contract")
  }

  const instructions = await prisma.document.findMany({
    where: { type: "INSTRUCTION", userId: null },
    orderBy: { uploadedAt: "desc" }
  })

  const existingProgress = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "instructions" } }
  })

  let signature = ""
  if (existingProgress?.data) {
    try {
      signature = JSON.parse(existingProgress.data).signature || ""
    } catch {
      // Ignored
    }
  }

  const personalDataProgress = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "personal-data" } }
  })
  let employeeName = "Mitarbeiter/-in"
  if (personalDataProgress?.data) {
    try {
      const data = JSON.parse(personalDataProgress.data)
      if (data.firstName && data.lastName) {
        employeeName = `${data.firstName} ${data.lastName}`
      }
    } catch {
      // Ignored
    }
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Richtlinien & Belehrungen</CardTitle>
        <p className={styles.description}>
          Bitte lies dir die folgenden Dokumente aufmerksam durch und bestätige anschließend die Kenntnisnahme.
        </p>
      </CardHeader>
      <CardContent>
        <InstructionsForm 
          instructions={instructions}
          employeeName={employeeName}
          existingSignature={signature}
        />
      </CardContent>
    </Card>
  )
}

