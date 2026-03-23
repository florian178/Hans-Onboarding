import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { revalidatePath } from "next/cache"
import styles from "../page.module.css"

export default async function ArchiveDashboard() {
  const archivedEmployees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE', isArchived: true },
    include: { 
      onboardingStatus: true
    },
    orderBy: { createdAt: 'desc' }
  })

  async function restoreEmployee(userId: string) {
    "use server"
    console.log(`[Restore Action] Starting for userId: ${userId}`)
    try {
      const result = await prisma.user.update({
        where: { id: userId },
        data: { isArchived: false }
      })
      console.log(`[Restore Action] SUCCESS for ${result.email}`)
    } catch (error) {
      console.error(`[Restore Action] FAILED for ${userId}:`, error)
    }
    revalidatePath("/admin")
    revalidatePath("/admin/archive")
  }

  async function deleteEmployee(userId: string) {
    "use server"
    console.log(`[Delete Action] Starting for userId: ${userId}`)
    try {
      await prisma.user.delete({
        where: { id: userId }
      })
      console.log(`[Delete Action] SUCCESS for ${userId}`)
    } catch (error) {
      console.error(`[Delete Action] FAILED for ${userId}:`, error)
    }
    revalidatePath("/admin/archive")
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Dashboard / Archivierte Mitarbeiter</h1>
      </div>
      
      <div className={styles.grid} style={{ gridTemplateColumns: "1fr" }}>
        <Card className={styles.listCard}>
          <CardHeader>
            <CardTitle>Archivierte Mitarbeiter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>E-Mail</th>
                    <th>Status</th>
                    <th>Archiviert Datum</th>
                    <th>Optionen</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.name || '-'}</td>
                      <td>{emp.email}</td>
                      <td>
                        <span className={`${styles.badge} ${styles['status-' + (emp.onboardingStatus?.status || 'INVITED')]}`}>
                          {emp.onboardingStatus?.status || 'INVITED'}
                        </span>
                      </td>
                      <td>{emp.updatedAt.toLocaleDateString('de-DE')}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <form action={restoreEmployee.bind(null, emp.id)} style={{ display: 'inline' }}>
                            <Button variant="outline" size="sm" type="submit">Wiederherstellen</Button>
                          </form>
                          <form action={deleteEmployee.bind(null, emp.id)} style={{ display: 'inline' }}>
                            <Button variant="outline" size="sm" type="submit" style={{ color: '#ff3b30', borderColor: '#ff3b30' }}>Endgültig Löschen</Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {archivedEmployees.length === 0 && (
                    <tr>
                       <td colSpan={5} className={styles.empty}>Keine Mitarbeiter archiviert.</td>
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
