import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { VideoPlayer } from "./VideoPlayer"
import styles from "./page.module.css"

export default async function VideoStep() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = session.user.id!

  const videos = await prisma.document.findMany({
    where: { type: "VIDEO", userId: null },
    orderBy: { uploadedAt: "desc" }
  })

  const existingProgress = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "video" } }
  })

  // We take the first video if multiple exist, or map over them.
  // For simplicity, we just use the most recently uploaded video.
  const video = videos[0]

  async function completeVideoStep() {
    "use server"
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    await prisma.stepProgress.upsert({
      where: { userId_stepId: { userId: session.user.id!, stepId: "video" } },
      create: { userId: session.user.id!, stepId: "video", completed: true },
      update: { completed: true }
    })

    await prisma.onboardingStatus.update({
      where: { userId: session.user.id! },
      data: { status: "COMPLETED" }
    })

    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: "onboarding@resend.dev", // Using the safe resend.dev test domain to prevent API crashes
          to: "admin@diskothek.demo", // In production this would query Admin users
          subject: `Onboarding abgeschlossen: ${session.user.name || session.user.email}`,
          html: `<p>Der Mitarbeiter ${session.user.name || session.user.email} hat das Onboarding erfolgreich abgeschlossen.</p>`,
        })
      } catch (e) {
        console.error("Failed to send completion email", e)
        // We swallow this error so the user can finish onboarding even if Email API is misconfigured
      }
    }

    redirect("/onboarding/success")
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Sicherheits- und Einweisungsvideo</CardTitle>
        <p className={styles.description}>
          Bitte schau dir das folgende Video vollständig an. Der &quot;Onboarding Abschließen&quot; Button wird erst aktiv, wenn das Video beendet ist.
        </p>
      </CardHeader>
      <CardContent>
        {video ? (
          <VideoPlayer 
            videoUrl={video.url} 
            isAlreadyCompleted={existingProgress?.completed || false} 
            onComplete={completeVideoStep} 
          />
        ) : (
          <div className={styles.missing}>
             <p>Es wurde aktuell kein Einweisungsvideo hinterlegt.</p>
             <form action={completeVideoStep} className={styles.skipForm}>
               <button type="submit" className={styles.skipBtn}>Video-Schritt überspringen (Admin-Ersatz)</button>
             </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
