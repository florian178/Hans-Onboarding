import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import crypto from "crypto"
import styles from "./page.module.css"

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function AdminDashboard() {
  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE', isArchived: false },
    include: { 
      onboardingStatus: true,
      documents: {
        where: { type: 'CONTRACT_SIGNED' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  async function inviteEmployee(formData: FormData) {
    "use server"
    const email = formData.get("email") as string
    const name = formData.get("name") as string
    const startDateRaw = formData.get("startDate") as string
    
    if (!email || !name) return

    const startDate = startDateRaw ? new Date(startDateRaw) : null

    let user = await prisma.user.findUnique({ where: { email } })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          role: 'EMPLOYEE',
          startDate,
          onboardingStatus: {
            create: { status: 'INVITED' }
          }
        }
      })
    } else if (!user.startDate && startDate) {
      await prisma.user.update({
        where: { id: user.id },
        data: { startDate }
      })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24)

    // Auth.js expects the token in the DB to be a SHA256 hash of (token + secret)
    const secret = process.env.AUTH_SECRET || "f33a7e583c748c8b6b1cb1dd7e0aa8b5"
    const hashedToken = crypto.createHash("sha256").update(`${token}${secret}`).digest("hex")

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires,
      }
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
    const magicLink = `${baseUrl}/api/auth/callback/resend?callbackUrl=${encodeURIComponent('/')}&token=${token}&email=${encodeURIComponent(email)}`

    // Always log for development convenience
    console.log(`\n\n[Magic Link generated]:\nTo: ${email}\nURL: ${magicLink}\n\n`)

    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: email,
          subject: "Einladung zum Onboarding",
          html: `<p>Hallo ${name},</p><p>Du wurdest in unser Onboarding-System eingeladen.</p><p><a href="${magicLink}">Klicke hier, um dein Onboarding zu starten</a></p>`,
        })
      } catch (e: unknown) {
        console.error("[Resend API Error]:", (e as Error).message)
      }
    }

    revalidatePath("/admin")
  }

  async function resetProgress(userId: string) {
    "use server"
    await prisma.stepProgress.deleteMany({ where: { userId } })
    await prisma.onboardingStatus.upsert({
      where: { userId },
      create: { userId, status: 'INVITED' },
      update: { status: 'INVITED' }
    })
    revalidatePath("/admin")
  }

  async function archiveEmployee(userId: string) {
    "use server"
    await prisma.user.update({
      where: { id: userId },
      data: { isArchived: true }
    })
    revalidatePath("/admin")
    revalidatePath("/admin/archive")
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Dashboard / Mitarbeiter</h1>
      </div>
      
      <div className={styles.grid}>
        <Card className={styles.formCard}>
          <CardHeader>
            <CardTitle>Neuen Mitarbeiter einladen</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={inviteEmployee} className={styles.form}>
              <Input label="Name" name="name" placeholder="Max Mustermann" required />
              <Input label="E-Mail" name="email" type="email" placeholder="max@beispiel.de" required />
              <Input label="Arbeitsbeginn" name="startDate" type="date" required />
              <Button type="submit">Einladung senden</Button>
            </form>
          </CardContent>
        </Card>

        <Card className={styles.listCard}>
          <CardHeader>
            <CardTitle>Mitarbeiter Übersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>E-Mail</th>
                    <th>Status</th>
                    <th>Erstellt am</th>
                    <th>Optionen</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.name || '-'}</td>
                      <td>{emp.email}</td>
                      <td>
                        <span className={`${styles.badge} ${styles['status-' + (emp.onboardingStatus?.status || 'INVITED')]}`}>
                          {emp.onboardingStatus?.status || 'INVITED'}
                        </span>
                      </td>
                      <td>{emp.createdAt.toLocaleDateString('de-DE')}</td>
                      <td>
                        <div className={styles.tableActions}>
                          {emp.documents?.length > 0 && (
                            <a href={`/admin/contracts/${emp.id}`} className={styles.actionBtn}>
                              <Button variant="outline" size="sm">Vertrag</Button>
                            </a>
                          )}
                          <form action={resetProgress.bind(null, emp.id)} style={{ display: 'inline' }}>
                            <Button variant="ghost" size="sm" type="submit" className={styles.resetBtn}>Reset</Button>
                          </form>
                          <form action={archiveEmployee.bind(null, emp.id)} style={{ display: 'inline' }}>
                            <Button variant="secondary" size="sm" type="submit">Archivieren</Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={5} className={styles.empty}>Keine Mitarbeiter gefunden.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
