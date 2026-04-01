import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PDFDocument } from "pdf-lib"
import { put } from "@vercel/blob"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { blobUrl, page, userId, month, year } = body as {
      blobUrl: string
      page: number
      userId: string
      month: number
      year: number
    }

    if (!blobUrl || !page || !userId || !month || !year) {
      return NextResponse.json({ error: "Fehlende Daten" }, { status: 400 })
    }

    // Download PDF from Vercel Blob
    const pdfResponse = await fetch(blobUrl)
    if (!pdfResponse.ok) {
      return NextResponse.json({ error: "PDF konnte nicht geladen werden" }, { status: 400 })
    }
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())
    const pdfDoc = await PDFDocument.load(pdfBuffer)

    // Extract the specified page (1-indexed)
    const pageIndex = page - 1
    if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) {
      return NextResponse.json({ error: "Ungültige Seitennummer" }, { status: 400 })
    }

    const singlePageDoc = await PDFDocument.create()
    const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [pageIndex])
    singlePageDoc.addPage(copiedPage)
    const singlePageBytes = await singlePageDoc.save()
    const singlePageBuffer = Buffer.from(singlePageBytes)

    // Upload to Vercel Blob
    const filename = `payslips/${userId}_${year}_${month}_page${page}.pdf`
    const blob = await put(filename, singlePageBuffer, { access: "public" })

    // Upsert payslip record
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

    // Get employee name for response
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    return NextResponse.json({
      success: true,
      employeeName: user?.name || user?.email || "Unbekannt",
    })
  } catch (error) {
    console.error("Manual assign error:", error)
    return NextResponse.json(
      { error: "Fehler beim Zuordnen" },
      { status: 500 }
    )
  }
}
