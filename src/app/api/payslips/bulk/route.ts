import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PDFDocument } from "pdf-lib"
import { put, del } from "@vercel/blob"
import { extractText } from "unpdf"

interface AssignedResult {
  employeeName: string
  employeeId: string
  page: number
}

interface UnassignedResult {
  page: number
  textSnippet: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { blobUrl, month, year } = body as {
      blobUrl: string
      month: number
      year: number
    }

    if (!blobUrl || !month || !year) {
      return NextResponse.json({ error: "Fehlende Daten" }, { status: 400 })
    }

    // Download the PDF from Vercel Blob
    const pdfResponse = await fetch(blobUrl)
    if (!pdfResponse.ok) {
      return NextResponse.json({ error: "PDF konnte nicht geladen werden" }, { status: 400 })
    }
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())

    // Use pdf-lib for splitting pages
    const pdfLibDoc = await PDFDocument.load(pdfBuffer)
    const pageCount = pdfLibDoc.getPageCount()

    // Use unpdf for serverless-safe text extraction (per page)
    const { text: pageTexts } = await extractText(new Uint8Array(pdfBuffer), {
      mergePages: false,
    })

    // Get all employees from DB
    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE", isArchived: false },
      select: { id: true, name: true, email: true },
    })

    const assigned: AssignedResult[] = []
    const unassigned: UnassignedResult[] = []

    for (let i = 0; i < pageCount; i++) {
      const pageText = pageTexts[i] || ""

      // Create single-page PDF
      const singlePageDoc = await PDFDocument.create()
      const [copiedPage] = await singlePageDoc.copyPages(pdfLibDoc, [i])
      singlePageDoc.addPage(copiedPage)
      const singlePageBytes = await singlePageDoc.save()
      const singlePageBuffer = Buffer.from(singlePageBytes)

      // Try to match employee name in text
      let matchedEmployee: { id: string; name: string | null; email: string | null } | null = null

      for (const emp of employees) {
        if (!emp.name) continue
        const nameParts = emp.name.trim().split(/\s+/)
        const allPartsFound = nameParts.every((part) =>
          pageText.toLowerCase().includes(part.toLowerCase())
        )
        if (allPartsFound) {
          matchedEmployee = emp
          break
        }
      }

      if (matchedEmployee) {
        // Upload single-page PDF to Vercel Blob
        const filename = `payslips/${matchedEmployee.id}_${year}_${month}_page${i + 1}.pdf`
        const blob = await put(filename, singlePageBuffer, { access: "public" })

        // Upsert payslip record
        await prisma.payslip.upsert({
          where: {
            userId_month_year: {
              userId: matchedEmployee.id,
              month,
              year,
            },
          },
          update: {
            url: blob.url,
            uploadedAt: new Date(),
          },
          create: {
            userId: matchedEmployee.id,
            month,
            year,
            url: blob.url,
          },
        })

        assigned.push({
          employeeName: matchedEmployee.name || matchedEmployee.email || "Unbekannt",
          employeeId: matchedEmployee.id,
          page: i + 1,
        })
      } else {
        const snippet = pageText.substring(0, 200).replace(/\s+/g, " ").trim()
        unassigned.push({
          page: i + 1,
          textSnippet: snippet || "(Kein Text erkannt)",
        })
      }
    }

    // Clean up the temporary bulk PDF from Blob
    try {
      await del(blobUrl)
    } catch {
      // Non-critical: the temp file will remain but isn't used
    }

    return NextResponse.json({ assigned, unassigned, totalPages: pageCount })
  } catch (error) {
    console.error("Bulk payslip error:", error)
    return NextResponse.json(
      { error: "Fehler beim Verarbeiten der PDF" },
      { status: 500 }
    )
  }
}
