import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { uploadPayslip, deletePayslip } from "./actions"
import BulkPayslipUpload from "@/components/admin/BulkPayslipUpload"
import styles from "./page.module.css"

export default async function AdminPayslips() {
  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    orderBy: { name: 'asc' }
  })

  const payslips = await prisma.payslip.findMany({
    include: { user: true },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
      { user: { name: 'asc' } }
    ]
  })

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]
  const months = [
    { value: 1, label: "Januar" },
    { value: 2, label: "Februar" },
    { value: 3, label: "März" },
    { value: 4, label: "April" },
    { value: 5, label: "Mai" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Dezember" },
  ]

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Lohnzettel Management</h1>

      <BulkPayslipUpload employees={employees.map(e => ({ id: e.id, name: e.name, email: e.email }))} />

      <div className={styles.grid}>
        <Card className={styles.uploadCard}>
          <CardHeader>
            <CardTitle>Neuen Lohnzettel hochladen</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={uploadPayslip} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Mitarbeiter auswählen</label>
                <select name="userId" className={styles.select} required>
                  <option value="">-- Bitte wählen --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name || emp.email}</option>
                  ))}
                </select>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Monat</label>
                  <select name="month" className={styles.select} required defaultValue={new Date().getMonth() + 1}>
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Jahr</label>
                  <select name="year" className={styles.select} required defaultValue={currentYear}>
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Datei (PDF)</label>
                <input type="file" name="file" accept=".pdf" className={styles.fileInput} required />
              </div>

              <Button type="submit" fullWidth>Hochladen</Button>
            </form>
          </CardContent>
        </Card>

        <Card className={styles.listCard}>
          <CardHeader>
            <CardTitle>Letzte Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mitarbeiter</th>
                  <th>Zeitraum</th>
                  <th>Bereitgestellt am</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map(slip => (
                  <tr key={slip.id}>
                    <td>{slip.user.name || slip.user.email}</td>
                    <td>{months.find(m => m.value === slip.month)?.label} {slip.year}</td>
                    <td>{new Date(slip.uploadedAt).toLocaleDateString("de-DE")}</td>
                    <td>
                      <div className={styles.actions}>
                        <a href={slip.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">Anschauen</Button>
                        </a>
                        <form action={deletePayslip.bind(null, slip.id)}>
                          <Button variant="ghost" size="sm" type="submit" className={styles.deleteBtn}>Löschen</Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {payslips.length === 0 && (
                  <tr>
                    <td colSpan={4} className={styles.empty}>Noch keine Lohnzettel hochgeladen.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
