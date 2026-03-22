import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import styles from "./page.module.css"

export default async function SuccessPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const status = await prisma.onboardingStatus.findUnique({
    where: { userId: session.user.id! }
  })

  if (status?.status !== "COMPLETED") {
    redirect("/onboarding")
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader>
          <div className={styles.iconContainer}>
            <span className={styles.icon}>🎉</span>
          </div>
          <CardTitle className={styles.title}>Glückwunsch!</CardTitle>
        </CardHeader>
        <CardContent className={styles.content}>
          <p className={styles.message}>
            Du hast alle Schritte des Onboardings erfolgreich abgeschlossen!
          </p>
          <p className={styles.message}>
            Dein Administrator wurde benachrichtigt. Du bist nun bereit für deinen Einsatz in der Diskothek.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
            <a href="/dashboard">
              <Button>Zum Mitarbeiterportal</Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
