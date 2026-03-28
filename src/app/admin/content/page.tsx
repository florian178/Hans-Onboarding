import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import styles from "./page.module.css"

export default async function ContentDashboard() {
  const documents = await prisma.document.findMany({
    orderBy: { uploadedAt: 'desc' },
    where: { userId: null } // Only admin templates
  })

  async function uploadContent(formData: FormData) {
    "use server"
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const type = formData.get("type") as string // "CONTRACT_TEMPLATE", "INSTRUCTION", "VIDEO"
    
    if (!file || !name || !type || file.size === 0) return

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
    const baseUploadDir = path.join(process.cwd(), "public/uploads")
    const filepath = path.join(baseUploadDir, filename)
    
    try {
      await mkdir(baseUploadDir, { recursive: true })
      await writeFile(filepath, buffer)
    } catch (e) {
      console.error("Upload error", e)
      return
    }

    await prisma.document.create({
      data: {
        name,
        url: `/uploads/${filename}`,
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
    await prisma.document.delete({ where: { id } })
    revalidatePath("/admin/content")
    revalidatePath("/dashboard")
    revalidatePath("/onboarding/instructions")
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Inhalte verwalten</h1>
      </div>
      
      <div className={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle>Neue Datei hochladen</CardTitle>
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

              <Button type="submit">Hochladen</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Inhalte</CardTitle>
          </CardHeader>
          <CardContent>
             <div className={styles.list}>
               {documents.map((doc) => (
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
               {documents.length === 0 && (
                 <p className={styles.empty}>Noch keine Inhalte hochgeladen.</p>
               )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
