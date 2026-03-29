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
      },
      stepProgresses: {
        where: { stepId: 'advisor-sent' }
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
    
    // Generate a random 8-character password
    const rawPassword = crypto.randomBytes(4).toString("hex") // 8 characters
    const hashedPassword = crypto.createHash("sha256").update(rawPassword).digest("hex")

    if (!user) {
      user = await (prisma.user.create as any)({
        data: {
          email,
          name,
          role: 'EMPLOYEE',
          startDate,
          password: hashedPassword,
          onboardingStatus: {
            create: { status: 'INVITED' }
          }
        }
      })
    } else {
      await (prisma.user.update as any)({
        where: { id: user.id },
        data: { 
          startDate: startDate || user.startDate,
          password: hashedPassword
        }
      })
    }

    const loginUrl = "https://team.hansimclub.de"

    console.log(`\n\n[Employee Invited]:\nTo: ${email}\nPassword: ${rawPassword}\n\n`)

    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "onboarding@hansimclub.de",
          to: email,
          subject: "Willkommen im Team! Deine Einladung zum Hans im Club Onboarding",
          html: `
            <p>Hi ${name || ''},</p>
            <p>du bist willkommen im Hans im Club Team, schön dass du dabei bist.</p>
            <p>Bitte nutze diesen folgenden Link, um dich bei uns als Mitarbeiter zu registrieren:</p>
            <p><strong>E-Mail:</strong> ${email}<br/><strong>Passwort:</strong> ${rawPassword}</p>
            <p><a href="${loginUrl}/login">Hier geht's zur Registrierung / zum Login</a></p>
            <p>Viel Erfolg! Wenn du Fragen hast, melde dich bitte bei der Betriebsleiterin.</p>
          `,
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
    console.log(`[Archive Action] Starting for userId: ${userId}`)
    try {
      const result = await prisma.user.update({
        where: { id: userId },
        data: { isArchived: true }
      })
      console.log(`[Archive Action] SUCCESS for ${result.email}`)
    } catch (error) {
      console.error(`[Archive Action] FAILED for ${userId}:`, error)
    }
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
                    <th>Steuerkanzlei</th>
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
                      <td>
                        {emp.stepProgresses && emp.stepProgresses.length > 0 ? (
                          <span style={{ fontSize: '11px', backgroundColor: '#e6f4ea', color: '#137333', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                            {emp.stepProgresses[0].updatedAt.toLocaleDateString('de-DE')} {emp.stepProgresses[0].updatedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                          </span>
                        ) : (
                          <span style={{ color: '#aaa', fontSize: '12px' }}>Ausstehend</span>
                        )}
                      </td>
                      <td>{emp.createdAt.toLocaleDateString('de-DE')}</td>
                      <td>
                        <div className={styles.tableActions}>
                          {emp.documents?.length > 0 && (
                            <a href={`/admin/contracts/${emp.id}`} className={styles.actionBtn}>
                              <Button variant="outline" size="sm">Mitarbeiter-Akte</Button>
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
                      <td colSpan={6} className={styles.empty}>Keine Mitarbeiter gefunden.</td>
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
