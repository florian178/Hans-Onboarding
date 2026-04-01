import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { revalidatePath } from "next/cache"
import { put, del } from "@vercel/blob"
import styles from "./page.module.css"

export default async function ContentDashboard() {
  const globalDocuments = await prisma.document.findMany({
    orderBy: { uploadedAt: 'desc' },
    where: { userId: null } // Only admin templates
  })

  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE', isArchived: false },
    include: {
      documents: {
        orderBy: { uploadedAt: 'desc' }
      },
      payslips: {
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ]
      }
    },
    orderBy: { name: 'asc' }
  })

  async function uploadContent(formData: FormData) {
    "use server"
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const type = formData.get("type") as string // "CONTRACT_TEMPLATE", "INSTRUCTION", "VIDEO"
    
    if (!file || !name || !type || file.size === 0) return

    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`
    let blobUrl = ""
    
    try {
      const blob = await put(filename, file, { access: 'public' })
      blobUrl = blob.url
    } catch (e) {
      console.error("Vercel Blob Upload error", e)
      return
    }

    await prisma.document.create({
      data: {
        name,
        url: blobUrl,
        type,
      }
    })

    revalidatePath("/admin/content")
    revalidatePath("/dashboard")
    revalidatePath("/onboarding/instructions")
  }

  async function deleteContent(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    const doc = await prisma.document.findUnique({ where: { id } })
    
    if (doc) {
      // If it exists in Vercel Blob, delete the file from storage
      if (doc.url.includes("blob.vercel-storage.com")) {
        try {
          await del(doc.url)
        } catch (e) {
          console.error("Could not delete blob", e)
        }
      }
      // Delete the database entry
      await prisma.document.delete({ where: { id } })
    }
    
    revalidatePath("/admin/content")
    revalidatePath("/dashboard")
    revalidatePath("/onboarding/instructions")
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Inhalte & Dokumente</h1>
      </div>
      
      <div className={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle>Neue Vorlage hochladen</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={uploadContent} className={styles.form}>
              <Input label="Titel (z.B. Sicherheitsbelehrung)" name="name" required />
              
              <div className={styles.selectWrapper}>
                <label className={styles.label}>Dateityp</label>
                <select name="type" className={styles.select} required>
                  <option value="CONTRACT_TEMPLATE">Arbeitsvertrag (Vorlage)</option>
                  <option value="INSTRUCTION">Belehrung / Richtlinie (PDF)</option>
                  <option value="VIDEO">Einweisungs-Video (MP4)</option>
                </select>
              </div>

              <div className={styles.fileInputWrapper}>
                <label className={styles.label}>Datei (.pdf, .mp4)</label>
                <input type="file" name="file" accept=".pdf,.mp4" required className={styles.fileInput} />
              </div>

              <Button type="submit">Auf Server laden</Button>
            </form>
          </CardContent>
        </Card>

        <div className={styles.categories}>
          
          <h2 className={styles.categoryHeading}>Mitarbeiter Ordner</h2>
          <div className={styles.employeeFolders}>
             {employees.map(emp => {
               // The physical PDFs (Contract, Tax Form, etc.) are dynamically generated in the personal record.
               // We provide a quick link to the dossier, plus list all uploaded payslips.
               const totalItems = emp.payslips.length + 1; // +1 for the Dossier link
               
               return (
                 <details key={emp.id} className={styles.folder}>
                   <summary className={styles.folderSummary}>
                     <div className={styles.folderHeaderLeft}>
                       <span className={styles.folderIcon}>📁</span>
                       <strong className={styles.folderName}>{emp.name || emp.email}</strong>
                     </div>
                     <span className={styles.folderBadge}>{totalItems} Dokumente</span>
                   </summary>
                   <div className={styles.folderContent}>
                     <div className={styles.list}>
                       
                       {/* Link to Full Dossier */}
                       <div className={styles.listItem} style={{ backgroundColor: 'var(--surface-hover)' }}>
                         <div className={styles.itemInfo}>
                           <strong className={styles.docName}>Digitale Personalakte</strong>
                           <span className={styles.badge} style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>VERTRAG & FORMULARE</span>
                         </div>
                         <div className={styles.itemActions}>
                           <a href={`/admin/contracts/${emp.id}`} className={styles.link}>Akte öffnen & PDF drucken</a>
                         </div>
                       </div>

                       {/* List of Payslips */}
                       {emp.payslips.map((slip) => (
                         <div key={slip.id} className={styles.listItem}>
                           <div className={styles.itemInfo}>
                             <strong className={styles.docName}>Lohnabrechnung {String(slip.month).padStart(2, '0')}/{slip.year}</strong>
                             <span className={styles.badge}>PAYSLIP</span>
                           </div>
                           <div className={styles.itemActions}>
                             <a href={slip.url} target="_blank" rel="noreferrer" className={styles.link}>Ansehen</a>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </details>
               )
             })}
             {employees.length === 0 && <p className={styles.empty}>Keine aktiven Mitarbeiter gefunden.</p>}
          </div>

          <h2 className={styles.categoryHeading} style={{ marginTop: '1rem' }}>Von uns hochgeladene Daten</h2>
          <Card className={styles.categoryCard}>
            <CardContent className={styles.cardContentPadded}>
              <div className={styles.list}>
                {globalDocuments.map((doc) => (
                  <div key={doc.id} className={styles.listItem}>
                    <div className={styles.itemInfo}>
                      <strong className={styles.docName}>{doc.name}</strong>
                      <span className={styles.badge}>{doc.type}</span>
                    </div>
                    <div className={styles.itemActions}>
                      <a href={doc.url} target="_blank" rel="noreferrer" className={styles.link}>Ansehen</a>
                      <form action={deleteContent}>
                        <input type="hidden" name="id" value={doc.id} />
                        <Button variant="ghost" size="sm" type="submit" className={styles.deleteBtn}>Löschen</Button>
                      </form>
                    </div>
                  </div>
                ))}
                {globalDocuments.length === 0 && (
                  <p className={styles.empty}>Noch keine globalen Inhalte hochgeladen.</p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
