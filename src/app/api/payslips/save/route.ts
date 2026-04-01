import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const month = parseInt(formData.get("month") as string)
    const year = parseInt(formData.get("year") as string)

    if (!file || !userId || !month || !year) {
      return NextResponse.json({ error: "Fehlende Daten" }, { status: 400 })
    }

    // Single-page PDFs are small (< 200KB), well within Vercel's limit
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `payslips/${userId}_${year}_${month}_${Date.now()}.pdf`
    const blob = await put(filename, buffer, { 
      access: "public",
      contentType: "application/pdf"
    })

    await prisma.payslip.upsert({
      where: {
        userId_month_year: { userId, month, year },
      },
      update: {
        url: blob.url,
        uploadedAt: new Date(),
      },
      create: {
        userId,
        month,
        year,
        url: blob.url,
      },
    })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    return NextResponse.json({
      success: true,
      employeeName: user?.name || user?.email || "Unbekannt",
    })
  } catch (error) {
    console.error("Save payslip error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
    return NextResponse.json(
      { error: `Fehler beim Speichern: ${errorMessage}` },
      { status: 500 }
    )
  }
}
