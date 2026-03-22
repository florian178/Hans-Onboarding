"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function uploadPayslip(formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const userId = formData.get("userId") as string
  const month = parseInt(formData.get("month") as string)
  const year = parseInt(formData.get("year") as string)
  const file = formData.get("file") as File

  if (!userId || !month || !year || !file) {
    throw new Error("Fehlende Daten")
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `${userId}_${year}_${month}_${Date.now()}.pdf`
  const baseUploadDir = path.join(process.cwd(), "public", "uploads", "payslips")
  const filepath = path.join(baseUploadDir, filename)

  try {
    await mkdir(baseUploadDir, { recursive: true })
    await writeFile(filepath, buffer)
  } catch (e) {
    console.error("Payslip save error", e)
    throw new Error("Fehler beim Speichern der Datei")
  }

  await prisma.payslip.upsert({
    where: {
      userId_month_year: { userId, month, year }
    },
    update: {
      url: `/uploads/payslips/${filename}`,
      uploadedAt: new Date()
    },
    create: {
      userId,
      month,
      year,
      url: `/uploads/payslips/${filename}`
    }
  })

  revalidatePath("/admin/payslips")
}

export async function deletePayslip(id: string) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  await prisma.payslip.delete({ where: { id } })
  revalidatePath("/admin/payslips")
}
