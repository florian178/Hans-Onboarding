import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import styles from "./page.module.css"

export default async function InstructionsStep() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = session.user.id!

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

  async function confirmInstructions(formData: FormData) {
    "use server"
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const signature = formData.get("signature") as string
    if (!signature) return

    await prisma.stepProgress.upsert({
      where: { userId_stepId: { userId: session.user.id!, stepId: "instructions" } },
      create: { 
        userId: session.user.id!, 
        stepId: "instructions", 
        completed: true,
        data: JSON.stringify({ signature })
      },
      update: { 
        completed: true,
        data: JSON.stringify({ signature })
      }
    })

    redirect("/onboarding/video")
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
               <p>Aktuell sind keine Belehrungen hinterlegt.</p>
             </div>
          )}

          <div className={styles.confirmSection}>
            <form action={confirmInstructions} className={styles.form}>
              <div className={styles.checkboxWrapper}>
                <input type="checkbox" id="readConfirm" required className={styles.checkbox} defaultChecked={existingProgress?.completed} />
                <label htmlFor="readConfirm" className={styles.checkboxLabel}>
                  Ich bestätige, dass ich alle oben aufgeführten Richtlinien und Belehrungen gelesen und verstanden habe.
                </label>
              </div>

              <div className={styles.signatureWrapper}>
                <Input 
                  label="Digitale Signatur (Vor- und Nachname)" 
                  name="signature" 
                  placeholder="Max Mustermann" 
                  defaultValue={signature}
                  required 
                />
              </div>

              <div className={styles.actions}>
                <Button type="submit">{existingProgress?.completed ? 'Speichern & Weiter' : 'Bestätigen & Weiter'}</Button>
              </div>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
