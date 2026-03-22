import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import styles from "./page.module.css"

export default async function PersonalDataStep() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id!

  const existingProgress = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "personal-data" } }
  })

  let defaultData: Record<string, string> = {}
  if (existingProgress?.data) {
    try {
      defaultData = JSON.parse(existingProgress.data)
    } catch {
      // Ignore parse error
    }
  }

  async function saveData(formData: FormData) {
    "use server"
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const data = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      address: formData.get("address"),
      city: formData.get("city"),
      zipCode: formData.get("zipCode"),
      phone: formData.get("phone"),
      iban: formData.get("iban"),
    }

    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password && password === confirmPassword) {
      const hashedPassword = crypto.createHash("sha256").update(password).digest("hex")
      await prisma.user.update({
        where: { id: session.user.id! },
        data: { password: hashedPassword }
      })
    }

    await prisma.stepProgress.upsert({
      where: { userId_stepId: { userId: session.user.id!, stepId: "personal-data" } },
      create: {
        userId: session.user.id!,
        stepId: "personal-data",
        completed: true,
        data: JSON.stringify(data)
      },
      update: {
        completed: true,
        data: JSON.stringify(data)
      }
    })

    // Update user's global state if still INVITED
    const status = await prisma.onboardingStatus.findUnique({ where: { userId: session.user.id! } })
    if (status?.status === "INVITED") {
      await prisma.onboardingStatus.update({
        where: { userId: session.user.id! },
        data: { status: "IN_PROGRESS" }
      })
    }

    redirect("/onboarding/contract")
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Persönliche Daten</CardTitle>
        <p className={styles.description}>Bitte fülle das Stammdatenblatt vollständig aus.</p>
      </CardHeader>
      <CardContent>
        <form action={saveData} className={styles.form}>
          <div className={styles.grid}>
            <Input label="Vorname" name="firstName" defaultValue={defaultData.firstName || ""} required />
            <Input label="Nachname" name="lastName" defaultValue={defaultData.lastName || ""} required />
            <Input label="Straße & Hausnummer" name="address" defaultValue={defaultData.address || ""} required className={styles.fullWidth} />
            <Input label="PLZ" name="zipCode" defaultValue={defaultData.zipCode || ""} required />
            <Input label="Stadt" name="city" defaultValue={defaultData.city || ""} required />
            <Input label="Telefonnummer" type="tel" name="phone" defaultValue={defaultData.phone || ""} required className={styles.fullWidth} />
            <Input label="IBAN" name="iban" defaultValue={defaultData.iban || ""} required className={styles.fullWidth} />
            
            <div className={styles.passwordSection}>
              <h3 className={styles.sectionTitle}>Login-Sicherheit</h3>
              <p className={styles.sectionHint}>Lege hier dein persönliches Passwort für künftige Anmeldungen fest.</p>
              <div className={styles.passwordGrid}>
                <Input label="Neues Passwort" type="password" name="password" required />
                <Input label="Passwort bestätigen" type="password" name="confirmPassword" required />
              </div>
            </div>
          </div>
          
          <div className={styles.actions}>
            <Button type="submit">Speichern & Weiter</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
